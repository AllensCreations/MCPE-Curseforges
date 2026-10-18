#!/usr/bin/env python3
"""
Project Deletion & Catalog Cleanup Script for MCPE-Curseforges.

Deletes any project from MCPEDL/ (addons, new_addons, maps, script), cleans
its entry from category READMEs, master builds/README.md, and root README.md,
deletes its compiled build artifacts, updates collection badges, and keeps
workflow selection dropdowns synchronized.
"""

import os
import sys
import shutil
import re
import glob
import argparse

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
ROOT_README = os.path.join(REPO_ROOT, "README.md")
BUILDS_DIR = os.path.join(REPO_ROOT, "builds")
BUILDS_README = os.path.join(BUILDS_DIR, "README.md")
DELETE_WORKFLOW = os.path.join(REPO_ROOT, ".github", "workflows", "delete-project.yml")

VALID_TYPES = ["addons", "new_addons", "maps", "script"]

CATEGORY_MAP = {
    "addons": os.path.join(REPO_ROOT, "MCPEDL", "addons"),
    "new_addons": os.path.join(REPO_ROOT, "MCPEDL", "new_addons"),
    "maps": os.path.join(REPO_ROOT, "MCPEDL", "maps"),
    "script": os.path.join(REPO_ROOT, "MCPEDL", "script"),
}


def list_projects_in_category(cat_key):
    """Lists directories in given category."""
    cat_dir = CATEGORY_MAP.get(cat_key)
    if not cat_dir or not os.path.isdir(cat_dir):
        return []
    return sorted([
        d for d in os.listdir(cat_dir)
        if os.path.isdir(os.path.join(cat_dir, d)) and not d.startswith(".")
    ])


def update_collection_badge():
    """Rewrites the Collection Size badge in root README.md to reflect project counts."""
    if not os.path.isfile(ROOT_README):
        return

    maps_dir = CATEGORY_MAP["maps"]
    script_dir = CATEGORY_MAP["script"]
    addon_dirs = [
        d for d in glob.glob(os.path.join(REPO_ROOT, "MCPEDL", "*"))
        if os.path.isdir(d) and os.path.basename(d) not in ("maps", "script")
    ]
    n_addons = sum(
        len([p for p in glob.glob(os.path.join(ad, "*")) if os.path.isdir(p)])
        for ad in addon_dirs
    )
    n_maps = len([d for d in glob.glob(os.path.join(maps_dir, "*")) if os.path.isdir(d)])
    n_scripts = len([d for d in glob.glob(os.path.join(script_dir, "*")) if os.path.isdir(d)])

    with open(ROOT_README, "r", encoding="utf-8") as f:
        content = f.read()

    new_badge = (
        f"[![Collection Size](https://img.shields.io/badge/Collection-"
        f"{n_addons}%20Add--ons%20%7C%20{n_maps}%20Map%20%7C%20{n_scripts}%20Scripts"
        f"-orange?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)"
    )
    updated = re.sub(
        r"\[!\[Collection Size\]\([^)]+\)\]\([^)]+\)",
        new_badge,
        content,
    )
    if updated != content:
        with open(ROOT_README, "w", encoding="utf-8") as f:
            f.write(updated)
        print(f"  [Badge] Updated Collection Size badge -> {n_addons} Add-ons | {n_maps} Maps | {n_scripts} Scripts")


