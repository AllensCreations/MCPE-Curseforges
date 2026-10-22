#!/usr/bin/env python3
"""Import a base64-encoded ZIP of a OneBlock add-on into MCPEDL/maps/<Map-Name>/.

Everything is validated BEFORE anything is written. These are structural checks
only: they prove the files are well-formed, never that the add-on works in
Minecraft. World foundations come from Mcpeworlds/ at build time; this script
rejects any payload that carries world data (db/, level.dat, .mcworld).

Usage:
  python scripts/import_oneblock_payload.py --map My-Map [--overwrite]
      [--payload-file MCPEDL/incoming/my-map.b64]
The payload is read from --payload-file, or else from env ONEBLOCK_PAYLOAD.
"""
from __future__ import annotations

import argparse
import base64
import binascii
import io
import json
import os
import re
import shutil
import stat
import sys
import zipfile
from pathlib import Path, PurePosixPath

ROOT = Path(__file__).resolve().parents[1]
MAPS_ROOT = ROOT / "MCPEDL" / "maps"
INCOMING = ROOT / "MCPEDL" / "incoming"

NAME_RE = re.compile(r"^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$")
TITLE_RE = re.compile(r"^.+ \(v(\d+)\.(\d+)\.(\d+)\)$")
UUID_RE = re.compile(r"^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$")
ATTRIBUTION = "by AllensCreations"

MAX_FILES = 500
MAX_FILE_BYTES = 5 * 1024 * 1024
MAX_TOTAL_BYTES = 25 * 1024 * 1024
ALLOWED_EXT = {
    ".json", ".js", ".mcfunction", ".md", ".txt", ".lang",
    ".png", ".jpg", ".jpeg", ".tga", ".ogg",
}
BLOCKED_SUFFIX = (".mcworld", ".mcpack", ".mcaddon", ".zip")

# The current builder requires "void_cleaner" as the first tick.json entry
# (see scripts/build_oneblock_variants_from_template.py). Set to False if the
# builder stops enforcing this.
REQUIRE_VOID_CLEANER_FIRST = True

errors: list[str] = []
warnings: list[str] = []


def err(msg: str) -> None:
    errors.append(msg)


def warn(msg: str) -> None:
    warnings.append(msg)


def read_payload(payload_file: str | None) -> str:
    if payload_file:
        path = (ROOT / payload_file).resolve()
        try:
            path.relative_to(INCOMING.resolve())
        except ValueError:
            sys.exit(f"--payload-file must be inside MCPEDL/incoming/ (got {payload_file})")
        if not path.is_file():
            sys.exit(f"Payload file not found: {payload_file}")
        text = path.read_text(encoding="utf-8")
    else:
        text = os.environ.get("ONEBLOCK_PAYLOAD", "")
    text = re.sub(r"\s+", "", text)
    if not text:
        sys.exit("Empty payload. Provide base64 text or a payload file.")
    return text


def decode_zip(b64: str) -> zipfile.ZipFile:
    try:
        raw = base64.b64decode(b64, validate=True)
    except (binascii.Error, ValueError) as exc:
        sys.exit(f"Payload is not valid base64: {exc}")
    if not zipfile.is_zipfile(io.BytesIO(raw)):
        sys.exit("Decoded payload is not a ZIP archive.")
    return zipfile.ZipFile(io.BytesIO(raw))


