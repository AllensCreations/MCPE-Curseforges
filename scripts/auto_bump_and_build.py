#!/usr/bin/env python3
"""
Pack Builder and Catalog Registrar for MCPE-Curseforges.

Features:
1. Detects release-worthy source/config/asset changes inside MCPEDL project directories.
2. Registers newly added projects when their source files are changed; does not sweep
   unrelated unregistered projects on ordinary pushes.
3. Synchronizes current manifest versions in README.md files across:
   - Project Directory: <project_path>/README.md (Release badge & title)
   - Category Directory: MCPEDL/<category>/README.md (Catalog table row & download link)
   - Project Build Directory: builds/<project_name>/README.md (Direct downloads table)
   - Master Builds Directory: builds/README.md (Catalog table row & download link)
   - Root Catalog: README.md (Catalog tables, overview header & download links)
4. Names output packages from the manifest (header.name + version). Default shape:
   "<Shortcut> V#.#.#.<ext>"; override with metadata.package_filename in a
   manifest or the PACK_FILENAME_TEMPLATE variable.
5. Injects new projects into catalog tables and updates Collection Size badge.
"""

import os
import re
import sys
import json
import hashlib
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

try:
    import manifest_tools
except Exception as _exc:  # keep the builder usable even if the helper is missing
    manifest_tools = None
    print(f"WARNING: manifest_tools unavailable: {_exc}", file=sys.stderr)

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
        "MCPEDL/Addons", "MCPEDL/Maps", "MCPEDL/Script", "MCPEDL/Minigame",
    ]
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

    Documentation and generated archives are excluded. Manifests are build inputs,
    but are never modified by this builder.
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
        in_root_readme = True

        if not has_build_files or not in_root_readme:
            unregistered.append((project_path, category))

    return unregistered


# ─────────────────────────────────────────────────────────────────────────────
# Version helpers
# ─────────────────────────────────────────────────────────────────────────────

def format_version(ver_list):
    """Format the only supported project version: X.Y.Z."""
    return ".".join(str(p) for p in ver_list)


def _manifest_versions(project_path):
    """Header versions of the project's source manifests (installed world copies are ignored).

    Uses manifest_tools.source_manifest_paths so the build, the aligner and the verifier all
    look at exactly the same files."""
    found = []
    if manifest_tools:
        manifest_paths = manifest_tools.source_manifest_paths(project_path)
    else:
        manifest_paths = sorted(glob.glob(os.path.join(project_path, "**/manifest.json"), recursive=True))
    for mp in manifest_paths:
        try:
            with open(mp, encoding="utf-8") as f:
                data = json.load(f)
            hdr = data.get("header", {})
            ver = hdr.get("version")
            if isinstance(ver, list) and len(ver) == 3 and all(isinstance(x, int) for x in ver):
                found.append((mp, hdr.get("description", ""), list(ver)))
        except Exception as exc:
            print(f"WARNING: ignored error: {exc}", file=sys.stderr)
    return found


def _manifest_version_set(project_path):
    return {format_version(v) for _, _, v in _manifest_versions(project_path)}


def get_manifest_info(project_path):
    """Returns dict: description, version_str, version_list.

    The version is the highest header version among the project's source manifests, so a build
    follows the newest manifest instead of whichever file happens to sort first.
    """
    info = {"description": "", "version_str": "1.0.0", "version_list": [1, 0, 0]}
    found = _manifest_versions(project_path)
    for _, description, _ in found:
        if description:
            info["description"] = description
            break
    if found:
        info["version_list"] = max(v for _, _, v in found)
        info["version_str"] = format_version(info["version_list"])
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
                        r"\s*\([vV]\d+\.\d+\.\d+(?:\.\d+)?\)\s*$",
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


def package_filename(project_path, version_str, ext):
    """Download file name: follows the manifest (name + version); see manifest_tools.package_basename."""
    fallback = get_project_title(project_path)
    if manifest_tools:
        return f"{manifest_tools.package_basename(project_path, version_str, fallback)}.{ext}"
    return f"{re.sub(r'[^A-Za-z0-9]', '', fallback) or 'Pack'} V{version_str}.{ext}"


