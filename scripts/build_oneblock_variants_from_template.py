#!/usr/bin/env python3
"""Build database-free OneBlock void worlds from the authoritative Mcpeworlds foundations.

Each mode must contain its own valid level.dat. A LevelDB database is deliberately
not required: these foundations are database-free void worlds. The builder copies
the selected foundation, preserves its metadata, integrates the map's current
packs, validates the archive, and only then replaces the published archive.
"""
from __future__ import annotations

import json
import re
import shutil
import struct
import tempfile
import zipfile
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
MAPS_ROOT = ROOT / "MCPEDL" / "maps"
PROJECT = MAPS_ROOT / "OneBlock-Dirtbound-Kingdom-Beta"
SOURCE_WORLDS = {
    "Creative": ROOT / "Mcpeworlds" / "Creative",
    "Survival": ROOT / "Mcpeworlds" / "Survival",
    "Hardcore": ROOT / "Mcpeworlds" / "Hardcore",
}
MODES = ("Creative", "Survival", "Hardcore")


def safe_name(value: str) -> str:
    return re.sub(r'[\\/*?:"<>|]', "", value).strip().rstrip(".") or "OneBlock"


def safe_extract(archive_path: Path, destination: Path) -> None:
    root = destination.resolve()
    with zipfile.ZipFile(archive_path) as archive:
        for member in archive.infolist():
            target = (destination / member.filename).resolve()
            if target != root and root not in target.parents:
                raise ValueError(f"Unsafe path in source world archive: {member.filename}")
        archive.extractall(destination)


def locate_world_root(extracted: Path, depth: int = 0) -> Path:
    """Find a Bedrock world inside direct, nested .mcworld, or wrapper ZIP uploads."""
    candidates = [extracted]
    candidates.extend(p.parent for p in extracted.rglob("level.dat"))
    for candidate in candidates:
        if (candidate / "level.dat").is_file():
            return candidate

    if depth < 4:
        nested_archives = [
            p for p in extracted.rglob("*")
            if p.is_file() and zipfile.is_zipfile(p)
        ]
        for index, nested in enumerate(nested_archives):
            destination = extracted / f"_nested_archive_{depth}_{index}"
            destination.mkdir(exist_ok=True)
            try:
                safe_extract(nested, destination)
                return locate_world_root(destination, depth + 1)
            except (ValueError, zipfile.BadZipFile, OSError):
                continue

    sample = sorted(p.relative_to(extracted).as_posix() for p in extracted.rglob("*") if p.is_file())[:30]
    raise ValueError(
        "The selected Mcpeworlds template does not contain level.dat, "
        f"even after inspecting nested ZIP archives. Files found: {sample}. "
        "Refusing to create a fabricated or incomplete world."
    )


def validate_database_free_foundation(world_path: Path, label: str) -> None:
    """Ensure the source remains a deliberate database-free void-world foundation."""
    db_path = world_path / "db"
    if (db_path / "CURRENT").exists():
        raise ValueError(
            f"{label} unexpectedly contains db/CURRENT. This project intentionally "
            "uses a database-free void-world foundation; refusing to add or substitute a database."
        )
    if db_path.is_dir():
        metadata_names = {"CURRENT", "LOCK", "LOG", "LOG.old"}
        data_files = [
            path for path in db_path.iterdir()
            if path.is_file()
            and path.name not in metadata_names
            and not path.name.startswith("MANIFEST")
        ]
        if data_files:
            names = ", ".join(sorted(path.name for path in data_files[:10]))
            raise ValueError(
                f"{label} contains unexpected database data in {db_path}: {names}. "
                "The foundation must remain database-free; do not create, borrow, or fabricate LevelDB."
            )


def tag_prefix(tag_type: int, name: str) -> bytes:
    encoded = name.encode("utf-8")
    if len(encoded) > 65535:
        raise ValueError(f"NBT tag name too long: {name}")
    return bytes([tag_type]) + struct.pack("<H", len(encoded)) + encoded


def patch_numeric_tag(raw: bytes, tag_type: int, name: str, value: int) -> bytes:
    sizes = {1: 1, 3: 4, 4: 8}
    if tag_type not in sizes:
        raise ValueError(f"Unsupported numeric NBT type: {tag_type}")
    prefix = tag_prefix(tag_type, name)
    index = raw.find(prefix, 8)
    if index < 0:
        raise ValueError(f"Missing required NBT tag {name!r} in level.dat")
    start = index + len(prefix)
    size = sizes[tag_type]
    if tag_type == 1:
        packed = struct.pack("<b", value)
    elif tag_type == 3:
        packed = struct.pack("<i", value)
    else:
        packed = struct.pack("<q", value)
    return raw[:start] + packed[:size] + raw[start + size:]


