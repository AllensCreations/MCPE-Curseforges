#!/usr/bin/env python3
"""Regenerate the subpack main.js copies from behavior_pack/scripts/main.js.

Edit only behavior_pack/scripts/main.js, then run this script. The Full, Simple
and Extreme copies differ from it only in the DEFAULT_MODE line.
"""
import os
import sys

root = os.path.dirname(os.path.abspath(__file__))
base_path = os.path.join(root, "behavior_pack", "scripts", "main.js")

with open(base_path, encoding="utf-8", newline="") as f:
    src = f.read()

marker = 'const DEFAULT_MODE = "full";'
if src.count(marker) != 1:
    sys.exit("Base main.js must contain exactly one: " + marker)

for mode in ("full", "simple", "extreme"):
    out = src.replace(marker, 'const DEFAULT_MODE = "%s";' % mode)
    path = os.path.join(root, "behavior_pack", "subpacks", mode + "_mode", "scripts", "main.js")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="") as f:
        f.write(out)
    print("synced", mode)