def collect_files(z: zipfile.ZipFile) -> dict[str, bytes]:
    infos = [i for i in z.infolist() if not i.filename.endswith("/")]
    if not infos:
        sys.exit("ZIP contains no files.")
    if len(infos) > MAX_FILES:
        sys.exit(f"ZIP has {len(infos)} files (max {MAX_FILES}).")

    names: list[str] = []
    for info in infos:
        name = info.filename
        parts = PurePosixPath(name).parts
        if "\\" in name or name.startswith("/") or ".." in parts or any(":" in p for p in parts):
            err(f"Unsafe path in ZIP: {name!r}")
        if stat.S_ISLNK(info.external_attr >> 16):
            err(f"Symlink not allowed: {name!r}")
        names.append(name)

    # Strip one common top-level folder if oneblock.json is not at the root.
    prefix = ""
    if "oneblock.json" not in names:
        tops = {PurePosixPath(n).parts[0] for n in names}
        if len(tops) == 1 and all(len(PurePosixPath(n).parts) > 1 for n in names):
            prefix = next(iter(tops)) + "/"

    files: dict[str, bytes] = {}
    total = 0
    for info in infos:
        rel = info.filename[len(prefix):] if prefix and info.filename.startswith(prefix) else info.filename
        if info.file_size > MAX_FILE_BYTES:
            err(f"File too large: {rel} ({info.file_size} bytes)")
            continue
        data = z.read(info)
        total += len(data)
        files[rel] = data
    if total > MAX_TOTAL_BYTES:
        err(f"Total uncompressed size {total} exceeds {MAX_TOTAL_BYTES} bytes.")
    return files


def check_paths(files: dict[str, bytes]) -> None:
    for rel in files:
        low = rel.lower()
        parts = PurePosixPath(low).parts
        if low.endswith(BLOCKED_SUFFIX):
            err(f"Nested archive/world file not allowed: {rel}")
        if "db" in parts or parts[-1] == "level.dat":
            err(f"World data must not be included (database-free design): {rel}")
        if PurePosixPath(low).suffix not in ALLOWED_EXT:
            err(f"File type not allowed: {rel}")
        if parts[-1] in ("world_behavior_packs.json", "world_resource_packs.json"):
            err(f"Do not ship world pack link files; the builder writes them: {rel}")


def load_json(files: dict[str, bytes], rel: str, required: bool = True):
    if rel not in files:
        if required:
            err(f"Missing required file: {rel}")
        return None
    try:
        return json.loads(files[rel].decode("utf-8-sig"))
    except (ValueError, UnicodeDecodeError) as exc:
        err(f"{rel} is not valid JSON: {exc}")
        return None


def check_manifest(manifest: dict, label: str):
    """Returns (uuid, version_list) or (None, None) after recording errors."""
    header = manifest.get("header") or {}
    uuid = header.get("uuid")
    version = header.get("version")
    name = header.get("name", "")
    desc = header.get("description", "")

    if not isinstance(uuid, str) or not UUID_RE.match(uuid):
        err(f"{label}: header.uuid missing or malformed")
    if not (isinstance(version, list) and len(version) == 3 and all(isinstance(v, int) for v in version)):
        err(f"{label}: header.version must be [major, minor, patch]")
        version = None
    m = TITLE_RE.match(name) if isinstance(name, str) else None
    if not m:
        err(f"{label}: header.name must end with one '(vX.Y.Z)' suffix, e.g. 'Add-on Name (v1.0.0)'")
    elif version and [int(x) for x in m.groups()] != version:
        err(f"{label}: title version {m.group(0)[-8:]} does not match header.version {version}")
    elif name.count("(v") != 1:
        err(f"{label}: header.name has a duplicated version suffix")
    if not isinstance(desc, str) or desc.count(ATTRIBUTION) != 1:
        err(f"{label}: header.description must contain '{ATTRIBUTION}' exactly once")
    if not manifest.get("modules"):
        err(f"{label}: manifest has no modules")
    return uuid, version


def check_dependencies(bp: dict, rp_uuid: str | None) -> None:
    deps = bp.get("dependencies") or []
    dep_uuids = set()
    for dep in deps:
        if "uuid" in dep:
            dep_uuids.add(dep["uuid"])
        ver = str(dep.get("version", ""))
        if any(tag in ver.lower() for tag in ("beta", "rc", "preview")):
            warn(f"Preview/beta dependency {dep.get('module_name', dep.get('uuid'))} "
                 f"{ver}: allowed only if a requested feature requires it; say so in the README.")
    if rp_uuid and rp_uuid not in dep_uuids:
        err("behavior_pack manifest does not list the resource pack header.uuid in dependencies")


