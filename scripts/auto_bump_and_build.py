#!/usr/bin/env python3
"""
Auto Version Bumper, Package Builder, and Catalog Registrar for MCPE-Curseforges.

Features:
1. Detects release-worthy source/config/asset changes inside MCPEDL project directories.
2. Registers newly added projects when their source files are changed; does not sweep
   unrelated unregistered projects on ordinary pushes.
3. Increments semantic patch version (+0.0.1) in:
   - header.version: [x, y, z + 1]
   - modules[*].version: [x, y, z + 1]
   - cross-pack dependencies[*].version (matching sibling BP/RP UUIDs)
   - world_behavior_packs.json (if map)
4. Synchronizes version numbers in README.md files across:
   - Project Directory: <project_path>/README.md (Release badge & title)
   - Category Directory: MCPEDL/<category>/README.md (Catalog table row & download link)
   - Project Build Directory: builds/<project_name>/README.md (Direct downloads table)
   - Master Builds Directory: builds/README.md (Catalog table row & download link)
   - Root Catalog: README.md (Catalog tables, overview header & download links)
5. Standardizes output package filenames:
   "<Filename> by AllensCreations (V#.#.#).<ext>"
6. Injects new projects into catalog tables and updates Collection Size badge.
"""

import os
import re
import sys
import json
import glob
import zipfile
import subprocess
import shutil
import argparse
import urllib.parse

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
try:
    import make_pack_icon
except Exception as _exc:  # Pillow missing etc.
    make_pack_icon = None
    print(f"WARNING: pack icon helper unavailable: {_exc}", file=sys.stderr)

JUNK_DIRS = {"__pycache__", ".git", ".github"}
JUNK_FILES = {".ds_store", "thumbs.db", "desktop.ini", ".gitkeep"}


def is_junk(filename):
    low = filename.lower()
    return low in JUNK_FILES or low.endswith(("~", ".bak", ".tmp", ".orig", ".importing"))

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
GITHUB_RAW = "https://github.com/AllensCreations/MCPE-Curseforges/raw/main"

# Dirtbound participates in automatic source/version processing, but its .mcworld
# archives must only be rebuilt by the dedicated, test-gated world workflow.
TEST_GATED_WORLD_PROJECTS = {"OneBlock-Dirtbound-Kingdom-Beta"}

# ─────────────────────────────────────────────────────────────────────────────
# Git helpers
# ─────────────────────────────────────────────────────────────────────────────

def get_git_diff_files(base_ref=None):
    """Returns list of changed files relative to base_ref or HEAD~1."""
    cmd = ["git", "diff", "--name-only"]
    if base_ref:
        cmd.append(base_ref)
    else:
        status = subprocess.check_output(
            ["git", "status", "--porcelain"], cwd=REPO_ROOT, text=True
        )
        if status.strip():
            cmd = ["git", "diff", "--name-only", "HEAD"]
        else:
            try:
                subprocess.check_call(
                    ["git", "rev-parse", "HEAD~1"],
                    cwd=REPO_ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
                )
                cmd.append("HEAD~1")
            except subprocess.CalledProcessError:
                cmd.append("HEAD")

    res = subprocess.check_output(cmd, cwd=REPO_ROOT, text=True)
    return [f.strip() for f in res.splitlines() if f.strip()]


# ─────────────────────────────────────────────────────────────────────────────
# Project discovery
# ─────────────────────────────────────────────────────────────────────────────

def find_target_project_dirs():
    """Returns dict of project_dir -> category_path for all known categories."""
    projects = {}
    categories = [
        "MCPEDL/addons", "MCPEDL/new_addons", "MCPEDL/script", "MCPEDL/maps",
    ]
    mcpedl_dir = os.path.join(REPO_ROOT, "MCPEDL")
    if os.path.isdir(mcpedl_dir):
        for sub in sorted(os.listdir(mcpedl_dir)):
            subpath = os.path.join(mcpedl_dir, sub)
            if os.path.isdir(subpath):
                rel_cat = f"MCPEDL/{sub}"
                if rel_cat not in categories:
                    categories.append(rel_cat)
    for cat in categories:
        cat_path = os.path.join(REPO_ROOT, cat)
        if os.path.isdir(cat_path):
            for p in glob.glob(os.path.join(cat_path, "*")):
                if not os.path.isdir(p):
                    continue
                projects[p] = cat
    return projects


def is_version_worthy_source_file(project_path, changed_file):
    """
    Return True only for project source/config/assets that should trigger a release.

    Documentation, pack manifests, and generated archives are deliberately excluded:
    manifest versions are managed by this script, and README/changelog edits must
    never cause a release version to increment.
    """
    normalized = os.path.normpath(changed_file)
    absolute = os.path.abspath(os.path.join(REPO_ROOT, normalized))
    project_abs = os.path.abspath(project_path)

    try:
        relative = os.path.relpath(absolute, project_abs)
    except ValueError:
        return False

    if relative == os.pardir or relative.startswith(os.pardir + os.sep):
        return False

    basename = os.path.basename(relative).lower()
    # Manifests are handled separately by the pack builder. Keep pack-level
    # LOCK markers as distributable files so they are copied into exported packs.
    if basename == "manifest.json":
        return False

    # Markdown and common project documentation are not runtime source.
    if basename.endswith(".md") or basename in {
        "license", "license.txt", "license.md", "notice", "notice.txt",
        "contributing", "contributing.md", "security.md",
    }:
        return False

    # These are generated release artifacts, not source inputs.
    if os.path.splitext(basename)[1] in {".mcpack", ".mcaddon", ".mcworld", ".zip"}:
        return False

    # Files such as JS/TS, functions, JSON definitions, textures, models,
    # localization, structures, and other pack assets are source inputs.
    return True


