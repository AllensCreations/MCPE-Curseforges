#!/usr/bin/env python3
"""Manifest helpers shared by the build, publish and maintenance scripts.

What lives here
  * align_project_manifests - make every source manifest of a project share ONE version
    (the highest, or an explicit target): header.version, the "(vX.Y.Z)" title suffix,
    module versions and BP->RP dependency versions. Pack UUIDs are never touched.
  * bump_patch - the next X.Y.(Z+1) after the highest manifest version.

Versions are exactly X.Y.Z everywhere: header.version, metadata.version, the "(vX.Y.Z)" title suffix, changelog headings, package names and build snapshots.
  * ensure_metadata - fill metadata.authors (and metadata.license when MANIFEST_LICENSE is set).
  * compute_source_hash - a content hash of a project's source that ignores everything the
    build itself rewrites (manifest versions/titles, derived world copies, docs, archives),
    so "did the source change since the last snapshot?" has a stable answer.

CLI (explicit maintenance)
  python3 scripts/manifest_tools.py --project MCPEDL/Addons/Mining-Helmet --check
  python3 scripts/manifest_tools.py --project MCPEDL/Addons/Mining-Helmet --align
  python3 scripts/manifest_tools.py --project MCPEDL/Addons/Mining-Helmet --bump
  python3 scripts/manifest_tools.py --all --check
"""
import argparse
import copy
import hashlib
import json
import os
import re
import sys

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
INSTALLED_COPY_PARTS = {"world", "worlds", "behavior_packs", "resource_packs"}
JUNK_DIRS = {"__pycache__", ".git", ".github", "node_modules"}
JUNK_FILES = {".ds_store", "thumbs.db", "desktop.ini", ".gitkeep"}
BINARY_EXT = {".mcpack", ".mcaddon", ".mcworld", ".zip"}
TITLE_SUFFIX_RE = re.compile(r"(?:\s*\(v\d+\.\d+\.\d+(?:\.\d+)?\))+\s*$")
HAS_SUFFIX_RE = re.compile(r"\(v\d+\.\d+\.\d+(?:\.\d+)?\)\s*$")
FULL_RE = re.compile(r"^(\d+)\.(\d+)\.(\d+)$")
AUTHOR = "ALNStudios"
LEGACY_AUTHORS = ("ALNStudios",)
FILENAME_TEMPLATE_ENV = "PACK_FILENAME_TEMPLATE"
DEFAULT_FILENAME_TEMPLATE = "{title} by {author} (V{version})"
_PACK_WORD_RE = re.compile(r"\s+(?:BP|RP|Behavior Pack|Resource Pack|Behaviour Pack)\s*$", re.IGNORECASE)
# The only derived copy a map build writes inside its own source tree (see the builder).
DERIVED_WORLD_COPY = "world/behavior_packs/OneBlockVoid/"


def is_triple(value):
    return (isinstance(value, list) and len(value) == 3
            and all(type(p) is int and p >= 0 for p in value))


def fmt(version):
    return ".".join(str(p) for p in version)


def source_manifest_paths(project_path):
    """Source manifests only; installed world copies and node_modules are ignored."""
    found = []
    for root, dirs, files in os.walk(project_path):
        dirs[:] = sorted(d for d in dirs if d not in JUNK_DIRS)
        if "manifest.json" not in files:
            continue
        rel = os.path.relpath(root, project_path).replace(os.sep, "/")
        parts = set() if rel == "." else set(rel.split("/"))
        if parts & INSTALLED_COPY_PARTS:
            continue
        found.append(os.path.join(root, "manifest.json"))
    return sorted(found)


def _read(path):
    with open(path, encoding="utf-8") as fh:
        return json.load(fh)


def _dump(data):
    return json.dumps(data, ensure_ascii=False, indent=2) + "\n"


def highest_version(project_path):
    versions = []
    for path in source_manifest_paths(project_path):
        try:
            v = _read(path).get("header", {}).get("version")
        except (OSError, ValueError, AttributeError):
            continue
        if is_triple(v):
            versions.append(v)
    return max(versions) if versions else None


