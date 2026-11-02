#!/usr/bin/env python3
"""Keep the workflow dropdowns in sync with MCPEDL/ and the saved CurseForge IDs.

Two workflows are managed:
  auto-version-bump.yml     one list per category (all projects)
  publish-curseforge.yml    one list of registered packs only (those with builds/<name>/Curseforge_Info.json)

  python3 scripts/sync_dispatch_choices.py           rewrite the dropdown lists
  python3 scripts/sync_dispatch_choices.py --check   exit 1 if the lists are stale (used by CI)

GitHub allows at most 25 options per dropdown, so each list holds "-" plus up to 24 projects.
Workflow files cannot be pushed by the Actions token, so run this locally after adding or
removing a project, then commit the workflow file.
"""
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
WORKFLOWS_DIR = os.path.join(ROOT, ".github", "workflows")
BUMP_WORKFLOW = os.path.join(WORKFLOWS_DIR, "auto-version-bump.yml")
PUBLISH_WORKFLOW = os.path.join(WORKFLOWS_DIR, "publish-curseforge.yml")
CATEGORIES = {
    "addon": "MCPEDL/Addons",
    "script": "MCPEDL/Script",
    "minigame": "MCPEDL/Minigame",
    "map": "MCPEDL/Maps",
}
MAX_PROJECTS = 24


def projects(category):
    base = os.path.join(ROOT, *category.split("/"))
    if not os.path.isdir(base):
        return []
    names = [n for n in os.listdir(base)
             if os.path.isdir(os.path.join(base, n)) and not n.startswith(".")]
    return sorted(names, key=str.lower)


def registered_packs():
    """Full MCPEDL paths of packs that have a saved CurseForge ID."""
    found = []
    for category in ("Addons", "Maps", "Script", "Minigame"):
        for name in projects(f"MCPEDL/{category}"):
            if os.path.isfile(os.path.join(ROOT, "builds", name, "Curseforge_Info.json")):
                found.append(f"MCPEDL/{category}/{name}")
    return sorted(found, key=str.lower)


def render_publish(lines):
    """Rewrite the '# BEGIN registered' block with registered packs only."""
    out, i = [], 0
    while i < len(lines):
        line = lines[i]
        out.append(line)
        if line.strip() == "# BEGIN registered":
            indent = line[: len(line) - len(line.lstrip())]
            j = i + 1
            while j < len(lines) and lines[j].strip() != "# END registered":
                j += 1
            if j >= len(lines):
                i += 1
                continue
            names = registered_packs()
            if len(names) > MAX_PROJECTS:
                print(f"WARNING: {len(names)} registered packs; only the first {MAX_PROJECTS} fit in the dropdown.")
                names = names[:MAX_PROJECTS]
            out.append(f'{indent}- "-"')
            out.extend(f'{indent}- "{n}"' for n in names)
            out.append(lines[j])
            i = j + 1
            continue
        i += 1
    return out


def render(lines):
    out, i = [], 0
    while i < len(lines):
        line = lines[i]
        out.append(line)
        stripped = line.strip()
        if stripped.startswith("# BEGIN "):
            key = stripped[len("# BEGIN "):].strip()
            indent = line[: len(line) - len(line.lstrip())]
            j = i + 1
            while j < len(lines) and lines[j].strip() != f"# END {key}":
                j += 1
            if j >= len(lines) or key not in CATEGORIES:
                i += 1
                continue
            names = projects(CATEGORIES[key])
            if len(names) > MAX_PROJECTS:
                print(f"WARNING: {CATEGORIES[key]} has {len(names)} projects; only the first "
                      f"{MAX_PROJECTS} fit in the dropdown (use the 'other' box for the rest).")
                names = names[:MAX_PROJECTS]
            out.append(f'{indent}- "-"')
            out.extend(f'{indent}- "{n}"' for n in names)
            out.append(lines[j])
            i = j + 1
            continue
        i += 1
    return out


def sync_file(path, renderer, check):
    if not os.path.isfile(path):
        return 0 if path == PUBLISH_WORKFLOW else 1
    with open(path, encoding="utf-8") as fh:
        text = fh.read()
    new_text = "\n".join(renderer(text.split("\n")))
    name = os.path.basename(path)
    if new_text == text:
        print(f"{name}: dropdown lists already up to date.")
        return 0
    if check:
        print(f"{name}: dropdown lists are stale. Run: python3 scripts/sync_dispatch_choices.py  then commit the workflow.")
        return 1
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(new_text)
    print(f"{name}: updated dropdown lists.")
    return 0


def main():
    check = "--check" in sys.argv
    status = sync_file(BUMP_WORKFLOW, render, check)
    status |= sync_file(PUBLISH_WORKFLOW, render_publish, check)
    return status


if __name__ == "__main__":
    raise SystemExit(main())