def detect_changed_projects(changed_files, project_dirs):
    """Find projects with release-worthy source/config/asset changes only."""
    changed_projects = set()
    for changed_file in changed_files:
        for project_path in project_dirs:
            if is_version_worthy_source_file(project_path, changed_file):
                changed_projects.add(project_path)
                break
    return sorted(changed_projects)


def detect_unregistered_projects(project_dirs):
    """
    Returns list of (project_path, category) for projects that have no compiled
    build files yet OR do not appear in the root README catalog.
    """
    root_readme = os.path.join(REPO_ROOT, "README.md")
    root_content = ""
    if os.path.isfile(root_readme):
        with open(root_readme, encoding="utf-8") as f:
            root_content = f.read()

    unregistered = []
    for project_path, category in project_dirs.items():
        project_name = os.path.basename(project_path)
        build_dir = os.path.join(REPO_ROOT, "builds", project_name)

        has_build_files = os.path.isdir(build_dir) and bool(
            glob.glob(os.path.join(build_dir, "*.mcpack"))
            + glob.glob(os.path.join(build_dir, "*.mcaddon"))
            + glob.glob(os.path.join(build_dir, "*.mcworld"))
        )
        in_root_readme = project_name in root_content

        if not has_build_files or not in_root_readme:
            unregistered.append((project_path, category))

    return unregistered


# ─────────────────────────────────────────────────────────────────────────────
# Version helpers
# ─────────────────────────────────────────────────────────────────────────────

def bump_version_list(ver_list):
    if not isinstance(ver_list, list) or len(ver_list) < 3:
        return [1, 0, 1]
    return [ver_list[0], ver_list[1], ver_list[2] + 1]


def format_version(ver_list):
    return f"{ver_list[0]}.{ver_list[1]}.{ver_list[2]}"


def get_manifest_info(project_path):
    """Returns dict: description, version_str, version_list from first manifest found."""
    manifest_paths = sorted(
        glob.glob(os.path.join(project_path, "**/manifest.json"), recursive=True)
    )
    info = {"description": "", "version_str": "1.0.0", "version_list": [1, 0, 0]}
    for mp in manifest_paths:
        try:
            with open(mp, encoding="utf-8") as f:
                data = json.load(f)
            hdr = data.get("header", {})
            if hdr.get("description"):
                info["description"] = hdr["description"]
            if hdr.get("version"):
                info["version_list"] = list(hdr["version"])
                info["version_str"] = format_version(info["version_list"])
            break
        except Exception as exc:
            print(f"WARNING: ignored error: {exc}", file=sys.stderr)
    return info


# ─────────────────────────────────────────────────────────────────────────────
# Display Name & Title helpers
# ─────────────────────────────────────────────────────────────────────────────

def _display_name(project_name):
    """'pet-immortality' → 'Pet Immortality'"""
    return project_name.replace("-", " ").replace("_", " ").title()


