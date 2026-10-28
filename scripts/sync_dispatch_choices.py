#!/usr/bin/env python3
"""Keep the project dropdowns in .github/workflows/auto-version-bump.yml in sync with MCPEDL/.

  python3 scripts/sync_dispatch_choices.py           rewrite the dropdown lists
  python3 scripts/sync_dispatch_choices.py --check   exit 1 if the lists are stale (used by CI)

GitHub allows at most 25 options per dropdown, so each list holds "-" plus up to 24 projects.
Workflow files cannot be pushed by the Actions token, so run this locally after adding or
removing a project, then commit the workflow file.
"""
import os
import sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
WORKFLOW = os.path.join(ROOT, ".github", "workflows", "auto-version-bump.yml")
CATEGORIES = {
    "addon": "MCPEDL/addons",
    "new_addon": "MCPEDL/new_addons",
    "script": "MCPEDL/script",
    "map": "MCPEDL/maps",
}
MAX_PROJECTS = 24


def projects(category):
    base = os.path.join(ROOT, *category.split("/"))
    if not os.path.isdir(base):
        return []
    names = [n for n in os.listdir(base)
             if os.path.isdir(os.path.join(base, n)) and not n.startswith(".")]
    return sorted(names, key=str.lower)


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


def main():
    if not os.path.isfile(WORKFLOW):
        print(f"{WORKFLOW} not found", file=sys.stderr)
        return 1
    with open(WORKFLOW, encoding="utf-8") as fh:
        text = fh.read()
    lines = text.split("\n")
    new_text = "\n".join(render(lines))
    if new_text == text:
        print("Dropdown lists already up to date.")
        return 0
    if "--check" in sys.argv:
        print("Dropdown lists are stale. Run: python3 scripts/sync_dispatch_choices.py  then commit the workflow.")
        return 1
    with open(WORKFLOW, "w", encoding="utf-8", newline="\n") as fh:
        fh.write(new_text)
    print("Updated dropdown lists in auto-version-bump.yml")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
