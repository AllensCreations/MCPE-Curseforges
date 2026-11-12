#!/usr/bin/env python3
"""Delete Package: remove one package from MCPEDL/ and everything that depends on it.

  python3 scripts/delete_project.py --package Immortal-Pets --confirm yes
  python3 scripts/delete_project.py --package Addons/Immortal-Pets --confirm yes --dry-run
  python3 scripts/delete_project.py --package MCPEDL/Maps/Oneblock-SM --confirm yes

--package accepts the bare name, <Category>/<Name> or MCPEDL/<Category>/<Name> (any letter case).

Removed together with the package (the "affected things"):
  1. MCPEDL/<Category>/<Name>/            source, docs, changelog, world archives
  2. builds/<Name>/                       packages, versions/, build_info.json, build README
  3. changelog_views/<Name>.*             generated GitHub and CurseForge changelog views
  4. builds/Curseforge_IDs.json           the pack's saved CurseForge project ID and versions
  5. Catalog rows and overview sections   category README, builds/README.md, README.md,
                                          Mcpeworlds/README.md
  6. Collection Size badge                root README.md
  7. Publish dropdown                     "Registered pack" list of publish-curseforge.yml
Anything else that still mentions the package is reported as a warning (never edited blindly).
"""

import argparse
import json
import os
import re
import shutil
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

MCPEDL_DIR = os.path.join(REPO_ROOT, "MCPEDL")
BUILDS_DIR = os.path.join(REPO_ROOT, "builds")
VIEWS_DIR = os.path.join(REPO_ROOT, "changelog_views")
ROOT_README = os.path.join(REPO_ROOT, "README.md")
BUILDS_README = os.path.join(BUILDS_DIR, "README.md")
WORLDS_README = os.path.join(REPO_ROOT, "Mcpeworlds", "README.md")
REGISTRY = os.path.join(BUILDS_DIR, "Curseforge_IDs.json")

VALID_TYPES = ["addons", "maps", "script", "minigame"]
CATEGORY_DIRS = {"addons": "Addons", "maps": "Maps", "script": "Script", "minigame": "Minigame"}
CATEGORY_MAP = {key: os.path.join(MCPEDL_DIR, name) for key, name in CATEGORY_DIRS.items()}

SCAN_SUFFIXES = (".md", ".json", ".yml", ".yaml", ".py", ".txt", ".mcfunction", ".html")
SCAN_SKIP_DIRS = {".git", "node_modules", "__pycache__", "versions"}
MAX_SCAN_BYTES = 2 * 1024 * 1024
MAX_WARNINGS = 30


# ─────────────────────────────────────────────────────────────────────────────
# Finding the package
# ─────────────────────────────────────────────────────────────────────────────

def list_projects_in_category(cat_key):
    """Lists project folders in a category."""
    cat_dir = CATEGORY_MAP.get(cat_key)
    if not cat_dir or not os.path.isdir(cat_dir):
        return []
    return sorted(
        d for d in os.listdir(cat_dir)
        if os.path.isdir(os.path.join(cat_dir, d)) and not d.startswith(".")
    )


def all_packages():
    return [(key, slug) for key in VALID_TYPES for slug in list_projects_in_category(key)]


def resolve_package(text):
    """'Name', 'Addons/Name' or 'MCPEDL/Addons/Name' (any case) -> (type_key, exact slug)."""
    raw = (text or "").strip().replace("\\", "/")
    while raw.startswith("./"):
        raw = raw[2:]
    raw = raw.strip("/")
    if raw.lower().startswith("mcpedl/"):
        raw = raw[len("mcpedl/"):]
    if not raw:
        raise ValueError("No package given.")
    parts = raw.split("/")
    if any(part in ("", ".", "..") for part in parts) or len(parts) > 2:
        raise ValueError(f"Invalid package '{text}'. Use Name, Category/Name or MCPEDL/Category/Name.")

    if len(parts) == 2:
        wanted_type = next((k for k, v in CATEGORY_DIRS.items() if v.lower() == parts[0].lower() or k == parts[0].lower()), None)
        if not wanted_type:
            raise ValueError(f"Unknown category '{parts[0]}'. Valid: {', '.join(CATEGORY_DIRS.values())}.")
        candidates = [(wanted_type, s) for s in list_projects_in_category(wanted_type) if s.lower() == parts[1].lower()]
    else:
        candidates = [(k, s) for k, s in all_packages() if s.lower() == parts[0].lower()]

    if not candidates:
        names = ", ".join(f"{CATEGORY_DIRS[k]}/{s}" for k, s in all_packages()) or "(none)"
        raise ValueError(f"Package '{text}' was not found in MCPEDL/. Available: {names}")
    exact = [c for c in candidates if c[1] == parts[-1]]
    candidates = exact or candidates
    if len(candidates) > 1:
        names = ", ".join(f"MCPEDL/{CATEGORY_DIRS[k]}/{s}" for k, s in candidates)
        raise ValueError(f"'{text}' matches more than one package ({names}). Give the full path.")
    return candidates[0]