def get_project_title(project_path):
    """
    Extract the canonical player-facing title from DESCRIPTION.md first.
    README.md is download-only and must not be the source of product details.
    """
    for filename in ("DESCRIPTION.md", "README.md"):
        doc_path = os.path.join(project_path, filename)
        if not os.path.isfile(doc_path):
            continue
        try:
            with open(doc_path, encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if not line.startswith("# "):
                        continue
                    title_part = line[2:].strip()
                    for sep in (" — ", " - ", " -- "):
                        if sep in title_part:
                            title_part = title_part.split(sep)[0].strip()
                    title_part = title_part.replace(" Challenge", "")
                    title_part = re.sub(
                        r"\s*\([vV]\d+\.\d+\.\d+\)\s*$",
                        "",
                        title_part,
                        flags=re.IGNORECASE,
                    )
                    title_clean = re.sub(r'[\\/*?:"<>|]', "", title_part).strip()
                    if title_clean:
                        return title_clean
        except Exception as exc:
            print(f"WARNING: ignored error: {exc}", file=sys.stderr)
    return _display_name(os.path.basename(project_path))


def _format_size(filepath):
    """Formats file size into human-readable string like '~250 KB' or '~1.2 MB'."""
    try:
        sz = os.path.getsize(filepath)
        if sz < 1024 * 1024:
            return f"~{max(1, round(sz / 1024))} KB"
        return f"~{round(sz / (1024 * 1024), 1)} MB"
    except Exception:
        return "~100 KB"


def _get_pack_type(project_path, category, version_str="1.0.0"):
    """Returns (type_label, primary_ext, build_filename)."""
    bp_dir = os.path.join(project_path, "behavior_pack")
    rp_dir = os.path.join(project_path, "resource_pack")
    world_dir = os.path.join(project_path, "world")
    title = get_project_title(project_path)

    if "maps" in category and os.path.isdir(world_dir):
        return "Custom Map (`.mcworld`)", "mcworld", f"{title} by AllensCreations (V{version_str}).mcworld"
    elif os.path.isdir(bp_dir) and os.path.isdir(rp_dir):
        return "Complete Pack (`.mcaddon`)", "mcaddon", f"{title} by AllensCreations (V{version_str}).mcaddon"
    else:
        return "Script Behavior Pack (`.mcpack`)", "mcpack", f"{title} by AllensCreations (V{version_str}).mcpack"


# ─────────────────────────────────────────────────────────────────────────────
# Manifest bumping
# ─────────────────────────────────────────────────────────────────────────────

def update_manifests_for_project(project_path):
    """
    Bumps patch version (+0.0.1) in all manifests for a project.
    Returns (old_version_str, new_version_str, updated_manifest_paths).
    """
    manifest_paths = glob.glob(
        os.path.join(project_path, "**/manifest.json"), recursive=True
    )
    if not manifest_paths:
        return None, None, []

    uuid_to_version = {}
    current_ver = None
    manifest_data = {}

    for mp in manifest_paths:
        with open(mp, encoding="utf-8") as f:
            data = json.load(f)
        manifest_data[mp] = data
        if current_ver is None and "header" in data and "version" in data["header"]:
            current_ver = list(data["header"]["version"])

    if current_ver is None:
        current_ver = [1, 0, 0]

    new_ver = bump_version_list(current_ver)
    old_ver_str = format_version(current_ver)
    new_ver_str = format_version(new_ver)

    for mp, data in manifest_data.items():
        if "header" in data and "uuid" in data["header"]:
            uuid_to_version[data["header"]["uuid"]] = new_ver

    base_title = get_project_title(project_path)
    for mp, data in manifest_data.items():
        if "header" in data:
            data["header"]["version"] = new_ver
            # Keep every pack's in-game display title aligned with the bumped release.
            data["header"]["name"] = f"{base_title} (v{new_ver_str})"
            description = str(data["header"].get("description", "")).strip()
            description = re.sub(r"\s*(?:created\s+)?by\s+AllensCreations\.?\s*$", "", description, flags=re.IGNORECASE).rstrip(" .")
            data["header"]["description"] = f"{description}. by AllensCreations" if description else "by AllensCreations"
        if "modules" in data and isinstance(data["modules"], list):
            for mod in data["modules"]:
                mod["version"] = new_ver
        if "dependencies" in data and isinstance(data["dependencies"], list):
            for dep in data["dependencies"]:
                if "uuid" in dep and dep["uuid"] in uuid_to_version:
                    dep["version"] = uuid_to_version[dep["uuid"]]
        if "metadata" not in data or not isinstance(data.get("metadata"), dict):
            data["metadata"] = {}
        data["metadata"]["authors"] = ["AllensCreations"]
        data["metadata"]["product_type"] = "addon"
        with open(mp, "w", encoding="utf-8") as f:
            json.dump(data, f, indent=2)
            f.write("\n")

    # Update world_behavior_packs.json if present
    for wbp in glob.glob(
        os.path.join(project_path, "**/world_behavior_packs.json"), recursive=True
    ):
        try:
            with open(wbp, encoding="utf-8") as f:
                packs = json.load(f)
            if isinstance(packs, list):
                for p in packs:
                    if "pack_id" in p and p["pack_id"] in uuid_to_version:
                        p["version"] = uuid_to_version[p["pack_id"]]
                with open(wbp, "w", encoding="utf-8") as f:
                    json.dump(packs, f, indent=2)
                    f.write("\n")
        except Exception as e:
            print(f"  Warning: Failed to update {wbp}: {e}")

    return old_ver_str, new_ver_str, manifest_paths


# ─────────────────────────────────────────────────────────────────────────────
# Package builder
# ─────────────────────────────────────────────────────────────────────────────

def _collect_zip_entries(src_dir, prefix=""):
    """Sorted (archive_name, file_path) pairs for src_dir, skipping junk."""
    entries = []
    for root, dirs, files in os.walk(src_dir):
        dirs[:] = sorted(d for d in dirs if d not in JUNK_DIRS)
        for file in sorted(files):
            if is_junk(file):
                continue
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, src_dir).replace(os.sep, "/")
            entries.append(((prefix + "/" + rel_path) if prefix else rel_path, full_path))
    return entries


def _write_zip(zip_dest, entries):
    """Write a reproducible zip: fixed timestamps, sorted entries, fixed permissions."""
    os.makedirs(os.path.dirname(zip_dest), exist_ok=True)
    with zipfile.ZipFile(zip_dest, "w", zipfile.ZIP_DEFLATED) as zf:
        for arcname, full_path in sorted(entries):
            info = zipfile.ZipInfo(arcname, date_time=(1980, 1, 1, 0, 0, 0))
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o644 << 16
            with open(full_path, "rb") as fh:
                zf.writestr(info, fh.read())


def zip_directory_contents(src_dir, zip_dest):
    """Zips the contents of src_dir directly into the root of zip_dest (reproducible)."""
    _write_zip(zip_dest, _collect_zip_entries(src_dir))


