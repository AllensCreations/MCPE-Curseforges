#!/usr/bin/env python3
"""Build OneBlock worlds from the three user-supplied mode-specific templates.

Each Mcpeworlds archive is the source of truth for its own world settings and
real LevelDB database. The builder adds the target map's actual packs and
changes only the displayed world name and required pack links.
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
    "Creative": ROOT / "Mcpeworlds" / "Creative_Void_Sandbox.mcworld.zip",
    "Survival": ROOT / "Mcpeworlds" / "Survival_Void_World.mcworld.zip",
    "Hardcore": ROOT / "Mcpeworlds" / "Hardcore_Void_World.mcworld.zip",
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


def locate_world_root(extracted: Path) -> Path:
    """Find the real Bedrock world whether the uploaded ZIP wraps a .mcworld or its files."""
    candidates = [extracted]
    candidates.extend(p.parent for p in extracted.rglob("level.dat"))
    for candidate in candidates:
        if (candidate / "level.dat").is_file() and (candidate / "db" / "CURRENT").is_file():
            return candidate

    nested_archives = sorted(extracted.rglob("*.mcworld"))
    for nested in nested_archives:
        destination = extracted / "_nested_world"
        destination.mkdir(exist_ok=True)
        safe_extract(nested, destination)
        if (destination / "level.dat").is_file() and (destination / "db" / "CURRENT").is_file():
            return destination
        nested_candidates = [p.parent for p in destination.rglob("level.dat")]
        for candidate in nested_candidates:
            if (candidate / "db" / "CURRENT").is_file():
                return candidate

    raise ValueError(
        "The selected Mcpeworlds template does not contain level.dat and db/CURRENT. "
        "Refusing to create a fabricated or incomplete world."
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
    if not source_world.is_file():
        raise FileNotFoundError(
            f"Required mode-specific Mcpeworlds template is missing: {source_world}. "
            "Refusing to publish a fabricated empty LevelDB world."
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
    project_slug = project.relative_to(ROOT).as_posix()

    with tempfile.TemporaryDirectory(prefix="dirtbound-world-") as temp:
        staging = Path(temp) / "staging"
        staging.mkdir()
        safe_extract(source_world, staging)
        world = locate_world_root(staging)
        data_files = [
            p for p in (world / "db").iterdir()
            if p.is_file() and p.name not in {"CURRENT", "LOCK", "LOG", "LOG.old"}
            and not p.name.startswith("MANIFEST")
        ]
        if not data_files:
            raise ValueError(
                f"The {mode} template has no LevelDB data files; refusing to generate a broken world."
            )

        # Preserve the mode-specific template's game mode, seed, spawn, void settings,
        # gamerules, and all other metadata. Only rename the imported world.
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

        output.parent.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for path in sorted(world.rglob("*")):
                relative = path.relative_to(world).as_posix()
                if path.is_dir():
                    archive.writestr(relative.rstrip("/") + "/", "")
                elif path.is_file():
                    archive.write(path, relative)

    verify_archive(output, bp_uuid, bp_version, rp_uuid, rp_version, bp_folder, rp_folder)
    return output


def verify_archive(path: Path, bp_uuid: str, bp_version: list[int], rp_uuid: str | None,
                   rp_version: list[int] | None, bp_folder: str, rp_folder: str) -> None:
    with zipfile.ZipFile(path) as archive:
        names = set(archive.namelist())
        required = {
            "level.dat", "levelname.txt", "db/CURRENT",
            f"behavior_packs/{bp_folder}/manifest.json",
            f"behavior_packs/{bp_folder}/functions/tick.json",
            "world_behavior_packs.json",
        }
        if "level.dat_old" in names:
            required.add("level.dat_old")
        missing = required - names
        if missing:
            raise RuntimeError(f"{path.name} missing required entries: {', '.join(sorted(missing))}")
        if not any(n.startswith("db/") and not n.endswith("/") and n.split("/")[-1] not in
                   {"CURRENT", "LOCK", "LOG", "LOG.old"} and not n.split("/")[-1].startswith("MANIFEST")
                   for n in names):
            raise RuntimeError(f"{path.name} contains no real LevelDB data files.")
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