def _get_pack_type(project_path, category, version_str="1.0.0"):
    """Returns (type_label, primary_ext, build_filename)."""
    bp_dir = os.path.join(project_path, "behavior_pack")
    rp_dir = os.path.join(project_path, "resource_pack")
    world_dir = os.path.join(project_path, "world")
    title = get_project_title(project_path)

    kind = os.path.basename(category).lower()
    if kind == "maps":
        return "Custom Map (`.mcworld`)", "mcworld", package_filename(project_path, version_str, "mcworld")
    elif kind in {"addons", "minigame"}:
        return "Complete Pack (`.mcaddon`)", "mcaddon", package_filename(project_path, version_str, "mcaddon")
    else:
        return "Script Pack (`.mcpack`)", "mcpack", package_filename(project_path, version_str, "mcpack")


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
    Name follows the manifest (see package_filename).
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

    bp_dir = os.path.join(project_path, "behavior_pack")
    rp_dir = os.path.join(project_path, "resource_pack")
    world_dir = os.path.join(project_path, "world")

    has_bp = os.path.isdir(bp_dir)
    has_rp = os.path.isdir(rp_dir)
    has_world = os.path.isdir(world_dir)
    kind = os.path.basename(category).lower()
    buildable = (
        (kind == "maps" and has_world)
        or (kind in {"addons", "minigame"} and (has_bp or has_rp))
        or (kind == "script" and has_bp and not has_rp)
    )
    if buildable:
        for ext in ("*.mcaddon", "*.mcpack", "*.mcworld"):
            for old_f in glob.glob(os.path.join(build_dir, ext)):
                try:
                    os.remove(old_f)
                except OSError:
                    pass

    built_files = []
    primary_file = None

    # 1. Custom Map
    if kind == "maps" and has_world:
        # Clean any old binaries inside project directory as well
        for ext in ("*.mcworld", "*.mcpack"):
            for old_map in glob.glob(os.path.join(project_path, ext)):
                try:
                    os.remove(old_map)
                except OSError:
                    pass

        mcworld_name = package_filename(project_path, version_str, "mcworld")

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

    # 2. Combined BP + RP Add-on
    elif kind in {"addons", "minigame"} and has_bp and has_rp:
        addon_name = package_filename(project_path, version_str, "mcaddon")

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

    # 3. BP-only (Scripts / Addon without RP)
    elif kind in {"addons", "minigame"} and (has_bp or has_rp):
        addon_name = package_filename(project_path, version_str, "mcaddon")
        slug = project_name.replace("-", "_")
        entries = []
        if has_bp:
            entries.extend(_collect_zip_entries(bp_dir, f"{slug}_BP"))
        if has_rp:
            entries.extend(_collect_zip_entries(rp_dir, f"{slug}_RP"))
        mcaddon_path = os.path.join(build_dir, addon_name)
        _write_zip(mcaddon_path, entries)
        primary_file = addon_name
        built_files.append((addon_name, "mcaddon", _format_size(mcaddon_path),
                            "Complete Add-on package for Minecraft Bedrock."))
        print(f"  Built: {os.path.relpath(mcaddon_path, REPO_ROOT)}")

    elif kind == "script" and has_bp and not has_rp:
        pack_name = package_filename(project_path, version_str, "mcpack")
        mcpack_path = os.path.join(build_dir, pack_name)
        zip_directory_contents(bp_dir, mcpack_path)
        primary_file = pack_name
        built_files.append((pack_name, "mcpack", _format_size(mcpack_path),
                            "Script Behavior Pack archive ready for import."))
        print(f"  Built: {os.path.relpath(mcpack_path, REPO_ROOT)}")

    return primary_file, built_files


def _package_hashes(project_name):
    build_dir = os.path.join(REPO_ROOT, "builds", project_name)
    hashes = {}
    for name in os.listdir(build_dir) if os.path.isdir(build_dir) else []:
        if not name.lower().endswith((".mcaddon", ".mcpack", ".mcworld")):
            continue
        path = os.path.join(build_dir, name)
        if os.path.isfile(path):
            hashes[name] = _sha256_file(path)
    return hashes


