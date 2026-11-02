#!/usr/bin/env python3
"""Save a pack's CurseForge project ID in builds/Curseforge_IDs.json (the one shared registry).

  python3 scripts/register_curseforge_id.py --project MCPEDL/Addons/Example --id 123456
"""
import argparse
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import prepare_curseforge_upload as release


def register(project_path, project_id):
    project_id = project_id.strip()
    if not re.fullmatch(r"[0-9]+", project_id):
        raise ValueError("CurseForge project ID must contain only digits")
    category, name = release.project_from_path(project_path.strip().strip("/"))
    if not (release.REPO_ROOT / "MCPEDL" / category / name).is_dir():
        raise ValueError(f"Project does not exist: MCPEDL/{category}/{name}")
    # Keeps last_published_version if the pack was registered before.
    return release.save_info(f"MCPEDL/{category}/{name}", project_id)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True, help="Exact path such as MCPEDL/Addons/Example")
    parser.add_argument("--id", required=True, dest="project_id")
    args = parser.parse_args()
    print(f"Saved {register(args.project, args.project_id).relative_to(release.REPO_ROOT)}")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError) as exc:
        print(f"::error::{exc}", file=sys.stderr)
        sys.exit(1)