def package_title(project_dir, slug):
    """The player-facing title the catalogs use (same logic as the builder)."""
    try:
        import auto_bump_and_build as builder
        return builder.get_project_title(project_dir)
    except Exception:
        return slug.replace("-", " ").replace("_", " ").title()


# ─────────────────────────────────────────────────────────────────────────────
# Catalog cleanup
# ─────────────────────────────────────────────────────────────────────────────

def _read(path):
    with open(path, "r", encoding="utf-8") as fh:
        return fh.read()


def _write(path, text):
    with open(path, "w", encoding="utf-8", newline="") as fh:
        fh.write(text)


def row_is_for_package(line, category_name, slug, title):
    """True for a Markdown table row that belongs to this package."""
    stripped = line.strip()
    if not stripped.startswith("|"):
        return False
    if any(token in line for token in (
        f"/{slug}/", f"/{slug})", f"({slug}/)", f"[`{slug}/`]", f"**{slug}**",
        f"builds/{slug}", f"MCPEDL/{category_name}/{slug}",
    )):
        return True
    if title:
        first_cell = stripped.strip("|").split("|", 1)[0].strip().strip("*").strip()
        if first_cell.lower() == title.lower():
            return True
    return False


def clean_table_rows(path, category_name, slug, title, removed):
    """Drop this package's rows from a README table."""
    if not os.path.isfile(path):
        return
    lines = _read(path).splitlines(keepends=True)
    kept = [ln for ln in lines if not row_is_for_package(ln, category_name, slug, title)]
    if len(kept) != len(lines):
        _write(path, "".join(kept))
        removed.append(f"{os.path.relpath(path, REPO_ROOT)}: {len(lines) - len(kept)} catalog row(s)")
        print(f"  [Catalog] Cleaned {os.path.relpath(path, REPO_ROOT)}")


def clean_root_overview(slug, title, removed):
    """Remove the package's detail section ('### ...' heading naming it) from the root README."""
    if not os.path.isfile(ROOT_README):
        return
    text = _read(ROOT_README)
    lines = text.splitlines(keepends=True)
    names = [n for n in {slug, slug.replace("-", " "), title} if n]
    name_re = re.compile(r"(?<![\w-])(?:%s)(?![\w-])" % "|".join(re.escape(n) for n in names), re.IGNORECASE)
    out, i, dropped = [], 0, []
    while i < len(lines):
        line = lines[i]
        if re.match(r"^###\s+\S", line) and name_re.search(line):
            dropped.append(line.strip())
            i += 1
            while i < len(lines) and not re.match(r"^#{1,3}\s", lines[i]):
                i += 1
            continue
        out.append(line)
        i += 1
    if dropped:
        new_text = re.sub(r"(?:^---[ \t]*\n[ \t]*\n?){2,}", "---\n\n", "".join(out), flags=re.MULTILINE)
        _write(ROOT_README, new_text)
        for heading in dropped:
            print(f"  [Overview] Removed section '{heading}'")
        removed.append(f"README.md: {len(dropped)} overview section(s)")


def update_collection_badge(removed=None):
    """Rewrite the Collection Size badge (same format the builder writes)."""
    if not os.path.isfile(ROOT_README):
        return
    counts = {key: len(list_projects_in_category(key)) for key in VALID_TYPES}
    badge = (
        "[![Collection Size](https://img.shields.io/badge/Collection-"
        f"{counts['addons']}%20Add--ons%20%7C%20{counts['maps']}%20Maps%20%7C%20"
        f"{counts['script']}%20Scripts%20%7C%20{counts['minigame']}%20Minigames"
        "-orange?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)"
    )
    content = _read(ROOT_README)
    updated = re.sub(r"\[!\[Collection Size\]\([^)]+\)\]\([^)]+\)", lambda _m: badge, content)
    if updated != content:
        _write(ROOT_README, updated)
        print(f"  [Badge] Collection Size -> {counts['addons']} Add-ons | {counts['maps']} Maps | "
              f"{counts['script']} Scripts | {counts['minigame']} Minigames")
        if removed is not None:
            removed.append("README.md: Collection Size badge")


