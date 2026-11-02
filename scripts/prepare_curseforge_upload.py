#!/usr/bin/env python3
"""Build a pack and prepare its latest changelog entry for CurseForge."""

import argparse
import json
import os
import re
import subprocess
import sys
import tempfile
from pathlib import Path

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import auto_bump_and_build as builder

REPO_ROOT = Path(builder.REPO_ROOT)
CHANGELOG_HEADER = re.compile(
    r"^## \[(\d+\.\d+\.\d+)\] - \d{4}-\d{2}-\d{2}\s*$"
)
PACKAGE_EXTENSIONS = {
    "Addons": ".mcaddon",
    "Maps": ".mcworld",
    "Script": ".mcpack",
    "Minigame": ".mcaddon",
}


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


def project_from_path(project_path):
    match = re.fullmatch(
        r"MCPEDL/(Addons|Maps|Script|Minigame)/([A-Za-z0-9][A-Za-z0-9_-]*)",
        project_path,
    )
    if not match:
        raise ValueError("Project must be an exact MCPEDL category/project path")
    return match.group(1), match.group(2)


def align_manifests(project_dir, changelog_version):
    target = [int(part) for part in changelog_version.split(".")]
    manifest_paths = [
        path for path in sorted(project_dir.rglob("manifest.json"))
        if not {"world", "worlds", "behavior_packs", "resource_packs"}.intersection(path.parts)
    ]
    if not manifest_paths:
        raise ValueError(f"No manifest.json found in {project_dir.relative_to(REPO_ROOT)}")

    changed = []
    source_uuids = set()
    manifests = []
    current_versions = []
    for path in manifest_paths:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid manifest JSON: {path.relative_to(REPO_ROOT)}") from exc
        if not isinstance(data, dict) or not isinstance(data.get("header"), dict):
            raise ValueError(f"Invalid manifest structure: {path.relative_to(REPO_ROOT)}")
        version = data["header"].get("version")
        if (
            not isinstance(version, list)
            or len(version) != 3
            or any(type(part) is not int or part < 0 for part in version)
        ):
            raise ValueError(f"Invalid manifest version: {path.relative_to(REPO_ROOT)}")
        current_versions.append(tuple(version))
        manifests.append((path, data))
        source_uuids.add(data["header"].get("uuid"))

    if max(current_versions) > tuple(target):
        raise ValueError(
            f"Latest changelog version {changelog_version} is older than a pack manifest"
        )

    for path, data in manifests:
        before = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
        header = data["header"]
        header["version"] = target
        if isinstance(header.get("name"), str):
            name = re.sub(r"(?:\s*\(v\d+\.\d+\.\d+\))+\s*$", "", header["name"]).rstrip()
            header["name"] = f"{name} (v{changelog_version})"
        for module in data.get("modules", []):
            if isinstance(module, dict) and isinstance(module.get("version"), list):
                module["version"] = target
        dependencies = data.get("dependencies", [])
        for dependency in dependencies if isinstance(dependencies, list) else []:
            if (
                isinstance(dependency, dict)
                and dependency.get("uuid") in source_uuids
            ):
                dependency["version"] = target
        after = json.dumps(data, ensure_ascii=False, indent=2) + "\n"
        if before != after:
            path.write_text(after, encoding="utf-8")
            changed.append(path.relative_to(REPO_ROOT).as_posix())
    return changed


