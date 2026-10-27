#!/usr/bin/env python3
"""Import a base64 ZIP produced by an AI agent into the repository.

Supports three project types, read from project.json inside the payload:
  addon  -> MCPEDL/new_addons/<Name>/   (LOCK markers are written here)
  map    -> MCPEDL/maps/<Name>/         (OneBlock; oneblock.json is written here)
  script -> MCPEDL/script/<Name>/       (test_world.json describes the test world)

Everything is validated BEFORE anything is written, using the same run_checks() the agent ran
(scripts/build_payload.py). Structural checks only: they never prove it works in Minecraft.
A legacy payload with only oneblock.json and no project.json is treated as a map.

Usage:
  python scripts/import_project_payload.py --name My-Project [--overwrite]
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


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--name", "--map", dest="name", required=True, help="Folder name for the project")
    ap.add_argument("--overwrite", action="store_true")
    ap.add_argument("--payload-file")
    ap.add_argument("--root", default=str(Path(__file__).resolve().parents[1]))
    ap.add_argument("--github-output")
    args = ap.parse_args()
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
        errors += [f for f in fails if f]
        pj = bp.read_project(stage) or {}
        ptype = pj.get("type")
        for w in sorted(set(warns)):
            print(f"::warning::{w}")
        if errors or ptype not in bp.TYPES:
            for e in sorted(set(errors)):
                print(f"::error::{e}")
            fail(f"Import rejected: {len(set(errors))} error(s). Nothing was written.")

        base = root / "MCPEDL" / DEST[ptype]
        dest = base / args.name
        clashes = []
        for other_type, other in DEST.items():
            d = root / "MCPEDL" / other
            if d.is_dir():
                clashes += [(other, c.name) for c in d.iterdir()
                            if c.is_dir() and c.name.lower() == args.name.lower() and not (other_type == ptype and c.name == args.name)]
        if dest.exists() and not args.overwrite:
            fail(f"{dest.relative_to(root)} already exists. Re-run with overwrite enabled to replace it.")
        if clashes and not args.overwrite:
            fail("Name clash: " + ", ".join(f"MCPEDL/{o}/{n}" for o, n in clashes)
                 + " already exists (another project type or different letter case). Pick another name, or enable overwrite if the clash is intended.")
        for o, n in clashes:
            print(f"::warning::overwrite enabled: MCPEDL/{o}/{n} also exists and is left untouched")
        if dest.exists():
            old_files = sorted(p.relative_to(dest).as_posix() for p in dest.rglob("*") if p.is_file())
            print(f"::warning::overwrite will delete {len(old_files)} existing file(s) in {dest.relative_to(root)}: "
                  + ", ".join(old_files[:20]) + (" ..." if len(old_files) > 20 else ""))
        if ptype == "map":
            (stage / "oneblock.json").write_text(
                json.dumps({"enabled": True, "name": pj["name"]}, indent=2) + "\n", encoding="utf-8")
        if ptype == "addon":
            (stage / "LOCK").write_text(LOCK_ROOT, encoding="utf-8", newline="\n")
            for pack in ("behavior_pack", "resource_pack"):
                if (stage / pack / "manifest.json").is_file():
                    (stage / pack / "LOCK").write_text(LOCK_PACK, encoding="utf-8", newline="\n")

        base.mkdir(parents=True, exist_ok=True)
        staging = base / (args.name + ".importing")
        if staging.exists():
            shutil.rmtree(staging)
        shutil.copytree(stage, staging)
        if dest.exists():
            shutil.rmtree(dest)  # replace the whole folder so no stale files remain
        staging.rename(dest)

    has_tw = (dest / "test_world.json").is_file() and ptype != "map"
    print(f"Imported {len(files)} file(s) as {ptype} into {dest.relative_to(root)}")
    print("Structural validation passed. This does not prove it works in Minecraft.")
    if args.github_output:
        with open(args.github_output, "a", encoding="utf-8") as fh:
            fh.write(f"type={ptype}\ndest={dest.relative_to(root).as_posix()}\nname={args.name}\nhas_test_world={'true' if has_tw else 'false'}\n")


if __name__ == "__main__":
    main()
