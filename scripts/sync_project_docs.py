#!/usr/bin/env python3
"""Keep each project's DESCRIPTION.md heading version and CHANGELOG.md newest entry in step with its manifest version."""
import argparse, datetime, json, re, subprocess, sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import check_manifest_versions as cmv
import sync_manifest_versions as smv

ROOT = cmv.ROOT
ENTRY_RE = re.compile(r"^## \[(\d+)\.(\d+)\.(\d+)\]")
CATEGORIES = (
    ("items", {"items"}),
    ("blocks", {"blocks"}),
    ("crafting recipes", {"recipes"}),
    ("mobs", {"entities", "spawn_rules"}),
    ("loot", {"loot_tables"}),
    ("trading", {"trading"}),
    ("gameplay scripts", {"scripts"}),
    ("translations", {"texts"}),
    ("visuals", {"textures", "models", "animations", "animation_controllers", "render_controllers", "attachables", "particles", "ui"}),
    ("audio", {"sounds"}),
    ("structures", {"structures"}),
    ("world data", {"world"}),
)


def project_version(project):
    versions = []
    for path in Path(project).rglob("manifest.json"):
        if cmv.is_installed_copy(path) or "node_modules" in path.parts:
            continue
        data = smv.read_json(path)
        if isinstance(data, dict) and isinstance(data.get("header"), dict):
            version = data["header"].get("version")
            if cmv.is_triple(version):
                versions.append(tuple(version))
    return max(versions) if versions else None


def project_title(project):
    ab = smv.import_bump()
    try:
        return ab.get_project_title(str(project))
    except Exception:
        return Path(project).name.replace("-", " ").replace("_", " ").title()


def changed_areas(project, base):
    if not base:
        return []
    try:
        out = subprocess.check_output(["git", "diff", "--name-only", base, "--", str(project)], cwd=ROOT, text=True)
    except (subprocess.CalledProcessError, OSError):
        return []
    found = set()
    for line in out.splitlines():
        parts = Path(line.strip()).parts
        for label, names in CATEGORIES:
            if any(part in names for part in parts):
                found.add(label)
    return [label for label, _ in CATEGORIES if label in found]


def join_list(items):
    if len(items) == 1:
        return items[0]
    if len(items) == 2:
        return f"{items[0]} and {items[1]}"
    return ", ".join(items[:-1]) + f", and {items[-1]}"


def entry_lines(version_text, date_text, areas):
    if areas:
        bullet = f"- **Content update**: Updated {join_list(areas)}."
    else:
        bullet = "- **Maintenance release**: Repackaged the pack; no gameplay changes were recorded."
    return [f"## [{version_text}] - {date_text}", "", "### Improved & Balanced", "", bullet, ""]


def sync_description(path, version_text):
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines(keepends=True)
    for i, line in enumerate(lines[:6]):
        if not line.startswith("# "):
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
        new = f"# {title} (v{version_text}){suffix}{newline}"
        if new == line:
            return None
        lines[i] = new
        return "".join(lines)
    return None


def sync_changelog(path, version, version_text, name, date_text, areas):
    exists = path.is_file()
    lines = path.read_text(encoding="utf-8").split("\n") if exists else []
    top = None
    for line in lines:
        match = ENTRY_RE.match(line)
        if match:
            top = tuple(int(g) for g in match.groups())
            break
    if top is not None and top >= version:
        return None, (f"newest entry {'.'.join(map(str, top))} is newer than manifest {version_text}; left alone." if top > version else None)
    if not exists:
        areas = []
        entry = ["## [" + version_text + "] - " + date_text, "", "### Added", "", f"- **Initial release**: First packaged release of {name}.", ""]
        lines = [f"# Changelog — {name}", "", "---", ""]
    else:
        entry = entry_lines(version_text, date_text, areas)
    if not any(l.startswith("# ") for l in lines):
        lines = [f"# Changelog — {name}", "", "---", ""] + lines
    first = next((i for i, l in enumerate(lines) if ENTRY_RE.match(l)), None)
    has_rule = any(l.strip() == "---" for l in lines[: first if first is not None else len(lines)])
    if not has_rule:
        title_index = next(i for i, l in enumerate(lines) if l.startswith("# "))
        lines[title_index + 1:title_index + 1] = ["", "---"]
        first = next((i for i, l in enumerate(lines) if ENTRY_RE.match(l)), None)
    if first is None:
        while lines and lines[-1] == "":
            lines.pop()
        lines += [""] + entry
    else:
        lines[first:first] = entry
    return "\n".join(lines).rstrip("\n") + "\n", None


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base", help="Git ref used to pick changed projects and describe what changed.")
    parser.add_argument("--project", help="One project folder or name.")
    parser.add_argument("--all", action="store_true", help="Every project under MCPEDL/.")
    parser.add_argument("--check", action="store_true", help="Report what would change; write nothing; exit 1 if anything would change.")
    parser.add_argument("--date", help="Entry date YYYY-MM-DD (default: today, UTC).")
    args = parser.parse_args()

    date_text = args.date or datetime.datetime.now(datetime.timezone.utc).date().isoformat()
    projects = smv.resolve_projects(args)
    if not projects:
        print("[Docs] No projects selected; nothing to do.")
        return 0
    changes, notes = [], []
    for project in projects:
        project = Path(project)
        version = project_version(project)
        if not version:
            continue
        version_text = ".".join(map(str, version))
        rel = cmv.rel(project)

        description = project / "DESCRIPTION.md"
        if description.is_file():
            updated = sync_description(description, version_text)
            if updated is not None:
                changes.append(f"{rel}/DESCRIPTION.md heading set to v{version_text}")
                if not args.check:
                    description.write_text(updated, encoding="utf-8")

        changelog = project / "CHANGELOG.md"
        areas = changed_areas(project, args.base)
        updated, note = sync_changelog(changelog, version, version_text, project_title(project), date_text, areas)
        if note:
            notes.append(f"{rel}/CHANGELOG.md: {note}")
        if updated is not None:
            verb = "created" if not changelog.is_file() else "gained an entry for"
            changes.append(f"{rel}/CHANGELOG.md {verb} {version_text}" + (f" ({join_list(areas)})" if areas else ""))
            if not args.check:
                changelog.write_text(updated, encoding="utf-8")

    for line in changes:
        print(f"[Docs] {'would have: ' if args.check else ''}{line}")
    for line in notes:
        print(f"NOTICE: {line}")
    if changes:
        print("NOTICE: Generated changelog entries are factual but generic. Edit them to describe the player-visible changes.")
    else:
        print("[Docs] DESCRIPTION headings and CHANGELOG entries already match the manifest versions.")
    return 1 if (args.check and changes) else 0


if __name__ == "__main__":
    raise SystemExit(main())
