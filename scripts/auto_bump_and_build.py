#!/usr/bin/env python3
"""
Auto Version Bumper, Package Builder, and Catalog Registrar for MCPE-Curseforges.

Features:
1. Detects modified directories across MCPEDL/addons/, MCPEDL/script/, MCPEDL/maps/
   (with backward compatibility for packs/, minigames/, maps/).
2. Auto-detects brand-new projects not yet registered in READMEs or builds/ and registers them.
3. Increments semantic patch version (+0.0.1) in:
   - header.version: [x, y, z + 1]
   - modules[*].version: [x, y, z + 1]
   - cross-pack dependencies[*].version (matching sibling BP/RP UUIDs)
   - world_behavior_packs.json (if map)
4. Synchronizes version numbers in README.md files (pack, category, and root).
5. Rebuilds corresponding .mcpack, .mcaddon, and .mcworld distribution packages in builds/.
6. Injects new projects into catalog tables in:
   - Category README (MCPEDL/addons/, MCPEDL/maps/, MCPEDL/script/)
   - Root README.md (catalog table + Detailed Project Overview section)
   - builds/README.md
   - Updates the Collection Size badge in root README.md
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

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
GITHUB_RAW = "https://github.com/AllensCreations/MCPE-Curseforges/raw/main"

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
        "MCPEDL/addons", "MCPEDL/script", "MCPEDL/maps",
        "packs", "minigames", "maps", "addons", "script",
    ]
    for cat in categories:
        cat_path = os.path.join(REPO_ROOT, cat)
        if os.path.isdir(cat_path):
            for p in glob.glob(os.path.join(cat_path, "*")):
                if os.path.isdir(p):
                    projects[p] = cat
    return projects


def detect_changed_projects(changed_files, project_dirs):
    """Finds which projects have source changes (excluding auto-generated builds)."""
    changed_projects = set()
    for f in changed_files:
        norm_f = os.path.normpath(f)
        for p in project_dirs:
            rel = os.path.relpath(os.path.join(REPO_ROOT, norm_f), p)
            if not rel.startswith(".."):
                changed_projects.add(p)
                break
    return sorted(list(changed_projects))


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
        except Exception:
            pass
    return info


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

    for mp, data in manifest_data.items():
        if "header" in data:
            data["header"]["version"] = new_ver
        if "modules" in data and isinstance(data["modules"], list):
            for mod in data["modules"]:
                mod["version"] = new_ver
        if "dependencies" in data and isinstance(data["dependencies"], list):
            for dep in data["dependencies"]:
                if "uuid" in dep and dep["uuid"] in uuid_to_version:
                    dep["version"] = uuid_to_version[dep["uuid"]]
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
# README version sync (existing projects)
# ─────────────────────────────────────────────────────────────────────────────

def update_readmes(project_path, category, old_ver_str, new_ver_str):
    """
    Replaces old version string with new version string in pack, category,
    root, and builds README files.
    """
    project_name = os.path.basename(project_path)
    readmes_to_check = [
        os.path.join(project_path, "README.md"),
        os.path.join(REPO_ROOT, category, "README.md"),
        os.path.join(REPO_ROOT, "README.md"),
        os.path.join(REPO_ROOT, "builds", "README.md"),
        os.path.join(REPO_ROOT, "builds", project_name, "README.md"),
    ]

    for rm in readmes_to_check:
        if not os.path.isfile(rm):
            continue
        with open(rm, encoding="utf-8") as f:
            content = f.read()

        if rm in (
            os.path.join(project_path, "README.md"),
            os.path.join(REPO_ROOT, "builds", project_name, "README.md"),
        ):
            updated = content.replace(f"v{old_ver_str}", f"v{new_ver_str}")
            updated = updated.replace(f"`v{old_ver_str}`", f"`v{new_ver_str}`")
            updated = updated.replace(f"Version: {old_ver_str}", f"Version: {new_ver_str}")
        else:
            lines = content.splitlines(keepends=True)
            slug_key = project_name.replace("-", " ")
            new_lines = []
            for line in lines:
                if project_name in line or slug_key.lower() in line.lower():
                    line = line.replace(f"v{old_ver_str}", f"v{new_ver_str}")
                    line = line.replace(f"`v{old_ver_str}`", f"`v{new_ver_str}`")
                new_lines.append(line)
            updated = "".join(new_lines)

        if updated != content:
            with open(rm, "w", encoding="utf-8") as f:
                f.write(updated)
            print(f"  Updated version in {os.path.relpath(rm, REPO_ROOT)}")


# ─────────────────────────────────────────────────────────────────────────────
# Package builder
# ─────────────────────────────────────────────────────────────────────────────

def zip_directory_contents(src_dir, zip_dest):
    """Zips the contents of src_dir directly into the root of zip_dest."""
    os.makedirs(os.path.dirname(zip_dest), exist_ok=True)
    with zipfile.ZipFile(zip_dest, "w", zipfile.ZIP_DEFLATED) as zf:
        for root, _, files in os.walk(src_dir):
            for file in sorted(files):
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, src_dir)
                zf.write(full_path, rel_path)


def rebuild_project_packages(project_path, category):
    """
    Rebuilds .mcaddon / .mcpack / .mcworld binaries in builds/<project_name>/.
    """
    project_name = os.path.basename(project_path)
    build_dir = os.path.join(REPO_ROOT, "builds", project_name)
    os.makedirs(build_dir, exist_ok=True)

    bp_dir = os.path.join(project_path, "behavior_pack")
    rp_dir = os.path.join(project_path, "resource_pack")
    world_dir = os.path.join(project_path, "world")

    has_bp = os.path.isdir(bp_dir)
    has_rp = os.path.isdir(rp_dir)
    has_world = os.path.isdir(world_dir)

    # 1. Custom Map
    if "maps" in category and has_world:
        if has_bp:
            mcpack_path = os.path.join(
                build_dir, f"{project_name.replace('-', '_')}.mcpack"
            )
            zip_directory_contents(bp_dir, mcpack_path)
            shutil.copy2(
                mcpack_path, os.path.join(project_path, f"{project_name.replace('-', '_')}.mcpack")
            )
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

        for mcworld_name in [
            f"{project_name.replace('-', '_')}.mcworld",
            f"{project_name.replace('-', '_')}_Admin.mcworld",
        ]:
            target_build = os.path.join(build_dir, mcworld_name)
            target_map = os.path.join(project_path, mcworld_name)
            zip_directory_contents(world_dir, target_build)
            shutil.copy2(target_build, target_map)
            print(f"  Built: {os.path.relpath(target_build, REPO_ROOT)}")

    # 2. Combined BP + RP Add-on
    elif has_bp and has_rp:
        existing_mcaddons = glob.glob(os.path.join(build_dir, "*.mcaddon"))
        addon_name = (
            os.path.basename(existing_mcaddons[0])
            if existing_mcaddons
            else f"{project_name.replace('-', '_')}_AllensCreations.mcaddon"
        )
        mcaddon_path = os.path.join(build_dir, addon_name)

        bp_folder_name = "behavior_pack"
        rp_folder_name = "resource_pack"
        if existing_mcaddons:
            with zipfile.ZipFile(existing_mcaddons[0], "r") as zf:
                for n in zf.namelist():
                    if "/" in n:
                        top = n.split("/")[0]
                        if top.endswith("_BP"):
                            bp_folder_name = top
                        if top.endswith("_RP"):
                            rp_folder_name = top

        with zipfile.ZipFile(mcaddon_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for root, _, files in os.walk(bp_dir):
                for file in sorted(files):
                    fp = os.path.join(root, file)
                    zf.write(fp, os.path.join(bp_folder_name, os.path.relpath(fp, bp_dir)))
            for root, _, files in os.walk(rp_dir):
                for file in sorted(files):
                    fp = os.path.join(root, file)
                    zf.write(fp, os.path.join(rp_folder_name, os.path.relpath(fp, rp_dir)))
        print(f"  Built: {os.path.relpath(mcaddon_path, REPO_ROOT)}")

        for mcpack_file in glob.glob(os.path.join(build_dir, "*.mcpack")):
            base_mcpack = os.path.basename(mcpack_file)
            src = rp_dir if "_RP" in base_mcpack else bp_dir
            zip_directory_contents(src, mcpack_file)
            print(f"  Built: {os.path.relpath(mcpack_file, REPO_ROOT)}")

    # 3. BP-only (Scripts / Addon without RP)
    elif has_bp and not has_rp:
        slug = project_name.replace("-", "_")
        existing_mcaddons = glob.glob(os.path.join(build_dir, "*.mcaddon"))
        existing_mcpacks = glob.glob(os.path.join(build_dir, "*.mcpack"))

        addon_name = (
            os.path.basename(existing_mcaddons[0])
            if existing_mcaddons
            else f"{slug}_AllensCreations.mcaddon"
        )
        pack_name = (
            os.path.basename(existing_mcpacks[0])
            if existing_mcpacks
            else f"{slug}_AllensCreations.mcpack"
        )

        mcaddon_path = os.path.join(build_dir, addon_name)
        mcpack_path = os.path.join(build_dir, pack_name)

        if existing_mcaddons or not existing_mcpacks:
            zip_directory_contents(bp_dir, mcaddon_path)
            print(f"  Built: {os.path.relpath(mcaddon_path, REPO_ROOT)}")
        if existing_mcpacks or not existing_mcaddons:
            zip_directory_contents(bp_dir, mcpack_path)
            print(f"  Built: {os.path.relpath(mcpack_path, REPO_ROOT)}")


# ─────────────────────────────────────────────────────────────────────────────
# README catalog registration (new projects)
# ─────────────────────────────────────────────────────────────────────────────

def _display_name(project_name):
    """'Pet-immortality' → 'Pet Immortality'"""
    return project_name.replace("-", " ").replace("_", " ").title()


def _get_pack_type(project_path, category):
    """Returns (type_label, primary_ext, build_filename)."""
    bp_dir = os.path.join(project_path, "behavior_pack")
    rp_dir = os.path.join(project_path, "resource_pack")
    world_dir = os.path.join(project_path, "world")
    slug = os.path.basename(project_path).replace("-", "_")

    if "maps" in category and os.path.isdir(world_dir):
        return "Custom Map (`.mcworld`)", "mcworld", f"{slug}.mcworld"
    elif os.path.isdir(bp_dir) and os.path.isdir(rp_dir):
        return "Complete Pack (`.mcaddon`)", "mcaddon", f"{slug}_AllensCreations.mcaddon"
    else:
        # Prefer .mcaddon; fall back to .mcpack for display
        return "Script Behavior Pack (`.mcpack`)", "mcpack", f"{slug}_AllensCreations.mcpack"


def _insert_table_row(readme_path, section_marker, new_row, skip_if_contains=None):
    """
    Appends new_row after the last data row of the markdown table found under
    section_marker. Returns True if inserted.
    """
    if not os.path.isfile(readme_path):
        return False

    with open(readme_path, encoding="utf-8") as f:
        lines = f.readlines()

    if skip_if_contains:
        if skip_if_contains in "".join(lines):
            return False

    # Find the section
    sec_idx = next(
        (i for i, l in enumerate(lines) if section_marker in l), -1
    )
    if sec_idx == -1:
        return False

    # Find the header separator row (| :--- | ...)
    sep_idx = next(
        (
            i for i in range(sec_idx, len(lines))
            if re.match(r"\|\s*:?-+:?\s*\|", lines[i])
        ),
        -1,
    )
    if sep_idx == -1:
        return False

    # Find the last consecutive table data row
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
    """
    Inserts new_block immediately before the first occurrence of before_marker.
    Falls back to appending at EOF if marker not found.
    """
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
    addons_dir = os.path.join(REPO_ROOT, "MCPEDL", "addons")
    maps_dir   = os.path.join(REPO_ROOT, "MCPEDL", "maps")
    script_dir = os.path.join(REPO_ROOT, "MCPEDL", "script")

    n_addons  = len([d for d in glob.glob(os.path.join(addons_dir, "*")) if os.path.isdir(d)])
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


def register_new_project(project_path, category, version_str=None):
    """
    Injects a brand-new project into all catalog READMEs:
      - MCPEDL/<category>/README.md  (catalog table row)
      - README.md                    (catalog table row + Detailed section)
      - builds/README.md             (builds table row)
    Also updates the Collection Size badge.
    """
    project_name = os.path.basename(project_path)
    display      = _display_name(project_name)
    info         = get_manifest_info(project_path)
    desc         = info["description"] or f"A Minecraft Bedrock addon by AllensCreations."
    ver          = version_str or info["version_str"]
    type_label, primary_ext, build_file = _get_pack_type(project_path, category)
    slug         = project_name.replace("-", "_")

    gh_dl = f"{GITHUB_RAW}/builds/{project_name}/{build_file}"

    # Relative source path for links inside root README
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

    # ── 1. Category README table ───────────────────────────────────────────
    cat_readme = os.path.join(REPO_ROOT, category, "README.md")

    if "addons" in category:
        cat_section = "## Available Source"
        cat_row = (
            f"| **{display}** | {short_desc} "
            f"| [`{project_name}/`]({project_name}/) "
            f"| [Download (.{primary_ext})]({gh_dl}) "
            f"| v{ver} |"
        )
    elif "maps" in category:
        cat_section = "## Available Maps Catalog"
        cat_row = (
            f"| **{display}** | `v{ver}` | Custom Map "
            f"| [Download (.mcworld)]({gh_dl}) "
            f"| [`{project_name}/`]({project_name}/) "
            f"| {short_desc} |"
        )
    else:  # script
        cat_section = "## Available Script Projects Catalog"
        cat_row = (
            f"| **{display}** | `v{ver}` | Script "
            f"| [`{project_name}/`]({project_name}/) "
            f"| [Download (.{primary_ext})]({gh_dl}) "
            f"| {short_desc} |"
        )

    _insert_table_row(cat_readme, cat_section, cat_row, skip_if_contains=project_name)

    # ── 2. Root README catalog table ──────────────────────────────────────
    if "addons" in category:
        root_section = "## Active Add-ons Catalog"
        root_row = (
            f"| **{display}** | `v{ver}` | {type_label} "
            f"| [Download (.{primary_ext})]({gh_dl}) "
            f"| [`{source_rel}/`]({source_rel}/) "
            f"| {tiny_desc} |"
        )
        with open(root_readme, encoding="utf-8") as f:
            existing = f.read()
        n = existing.count("### Add-on ") + 1
        detail_section = (
            f"\n### Add-on {n}: {display} (v{ver})\n\n"
            f"{desc}\n\n"
            f"- *Add features and details here.*\n\n"
            f"[Read Full {display} Documentation]({source_rel}/README.md)\n\n---\n\n"
        )

    elif "maps" in category:
        root_section = "## Maps Catalog"
        root_row = (
            f"| **{display}** | `v{ver}` | Custom Map "
            f"| [Download (.mcworld)]({gh_dl}) "
            f"| [`{source_rel}/`]({source_rel}/) "
            f"| {tiny_desc} |"
        )
        with open(root_readme, encoding="utf-8") as f:
            existing = f.read()
        n = existing.count("### Map: ") + existing.count("### Map ") + 1
        detail_section = (
            f"\n### Map {n}: {display} (v{ver})\n\n"
            f"{desc}\n\n"
            f"- *Add features and details here.*\n\n"
            f"[Read Full {display} Documentation]({source_rel}/README.md)\n\n---\n\n"
        )

    else:  # script
        root_section = "## Scripts and Challenges Catalog"
        root_row = (
            f"| **{display}** | `v{ver}` | Script "
            f"| [Download (.{primary_ext})]({gh_dl}) "
            f"| [`{source_rel}/`]({source_rel}/) "
            f"| {tiny_desc} |"
        )
        with open(root_readme, encoding="utf-8") as f:
            existing = f.read()
        n = existing.count("### Script ") + 1
        detail_section = (
            f"\n### Script {n}: {display} (v{ver})\n\n"
            f"{desc}\n\n"
            f"- *Add features and details here.*\n\n"
            f"[Read Full {display} Documentation]({source_rel}/README.md)\n\n---\n\n"
        )

    _insert_table_row(root_readme, root_section, root_row, skip_if_contains=project_name)
    _insert_before_section(
        root_readme,
        "## Compatibility and Installation",
        detail_section,
        skip_if_contains=project_name,
    )

    # ── 3. builds/README table ────────────────────────────────────────────
    if "addons" in category:
        builds_section = "### Add-on Packs"
    elif "maps" in category:
        builds_section = "### Worlds and Maps"
    else:
        builds_section = "### Script Projects"

    builds_row = (
        f"| **{display}** | `v{ver}` | {type_label} "
        f"| [Download (.{primary_ext})]({project_name}/{build_file}) "
        f"| [`{project_name}/`]({project_name}/) |"
    )
    _insert_table_row(builds_readme, builds_section, builds_row, skip_if_contains=project_name)

    # ── 4. Collection badge ───────────────────────────────────────────────
    _update_collection_badge(root_readme)

    print(f"  ✅ '{display}' registered in all catalog READMEs.")


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

    # ── Determine which projects to process ───────────────────────────────
    if args.all:
        print("[Auto-Version] Mode: ALL — processing every project in repository...")
        changed_projects = sorted(list(project_dirs.keys()))
    elif args.project:
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
        changed_projects = detect_changed_projects(changed_files, project_dirs)

    # ── Always auto-detect unregistered NEW projects and fold them in ─────
    unregistered = detect_unregistered_projects(project_dirs)
    for proj_path, _cat in unregistered:
        if proj_path not in changed_projects:
            print(f"[Auto-Version] Detected new unregistered project: "
                  f"{os.path.relpath(proj_path, REPO_ROOT)}")
            changed_projects.append(proj_path)

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
            update_readmes(cp, cat, old_v, new_v)

        # ── Build packages ─────────────────────────────────────────────────
        rebuild_project_packages(cp, cat)

        # ── Register if new ───────────────────────────────────────────────
        if is_new:
            register_new_project(cp, cat, new_v)

        updated_summary.append(
            f"{proj_name}: v{old_v} → v{new_v}"
            + (" [NEW — registered in catalogs]" if is_new else "")
        )

    print("\n[Auto-Version] Completed successfully!")
    for s in updated_summary:
        print(f"  - {s}")


if __name__ == "__main__":
    main()
