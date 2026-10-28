#!/usr/bin/env python3
"""Import a base64 ZIP produced by an AI agent into the repository.

Supports three project types, read from project.json inside the payload:
  addon  -> MCPEDL/new_addons/<Name>/   (LOCK markers are written here)
  map    -> MCPEDL/maps/<Name>/         (OneBlock; oneblock.json is written here)
  script -> MCPEDL/script/<Name>/       (test_world.json describes the test world)

Modes (--mode):
  create    new project only; fails if the name already exists anywhere under MCPEDL/ (default)
  update    merge the payload into the existing project (addons/ or new_addons/ for add-ons).
            Files that are not in the payload (icons, images, LOCK) are kept; nothing is deleted.
            Pack and module UUIDs must match the existing ones and the pack version must be higher.
  overwrite replace the whole project folder with the payload (the old --overwrite flag)

Everything is validated BEFORE anything is written, using the same run_checks() the agent ran
(scripts/build_payload.py). Structural checks only: they never prove it works in Minecraft.
A legacy payload with only oneblock.json and no project.json is treated as a map.

Usage:
  python scripts/import_project_payload.py --name My-Project [--mode create|update|overwrite]
      [--payload-file MCPEDL/incoming/my-project.b64] [--root DIR] [--github-output FILE]
The payload is read from --payload-file, or else from env PROJECT_PAYLOAD (or ONEBLOCK_PAYLOAD).
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
import tempfile
import zipfile
from pathlib import Path, PurePosixPath

sys.path.insert(0, str(Path(__file__).resolve().parent))
import build_payload as bp  # noqa: E402  (single source of truth for the checks)

DEST = bp.DEST_DIR
ALL_DIRS = ("addons", "new_addons", "maps", "script")
COMPAT = {"addon": ("addons", "new_addons"), "map": ("maps",), "script": ("script",)}
MODES = ("create", "update", "overwrite")
PACKS = ("behavior_pack", "resource_pack")
MAX_B64 = 36_000_000
CONTROL = re.compile(r"[\x00-\x1f\x7f]")
LOCK_ROOT = ("AllensCreations Add-on Lock v1\n\nRequired repository marker for build validation.\n"
             "This marker does not encrypt source files or prevent extraction of distributable packages.\n")
LOCK_PACK = ("AllensCreations Add-on Lock v1\n\nPack marker included in the exported Minecraft Bedrock pack.\n"
             "This marker does not encrypt the pack or prevent extraction or editing.\n")


def fail(msg: str) -> None:
    sys.exit(msg)


def read_payload(root: Path, payload_file: str | None) -> str:
    if payload_file:
        incoming = (root / "MCPEDL" / "incoming").resolve()
        path = (root / payload_file).resolve()
        try:
            path.relative_to(incoming)
        except ValueError:
            fail(f"--payload-file must be inside MCPEDL/incoming/ (got {payload_file})")
        if not path.is_file():
            fail(f"Payload file not found: {payload_file}")
        text = path.read_text(encoding="utf-8")
    else:
        text = os.environ.get("PROJECT_PAYLOAD") or os.environ.get("ONEBLOCK_PAYLOAD", "")
    text = re.sub(r"\s+", "", text)
    if not text:
        fail("Empty payload. Provide base64 text or a payload file.")
    if len(text) > MAX_B64:
        fail(f"Payload is {len(text)} base64 characters (max {MAX_B64}).")
    return text


def decode_zip(b64: str) -> zipfile.ZipFile:
    try:
        raw = base64.b64decode(b64, validate=True)
    except (binascii.Error, ValueError) as exc:
        fail(f"Payload is not valid base64: {exc}")
    if not zipfile.is_zipfile(io.BytesIO(raw)):
        fail("Decoded payload is not a ZIP archive.")
    return zipfile.ZipFile(io.BytesIO(raw))


def collect_files(z: zipfile.ZipFile, errors: list[str]) -> dict[str, bytes]:
    infos = [i for i in z.infolist() if not i.filename.endswith("/")]
    if not infos:
        fail("ZIP contains no files.")
    if len(infos) > bp.MAX_FILES:
        fail(f"ZIP has {len(infos)} files (max {bp.MAX_FILES}).")
    declared = sum(i.file_size for i in infos)
    if declared > bp.MAX_TOTAL:
        fail(f"Declared uncompressed size {declared} exceeds {bp.MAX_TOTAL} bytes. Nothing was read.")
    names, seen = [], {}
    for info in infos:
        name = info.filename
        parts = PurePosixPath(name).parts
        if "\\" in name or name.startswith("/") or ".." in parts or any(":" in p for p in parts) or CONTROL.search(name):
            errors.append(f"Unsafe path in ZIP: {name!r}")
        if stat.S_ISLNK(info.external_attr >> 16):
            errors.append(f"Symlink not allowed: {name!r}")
        key = name.lower()
        if key in seen:
            errors.append(f"Duplicate or case-colliding ZIP entry: {name!r} and {seen[key]!r}")
        seen[key] = name
        names.append(name)
    prefix = ""
    if "project.json" not in names and "oneblock.json" not in names:
        tops = {PurePosixPath(n).parts[0] for n in names}
        if len(tops) == 1 and all(len(PurePosixPath(n).parts) > 1 for n in names):
            prefix = next(iter(tops)) + "/"
    files: dict[str, bytes] = {}
    total = 0
    for info in infos:
        rel = info.filename[len(prefix):] if prefix else info.filename
        if info.file_size > bp.MAX_FILE:
            errors.append(f"File too large: {rel} ({info.file_size} bytes)")
            continue
        with z.open(info) as fh:
            data = fh.read(bp.MAX_FILE + 1)
        if len(data) > bp.MAX_FILE:
            errors.append(f"File too large: {rel} (more than {bp.MAX_FILE} bytes)")
            continue
        total += len(data)
        if total > bp.MAX_TOTAL:
            fail(f"Total uncompressed size exceeds {bp.MAX_TOTAL} bytes. Stopped reading.")
        files[rel] = data
    return files


def legacy_to_project(files: dict[str, bytes], errors: list[str]) -> None:
    """Old payloads had only oneblock.json: treat them as maps."""
    if "project.json" in files or "oneblock.json" not in files:
        return
    try:
        cfg = json.loads(files["oneblock.json"].decode("utf-8-sig"))
        files["project.json"] = (json.dumps({"type": "map", "name": cfg["name"]}, indent=2) + "\n").encode()
        print("::warning::Legacy payload (oneblock.json only): treated as type 'map'.")
    except (ValueError, KeyError, UnicodeDecodeError):
        errors.append("oneblock.json is not valid JSON with a 'name'")


def find_projects(root: Path, name: str) -> tuple[list[tuple[str, Path]], list[tuple[str, Path]]]:
    """Return (exact-name matches, same-name-different-case matches) across every MCPEDL project folder."""
    exact, loose = [], []
    for d in ALL_DIRS:
        folder = root / "MCPEDL" / d
        if not folder.is_dir():
            continue
        for c in sorted(folder.iterdir()):
            if not c.is_dir() or c.name.endswith(".importing"):
                continue
            if c.name == name:
                exact.append((d, c))
            elif c.name.lower() == name.lower():
                loose.append((d, c))
    return exact, loose


def read_manifest(path: Path) -> dict | None:
    try:
        return json.loads(path.read_text(encoding="utf-8-sig"))
    except (OSError, ValueError):
        return None


def check_identity(stage: Path, dest: Path, mode: str, errors: list[str], warns: list[str]) -> None:
    """update: UUIDs must match and the version must go up. overwrite: only warn about changed UUIDs."""
    strict = mode == "update"
    for label in PACKS:
        new = read_manifest(stage / label / "manifest.json")
        old = read_manifest(dest / label / "manifest.json")
        if old and not new:
            warns.append(f"{label} exists in the project but not in the payload: it is kept as is" if strict
                         else f"{label} exists in the project but not in the payload: it will be deleted")
            continue
        if not (new and old):
            continue
        nh, oh = new.get("header") or {}, old.get("header") or {}
        n_mods = {m.get("uuid") for m in new.get("modules") or []}
        o_mods = {m.get("uuid") for m in old.get("modules") or []}
        if nh.get("uuid") != oh.get("uuid") or n_mods != o_mods:
            msg = (f"{label}: pack or module UUIDs differ from the existing project. Worlds that already use the pack "
                   "would treat it as a different pack. Keep the existing UUIDs.")
            (errors if strict else warns).append(msg)
        if strict:
            nv, ov = nh.get("version"), oh.get("version")
            if isinstance(nv, list) and isinstance(ov, list) and tuple(nv) <= tuple(ov):
                errors.append(f"{label}: version {'.'.join(map(str, nv))} is not higher than the existing "
                              f"{'.'.join(map(str, ov))}. Bump the version before updating.")


def merge_into(stage: Path, dest: Path, ptype: str) -> tuple[list[str], list[str], int, int]:
    """Copy payload files over the existing project. Never deletes. Returns added, changed, unchanged, kept."""
    staged = {p.relative_to(stage).as_posix(): p for p in stage.rglob("*") if p.is_file()}
    kept = sum(1 for p in dest.rglob("*") if p.is_file() and p.relative_to(dest).as_posix() not in staged)
    added, changed, same = [], [], 0
    for rel, p in sorted(staged.items()):
        target = dest / rel
        if ptype == "addon" and PurePosixPath(rel).name == "LOCK" and target.exists():
            same += 1
            continue
        data = p.read_bytes()
        if target.exists():
            if target.read_bytes() == data:
                same += 1
                continue
            changed.append(rel)
        else:
            added.append(rel)
        target.parent.mkdir(parents=True, exist_ok=True)
        target.write_bytes(data)
    return added, changed, same, kept


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--name", "--map", dest="name", required=True, help="Folder name for the project")
    ap.add_argument("--mode", choices=MODES, help="create (default), update, or overwrite")
    ap.add_argument("--overwrite", action="store_true", help="Same as --mode overwrite (kept for older callers)")
    ap.add_argument("--payload-file")
    ap.add_argument("--root", default=str(Path(__file__).resolve().parents[1]))
    ap.add_argument("--github-output")
    args = ap.parse_args()
    mode = args.mode or ("overwrite" if args.overwrite else "create")
    root = Path(args.root).resolve()
    if not bp.NAME_RE.match(args.name):
        fail("Name: 1-64 chars, letters/numbers/. _ - only, starting with a letter or number.")

    errors: list[str] = []
    files = collect_files(decode_zip(read_payload(root, args.payload_file)), errors)
    legacy_to_project(files, errors)

    with tempfile.TemporaryDirectory(prefix="payload-") as tmp:
        stage = Path(tmp) / "p"
        stage.mkdir()
        for rel, data in files.items():
            if ".." in PurePosixPath(rel).parts or rel.startswith("/"):
                continue  # already reported
            t = stage / rel
            t.parent.mkdir(parents=True, exist_ok=True)
            t.write_bytes(data)
        fails, warns, _, _ = bp.run_checks(stage, repo_root=root, folder=args.name)
        pj = bp.read_project(stage) or {}
        ptype = pj.get("type")
        if ptype not in bp.TYPES:
            for e in sorted(set(errors + [f for f in fails if f])):
                print(f"::error::{e}")
            fail("Import rejected: project.json type must be addon, map, or script. Nothing was written.")

        exact, loose = find_projects(root, args.name)
        compat = [(d, c) for d, c in exact if d in COMPAT[ptype]]
        foreign = [(d, c) for d, c in exact if d not in COMPAT[ptype]]
        existing: Path | None = None
        if mode == "create":
            if exact or loose:
                fail("Name clash: " + ", ".join(f"MCPEDL/{d}/{c.name}" for d, c in exact + loose)
                     + " already exists. Use import_mode update to change it, overwrite to replace it, or pick another name.")
        else:
            if len(compat) > 1:
                fail("Ambiguous: " + ", ".join(f"MCPEDL/{d}/{c.name}" for d, c in compat)
                     + " all exist. Remove the duplicate first.")
            if compat:
                existing = compat[0][1]
            if mode == "update":
                if loose:
                    fail("Name differs only by letter case from " + ", ".join(f"MCPEDL/{d}/{c.name}" for d, c in loose)
                         + ". Use the exact folder name.")
                if existing is None:
                    where = (" It exists as another project type: "
                             + ", ".join(f"MCPEDL/{d}/{c.name}" for d, c in foreign)) if foreign else ""
                    fail(f"Nothing to update: no {ptype} named {args.name} under MCPEDL/." + where + " Use import_mode create for a new project.")
            else:
                for d, c in foreign + loose:
                    print(f"::warning::overwrite enabled: MCPEDL/{d}/{c.name} also exists and is left untouched")

        dest = existing if existing is not None else root / "MCPEDL" / DEST[ptype] / args.name
        if existing is not None:
            own = f"MCPEDL/{existing.parent.name}/{existing.name}:"
            fails = [f for f in fails if f and not (f.startswith("UUID ") and "is already used by " + own in f)]
        errors += [f for f in fails if f]
        if existing is not None:
            check_identity(stage, existing, mode, errors, warns)
        for w in sorted(set(warns)):
            print(f"::warning::{w}")
        if errors:
            for e in sorted(set(errors)):
                print(f"::error::{e}")
            fail(f"Import rejected: {len(set(errors))} error(s). Nothing was written.")

        if ptype == "map":
            (stage / "oneblock.json").write_text(
                json.dumps({"enabled": True, "name": pj["name"]}, indent=2) + "\n", encoding="utf-8")
        if ptype == "addon":
            (stage / "LOCK").write_text(LOCK_ROOT, encoding="utf-8", newline="\n")
            for pack in PACKS:
                if (stage / pack / "manifest.json").is_file():
                    (stage / pack / "LOCK").write_text(LOCK_PACK, encoding="utf-8", newline="\n")

        if mode == "update":
            added, changed, same, kept = merge_into(stage, dest, ptype)
            print(f"Update of {dest.relative_to(root)}: {len(added)} added, {len(changed)} changed, "
                  f"{same} unchanged, {kept} existing file(s) kept (not in the payload, not deleted).")
            for rel in added:
                print(f"  added    {rel}")
            for rel in changed:
                print(f"  changed  {rel}")
        else:
            if dest.exists():
                old_files = sorted(p.relative_to(dest).as_posix() for p in dest.rglob("*") if p.is_file())
                print(f"::warning::overwrite will delete {len(old_files)} existing file(s) in {dest.relative_to(root)}: "
                      + ", ".join(old_files[:20]) + (" ..." if len(old_files) > 20 else ""))
            dest.parent.mkdir(parents=True, exist_ok=True)
            staging = dest.parent / (args.name + ".importing")
            if staging.exists():
                shutil.rmtree(staging)
            shutil.copytree(stage, staging)
            if dest.exists():
                shutil.rmtree(dest)  # replace the whole folder so no stale files remain
            staging.rename(dest)

    has_tw = (dest / "test_world.json").is_file() and ptype != "map"
    print(f"Imported {len(files)} file(s) as {ptype} into {dest.relative_to(root)} (mode: {mode})")
    print("Structural validation passed. This does not prove it works in Minecraft.")
    if args.github_output:
        with open(args.github_output, "a", encoding="utf-8") as fh:
            fh.write(f"type={ptype}\ndest={dest.relative_to(root).as_posix()}\nname={args.name}\n"
                     f"mode={mode}\nhas_test_world={'true' if has_tw else 'false'}\n")


if __name__ == "__main__":
    main()
