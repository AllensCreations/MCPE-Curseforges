#!/usr/bin/env python3
"""Build a pack and prepare its latest changelog entry for CurseForge."""

import argparse
import datetime
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


REGISTRY_NAME = "Curseforge_IDs.json"


def registry_path():
    """One registry for every pack: builds/Curseforge_IDs.json, keyed by MCPEDL/<Category>/<Name>."""
    return REPO_ROOT / "builds" / REGISTRY_NAME


def _clean_id(value):
    text = str(value).strip() if isinstance(value, (str, int)) and not isinstance(value, bool) else ""
    return text if re.fullmatch(r"[0-9]+", text) else None


def _find_project_path(name):
    for category in PACKAGE_EXTENSIONS:
        if (REPO_ROOT / "MCPEDL" / category / name).is_dir():
            return f"MCPEDL/{category}/{name}"
    return None


def _load_registry():
    """Return (registry, migrated_legacy_files).

    Packs that still have an old builds/<Name>/Curseforge_Info.json are detected and folded in
    automatically (the registry wins when a pack is in both).
    """
    path = registry_path()
    registry = {}
    if path.is_file():
        try:
            registry = json.loads(path.read_text(encoding="utf-8"))
        except json.JSONDecodeError as exc:
            raise ValueError(f"Invalid JSON: {path.relative_to(REPO_ROOT)}") from exc
        if not isinstance(registry, dict):
            raise ValueError(f"{path.relative_to(REPO_ROOT)} must hold a JSON object")

    migrated = []
    builds = REPO_ROOT / "builds"
    for legacy in sorted(builds.glob("*/Curseforge_Info.json")) if builds.is_dir() else []:
        try:
            info = json.loads(legacy.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            continue
        project_id = _clean_id(info.get("project_id")) if isinstance(info, dict) else None
        saved_path = info.get("project") if isinstance(info, dict) else None
        key = saved_path if isinstance(saved_path, str) and re.fullmatch(
            r"MCPEDL/(Addons|Maps|Script|Minigame)/[A-Za-z0-9][A-Za-z0-9_-]*", saved_path
        ) else _find_project_path(legacy.parent.name)
        if not project_id or not key:
            continue
        entry = {"project_id": project_id}
        for field in ("last_published_version", "last_release_version"):
            if info.get(field):
                entry[field] = info[field]
        registry.setdefault(key, entry)
        migrated.append(legacy)
    return registry, migrated


def load_registry():
    return _load_registry()[0]


def read_info(project_path):
    """Return the saved CurseForge info for a pack (written by Register CurseForge ID)."""
    entry = load_registry().get(project_path)
    project_id = _clean_id(entry.get("project_id")) if isinstance(entry, dict) else None
    if not project_id:
        raise ValueError(
            f"No saved CurseForge project ID for {project_path}. "
            "Run the 'Register CurseForge ID' workflow for this pack first."
        )
    return {**entry, "project_id": project_id}


def save_info(project_path, project_id, last_published_version=None, last_release_version=None):
    """Add or update one pack in builds/Curseforge_IDs.json (keeps its other fields).

    last_published_version is the newest upload of any type (beta, alpha or release);
    last_release_version is the newest release, the baseline a release merges from.
    """
    registry, migrated = _load_registry()
    entry = dict(registry.get(project_path) or {})
    entry["project_id"] = _clean_id(project_id)
    if not entry["project_id"]:
        raise ValueError("CurseForge project ID must contain only digits")
    if last_published_version:
        entry["last_published_version"] = last_published_version
    if last_release_version:
        entry["last_release_version"] = last_release_version
    registry[project_path] = entry
    path = registry_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(dict(sorted(registry.items())), indent=2) + "\n", encoding="utf-8")
    for legacy in migrated:  # now stored in the registry
        legacy.unlink(missing_ok=True)
    return path


def parse_version(text):
    return tuple(int(part) for part in text.split("."))


def split_changelog(text):
    """Split into (preamble, [segment, ...]); each segment starts at a '## ' heading."""
    starts = [m.start() for m in re.finditer(r"^## .+$", text, re.MULTILINE)]
    if not starts:
        raise ValueError("No version entry found in changelog")
    preamble = text[:starts[0]]
    segments = [text[a:b] for a, b in zip(starts, starts[1:] + [len(text)])]
    return preamble, segments


def manifest_max_version(project_dir):
    versions = []
    for path in project_dir.rglob("manifest.json"):
        if {"world", "worlds", "behavior_packs", "resource_packs"}.intersection(path.parts):
            continue
        try:
            version = json.loads(path.read_text(encoding="utf-8"))["header"]["version"]
        except (OSError, ValueError, KeyError, TypeError):
            continue
        if isinstance(version, list) and len(version) == 3 and all(type(p) is int for p in version):
            versions.append(tuple(version))
    return max(versions) if versions else (0, 0, 0)


def _merge_bodies(bodies):
    """Merge entry bodies: same '### Heading' lists are joined, duplicate lines dropped."""
    sections = {}
    for body in bodies:
        heading = ""
        for line in body.splitlines():
            line = line.rstrip()
            if line.startswith("### ") and not line.startswith("####"):
                heading = line[4:].strip()
                sections.setdefault(heading, [])
            elif line.strip():
                lines = sections.setdefault(heading, [])
                if line not in lines:
                    lines.append(line)
    out = []
    for heading, lines in sections.items():
        if heading:
            out.append(f"#### {heading}")
        out.extend(lines)
        out.append("")
    return "\n".join(out).strip()