def check_tick(files: dict[str, bytes]) -> None:
    tick = load_json(files, "behavior_pack/functions/tick.json")
    if not tick:
        return
    values = tick.get("values")
    if not isinstance(values, list) or not values:
        err("tick.json needs a non-empty 'values' list")
        return
    if REQUIRE_VOID_CLEANER_FIRST and values[0] != "void_cleaner":
        err("tick.json: the first entry must be 'void_cleaner' (builder requirement)")
    for v in values:
        if f"behavior_pack/functions/{v}.mcfunction" not in files:
            err(f"tick.json names '{v}' but behavior_pack/functions/{v}.mcfunction is missing")


def validate(files: dict[str, bytes]) -> None:
    check_paths(files)

    cfg = load_json(files, "oneblock.json")
    if isinstance(cfg, dict):
        if not isinstance(cfg.get("name"), str) or not cfg["name"].strip():
            err("oneblock.json needs a non-empty string 'name'")
        if cfg.get("enabled", True) is not True:
            warn("oneblock.json has enabled != true: the builder will skip this map")
    elif cfg is not None:
        err("oneblock.json must be a JSON object")

    bp = load_json(files, "behavior_pack/manifest.json")
    rp = load_json(files, "resource_pack/manifest.json", required=False)
    bp_uuid = bp_ver = rp_uuid = rp_ver = None
    if bp:
        bp_uuid, bp_ver = check_manifest(bp, "behavior_pack")
    if rp:
        rp_uuid, rp_ver = check_manifest(rp, "resource_pack")
    if bp_uuid and rp_uuid and bp_uuid.lower() == rp_uuid.lower():
        err("behavior_pack and resource_pack share the same header.uuid")
    if bp_ver and rp_ver and bp_ver != rp_ver:
        err(f"behavior_pack version {bp_ver} and resource_pack version {rp_ver} must match")
    if bp:
        check_dependencies(bp, rp_uuid)

    check_tick(files)

    for rel, data in files.items():
        if rel.startswith("behavior_pack/recipes/") and rel.endswith(".json"):
            if b"AlwaysUnlocked" not in data:
                err(f"{rel}: recipe is missing the AlwaysUnlocked unlock context")
        elif rel.endswith(".json") and rel not in (
            "oneblock.json", "behavior_pack/manifest.json",
            "resource_pack/manifest.json", "behavior_pack/functions/tick.json",
        ):
            try:
                json.loads(data.decode("utf-8-sig"))
            except (ValueError, UnicodeDecodeError):
                warn(f"{rel}: not strict JSON (comments are tolerated by Minecraft; check manually)")


def place(files: dict[str, bytes], map_name: str, overwrite: bool) -> Path:
    dest = MAPS_ROOT / map_name
    if dest.exists():
        if not overwrite:
            sys.exit(f"{dest.relative_to(ROOT)} already exists. Re-run with overwrite enabled to replace it.")
    MAPS_ROOT.mkdir(parents=True, exist_ok=True)
    staging = MAPS_ROOT / (map_name + ".importing")
    if staging.exists():
        shutil.rmtree(staging)
    for rel, data in files.items():
        target = staging / rel
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    if dest.exists():
        shutil.rmtree(dest)  # replace the whole folder so no stale files remain
    staging.rename(dest)
    return dest


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--map", required=True, help="Folder name under MCPEDL/maps/")
    ap.add_argument("--overwrite", action="store_true")
    ap.add_argument("--payload-file", help="Path under MCPEDL/incoming/ (else env ONEBLOCK_PAYLOAD)")
    args = ap.parse_args()

    if not NAME_RE.match(args.map):
        sys.exit("Map name: 1-64 chars, letters/numbers/. _ - only, starting with a letter or number.")

    z = decode_zip(read_payload(args.payload_file))
    files = collect_files(z)
    validate(files)

    for w in warnings:
        print(f"::warning::{w}")
    if errors:
        for e in errors:
            print(f"::error::{e}")
        sys.exit(f"Import rejected: {len(errors)} error(s). Nothing was written.")

    dest = place(files, args.map, args.overwrite)
    print(f"Imported {len(files)} file(s) into {dest.relative_to(ROOT)}")
    print("Structural validation passed. This does not prove the add-on works in Minecraft.")


if __name__ == "__main__":
    main()
