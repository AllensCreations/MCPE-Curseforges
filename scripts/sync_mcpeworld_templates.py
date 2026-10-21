#!/usr/bin/env python3
"""Extract editable Mcpeworlds templates and package them back into .mcworld ZIPs."""
from __future__ import annotations

import shutil
import sys
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ROOT_DIR = ROOT / "Mcpeworlds"
MODES = {
    "Creative": ("Creative_Void_Sandbox.mcworld.zip", "Creative"),
    "Survival": ("Survival_Void_World.mcworld.zip", "Survival"),
    "Hardcore": ("Hardcore_Void_World.mcworld.zip", "Hardcore"),
}


def safe_extract(archive_path: Path, destination: Path) -> None:
    resolved = destination.resolve()
    with zipfile.ZipFile(archive_path) as archive:
        for member in archive.infolist():
            target = (destination / member.filename).resolve()
            if target != resolved and resolved not in target.parents:
                raise ValueError(f"Unsafe archive path: {member.filename}")
        archive.extractall(destination)


def locate_world_root(folder: Path, depth: int = 0) -> Path | None:
    if (folder / "level.dat").is_file():
        return folder
    level_files = sorted(folder.rglob("level.dat"))
    if level_files:
        return level_files[0].parent
    if depth >= 4:
        return None
    nested_archives = [
        p for p in folder.rglob("*")
        if p.is_file() and zipfile.is_zipfile(p)
    ]
    for index, nested in enumerate(nested_archives):
        extracted = folder / f"_nested_{depth}_{index}"
        extracted.mkdir(parents=True, exist_ok=True)
        try:
            safe_extract(nested, extracted)
            found = locate_world_root(extracted, depth + 1)
            if found:
                return found
        except (OSError, ValueError, zipfile.BadZipFile):
            continue
    return None


def extract_templates() -> None:
    for mode, (archive_name, folder_name) in MODES.items():
        archive_path = ROOT_DIR / archive_name
        if not archive_path.is_file():
            raise FileNotFoundError(f"Missing reference archive: {archive_path}")
        with tempfile.TemporaryDirectory(prefix=f"mcpe-{mode.lower()}-") as temp:
            staging = Path(temp) / "staging"
            staging.mkdir()
            safe_extract(archive_path, staging)
            world = locate_world_root(staging)
            if world is None:
                raise ValueError(f"No level.dat found in {archive_path.name}; extraction stopped.")
            destination = ROOT_DIR / "Extracted" / folder_name
            if destination.exists():
                shutil.rmtree(destination)
            destination.parent.mkdir(parents=True, exist_ok=True)
            shutil.copytree(world, destination)
            print(f"Extracted {archive_name} -> {destination.relative_to(ROOT)}")
            db = destination / "db"
            if not (db / "CURRENT").is_file():
                print(f"WARNING: {mode} template has no db/CURRENT; it is metadata/settings only.")


def package_templates() -> None:
    for mode, (archive_name, folder_name) in MODES.items():
        source = ROOT_DIR / "Extracted" / folder_name
        if not source.is_dir():
            raise FileNotFoundError(f"Missing editable template folder: {source}")
        world = locate_world_root(source)
        if world is None:
            raise ValueError(f"No level.dat found under {source}; packaging stopped.")
        archive_path = ROOT_DIR / archive_name
        archive_path.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(archive_path, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for path in sorted(world.rglob("*")):
                relative = path.relative_to(world).as_posix()
                if path.is_dir():
                    archive.writestr(relative.rstrip("/") + "/", "")
                elif path.is_file():
                    archive.write(path, relative)
        print(f"Packaged {source.relative_to(ROOT)} -> {archive_path.relative_to(ROOT)}")
        with zipfile.ZipFile(archive_path) as archive:
            if "level.dat" not in archive.namelist():
                raise RuntimeError(f"{archive_path.name} does not contain root level.dat after packaging.")


def main() -> int:
    if len(sys.argv) != 2 or sys.argv[1] not in {"extract", "package"}:
        print("Usage: python scripts/sync_mcpeworld_templates.py extract|package")
        return 2
    if sys.argv[1] == "extract":
        extract_templates()
    else:
        package_templates()
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