def rebuild_project_packages(project_path, category, version_str=None):
    """
    Rebuilds .mcaddon / .mcpack / .mcworld binaries in builds/<project_name>/.
    Format: '<Filename> by AllensCreations (V#.#.#).<ext>'
    Returns (primary_filename, list_of_built_files_tuples).
    """
    project_name = os.path.basename(project_path)
    title = get_project_title(project_path)
    if not version_str:
        info = get_manifest_info(project_path)
        version_str = info["version_str"]

    build_dir = os.path.join(REPO_ROOT, "builds", project_name)
    os.makedirs(build_dir, exist_ok=True)

    # Always make sure pack_icon.png exists BEFORE zipping (fixes missing pack icons)
    if make_pack_icon is not None:
        make_pack_icon.ensure_project_icons(project_path)

    # Clean old binaries in build_dir
    for ext in ("*.mcaddon", "*.mcpack", "*.mcworld"):
        for old_f in glob.glob(os.path.join(build_dir, ext)):
            try:
                os.remove(old_f)
            except OSError:
                pass

    bp_dir = os.path.join(project_path, "behavior_pack")
    rp_dir = os.path.join(project_path, "resource_pack")
    world_dir = os.path.join(project_path, "world")

    has_bp = os.path.isdir(bp_dir)
    has_rp = os.path.isdir(rp_dir)
    has_world = os.path.isdir(world_dir)

    built_files = []
    primary_file = None

    # 1. Custom Map
    if "maps" in category and has_world:
        # Clean any old binaries inside project directory as well
        for ext in ("*.mcworld", "*.mcpack"):
            for old_map in glob.glob(os.path.join(project_path, ext)):
                try:
                    os.remove(old_map)
                except OSError:
                    pass

        mcworld_name = f"{title} by AllensCreations (V{version_str}).mcworld"
        admin_world_name = f"{title} Admin by AllensCreations (V{version_str}).mcworld"
        bp_pack_name = f"{title} BP by AllensCreations (V{version_str}).mcpack"

        if has_bp:
            mcpack_path = os.path.join(build_dir, bp_pack_name)
            zip_directory_contents(bp_dir, mcpack_path)
            shutil.copy2(mcpack_path, os.path.join(project_path, bp_pack_name))
            built_files.append((
                bp_pack_name, "mcpack", _format_size(mcpack_path),
                "Standalone Behavior Pack archive for custom map logic."
            ))
            print(f"  Built: {os.path.relpath(mcpack_path, REPO_ROOT)}")

        dest_world_bp = os.path.join(world_dir, "behavior_packs", "OneBlockVoid")
        if os.path.isdir(dest_world_bp) and has_bp:
            for item in os.listdir(bp_dir):
                s = os.path.join(bp_dir, item)
                d = os.path.join(dest_world_bp, item)
                if os.path.isdir(s):
                    shutil.copytree(s, d, dirs_exist_ok=True)
                else:
                    shutil.copy2(s, d)

        # Primary world
        target_build = os.path.join(build_dir, mcworld_name)
        target_map = os.path.join(project_path, mcworld_name)
        zip_directory_contents(world_dir, target_build)
        shutil.copy2(target_build, target_map)
        primary_file = mcworld_name
        built_files.append((
            mcworld_name, "mcworld", _format_size(target_build),
            "Complete Survival World archive ready for one-click import."
        ))
        print(f"  Built: {os.path.relpath(target_build, REPO_ROOT)}")

        # Admin world
        admin_target_build = os.path.join(build_dir, admin_world_name)
        admin_target_map = os.path.join(project_path, admin_world_name)
        zip_directory_contents(world_dir, admin_target_build)
        shutil.copy2(admin_target_build, admin_target_map)
        built_files.append((
            admin_world_name, "mcworld", _format_size(admin_target_build),
            "Admin / Studio World archive pre-configured with testing tools."
        ))
        print(f"  Built: {os.path.relpath(admin_target_build, REPO_ROOT)}")

    # 2. Combined BP + RP Add-on
    elif has_bp and has_rp:
        addon_name = f"{title} by AllensCreations (V{version_str}).mcaddon"
        bp_pack_name = f"{title} BP by AllensCreations (V{version_str}).mcpack"
        rp_pack_name = f"{title} RP by AllensCreations (V{version_str}).mcpack"

        mcaddon_path = os.path.join(build_dir, addon_name)
        slug = project_name.replace("-", "_")
        bp_folder_name = f"{slug}_BP"
        rp_folder_name = f"{slug}_RP"

        _addon_entries = []
        for _src_dir, _folder in ((bp_dir, bp_folder_name), (rp_dir, rp_folder_name)):
            _addon_entries.extend(_collect_zip_entries(_src_dir, _folder))
        _write_zip(mcaddon_path, _addon_entries)

        primary_file = addon_name
        built_files.append((
            addon_name, "mcaddon", _format_size(mcaddon_path),
            "Complete bundle containing both Behavior Pack and Resource Pack."
        ))
        print(f"  Built: {os.path.relpath(mcaddon_path, REPO_ROOT)}")

        # Build standalone BP mcpack
        bp_mcpack_path = os.path.join(build_dir, bp_pack_name)
        zip_directory_contents(bp_dir, bp_mcpack_path)
        built_files.append((
            bp_pack_name, "mcpack", _format_size(bp_mcpack_path),
            "Behavior Pack: Custom entities, components, and gameplay mechanics."
        ))
        print(f"  Built: {os.path.relpath(bp_mcpack_path, REPO_ROOT)}")

        # Build standalone RP mcpack
        rp_mcpack_path = os.path.join(build_dir, rp_pack_name)
        zip_directory_contents(rp_dir, rp_mcpack_path)
        built_files.append((
            rp_pack_name, "mcpack", _format_size(rp_mcpack_path),
            "Resource Pack: Custom models, geometry, textures, and sounds."
        ))
        print(f"  Built: {os.path.relpath(rp_mcpack_path, REPO_ROOT)}")

    # 3. BP-only (Scripts / Addon without RP)
    elif has_bp and not has_rp:
        pack_name = f"{title} by AllensCreations (V{version_str}).mcpack"
        addon_name = f"{title} by AllensCreations (V{version_str}).mcaddon"

        mcpack_path = os.path.join(build_dir, pack_name)
        zip_directory_contents(bp_dir, mcpack_path)
        primary_file = pack_name
        built_files.append((
            pack_name, "mcpack", _format_size(mcpack_path),
            "Script Behavior Pack archive ready for import."
        ))
        print(f"  Built: {os.path.relpath(mcpack_path, REPO_ROOT)}")

        # Also provide .mcaddon
        mcaddon_path = os.path.join(build_dir, addon_name)
        zip_directory_contents(bp_dir, mcaddon_path)
        built_files.append((
            addon_name, "mcaddon", _format_size(mcaddon_path),
            "Complete Add-on package archive."
        ))
        print(f"  Built: {os.path.relpath(mcaddon_path, REPO_ROOT)}")

    return primary_file, built_files


# ─────────────────────────────────────────────────────────────────────────────
# README synchronization
# ─────────────────────────────────────────────────────────────────────────────