def add_root_numeric_tag(raw: bytes, tag_type: int, name: str, value: int) -> bytes:
    """Append a missing root-level numeric NBT tag before the root END marker."""
    if len(raw) < 9 or raw[-1] != 0:
        raise ValueError("Cannot safely append a root NBT tag: invalid compound terminator.")
    if tag_type == 1:
        packed = struct.pack("<b", value)
    elif tag_type == 3:
        packed = struct.pack("<i", value)
    elif tag_type == 4:
        packed = struct.pack("<q", value)
    else:
        raise ValueError(f"Unsupported root numeric NBT type: {tag_type}")
    payload = raw[8:-1] + tag_prefix(tag_type, name) + packed + raw[-1:]
    return raw[:4] + struct.pack("<I", len(payload)) + payload


def patch_string_tag(raw: bytes, name: str, value: str) -> bytes:
    prefix = tag_prefix(8, name)
    index = raw.find(prefix, 8)
    if index < 0:
        raise ValueError(f"Missing required NBT string tag {name!r} in level.dat")
    length_at = index + len(prefix)
    old_length = struct.unpack("<H", raw[length_at:length_at + 2])[0]
    value_at = length_at + 2
    old_end = value_at + old_length
    if old_end > len(raw):
        raise ValueError(f"Truncated NBT string value for {name!r}")
    encoded = value.encode("utf-8")
    if len(encoded) > 65535:
        raise ValueError(f"NBT string value too long for {name!r}")
    payload = raw[8:length_at] + struct.pack("<H", len(encoded)) + encoded + raw[old_end:]
    return raw[:4] + struct.pack("<I", len(payload)) + payload


def patch_level_dat(path: Path, world_name: str) -> None:
    """Rename a template world without overriding its selected mode/settings."""
    raw = path.read_bytes()
    if len(raw) < 8:
        raise ValueError(f"{path.name} is too short to be a Bedrock level.dat")
    raw = patch_string_tag(raw, "LevelName", world_name)
    path.write_bytes(raw)