def parse_full(text):
    """Parse the only supported project version format: X.Y.Z."""
    m = FULL_RE.fullmatch(str(text or "").strip())
    return [int(m.group(i)) for i in range(1, 4)] if m else None

def full_of(data):
    meta = data.get("metadata") if isinstance(data, dict) else None
    return parse_full(meta.get("version")) if isinstance(meta, dict) else None

def highest_full(project_path):
    return highest_version(project_path)

def bump_patch(version):
    if not is_triple(version):
        raise ValueError("Version must contain exactly three non-negative integers")
    return [version[0], version[1], version[2] + 1]

def _retitle(name, version_text):
    """Replace an existing terminal (vX.Y.Z) suffix. Titles without one are left alone:
    the title validator reports them, it never silently rewrites them."""
    if isinstance(name, str) and HAS_SUFFIX_RE.search(name):
        return f"{TITLE_SUFFIX_RE.sub('', name).rstrip()} (v{version_text})"
    return name


def _migrate_legacy_name(value):
    if isinstance(value, str):
        for old in LEGACY_AUTHORS:
            value = re.sub(r"(?<![/\w])" + re.escape(old), AUTHOR, value)
    return value


def migrate_legacy_branding(data):
    """Rename the old creator name in header.description and metadata.authors. True if changed."""
    changed = False
    header = data.get("header")
    if isinstance(header, dict) and isinstance(header.get("description"), str):
        new = _migrate_legacy_name(header["description"])
        if new != header["description"]:
            header["description"] = new
            changed = True
    meta = data.get("metadata")
    if isinstance(meta, dict) and isinstance(meta.get("authors"), list):
        new = [_migrate_legacy_name(a) for a in meta["authors"]]
        if new != meta["authors"]:
            meta["authors"] = new
            changed = True
    return changed


def ensure_metadata(data, license_text=None):
    """Fill metadata.authors (and metadata.license if given). Returns True if changed."""
    changed = migrate_legacy_branding(data)
    meta = data.get("metadata")
    if not isinstance(meta, dict):
        meta = {}
        data["metadata"] = meta
        changed = True
    authors = meta.get("authors")
    if not (isinstance(authors, list) and any(isinstance(a, str) and a.strip() for a in authors)):
        meta["authors"] = [AUTHOR]
        changed = True
    if license_text and not meta.get("license"):
        meta["license"] = license_text
        changed = True
    return changed


def align_project_manifests(project_path, target=None, write=True, metadata=True):
    """Align every source manifest to one Minecraft-compatible X.Y.Z version."""
    paths = source_manifest_paths(project_path)
    loaded = []
    for path in paths:
        try: data = _read(path)
        except (OSError, ValueError):
            print(f"WARNING: unreadable manifest skipped: {path}", file=sys.stderr); continue
        if isinstance(data, dict) and isinstance(data.get("header"), dict): loaded.append((path, data))
    if not loaded: return None, []
    if target is None:
        versions = [d["header"]["version"] for _, d in loaded if is_triple(d["header"].get("version"))]
        if not versions: return None, []
        target = max(versions)
    target = list(target)
    if not is_triple(target): raise ValueError("Target version must be exactly X.Y.Z")
    target_text = fmt(target)
    own_uuids = {d["header"].get("uuid") for _, d in loaded}
    license_text = os.environ.get("MANIFEST_LICENSE", "").strip() or None
    changed = []
    for path, data in loaded:
        before = copy.deepcopy(data)
        header = data["header"]
        meta = data.get("metadata")
        if not isinstance(meta, dict): meta = {}; data["metadata"] = meta
        meta["version"] = target_text
        header["version"] = target
        for module in data.get("modules", []) or []:
            if isinstance(module, dict) and isinstance(module.get("version"), list): module["version"] = target
        retitled = _retitle(header.get("name"), target_text)
        if retitled != header.get("name"): header["name"] = retitled
        deps = data.get("dependencies", [])
        for dep in deps if isinstance(deps, list) else []:
            if isinstance(dep, dict) and dep.get("uuid") in own_uuids and isinstance(dep.get("version"), list): dep["version"] = target
        migrate_legacy_branding(data)
        if metadata and os.environ.get("MANIFEST_METADATA", "1") != "0": ensure_metadata(data, license_text)
        if data != before:
            if write:
                with open(path, "w", encoding="utf-8", newline="\n") as fh: fh.write(_dump(data))
            changed.append(os.path.relpath(path, REPO_ROOT).replace(os.sep, "/"))
    return target, changed

