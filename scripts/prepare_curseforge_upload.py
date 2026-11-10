#!/usr/bin/env python3
"""Build a pack and prepare its latest changelog entry for CurseForge."""

import argparse
import datetime
import html
import json
import os
import re
import shutil
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
    return ".".join(str(part) for part in parse_version(match.group(1))), entry


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
    if len(target) != 3:
        raise ValueError(f"Version must be X.Y.Z, found {changelog_version!r}")
    full_version = changelog_version
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
            name = re.sub(r"(?:\s*\(v\d+\.\d+\.\d+(?:\.\d+)?\))+\s*$", "", header["name"]).rstrip()
            header["name"] = f"{name} (v{full_version})"
        if not isinstance(data.get("metadata"), dict):
            data["metadata"] = {}
        data["metadata"]["version"] = full_version
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
    for entry in registry.values():
        if not isinstance(entry, dict): continue
        entry.pop("last_alpha_version", None)
        for field in ("last_published_version", "last_release_version"):
            value = entry.get(field)
            if isinstance(value, str):
                parts = value.split(".")
                if len(parts) == 4 and all(part.isdigit() for part in parts):
                    entry[field] = ".".join((parts[0], parts[1], str(int(parts[2]) + int(parts[3]))))
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
    """Persist the last uploaded and last release versions; discard retired Alpha fields."""
    registry, migrated = _load_registry()
    entry = dict(registry.get(project_path) or {})
    entry["project_id"] = _clean_id(project_id)
    if not entry["project_id"]: raise ValueError("CurseForge project ID must contain only digits")
    if last_published_version: entry["last_published_version"] = last_published_version
    if last_release_version: entry["last_release_version"] = last_release_version
    entry.pop("last_alpha_version", None)
    registry[project_path] = entry
    path = registry_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(dict(sorted(registry.items())), indent=2) + "\n", encoding="utf-8")
    for legacy in migrated: legacy.unlink(missing_ok=True)
    return path


def parse_version(text):
    """Parse an exact X.Y.Z version into a three-part tuple."""
    parts = tuple(int(part) for part in str(text).split("."))
    if len(parts) == 4: parts = (parts[0], parts[1], parts[2] + parts[3])
    if len(parts) != 3 or any(part < 0 for part in parts):
        raise ValueError(f"Invalid X.Y.Z version: {text!r}")
    return parts

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


LEGACY_SERIES_HEADING = re.compile(r"^v\d+\.\d+\.x \(")
HEADING_LINE = re.compile(r"^#{3,4} (.+)$")
# CURSEFORGE_CHANGELOG_STYLE: "spoiler" (default, HTML folds) or "plain" (markdown headings).
CHANGELOG_STYLE_ENV = "CURSEFORGE_CHANGELOG_STYLE"


def _merge_sections(bodies):
    """Merge entry bodies into {heading: [lines]}: same '### Heading' lists are joined, duplicates dropped.

    Older combined entries ('### v1.4.x (...)' blocks with '#### Heading' lists and a
    "What's new" line) are understood too: their wrapper lines are ignored.
    """
    sections = {}
    for body in bodies:
        heading = ""
        for line in body.splitlines():
            line = line.rstrip()
            match = HEADING_LINE.match(line)
            if match:
                if LEGACY_SERIES_HEADING.match(match.group(1)):
                    heading = ""
                    continue
                heading = match.group(1).strip()
                sections.setdefault(heading, [])
            elif line.strip() and not line.startswith("**What's new in v"):
                lines = sections.setdefault(heading, [])
                if line not in lines:
                    lines.append(line)
    return sections


def _merge_bodies(bodies):
    """Markdown: '### Heading' followed by its merged list."""
    out = []
    for heading, lines in _merge_sections(bodies).items():
        if heading:
            out.extend([f"### {heading}", ""])
        out.extend(lines)
        out.append("")
    return "\n".join(out).strip()


def _inline_html(text):
    """Escape text for CurseForge HTML and turn **bold** into <strong>."""
    return re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", html.escape(text, quote=False))


def _sections_html(bodies):
    """HTML (only tags CurseForge supports): <p><strong>Heading</strong></p><ul><li>..</li></ul>."""
    out = []
    for heading, lines in _merge_sections(bodies).items():
        if heading:
            out.append(f"<p><strong>{html.escape(heading, quote=False)}</strong></p>")
        items = []
        for line in lines:
            stripped = line.strip()
            if stripped.startswith(("- ", "* ")):
                items.append(f"<li>{_inline_html(stripped[2:].strip())}</li>")
            else:
                if items:
                    out.append(f"<ul>{''.join(items)}</ul>")
                    items = []
                out.append(f"<p>{_inline_html(stripped)}</p>")
        if items:
            out.append(f"<ul>{''.join(items)}</ul>")
    return "".join(out)