def _sha256_file(path):
    digest = hashlib.sha256()
    with open(path, "rb") as package:
        for chunk in iter(lambda: package.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def _write_rebuilt_projects(rebuilt_projects):
    output_path = os.environ.get("GITHUB_OUTPUT")
    if not output_path:
        return
    with open(output_path, "a", encoding="utf-8") as output:
        output.write(f"has_rebuilt_projects={'true' if rebuilt_projects else 'false'}\n")
        output.write("rebuilt_projects<<EOF\n")
        output.write("\n".join(rebuilt_projects) + "\n")
        output.write("EOF\n")


# ─────────────────────────────────────────────────────────────────────────────
# README synchronization
# ─────────────────────────────────────────────────────────────────────────────

VERSION_KEEP = int(os.environ.get("KEEP_VERSIONS", "5"))


def _version_sort_key(folder_name):
    m = re.match(r"V(\d+)\.(\d+)\.(\d+)$", folder_name)
    return tuple(int(x or 0) for x in m.groups()) if m else None


PACKAGE_EXTS = (".mcaddon", ".mcpack", ".mcworld")


def _read_text(path):
    try:
        with open(path, encoding="utf-8") as fh:
            return fh.read().strip()
    except OSError:
        return None


def _build_packages(project_name):
    """{filename: sha256} of the packages currently in builds/<project>/."""
    return _package_hashes(project_name)


def should_bump_project(snapshot_state, source_changed_in_diff=False, is_new=False):
    """Decide whether an existing project's source change warrants an Update bump.

    A matching source snapshot is authoritative. For a missing/legacy snapshot, the
    triggering Git diff is the fallback evidence. New projects retain their declared
    starting version. Documentation and generated-package drift never cause bumps.
    """
    if is_new:
        return False
    if snapshot_state == "source_changed":
        return True
    return bool(source_changed_in_diff and snapshot_state in {"missing", "legacy"})


def snapshot_status(project_name, version_str, source_hash):
    """How builds/<project>/versions/V<version>/ relates to the current source.

    missing         no snapshot for this version yet
    legacy          snapshot exists but predates source hashing (no source.sha256)
    source_changed  the source changed since this version was snapshotted
    packages_stale  same source, but the saved packages differ from builds/<project>/
    current         snapshot matches the source and the current packages
    """
    vdir = os.path.join(REPO_ROOT, "builds", project_name, "versions", f"V{version_str}")
    if not os.path.isdir(vdir):
        return "missing"
    stored = _read_text(os.path.join(vdir, "source.sha256"))
    if stored is None:
        return "legacy"
    if source_hash and stored != source_hash:
        return "source_changed"
    saved = {}
    for name in os.listdir(vdir):
        if name.lower().endswith(PACKAGE_EXTS):
            saved[name] = _sha256_file(os.path.join(vdir, name))
    if saved != _build_packages(project_name):
        return "packages_stale"
    return "current"


def _write_if_changed(path, text):
    if _read_text(path) == text.strip() and os.path.isfile(path):
        return False
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(text)
    return True


def _build_info(project_path, project_name, version_str, source_hash):
    """Deterministic record of what a build contains (no timestamps, so no commit churn)."""
    info = {
        "manifest_version": version_str,
        "changelog_version": manifest_tools.latest_changelog_version(project_path) if manifest_tools else None,
        "source_sha256": source_hash,
        "packages": _build_packages(project_name),
    }
    return json.dumps(info, indent=2, sort_keys=True) + "\n"


def save_version_snapshot(project_path, project_name, version_str, source_hash=None):
    """
    Keeps builds/<project_name>/versions/V<version_str>/ in step with the current build:
    packages, source.zip, source.sha256 and build_info.json. Unlike the old behavior it does
    NOT skip an existing version folder: when the source changed (or the saved packages differ)
    the snapshot for that version is refreshed in place. Also writes builds/<project>/build_info.json
    (the latest build, including the changelog's X.Y.Z).
    Returns "created", "refreshed" or "current". Never raises: a snapshot problem must not
    break a release.
    """
    try:
        build_dir = os.path.join(REPO_ROOT, "builds", project_name)
        vroot = os.path.join(build_dir, "versions")
        vdir = os.path.join(vroot, f"V{version_str}")
        if source_hash is None and manifest_tools:
            source_hash = manifest_tools.compute_source_hash(project_path)

        status = snapshot_status(project_name, version_str, source_hash)
        info_text = _build_info(project_path, project_name, version_str, source_hash)
        _write_if_changed(os.path.join(build_dir, "build_info.json"), info_text)
        if status == "current":
            return "current"

        existed = os.path.isdir(vdir)
        os.makedirs(vdir, exist_ok=True)
        if existed:
            for name in os.listdir(vdir):
                if name.lower().endswith(PACKAGE_EXTS) or name in {"source.zip", "source.sha256", "build_info.json"}:
                    os.remove(os.path.join(vdir, name))

        for ext in PACKAGE_EXTS:
            for f in glob.glob(os.path.join(build_dir, "*" + ext)):
                shutil.copy2(f, vdir)

        source_entries = [
            (arc, full)
            for arc, full in _collect_zip_entries(project_path)
            if not arc.lower().endswith(PACKAGE_EXTS)
        ]
        _write_zip(os.path.join(vdir, "source.zip"), source_entries)
        _write_if_changed(os.path.join(vdir, "source.sha256"), (source_hash or "") + "\n")
        _write_if_changed(os.path.join(vdir, "build_info.json"), info_text)
        result = "refreshed" if existed else "created"
        print(f"  Snapshot {result} ({status}): builds/{project_name}/versions/V{version_str}")

        saved = sorted(
            (d for d in os.listdir(vroot) if _version_sort_key(d) is not None),
            key=_version_sort_key,
        )
        for old in saved[:-VERSION_KEEP] if VERSION_KEEP > 0 else []:
            shutil.rmtree(os.path.join(vroot, old), ignore_errors=True)
            print(f"  Pruned old snapshot: {old}")
        return result
    except Exception as exc:
        print(f"  WARNING: version snapshot skipped: {exc}", file=sys.stderr)
        return "error"


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

    source_path = urllib.parse.quote(
        os.path.relpath(project_path, REPO_ROOT).replace(os.sep, "/"),
        safe="/",
    )
    source_url = (
        "https://github.com/AllensCreations/MCPE-Curseforges/"
        f"tree/main/{source_path}/"
    )

    content = f"""# {title} - Downloads and Releases

This folder contains compiled release packages for **{title}** by ALNStudios.

---

## Direct Download Links

| File Name | Format | Size | Description | Download Link |
| :--- | :--- | :--- | :--- | :--- |
{table_content}

---

## Installation Guide

For general import instructions, refer to the centralized [Download and Installation Guide](https://github.com/AllensCreations/MCPE-Curseforges/blob/main/README.md#compatibility-and-installation).

---

## Source Files
To inspect uncompressed JSON files, geometry, render controllers, and textures:
- [View Source Files]({source_url})

---

© All rights reserved for ALNStudios.
"""
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  Updated {os.path.relpath(readme_path, REPO_ROOT)}")


def update_project_readme(project_path, category, new_ver_str, primary_file=None):
    """Keep project READMEs version-free and focused on downloads and installation."""
    readme_path = os.path.join(project_path, "README.md")
    if not os.path.isfile(readme_path):
        return
    if primary_file is None and os.path.basename(category).lower() == "maps":
        return

    title = get_project_title(project_path)
    project_name = os.path.basename(project_path)
    project_category = category.removeprefix("MCPEDL/")
    if primary_file:
        quoted_file = urllib.parse.quote(primary_file)
        download_url = f"{GITHUB_RAW}/builds/{project_name}/{quoted_file}"
        package_ext = os.path.splitext(primary_file)[1].lower()
        download_label = f"Download {title} ({package_ext})"
    else:
        catalog = {
            "Addons": "Addons/README.md#available-add-ons",
            "Maps": "Maps/README.md#available-maps",
            "Script": "Script/README.md#available-scripts",
            "Minigame": "Minigame/README.md#available-minigames",
        }.get(project_category, "README.md")
        download_url = (
            "https://github.com/AllensCreations/MCPE-Curseforges/blob/main/"
            f"MCPEDL/{catalog}"
        )
        package_ext = "see catalog"
        download_label = "Open the official download catalog"

    description_path = os.path.join(project_path, "DESCRIPTION.md")
    description_url = (
        "https://github.com/AllensCreations/MCPE-Curseforges/blob/main/"
        f"{os.path.relpath(description_path, REPO_ROOT).replace(os.sep, '/')}"
    )
    install_last_step = (
        "3. Find the imported world in your Worlds list and open it."
        if package_ext == ".mcworld"
        else "3. If the package contains a pack that must be enabled separately, activate it in your world's settings."
    )
    content = (
        f"# {title}\n\n"
        f"Download the current release of **{title}** for Minecraft Bedrock Edition.\n\n"
        f"## Download\n\n"
        f"- **Package format:** `{package_ext}`\n"
        f"- **Direct download:** [{download_label}]({download_url})\n\n"
        f"## Installation\n\n"
        f"1. Download the package using the link above.\n"
        f"2. Open the downloaded file with Minecraft to import it.\n"
        f"{install_last_step}\n\n"
        f"## Pack Information\n\n"
        f"For gameplay features, usage details, compatibility notes, and other project information, read the [full description]({description_url}).\n"
    )
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write(content)
    print(f"  Updated version-free project README: {os.path.relpath(readme_path, REPO_ROOT)}")


def update_category_readme(category, project_name, new_ver_str, primary_file):
    """Updates the package download link in MCPEDL/<category>/README.md."""
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


def update_builds_master_readme(project_name, category, new_ver_str, primary_file):
    """Updates the package download link in builds/README.md."""
    builds_readme = os.path.join(REPO_ROOT, "builds", "README.md")
    if not os.path.isfile(builds_readme):
        return
    with open(builds_readme, encoding="utf-8") as f:
        lines = f.readlines()

    quoted_file = urllib.parse.quote(primary_file)
    rel_dl = f"{project_name}/{quoted_file}"
    slug_key = project_name.replace("-", " ").lower()
    kind = os.path.basename(category).lower()
    type_label = {
        "addons": "Add-on (.mcaddon)",
        "maps": "Map (.mcworld)",
        "script": "Script Pack (.mcpack)",
        "minigame": "Minigame (.mcaddon)",
    }.get(kind)

    updated_lines = []
    for line in lines:
        if line.strip().startswith("|") and (project_name in line or slug_key in line.lower()):
            ext = primary_file.split(".")[-1]
            line = re.sub(
                r"\[Download \([^)]+\)\]\([^)]+\)",
                f"[Download (.{ext})]({rel_dl})",
                line
            )
            if type_label:
                line = re.sub(
                    r"^(\|\s*\*\*[^|]+\*\*\s*\|)[^|]*",
                    lambda match: match.group(1) + f" {type_label} ",
                    line,
                )
        updated_lines.append(line)

    with open(builds_readme, "w", encoding="utf-8") as f:
        f.writelines(updated_lines)
    print(f"  Updated {os.path.relpath(builds_readme, REPO_ROOT)}")


def update_root_readme(project_name, category, new_ver_str, primary_file):
    """Retired: the root README is a public introduction and is never edited by the build."""
    return
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
            ext = primary_file.split(".")[-1]
            line = re.sub(
                r"\[Download \([^)]+\)\]\([^)]+\)",
                f"[Download (.{ext})]({dl_url})",
                line
            )
            kind = os.path.basename(category).lower()
            label = {
                "addons": "Add-on (.mcaddon)",
                "maps": "Map (.mcworld)",
                "script": "Script Pack (.mcpack)",
                "minigame": "Minigame (.mcaddon)",
            }.get(kind)
            if label:
                line = re.sub(
                    r"^(\|\s*\*\*[^|]+\*\*\s*\|)[^|]*",
                    lambda match: match.group(1) + f" {label} ",
                    line,
                )
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
        update_builds_master_readme(project_name, category, new_ver_str, primary_file)

    # 5. Update root README
    if primary_file:
        update_root_readme(project_name, category, new_ver_str, primary_file)


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


def _update_collection_badge(root_readme):
    """Rewrites the Collection Size badge to reflect current project counts."""
    category_dirs = {
        name: os.path.join(REPO_ROOT, "MCPEDL", name)
        for name in ("Addons", "Maps", "Script", "Minigame")
    }
    counts = {
        name: len([p for p in glob.glob(os.path.join(path, "*")) if os.path.isdir(p)])
        for name, path in category_dirs.items()
    }

    if not os.path.isfile(root_readme):
        return

    with open(root_readme, encoding="utf-8") as f:
        content = f.read()

    new_badge = (
        f"[![Collection Size](https://img.shields.io/badge/Collection-"
        f"{counts['Addons']}%20Add--ons%20%7C%20{counts['Maps']}%20Maps%20%7C%20"
        f"{counts['Script']}%20Scripts%20%7C%20{counts['Minigame']}%20Minigames"
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
            f"{counts['Addons']} Add-ons | {counts['Maps']} Maps | "
            f"{counts['Script']} Scripts | {counts['Minigame']} Minigames"
        )


def register_new_project(project_path, category, version_str=None, primary_file=None):
    """Injects a brand-new project into all catalog READMEs."""
    project_name = os.path.basename(project_path)
    title        = get_project_title(project_path)
    info         = get_manifest_info(project_path)
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
    source_path = urllib.parse.quote(source_rel, safe="/")
    source_url = (
        "https://github.com/AllensCreations/MCPE-Curseforges/"
        f"tree/main/{source_path}/"
    )

    description = info["description"]
    tiny_desc = description[:60] + ("..." if len(description) > 60 else "")

    root_readme    = os.path.join(REPO_ROOT, "README.md")
    builds_readme  = os.path.join(REPO_ROOT, "builds", "README.md")

    # 1. Category README table
    cat_readme = os.path.join(REPO_ROOT, category, "README.md")
    ext_upper = primary_ext.upper()
    cat_section = "## Available"
    cat_row = (
        f"| {title} "
        f"| [Source]({source_url}) "
        f"| [{ext_upper}]({gh_dl}) |"
    )

    _insert_table_row(cat_readme, cat_section, cat_row, skip_if_contains=project_name)

    # 2. Root README catalog table
    kind = os.path.basename(category).lower()
    if kind == "addons":
        root_section = "## Add-ons Catalog"
        root_row = (
            f"| **{title}** | {type_label} "
            f"| [Download (.{primary_ext})]({gh_dl}) "
            f"| [`{source_rel}/`]({source_url}) "
            f"| {tiny_desc} |"
        )
    elif kind == "maps":
        root_section = "## Maps Catalog"
        root_row = (
            f"| **{title}** | Custom Map "
            f"| [Download (.mcworld)]({gh_dl}) "
            f"| [`{source_rel}/`]({source_url}) "
            f"| {tiny_desc} |"
        )
    else:
        root_section = "## Minigames Catalog" if kind == "minigame" else "## Script Packs Catalog"
        root_row = (
            f"| **{title}** | {'Minigame' if kind == 'minigame' else 'Script'} "
            f"| [Download (.{primary_ext})]({gh_dl}) "
            f"| [`{source_rel}/`]({source_url}) "
            f"| {tiny_desc} |"
        )

    # 3. builds/README table
    if kind == "addons":
        builds_section = "### Add-on Packs"
    elif kind == "maps":
        builds_section = "### Worlds and Maps"
    elif kind == "minigame":
        builds_section = "### Minigames"
    else:
        builds_section = "### Script Packs"

    builds_row = (
        f"| **{title}** | {type_label} "
        f"| [Download (.{primary_ext})](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/{urllib.parse.quote(project_name)}/{quoted_file}) "
        f"| [`{project_name}/`](https://github.com/AllensCreations/MCPE-Curseforges/tree/main/builds/{urllib.parse.quote(project_name)}/) |"
    )
    _insert_table_row(builds_readme, builds_section, builds_row, skip_if_contains=project_name)

    # 4. Collection badge

    print(f"  ✅ '{title}' registered in all catalog READMEs.")


# ─────────────────────────────────────────────────────────────────────────────
# Main
# ─────────────────────────────────────────────────────────────────────────────

def verify_snapshots(project_dirs):
    """Report-only: does builds/<project>/versions/V<manifest version>/ match the source?"""
    bad = 0
    for cp in sorted(project_dirs):
        name = os.path.basename(cp)
        if name in TEST_GATED_WORLD_PROJECTS or not manifest_tools:
            continue
        if manifest_tools.highest_version(cp) is None:
            continue
        version = get_manifest_info(cp)["version_str"]
        if not glob.glob(os.path.join(REPO_ROOT, "builds", name, "*" + "[.]mc*")):
            continue  # nothing built for this project (not buildable / not built yet)
        status = snapshot_status(name, version, manifest_tools.compute_source_hash(cp))
        flag = "ok " if status == "current" else "BAD"
        if status != "current":
            bad += 1
        print(f"[{flag}] {name}: v{version} snapshot is {status}")
    print(f"[Verify] {bad} project(s) need attention." if bad else "[Verify] All snapshots match their source.")
    return 1 if bad else 0


def main():
    parser = argparse.ArgumentParser(
        description="Build packs and synchronize project catalogs."
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
        "--bump",
        action="store_true",
        default=os.environ.get("AUTO_BUMP_MANIFEST", "").lower() in {"1", "true", "yes"},
        help="When a project's source changed since its snapshot at the current manifest "
             "version, bump X.Y.Z -> X.Y.(Z+1) in every manifest first (UUIDs untouched). "
             "Without it the snapshot for that version is refreshed in place. "
             "Env: AUTO_BUMP_MANIFEST=true.",
    )
    parser.add_argument(
        "--verify",
        action="store_true",
        help="Build nothing: report whether each project's builds/ snapshot matches its source "
             "and manifest version; exit 1 if any is missing or stale.",
    )
    args = parser.parse_args()

    project_dirs = find_target_project_dirs()

    if args.verify:
        sys.exit(verify_snapshots(project_dirs))

    # Determine which projects to process
    source_changed_projects = set()
    if args.all:
        print("[Build] Mode: ALL (explicit override) — processing every project in repository...")
        changed_projects = sorted(list(project_dirs.keys()))
        if args.bump:
            try:
                source_changed_projects = set(detect_changed_projects(
                    get_git_diff_files(args.base), project_dirs
                ))
            except subprocess.CalledProcessError as exc:
                print(f"[Build] Could not inspect source changes for bump detection: {exc}", file=sys.stderr)
    elif args.project:
        print(f"[Build] Mode: EXPLICIT PROJECT — {args.project}")
        matched = [
            p for p in project_dirs
            if args.project in (p, os.path.relpath(p, REPO_ROOT), os.path.basename(p))
        ]
        if len(matched) != 1:
            if matched:
                print(f"[Build] Error: '{args.project}' matches multiple projects:")
                for path in matched:
                    print(f"  - {os.path.relpath(path, REPO_ROOT)}")
                sys.exit(1)
            print(f"[Build] Error: No project matching '{args.project}' found.")
            sys.exit(1)
        changed_projects = matched
        if args.bump:
            try:
                source_changed_projects = set(detect_changed_projects(
                    get_git_diff_files(args.base), project_dirs
                ))
            except subprocess.CalledProcessError as exc:
                print(f"[Build] Could not inspect source changes for bump detection: {exc}", file=sys.stderr)
    else:
        print(f"[Build] Checking changed files (base: {args.base or 'auto'})...")
        try:
            changed_files = get_git_diff_files(args.base)
        except subprocess.CalledProcessError as exc:
            print(f"[Build] Could not diff against {args.base or 'auto'} ({exc}); processing every project instead.")
            changed_files = None
        if changed_files is None:
            changed_projects = sorted(project_dirs.keys())
            changed_files = []
        print(f"[Build] Diff contains {len(changed_files)} changed file(s).")
        if changed_files or not changed_projects:
            changed_projects = detect_changed_projects(changed_files, project_dirs)
        source_changed_projects = set(detect_changed_projects(changed_files, project_dirs))
        source_files = [
            f for f in changed_files
            if any(is_version_worthy_source_file(p, f) for p in project_dirs)
        ]
        print(f"[Build] Pack source changes: {len(source_files)} file(s).")

    # Do not sweep every unregistered project on ordinary pushes. That behavior
    # caused unrelated/legacy projects to be processed unexpectedly. New projects are
    # discovered naturally when their source files change; --project and --all remain
    # explicit operator overrides for intentional processing.
    
    if not changed_projects:
        print("[Build] No pack/map/script changes or new projects detected.")
        _write_rebuilt_projects([])
        sys.exit(0)

    print(f"[Build] Processing {len(changed_projects)} project(s):")
    for cp in changed_projects:
        print(f"  - {os.path.relpath(cp, REPO_ROOT)}")

    updated_summary = []
    rebuilt_projects = []

    for cp in changed_projects:
        cat = project_dirs.get(cp)
        if cat is None:
            print(f"\nSkipping {cp}: not in known category.")
            continue

        # Required marker prevents accidental packaging of unprotected add-ons.
        normalized_category = cat.replace("\\", "/").strip("/")
        if normalized_category == "MCPEDL/Addons":
            lock_path = os.path.join(cp, "LOCK")
            try:
                with open(lock_path, encoding="utf-8") as lock_file:
                    lock_content = lock_file.read()
            except OSError:
                lock_content = ""
            if not lock_content.startswith(("ALNStudios Add-on Lock v1", "ALNStudios Add-on Lock v1")):
                print(f"[Build] Missing/invalid LOCK marker, creating: {os.path.relpath(lock_path, REPO_ROOT)}")
                with open(lock_path, "w", encoding="utf-8", newline="\n") as lock_file:
                    lock_file.write(
                        "ALNStudios Add-on Lock v1\n\n"
                        "Required repository marker for build validation.\n"
                        "This marker does not encrypt source files or prevent extraction of distributable packages.\n")

        proj_name = os.path.basename(cp)
        category_readme = os.path.join(REPO_ROOT, cat, "README.md")
        category_text = open(category_readme, encoding="utf-8").read() if os.path.isfile(category_readme) else ""
        is_new = proj_name not in category_text

        print(f"\nProcessing {os.path.relpath(cp, REPO_ROOT)} {'(NEW)' if is_new else ''}...")

        skip_world = proj_name in TEST_GATED_WORLD_PROJECTS

        # ── Follow the manifest ────────────────────────────────────────────
        # Icons are source files: settle them before hashing so the hash is stable.
        if make_pack_icon is not None:
            make_pack_icon.ensure_project_icons(cp)
        if manifest_tools:
            _seen = _manifest_version_set(cp)
            _target, _changed = manifest_tools.align_project_manifests(cp)
            if _changed:
                note = f" (manifests disagreed: {', '.join(sorted(_seen))})" if len(_seen) > 1 else ""
                print(f"  Aligned manifests to v{format_version(_target)}{note}:")
                for c in _changed:
                    print(f"    {c}")
        old_v = get_manifest_info(cp)["version_str"]
        new_v = old_v
        source_hash = manifest_tools.compute_source_hash(cp) if manifest_tools else None

        bumped_note = ""
        if args.bump and manifest_tools:
            # Test-gated worlds still receive manifest version updates; only their generic
            # package rebuild is skipped below because a dedicated world workflow owns archives.
            snapshot_state = snapshot_status(proj_name, old_v, source_hash)
            if should_bump_project(
                snapshot_state,
                source_changed_in_diff=(cp in source_changed_projects),
                is_new=is_new,
            ):
                nxt = manifest_tools.bump_patch(get_manifest_info(cp)["version_list"])
                manifest_tools.align_project_manifests(cp, target=nxt)
                new_v = format_version(nxt)
                bumped_note = f" [bumped v{old_v} -> v{new_v}]"
                print(
                    f"  Source change detected (snapshot: {snapshot_state}); "
                    f"bumped manifests to v{new_v}."
                )
        print(f"  Following manifest version v{new_v}")

        # ── Build packages with standardized filename format ───────────────
        # Dirtbound is included in automatic source/version processing, but its
        # world archives remain protected by the dedicated in-game-test gate.
        if proj_name in TEST_GATED_WORLD_PROJECTS:
            primary_file, built_files = None, None
            print("  Test-gated world project: skipping generic package rebuild; existing .mcworld files are untouched.")
        else:
            previous_packages = _package_hashes(proj_name)
            primary_file, built_files = rebuild_project_packages(cp, cat, new_v)
            if built_files and any(
                previous_packages.get(package[0])
                != _sha256_file(os.path.join(REPO_ROOT, "builds", proj_name, package[0]))
                for package in built_files
            ):
                rebuilt_projects.append(f"{cat}/{proj_name}")

        # ── Synchronize all Directory README files & links ─────────────────
        # ── Save this version into builds/<project>/versions/ ───────────────
        if primary_file and proj_name not in TEST_GATED_WORLD_PROJECTS:
            snap_result = save_version_snapshot(cp, proj_name, new_v, source_hash)

        update_readmes(cp, cat, old_v, new_v, primary_file, built_files)

        # ── Register if new ───────────────────────────────────────────────
        if is_new:
            register_new_project(cp, cat, new_v, primary_file)

        updated_summary.append(
            f"{proj_name}: rebuilt at v{new_v}{bumped_note}"
            + (" [NEW — registered in catalogs]" if is_new else "")
        )

    # Always ensure collection badge is synced with current project counts
    _update_collection_badge(os.path.join(REPO_ROOT, "README.md"))

    print("\n[Build] Completed successfully!")
    for s in updated_summary:
        print(f"  - {s}")
    _write_rebuilt_projects(rebuilt_projects)


if __name__ == "__main__":
    main()
