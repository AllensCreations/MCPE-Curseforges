#!/usr/bin/env python3
"""Manually publish one pack to CurseForge using its registered project ID.

Version rules:
  beta / alpha  X.Y.Z -> X.Y.(Z+1); merges the changelog entries newer than the last upload.
  release       X.Y.Z -> X.(Y+1).0; merges every entry since the last release, so it folds in
                all the beta versions (X.Y.1, X.Y.2, ...) published in between.
Uploads, then records the published version (and, for a release, the release version).
"""

import argparse
import os
import subprocess
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import prepare_curseforge_upload as release


def release_baseline_after(release_type, info, version):
    """Value to store as last_release_version after an upload, or None to keep the saved one."""
    if release_type == "release":
        return version
    if info.get("last_release_version"):
        return None
    if info.get("last_published_version"):
        return info["last_published_version"]
    major, minor, patch = release.parse_version(version)
    return f"{major}.{minor}.{max(patch - 1, 0)}"


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

    release.save_info(pack_key, project_id, version, release_baseline_after(release_type, info, version))
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