def _has_content(entry):
    """True when a changelog entry has at least one bullet (intro-only entries do not count)."""
    return any(lines for lines in _merge_sections([entry[3].partition("\n")[2]]).values())


def _updates(count):
    return f"{count} update" + ("s" if count != 1 else "")


def _intro(new_version, versions):
    if len(versions) == 1:
        return f"**What's new in v{new_version}:** Packed with the v{versions[0]} update."
    return (
        f"**What's new in v{new_version}:** Packed with {len(versions)} updates, "
        f"from v{versions[-1]} through v{versions[0]}."
    )


def render_flat_entry(new_version, date_text, merged):
    """ONE markdown entry for beta (and for CHANGELOG.md): every merged entry grouped by heading."""
    body = _merge_bodies([entry[3].partition("\n")[2] for entry in merged])
    return f"## [{new_version}] - {date_text}\n\n{_intro(new_version, [e[1] for e in merged])}\n\n{body}"


def changelog_style():
    """'spoiler' (default): HTML with CurseForge's div.spoiler folds. 'plain': markdown headings."""
    return "plain" if os.environ.get(CHANGELOG_STYLE_ENV, "spoiler").strip().lower() == "plain" else "spoiler"


def changelog_type(release_type):
    """CurseForge changelogType for an upload: html only when a fold layout is sent."""
    return "html" if release_type != "beta" and changelog_style() == "spoiler" else "markdown"


def _fold(summary, inner, is_open, style, level):
    """A group: the newest stays open (heading + content); the rest are CurseForge spoilers.

    CurseForge allows no <details> tag; its supported fold is <div class="spoiler">.
    """
    if style == "plain":
        return f"{'#' * level} {summary}\n\n{inner}"
    head = f"<h{level}>{html.escape(summary, quote=False)}</h{level}>"
    if is_open:
        return head + inner
    return f'{head}<div class="spoiler">{inner}</div>'


def _series_block(major, minor, items, is_open, style, level):
    items = sorted(items, key=lambda item: item[0])
    names = [item[1] for item in items]
    span = f"v{names[0]}" if len(names) == 1 else f"v{names[0]} \u2013 v{names[-1]}"
    bodies = [item[3].partition("\n")[2] for item in reversed(items)]
    body = _sections_html(bodies) if style == "spoiler" else _merge_bodies(bodies)
    return _fold(f"v{major}.{minor}.x ({_updates(len(items))}, {span})", body, is_open, style, level)


def render_rollup(entries, new_version, release_type, style="spoiler"):
    """Grouped history for release history and release, built from EVERY changelog entry.

    Release history is grouped by major version, with series nested inside.
    release ((X+1).0.0): each major (v1.x.x) is one group holding a group per series (1.3.x, 1.2.x ...).
    """
    tree = {}
    for entry in entries:
        tree.setdefault(entry[0][0], {}).setdefault(entry[0][1], []).append(entry)
    new_major = int(new_version.split(".")[0])
    glue = "" if style == "spoiler" else "\n\n"
    blocks = []
    for major in sorted(tree, reverse=True):
        first = not blocks
        series = tree[major]
        if False:
            for minor in sorted(series, reverse=True):
                blocks.append(_series_block(major, minor, series[minor], not blocks, style, 3))
            continue
        inner = [
            _series_block(major, minor, series[minor], first and index == 0, style, 4)
            for index, minor in enumerate(sorted(series, reverse=True))
        ]
        total = sum(len(items) for items in series.values())
        blocks.append(_fold(f"v{major}.x.x ({_updates(total)})", glue.join(inner), first, style, 3))
    return glue.join(blocks)


def render_upload_changelog(new_version, date_text, merged, entries, release_type, style=None):
    """The changelog text sent to CurseForge: flat markdown for beta, grouped release history."""
    if release_type == "beta":
        return render_flat_entry(new_version, date_text, merged)
    style = style or changelog_style()
    intro = (
        f"**What's new in v{new_version}:** Rolls up {_updates(len(entries))}, "
        f"from v{entries[-1][1]} through v{entries[0][1]}, grouped by version."
    )
    rollup = render_rollup(entries, new_version, release_type, style)
    if style == "spoiler":
        return f"<h2>[{new_version}] - {date_text}</h2><p>{_inline_html(intro)}</p>{rollup}"
    return f"## [{new_version}] - {date_text}\n\n{intro}\n\n{rollup}"


def merge_baseline(release_type, info):
    """Beta covers changes since last upload; Release since last release."""
    published = info.get("last_published_version")
    release = info.get("last_release_version")
    return (release or published) if release_type == "release" else published

