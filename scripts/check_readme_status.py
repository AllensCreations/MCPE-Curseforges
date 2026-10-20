#!/usr/bin/env python3
"""
Scanner and Updater for project README documentation status across MCPE-Curseforges.

Identifies:
1. Missing README.md files.
2. Unwritten documentation placeholders (e.g. 'Not yet written', 'Documentation status').
3. Newly scaffolded stubs (e.g. '## Source Files', 'Review the included manifests...').
4. Incomplete product descriptions lacking core gameplay sections (## Overview, ## Features, ## How It Works).
"""

import os
import glob
import sys
import re
import json
import argparse
import subprocess
import urllib.parse

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def audit_relative_links():
    """Audits relative links across all repository README.md files to ensure no dead links exist."""
    broken = []
    readme_files = []
    for root, dirs, files in os.walk(REPO_ROOT):
        if any(ignored in root for ignored in [".git", "node_modules", "reference/bedrock-samples", "graphify-out"]):
            continue
        for f in files:
            if f.lower() == "readme.md":
                readme_files.append(os.path.join(root, f))

    for rm in readme_files:
        try:
            with open(rm, "r", encoding="utf-8") as f:
                content = f.read()
        except Exception:
            continue
        dir_path = os.path.dirname(rm)
        links = re.findall(r"\[([^\]]*)\]\(([^)]+)\)", content)
        for text, target in links:
            target = target.strip()
            if target.startswith("http") or target.startswith("#") or target.startswith("mailto:"):
                continue
            target_path = target.split("#")[0]
            if not target_path:
                continue
            unquoted = urllib.parse.unquote(target_path)
            full_path = os.path.normpath(os.path.join(dir_path, unquoted))
            if not os.path.exists(full_path):
                rel_rm = os.path.relpath(rm, REPO_ROOT)
                broken.append((rel_rm, text, target, unquoted))

    return broken, len(readme_files)

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
    "## Description\n\nMinecraft Bedrock add-on by AllensCreations.",
    "This directory contains the uncompressed source files used to build this add-on.\n\nReview the included manifests",
    "Do not re-upload this add-on or modified copies to other websites, app stores, or file-sharing services.",
]

GAMEPLAY_HEADING_REGEX = re.compile(
    r"^##\s+.*(overview|feature|mechanic|how it works|about|rule|system|gameplay)",
    re.IGNORECASE | re.MULTILINE
)