def generate_build_readme(project_path, category, version_str, built_files):
    """Generates / updates builds/<project_name>/README.md with download table."""
    project_name = os.path.basename(project_path)
    title = get_project_title(project_path)
    build_dir = os.path.join(REPO_ROOT, "builds", project_name)
    readme_path = os.path.join(build_dir, "README.md")

    rows = []
    for fname, ext, size_str, desc in built_files:
        quoted = urllib.parse.quote(fname)
        dl_url = f"{GITHUB_RAW}/builds/{project_name}/{quoted}"
        rows.append(
            f"| **`{fname}`** | `.{ext}` | {size_str} | {desc} | [Download (.{ext})]({dl_url}) |"
        )
    table_content = "\n".join(rows)

    try:
        source_rel = os.path.relpath(project_path, build_dir)
    except ValueError:
        source_rel = f"../../{category}/{project_name}"

    content = f"""# {title} - Downloads and Releases

This folder contains compiled release packages for **{title}** by AllensCreations.

---

## Direct Download Links

| File Name | Format | Size | Description | Download Link |
| :--- | :--- | :--- | :--- | :--- |
{table_content}

---

## Installation Guide

For general import instructions, refer to the centralized [Download and Installation Guide](../../README.md#compatibility-and-installation).

---

## Source Files
To inspect uncompressed JSON files, geometry, render controllers, and textures:
- [View Source Files]({source_rel}/)

---

© All rights reserved for AllensCreations.
"""
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  Updated {os.path.relpath(readme_path, REPO_ROOT)}")


def update_project_readme(project_path, category, new_ver_str, primary_file=None):
    """Keep individual add-on READMEs focused on download/import details; preserve other category formats."""
    readme_path = os.path.join(project_path, "README.md")
    if not os.path.isfile(readme_path):
        return

    if category in ("MCPEDL/addons", "MCPEDL/new_addons"):
        title = get_project_title(project_path)
        project_name = os.path.basename(project_path)
        if primary_file:
            quoted_file = urllib.parse.quote(primary_file)
            download_url = f"{GITHUB_RAW}/builds/{project_name}/{quoted_file}"
            extension = os.path.splitext(primary_file)[1].lower()
            download_label = f"Download the add-on ({extension})"
        else:
            catalog = "new_addons" if category.endswith("new_addons") else "addons"
            download_url = (
                "https://github.com/AllensCreations/MCPE-Curseforges/blob/main/"
                f"MCPEDL/{catalog}/README.md#available-add-ons"
            )
            download_label = "Open the official download catalog"

        description_path = os.path.join(project_path, "DESCRIPTION.md")
        description_url = (
            "https://github.com/AllensCreations/MCPE-Curseforges/blob/main/"
            f"{os.path.relpath(description_path, REPO_ROOT).replace(os.sep, '/')}"
        )
        package_ext = os.path.splitext(primary_file)[1].lower() if primary_file else "not available"
        content = (
            f"# {title} (v{new_ver_str})\n\n"
            f"Download the current release of **{title}** for Minecraft Bedrock Edition.\n\n"
            f"## Download\n\n"
            f"- **Version:** {new_ver_str}\n"
            f"- **Package format:** `{package_ext}`\n"
            f"- **Direct download:** [{download_label}]({download_url})\n\n"
            f"## Installation\n\n"
            f"1. Download the package using the link above.\n"
            f"2. Open the downloaded file with Minecraft to import it.\n"
            f"3. If the package contains a pack that must be enabled separately, activate it in your world's settings.\n\n"
            f"## Add-on Information\n\n"
            f"For gameplay features, usage details, recipes, compatibility notes, and other project information, read the [full description]({description_url}).\n"
        )
        with open(readme_path, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"  Updated download-only project README: {os.path.relpath(readme_path, REPO_ROOT)}")
        return

    # Preserve the established README format for maps, scripts, and other categories.
    with open(readme_path, encoding="utf-8") as f:
        content = f.read()

    content = re.sub(r"\[!\[Release\]\([^)]+\)\]\([^)]+\)\n?", "", content)
    content = re.sub(r"\[!\[Changelog\]\([^)]+\)\]\([^)]+\)\n?", "", content)

    lines = content.splitlines(keepends=True)
    for i, line in enumerate(lines):
        if i >= 5 or not line.startswith("# "):
            continue
        newline = "\n" if line.endswith("\n") else ""
        title = line.rstrip("\r\n")[2:].strip()
        suffix = ""
        for sep in (" — ", " - ", " -- "):
            if sep in title:
                title, rest = title.split(sep, 1)
                suffix = sep + rest
                break
        title = re.sub(r"\s*\([vV]\d+\.\d+\.\d+\)\s*$", "", title).strip()
        lines[i] = f"# {title} (v{new_ver_str}){suffix}{newline}"
        break
    content = "".join(lines)

    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  Synchronized versioned project title in {os.path.relpath(readme_path, REPO_ROOT)}")


def update_category_readme(category, project_name, new_ver_str, primary_file):
    """Updates table row in MCPEDL/<category>/README.md with new version and download link."""
    cat_readme = os.path.join(REPO_ROOT, category, "README.md")
    if not os.path.isfile(cat_readme):
        return
    with open(cat_readme, encoding="utf-8") as f:
        lines = f.readlines()

    quoted_file = urllib.parse.quote(primary_file)
    dl_url = f"{GITHUB_RAW}/builds/{project_name}/{quoted_file}"
    slug_key = project_name.replace("-", " ").lower()

    updated_lines = []
    for line in lines:
        if line.strip().startswith("|") and (project_name in line or slug_key in line.lower()):
            line = re.sub(r"\b\d+\.\d+\.\d+\b", new_ver_str, line)
            ext = primary_file.split(".")[-1].upper()
            # Handle [MCADDON](url) format
            line = re.sub(
                r"\[(MCADDON|MCPACK|MCWORLD|Download [^]]+)\]\([^)]+\)",
                f"[{ext}]({dl_url})",
                line
            )
        updated_lines.append(line)

    with open(cat_readme, "w", encoding="utf-8") as f:
        f.writelines(updated_lines)
    print(f"  Updated {os.path.relpath(cat_readme, REPO_ROOT)}")


