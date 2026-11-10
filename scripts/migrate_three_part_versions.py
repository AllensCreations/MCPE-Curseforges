#!/usr/bin/env python3
"""Migrate legacy X.Y.Z.A projects to X.Z.A (Release.Beta.Update) everywhere."""
import argparse
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(Path(__file__).resolve().parent))
import manifest_tools

CATEGORIES = ("Addons", "Maps", "Script", "Minigame")
HEADING = re.compile(r"^## \[(\d+\.\d+\.\d+(?:\.\d+)?)\] - (\d{4}-\d{2}-\d{2})\s*$")

def migrate_version(value):
    parts = [int(part) for part in value.split(".")]
    if len(parts) == 4:
        return f"{parts[0]}.{parts[2]}.{parts[3]}"
    if len(parts) == 3:
        return value
    raise ValueError(f"Unsupported version: {value}")

def migrate_changelog(path, write=True):
    original = path.read_text(encoding="utf-8")
    preamble, sections, current = [], [], None
    for line in original.splitlines():
        match = HEADING.fullmatch(line)
        if match:
            if current is not None: sections.append(current)
            version = migrate_version(match.group(1))
            current = [version, match.group(2), [f"## [{version}] - {match.group(2)}"]]
        elif current is None:
            preamble.append(line)
        else:
            current[2].append(line)
    if current is not None: sections.append(current)
    if not sections: return False
    merged, positions = [], {}
    for version, date, body in sections:
        if version in positions:
            merged[positions[version]][2].extend(["", *body[1:]])
        else:
            positions[version] = len(merged)
            merged.append([version, date, body])
    output = "\n".join(preamble).rstrip() + "\n\n" + "\n\n".join("\n".join(section[2]).rstrip() for section in merged) + "\n"
    if output != original and write: path.write_text(output, encoding="utf-8")
    return output != original

def projects():
    for category in CATEGORIES:
        root = ROOT / "MCPEDL" / category
        if root.is_dir():
            for project in sorted(root.iterdir()):
                if project.is_dir(): yield project

def migrate_registry(write=True):
    path = ROOT / "builds" / "Curseforge_IDs.json"
    if not path.is_file(): return False
    data = json.loads(path.read_text(encoding="utf-8"))
    changed = False
    for entry in data.values():
        if not isinstance(entry, dict): continue
        if entry.pop("last_alpha_version", None) is not None: changed = True
        for field in ("last_published_version", "last_release_version"):
            value = entry.get(field)
            if isinstance(value, str):
                normalized = migrate_version(value)
                if normalized != value: entry[field] = normalized; changed = True
    if changed and write: path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    return changed

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--check", action="store_true", help="Report files needing migration without writing.")
    args = parser.parse_args()
    write = not args.check
    changed = []
    for project in projects():
        target = manifest_tools.highest_version(str(project))
        if target is not None:
            _, manifests = manifest_tools.align_project_manifests(str(project), target=target, write=write)
            changed.extend(manifests)
        changelog = project / "CHANGELOG.md"
        if changelog.is_file() and migrate_changelog(changelog, write):
            changed.append(changelog.relative_to(ROOT).as_posix())
    if migrate_registry(write): changed.append("builds/Curseforge_IDs.json")
    for item in changed: print(("would migrate: " if args.check else "migrated: ") + item)
    print(f"Version migration: {len(changed)} file(s) {'need migration' if args.check else 'updated'}.")
    return 1 if args.check and changed else 0

if __name__ == "__main__": raise SystemExit(main())