def read_manifest(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    header = data.get("header", {})
    if not header.get("uuid") or not isinstance(header.get("version"), list):
        raise ValueError(f"Invalid pack manifest: {path}")
    return data


def build_variant(project: Path, map_name: str, mode: str) -> Path:
    source_world = SOURCE_WORLDS[mode]
    if not source_world.is_dir() or not (source_world / "level.dat").is_file():
        raise FileNotFoundError(
            f"Required editable mode-specific Mcpeworlds folder is missing or incomplete: {source_world}. "
            "The builder uses these folders directly and no archive fallback is configured."
        )
    bp_source = project / "behavior_pack"
    rp_source = project / "resource_pack"
    bp_manifest = read_manifest(bp_source / "manifest.json")
    rp_manifest_path = rp_source / "manifest.json"
    rp_manifest = read_manifest(rp_manifest_path) if rp_manifest_path.is_file() else None
    bp_uuid = bp_manifest["header"]["uuid"]
    bp_version = bp_manifest["header"]["version"]
    rp_uuid = rp_manifest["header"]["uuid"] if rp_manifest else None
    rp_version = rp_manifest["header"]["version"] if rp_manifest else None
    world_name = f"{map_name} - {mode}"
    output = project / f"{safe_name(world_name)}.mcworld"
    # Build beside the final archive and atomically replace it only after checks pass.
    output.parent.mkdir(parents=True, exist_ok=True)
    staged_output = output.with_name(f".{output.name}.building")
    staged_output.unlink(missing_ok=True)

    with tempfile.TemporaryDirectory(prefix="dirtbound-world-") as temp:
        staging = Path(temp) / "staging"
        staging.mkdir()
        shutil.copytree(source_world, staging, dirs_exist_ok=True)
        world = locate_world_root(staging)

        # Preserve the intentional database-free void design. level.dat is the
        # valid world metadata source; never synthesize or borrow LevelDB files.
        validate_database_free_foundation(world, f"{mode} Mcpeworlds foundation")

        # Preserve the mode-specific foundation's game mode, seed, spawn, void settings,
        # gamerules, terrain, chunks, and other world data. Only rename the imported world.
        for metadata_name in ("level.dat", "level.dat_old"):
            metadata = world / metadata_name
            if metadata.is_file():
                patch_level_dat(metadata, world_name)
        (world / "levelname.txt").write_text(world_name, encoding="utf-8")

        # Replace the template's old packs while preserving its actual world database and mode settings.
        for folder in ("behavior_packs", "resource_packs"):
            path = world / folder
            if path.exists():
                shutil.rmtree(path)
        (world / "behavior_packs").mkdir()
        (world / "resource_packs").mkdir()
        bp_folder = safe_name(project.name + "BP")
        rp_folder = safe_name(project.name + "RP")
        shutil.copytree(bp_source, world / "behavior_packs" / bp_folder)
        # Keep all OneBlock setup and recovery in the map's own Behavior Pack.
        # A second tick-enabled pack can race the progression script and make
        # platform/block state unpredictable, so the world links only this pack.
        bp_links = [
            {"pack_id": bp_uuid, "version": bp_version},
        ]
        (world / "world_behavior_packs.json").write_text(json.dumps(bp_links, indent=2) + "\n", encoding="utf-8")

        if rp_manifest:
            shutil.copytree(rp_source, world / "resource_packs" / rp_folder)
            (world / "world_resource_packs.json").write_text(
                json.dumps([{"pack_id": rp_uuid, "version": rp_version}], indent=2) + "\n",
                encoding="utf-8",
            )
        else:
            (world / "world_resource_packs.json").unlink(missing_ok=True)

        with zipfile.ZipFile(staged_output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for path in sorted(world.rglob("*")):
                relative = path.relative_to(world).as_posix()
                if path.is_dir():
                    archive.writestr(relative.rstrip("/") + "/", "")
                elif path.is_file():
                    archive.write(path, relative)

    verify_archive(staged_output, bp_uuid, bp_version, rp_uuid, rp_version, bp_folder, rp_folder)
    staged_output.replace(output)
    return output


def verify_archive(path: Path, bp_uuid: str, bp_version: list[int], rp_uuid: str | None,
                   rp_version: list[int] | None, bp_folder: str, rp_folder: str) -> None:
    with zipfile.ZipFile(path) as archive:
        names = set(archive.namelist())
        required = {
            "level.dat", "levelname.txt",
            f"behavior_packs/{bp_folder}/manifest.json",
            f"behavior_packs/{bp_folder}/functions/tick.json",
            f"behavior_packs/{bp_folder}/functions/oneblock_setup.mcfunction",
            f"behavior_packs/{bp_folder}/functions/void_cleaner.mcfunction",
            "world_behavior_packs.json",
        }
        if "level.dat_old" in names:
            required.add("level.dat_old")
        missing = required - names
        if missing:
            raise RuntimeError(f"{path.name} missing required entries: {', '.join(sorted(missing))}")
        if "db/CURRENT" in names:
            raise RuntimeError(f"{path.name} unexpectedly contains db/CURRENT; the void foundation must remain database-free.")
        database_files = [
            name for name in names
            if name.startswith("db/") and not name.endswith("/")
            and name.split("/")[-1] not in {"CURRENT", "LOCK", "LOG", "LOG.old"}
            and not name.split("/")[-1].startswith("MANIFEST")
        ]
        if database_files:
            raise RuntimeError(
                f"{path.name} contains unexpected LevelDB data files: {', '.join(sorted(database_files)[:10])}"
            )
        tick_path = f"behavior_packs/{bp_folder}/functions/tick.json"
        tick_data = json.loads(archive.read(tick_path).decode("utf-8"))
        if not tick_data.get("values") or tick_data["values"][0] != "void_cleaner":
            raise RuntimeError(f"{path.name} must run Void Cleaner first in functions/tick.json.")
        cleaner_path = f"behavior_packs/{bp_folder}/functions/void_cleaner.mcfunction"
        cleaner_source = archive.read(cleaner_path).decode("utf-8")
        expected_cleaner = "execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air"
        if expected_cleaner not in cleaner_source.splitlines():
            raise RuntimeError(f"{path.name} does not contain the required 33x33 Y=-64 Void Cleaner command.")
        bp_links = json.loads(archive.read("world_behavior_packs.json"))
        if not any(p.get("pack_id") == bp_uuid and p.get("version") == bp_version for p in bp_links):
            raise RuntimeError(f"{path.name} does not link the Dirtbound Behavior Pack.")
        if rp_uuid:
            if "world_resource_packs.json" not in names:
                raise RuntimeError(f"{path.name} is missing world_resource_packs.json.")
            rp_links = json.loads(archive.read("world_resource_packs.json"))
            if not any(p.get("pack_id") == rp_uuid and p.get("version") == rp_version for p in rp_links):
                raise RuntimeError(f"{path.name} does not link the Dirtbound Resource Pack.")


def main() -> int:
    projects = sorted(path.parent for path in MAPS_ROOT.rglob("oneblock.json"))
    if not projects:
        print("No OneBlock projects found; add oneblock.json beside a map pack.")
        return 0
    built = []
    for project in projects:
        config = json.loads((project / "oneblock.json").read_text(encoding="utf-8"))
        if config.get("enabled", True) is not True:
            print(f"Skipping disabled OneBlock project: {project.relative_to(ROOT)}")
            continue
        map_name = str(config.get("name") or project.name.replace("-", " "))
        for mode in MODES:
            output = build_variant(project, map_name, mode)
            print(f"Built from valid source world and structurally verified: {output.relative_to(ROOT)} ({output.stat().st_size} bytes)")
            built.append(output)
    print(f"Successfully built {len(built)} world variants.")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