def update_builds_master_readme(project_name, new_ver_str, primary_file):
    """Updates table row in builds/README.md with new version and download link."""
    builds_readme = os.path.join(REPO_ROOT, "builds", "README.md")
    if not os.path.isfile(builds_readme):
        return
    with open(builds_readme, encoding="utf-8") as f:
        lines = f.readlines()

    quoted_file = urllib.parse.quote(primary_file)
    rel_dl = f"{project_name}/{quoted_file}"
    slug_key = project_name.replace("-", " ").lower()

    updated_lines = []
    for line in lines:
        if line.strip().startswith("|") and (project_name in line or slug_key in line.lower()):
            line = re.sub(r"`v\d+\.\d+\.\d+`", f"`v{new_ver_str}`", line)
            ext = primary_file.split(".")[-1]
            line = re.sub(
                r"\[Download \([^)]+\)\]\([^)]+\)",
                f"[Download (.{ext})]({rel_dl})",
                line
            )
        updated_lines.append(line)

    with open(builds_readme, "w", encoding="utf-8") as f:
        f.writelines(updated_lines)
    print(f"  Updated {os.path.relpath(builds_readme, REPO_ROOT)}")


def update_root_readme(project_name, new_ver_str, primary_file):
    """Updates catalog table rows and detailed overview headers in root README.md."""
    root_readme = os.path.join(REPO_ROOT, "README.md")
    if not os.path.isfile(root_readme):
        return
    with open(root_readme, encoding="utf-8") as f:
        content = f.read()

    quoted_file = urllib.parse.quote(primary_file)
    dl_url = f"{GITHUB_RAW}/builds/{project_name}/{quoted_file}"
    slug_key = project_name.replace("-", " ").lower()

    lines = content.splitlines(keepends=True)
    new_lines = []

    for line in lines:
        if line.strip().startswith("|") and (project_name in line or slug_key in line.lower()):
            line = re.sub(r"`v\d+\.\d+\.\d+`", f"`v{new_ver_str}`", line)
            ext = primary_file.split(".")[-1]
            line = re.sub(
                r"\[Download \([^)]+\)\]\([^)]+\)",
                f"[Download (.{ext})]({dl_url})",
                line
            )
        elif line.startswith("### ") and (project_name in line or slug_key in line.lower()):
            line = re.sub(r"\(v\d+\.\d+\.\d+\)", f"(v{new_ver_str})", line)
        new_lines.append(line)

    with open(root_readme, "w", encoding="utf-8") as f:
        f.writelines(new_lines)
    print(f"  Updated {os.path.relpath(root_readme, REPO_ROOT)}")


def update_readmes(project_path, category, old_ver_str, new_ver_str, primary_file=None, built_files=None):
    """
    Coordinates updating all relevant README files for the project:
      1. Project Directory README
      2. Category Directory README
      3. Project Build README
      4. Master Builds README
      5. Repository Root README
    """
    project_name = os.path.basename(project_path)

    # 1. Update project directory README
    update_project_readme(project_path, category, new_ver_str, primary_file)

    # 2. Update category directory README
    if primary_file:
        update_category_readme(category, project_name, new_ver_str, primary_file)

    # 3. Update build directory README
    if built_files:
        generate_build_readme(project_path, category, new_ver_str, built_files)

    # 4. Update master builds README
    if primary_file:
        update_builds_master_readme(project_name, new_ver_str, primary_file)

    # 5. Update root README
    if primary_file:
        update_root_readme(project_name, new_ver_str, primary_file)


# ─────────────────────────────────────────────────────────────────────────────
# README catalog registration (new projects)
# ─────────────────────────────────────────────────────────────────────────────

def _insert_table_row(readme_path, section_marker, new_row, skip_if_contains=None):
    if not os.path.isfile(readme_path):
        return False

    with open(readme_path, encoding="utf-8") as f:
        lines = f.readlines()

    if skip_if_contains and skip_if_contains in "".join(lines):
        return False

    sec_idx = next((i for i, l in enumerate(lines) if section_marker in l), -1)
    if sec_idx == -1:
        return False

    sep_idx = next(
        (i for i in range(sec_idx, len(lines)) if re.match(r"\|\s*:?-+:?\s*\|", lines[i])),
        -1,
    )
    if sep_idx == -1:
        return False

    last_row_idx = sep_idx
    for i in range(sep_idx + 1, len(lines)):
        stripped = lines[i].strip()
        if stripped.startswith("|") and stripped.endswith("|"):
            last_row_idx = i
        else:
            break

    lines.insert(last_row_idx + 1, new_row + "\n")

    with open(readme_path, "w", encoding="utf-8") as f:
        f.writelines(lines)

    print(f"  Registered in {os.path.relpath(readme_path, REPO_ROOT)}")
    return True


def _insert_before_section(readme_path, before_marker, new_block, skip_if_contains=None):
    if not os.path.isfile(readme_path):
        return False

    with open(readme_path, encoding="utf-8") as f:
        content = f.read()

    if skip_if_contains and skip_if_contains in content:
        return False

    idx = content.find(before_marker)
    if idx == -1:
        content = content.rstrip() + "\n\n" + new_block.strip() + "\n"
    else:
        content = content[:idx] + new_block + content[idx:]

    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(content)

    print(f"  Injected detail section in {os.path.relpath(readme_path, REPO_ROOT)}")
    return True


