#!/usr/bin/env python3
"""Manually publish one pack to CurseForge using its registered project ID.

Version rules:
  Every project version is X.Y.Z: X = Release generation, Y = Beta generation, Z = Update.
  update   X.Y.Z -> X.Y.(Z+1) (normal build automation only).
  beta     X.Y.Z -> X.(Y+1).0; merges unpublished changelog entries since the last upload.
  release  X.Y.Z -> (X+1).0.0; groups the complete release history.
  Legacy X.Y.Z.A maps to X.Z.A and legacy X.Y.Z maps to X.Z.0 because old Y was Alpha, Z was Beta and A was Update (default 0).
All Bedrock manifests, metadata.version, titles, changelogs and upload filenames use X.Y.Z.
Uploads, then records the published version and release baseline.
"""

import argparse
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import prepare_curseforge_upload as release


def publish(project_path, release_type="release", map_variant="default"):
    category, project_name = release.project_from_path(project_path)
    pack_key = f"MCPEDL/{category}/{project_name}"
    info = release.read_info(pack_key)  # fails with a clear message if the pack is not in builds/Curseforge_IDs.json

    token = os.environ.get("CURSEFORGE_API_TOKEN", "")
    if not token:
        raise ValueError("CURSEFORGE_API_TOKEN is required to publish.")

    if map_variant == "all":
        if category != "Maps":
            raise ValueError("The 'all' map variant option only applies to maps.")
        variants = ("Creative", "Survival", "Hardcore")
    else:
        variants = (map_variant,)

    project_id = None
    version = None
    for index, variant in enumerate(variants):
        # Only the first variant bumps the version, merges the changelog and rebuilds.
        package_path, metadata_path, project_id, _, _, version = release.prepare(
            project_path,
            release_type,
            map_variant=variant,
            rebuild=index == 0,
            bump=index == 0,
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

    release.save_info(pack_key, project_id, version, **release.baselines_after(release_type, info, version))
    return True


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True, help="Exact MCPEDL category/project path")
    parser.add_argument("--release-type", default="release", choices=("release", "beta"))
    parser.add_argument("--map-variant", default="default", choices=("default", "Creative", "Survival", "Hardcore", "all"))
    args = parser.parse_args()
    publish(args.project, args.release_type, args.map_variant)


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError) as exc:
        print(f"::error::{exc}", file=sys.stderr)
        sys.exit(1)
