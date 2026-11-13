#!/usr/bin/env python3
"""Manually publish one pack to CurseForge using its registered project ID.

Version rules:
  Every project version is X.Y.Z: X = Release generation, Y = Beta generation, Z = Update.
  keep     no bump: publishes the newest changelog version as written (default for the workflow);
           merges every unpublished changelog entry since the last upload.
  update   X.Y.Z -> X.Y.(Z+1) (manual build --bump only).
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


def write_summary(markdown):
    """Append to the GitHub run summary page (no-op outside GitHub Actions)."""
    path = os.environ.get("GITHUB_STEP_SUMMARY")
    if not path:
        return
    try:
        with open(path, "a", encoding="utf-8") as fh:
            fh.write(markdown.rstrip("\n") + "\n\n")
    except OSError:
        pass


def changelog_excerpt(category, project_name, limit=30):
    """Newest CHANGELOG.md entry of the pack, shortened. Empty string if unavailable."""
    try:
        text = (release.REPO_ROOT / "MCPEDL" / category / project_name / "CHANGELOG.md").read_text(encoding="utf-8")
    except Exception:
        return ""
    lines, seen = [], False
    for line in text.splitlines():
        if line.startswith("## "):
            if seen:
                break
            seen = True
        if seen:
            lines.append(line)
    if len(lines) > limit:
        lines = lines[:limit] + ["..."]
    return "\n".join(lines)


def publish(project_path, release_type="keep", map_variant="default"):
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
    uploaded = []
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
        uploaded.append(package_path.name)

    release.save_info(pack_key, project_id, version, **release.baselines_after(release_type, info, version))
    previous = info.get("last_published_version") or "never"
    excerpt = changelog_excerpt(category, project_name)
    files = ", ".join(f"`{n}`" for n in uploaded)
    write_summary(
        f"### ✅ Published to CurseForge: {project_name}\n\n"
        "| | |\n|---|---|\n"
        f"| Version | `{version}` (previous: `{previous}`) |\n"
        f"| Uploaded | {files} |\n"
        f"| CurseForge project ID | `{project_id}` |\n"
        "| Release type | Release |\n\n"
        "**Next:** the new version and changelog are committed to the repo, then "
        "*Build Changed Packs & Sync Catalogs* starts to refresh catalogs and README links."
        + (f"\n\n<details><summary>Newest changelog entry</summary>\n\n{excerpt}\n\n</details>" if excerpt else "")
    )
    return True


def pending_packs():
    """Registered packs not yet on CurseForge, or behind their newest CHANGELOG.md version."""
    root = release.REPO_ROOT
    found = []
    for key in sorted(release.load_registry()):
        log = root.joinpath(*key.split("/")) / "CHANGELOG.md"
        if not log.is_file():
            continue
        try:
            release.read_info(key)
            latest = release.parse_version(release.latest_changelog_entry(log)[0])
            last = release.load_registry()[key].get("last_published_version")
            done = release.parse_version(last) if last else None
        except ValueError:
            continue
        if done is None or latest > done:
            found.append(key)
    return found


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", help="Exact MCPEDL category/project path")
    parser.add_argument("--list-pending", action="store_true", help="Print every pack that still needs publishing, one per line")
    parser.add_argument("--release-type", default="keep", choices=("keep", "release", "beta"))
    parser.add_argument("--map-variant", default="default", choices=("default", "Creative", "Survival", "Hardcore", "all"))
    args = parser.parse_args()
    if args.list_pending:
        print("\n".join(pending_packs()))
        return
    if not args.project:
        parser.error("--project is required unless --list-pending is used")
    publish(args.project, args.release_type, args.map_variant)


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError, RuntimeError) as exc:
        print(f"::error::{exc}", file=sys.stderr)
        _name = sys.argv[sys.argv.index("--project") + 1] if "--project" in sys.argv[:-1] else "pack"
        write_summary(f"### ❌ Publish FAILED: {_name}\n\n`{exc}`\n\nNothing was committed to the repo for this pack.")
        sys.exit(1)