def next_version(highest, release_type):
    """Update: X.Y.(Z+1); Beta: X.(Y+1).0; Release: (X+1).0.0."""
    major, minor, patch = highest[:3]
    if release_type == "release": return f"{major + 1}.0.0"
    if release_type == "beta": return f"{major}.{minor + 1}.0"
    return f"{major}.{minor}.{patch + 1}"

def prior_version(version):
    major, minor, patch = parse_version(version)
    if patch: return f"{major}.{minor}.{patch - 1}"
    if minor: return f"{major}.{minor - 1}.0"
    return f"{max(major - 1, 0)}.0.0" if major else version

def baselines_after(release_type, info, version):
    fallback = info.get("last_published_version") or prior_version(version)
    if release_type == "release": return {"last_release_version": version}
    return {"last_release_version": info.get("last_release_version") or fallback}

def combine_changelog(project_dir, changelog_path, last_published=None, today=None, release_type="release", last_release=None):
    """Merge pending changelog entries and create the next three-part version."""
    text = changelog_path.read_text(encoding="utf-8")
    preamble, segments = split_changelog(text)
    entries = []
    for segment in segments:
        heading = segment.splitlines()[0]
        match = CHANGELOG_HEADER.fullmatch(heading)
        if not match: break
        normalized_version = ".".join(str(part) for part in parse_version(match.group(1)))
        entries.append((parse_version(match.group(1)), normalized_version, heading, segment))
    if not entries: raise ValueError(f"Latest changelog heading must be a dated X.Y.Z version in {changelog_path}")
    baseline_text = merge_baseline(release_type, {"last_published_version": last_published, "last_release_version": last_release})
    baseline = parse_version(baseline_text) if baseline_text else None
    merged = entries[:1] if baseline is None else [entry for entry in entries if entry[0] > baseline]
    if not merged and release_type == "beta":
        raise ValueError(f"Nothing new to publish: no changelog entry newer than v{baseline_text}. Add a changelog entry first.")
    history = [entry for entry in entries if _has_content(entry)]
    if not history: raise ValueError(f"Nothing to publish: {changelog_path} has no changelog bullets.")
    highest = max(parse_version(last_published), manifest_max_version(project_dir)) if last_published else max(entries[0][0], manifest_max_version(project_dir))
    new_version = next_version(highest, release_type)
    date_text = (today or datetime.date.today()).isoformat()
    if merged: file_entry = render_flat_entry(new_version, date_text, merged)
    else: file_entry = render_flat_entry(new_version, date_text, history)
    upload_entries = history if release_type == "release" else merged
    upload_changelog = render_upload_changelog(new_version, date_text, merged or history, upload_entries, release_type)
    consumed = {entry[2] for entry in (merged or history)}
    remaining = []
    for segment in segments:
        if segment.splitlines()[0] in consumed: continue
        first, sep, rest = segment.partition("\n")
        match = CHANGELOG_HEADER.fullmatch(first)
        if match:
            normalized = ".".join(str(part) for part in parse_version(match.group(1)))
            first = f"## [{normalized}] - {match.group(2)}"
        remaining.append(first + (sep + rest if sep else ""))
    changelog_path.write_text(preamble + file_entry + "\n\n" + "\n\n".join(remaining).lstrip(), encoding="utf-8")
    return new_version, upload_changelog


def upload_name(release_type, project_name, extension, map_variant="default", version="", title=None):
    """'Release - Mining Helmet v(2.0.0.0).mcaddon'; non-default maps add ' - Creative' etc.
    title: the manifest's pack title when known, else the project folder name."""
    title = title or project_name.replace("-", " ").replace("_", " ")
    variant = "" if map_variant == "default" else f" - {map_variant}"
    tag = f" v({version})" if version else ""
    return f"{release_type.capitalize()} - {title}{variant}{tag}{extension}"


def stage_upload_copy(package_path, release_type, project_name, map_variant="default", version="", title=None):
    """Copy the built package to a temp folder under its upload name; builds/ keeps its own name."""
    staging = Path(tempfile.mkdtemp(prefix="curseforge-upload-", dir=os.environ.get("RUNNER_TEMP") or None))
    target = staging / upload_name(release_type, project_name, package_path.suffix.lower(), map_variant, version, title)
    shutil.copyfile(package_path, target)
    return target


def prepare(project_path, release_type, map_variant="default", rebuild=True, bump=True):
    category, project_name = project_from_path(project_path)
    if release_type not in {"release", "beta"}:
        raise ValueError("Release type must be release or beta")
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

    package_path = stage_upload_copy(
        package_path, release_type, project_name, map_variant, changelog_version,
        title=builder.manifest_tools.manifest_title(str(project_dir)) if getattr(builder, "manifest_tools", None) else None,
    )
    metadata = {
        "changelog": changelog,
        "changelogType": changelog_type(release_type),
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
