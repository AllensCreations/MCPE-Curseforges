#!/usr/bin/env python3
"""
Scanner and Updater for project README documentation status across MCPE-Curseforges.

Identifies:
1. Missing README.md files.
2. Unwritten documentation placeholders (e.g. 'Not yet written', 'Documentation status').
3. Newly scaffolded stubs (e.g. '## Source Files', 'Review the included manifests...').
4. Incomplete documentation lacking core gameplay sections (## Overview, ## Features, ## How It Works).
"""

import os
import glob
import sys
import re
import json
import argparse
import subprocess

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

# Markers indicating placeholder or unpopulated documentation
PLACEHOLDER_MARKERS = [
    "Not yet written",
    "Documentation status",
    "Logo: Not supplied",
    "Banner: Not supplied",
    "<!-- TODO:",
    "TODO: Describe what this addon does",
]

# Markers found in newly generated / scaffolded stubs
SCAFFOLD_STUB_MARKERS = [
    "## Source Files",
    "Review the included manifests, behavior packs, resource packs, and scripts before publishing",
    "This directory contains the uncompressed source files used to build this add-on",
    "Minecraft Bedrock add-on by AllensCreations.",
]

GAMEPLAY_HEADING_REGEX = re.compile(
    r"^##\s+.*(overview|feature|mechanic|how it works|about|rule|system|gameplay)",
    re.IGNORECASE | re.MULTILINE
)



def scan_projects(target_project=None):
    categories = [
        "MCPEDL/addons", "MCPEDL/new_addons", "MCPEDL/script", "MCPEDL/maps"
    ]
    # Include all subdirectories under MCPEDL/
    mcpedl_dir = os.path.join(REPO_ROOT, "MCPEDL")
    if os.path.isdir(mcpedl_dir):
        for sub in sorted(os.listdir(mcpedl_dir)):
            subpath = os.path.join(mcpedl_dir, sub)
            if os.path.isdir(subpath):
                rel = f"MCPEDL/{sub}"
                if rel not in categories:
                    categories.append(rel)

    results = []

    for cat in categories:
        cat_path = os.path.join(REPO_ROOT, cat)
        if not os.path.isdir(cat_path):
            continue
        for proj in sorted(glob.glob(os.path.join(cat_path, "*"))):
            if not os.path.isdir(proj):
                continue
            proj_name = os.path.basename(proj)
            if target_project and target_project.lower() not in (proj_name.lower(), proj.lower()):
                continue

            readme_path = os.path.join(proj, "README.md")
            rel_path = os.path.relpath(proj, REPO_ROOT)

            if not os.path.isfile(readme_path):
                results.append({
                    "name": proj_name,
                    "path": rel_path,
                    "proj_dir": proj,
                    "status": "MISSING_README",
                    "details": "README.md does not exist."
                })
                continue

            with open(readme_path, "r", encoding="utf-8") as f:
                content = f.read()

            matched_placeholders = [m for m in PLACEHOLDER_MARKERS if m in content]
            matched_scaffold = [m for m in SCAFFOLD_STUB_MARKERS if m in content]
            has_gameplay_sections = bool(GAMEPLAY_HEADING_REGEX.search(content))
            lines = [line.strip() for line in content.splitlines() if line.strip()]

            # 1. Direct placeholder markers
            if matched_placeholders:
                results.append({
                    "name": proj_name,
                    "path": rel_path,
                    "proj_dir": proj,
                    "status": "PLACEHOLDER",
                    "details": f"Contains markers: {', '.join(matched_placeholders)}"
                })
            # 2. Scaffold stub markers
            elif matched_scaffold:
                results.append({
                    "name": proj_name,
                    "path": rel_path,
                    "proj_dir": proj,
                    "status": "SCAFFOLD_STUB",
                    "details": f"Unpopulated scaffold stub (found '{matched_scaffold[0]}')."
                })
            # 3. Missing essential gameplay documentation or too brief
            elif not has_gameplay_sections or len(lines) < 25:
                results.append({
                    "name": proj_name,
                    "path": rel_path,
                    "proj_dir": proj,
                    "status": "INCOMPLETE",
                    "details": "Incomplete documentation (missing Overview/Features gameplay sections)."
                })
            else:
                results.append({
                    "name": proj_name,
                    "path": rel_path,
                    "proj_dir": proj,
                    "status": "COMPLETE",
                    "details": "Documentation is populated."
                })

    return results