def _normalized_manifest_bytes(raw, own_uuids):
    """Manifest content minus everything the version machinery rewrites."""
    try:
        data = json.loads(raw.decode("utf-8"))
        header = data.get("header", {})
        header.pop("version", None)
        if isinstance(data.get("metadata"), dict):
            data["metadata"].pop("version", None)
        if isinstance(header.get("name"), str):
            header["name"] = TITLE_SUFFIX_RE.sub("", header["name"]).rstrip()
        for module in data.get("modules", []) or []:
            if isinstance(module, dict):
                module.pop("version", None)
        for dep in data.get("dependencies", []) or []:
            if isinstance(dep, dict) and dep.get("uuid") in own_uuids:
                dep.pop("version", None)
        return json.dumps(data, sort_keys=True, ensure_ascii=False).encode("utf-8")
    except (ValueError, AttributeError, UnicodeDecodeError):
        return raw


def is_source_rel_path(rel):
    """Which project files count as pack source for change detection."""
    low = rel.lower()
    base = os.path.basename(low)
    if base in JUNK_FILES or base.endswith(("~", ".bak", ".tmp", ".orig", ".importing")):
        return False
    if base.endswith(".md") or base in {"license", "license.txt", "notice", "notice.txt", "lock"}:
        return False
    if os.path.splitext(base)[1] in BINARY_EXT:
        return False
    if rel.startswith(DERIVED_WORLD_COPY):
        return False
    return True


def compute_source_hash(project_path):
    """Stable SHA-256 over the project's source (see is_source_rel_path)."""
    own_uuids = set()
    for path in source_manifest_paths(project_path):
        try:
            own_uuids.add(_read(path).get("header", {}).get("uuid"))
        except (OSError, ValueError, AttributeError):
            pass
    manifest_set = set(source_manifest_paths(project_path))
    digest = hashlib.sha256()
    entries = []
    for root, dirs, files in os.walk(project_path):
        dirs[:] = sorted(d for d in dirs if d not in JUNK_DIRS)
        for name in sorted(files):
            full = os.path.join(root, name)
            rel = os.path.relpath(full, project_path).replace(os.sep, "/")
            if is_source_rel_path(rel):
                entries.append((rel, full))
    for rel, full in sorted(entries):
        with open(full, "rb") as fh:
            raw = fh.read()
        if full in manifest_set:
            raw = _normalized_manifest_bytes(raw, own_uuids)
        digest.update(rel.encode("utf-8") + b"\0")
        digest.update(hashlib.sha256(raw).digest())
    return digest.hexdigest()


def manifest_title(project_path):
    """Pack title taken from the source manifests: header.name without the (vX.Y.Z) suffix and
    without a trailing BP/RP word. Returns None unless every manifest agrees on one title."""
    titles = set()
    for path in source_manifest_paths(project_path):
        try:
            name = _read(path).get("header", {}).get("name")
        except (OSError, ValueError, AttributeError):
            continue
        if not isinstance(name, str):
            continue
        name = TITLE_SUFFIX_RE.sub("", name).strip()
        name = _PACK_WORD_RE.sub("", name).strip()
        name = re.sub(r'[\\/*?:"<>|]', "", name).strip()
        if name:
            titles.add(name)
    return titles.pop() if len(titles) == 1 else None


def _manifest_filename_template(project_path):
    for path in source_manifest_paths(project_path):
        try:
            value = (_read(path).get("metadata") or {}).get("package_filename")
        except (OSError, ValueError, AttributeError):
            continue
        if isinstance(value, str) and value.strip():
            return value.strip()
    return None