def scan_projects(target_project=None):
    categories = [
        "MCPEDL/addons", "MCPEDL/new_addons", "MCPEDL/script", "MCPEDL/maps"
    ]
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

            is_addon = cat in ("MCPEDL/addons", "MCPEDL/new_addons")
            readme_path = os.path.join(proj, "README.md")
            description_path = os.path.join(proj, "DESCRIPTION.md")
            documentation_path = description_path if is_addon else readme_path
            rel_path = os.path.relpath(proj, REPO_ROOT)

            if not os.path.isfile(readme_path):
                results.append({
                    "name": proj_name, "path": rel_path, "proj_dir": proj,
                    "status": "MISSING_README", "details": "README.md does not exist."
                })
                continue

            if is_addon and not os.path.isfile(description_path):
                results.append({
                    "name": proj_name, "path": rel_path, "proj_dir": proj,
                    "status": "MISSING_DESCRIPTION",
                    "details": "DESCRIPTION.md does not exist for this add-on."
                })
                continue

            if is_addon:
                with open(readme_path, "r", encoding="utf-8") as f:
                    readme_content = f.read()
                readme_lines = [line.strip() for line in readme_content.splitlines() if line.strip()]
                has_download_link = bool(re.search(r"\*\*Download:\*\*\s*\[[^]]+\]\([^)]+\)", readme_content))
                if len(readme_lines) > 4 or not readme_lines or not readme_lines[0].startswith("# ") or not has_download_link:
                    results.append({
                        "name": proj_name, "path": rel_path, "proj_dir": proj,
                        "status": "README_NOT_DOWNLOAD_ONLY",
                        "details": "Individual add-on README.md must contain only its title/version and download link."
                    })
                    continue

            with open(documentation_path, "r", encoding="utf-8") as f:
                content = f.read()

            matched_placeholders = [m for m in PLACEHOLDER_MARKERS if m in content]
            matched_scaffold = [m for m in SCAFFOLD_STUB_MARKERS if m in content]
            has_gameplay_sections = bool(GAMEPLAY_HEADING_REGEX.search(content))
            lines = [line.strip() for line in content.splitlines() if line.strip()]

            if matched_placeholders:
                status, details = "PLACEHOLDER", f"Contains markers: {', '.join(matched_placeholders)}"
            elif matched_scaffold:
                status, details = "SCAFFOLD_STUB", f"Unpopulated scaffold stub (found '{matched_scaffold[0]}')."
            elif not has_gameplay_sections or len(lines) < 25:
                status, details = "INCOMPLETE", "Incomplete product documentation (missing Overview/Features gameplay sections)."
            else:
                status, details = "COMPLETE", "Product documentation is populated."

            results.append({
                "name": proj_name, "path": rel_path, "proj_dir": proj,
                "status": status, "details": details
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
    """Creates DESCRIPTION.md for add-ons and keeps their README.md download-only."""
    meta = extract_manifest_info(proj_dir)
    features, interactions = analyze_addon_source(proj_dir)
    slug = os.path.basename(proj_dir)
    readme_path = os.path.join(proj_dir, "README.md")
    description_path = os.path.join(proj_dir, "DESCRIPTION.md")
    category = os.path.basename(os.path.dirname(proj_dir))
    is_addon = category in ("addons", "new_addons")
    output_path = description_path if is_addon else readme_path

    clean_name = meta["name"].replace(" BP", "").replace(" RP", "").strip()
    clean_name = re.sub(r"\s*\(v\d+\.\d+\.\d+\)\s*$", "", clean_name).strip()
    version = meta["version"]

    def write_download_readme():
        catalog = "new_addons" if category == "new_addons" else "addons"
        build_dir = os.path.join(REPO_ROOT, "builds", slug)
        candidates = []
        for ext in (meta["primary_ext"], "mcaddon", "mcpack"):
            candidates.extend(sorted(glob.glob(os.path.join(build_dir, f"*.{ext}"))))
        if candidates:
            package = candidates[0]
            package_rel = os.path.relpath(package, REPO_ROOT).replace(os.sep, "/")
            url = "https://github.com/AllensCreations/MCPE-Curseforges/raw/main/" + urllib.parse.quote(package_rel, safe="/")
            label = f"Download the add-on (.{os.path.splitext(package)[1].lstrip('.')})"
        else:
            url = (
                "https://github.com/AllensCreations/MCPE-Curseforges/blob/main/"
                f"MCPEDL/{catalog}/README.md#available-add-ons"
            )
            label = "Open the official download catalog"
        content = f"# {clean_name} (v{version})\n\n**Download:** [{label}]({url})\n"
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(content)

    if is_addon:
        # Preserve an existing complete DESCRIPTION.md rather than regenerating it.
        if os.path.isfile(description_path):
            with open(description_path, "r", encoding="utf-8") as f:
                existing_description = f.read()
            existing_lines = [line.strip() for line in existing_description.splitlines() if line.strip()]
            if (
                len(existing_lines) >= 25
                and GAMEPLAY_HEADING_REGEX.search(existing_description)
                and not any(marker in existing_description for marker in PLACEHOLDER_MARKERS + SCAFFOLD_STUB_MARKERS)
            ):
                write_download_readme()
                print(f"  [Auto-Fix] Preserved DESCRIPTION.md and refreshed download-only README for {slug}")
                return
        elif os.path.isfile(readme_path):
            # Migrate existing product information instead of discarding it.
            with open(readme_path, "r", encoding="utf-8") as f:
                old_readme = f.read()
            if len(old_readme.strip()) > 500 and GAMEPLAY_HEADING_REGEX.search(old_readme):
                with open(description_path, "w", encoding="utf-8") as f:
                    f.write(old_readme if old_readme.endswith("\n") else old_readme + "\n")
                write_download_readme()
                print(f"  [Auto-Fix] Moved existing product information into DESCRIPTION.md for {slug}")
                return

    feature_cards = []
    for feature in features:
        feature = re.sub(r"\bminecraft:[a-z0-9_]+", lambda m: m.group(0).split(":", 1)[1].replace("_", " ").title(), feature, flags=re.IGNORECASE)
        feature = feature.replace("Script API", "in-game interactions")
        title = feature.strip().rstrip(".")
        feature_cards.append(f"### {title}\n- **Description**: {feature}")
    if not feature_cards:
        feature_cards.append("### Included Gameplay\n- **Description**: Review the included features and pack settings for the exact behavior provided.")

    feature_section = "\n\n".join(feature_cards)
    interaction_cards = []
    for action, requirement, result in interactions:
        requirement = re.sub(r"\bminecraft:[a-z0-9_]+", lambda m: m.group(0).split(":", 1)[1].replace("_", " ").title(), requirement, flags=re.IGNORECASE)
        interaction_cards.append(f"### {action}\n- **Requirement**: {requirement}\n- **What Happens**: {result}")
    interaction_section = "\n\n".join(interaction_cards) if interaction_cards else "Use the in-game interactions provided by the add-on. Refer to the included pack settings and item descriptions for supported controls."

    content = f"""# {clean_name} (v{version})

**By AllensCreations**

## Overview

{clean_name} adds gameplay behavior to Minecraft Bedrock Edition. The included features below are based on the files present in this project; confirm any world-specific requirements in the target game.

## Key Features

{feature_section}

## How to Use

{interaction_section}

## Compatibility

- Minecraft Bedrock Edition: {meta["min_engine"]} or newer.
- Package format: {meta["primary_ext"].upper()}.
- Achievement support: not confirmed through in-game testing.
- Experimental-feature requirements: check the target game's world settings and pack behavior.

## Creator and Permissions

- Creator: AllensCreations
- Profiles: [CurseForge Profile](https://www.curseforge.com/members/allenscreations/projects) · [MCPEDL Profile](https://mcpedl.com/user/allenscreations/)
- Content creators may feature this add-on in videos and streams with credit to AllensCreations.
- Do not re-upload this pack or provide direct monetized download bypasses.

---

© All rights reserved for AllensCreations.

---

## Search & Discovery Keywords

Minecraft Bedrock add-on, {clean_name.lower()} Bedrock mod, Minecraft PE survival, MCPEDL add-on, CurseForge Bedrock, AllensCreations.
"""
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)

    if is_addon:
        write_download_readme()

    print(f"  [Auto-Fix] Successfully generated product documentation for {slug}")


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

    # Relative Link Integrity Check
    broken_links, total_rms = audit_relative_links()
    if broken_links:
        print(f"\n[WARNING] Found {len(broken_links)} broken relative link(s) across {total_rms} README files:")
        for rel_rm, text, target, unquoted in broken_links:
            print(f"  - In {rel_rm}: [{text}]({target})")
    else:
        print(f"[LINK INTEGRITY] All relative links valid across {total_rms} README files.")
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
