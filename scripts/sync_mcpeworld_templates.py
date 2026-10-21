#!/usr/bin/env python3
"""Validate the three canonical editable Mcpeworlds source folders."""
from __future__ import annotations

from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROOT_DIR = ROOT / "Mcpeworlds"
MODES = ("Creative", "Survival", "Hardcore")


def main() -> int:
    errors = []
    for mode in MODES:
        world = ROOT_DIR / mode
        if not world.is_dir():
            errors.append(f"Missing source folder: {world.relative_to(ROOT)}")
            continue
        if not (world / "level.dat").is_file():
            errors.append(f"Missing level.dat: {(world / 'level.dat').relative_to(ROOT)}")
        if not (world / "behavior_packs" / "void_cleaner" / "manifest.json").is_file():
            errors.append(f"Missing Void Cleaner manifest under {world.relative_to(ROOT)}")
        setup = world / "behavior_packs" / "void_cleaner" / "functions" / "setup_void.mcfunction"
        if not setup.is_file():
            errors.append(f"Missing setup function: {setup.relative_to(ROOT)}")
        else:
            lines = setup.read_text(encoding="utf-8").splitlines()
            expected = "execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air"
            if expected not in lines:
                errors.append(f"Cleaner command missing or incorrect: {setup.relative_to(ROOT)}")
        db = world / "db"
        if not (db / "CURRENT").is_file():
            print(f"WARNING: {mode} source has no db/CURRENT; build uses documented database carrier.")
        else:
            data_files = [p for p in db.iterdir() if p.is_file() and p.name not in
                          {"CURRENT", "LOCK", "LOG", "LOG.old"} and not p.name.startswith("MANIFEST")]
            if not data_files:
                errors.append(f"LevelDB data files are missing under {db.relative_to(ROOT)}")
    if errors:
        print("Mcpeworlds source validation failed:")
        for error in errors:
            print(f"- {error}")
        return 1
    print("Validated the three canonical Mcpeworlds folders (Creative, Survival, Hardcore).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
