#!/usr/bin/env python3
"""
Manage Add-on Lifecycle Status (Testing / Finished) for MCPE-Curseforges.

- testing:  Add-on remains unchanged in MCPEDL/new_addons/.
- finished: Promotes the add-on from MCPEDL/new_addons/ to MCPEDL/addons/,
            updates category and root catalogs, rebuilds packages, and verifies documentation.
"""

import os
import sys
import shutil
import json
import glob
import argparse
import re
import subprocess
import urllib.parse
from pathlib import Path

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
NEW_ADDONS_DIR = os.path.join(REPO_ROOT, "MCPEDL", "new_addons")
ADDONS_DIR = os.path.join(REPO_ROOT, "MCPEDL", "addons")
ROOT_README = os.path.join(REPO_ROOT, "README.md")
BUILDS_DIR = os.path.join(REPO_ROOT, "builds")


def list_new_addons():
    """Returns a list of directory names inside MCPEDL/new_addons/."""
    if not os.path.isdir(NEW_ADDONS_DIR):
        return []
    return sorted([
        d for d in os.listdir(NEW_ADDONS_DIR)
        if os.path.isdir(os.path.join(NEW_ADDONS_DIR, d)) and not d.startswith(".")
    ])


def list_addons():
    """Returns a list of directory names inside MCPEDL/addons/."""
    if not os.path.isdir(ADDONS_DIR):
        return []
    return sorted([
        d for d in os.listdir(ADDONS_DIR)
        if os.path.isdir(os.path.join(ADDONS_DIR, d)) and not d.startswith(".")
    ])


def find_addon(query, directory=NEW_ADDONS_DIR):
    """Finds matching addon directory in specified directory (defaults to new_addons)."""
    if not os.path.isdir(directory):
        return None
    available = sorted([
        d for d in os.listdir(directory)
        if os.path.isdir(os.path.join(directory, d)) and not d.startswith(".")
    ])
    if not available:
        return None

    # Exact match
    if query in available:
        return query

    # Normalized match (ignore case, spaces, underscores, dashes)
    norm = lambda s: re.sub(r"[-_\s]+", "", s.strip().lower())
    q_norm = norm(query)

    for a in available:
        if norm(a) == q_norm:
            return a

    # Partial match
    for a in available:
        if q_norm in norm(a):
            return a

    return None