def remove_registry_entry(category_name, slug, removed):
    """Remove builds/Curseforge_IDs.json entry (and any old per-pack info file goes with builds/<slug>)."""
    if not os.path.isfile(REGISTRY):
        return
    try:
        data = json.loads(_read(REGISTRY))
    except json.JSONDecodeError:
        print(f"  [Warning] {os.path.relpath(REGISTRY, REPO_ROOT)} is not valid JSON; left untouched.")
        return
    key = f"MCPEDL/{category_name}/{slug}"
    if isinstance(data, dict) and key in data:
        del data[key]
        _write(REGISTRY, json.dumps(dict(sorted(data.items())), indent=2) + "\n")
        removed.append(f"builds/Curseforge_IDs.json: {key}")
        print(f"  [Registry] Removed {key}")


def remove_changelog_views(slug, removed):
    if not os.path.isdir(VIEWS_DIR):
        return
    for name in sorted(os.listdir(VIEWS_DIR)):
        if name.startswith(slug + ".") and name[len(slug) + 1:] in ("github.md", "curseforge.html"):
            os.remove(os.path.join(VIEWS_DIR, name))
            removed.append(f"changelog_views/{name}")
            print(f"  [Deleted] changelog_views/{name}")


def sync_publish_dropdown():
    """Refresh the 'Registered pack' list in publish-curseforge.yml from the registry."""
    try:
        import sync_dispatch_choices
        sync_dispatch_choices.main([])
    except Exception as exc:  # never undo a finished deletion because of the dropdown
        print(f"  [Warning] Could not refresh the publish dropdown: {exc}", file=sys.stderr)


# ─────────────────────────────────────────────────────────────────────────────
# Leftover references (reported, not edited)
# ─────────────────────────────────────────────────────────────────────────────

def find_leftovers(category_name, slug):
    needles = (f"MCPEDL/{category_name}/{slug}", f"builds/{slug}", f"/{slug}/")
    hits = []
    for base, dirs, files in os.walk(REPO_ROOT):
        dirs[:] = [d for d in dirs if d not in SCAN_SKIP_DIRS]
        for name in files:
            path = os.path.join(base, name)
            if not name.lower().endswith(SCAN_SUFFIXES):
                continue
            try:
                if os.path.getsize(path) > MAX_SCAN_BYTES:
                    continue
                with open(path, "r", encoding="utf-8", errors="ignore") as fh:
                    for number, line in enumerate(fh, 1):
                        if any(n in line for n in needles):
                            hits.append(f"{os.path.relpath(path, REPO_ROOT)}:{number}")
                            break
            except OSError:
                continue
    return sorted(hits)


# ─────────────────────────────────────────────────────────────────────────────
# The deletion
# ─────────────────────────────────────────────────────────────────────────────

