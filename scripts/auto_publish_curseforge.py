#!/usr/bin/env python3
"""Publish a rebuilt pack when its saved CurseForge project ID is configured."""

import argparse
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import prepare_curseforge_upload as release


def publish(project_path, release_type="release", map_variant="default"):
    category, project_name = release.project_from_path(project_path)
    info_path = release.REPO_ROOT / "builds" / project_name / "Curseforge_Info.json"
    if not info_path.is_file():
        print(f"Skipping {project_path}: no saved CurseForge project ID.")
        return False

    token = os.environ.get("CURSEFORGE_API_TOKEN", "")
    if not token:
        raise ValueError("CURSEFORGE_API_TOKEN is required because this pack has a saved project ID.")

    if map_variant == "all":
        if category != "Maps":
            raise ValueError("The 'all' map variant option only applies to maps.")
        variants = ("Creative", "Survival", "Hardcore")
    else:
        variants = (map_variant,)

    project_id = None
    for index, variant in enumerate(variants):
        package_path, metadata_path, project_id, _, _ = release.prepare(
            project_path,
            release_type,
            map_variant=variant,
            rebuild=map_variant != "all" and index == 0,
        )
        try:
            try:
                subprocess.run(
                    [
                        "curl",
                        "--fail-with-body",
                        "--silent",
                        "--show-error",
                        "--header",
                        f"X-Api-Token: {token}",
                        "--form",
                        f"metadata=<{metadata_path};type=application/json",
                        "--form",
                        f"file=@{package_path}",
                        f"https://www.curseforge.com/api/projects/{project_id}/upload-file",
                    ],
                    check=True,
                )
            except subprocess.CalledProcessError as exc:
                raise RuntimeError(
                    f"CurseForge upload failed for project {project_id} (curl exit code {exc.returncode})."
                ) from None
        finally:
            metadata_path.unlink(missing_ok=True)
        print(f"Published {package_path.name} to CurseForge project {project_id}.")
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True, help="Exact MCPEDL category/project path")
    parser.add_argument("--release-type", default="release", choices=("release", "beta", "alpha"))
    parser.add_argument("--map-variant", default="default", choices=("default", "Creative", "Survival", "Hardcore", "all"))
    args = parser.parse_args()
    publish(args.project, args.release_type, args.map_variant)


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError) as exc:
        print(f"::error::{exc}", file=sys.stderr)
        sys.exit(1)
