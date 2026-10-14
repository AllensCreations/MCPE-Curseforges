#!/usr/bin/env python3
"""
Auto Version Bumper and Package Builder for MCPE-Curseforges.

Features:
1. Detects modified directories across MCPEDL/addons/, MCPEDL/script/, MCPEDL/maps/
   (with backward compatibility for packs/, minigames/, maps/).
2. Increments semantic patch version (+0.0.1) in:
   - header.version: [x, y, z + 1]
   - modules[*].version: [x, y, z + 1]
   - cross-pack dependencies[*].version (matching sibling BP/RP UUIDs)
   - world_behavior_packs.json (if map)
3. Synchronizes version numbers in README.md files (pack, category, and root).
4. Rebuilds corresponding .mcpack, .mcaddon, and .mcworld distribution packages in builds/.
"""

import os
import sys
import json
import glob
import zipfile
import subprocess
import shutil
import argparse

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

def get_git_diff_files(base_ref=None):
    """Returns list of changed files relative to base_ref or HEAD~1."""
    cmd = ["git", "diff", "--name-only"]
    if base_ref:
        cmd.append(base_ref)
    else:
        # Check uncommitted working tree changes first; if none, check HEAD~1
        status = subprocess.check_output(["git", "status", "--porcelain"], cwd=REPO_ROOT, text=True)
        if status.strip():
            cmd = ["git", "diff", "--name-only", "HEAD"]
        else:
            try:
                subprocess.check_call(["git", "rev-parse", "HEAD~1"], cwd=REPO_ROOT, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                cmd.append("HEAD~1")
            except subprocess.CalledProcessError:
                cmd.append("HEAD")

    res = subprocess.check_output(cmd, cwd=REPO_ROOT, text=True)
    files = [f.strip() for f in res.splitlines() if f.strip()]
    return files

def find_target_project_dirs():
    """Returns dictionary of project_dir -> category_path."""
    projects = {}
    # Primary categories under MCPEDL/
    categories = [
        "MCPEDL/addons", "MCPEDL/script", "MCPEDL/maps",
        "packs", "minigames", "maps", "addons", "script"
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

def bump_version_list(ver_list):
    """Increments [major, minor, patch] to [major, minor, patch + 1]."""
    if not isinstance(ver_list, list) or len(ver_list) < 3:
        return [1, 0, 1]
    return [ver_list[0], ver_list[1], ver_list[2] + 1]

def format_version(ver_list):
    return f"{ver_list[0]}.{ver_list[1]}.{ver_list[2]}"

def update_manifests_for_project(project_path):
    """
    Finds all manifest.json in project_path.
    Reads current version, bumps patch (+1), updates header, modules, sibling dependencies,
    and world_behavior_packs.json.
    Returns (old_version_str, new_version_str, updated_manifest_paths).
    """
    manifest_paths = glob.glob(os.path.join(project_path, "**/manifest.json"), recursive=True)
    if not manifest_paths:
        return None, None, []

    # Map UUID -> new_version
    uuid_to_version = {}
    current_ver = None

    manifest_data = {}
    for mp in manifest_paths:
        with open(mp, "r", encoding="utf-8") as f:
            data = json.load(f)
        manifest_data[mp] = data
        if current_ver is None and "header" in data and "version" in data["header"]:
            current_ver = list(data["header"]["version"])

    if current_ver is None:
        current_ver = [1, 0, 0]

    new_ver = bump_version_list(current_ver)
    old_ver_str = format_version(current_ver)
    new_ver_str = format_version(new_ver)

    # First pass: record header UUIDs
    for mp, data in manifest_data.items():
        if "header" in data and "uuid" in data["header"]:
            uuid_to_version[data["header"]["uuid"]] = new_ver

    # Second pass: update header, modules, dependencies
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
    wbp_paths = glob.glob(os.path.join(project_path, "**/world_behavior_packs.json"), recursive=True)
    for wbp in wbp_paths:
        try:
            with open(wbp, "r", encoding="utf-8") as f:
                packs = json.load(f)
            if isinstance(packs, list):
                for p in packs:
                    if "pack_id" in p and p["pack_id"] in uuid_to_version:
                        p["version"] = uuid_to_version[p["pack_id"]]
                with open(wbp, "w", encoding="utf-8") as f:
                    json.dump(packs, f, indent=2)
                    f.write("\n")
        except Exception as e:
            print(f"Warning: Failed to update {wbp}: {e}")

    return old_ver_str, new_ver_str, manifest_paths

def update_readmes(project_path, category, old_ver_str, new_ver_str):
    """
    Updates occurrences of old version string with new version string
    across pack README, category README, and repo root README.
    """
    project_name = os.path.basename(project_path)
    readmes_to_check = [
        os.path.join(project_path, "README.md"),
        os.path.join(REPO_ROOT, category, "README.md"),
        os.path.join(REPO_ROOT, "README.md"),
        os.path.join(REPO_ROOT, "builds", "README.md"),
        os.path.join(REPO_ROOT, "builds", project_name, "README.md")
    ]

    for rm in readmes_to_check:
        if not os.path.isfile(rm):
            continue
        with open(rm, "r", encoding="utf-8") as f:
            content = f.read()

        if rm == os.path.join(project_path, "README.md") or rm == os.path.join(REPO_ROOT, "builds", project_name, "README.md"):
            updated_content = content.replace(f"v{old_ver_str}", f"v{new_ver_str}")
            updated_content = updated_content.replace(f"`v{old_ver_str}`", f"`v{new_ver_str}`")
            updated_content = updated_content.replace(f"Version: {old_ver_str}", f"Version: {new_ver_str}")
        else:
            lines = content.splitlines(keepends=True)
            new_lines = []
            slug_key = project_name.replace("-", " ")
            for line in lines:
                if project_name in line or slug_key.lower() in line.lower():
                    line = line.replace(f"v{old_ver_str}", f"v{new_ver_str}")
                    line = line.replace(f"`v{old_ver_str}`", f"`v{new_ver_str}`")
                new_lines.append(line)
            updated_content = "".join(new_lines)

        if updated_content != content:
            with open(rm, "w", encoding="utf-8") as f:
                f.write(updated_content)
            print(f"  Updated version references in {os.path.relpath(rm, REPO_ROOT)}")

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
    Rebuilds the corresponding .mcaddon / .mcpack / .mcworld binaries in builds/<project_name>/
    and maps/<project_name>/ if applicable.
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

    # 1. Project is a Custom Map (e.g. OneBlock-Void-Survival)
    if ("maps" in category) and has_world:
        if has_bp:
            mcpack_path = os.path.join(build_dir, f"{project_name.replace('-', '_')}.mcpack")
            zip_directory_contents(bp_dir, mcpack_path)
            map_mcpack = os.path.join(project_path, f"{project_name.replace('-', '_')}.mcpack")
            shutil.copy2(mcpack_path, map_mcpack)
            print(f"  Built: {os.path.relpath(mcpack_path, REPO_ROOT)}")

        # Sync behavior_pack into world/behavior_packs if present
        dest_world_bp = os.path.join(world_dir, "behavior_packs", "OneBlockVoid")
        if os.path.isdir(dest_world_bp) and has_bp:
            for item in os.listdir(bp_dir):
                s = os.path.join(bp_dir, item)
                d = os.path.join(dest_world_bp, item)
                if os.path.isdir(s):
                    shutil.copytree(s, d, dirs_exist_ok=True)
                else:
                    shutil.copy2(s, d)

        # Build .mcworld for player and admin
        for mcworld_name in [f"{project_name.replace('-', '_')}.mcworld", f"{project_name.replace('-', '_')}_Admin.mcworld"]:
            target_build = os.path.join(build_dir, mcworld_name)
            target_map = os.path.join(project_path, mcworld_name)
            zip_directory_contents(world_dir, target_build)
            shutil.copy2(target_build, target_map)
            print(f"  Built: {os.path.relpath(target_build, REPO_ROOT)}")

    # 2. Combined Add-on with both BP and RP
    elif has_bp and has_rp:
        existing_mcaddons = glob.glob(os.path.join(build_dir, "*.mcaddon"))
        addon_name = os.path.basename(existing_mcaddons[0]) if existing_mcaddons else f"{project_name.replace('-', '_')}_AllensCreations.mcaddon"
        mcaddon_path = os.path.join(build_dir, addon_name)

        bp_folder_name = "behavior_pack"
        rp_folder_name = "resource_pack"
        if existing_mcaddons:
            with zipfile.ZipFile(existing_mcaddons[0], 'r') as zf:
                for n in zf.namelist():
                    if '/' in n:
                        top = n.split('/')[0]
                        if top.endswith('_BP'): bp_folder_name = top
                        if top.endswith('_RP'): rp_folder_name = top

        with zipfile.ZipFile(mcaddon_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for root, _, files in os.walk(bp_dir):
                for file in sorted(files):
                    fp = os.path.join(root, file)
                    rel = os.path.relpath(fp, bp_dir)
                    zf.write(fp, os.path.join(bp_folder_name, rel))
            for root, _, files in os.walk(rp_dir):
                for file in sorted(files):
                    fp = os.path.join(root, file)
                    rel = os.path.relpath(fp, rp_dir)
                    zf.write(fp, os.path.join(rp_folder_name, rel))
        print(f"  Built: {os.path.relpath(mcaddon_path, REPO_ROOT)}")

        for mcpack_file in glob.glob(os.path.join(build_dir, "*.mcpack")):
            base_mcpack = os.path.basename(mcpack_file)
            if "_RP" in base_mcpack:
                zip_directory_contents(rp_dir, mcpack_file)
                print(f"  Built: {os.path.relpath(mcpack_file, REPO_ROOT)}")
            else:
                zip_directory_contents(bp_dir, mcpack_file)
                print(f"  Built: {os.path.relpath(mcpack_file, REPO_ROOT)}")

    # 3. Single Behavior Pack (Script packs or BP-only Addons)
    elif has_bp and not has_rp:
        existing_mcaddons = glob.glob(os.path.join(build_dir, "*.mcaddon"))
        addon_name = os.path.basename(existing_mcaddons[0]) if existing_mcaddons else f"{project_name.replace('-', '_')}_AllensCreations.mcaddon"
        mcaddon_path = os.path.join(build_dir, addon_name)

        existing_mcpacks = glob.glob(os.path.join(build_dir, "*.mcpack"))
        pack_name = os.path.basename(existing_mcpacks[0]) if existing_mcpacks else f"{project_name.replace('-', '_')}_AllensCreations.mcpack"
        mcpack_path = os.path.join(build_dir, pack_name)

        if existing_mcaddons or not existing_mcpacks:
            zip_directory_contents(bp_dir, mcaddon_path)
            print(f"  Built: {os.path.relpath(mcaddon_path, REPO_ROOT)}")
        if existing_mcpacks or not existing_mcaddons:
            zip_directory_contents(bp_dir, mcpack_path)
            print(f"  Built: {os.path.relpath(mcpack_path, REPO_ROOT)}")

def main():
    parser = argparse.ArgumentParser(description="Auto bump pack versions and rebuild distribution packages.")
    parser.add_argument("--base", help="Git base ref or commit to diff against (e.g. HEAD~1, origin/main, or commit SHA)")
    parser.add_argument("--project", help="Explicit project directory or name to bump (e.g. MCPEDL/addons/Mining-Helmet or Mining-Helmet)")
    args = parser.parse_args()

    project_dirs = find_target_project_dirs()

    if args.project:
        matched_projects = []
        for p in project_dirs:
            if args.project == p or args.project == os.path.basename(p) or args.project in p:
                matched_projects.append(p)
        if not matched_projects:
            print(f"[Auto-Version] Error: No project matching '{args.project}' found.")
            sys.exit(1)
        changed_projects = matched_projects
    else:
        print(f"[Auto-Version] Checking changed files against base: {args.base or 'automatic detection'}...")
        changed_files = get_git_diff_files(args.base)
        changed_projects = detect_changed_projects(changed_files, project_dirs)

    if not changed_projects:
        print("[Auto-Version] No pack/map/minigame source changes detected.")
        sys.exit(0)

    print(f"[Auto-Version] Detected changes in {len(changed_projects)} project(s):")
    for cp in changed_projects:
        print(f" - {os.path.relpath(cp, REPO_ROOT)}")

    updated_summary = []

    for cp in changed_projects:
        cat = project_dirs[cp]
        proj_name = os.path.basename(cp)
        print(f"\nProcessing {cat}/{proj_name}...")
        old_v, new_v, manifests = update_manifests_for_project(cp)
        if not old_v or not new_v:
            print(f"  No manifest found for {proj_name}, skipping.")
            continue

        print(f"  Version incremented: v{old_v} -> v{new_v}")
        update_readmes(cp, cat, old_v, new_v)
        rebuild_project_packages(cp, cat)
        updated_summary.append(f"{proj_name}: v{old_v} -> v{new_v}")

    print("\n[Auto-Version] Completed successfully!")
    for s in updated_summary:
        print(f"  - {s}")

if __name__ == "__main__":
    main()
