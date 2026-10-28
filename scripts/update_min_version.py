#!/usr/bin/env python3
"""Set header.min_engine_version in the manifests of chosen projects.

INSTRUCTIONS.md no longer carries a fixed engine version and READMEs carry no version badges
(Part 1 Section 2, Part 2 Section 3), so this script only edits manifests.
Use it only with a game version you have looked up and confirmed the project needs.

Usage: python scripts/update_min_version.py --version 1.21.0 [--project MCPEDL/new_addons/Name ...]
"""

import argparse
import json
import re
import sys
from pathlib import Path

REPO_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_PROJECTS = (
    "MCPEDL/new_addons/Swarm-Mob-Booster",
    "MCPEDL/new_addons/Selective-Mob-Controller",
)
PACKS = ("behavior_pack", "resource_pack")


def parse_version_tuple(version_str: str) -> list[int]:
    cleaned = version_str.strip().lstrip("vV")
    if not re.fullmatch(r"\d+(\.\d+){0,2}", cleaned):
        sys.exit(f"Not a version number: {version_str!r} (use 1.21 or 1.21.0)")
    nums = [int(p) for p in cleaned.split(".")]
    nums += [0] * (3 - len(nums))
    if nums == [0, 0, 0]:
        sys.exit("0.0.0 is a placeholder, not a real engine version")
    return nums


def update_manifests(projects, version_parts):
    for project in projects:
        base = (REPO_ROOT / project).resolve()
        try:
            base.relative_to(REPO_ROOT / "MCPEDL")
        except ValueError:
            sys.exit(f"{project} is not inside MCPEDL/")
        for pack in PACKS:
            path = base / pack / "manifest.json"
            if not path.is_file():
                continue
            data = json.loads(path.read_text(encoding="utf-8-sig"))
            header = data.get("header")
            if not isinstance(header, dict):
                print(f"[WARN] {path.relative_to(REPO_ROOT).as_posix()} has no header; skipped")
                continue
            if header.get("min_engine_version") == version_parts:
                print(f"[OK] {path.relative_to(REPO_ROOT).as_posix()} already {version_parts}")
                continue
            header["min_engine_version"] = version_parts
            path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
            print(f"[OK] {path.relative_to(REPO_ROOT).as_posix()} min_engine_version -> {version_parts}")


def main():
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--version", "-v", required=True, help="Looked-up minimum Bedrock version (e.g. 1.21.0)")
    parser.add_argument("--project", action="append", help="Project folder under MCPEDL/ (repeatable; default: the two mob add-ons)")
    args = parser.parse_args()
    update_manifests(args.project or DEFAULT_PROJECTS, parse_version_tuple(args.version))


if __name__ == "__main__":
    main()
