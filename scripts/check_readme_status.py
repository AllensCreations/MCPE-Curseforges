#!/usr/bin/env python3
"""
Scanner and Updater for add-on README.md and DESCRIPTION.md documentation status across MCPE-Curseforges.

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
import urllib.parse

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))


def _heading_slugs(md_path):
    """GitHub-style heading slugs for a markdown file (ignores fenced code)."""
    slugs, seen, in_code = set(), {}, False
    try:
        with open(md_path, "r", encoding="utf-8") as fh:
            lines = fh.read().splitlines()
    except Exception:
        return slugs
    for line in lines:
        if line.lstrip().startswith("```"):
            in_code = not in_code
            continue
        m = re.match(r"^#{1,6}\s+(.*?)\s*#*\s*$", line)
        if in_code or not m:
            continue
        title = re.sub(r"\[([^\]]*)\]\([^)]*\)", r"\1", m.group(1))
        slug = re.sub(r"[^\w\- ]", "", title.lower().strip()).replace(" ", "-")
        n = seen.get(slug, 0)
        seen[slug] = n + 1
        slugs.add(slug if n == 0 else f"{slug}-{n}")
    return slugs


def audit_relative_links():
    """Audits relative links across all repository README.md files to ensure no dead links exist."""
    broken = []
    readme_files = []
    for root, dirs, files in os.walk(REPO_ROOT):
        if any(ignored in root for ignored in [".git", "node_modules", "reference/bedrock-samples", "graphify-out"]):
            continue
        for f in files:
            if f.lower() in ("readme.md", "description.md"):
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
            elif "#" in target and full_path.lower().endswith(".md") and os.path.isfile(full_path):
                fragment = urllib.parse.unquote(target.split("#", 1)[1]).strip().lower()
                if fragment and fragment not in _heading_slugs(full_path):
                    rel_rm = os.path.relpath(rm, REPO_ROOT)
                    broken.append((rel_rm, text, target, f"{unquoted} (missing anchor #{fragment})"))

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
    "Minecraft Bedrock add-on by ALNStudios.",
    "## Description\n\nMinecraft Bedrock add-on by ALNStudios.",
    "This directory contains the uncompressed source files used to build this add-on.\n\nReview the included manifests",
]

GAMEPLAY_HEADING_REGEX = re.compile(
    r"^##\s+.*(overview|feature|mechanic|how it works|about|rule|system|gameplay)",
    re.IGNORECASE | re.MULTILINE
)



def scan_projects(target_project=None):
    categories = [
        "MCPEDL/Addons", "MCPEDL/Maps", "MCPEDL/Script", "MCPEDL/Minigame"
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

            readme_path = os.path.join(proj, "README.md")
            description_path = os.path.join(proj, "DESCRIPTION.md")
            documentation_path = description_path
            rel_path = os.path.relpath(proj, REPO_ROOT)

            if not os.path.isfile(readme_path):
                results.append({
                    "name": proj_name, "path": rel_path, "proj_dir": proj,
                    "status": "MISSING_README", "details": "README.md does not exist."
                })
                continue

            if not os.path.isfile(description_path):
                results.append({
                    "name": proj_name, "path": rel_path, "proj_dir": proj,
                    "status": "MISSING_DESCRIPTION",
                    "details": "DESCRIPTION.md does not exist for this project."
                })
                continue

            with open(readme_path, "r", encoding="utf-8") as f:
                readme_content = f.read()
            readme_lines = [line.strip() for line in readme_content.splitlines() if line.strip()]
            has_download_link = bool(re.search(r"\*\*Direct download:\*\*\s*\[[^]]+\]\([^)]+\)", readme_content))
            has_installation = "## Installation" in readme_content
            has_description_link = "## Pack Information" in readme_content and "DESCRIPTION.md" in readme_content
            if (
                len(readme_lines) > 24 or not readme_lines
                or not readme_lines[0].startswith("# ")
                or re.search(r"\(v\d+\.\d+\.\d+(?:\.\d+)?\)$", readme_lines[0], re.I)
                or not has_download_link or not has_installation
                or not has_description_link
            ):
                results.append({
                    "name": proj_name, "path": rel_path, "proj_dir": proj,
                    "status": "README_DOWNLOAD_PAGE_INCOMPLETE",
                    "details": "README.md should use the version-free download template and link DESCRIPTION.md."
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
    desc = "Comprehensive Minecraft Bedrock add-on by ALNStudios."
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
                features.append("Protects companion health during damaging encounters.")
            if "world.afterEvents.playerInteractWithEntity" in content:
                features.append("Supports in-game interactions with selected entities.")
            if "system.runInterval" in content:
                features.append("Maintains supported effects while their activation conditions are met.")
        except Exception:
            continue

    if not features:
        features.append("Additional gameplay behavior is included in the project files.")
        features.append("Check the project description and world settings for compatibility details.")

    return features, interactions


def auto_generate_readme(proj_dir):
    """Create a player description and version-free download README for a project."""
    meta = extract_manifest_info(proj_dir)
    features, interactions = analyze_addon_source(proj_dir)
    slug = os.path.basename(proj_dir)
    readme_path = os.path.join(proj_dir, "README.md")
    description_path = os.path.join(proj_dir, "DESCRIPTION.md")
    category = os.path.basename(os.path.dirname(proj_dir))
    meta["primary_ext"] = {
        "Addons": "mcaddon",
        "Maps": "mcworld",
        "Script": "mcpack",
        "Minigame": "mcaddon",
    }.get(category, meta["primary_ext"])
    output_path = description_path
    from doc_template import DESCRIPTION_BADGES, apply_description_policy

    clean_name = meta["name"].replace(" BP", "").replace(" RP", "").strip()
    clean_name = re.sub(r"\s*\(v\d+\.\d+\.\d+(?:\.\d+)?\)\s*$", "", clean_name).strip()
    version = meta["version"]

    def write_download_readme():
        catalog = {
            "Addons": "Addons/README.md#available-add-ons",
            "Maps": "Maps/README.md#available-maps",
            "Script": "Script/README.md#available-scripts",
            "Minigame": "Minigame/README.md#available-minigames",
        }.get(category, "Addons/README.md#available-add-ons")
        build_dir = os.path.join(REPO_ROOT, "builds", slug)
        candidates = []
        for ext in (meta["primary_ext"], "mcaddon", "mcpack"):
            candidates.extend(sorted(glob.glob(os.path.join(build_dir, f"*.{ext}"))))
        if candidates:
            package = candidates[0]
            package_rel = os.path.relpath(package, REPO_ROOT).replace(os.sep, "/")
            url = "https://github.com/AllensCreations/MCPE-Curseforges/raw/main/" + urllib.parse.quote(package_rel, safe="/")
            label = f"Download {clean_name} (.{os.path.splitext(package)[1].lstrip('.')})"
        else:
            url = (
                "https://github.com/AllensCreations/MCPE-Curseforges/blob/main/"
                f"MCPEDL/{catalog}"
            )
            label = "Open the official download catalog"
        description_url = (
            "https://github.com/AllensCreations/MCPE-Curseforges/blob/main/"
            f"{os.path.relpath(description_path, REPO_ROOT).replace(os.sep, '/')}"
        )
        package_format = f".{os.path.splitext(candidates[0])[1].lstrip('.')}" if candidates else f".{meta['primary_ext'].lstrip('.')}"
        install_last_step = (
            "3. Find the imported world in your Worlds list and open it."
            if package_format == ".mcworld"
            else "3. If the package contains a pack that must be enabled separately, activate it in your world's settings."
        )
        content = (
            f"# {clean_name}\n\n"
            f"Download the current release of **{clean_name}** for Minecraft Bedrock Edition.\n\n"
            f"## Download\n\n"
            f"- **Package format:** `{package_format}`\n"
            f"- **Direct download:** [{label}]({url})\n\n"
            f"## Installation\n\n"
            f"1. Download the package using the link above.\n"
            f"2. Open the downloaded file with Minecraft to import it.\n"
            f"{install_last_step}\n\n"
            f"## Pack Information\n\n"
            f"For gameplay features, usage details, compatibility notes, and other project information, read the [full description]({description_url}).\n"
        )
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(content)

    if os.path.isfile(description_path):
        with open(description_path, "r", encoding="utf-8") as f:
            description = apply_description_policy(f.read(), addon=category == "Addons")
        description = re.sub(
            r"(?m)^(# .+?) \(v\d+\.\d+\.\d+(?:\.\d+)?\)(?= — |$)",
            r"\1",
            description,
            count=1,
        )
        with open(description_path, "w", encoding="utf-8") as f:
            f.write(description)
        write_download_readme()
        print(f"  [Auto-Fix] Preserved DESCRIPTION.md and refreshed download-only README for {slug}")
        return
    elif os.path.isfile(readme_path):
        # Migrate existing product information instead of discarding it.
        with open(readme_path, "r", encoding="utf-8") as f:
            old_readme = f.read()
        if len(old_readme.strip()) > 500 and GAMEPLAY_HEADING_REGEX.search(old_readme):
            old_readme = re.sub(
                r"(?m)^(# .+?) \(v\d+\.\d+\.\d+(?:\.\d+)?\)(?= — |$)",
                r"\1",
                old_readme,
                count=1,
            )
            with open(description_path, "w", encoding="utf-8") as f:
                f.write(apply_description_policy(old_readme, addon=category == "Addons") + "\n")
            write_download_readme()
            print(f"  [Auto-Fix] Moved existing product information into DESCRIPTION.md for {slug}")
            return

    feature_cards = []
    for feature in features:
        feature = re.sub(r"\bminecraft:[a-z0-9_]+", lambda m: m.group(0).split(":", 1)[1].replace("_", " ").title(), feature, flags=re.IGNORECASE)
        feature = feature.replace("Script API", "in-game interactions")
        title = feature.strip().rstrip(".")
        feature_cards.append(f"### {title}\n- **What Happens**: {feature}")
    if not feature_cards:
        feature_cards.append("### Included Gameplay\n- **What Happens**: Review the included features and pack settings for the exact behavior provided.")

    feature_section = "\n\n".join(feature_cards)
    interaction_cards = []
    for action, requirement, result in interactions:
        requirement = re.sub(r"\bminecraft:[a-z0-9_]+", lambda m: m.group(0).split(":", 1)[1].replace("_", " ").title(), requirement, flags=re.IGNORECASE)
        interaction_cards.append(f"### {action}\n- **Requirement**: {requirement}\n- **What Happens**: {result}")
    interaction_section = "\n\n".join(interaction_cards) if interaction_cards else "Use the in-game interactions provided by the add-on. Refer to the included pack settings and item descriptions for supported controls."

    achievement = "Likely achievement-friendly." if category == "Addons" else "Unknown / needs confirmation."
    project_type = {
        "Addons": "add-on",
        "Maps": "map",
        "Script": "script pack",
        "Minigame": "minigame",
    }.get(category, "pack")
    badges = "\n".join(DESCRIPTION_BADGES)
    content = f"""# {clean_name} — Minecraft Bedrock {project_type.title()}