def render_combined_entry(new_version, date_text, merged):
    """One entry: a 'What's new' line, then changes grouped per minor series (X.Y.x), newest first."""
    groups = {}
    for version, version_text, _, segment in merged:
        groups.setdefault(version[:2], []).append((version, version_text, segment.partition("\n")[2]))

    versions = [entry[1] for entry in merged]
    if len(versions) == 1:
        intro = f"**What's new in v{new_version}:** Packed with the v{versions[0]} update."
    else:
        intro = (
            f"**What's new in v{new_version}:** Packed with {len(versions)} updates, "
            f"from v{versions[-1]} through v{versions[0]}."
        )

    blocks = []
    for (major, minor), items in sorted(groups.items(), reverse=True):
        names = [item[1] for item in sorted(items, key=lambda item: item[0])]
        span = f"v{names[0]}" if len(names) == 1 else f"v{names[0]} \u2013 v{names[-1]}"
        body = _merge_bodies([item[2] for item in sorted(items, key=lambda item: item[0], reverse=True)])
        blocks.append(f"### v{major}.{minor}.x ({span})\n\n{body}")
    return f"## [{new_version}] - {date_text}\n\n{intro}\n\n" + "\n\n".join(blocks)


def merge_baseline(release_type, info):
    """Version after which changelog entries are still unpublished for this release type.

    beta and alpha merge what is newer than the last upload of any type. A release merges
    everything newer than the last release, so it also folds in every beta published since.
    Packs saved before betas were tracked separately have no last_release_version; their
    earlier uploads were all minor bumps, so last_published_version is used.
    """
    published = info.get("last_published_version")
    if release_type == "release":
        return info.get("last_release_version") or published
    return published


def next_version(highest, release_type):
    """beta and alpha: X.Y.Z -> X.Y.(Z+1). release: X.Y.Z -> X.(Y+1).0."""
    major, minor, patch = highest
    if release_type == "release":
        return f"{major}.{minor + 1}.0"
    return f"{major}.{minor}.{patch + 1}"


def combine_changelog(project_dir, changelog_path, last_published=None, today=None,
                      release_type="release", last_release=None):
    """Merge the changelog entries this publish covers into ONE entry with the next version.

    beta/alpha merge entries newer than last_published and bump the patch (X.Y.Z+1).
    release merges entries newer than last_release (all betas since the last release plus
    anything unpublished) and bumps the minor (X.(Y+1).0).
    The next version builds on the highest of the last published version and the manifests;
    unpublished changelog headings are only used when nothing was ever published.
    The merged entry replaces the entries it combined at the top of CHANGELOG.md, so the
    changelog, manifests and CurseForge all show the same version.
    Returns (new_version_text, combined_entry_text).
    """
    text = changelog_path.read_text(encoding="utf-8")
    preamble, segments = split_changelog(text)

    entries = []
    for segment in segments:
        heading = segment.splitlines()[0]
        match = CHANGELOG_HEADER.fullmatch(heading)
        if not match:
            break
        entries.append((parse_version(match.group(1)), match.group(1), heading, segment))
    if not entries:
        raise ValueError(f"Latest changelog heading must be a dated version in {changelog_path}")

    baseline_text = merge_baseline(
        release_type, {"last_published_version": last_published, "last_release_version": last_release}
    )
    baseline = parse_version(baseline_text) if baseline_text else None
    if baseline is None:
        merged = entries[:1]  # first publish: only the newest entry
    else:
        merged = [entry for entry in entries if entry[0] > baseline]
    if not merged:
        raise ValueError(
            f"Nothing new to publish: the changelog has no entry newer than v{baseline_text}. "
            "Add a changelog entry first."
        )

    if last_published:
        highest = max(parse_version(last_published), manifest_max_version(project_dir))
    else:
        highest = max(entries[0][0], manifest_max_version(project_dir))
    new_version = next_version(highest, release_type)
    date_text = (today or datetime.date.today()).isoformat()

    entry = render_combined_entry(new_version, date_text, merged)

    remaining = segments[len(merged):]
    new_text = preamble + entry + "\n\n" + "".join(remaining)
    changelog_path.write_text(new_text.rstrip() + "\n", encoding="utf-8")
    return new_version, entry


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


def prepare(project_path, release_type, map_variant="default", rebuild=True, bump=True):
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
    info_path = registry_path()
    info = read_info(f"MCPEDL/{category}/{project_name}")
    project_id = info["project_id"]

    if bump:
        changelog_version, changelog = combine_changelog(
            project_dir,
            changelog_path,
            info.get("last_published_version"),
            release_type=release_type,
            last_release=info.get("last_release_version"),
        )
    else:
        changelog_version, changelog = latest_changelog_entry(changelog_path)

    manifest_changes = align_manifests(project_dir, changelog_version)

    primary_name = None
    if rebuild:
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
    elif category != "Maps":
        raise ValueError("Reusing an existing package is only supported for map variants")
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
    return package_path, Path(metadata_name), project_id, info_path, manifest_changes, changelog_version


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--project", required=True, help="Exact path such as MCPEDL/Addons/Example")
    parser.add_argument("--release-type", required=True)
    parser.add_argument("--map-variant", default="default")
    args = parser.parse_args()

    output_path = os.environ.get("GITHUB_OUTPUT")
    if not output_path:
        parser.error("GITHUB_OUTPUT must be set by GitHub Actions")

    package_path, metadata_path, project_id, info_path, manifest_changes, _ = prepare(
        args.project,
        args.release_type,
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
