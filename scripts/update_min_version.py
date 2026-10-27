#!/usr/bin/env python3
"""
update_min_version.py
Updates the minimum Minecraft Bedrock version in INSTRUCTIONS.md,
and optionally adjusts manifests and README files for target mob behavior scripts.
"""

import argparse
import json
import os
import re
import sys

REPO_ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def parse_version_tuple(version_str: str):
    cleaned = version_str.strip().lstrip("vV")
    parts = cleaned.split(".")
    nums = []
    for p in parts:
        num = re.sub(r"[^\d]", "", p)
        if num:
            nums.append(int(num))
    while len(nums) < 3:
        nums.append(0)
    return nums[:3]


def update_instructions(version_str: str, version_parts):
    instructions_path = os.path.join(REPO_ROOT, "INSTRUCTIONS.md")
    if not os.path.exists(instructions_path):
        print(f"[WARN] INSTRUCTIONS.md not found at {instructions_path}")
        return

    with open(instructions_path, "r", encoding="utf-8") as f:
        content = f.read()

    major_minor = f"{version_parts[0]}.{version_parts[1]}"
    full_ver = f"{version_parts[0]}.{version_parts[1]}.{version_parts[2]}"

    section_pattern = re.compile(
        r"(## 9\. Minecraft Bedrock Engine & Manifest Version Standards\n\n).*?(?=(\n---|\Z))",
        re.DOTALL
    )

    new_section = (
        f"All packs, add-ons, and behavior/resource scripts created or maintained in this repository must adhere to the modern engine standard:\n\n"
        f"- **Target Engine Version:** **Minecraft Bedrock {major_minor}+** (Preview, Beta, and Release builds).\n"
        f"- **Minimum Engine Version (`min_engine_version`):**\n"
        f"  - All modern behavior packs, mob behavior scripts, and resource packs must target minimum engine version `[{version_parts[0]}, {version_parts[1]}, {version_parts[2]}]` (or higher).\n"
        f"  - Manifest `format_version` must be `2`.\n"
        f"- **Documentation & Badges:**\n"
        f"  - Readme headers must feature the version badge: `[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-{full_ver}%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)`.\n"
        f"  - Compatibility sections must state: `- Minecraft Bedrock Edition {full_ver}+`."
    )

    if section_pattern.search(content):
        updated = section_pattern.sub(r"\g<1>" + new_section, content)
    else:
        updated = content.rstrip() + f"\n\n---\n\n## 9. Minecraft Bedrock Engine & Manifest Version Standards\n\n{new_section}\n"

    with open(instructions_path, "w", encoding="utf-8") as f:
        f.write(updated)
    print(f"[OK] Updated INSTRUCTIONS.md with minimum engine version {major_minor}+ / {full_ver}")


def update_mob_manifests(version_parts):
    targets = [
        "MCPEDL/new_addons/Swarm-Mob-Booster/behavior_pack/manifest.json",
        "MCPEDL/new_addons/Selective-Mob-Controller/behavior_pack/manifest.json",
    ]

    for rel_path in targets:
        full_path = os.path.join(REPO_ROOT, rel_path)
        if not os.path.exists(full_path):
            continue

        with open(full_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        if "header" in data:
            data["header"]["min_engine_version"] = version_parts

        with open(full_path, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
            f.write("\n")
        print(f"[OK] Updated {rel_path} min_engine_version to {version_parts}")


def update_mob_readmes(version_parts):
    targets = [
        "MCPEDL/new_addons/Swarm-Mob-Booster/README.md",
        "MCPEDL/new_addons/Selective-Mob-Controller/README.md",
    ]
    full_ver = f"{version_parts[0]}.{version_parts[1]}.{version_parts[2]}"

    badge_pattern = re.compile(
        r"https://img\.shields\.io/badge/Minecraft%20Bedrock-[^-\?]+%2B?-brightgreen\?style=flat-square&logo=minecraft"
    )
    compat_pattern = re.compile(r"-\s*Minecraft\s+Bedrock\s+Edition\s+[\d\.]+\+?")

    new_badge = f"https://img.shields.io/badge/Minecraft%20Bedrock-{full_ver}%2B-brightgreen?style=flat-square&logo=minecraft"
    new_compat = f"- Minecraft Bedrock Edition {full_ver}+"

    for rel_path in targets:
        full_path = os.path.join(REPO_ROOT, rel_path)
        if not os.path.exists(full_path):
            continue

        with open(full_path, "r", encoding="utf-8") as f:
            text = f.read()

        text = badge_pattern.sub(new_badge, text)
        text = compat_pattern.sub(new_compat, text)

        with open(full_path, "w", encoding="utf-8") as f:
            f.write(text)
        print(f"[OK] Updated {rel_path} badges & compatibility to {full_ver}+")


def main():
    parser = argparse.ArgumentParser(description="Update minimum Bedrock version.")
    parser.add_argument("--version", "-v", required=True, help="Minimum Bedrock version (e.g. 1.26.0)")
    parser.add_argument("--manifests", action="store_true", help="Update mob behavior manifests")
    parser.add_argument("--readmes", action="store_true", help="Update mob READMEs")

    args = parser.parse_args()
    version_parts = parse_version_tuple(args.version)

    update_instructions(args.version, version_parts)

    if args.manifests:
        update_mob_manifests(version_parts)

    if args.readmes:
        update_mob_readmes(version_parts)


if __name__ == "__main__":
    main()