**By ALNStudios**

{badges}

**A player-focused Minecraft Bedrock {project_type}.**

> {clean_name} adds gameplay behavior to Minecraft Bedrock Edition. The feature list below is based on inspected project files; confirm world-specific requirements in the target game.

## Overview

Explore the verified gameplay and interactions described in the feature cards below.

## Key Features

{feature_section}

## How to Use

{interaction_section}

## Compatibility

- Minecraft Bedrock Edition: {meta["min_engine"]} or newer.
- Experimental features: Not verified.
- Achievements: {achievement}
- Verification: Source created, not tested in game.

## Creator and Permissions

- Creator: ALNStudios
- Profiles: [CurseForge Profile](https://www.curseforge.com/members/allenscreations/projects) · [MCPEDL Profile](https://mcpedl.com/user/alnstudios/)

## Guidelines and Attribution

- Creator: ALNStudios
- Rights & Reservation: All rights reserved for ALNStudios.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to ALNStudios.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.
- Disclaimer: This is an unofficial community creation. It is not an official Minecraft product and is not approved by or associated with Mojang or Microsoft.

---

© All rights reserved for ALNStudios.

---

## Search & Discovery Keywords

Minecraft Bedrock add-on, {clean_name.lower()} Bedrock mod, Minecraft PE survival, MCPEDL add-on, CurseForge Bedrock, ALNStudios.
"""
    # The validator requires the clickable CurseForge/MCPEDL listing images in "Creator and
    # Permissions"; apply the same policy the standardizer uses so generated text passes its own check.
    content = apply_description_policy(content, addon=(category == "Addons")).rstrip("\n") + "\n"
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(content)

    write_download_readme()

    print(f"  [Auto-Fix] Successfully generated product documentation for {slug}")


def main():
    parser = argparse.ArgumentParser(
        description="MCPE-Curseforges — README/DESCRIPTION Documentation Status Audit & Generator (/checkrm)"
    )
    parser.add_argument(
        "--project",
        help="Audit a specific project directory name (e.g. Immortal-Pets).",
    )
    parser.add_argument("--fix", action="store_true", help=argparse.SUPPRESS)
    parser.add_argument(
        "--remake",
        choices=("standardize", "rebuild"),
        help="Remake README.md, DESCRIPTION.md and CHANGELOG.md for --project or --all (see scripts/remake_docs.py). standardize keeps existing text; rebuild regenerates add-on docs from source files.",
    )
    parser.add_argument("--docs", default="all", help="With --remake: readme, description, changelog, or all (comma separated).")
    parser.add_argument("--all", action="store_true", help="With --remake: every project.")
    parser.add_argument("--check", action="store_true", help="With --remake: report changes without writing.")
    parser.add_argument("--confirm-rebuild", action="store_true", help="With --remake rebuild --all: confirm replacing every add-on DESCRIPTION.md and README.md.")
    args = parser.parse_args()

    if args.fix:
        parser.error("--fix was removed; use --remake standardize to preserve existing copy.")

    if args.remake:
        sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
        import remake_docs
        sys.exit(remake_docs.run(args))

    projects = scan_projects(target_project=args.project)
    print("=" * 70)
    print("MCPE-Curseforges — README/DESCRIPTION Documentation Status Audit (/checkrm)")
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
        print(f"\n[WARNING] Found {len(broken_links)} broken relative link(s) across {total_rms} README/DESCRIPTION files:")
        for rel_rm, text, target, unquoted in broken_links:
            print(f"  - In {rel_rm}: [{text}]({target})")
    else:
        print(f"[LINK INTEGRITY] All relative links valid across {total_rms} README/DESCRIPTION files.")
    print("=" * 70)

if __name__ == "__main__":
    main()
