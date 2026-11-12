#!/usr/bin/env python3
"""Keep the "Registered pack" dropdown of Publish to CurseForge in sync with the saved CurseForge IDs.

One workflow is managed: publish-curseforge.yml
  publish_project   one list of registered packs only (those listed in builds/Curseforge_IDs.json)

The build workflow (auto-version-bump.yml, "Build Changed Packs & Sync Catalogs") and the delete
workflow have no pack dropdowns any more, so there is nothing else to keep in sync.

  python3 scripts/sync_dispatch_choices.py           rewrite the dropdown list
  python3 scripts/sync_dispatch_choices.py --check   exit 1 if the list is stale (used by CI)

GitHub allows at most 25 options per dropdown, so the list holds "-" plus up to 24 packs.
Workflow files cannot be pushed by the Actions token alone (a WORKFLOW_PAT secret is needed), so
when the workflow cannot push, run this locally and commit the workflow file.
"""
import json
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
WORKFLOWS_DIR = os.path.join(ROOT, ".github", "workflows")
PUBLISH_WORKFLOW = os.path.join(WORKFLOWS_DIR, "publish-curseforge.yml")
CATEGORY_FOLDERS = ("Addons", "Maps", "Script", "Minigame")
MAX_PROJECTS = 24


def projects(category):
    base = os.path.join(ROOT, *category.split("/"))
    if not os.path.isdir(base):
        return []
    names = [n for n in os.listdir(base)
             if os.path.isdir(os.path.join(base, n)) and not n.startswith(".")]
    return sorted(names, key=str.lower)


def registered_packs():
    """Full MCPEDL paths of packs listed in builds/Curseforge_IDs.json (plus any not yet migrated)."""
    found = set()
    registry = os.path.join(ROOT, "builds", "Curseforge_IDs.json")
    if os.path.isfile(registry):
        with open(registry, encoding="utf-8") as fh:
            data = json.load(fh)
        found.update(key for key in data if os.path.isdir(os.path.join(ROOT, *key.split("/"))))
    for category in CATEGORY_FOLDERS:  # old per-pack files
        for name in projects(f"MCPEDL/{category}"):
            if os.path.isfile(os.path.join(ROOT, "builds", name, "Curseforge_Info.json")):
                found.add(f"MCPEDL/{category}/{name}")
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


def sync_file(path, renderer, check):
    if not os.path.isfile(path):
        print(f"{os.path.basename(path)} not found.")
        return 1
    with open(path, encoding="utf-8", newline="") as fh:
        text = fh.read()
    new_text = "\n".join(renderer(text.split("\n")))
    name = os.path.basename(path)
    if new_text == text:
        print(f"{name}: dropdown list already up to date.")
        return 0
    if check:
        print(f"{name}: dropdown list is stale. Run: python3 scripts/sync_dispatch_choices.py  then commit the workflow.")
        return 1
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(new_text)
    print(f"{name}: updated dropdown list.")
    return 0


def main(argv=None):
    args = sys.argv[1:] if argv is None else argv
    return sync_file(PUBLISH_WORKFLOW, render_publish, "--check" in args)


if __name__ == "__main__":
    raise SystemExit(main())