def package_basename(project_path, version_text, fallback_title):
    """File name (without extension) of the downloadable package.

    Title comes from the manifest header.name (fallback: the DESCRIPTION title) and the version
    from the manifest. Template precedence: manifest metadata.package_filename, then the
    PACK_FILENAME_TEMPLATE variable, then '{title} by {author} (V{version})'. Placeholders:
    {title}, {version}, {author}. A template must keep the '(V{version})' token because the
    README link repair finds packages by it; otherwise the default template is used.
    """
    title = manifest_title(project_path) or fallback_title
    template = (_manifest_filename_template(project_path)
                or os.environ.get(FILENAME_TEMPLATE_ENV, "").strip()
                or DEFAULT_FILENAME_TEMPLATE)
    if "(V{version})" not in template:
        print(f"WARNING: filename template {template!r} lacks '(V{{version}})'; using the default.", file=sys.stderr)
        template = DEFAULT_FILENAME_TEMPLATE
    try:
        name = template.format(title=title, version=version_text, author=AUTHOR)
    except (KeyError, IndexError, ValueError):
        print(f"WARNING: bad filename template {template!r}; using the default.", file=sys.stderr)
        name = DEFAULT_FILENAME_TEMPLATE.format(title=title, version=version_text, author=AUTHOR)
    return re.sub(r'[\\/*?:"<>|]', "", name).strip()


def latest_changelog_version(project_path):
    """First '## [X.Y.Z]' heading of CHANGELOG.md, or None."""
    path = os.path.join(project_path, "CHANGELOG.md")
    try:
        with open(path, encoding="utf-8") as fh:
            for line in fh:
                m = re.match(r"^## \[(\d+\.\d+\.\d+(?:\.\d+)?)\]", line)
                if m:
                    parts = parse_full(m.group(1))
                    if len(m.group(1).split(".")) == 4:
                        raw = [int(p) for p in m.group(1).split(".")]
                        parts = [raw[0], raw[2], raw[3]]
                    return fmt(parts) if parts else None
    except OSError:
        pass
    return None


def _all_projects():
    out = []
    for cat in ("Addons", "Maps", "Script", "Minigame"):
        base = os.path.join(REPO_ROOT, "MCPEDL", cat)
        if os.path.isdir(base):
            out += [os.path.join(base, n) for n in sorted(os.listdir(base))
                    if os.path.isdir(os.path.join(base, n))]
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--project", action="append", help="Project path (repeatable).")
    ap.add_argument("--all", action="store_true", help="Every project under MCPEDL/.")
    mode = ap.add_mutually_exclusive_group(required=True)
    mode.add_argument("--check", action="store_true", help="Report what --align would change; write nothing.")
    mode.add_argument("--align", action="store_true", help="Align every manifest to the highest version.")
    mode.add_argument("--bump", action="store_true", help="Align to highest X.Y.Z+1.")
    args = ap.parse_args()

    if args.all:
        projects = _all_projects()
    elif args.project:
        projects = [p if os.path.isabs(p) else os.path.join(REPO_ROOT, p) for p in args.project]
    else:
        ap.error("pass --project or --all")

    dirty = False
    for project in projects:
        high = highest_version(project)
        if high is None:
            print(f"{os.path.relpath(project, REPO_ROOT)}: no source manifest")
            continue
        target = bump_patch(high) if args.bump else None
        _, changed = align_project_manifests(project, target=target, write=not args.check)
        label = os.path.relpath(project, REPO_ROOT)
        if changed:
            dirty = True
            verb = "would change" if args.check else "changed"
            print(f"{label}: v{fmt(high)} -> v{fmt(target or high)}; {verb} {len(changed)} manifest(s)")
            for c in changed:
                print(f"    {c}")
        else:
            print(f"{label}: v{fmt(high)} consistent")
    return 1 if (args.check and dirty) else 0


if __name__ == "__main__":
    raise SystemExit(main())