def _update_collection_badge(root_readme):
    """Rewrites the Collection Size badge to reflect current project counts."""
    maps_dir   = os.path.join(REPO_ROOT, "MCPEDL", "maps")
    script_dir = os.path.join(REPO_ROOT, "MCPEDL", "script")

    addon_dirs = [
        d for d in glob.glob(os.path.join(REPO_ROOT, "MCPEDL", "*"))
        if os.path.isdir(d) and os.path.basename(d) not in ("maps", "script")
    ]
    n_addons  = sum(
        len([p for p in glob.glob(os.path.join(ad, "*")) if os.path.isdir(p)])
        for ad in addon_dirs
    )
    n_maps    = len([d for d in glob.glob(os.path.join(maps_dir,   "*")) if os.path.isdir(d)])
    n_scripts = len([d for d in glob.glob(os.path.join(script_dir, "*")) if os.path.isdir(d)])

    if not os.path.isfile(root_readme):
        return

    with open(root_readme, encoding="utf-8") as f:
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
        with open(root_readme, "w", encoding="utf-8") as f:
            f.write(updated)
        print(
            f"  Updated Collection Size badge → "
            f"{n_addons} Add-ons | {n_maps} Maps | {n_scripts} Scripts"
        )


def register_new_project(project_path, category, version_str=None, primary_file=None):
    """Injects a brand-new project into all catalog READMEs."""
    project_name = os.path.basename(project_path)
    title        = get_project_title(project_path)
    info         = get_manifest_info(project_path)
    desc         = info["description"] or f"A Minecraft Bedrock addon by AllensCreations."
    ver          = version_str or info["version_str"]
    type_label, primary_ext, default_build_file = _get_pack_type(project_path, category, ver)
    build_file   = primary_file or default_build_file

    quoted_file  = urllib.parse.quote(build_file)
    gh_dl        = f"{GITHUB_RAW}/builds/{project_name}/{quoted_file}"

    try:
        source_rel = "MCPEDL/" + os.path.relpath(
            project_path, os.path.join(REPO_ROOT, "MCPEDL")
        )
    except ValueError:
        source_rel = f"MCPEDL/{category.split('/')[-1]}/{project_name}"

    short_desc = desc[:80] + ("..." if len(desc) > 80 else "")
    tiny_desc  = desc[:60] + ("..." if len(desc) > 60 else "")

    root_readme    = os.path.join(REPO_ROOT, "README.md")
    builds_readme  = os.path.join(REPO_ROOT, "builds", "README.md")

    # 1. Category README table
    cat_readme = os.path.join(REPO_ROOT, category, "README.md")
    ext_upper = primary_ext.upper()
    cat_section = "## Available"
    cat_row = (
        f"| {title} | {ver} "
        f"| [Source]({project_name}/) "
        f"| [{ext_upper}]({gh_dl}) |"
    )

    _insert_table_row(cat_readme, cat_section, cat_row, skip_if_contains=project_name)

    # 2. Root README catalog table
    if "addons" in category:
        root_section = "## Active Add-ons Catalog"
        root_row = (
            f"| **{title}** | `v{ver}` | {type_label} "
            f"| [Download (.{primary_ext})]({gh_dl}) "
            f"| [`{source_rel}/`]({source_rel}/) "
            f"| {tiny_desc} |"
        )
        with open(root_readme, encoding="utf-8") as f:
            existing = f.read()
        n = existing.count("### Add-on ") + 1
        detail_section = (
            f"\n### Add-on {n}: {title} (v{ver})\n\n"
            f"{desc}\n\n"
            f"- *Add features and details here.*\n\n"
            f"[Read Full {title} Documentation]({source_rel}/README.md)\n\n---\n\n"
        )

    elif "maps" in category:
        root_section = "## Maps Catalog"
        root_row = (
            f"| **{title}** | `v{ver}` | Custom Map "
            f"| [Download (.mcworld)]({gh_dl}) "
            f"| [`{source_rel}/`]({source_rel}/) "
            f"| {tiny_desc} |"
        )
        with open(root_readme, encoding="utf-8") as f:
            existing = f.read()
        n = existing.count("### Map: ") + existing.count("### Map ") + 1
        detail_section = (
            f"\n### Map {n}: {title} (v{ver})\n\n"
            f"{desc}\n\n"
            f"- *Add features and details here.*\n\n"
            f"[Read Full {title} Documentation]({source_rel}/README.md)\n\n---\n\n"
        )

    else:  # script
        root_section = "## Scripts and Challenges Catalog"
        root_row = (
            f"| **{title}** | `v{ver}` | Script "
            f"| [Download (.{primary_ext})]({gh_dl}) "
            f"| [`{source_rel}/`]({source_rel}/) "
            f"| {tiny_desc} |"
        )
        with open(root_readme, encoding="utf-8") as f:
            existing = f.read()
        n = existing.count("### Script ") + 1
        detail_section = (
            f"\n### Script {n}: {title} (v{ver})\n\n"
            f"{desc}\n\n"
            f"- *Add features and details here.*\n\n"
            f"[Read Full {title} Documentation]({source_rel}/README.md)\n\n---\n\n"
        )

    _insert_table_row(root_readme, root_section, root_row, skip_if_contains=project_name)
    _insert_before_section(
        root_readme,
        "## Compatibility and Installation",
        detail_section,
        skip_if_contains=project_name,
    )

    # 3. builds/README table
    if "addons" in category:
        builds_section = "### Add-on Packs"
    elif "maps" in category:
        builds_section = "### Worlds and Maps"
    else:
        builds_section = "### Script Projects"

    builds_row = (
        f"| **{title}** | `v{ver}` | {type_label} "
        f"| [Download (.{primary_ext})]({project_name}/{quoted_file}) "
        f"| [`{project_name}/`]({project_name}/) |"
    )
    _insert_table_row(builds_readme, builds_section, builds_row, skip_if_contains=project_name)

    # 4. Collection badge
    _update_collection_badge(root_readme)

    print(f"  ✅ '{title}' registered in all catalog READMEs.")


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(
        description="Auto bump pack versions, rebuild packages, and register new projects."
    )
    parser.add_argument(
        "--base",
        help="Git base ref or commit SHA to diff against (e.g. HEAD~1, origin/main).",
    )
    parser.add_argument(
        "--project",
        help="Explicit project directory or name to process (e.g. Mining-Helmet).",
    )
    parser.add_argument(
        "--all",
        action="store_true",
        help="Process all packs/maps/scripts in MCPEDL/.",
    )
    parser.add_argument(
        "--no-bump",
        action="store_true",
        help="Skip version increment; only build packages and register new projects.",
    )
    args = parser.parse_args()

    project_dirs = find_target_project_dirs()

    # Determine which projects to process
    if args.all:
        print("[Auto-Version] Mode: ALL (explicit override) — processing every project in repository...")
        changed_projects = sorted(list(project_dirs.keys()))
    elif args.project:
        print(f"[Auto-Version] Mode: EXPLICIT PROJECT — {args.project}")
        matched = [
            p for p in project_dirs
            if args.project in (p, os.path.basename(p)) or args.project in p
        ]
        if not matched:
            print(f"[Auto-Version] Error: No project matching '{args.project}' found.")
            sys.exit(1)
        changed_projects = matched
    else:
        print(f"[Auto-Version] Checking changed files (base: {args.base or 'auto'})...")
        changed_files = get_git_diff_files(args.base)
        print(f"[Auto-Version] Diff contains {len(changed_files)} changed file(s).")
        changed_projects = detect_changed_projects(changed_files, project_dirs)
        source_files = [
            f for f in changed_files
            if any(is_version_worthy_source_file(p, f) for p in project_dirs)
        ]
        print(f"[Auto-Version] Release-worthy project source changes: {len(source_files)} file(s).")

    # Do not sweep every unregistered project on ordinary pushes. That behavior
    # caused unrelated/legacy projects to be bumped unexpectedly. New projects are
    # discovered naturally when their source files change; --project and --all remain
    # explicit operator overrides for intentional processing.
    
    if not changed_projects:
        print("[Auto-Version] No pack/map/script changes or new projects detected.")
        sys.exit(0)

    print(f"[Auto-Version] Processing {len(changed_projects)} project(s):")
    for cp in changed_projects:
        print(f"  - {os.path.relpath(cp, REPO_ROOT)}")

    updated_summary = []

    for cp in changed_projects:
        cat = project_dirs.get(cp)
        if cat is None:
            print(f"\nSkipping {cp}: not in known category.")
            continue

        # Required marker prevents accidental packaging of unprotected add-ons.
        normalized_category = cat.replace("\\", "/").strip("/")
        if normalized_category in {"MCPEDL/addons", "MCPEDL/new_addons"}:
            lock_path = os.path.join(cp, "LOCK")
            try:
                with open(lock_path, encoding="utf-8") as lock_file:
                    lock_content = lock_file.read()
            except OSError:
                lock_content = ""
            if not lock_content.startswith("AllensCreations Add-on Lock v1"):
                print(f"[Auto-Version] Missing/invalid LOCK marker, creating: {os.path.relpath(lock_path, REPO_ROOT)}")
                with open(lock_path, "w", encoding="utf-8", newline="\n") as lock_file:
                    lock_file.write(
                        "AllensCreations Add-on Lock v1\n\n"
                        "Required repository marker for build validation.\n"
                        "This marker does not encrypt source files or prevent extraction of distributable packages.\n")

        proj_name = os.path.basename(cp)
        is_new    = not (os.path.join(REPO_ROOT, "README.md") and
                         proj_name in open(os.path.join(REPO_ROOT, "README.md")).read())

        print(f"\nProcessing {os.path.relpath(cp, REPO_ROOT)} {'(NEW)' if is_new else ''}...")

        # ── Version bump (skipped for --no-bump) ──────────────────────────
        if args.no_bump:
            info   = get_manifest_info(cp)
            old_v  = info["version_str"]
            new_v  = old_v
            print(f"  --no-bump: keeping version at v{old_v}")
        else:
            old_v, new_v, manifests = update_manifests_for_project(cp)
            if not old_v:
                print(f"  No manifest found for {proj_name}, skipping.")
                continue
            print(f"  Version: v{old_v} → v{new_v}")

        # ── Build packages with standardized filename format ───────────────
        # Dirtbound is included in automatic source/version processing, but its
        # world archives remain protected by the dedicated in-game-test gate.
        if proj_name in TEST_GATED_WORLD_PROJECTS:
            primary_file, built_files = None, None
            print("  Test-gated world project: skipping generic package rebuild; existing .mcworld files are untouched.")
        else:
            primary_file, built_files = rebuild_project_packages(cp, cat, new_v)

        # ── Synchronize all Directory README files & links ─────────────────
        update_readmes(cp, cat, old_v, new_v, primary_file, built_files)

        # ── Register if new ───────────────────────────────────────────────
        if is_new:
            register_new_project(cp, cat, new_v, primary_file)

        updated_summary.append(
            f"{proj_name}: v{old_v} → v{new_v}"
            + (" [NEW — registered in catalogs]" if is_new else "")
        )

    # Always ensure collection badge is synced with current project counts
    _update_collection_badge(os.path.join(REPO_ROOT, "README.md"))

    # Keep dropdown choices in manage-addon-status.yml synced with new_addons
    try:
        try:
            from manage_addon_status import sync_workflow_choices
        except ImportError:
            from scripts.manage_addon_status import sync_workflow_choices
        sync_workflow_choices()
    except Exception as exc:
        print(f"[Auto-Version] WARNING: dropdown sync skipped: {exc}", file=sys.stderr)

    print("\n[Auto-Version] Completed successfully!")
    for s in updated_summary:
        print(f"  - {s}")


if __name__ == "__main__":
    main()