def resolve_project_id(info_path, provided_id):
    project_id = provided_id.strip()
    if project_id:
        if not re.fullmatch(r"[0-9]+", project_id):
            raise ValueError("CurseForge project ID must contain only digits")
        info_path.parent.mkdir(parents=True, exist_ok=True)
        info_path.write_text(
            json.dumps({"project_id": project_id}, indent=2) + "\n",
            encoding="utf-8",
        )
        return project_id

    if not info_path.is_file():
        raise ValueError(
            "No saved CurseForge project ID. Enter it once in the workflow input."
        )
    try:
        info = json.loads(info_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise ValueError(f"Invalid saved CurseForge info: {info_path.relative_to(REPO_ROOT)}") from exc
    project_id = info.get("project_id") if isinstance(info, dict) else None
    if not isinstance(project_id, str) or not re.fullmatch(r"[0-9]+", project_id):
        raise ValueError(f"Invalid project_id in {info_path.relative_to(REPO_ROOT)}")
    return project_id


def find_map_package(project_dir, built_name, variant):
    if variant != "default":
        matches = sorted(project_dir.glob(f"*- {variant}.mcworld"))
        matches = [path for path in matches if " - Test" not in path.name]
        if len(matches) == 1:
            return matches[0]
        if not matches:
            raise ValueError(f"No {variant} world package found for {project_dir.name}")
        raise ValueError(f"More than one {variant} world package found for {project_dir.name}")

    if built_name:
        return REPO_ROOT / "builds" / project_dir.name / built_name
    creative = sorted(project_dir.glob("* - Creative.mcworld"))
    if len(creative) == 1:
        return creative[0]
    candidates = [
        path for path in sorted(project_dir.glob("*.mcworld"))
        if " - Test" not in path.name
    ]
    if len(candidates) == 1:
        return candidates[0]
    if not candidates:
        raise ValueError(f"No .mcworld package found for {project_dir.name}")
    raise ValueError(
        f"Multiple map variants found for {project_dir.name}; choose one in the map variant dropdown"
    )


def prepare(project_path, release_type, provided_id="", map_variant="default"):
    category, project_name = project_from_path(project_path)
    if release_type not in {"release", "beta", "alpha"}:
        raise ValueError("Release type must be release, beta or alpha")
    if map_variant not in {"default", "Creative", "Survival", "Hardcore"}:
        raise ValueError("Map variant must be default, Creative, Survival or Hardcore")

    category_dir = (REPO_ROOT / "MCPEDL" / category).resolve()
    project_dir = (category_dir / project_name).resolve()
    if project_dir.parent != category_dir or not project_dir.is_dir():
        raise ValueError(f"Project does not exist in MCPEDL/{category}: {project_name}")

    changelog_path = project_dir / "CHANGELOG.md"
    if not changelog_path.is_file():
        raise ValueError(f"Missing changelog: {changelog_path.relative_to(REPO_ROOT)}")
    changelog_version, changelog = latest_changelog_entry(changelog_path)

    manifest_changes = align_manifests(project_dir, changelog_version)
    info_path = REPO_ROOT / "builds" / project_name / "Curseforge_Info.json"
    project_id = resolve_project_id(info_path, provided_id)

    primary_name, _ = builder.rebuild_project_packages(str(project_dir), f"MCPEDL/{category}")
    if category == "Maps" and (project_dir / "oneblock.json").is_file():
        env = dict(os.environ, ONEBLOCK_MAP=project_name)
        result = subprocess.run(
            [sys.executable, str(REPO_ROOT / "scripts" / "build_oneblock_variants_from_template.py")],
            cwd=REPO_ROOT,
            env=env,
            capture_output=True,
            text=True,
        )
        if result.returncode:
            raise ValueError(
                f"Could not rebuild map variants for {project_name}: "
                f"{(result.stderr or result.stdout).strip()}"
            )
    if category == "Maps":
        package_path = find_map_package(project_dir, primary_name, map_variant)
    else:
        if not primary_name:
            raise ValueError(f"No package was built for {project_name}")
        package_path = REPO_ROOT / "builds" / project_name / primary_name
    if not package_path.is_file():
        raise ValueError(
            f"Built package is missing: {package_path.relative_to(REPO_ROOT)}"
        )
    expected_extension = PACKAGE_EXTENSIONS[category]
    if package_path.suffix.lower() != expected_extension:
        raise ValueError(
            f"{category} must publish {expected_extension}, not {package_path.suffix}"
        )

    metadata = {
        "changelog": changelog,
        "changelogType": "markdown",
        "displayName": package_path.stem,
        "releaseType": release_type,
    }

    runner_temp = Path(os.environ.get("RUNNER_TEMP", tempfile.gettempdir()))
    runner_temp.mkdir(parents=True, exist_ok=True)
    fd, metadata_name = tempfile.mkstemp(
        prefix="curseforge-metadata-", suffix=".json", dir=runner_temp
    )
    with os.fdopen(fd, "w", encoding="utf-8") as metadata_file:
        json.dump(metadata, metadata_file, ensure_ascii=False)
    return package_path, Path(metadata_name), project_id, info_path, manifest_changes


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True, help="Exact path such as MCPEDL/Addons/Example")
    parser.add_argument("--release-type", required=True)
    parser.add_argument("--map-variant", default="default")
    args = parser.parse_args()

    output_path = os.environ.get("GITHUB_OUTPUT")
    if not output_path:
        parser.error("GITHUB_OUTPUT must be set by GitHub Actions")

    package_path, metadata_path, project_id, info_path, manifest_changes = prepare(
        args.project,
        args.release_type,
        os.environ.get("CURSEFORGE_PROJECT_ID", ""),
        args.map_variant,
    )
    with open(output_path, "a", encoding="utf-8") as output:
        output.write(f"package={package_path}\n")
        output.write(f"metadata={metadata_path}\n")
        output.write(f"curseforge_project_id={project_id}\n")
        output.write(f"info_path={info_path.relative_to(REPO_ROOT).as_posix()}\n")
        output.write("manifest_paths<<EOF\n")
        output.write("".join(f"{path}\n" for path in manifest_changes))
        output.write("EOF\n")
    print(f"Prepared {package_path.relative_to(REPO_ROOT)} for CurseForge upload")


if __name__ == "__main__":
    try:
        main()
    except (OSError, ValueError) as exc:
        print(f"::error::{exc}", file=sys.stderr)
        sys.exit(1)
