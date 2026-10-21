#!/usr/bin/env python3
"""Synchronize README.md files for opted-in OneBlock map projects.

README state is derived from current pack manifests and actual world archives.
This script never creates world archives or claims gameplay was tested.
"""
from __future__ import annotations

import json
import urllib.parse
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
MAPS_ROOT = ROOT / "MCPEDL" / "maps"
GITHUB_RAW = "https://github.com/AllensCreations/MCPE-Curseforges/raw/main"


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def pack_link_matches(archive_path: Path, link_name: str, pack_uuid: str, version: list[int]) -> bool:
    try:
        with zipfile.ZipFile(archive_path) as archive:
            names = set(archive.namelist())
            if "level.dat" not in names or "db/CURRENT" not in names:
                return False
            if not any(name.startswith("db/") and not name.endswith("/")
                       and name.split("/")[-1] not in {"CURRENT", "LOCK", "LOG", "LOG.old"}
                       and not name.split("/")[-1].startswith("MANIFEST") for name in names):
                return False
            if link_name not in names:
                return False
            links = json.loads(archive.read(link_name).decode("utf-8"))
            return any(entry.get("pack_id") == pack_uuid and entry.get("version") == version
                       for entry in links)
    except (OSError, zipfile.BadZipFile, KeyError, json.JSONDecodeError):
        return False


def world_is_current(project: Path, map_name: str, mode: str, bp: dict, rp: dict | None) -> bool:
    archive_path = project / f"{map_name} - {mode}.mcworld"
    if not archive_path.is_file():
        return False
    bp_header = bp["header"]
    if not pack_link_matches(archive_path, "world_behavior_packs.json",
                             bp_header["uuid"], bp_header["version"]):
        return False
    if rp is not None:
        rp_header = rp["header"]
        if not pack_link_matches(archive_path, "world_resource_packs.json",
                                 rp_header["uuid"], rp_header["version"]):
            return False
    return True


def build_readme(project: Path) -> str:
    config = load_json(project / "oneblock.json")
    bp = load_json(project / "behavior_pack" / "manifest.json")
    rp_path = project / "resource_pack" / "manifest.json"
    rp = load_json(rp_path) if rp_path.is_file() else None
    map_name = str(config.get("name") or project.name.replace("-", " "))
    version = ".".join(str(part) for part in bp["header"]["version"])
    modes = ("Creative", "Survival", "Hardcore")
    current = {mode: world_is_current(project, map_name, mode, bp, rp) for mode in modes}

    lines = [
        f"# {map_name} (source v{version})",
        "",
        f"Download the current published {map_name} world for Minecraft Bedrock Edition.",
        "",
        "## World Downloads",
        "",
    ]
    for mode in modes:
        filename = f"{map_name} - {mode}.mcworld"
        if (project / filename).is_file():
            url = f"{GITHUB_RAW}/{urllib.parse.quote(project.relative_to(ROOT).as_posix())}/{urllib.parse.quote(filename)}"
            lines.append(f"- **{mode}:** [Download {mode} World (.mcworld)]({url})")
        else:
            lines.append(f"- **{mode}:** Not generated yet.")

    lines.append("")
    if all(current.values()):
        lines.extend([
            f"All three world archives contain the current Behavior Pack version ({version}) and matching world pack links.",
            "Archive checks confirm package structure only; they do not prove gameplay has been tested in Minecraft.",
        ])
    else:
        stale_or_missing = [mode for mode in modes if not current[mode]]
        lines.extend([
            f"The map source is v{version}, but these world archives are missing or do not link the current pack versions: "
            + ", ".join(stale_or_missing) + ".",
            "Existing downloads may be from an earlier source version. World rebuilding remains gated until the Creative mechanics have been tested in Minecraft, each matching Mcpeworlds foundation contains its own complete LevelDB, and rebuilding is explicitly approved.",
        ])

    lines.extend([
        "",
        "## Installation",
        "",
        "1. Download the Creative world first.",
        "2. Open the downloaded .mcworld file with Minecraft Bedrock Edition to import it.",
        "3. Use Creative as the only test world. Importing a world file does not update a world already saved in Minecraft.",
        "",
        f"For gameplay details, setup coordinates, and testing limitations, read the [full description]({GITHUB_RAW}/{urllib.parse.quote(project.relative_to(ROOT).as_posix())}/DESCRIPTION.md).",
        "",
    ])
    return "\n".join(lines)


def main() -> int:
    projects = sorted(path.parent for path in MAPS_ROOT.rglob("oneblock.json"))
    changed = []
    for project in projects:
        config = load_json(project / "oneblock.json")
        if config.get("enabled", True) is not True:
            continue
        readme_path = project / "README.md"
        updated = build_readme(project)
        existing = readme_path.read_text(encoding="utf-8") if readme_path.is_file() else ""
        if updated != existing:
            readme_path.write_text(updated, encoding="utf-8")
            changed.append(readme_path.relative_to(ROOT).as_posix())
            print(f"Updated {changed[-1]}")
        else:
            print(f"Up to date: {readme_path.relative_to(ROOT)}")
    if not projects:
        print("No OneBlock map projects with oneblock.json were found.")
    print(f"README synchronization complete; {len(changed)} file(s) changed.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