def clean_category_readme(cat_key, slug):
    """Removes table rows referencing slug in MCPEDL/<cat>/README.md."""
    cat_dir = CATEGORY_MAP.get(cat_key)
    if not cat_dir:
        return
    readme_path = os.path.join(cat_dir, "README.md")
    if not os.path.isfile(readme_path):
        return

    with open(readme_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    new_lines = []
    removed = False
    for line in lines:
        is_table_row = line.strip().startswith("|")
        matches_slug = (
            f"[`{slug}/`]" in line or
            f"({slug}/)" in line or
            f"/{slug}/" in line or
            f"**{slug}**" in line
        )
        if is_table_row and matches_slug:
            removed = True
            continue
        new_lines.append(line)

    # For new_addons, if no projects remain, restore placeholder
    if cat_key == "new_addons":
        remaining_projects = list_projects_in_category("new_addons")
        if not remaining_projects:
            has_placeholder = any("*No add-ons currently in testing.*" in l for l in new_lines)
            if not has_placeholder:
                for idx, line in enumerate(new_lines):
                    if line.startswith("| :---"):
                        new_lines.insert(idx + 1, "| *No add-ons currently in testing.* | | | | |\n")
                        break

    if removed or cat_key == "new_addons":
        with open(readme_path, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        print(f"  [Catalog] Cleaned {os.path.relpath(readme_path, REPO_ROOT)}")


def clean_builds_readme(slug):
    """Removes table row in builds/README.md."""
    if not os.path.isfile(BUILDS_README):
        return
    with open(BUILDS_README, "r", encoding="utf-8") as f:
        lines = f.readlines()

    new_lines = [
        line for line in lines
        if not (line.strip().startswith("|") and (f"/{slug}/" in line or f"[`{slug}/`]" in line or f"({slug}/)" in line))
    ]
    if len(new_lines) != len(lines):
        with open(BUILDS_README, "w", encoding="utf-8") as f:
            f.writelines(new_lines)
        print(f"  [Catalog] Cleaned {os.path.relpath(BUILDS_README, REPO_ROOT)}")


def clean_root_readme(cat_key, slug):
    """Removes catalog table row and detailed overview block from root README.md."""
    if not os.path.isfile(ROOT_README):
        return
    with open(ROOT_README, "r", encoding="utf-8") as f:
        content = f.read()

    # 1. Clean table row
    lines = content.splitlines(keepends=True)
    table_cleaned_lines = []
    for line in lines:
        is_table_row = line.strip().startswith("|")
        matches = (
            f"/{slug}/" in line or
            f"[`{slug}/`]" in line or
            f"({slug}/)" in line or
            f"/{slug})" in line or
            f"**{slug}**" in line
        )
        if is_table_row and matches:
            continue
        table_cleaned_lines.append(line)

    content = "".join(table_cleaned_lines)

    # 2. Clean detailed section block
    # Matches:
    # ### (Add-on|Map|Script)[^:]*: [^\n]*
    # ... up to \n---\n\n or next ### / ##
    pattern = re.compile(
        r"(\n###\s+[^\n]*\n[\s\S]*?(?=\n###|\n##|\Z))",
        re.MULTILINE
    )

    blocks = pattern.split(content)
    cleaned_blocks = []
    for block in blocks:
        if block.startswith("\n###"):
            # Check if this block refers to the deleted slug
            if f"/{slug}/" in block or f"/{slug}." in block or f"/{slug})" in block or f"`{slug}`" in block:
                print(f"  [Overview] Removed detail block for {slug}")
                continue
        cleaned_blocks.append(block)

    new_content = "".join(cleaned_blocks)
    # Clean redundant trailing horizontal dividers
    new_content = re.sub(r"(---\s*\n\s*){2,}", "---\n\n", new_content)

    if new_content != content:
        with open(ROOT_README, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(f"  [Catalog] Cleaned {os.path.relpath(ROOT_README, REPO_ROOT)}")


def sync_delete_workflow_choices():
    """Keeps dropdown choice options in delete-project.yml synchronized with disk."""
    if not os.path.isfile(DELETE_WORKFLOW):
        return

    addons = list_projects_in_category("addons")
    new_addons = list_projects_in_category("new_addons")
    maps = list_projects_in_category("maps")
    scripts = list_projects_in_category("script")

    def build_options_block(items):
        options = ["none"] + [it for it in items if it != "none"]
        return "\n".join([f"          - \"{it}\"" for it in options])

    with open(DELETE_WORKFLOW, "r", encoding="utf-8") as f:
        content = f.read()

    replacements = [
        ("addon_target", build_options_block(addons)),
        ("new_addon_target", build_options_block(new_addons)),
        ("map_target", build_options_block(maps)),
        ("script_target", build_options_block(scripts)),
    ]

    new_content = content
    for input_name, block in replacements:
        pattern = re.compile(
            rf"({input_name}:\s*\n\s*description:[^\n]+\n\s*required:[^\n]+\n\s*type:\s*choice\s*\n\s*options:\s*\n)(?:\s*-\s*[^\n]+\n)+",
            re.MULTILINE
        )
        new_content = pattern.sub(rf"\g<1>{block}\n", new_content)

    if new_content != content:
        with open(DELETE_WORKFLOW, "w", encoding="utf-8") as f:
            f.write(new_content)
        print("  [Workflow] Synchronized dropdown choices in delete-project.yml")


def delete_project(target_type, slug, dry_run=False):
    """Executes full project deletion across source, builds, catalogs, and badges."""
    cat_dir = CATEGORY_MAP.get(target_type)
    if not cat_dir:
        print(f"Error: Invalid target type '{target_type}'. Valid: {', '.join(VALID_TYPES)}", file=sys.stderr)
        return False

    project_dir = os.path.join(cat_dir, slug)
    if not os.path.isdir(project_dir):
        print(f"Error: Project '{slug}' not found in {os.path.relpath(cat_dir, REPO_ROOT)}.", file=sys.stderr)
        avail = list_projects_in_category(target_type)
        print(f"Available in '{target_type}': {', '.join(avail) if avail else '(none)'}", file=sys.stderr)
        return False

    build_dir = os.path.join(BUILDS_DIR, slug)

    print("=" * 70)
    print(f"Action:      DELETE PROJECT")
    print(f"Type:        {target_type}")
    print(f"Project:     {slug}")
    print(f"Source Dir:  {os.path.relpath(project_dir, REPO_ROOT)}")
    print(f"Build Dir:   {os.path.relpath(build_dir, REPO_ROOT) if os.path.isdir(build_dir) else '(none)'}")
    print("=" * 70)

    if dry_run:
        print("[Dry Run] Skipping deletions and file updates.")
        return True

    # 1. Remove source tree
    shutil.rmtree(project_dir)
    print(f"  [Deleted] Source directory: {os.path.relpath(project_dir, REPO_ROOT)}")

    # 2. Remove builds folder
    if os.path.isdir(build_dir):
        shutil.rmtree(build_dir)
        print(f"  [Deleted] Build directory: {os.path.relpath(build_dir, REPO_ROOT)}")

    # 3. Clean category README
    clean_category_readme(target_type, slug)

    # 4. Clean builds/README.md
    clean_builds_readme(slug)

    # 5. Clean root README.md
    clean_root_readme(target_type, slug)

    # 6. Update collection badge
    update_collection_badge()

    # 7. Sync workflow choices
    sync_delete_workflow_choices()

    print("\n[Delete Project] Completed successfully!")
    return True


def main():
    parser = argparse.ArgumentParser(description="Delete a project from MCPEDL collection.")
    parser.add_argument("--type", choices=VALID_TYPES, required=False, help="Category type of project")
    parser.add_argument("--project", help="Explicit project folder name (slug)")
    parser.add_argument("--addon", default="none", help="Selected addon from dropdown")
    parser.add_argument("--new-addon", default="none", help="Selected new_addon from dropdown")
    parser.add_argument("--map", default="none", help="Selected map from dropdown")
    parser.add_argument("--script", default="none", help="Selected script from dropdown")
    parser.add_argument("--confirm", default="yes", choices=["yes", "no"], help="Safety confirmation")
    parser.add_argument("--dry-run", action="store_true", help="Simulate deletion without changes")
    parser.add_argument("--sync-choices", action="store_true", help="Only synchronize workflow choice dropdowns")

    args = parser.parse_args()

    if args.sync_choices:
        sync_delete_workflow_choices()
        return

    if not args.type:
        parser.error("--type is required when performing deletion.")

    if args.confirm != "yes":
        print("Deletion aborted: confirmation was not 'yes'.")
        sys.exit(0)

    # Resolve target project slug
    slug = None
    if args.project:
        slug = args.project.strip()
    elif args.type == "addons" and args.addon != "none":
        slug = args.addon.strip()
    elif args.type == "new_addons" and args.new_addon != "none":
        slug = args.new_addon.strip()
    elif args.type == "maps" and args.map != "none":
        slug = args.map.strip()
    elif args.type == "script" and args.script != "none":
        slug = args.script.strip()

    if not slug or slug.lower() == "none":
        print(f"Error: No valid project selected for type '{args.type}'.", file=sys.stderr)
        avail = list_projects_in_category(args.type)
        print(f"Available options: {', '.join(avail) if avail else '(none)'}", file=sys.stderr)
        sys.exit(1)

    success = delete_project(args.type, slug, dry_run=args.dry_run)
    if not success:
        sys.exit(1)

    # Pass outputs to GitHub Actions if present
    github_output = os.environ.get("GITHUB_OUTPUT")
    if github_output:
        with open(github_output, "a", encoding="utf-8") as gh:
            gh.write(f"deleted_slug={slug}\n")
            gh.write(f"deleted_type={args.type}\n")


if __name__ == "__main__":
    main()
