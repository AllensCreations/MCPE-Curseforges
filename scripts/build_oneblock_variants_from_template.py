#!/usr/bin/env python3
"""Build complete OneBlock worlds from the repository's valid Bedrock world archive.

CreateWorld/McpeWorld.html remains the settings/behavior reference. Unlike the
HTML download routine and the former builder, this script preserves an existing
real Bedrock LevelDB world instead of manufacturing an empty database.
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
SOURCE_WORLD = MAPS_ROOT / "OneBlock-Void-Survival" / "OneBlock Void Survival by AllensCreations (V1.2.5).mcworld"
MODES = ("Creative", "Survival", "Hardcore")
PACK_VERSION = [0, 1, 18]
SEED = 159266
VOID_LAYERS = '{"biome_id":1,"encoding_version":6,"preset_id":"TheVoid","world_version":"version.post_1_18"}'


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


def patch_level_dat(path: Path, world_name: str, mode: str) -> None:
    raw = path.read_bytes()
    if len(raw) < 8:
        raise ValueError(f"{path.name} is too short to be a Bedrock level.dat")
    creative = mode == "Creative"
    hardcore = mode == "Hardcore"
    raw = patch_string_tag(raw, "LevelName", world_name)
    # The source world's actual LevelDB/chunk layout is preserved. Some valid
    # retail worlds omit FlatWorldLayers because they are not flat-world presets;
    # only update these optional metadata fields when present.
    if tag_prefix(8, "FlatWorldLayers") in raw[8:]:
        raw = patch_string_tag(raw, "FlatWorldLayers", VOID_LAYERS)
    if tag_prefix(8, "InventoryVersion") in raw[8:]:
        raw = patch_string_tag(raw, "InventoryVersion", "1.26.52")
    for name, value in (
        ("GameType", 1 if creative else 0),
        ("Difficulty", 3),
        ("RandomSeed", SEED),
        ("SpawnX", 0),
        ("SpawnY", 65),
        ("SpawnZ", 0),
        ("spawnradius", 0),
    ):
        raw = patch_numeric_tag(raw, 3 if name != "RandomSeed" else 4, name, value)
    for name, value in (
        ("IsHardcore", int(hardcore)),
        ("cheatsEnabled", int(creative)),
        ("commandsEnabled", int(creative)),
        ("hasBeenLoadedInCreative", int(creative)),
    ):
        raw = patch_numeric_tag(raw, 1, name, value)
    for name, value in (
        ("instabuild", int(creative)),
        ("invulnerable", int(creative)),
        ("mayfly", int(creative)),
        ("op", int(creative)),
        ("teleport", int(creative)),
    ):
        raw = patch_numeric_tag(raw, 1, name, value)
    path.write_bytes(raw)


def read_manifest(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    header = data.get("header", {})
    if not header.get("uuid") or not isinstance(header.get("version"), list):
        raise ValueError(f"Invalid pack manifest: {path}")
    return data


def make_platform_pack(target: Path, project_slug: str) -> tuple[str, list[int]]:
    import uuid
    namespace = uuid.uuid5(uuid.NAMESPACE_URL, f"https://github.com/AllensCreations/MCPE-Curseforges/{project_slug}/starting-platform")
    pack_uuid = str(namespace)
    module_uuid = str(uuid.uuid5(namespace, "module"))
    version = [1, 0, 0]
    target.mkdir(parents=True, exist_ok=True)
    functions = target / "functions"
    functions.mkdir()
    manifest = {
        "format_version": 2,
        "header": {
            "name": "OneBlock Starting Platform (v1.0.0)",
            "description": "Restores the starting footing and spawn point without teleporting players. by AllensCreations",
            "uuid": pack_uuid,
            "version": version,
            "min_engine_version": [1, 26, 0],
        },
        "modules": [{"type": "data", "uuid": module_uuid, "version": version}],
        "metadata": {"authors": ["AllensCreations"]},
    }
    (target / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    (functions / "tick.json").write_text(json.dumps({"values": ["oneblock_setup"]}, indent=2) + "\n", encoding="utf-8")
    lines = [
        "gamerule spawnradius 0",
        "execute if block 0 63 0 air run setblock 0 63 0 bedrock",
        "execute if block 0 64 0 air run setblock 0 64 0 dirt",
        "setworldspawn 0 65 0",
    ]
    (functions / "oneblock_setup.mcfunction").write_text("\n".join(lines) + "\n", encoding="utf-8")
    return pack_uuid, version


def build_variant(mode: str) -> Path:
    if not SOURCE_WORLD.is_file():
        raise FileNotFoundError(
            f"Required valid Bedrock source world is missing: {SOURCE_WORLD}. "
            "Refusing to publish a fabricated empty LevelDB world."
        )
    bp_source = PROJECT / "behavior_pack"
    rp_source = PROJECT / "resource_pack"
    bp_manifest = read_manifest(bp_source / "manifest.json")
    rp_manifest_path = rp_source / "manifest.json"
    rp_manifest = read_manifest(rp_manifest_path) if rp_manifest_path.is_file() else None
    bp_uuid = bp_manifest["header"]["uuid"]
    bp_version = bp_manifest["header"]["version"]
    rp_uuid = rp_manifest["header"]["uuid"] if rp_manifest else None
    rp_version = rp_manifest["header"]["version"] if rp_manifest else None
    world_name = f"OneBlock Dirtbound Kingdom Beta - {mode}"
    output = PROJECT / f"{safe_name(world_name)}.mcworld"
    project_slug = PROJECT.relative_to(ROOT).as_posix()

    with tempfile.TemporaryDirectory(prefix="dirtbound-world-") as temp:
        world = Path(temp) / "world"
        world.mkdir()
        safe_extract(SOURCE_WORLD, world)
        if not (world / "level.dat").is_file() or not (world / "db" / "CURRENT").is_file():
            raise ValueError("The source archive must contain level.dat and a real db/CURRENT LevelDB file.")
        data_files = [
            p for p in (world / "db").iterdir()
            if p.is_file() and p.name not in {"CURRENT", "LOCK", "LOG", "LOG.old"}
            and not p.name.startswith("MANIFEST")
        ]
        if not data_files:
            raise ValueError("The source world has no LevelDB data files; refusing to generate a broken world.")

        for metadata_name in ("level.dat", "level.dat_old"):
            metadata = world / metadata_name
            if metadata.is_file():
                patch_level_dat(metadata, world_name, mode)
        (world / "levelname.txt").write_text(world_name, encoding="utf-8")

        # Replace the template's old packs while preserving its actual world database.
        for folder in ("behavior_packs", "resource_packs"):
            path = world / folder
            if path.exists():
                shutil.rmtree(path)
        (world / "behavior_packs").mkdir()
        (world / "resource_packs").mkdir()
        bp_folder = "DirtboundKingdomBP"
        shutil.copytree(bp_source, world / "behavior_packs" / bp_folder)
        bootstrap_uuid, bootstrap_version = make_platform_pack(
            world / "behavior_packs" / "OneBlockStartingPlatform", project_slug
        )
        bp_links = [
            {"pack_id": bp_uuid, "version": bp_version},
            {"pack_id": bootstrap_uuid, "version": bootstrap_version},
        ]
        (world / "world_behavior_packs.json").write_text(json.dumps(bp_links, indent=2) + "\n", encoding="utf-8")

        if rp_manifest:
            shutil.copytree(rp_source, world / "resource_packs" / "DirtboundKingdomRP")
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

    verify_archive(output, bp_uuid, bp_version, rp_uuid, rp_version, bootstrap_uuid)
    return output


def verify_archive(path: Path, bp_uuid: str, bp_version: list[int], rp_uuid: str | None,
                   rp_version: list[int] | None, bootstrap_uuid: str) -> None:
    with zipfile.ZipFile(path) as archive:
        names = set(archive.namelist())
        required = {
            "level.dat", "levelname.txt", "db/CURRENT",
            "behavior_packs/DirtboundKingdomBP/manifest.json",
            "behavior_packs/DirtboundKingdomBP/functions/tick.json",
            "behavior_packs/OneBlockStartingPlatform/manifest.json",
            "behavior_packs/OneBlockStartingPlatform/functions/tick.json",
            "behavior_packs/OneBlockStartingPlatform/functions/oneblock_setup.mcfunction",
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
        if not any(p.get("pack_id") == bootstrap_uuid for p in bp_links):
            raise RuntimeError(f"{path.name} does not link the starting-platform pack.")
        if rp_uuid:
            if "world_resource_packs.json" not in names:
                raise RuntimeError(f"{path.name} is missing world_resource_packs.json.")
            rp_links = json.loads(archive.read("world_resource_packs.json"))
            if not any(p.get("pack_id") == rp_uuid and p.get("version") == rp_version for p in rp_links):
                raise RuntimeError(f"{path.name} does not link the Dirtbound Resource Pack.")


def main() -> int:
    if not (PROJECT / "oneblock.json").is_file():
        raise FileNotFoundError(f"OneBlock marker not found in {PROJECT}")
    config = json.loads((PROJECT / "oneblock.json").read_text(encoding="utf-8"))
    if config.get("enabled", True) is not True:
        print("Dirtbound OneBlock generation is disabled.")
        return 0
    built = []
    for mode in MODES:
        output = build_variant(mode)
        print(f"Built from valid source world and structurally verified: {output.relative_to(ROOT)} ({output.stat().st_size} bytes)")
        built.append(output)
    print(f"Successfully built {len(built)} world variants.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