def get_clean_title(addon_path):
    """Extracts clean display title from project README or folder name."""
    readme_path = os.path.join(addon_path, "README.md")
    if os.path.isfile(readme_path):
        try:
            with open(readme_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line.startswith("# "):
                        title_part = line[2:].strip()
                        for sep in (" — ", " - ", " -- "):
                            if sep in title_part:
                                title_part = title_part.split(sep)[0].strip()
                        title_part = title_part.replace(" Challenge", "").strip()
                        title_clean = re.sub(r'[\\/*?:"<>|]', "", title_part).strip()
                        if title_clean:
                            title_clean = re.sub(r"\s+(?:BP|RP)$", "", title_clean).strip()
                            return title_clean
        except Exception:
            pass
    slug = os.path.basename(addon_path)
    return slug.replace("-", " ").replace("_", " ").title()


def get_addon_metadata(addon_path):
    """Extracts metadata from manifest.json files in the addon directory."""
    slug = os.path.basename(addon_path)
    manifests = sorted(glob.glob(os.path.join(addon_path, "**/manifest.json"), recursive=True))

    display_name = get_clean_title(addon_path)
    description = "Minecraft Bedrock add-on."
    version_str = "1.0.0"

    has_bp = os.path.isdir(os.path.join(addon_path, "behavior_pack"))
    has_rp = os.path.isdir(os.path.join(addon_path, "resource_pack"))

    for m in manifests:
        try:
            with open(m, "r", encoding="utf-8") as f:
                data = json.load(f)
        except (OSError, json.JSONDecodeError):
            continue

        hdr = data.get("header", {})
        if hdr.get("description") and description == "Minecraft Bedrock add-on.":
            description = hdr["description"]
        if isinstance(hdr.get("version"), list):
            version_str = ".".join(str(v) for v in hdr["version"])

        modules = data.get("modules", [])
        for mod in modules:
            m_type = mod.get("type", "")
            if m_type in ("data", "script", "client_data", "resources"):
                if m_type in ("data", "script"):
                    has_bp = True
                elif m_type in ("client_data", "resources"):
                    has_rp = True

    primary_ext = "mcaddon" if (has_bp and has_rp) else "mcpack"

    # Find build file if available
    build_dir = os.path.join(BUILDS_DIR, slug)
    build_file = f"{slug.replace('-', '_')}_AllensCreations.{primary_ext}"
    if os.path.isdir(build_dir):
        pkg_files = [
            f for f in os.listdir(build_dir)
            if f.endswith((".mcaddon", ".mcpack", ".mcworld"))
        ]
        if pkg_files:
            preferred = [f for f in pkg_files if f.endswith(f".{primary_ext}")]
            if preferred:
                bundle = [f for f in preferred if " BP " not in f and " RP " not in f]
                build_file = sorted(bundle)[0] if bundle else sorted(preferred)[0]
            else:
                build_file = sorted(pkg_files)[0]

            if build_file.endswith(".mcaddon"):
                primary_ext = "mcaddon"
            elif build_file.endswith(".mcpack"):
                primary_ext = "mcpack"
            elif build_file.endswith(".mcworld"):
                primary_ext = "mcworld"

    return {
        "slug": slug,
        "name": display_name,
        "description": description.replace("\r", " ").replace("\n", " ").strip(),
        "version": version_str,
        "primary_ext": primary_ext,
        "build_file": build_file,
    }


def clean_table_val(val):
    return str(val).replace("|", "\\|").replace("\r", " ").replace("\n", " ").strip()


def rebuild_new_addons_readme():
    """Regenerates MCPEDL/new_addons/README.md based on remaining directories."""
    readme_path = os.path.join(NEW_ADDONS_DIR, "README.md")
    addons = list_new_addons()

    rows = []
    for slug in addons:
        addon_dir = os.path.join(NEW_ADDONS_DIR, slug)
        meta = get_addon_metadata(addon_dir)

        # Build download links
        build_dir = os.path.join(BUILDS_DIR, slug)
        package_links = []
        if os.path.isdir(build_dir):
            for pkg in sorted(os.listdir(build_dir)):
                if pkg.endswith((".mcpack", ".mcaddon", ".zip", ".mcworld")):
                    quoted_pkg = urllib.parse.quote(pkg)
                    url = f"https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/{slug}/{quoted_pkg}"
                    package_links.append(f"[{pkg}]({url})")

        quoted_build = urllib.parse.quote(meta['build_file'])
        ext = meta['primary_ext'].upper()
        download_url = f"https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/{slug}/{quoted_build}"

        clean_name = meta['name'].replace(" BP by AllensCreations", "").replace(" RP by AllensCreations", "").replace(" by AllensCreations", "").replace(" BP", "").replace(" RP", "").strip()

        row = (
            f"| {clean_table_val(clean_name)} | "
            f"{clean_table_val(meta['version'])} | "
            f"[Source]({slug}/) | "
            f"[{ext}]({download_url}) |"
        )
        rows.append(row)

    table_content = "\n".join(rows) if rows else "| *No add-ons currently in testing.* | | | |"

    content = f"""# New Add-ons

Source files for newly generated Minecraft Bedrock add-ons by AllensCreations.

## Available Add-ons

| Add-on | Version | Source | Download |
| :--- | :--- | :--- | :--- |
{table_content}

The catalog is automatically updated by the add-on generation workflow.

## Attribution

Created by AllensCreations. All rights reserved.

Videos and streams are welcome with credit. Redistribution of original or modified files without permission is prohibited.

## Related Directories

- [Existing Add-ons](../addons/README.md)
- [Scripts and Minigames](../script/README.md)
"""
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(content)
    print("  [Catalog] Updated MCPEDL/new_addons/README.md")


def update_addons_catalog(meta):
    """Adds or updates the add-on in MCPEDL/addons/README.md."""
    readme_path = os.path.join(ADDONS_DIR, "README.md")
    if not os.path.isfile(readme_path):
        return

    with open(readme_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    slug = meta["slug"]
    display = meta["name"]
    desc = meta["description"]
    ver = meta["version"]
    primary_ext = meta["primary_ext"]
    build_file = meta["build_file"]

    ext = primary_ext.upper()
    clean_display = display.replace(" BP by AllensCreations", "").replace(" RP by AllensCreations", "").replace(" by AllensCreations", "").replace(" BP", "").replace(" RP", "").strip()
    quoted_file = urllib.parse.quote(build_file)
    gh_dl = f"https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/{slug}/{quoted_file}"
    new_row = (
        f"| {clean_table_val(clean_display)} | {clean_table_val(ver)} "
        f"| [Source]({slug}/) "
        f"| [{ext}]({gh_dl}) |\n"
    )

    slug_pattern = f"({slug}/)"
    existing_idx = next((i for i, l in enumerate(lines) if slug_pattern in l), None)

    if existing_idx is not None:
        lines[existing_idx] = new_row
    else:
        # Insert before end of the table
        sep_idx = next(
            (i for i, l in enumerate(lines) if re.match(r"\|\s*:?-+:?\s*\|", l)),
            None
        )
        if sep_idx is not None:
            last_row_idx = sep_idx
            for i in range(sep_idx + 1, len(lines)):
                if lines[i].strip().startswith("|") and lines[i].strip().endswith("|"):
                    last_row_idx = i
                else:
                    break
            lines.insert(last_row_idx + 1, new_row)
        else:
            lines.append(new_row)

    with open(readme_path, "w", encoding="utf-8") as f:
        f.writelines(lines)
    print("  [Catalog] Updated MCPEDL/addons/README.md")


def update_root_readme(slug):
    """Replaces MCPEDL/new_addons references with MCPEDL/addons in root README.md."""
    if not os.path.isfile(ROOT_README):
        return

    with open(ROOT_README, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = content.replace(
        f"MCPEDL/new_addons/{slug}/", f"MCPEDL/addons/{slug}/"
    ).replace(
        f"MCPEDL/new_addons/{slug}", f"MCPEDL/addons/{slug}"
    )

    if new_content != content:
        with open(ROOT_README, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"  [Catalog] Updated root README.md links for {slug}")


def update_build_readme(slug):
    """Updates internal source link in builds/<slug>/README.md."""
    readme_path = os.path.join(BUILDS_DIR, slug, "README.md")
    if not os.path.isfile(readme_path):
        return

    with open(readme_path, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = content.replace(
        f"MCPEDL/new_addons/{slug}/", f"MCPEDL/addons/{slug}/"
    ).replace(
        f"MCPEDL/new_addons/{slug}", f"MCPEDL/addons/{slug}"
    )

    if new_content != content:
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"  [Build] Updated source link in builds/{slug}/README.md")


def update_addon_inner_readme(addon_target_dir):
    """Cleans up internal new_addons links inside the addon's own README.md."""
    readme_path = os.path.join(addon_target_dir, "README.md")
    if not os.path.isfile(readme_path):
        return

    with open(readme_path, "r", encoding="utf-8") as f:
        content = f.read()

    new_content = content.replace("new_addons", "addons")
    if new_content != content:
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"  [Addon] Cleaned internal README.md in {os.path.basename(addon_target_dir)}")


def sync_workflow_choices():
    """Keeps the choice options in .github/workflows/manage-addon-status.yml synchronized with new_addons."""
    workflow_path = os.path.join(REPO_ROOT, ".github", "workflows", "manage-addon-status.yml")
    if not os.path.isfile(workflow_path):
        return

    addons = list_new_addons()
    options_lines = [f"          - \"{a}\"" for a in addons] if addons else ["          - \"none\""]
    options_block = "\n".join(options_lines)

    with open(workflow_path, "r", encoding="utf-8") as f:
        content = f.read()

    pattern = re.compile(
        r"(addon:\s*\n\s*description:[^\n]+\n\s*required:[^\n]+\n\s*type:\s*choice\s*\n\s*options:\s*\n)(?:\s*-\s*[^\n]+\n)+",
        re.MULTILINE
    )

    if pattern.search(content):
        new_content = pattern.sub(r"\g<1>" + options_block + "\n", content)
        if new_content != content:
            with open(workflow_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print("  [Workflow] Synchronized add-on choices in manage-addon-status.yml")


def handle_testing(slug):
    """Handles 'testing' status label."""
    addon_dir = os.path.join(NEW_ADDONS_DIR, slug)
    meta = get_addon_metadata(addon_dir)

    print("=" * 70)
    print(f"Add-on Lifecycle Status: TESTING")
    print(f"Add-on:      {meta['name']} ({slug})")
    print(f"Version:     {meta['version']}")
    print(f"Location:    MCPEDL/new_addons/{slug}")
    print(f"Status:      Retained unchanged under MCPEDL/new_addons/ for testing.")
    print("=" * 70)
    return True


def handle_finished(slug, dry_run=False):
    """Handles 'finished' status label — promotes addon from new_addons to addons."""
    src_dir = os.path.join(NEW_ADDONS_DIR, slug)
    dst_dir = os.path.join(ADDONS_DIR, slug)

    if os.path.exists(dst_dir):
        print(f"Error: Destination already exists: {dst_dir}", file=sys.stderr)
        return False

    meta = get_addon_metadata(src_dir)

    print("=" * 70)
    print(f"Add-on Lifecycle Status: FINISHED (PROMOTION)")
    print(f"Add-on:      {meta['name']} ({slug})")
    print(f"Version:     {meta['version']}")
    print(f"Moving:      MCPEDL/new_addons/{slug} -> MCPEDL/addons/{slug}")
    print("=" * 70)

    if dry_run:
        print("[Dry Run] Skipping file moves and catalog writes.")
        return True

    # Move directory
    shutil.move(src_dir, dst_dir)
    print(f"  [Move] Moved {slug} to MCPEDL/addons/{slug}")

    # Update catalogs and directories
    rebuild_new_addons_readme()
    update_addons_catalog(meta)
    update_root_readme(slug)
    update_build_readme(slug)
    update_addon_inner_readme(dst_dir)
    sync_workflow_choices()

    # Sync package and check README status
    auto_bump_script = os.path.join(REPO_ROOT, "scripts", "auto_bump_and_build.py")
    if os.path.isfile(auto_bump_script):
        print("  [Build] Synchronizing build package & catalogs...")
        subprocess.run(
            [sys.executable, auto_bump_script, "--project", slug, "--no-bump"],
            cwd=REPO_ROOT,
            check=False,
        )

    check_status_script = os.path.join(REPO_ROOT, "scripts", "check_readme_status.py")
    if os.path.isfile(check_status_script):
        print("  [Audit] Running README status audit...")
        subprocess.run([sys.executable, check_status_script], cwd=REPO_ROOT, check=False)

    print("=" * 70)
    print(f"Success: {slug} has been promoted to MCPEDL/addons/ (finished).")
    print("=" * 70)
    return True


def main():
    parser = argparse.ArgumentParser(
        description="Manage add-on lifecycle status (testing / finished)."
    )
    parser.add_argument(
        "--addon",
        help="Name of the add-on folder in MCPEDL/new_addons/ (e.g. tameable-companion-fox).",
    )
    parser.add_argument(
        "--status",
        choices=["testing", "finished"],
        default="testing",
        help="Lifecycle status label: 'testing' (unchanged in new_addons) or 'finished' (moved to addons).",
    )
    parser.add_argument(
        "--list",
        action="store_true",
        help="List all add-ons currently in MCPEDL/new_addons/.",
    )
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Preview changes without modifying filesystem.",
    )

    args = parser.parse_args()

    available = list_new_addons()

    if args.list:
        print("Add-ons currently in MCPEDL/new_addons/:")
        if not available:
            print("  (None found)")
        for a in available:
            meta = get_addon_metadata(os.path.join(NEW_ADDONS_DIR, a))
            print(f"  - {a} (Name: {meta['name']}, v{meta['version']})")
        return

    if not args.addon:
        print("Error: --addon is required unless --list is passed.", file=sys.stderr)
        if available:
            print(f"Available new_addons: {', '.join(available)}", file=sys.stderr)
        sys.exit(1)

    if args.addon.strip().lower() == "none":
        print("No add-on selected (new_addons is currently empty).")
        return

    matched_slug = find_addon(args.addon, NEW_ADDONS_DIR)
    if not matched_slug:
        # Check if already promoted in MCPEDL/addons/
        already_promoted = find_addon(args.addon, ADDONS_DIR)
        if already_promoted:
            print("=" * 70)
            print(f"Notice: Add-on '{already_promoted}' is already in MCPEDL/addons/ (finished status).")
            print("=" * 70)
            if args.status == "finished":
                meta = get_addon_metadata(os.path.join(ADDONS_DIR, already_promoted))
                update_addons_catalog(meta)
                update_root_readme(already_promoted)
                update_build_readme(already_promoted)
                sync_workflow_choices()
                print("  [Sync] Catalogs and directory READMEs verified and synchronized.")
            return

        print(f"Error: Add-on '{args.addon}' not found in MCPEDL/new_addons/.", file=sys.stderr)
        if available:
            print(f"Available new_addons: {', '.join(available)}", file=sys.stderr)
        else:
            print("No add-ons currently waiting in MCPEDL/new_addons/.", file=sys.stderr)
        sys.exit(1)

    if args.status == "testing":
        handle_testing(matched_slug)
    elif args.status == "finished":
        success = handle_finished(matched_slug, dry_run=args.dry_run)
        if not success:
            sys.exit(1)


if __name__ == "__main__":
    main()
