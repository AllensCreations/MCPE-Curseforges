#!/usr/bin/env python3
"""One-time migration from legacy X.Y.Z.A (Release.Alpha.Beta.Update) to X.Y.Z (Release.Beta.Update)."""
import argparse
import json
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MARKER = ROOT / "builds" / ".three_part_version_migrated"
sys.path.insert(0, str(Path(__file__).resolve().parent))
import manifest_tools

CATEGORIES = ("Addons", "Maps", "Script", "Minigame")
HEADING = re.compile(r"^## \[(\d+\.\d+\.\d+(?:\.\d+)?)\] - (\d{4}-\d{2}-\d{2})\s*$")
VERSION = re.compile(r"^\d+\.\d+\.\d+(?:\.\d+)?$")

def migrate_version(value):
    """Legacy X.Y.Z.A -> X.Z.A; legacy X.Y.Z -> X.Z.0."""
    if not isinstance(value, str) or not VERSION.fullmatch(value):
        raise ValueError(f"Unsupported legacy version: {value!r}")
    parts = [int(part) for part in value.split(".")]
    if len(parts) == 4:
        return f"{parts[0]}.{parts[2]}.{parts[3]}"
    return f"{parts[0]}.{parts[2]}.0"

def projects():
    for category in CATEGORIES:
        root = ROOT / "MCPEDL" / category
        if root.is_dir():
            for project in sorted(root.iterdir()):
                if project.is_dir():
                    yield project

def project_target(project):
    """Choose the highest mapped version from source headers, metadata and changelog."""
    candidates = []
    for raw_path in manifest_tools.source_manifest_paths(str(project)):
        try:
            data = json.loads(Path(raw_path).read_text(encoding="utf-8"))
        except (OSError, ValueError):
            continue
        header = data.get("header") if isinstance(data, dict) else None
        if isinstance(header, dict):
            version = header.get("version")
            if isinstance(version, list) and len(version) == 3 and all(type(p) is int and p >= 0 for p in version):
                candidates.append((version[0], version[2], 0))
            title = header.get("name")
            if isinstance(title, str):
                match = re.search(r"\\(v(\\d+\\.\\d+\\.\\d+(?:\\.\\d+)?)\\)\\s*$", title)
                if match:
                    try:
                        candidates.append(tuple(int(p) for p in migrate_version(match.group(1)).split(".")))
                    except ValueError:
                        pass
        metadata = data.get("metadata") if isinstance(data, dict) else None
        full = metadata.get("version") if isinstance(metadata, dict) else None
        if isinstance(full, str):
            try:
                candidates.append(tuple(int(p) for p in migrate_version(full).split(".")))
            except ValueError:
                pass
    changelog = project / "CHANGELOG.md"
    if changelog.is_file():
        for line in changelog.read_text(encoding="utf-8").splitlines():
            match = HEADING.fullmatch(line)
            if match:
                candidates.append(tuple(int(p) for p in migrate_version(match.group(1)).split(".")))
                break
    return list(max(candidates)) if candidates else None

def migrate_changelog(path, write=True):
    original = path.read_text(encoding="utf-8")
    preamble, sections, current = [], [], None
    for line in original.splitlines():
        match = HEADING.fullmatch(line)
        if match:
            if current is not None:
                sections.append(current)
            version = migrate_version(match.group(1))
            current = [version, match.group(2), [f"## [{version}] - {match.group(2)}"]]
        elif current is None:
            preamble.append(line)
        else:
            current[2].append(line)
    if current is not None:
        sections.append(current)
    if not sections:
        return False
    merged, positions = [], {}
    for version, date, body in sections:
        if version in positions:
            merged[positions[version]][2].extend(["", *body[1:]])
        else:
            positions[version] = len(merged)
            merged.append([version, date, body])
    output = "\n".join(preamble).rstrip() + "\n\n" + "\n\n".join("\n".join(section[2]).rstrip() for section in merged) + "\n"
    if output != original and write:
        path.write_text(output, encoding="utf-8")
    return output != original

def migrate_registry(write=True):
    path = ROOT / "builds" / "Curseforge_IDs.json"
    if not path.is_file():
        return False
    data = json.loads(path.read_text(encoding="utf-8"))
    changed = False
    for entry in data.values():
        if not isinstance(entry, dict):
            continue
        if "last_alpha_version" in entry:
            del entry["last_alpha_version"]
            changed = True
        for field in ("last_published_version", "last_release_version"):
            value = entry.get(field)
            if isinstance(value, str) and VERSION.fullmatch(value):
                normalized = migrate_version(value)
                if normalized != value:
                    entry[field] = normalized
                    changed = True
    if changed and write:
        path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    return changed

def migrate_legacy_info_files(write=True):
    """Normalize old per-pack Curseforge_Info.json baselines before they are imported."""
    changed = []
    builds = ROOT / "builds"
    if not builds.is_dir():
        return changed
    for path in sorted(builds.glob("*/Curseforge_Info.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        if not isinstance(data, dict):
            continue
        dirty = False
        if "last_alpha_version" in data:
            del data["last_alpha_version"]
            dirty = True
        for field in ("last_published_version", "last_release_version"):
            value = data.get(field)
            if isinstance(value, str) and VERSION.fullmatch(value):
                normalized = migrate_version(value)
                if normalized != value:
                    data[field] = normalized
                    dirty = True
        if dirty:
            if write:
                path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
            changed.append(path.relative_to(ROOT).as_posix())
    return changed

def archive_old_snapshots(write=True):
    """Preserve old three/four-part snapshot folders outside the active X.Y.Z namespace."""
    changed = []
    builds = ROOT / "builds"
    if not builds.is_dir():
        return changed
    for versions_dir in builds.glob("*/versions"):
        for legacy in sorted(versions_dir.iterdir()):
            if not legacy.is_dir() or not re.fullmatch(r"V\d+\.\d+\.\d+(?:\.\d+)?", legacy.name):
                continue
            destination = versions_dir.parent / "legacy_versions" / legacy.name
            if destination.exists():
                continue
            if write:
                destination.parent.mkdir(parents=True, exist_ok=True)
                shutil.move(str(legacy), str(destination))
                changed.append(destination.relative_to(ROOT).as_posix())
            else:
                changed.append(legacy.relative_to(ROOT).as_posix())
    return changed

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Report files needing migration without writing.")
    args = parser.parse_args()
    if MARKER.exists():
        print("Three-part version migration already completed; no changes needed.")
        return 0
    write = not args.check
    changed = []
    for project in projects():
        target = project_target(project)
        if target is not None:
            _, manifests = manifest_tools.align_project_manifests(str(project), target=target, write=write)
            changed.extend(manifests)
        changelog = project / "CHANGELOG.md"
        if changelog.is_file() and migrate_changelog(changelog, write):
            changed.append(changelog.relative_to(ROOT).as_posix())
    if migrate_registry(write):
        changed.append("builds/Curseforge_IDs.json")
    changed.extend(migrate_legacy_info_files(write))
    changed.extend(archive_old_snapshots(write))
    for item in changed:
        print(("would migrate: " if args.check else "migrated: ") + item)
    print(f"Version migration: {len(changed)} file(s) {'need migration' if args.check else 'updated'}.")
    if write:
        MARKER.parent.mkdir(parents=True, exist_ok=True)
        MARKER.write_text("Migrated legacy Release.Alpha.Beta.Update versions to Release.Beta.Update.\n", encoding="utf-8")
    return 1 if args.check and changed else 0

if __name__ == "__main__":
    raise SystemExit(main())