def extract_manifest_info(proj_dir):
    """Gathers metadata from manifests inside project directory."""
    manifests = sorted(glob.glob(os.path.join(proj_dir, "**/manifest.json"), recursive=True))
    name = os.path.basename(proj_dir).replace("-", " ")
    desc = "Comprehensive Minecraft Bedrock add-on by AllensCreations."
    ver = "1.0.0"
    min_engine = "1.21.0"
    has_bp = False
    has_rp = False

    for m in manifests:
        try:
            with open(m, "r", encoding="utf-8") as f:
                data = json.load(f)
            hdr = data.get("header", {})
            if hdr.get("name"):
                name = hdr["name"]
            if hdr.get("description"):
                desc = hdr["description"]
            if isinstance(hdr.get("version"), list):
                ver = ".".join(str(x) for x in hdr["version"])
            if isinstance(hdr.get("min_engine_version"), list):
                min_engine = ".".join(str(x) for x in hdr["min_engine_version"])
            for mod in data.get("modules", []):
                m_type = mod.get("type", "")
                if m_type in ("data", "script"):
                    has_bp = True
                elif m_type in ("resources", "client_data"):
                    has_rp = True
        except (OSError, json.JSONDecodeError):
            continue

    if os.path.isdir(os.path.join(proj_dir, "behavior_pack")):
        has_bp = True
    if os.path.isdir(os.path.join(proj_dir, "resource_pack")):
        has_rp = True

    primary_ext = "mcaddon" if (has_bp and has_rp) else "mcpack"
    return {
        "name": name,
        "description": desc,
        "version": ver,
        "min_engine": min_engine,
        "primary_ext": primary_ext,
    }


def analyze_addon_source(proj_dir):
    """Scans entity files and scripts to identify core features."""
    features = []
    interactions = []

    # Check entities
    entity_files = glob.glob(os.path.join(proj_dir, "**/entities/**/*.json"), recursive=True)
    for ef in entity_files:
        try:
            with open(ef, "r", encoding="utf-8") as f:
                data = json.load(f)
            components = data.get("minecraft:entity", {}).get("components", {})
            if "minecraft:tameable" in components:
                items = components["minecraft:tameable"].get("tame_items", [])
                items_str = ", ".join(items) if isinstance(items, list) else "taming items"
                features.append(f"Tameable companions using {items_str}.")
                interactions.append(("Tame Companion", items_str, "Pacifies entity and bounds it as loyal follower."))
            if "minecraft:is_tamed" in components or "minecraft:behavior.follow_owner" in components:
                features.append("Companion following behavior with guard stance and stay/sit toggle.")
            if "minecraft:rideable" in components:
                features.append("Rideable mount capabilities with configurable seating.")
                interactions.append(("Ride Mount", "Saddle or Interact", "Allows direct player mounting and directional travel."))
            if "minecraft:damage_sensor" in components:
                features.append("Custom damage sensors preventing fatal harm to companions.")
        except Exception:
            continue

    # Check scripts
    script_files = glob.glob(os.path.join(proj_dir, "**/scripts/**/*.js"), recursive=True) + \
                   glob.glob(os.path.join(proj_dir, "**/scripts/**/*.ts"), recursive=True)
    for sf in script_files:
        try:
            with open(sf, "r", encoding="utf-8") as f:
                content = f.read()
            if "world.beforeEvents.entityHurt" in content:
                features.append("Real-time fatal damage cancellation protecting companion health.")
            if "world.afterEvents.playerInteractWithEntity" in content:
                features.append("Interactive player entity management via Script API.")
            if "system.runInterval" in content:
                features.append("Continuous background monitoring ensuring persistent buffs.")
        except Exception:
            continue

    if not features:
        features.append("Optimized Minecraft Bedrock mechanics built for smooth multiplayer and survival gameplay.")
        features.append("Modular data-driven architecture compatible with standard worlds and Realms.")

    return features, interactions


