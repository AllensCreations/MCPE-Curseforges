#!/usr/bin/env python3
"""Compare a pack's loot tables with the vanilla tables in Mojang's bedrock-samples.

A loot table only replaces a vanilla one when its file name is identical. This check reports:
  NAME   the pack table looks like a vanilla table with a different spelling (for example
         shipwreck_treasure.json next to the vanilla shipwrecktreasure.json). It overrides nothing.
  LOST   entries of the vanilla table that the pack copy no longer has (pool number and item name).
  ADDED  entries the pack copy adds.
LOST and ADDED are information: some packs remove or add entries on purpose. Only NAME fails the check.

Usage: python3 scripts/check_loot_tables.py --project MCPEDL/Addons/<Name> --samples <bedrock-samples clone>
Exit: 0 ok, 1 a NAME problem, 2 bad arguments or an unreadable file.
"""
import argparse
import json
import re
import sys
from pathlib import Path


def entries(path):
    data = json.loads(path.read_text(encoding="utf-8"))
    found = set()
    for number, pool in enumerate(data.get("pools", [])):
        for entry in pool.get("entries", []):
            found.add((number, str(entry.get("name"))))
    return found


def squash(name):
    return re.sub(r"[^a-z0-9]", "", name.lower())


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    ap.add_argument("--project", required=True, help="project folder, for example MCPEDL/Addons/Grimoire-Relics-V2")
    ap.add_argument("--samples", required=True, help="local clone of Mojang/bedrock-samples")
    a = ap.parse_args(argv)
    tables = Path(a.project) / "behavior_pack" / "loot_tables"
    vanilla_root = Path(a.samples) / "behavior_pack" / "loot_tables"
    if not tables.is_dir():
        print(f"No loot tables in {tables}")
        return 0
    if not vanilla_root.is_dir():
        print(f"Samples loot tables not found: {vanilla_root}", file=sys.stderr)
        return 2
    vanilla = {p.relative_to(vanilla_root).as_posix(): p for p in vanilla_root.rglob("*.json")}
    by_squash = {}
    for rel in vanilla:
        by_squash.setdefault(squash(rel), rel)
    bad = 0
    for path in sorted(tables.rglob("*.json")):
        rel = path.relative_to(tables).as_posix()
        try:
            mine = entries(path)
        except (OSError, ValueError) as err:
            print(f"ERROR {rel}: {err}", file=sys.stderr)
            return 2
        if rel in vanilla:
            theirs = entries(vanilla[rel])
            lost = sorted(theirs - mine)
            added = sorted(mine - theirs)
            print(f"OK    {rel}: overrides vanilla ({len(lost)} lost, {len(added)} added)")
            for n, name in lost:
                print(f"LOST  {rel}: pool {n} {name}")
            for n, name in added:
                print(f"ADDED {rel}: pool {n} {name}")
            continue
        near = by_squash.get(squash(rel))
        if near:
            bad += 1
            print(f"NAME  {rel}: overrides nothing; the vanilla table is {near}")
        else:
            print(f"NEW   {rel}: no vanilla table with this name")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