def delete_project(target_type, slug, dry_run=False):
    """Delete the package and every affected thing. Returns (ok, removed, warnings)."""
    cat_dir = CATEGORY_MAP.get(target_type)
    if not cat_dir:
        print(f"Error: Invalid target type '{target_type}'. Valid: {', '.join(VALID_TYPES)}", file=sys.stderr)
        return False, [], []
    if slug not in list_projects_in_category(target_type):
        print(f"Error: Package '{slug}' not found in {os.path.relpath(cat_dir, REPO_ROOT)}.", file=sys.stderr)
        return False, [], []

    category_name = CATEGORY_DIRS[target_type]
    project_dir = os.path.realpath(os.path.join(cat_dir, slug))
    if os.path.dirname(project_dir) != os.path.realpath(cat_dir):
        print(f"Error: Package path escapes its category folder: {slug!r}", file=sys.stderr)
        return False, [], []
    build_dir = os.path.join(BUILDS_DIR, slug)
    if os.path.islink(build_dir):
        print(f"Error: Refusing to delete symlinked build directory: {build_dir}", file=sys.stderr)
        return False, [], []

    title = package_title(project_dir, slug)
    print("=" * 70)
    print("Action:      DELETE PACKAGE")
    print(f"Package:     {slug}  ({title})")
    print(f"Category:    {category_name}")
    print(f"Source Dir:  {os.path.relpath(project_dir, REPO_ROOT)}")
    print(f"Build Dir:   {os.path.relpath(build_dir, REPO_ROOT) if os.path.isdir(build_dir) else '(none)'}")
    print("=" * 70)

    removed = []
    if dry_run:
        print("[Dry Run] Nothing is deleted. These would be removed:")
        print(f"  - MCPEDL/{category_name}/{slug}/")
        if os.path.isdir(build_dir):
            print(f"  - builds/{slug}/")
        for suffix in ("github.md", "curseforge.html"):
            if os.path.isfile(os.path.join(VIEWS_DIR, f"{slug}.{suffix}")):
                print(f"  - changelog_views/{slug}.{suffix}")
        print("  - its catalog rows, overview section, CurseForge registry entry and dropdown option")
        return True, removed, []

    shutil.rmtree(project_dir)
    removed.append(f"MCPEDL/{category_name}/{slug}/")
    print(f"  [Deleted] Source directory: MCPEDL/{category_name}/{slug}")

    if os.path.isdir(build_dir):
        shutil.rmtree(build_dir)
        removed.append(f"builds/{slug}/")
        print(f"  [Deleted] Build directory: builds/{slug}")

    remove_changelog_views(slug, removed)
    remove_registry_entry(category_name, slug, removed)

    clean_table_rows(os.path.join(cat_dir, "README.md"), category_name, slug, title, removed)
    clean_table_rows(BUILDS_README, category_name, slug, title, removed)
    clean_table_rows(ROOT_README, category_name, slug, title, removed)
    clean_table_rows(WORLDS_README, category_name, slug, title, removed)
    clean_root_overview(slug, title, removed)
    update_collection_badge(removed)
    sync_publish_dropdown()

    warnings = find_leftovers(category_name, slug)
    if warnings:
        print("\n[Warning] Other files still mention this package. Review them by hand:")
        for hit in warnings[:MAX_WARNINGS]:
            print(f"  - {hit}")
        if len(warnings) > MAX_WARNINGS:
            print(f"  ... and {len(warnings) - MAX_WARNINGS} more")

    print("\n[Delete Package] Completed successfully!")
    return True, removed, warnings


def write_summary(slug, category_name, removed, warnings, dry_run):
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not path:
        return
    with open(path, "a", encoding="utf-8") as fh:
        fh.write(f"## Delete Package: `{slug}`{' (dry run)' if dry_run else ''}\n\n")
        fh.write(f"Category: `{category_name}`\n\n")
        if removed:
            fh.write("**Removed**\n\n" + "".join(f"- {item}\n" for item in removed) + "\n")
        if warnings:
            fh.write("**Still mentioned elsewhere (review by hand)**\n\n")
            fh.write("".join(f"- `{hit}`\n" for hit in warnings[:MAX_WARNINGS]) + "\n")


def main(argv=None):
    parser = argparse.ArgumentParser(description="Delete a package and everything that depends on it.")
    parser.add_argument("--package", help="Name, Category/Name or MCPEDL/Category/Name")
    parser.add_argument("--type", choices=VALID_TYPES, help="(compat) category of --project")
    parser.add_argument("--project", help="(compat) exact folder name, used with --type")
    parser.add_argument("--confirm", default="no", choices=["yes", "no"], help="Safety confirmation")
    parser.add_argument("--dry-run", action="store_true", help="List what would be removed; change nothing")
    parser.add_argument("--sync-choices", action="store_true", help="Only refresh the publish dropdown")
    args = parser.parse_args(argv)

    if args.sync_choices:
        sync_publish_dropdown()
        return 0

    if args.confirm != "yes":
        print("Deletion aborted: confirmation was not 'yes'.")
        return 0

    try:
        if args.package:
            target_type, slug = resolve_package(args.package)
        elif args.type and args.project:
            target_type, slug = resolve_package(f"{CATEGORY_DIRS[args.type]}/{args.project}")
        else:
            parser.error("--package is required.")
    except ValueError as exc:
        print(f"::error::{exc}", file=sys.stderr)
        return 1

    ok, removed, warnings = delete_project(target_type, slug, dry_run=args.dry_run)
    if not ok:
        return 1
    write_summary(slug, CATEGORY_DIRS[target_type], removed, warnings, args.dry_run)

    github_output = os.environ.get("GITHUB_OUTPUT")
    if github_output and not args.dry_run:
        with open(github_output, "a", encoding="utf-8") as gh:
            gh.write(f"deleted_slug={slug}\n")
            gh.write(f"deleted_type={CATEGORY_DIRS[target_type]}\n")
    return 0


if __name__ == "__main__":
    sys.exit(main())
