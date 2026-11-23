#!/usr/bin/env python3
"""Sync Oneblock_Progression.js from Mcpeworlds/Progression/ into all OneBlock map packages.

Copies Mcpeworlds/Progression/Oneblock_Progression.js into:
  MCPEDL/Maps/<Map>/behavior_pack/scripts/lib/Oneblock_Progression.js
for every OneBlock map (packs under MCPEDL/Maps/ with a oneblock.json or oneblock in their name).
Also updates world/behavior_packs/*/scripts/lib/Oneblock_Progression.js if present.

Usage:
  python3 scripts/sync_oneblock_progression.py [--check] [--root DIR]
"""
import argparse
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE_REL = Path("Mcpeworlds/Progression/Oneblock_Progression.js")


def is_oneblock_map(folder: Path) -> bool:
    if not folder.is_dir():
        return False
    return (folder / "oneblock.json").is_file() or "oneblock" in folder.name.lower()


def find_destinations(root: Path) -> list[Path]:
    maps_dir = root / "MCPEDL" / "Maps"
    if not maps_dir.is_dir():
        return []
    dests = []
    for m in sorted(maps_dir.iterdir()):
        if not is_oneblock_map(m):
            continue
        # Primary behavior_pack scripts/lib
        bp_lib = m / "behavior_pack" / "scripts" / "lib"
        dests.append(bp_lib / "Oneblock_Progression.js")

        # Nested world copies if they exist (e.g., world/behavior_packs/*/scripts/lib)
        for w_lib in sorted(m.glob("world/behavior_packs/*/scripts/lib")):
            dests.append(w_lib / "Oneblock_Progression.js")
    return dests


def sync(root: Path, check_only: bool = False) -> int:
    src_path = root / SOURCE_REL
    if not src_path.is_file():
        print(f"Error: authoritative progression file not found: {src_path}", file=sys.stderr)
        return 1

    src_bytes = src_path.read_bytes()
    dests = find_destinations(root)
    if not dests:
        print("No OneBlock maps found under MCPEDL/Maps/.")
        return 0

    stale = []
    updated = 0
    unchanged = 0

    for dest in dests:
        rel = dest.relative_to(root).as_posix()
        if dest.is_file() and dest.read_bytes() == src_bytes:
            unchanged += 1
            continue

        stale.append(dest)
        if not check_only:
            dest.parent.mkdir(parents=True, exist_ok=True)
            dest.write_bytes(src_bytes)
            updated += 1
            print(f"  synced {rel}")

    if check_only:
        if stale:
            print(f"{len(stale)} OneBlock script destination(s) out of date:")
            for s in stale:
                print(f"  STALE: {s.relative_to(root).as_posix()}")
            return 1
        print(f"All {len(dests)} OneBlock script destination(s) match {SOURCE_REL.as_posix()}.")
        return 0

    print(f"Done: {updated} synced, {unchanged} unchanged ({len(dests)} total destination(s)).")
    return 0


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--check", action="store_true", help="verify all destinations match without writing; exit 1 if stale")
    ap.add_argument("--root", default=str(ROOT), help="repository root (default: repo containing this script)")
    args = ap.parse_args(argv)
    return sync(Path(args.root).resolve(), check_only=args.check)


if __name__ == "__main__":
    sys.exit(main())