def auto_generate_readme(proj_dir):
    """Generates standardized professional README without emojis."""
    meta = extract_manifest_info(proj_dir)
    features, interactions = analyze_addon_source(proj_dir)
    slug = os.path.basename(proj_dir)

    readme_path = os.path.join(proj_dir, "README.md")

    feature_lines = "\n".join(f"- **Feature**: {f}" for f in features)

    interaction_rows = ""
    if interactions:
        rows = [f"| {act} | {req} | {res} |" for act, req, res in interactions]
        interaction_rows = "\n".join(rows)
    else:
        interaction_rows = "| Interact with Companion | Specified Item | Activates custom companion mechanics |"

    content = f"""# {meta['name']} — Minecraft Bedrock Addon

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-{meta['min_engine']}%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Release](https://img.shields.io/badge/Release-v{meta['version']}-blue?style=flat-square)](../README.md#available-source-add-ons)
[![Format](https://img.shields.io/badge/Format-.{meta['primary_ext'].upper()}-orange?style=flat-square)](../README.md#available-source-add-ons)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20PC%20%7C%20Console%20%7C%20Realms-yellow?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

Creator: AllensCreations  
Description: {meta['description']}

---

## Overview

{meta['description']} Designed specifically for Minecraft Bedrock, providing seamless survival integration, robust companion mechanics, and zero intrusive experimental flags.

---

## Features

{feature_lines}

---

## How It Works & In-Game Usage

| Interaction / Action | Requirement / Item | In-Game Result |
| :--- | :--- | :--- |
{interaction_rows}

---

## Installation

1. Download the `.{meta['primary_ext']}` file from the [releases](../README.md).
2. Open or double-tap the file to auto-import into Minecraft Bedrock.
3. Apply the pack in your world settings under Behavior Packs (and Resource Packs if applicable).
4. Launch your world and enjoy enhanced survival mechanics.

---

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.
"""
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  [Auto-Fix] Successfully generated standardized README for {slug}")


def main():
    parser = argparse.ArgumentParser(
        description="MCPE-Curseforges — README Documentation Status Audit & Generator (/checkrm)"
    )
    parser.add_argument(
        "--project",
        help="Audit a specific project directory name (e.g. Immortal-Pets).",
    )
    parser.add_argument(
        "--fix",
        action="store_true",
        help="Automatically generate standard documentation for any incomplete or scaffold stubs.",
    )
    args = parser.parse_args()

    projects = scan_projects(target_project=args.project)
    print("=" * 70)
    print("MCPE-Curseforges — README Documentation Status Audit (/checkrm)")
    print("=" * 70)

    pending = [p for p in projects if p["status"] != "COMPLETE"]
    complete = [p for p in projects if p["status"] == "COMPLETE"]

    for p in projects:
        icon = "[OK]" if p["status"] == "COMPLETE" else "[NEEDS UPDATE]"
        print(f"{icon:<15} {p['path']:<45} {p['details']}")

    print("-" * 70)
    print(f"Total projects: {len(projects)} | Complete: {len(complete)} | Needs Update: {len(pending)}")
    print("=" * 70)

    if args.fix and pending:
        print("\n[Auto-Fix] Resolving pending documentation...")
        for p in pending:
            auto_generate_readme(p["proj_dir"])
            # Re-run auto_bump_and_build to sync catalogs
            auto_bump_script = os.path.join(REPO_ROOT, "scripts", "auto_bump_and_build.py")
            if os.path.isfile(auto_bump_script):
                subprocess.run(
                    [sys.executable, auto_bump_script, "--project", p["name"], "--no-bump"],
                    cwd=REPO_ROOT,
                    check=False,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL
                )

        # Re-scan after fix
        refreshed = scan_projects(target_project=args.project)
        refreshed_pending = [p for p in refreshed if p["status"] != "COMPLETE"]
        print("\nAudit results after --fix:")
        for p in refreshed:
            icon = "[OK]" if p["status"] == "COMPLETE" else "[NEEDS UPDATE]"
            print(f"{icon:<15} {p['path']:<45} {p['details']}")
        print(f"Remaining incomplete projects: {len(refreshed_pending)}")


if __name__ == "__main__":
    main()
