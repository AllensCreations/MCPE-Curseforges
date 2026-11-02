#!/usr/bin/env python3
"""Build an add-on and prepare its latest changelog entry for CurseForge."""

import argparse
import json
import os
import re
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import auto_bump_and_build as builder

REPO_ROOT = Path(builder.REPO_ROOT)
CHANGELOG_HEADER = re.compile(
    r"^## \[(\d+\.\d+\.\d+)\] - \d{4}-\d{2}-\d{2}\s*$"
)


def latest_changelog_entry(path):
    text = path.read_text(encoding="utf-8")
    headings = list(re.finditer(r"^## .+$", text, re.MULTILINE))
    if not headings:
        raise ValueError(f"No version entry found in {path}")

    match = CHANGELOG_HEADER.fullmatch(headings[0].group())
    if not match:
        raise ValueError(f"Latest changelog heading must be a dated version in {path}")

    end = headings[1].start() if len(headings) > 1 else len(text)
    entry = text[headings[0].start():end].strip()
    if not entry.partition("\n")[2].strip():
        raise ValueError(f"Latest changelog entry is empty in {path}")
    return match.group(1), entry


def prepare(category, project_name, release_type):
    if category not in {"Addons", "Minigame"}:
        raise ValueError("Category must be Addons or Minigame")
    if release_type not in {"release", "beta", "alpha"}:
        raise ValueError("Release type must be release, beta or alpha")
    if not re.fullmatch(r"[A-Za-z0-9][A-Za-z0-9_-]*", project_name):
        raise ValueError("Project must be an exact folder name using letters, numbers, _ or -")

    category_dir = (REPO_ROOT / "MCPEDL" / category).resolve()
    project_dir = (category_dir / project_name).resolve()
    if project_dir.parent != category_dir or not project_dir.is_dir():
        raise ValueError(f"Project does not exist in MCPEDL/{category}: {project_name}")

    changelog_path = project_dir / "CHANGELOG.md"
    if not changelog_path.is_file():
        raise ValueError(f"Missing changelog: {changelog_path.relative_to(REPO_ROOT)}")
    changelog_version, changelog = latest_changelog_entry(changelog_path)

    manifest_paths = sorted(project_dir.glob("**/manifest.json"))
    if not manifest_paths:
        raise ValueError(f"No manifest.json found in {project_dir.relative_to(REPO_ROOT)}")
    manifest_version = None
    for path in manifest_paths:
        try:
            manifest = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError:
            continue
        if not isinstance(manifest, dict):
            raise ValueError(f"Invalid manifest structure: {path.relative_to(REPO_ROOT)}")
        header = manifest.get("header", {})
        version = header.get("version") if isinstance(header, dict) else None
        if (
            isinstance(version, list)
            and len(version) == 3
            and all(isinstance(part, int) for part in version)
        ):
            manifest_version = ".".join(map(str, version))
        else:
            raise ValueError(f"Invalid three-part manifest version: {path.relative_to(REPO_ROOT)}")
        break
    if manifest_version is None:
        raise ValueError(f"No valid three-part manifest version found in {project_dir.relative_to(REPO_ROOT)}")
    if changelog_version != manifest_version:
        raise ValueError(
            f"Latest changelog version {changelog_version} does not match "
            f"manifest version {manifest_version}"
        )

    primary_name, _ = builder.rebuild_project_packages(str(project_dir), category)
    if not primary_name:
        raise ValueError(f"No add-on package was built for {project_name}")
    package_path = REPO_ROOT / "builds" / project_name / primary_name
    if not package_path.is_file():
        raise ValueError(f"Built package is missing: {package_path.relative_to(REPO_ROOT)}")

    metadata = {
        "changelog": changelog,
        "changelogType": "markdown",
        "displayName": Path(primary_name).stem,
        "releaseType": release_type,
    }

    runner_temp = Path(os.environ.get("RUNNER_TEMP", tempfile.gettempdir()))
    runner_temp.mkdir(parents=True, exist_ok=True)
    fd, metadata_name = tempfile.mkstemp(
        prefix="curseforge-metadata-", suffix=".json", dir=runner_temp
    )
    with os.fdopen(fd, "w", encoding="utf-8") as metadata_file:
        json.dump(metadata, metadata_file, ensure_ascii=False)
    return package_path, Path(metadata_name)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--category", required=True)
    parser.add_argument("--project", required=True)
    parser.add_argument("--release-type", required=True)
    args = parser.parse_args()

    output_path = os.environ.get("GITHUB_OUTPUT")
    if not output_path:
        parser.error("GITHUB_OUTPUT must be set by GitHub Actions")

    package_path, metadata_path = prepare(
        args.category, args.project, args.release_type
    )
    with open(output_path, "a", encoding="utf-8") as output:
        output.write(f"package={package_path}\n")
        output.write(f"metadata={metadata_path}\n")
    print(f"Prepared {package_path.relative_to(REPO_ROOT)} for CurseForge upload")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError) as exc:
        print(f"::error::{exc}", file=sys.stderr)
        sys.exit(1)
