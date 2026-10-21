#!/usr/bin/env python3
"""Build Creative, Survival, and Hardcore .mcworld variants for a OneBlock map.

CreateWorld/McpeWorld.html is a design reference. This builder creates Bedrock
world metadata and a LevelDB database directly, then installs the selected
map's actual Behavior/Resource Packs and a small one-time starting-platform pack.
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import struct
import sys
import tempfile
import uuid
import zipfile
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
MAPS_ROOT = ROOT / "MCPEDL" / "maps"
MODES = ("Creative", "Survival", "Hardcore")
VERSION = [1, 0, 0]
SEED = 159266

# Bedrock little-endian NBT tag IDs.
END, BYTE, SHORT, INT, LONG, FLOAT, DOUBLE = range(7)
BYTE_ARRAY, STRING, LIST, COMPOUND, INT_ARRAY, LONG_ARRAY = range(7, 13)


def safe_name(value: str) -> str:
    value = re.sub(r'[\\/*?:"<>|]', "", value).strip().rstrip(".")
    return value or "OneBlock"


def pack_string(value: str) -> bytes:
    encoded = value.encode("utf-8")
    if len(encoded) > 65535:
        raise ValueError("NBT string exceeds the 65535-byte limit.")
    return struct.pack("<H", len(encoded)) + encoded


def nbt_payload(tag_type: int, value: Any) -> bytes:
    if tag_type == BYTE:
        return struct.pack("<b", int(value))
    if tag_type == SHORT:
        return struct.pack("<h", int(value))
    if tag_type == INT:
        return struct.pack("<i", int(value))
    if tag_type == LONG:
        return struct.pack("<q", int(value))
    if tag_type == FLOAT:
        return struct.pack("<f", float(value))
    if tag_type == DOUBLE:
        return struct.pack("<d", float(value))
    if tag_type == BYTE_ARRAY:
        data = bytes(value)
        return struct.pack("<i", len(data)) + data
    if tag_type == STRING:
        return pack_string(str(value))
    if tag_type == LIST:
        item_type, items = value
        return bytes([item_type]) + struct.pack("<i", len(items)) + b"".join(
            nbt_payload(item_type, item) for item in items
        )
    if tag_type == COMPOUND:
        result = bytearray()
        for name, (child_type, child_value) in value.items():
            result.append(child_type)
            result.extend(pack_string(name))
            result.extend(nbt_payload(child_type, child_value))
        result.append(END)
        return bytes(result)
    if tag_type == INT_ARRAY:
        return struct.pack("<i", len(value)) + b"".join(struct.pack("<i", int(x)) for x in value)
    if tag_type == LONG_ARRAY:
        return struct.pack("<i", len(value)) + b"".join(struct.pack("<q", int(x)) for x in value)
    if tag_type == END:
        return b""
    raise ValueError(f"Unsupported NBT tag type: {tag_type}")


def tag(tag_type: int, value: Any) -> tuple[int, Any]:
    return tag_type, value


def make_level_dat(world_name: str, mode: str) -> bytes:
    creative = mode == "Creative"
    hardcore = mode == "Hardcore"
    now = int(__import__("time").time())
    abilities = {
        "attackmobs": tag(BYTE, 1),
        "attackplayers": tag(BYTE, 1),
        "build": tag(BYTE, 1),
        "doorsandswitches": tag(BYTE, 1),
        "flySpeed": tag(FLOAT, 0.05),
        "flying": tag(BYTE, 0),
        "instabuild": tag(BYTE, int(creative)),
        "invulnerable": tag(BYTE, int(creative)),
        "mayfly": tag(BYTE, int(creative)),
        "mine": tag(BYTE, 1),
        "op": tag(BYTE, int(creative)),
        "opencontainers": tag(BYTE, 1),
        "teleport": tag(BYTE, int(creative)),
        "walkSpeed": tag(FLOAT, 0.1),
    }
    root = {
        "BiomeOverride": tag(STRING, ""),
        "CenterMapsToOrigin": tag(BYTE, 0),
        "ConfirmedPlatformLockedContent": tag(BYTE, 0),
        "Difficulty": tag(INT, 3),
        "FlatWorldLayers": tag(STRING, '{"biome_id":1,"encoding_version":6,"preset_id":"TheVoid","world_version":"version.post_1_18"}'),
        "ForceGameType": tag(BYTE, 0),
        "GameType": tag(INT, 1 if creative else 0),
        "Generator": tag(INT, 2),
        "HasUncompleteWorldFileOnDisk": tag(BYTE, 0),
        "InventoryVersion": tag(STRING, "1.26.52"),
        "IsHardcore": tag(BYTE, int(hardcore)),
        "LANBroadcast": tag(BYTE, 1),
        "LANBroadcastIntent": tag(BYTE, 1),
        "LastPlayed": tag(LONG, now),
        "LevelName": tag(STRING, world_name),
        "LimitedWorldOriginX": tag(INT, 0),
        "LimitedWorldOriginY": tag(INT, 32767),
        "LimitedWorldOriginZ": tag(INT, 0),
        "MinimumCompatibleClientVersion": tag(LIST, (INT, [1, 26, 50, 0, 0])),
        "MultiplayerGame": tag(BYTE, 1),
        "MultiplayerGameIntent": tag(BYTE, 1),
        "NetherScale": tag(INT, 8),
        "NetworkVersion": tag(INT, 685),
        "Platform": tag(INT, 2),
        "PlatformBroadcastIntent": tag(INT, 3),
        "PlayerHasDied": tag(BYTE, 0),
        "RandomSeed": tag(LONG, SEED),
        "SpawnV1Villagers": tag(BYTE, 0),
        "SpawnX": tag(INT, 0),
        "SpawnY": tag(INT, 65),
        "SpawnZ": tag(INT, 0),
        "StorageVersion": tag(INT, 9),
        "Time": tag(LONG, 1000),
        "WorldVersion": tag(INT, 1),
        "XBLBroadcastIntent": tag(INT, 3),
        "abilities": tag(COMPOUND, abilities),
        "commandsEnabled": tag(BYTE, int(creative)),
        "cheatsEnabled": tag(BYTE, int(creative)),
        "dodaylightcycle": tag(BYTE, 1),
        "doentitydrops": tag(BYTE, 1),
        "dofiretick": tag(BYTE, 1),
        "domobloot": tag(BYTE, 1),
        "domobspawning": tag(BYTE, 1),
        "dotiledrops": tag(BYTE, 1),
        "doweathercycle": tag(BYTE, 1),
        "eduOffer": tag(INT, 0),
        "educationFeaturesEnabled": tag(BYTE, 0),
        "experiments": tag(COMPOUND, {}),
        "hasBeenLoadedInCreative": tag(BYTE, int(creative)),
        "hasLockedBehaviorPack": tag(BYTE, 0),
        "hasLockedResourcePack": tag(BYTE, 0),
        "isFromLockedWorldTemplate": tag(BYTE, 0),
        "isWorldTemplateOptionLocked": tag(BYTE, 0),
        "keepinventory": tag(BYTE, 0),
        "maxcommandchainlength": tag(INT, 65535),
        "mobgriefing": tag(BYTE, 1),
        "naturalregeneration": tag(BYTE, 1),
        "pvp": tag(BYTE, 1),
        "randomtickspeed": tag(INT, 1),
        "recipesunlock": tag(BYTE, 1),
        "respawnblocksexplode": tag(BYTE, 1),
        "sendcommandfeedback": tag(BYTE, 1),
        "showcoordinates": tag(BYTE, 1),
        "showdaysplayed": tag(BYTE, 1),
        "showdeathmessages": tag(BYTE, 1),
        "showrecipemessages": tag(BYTE, 1),
        "showtags": tag(BYTE, 1),
        "spawnMobs": tag(BYTE, 1),
        "spawnradius": tag(INT, 1),
        "startWithMapEnabled": tag(BYTE, 0),
        "texturePacksRequired": tag(BYTE, 0),
        "tntexplodes": tag(BYTE, 1),
        "tntexplosiondropdecay": tag(BYTE, 0),
        "worldStartCount": tag(LONG, 1),
        "world_policies": tag(COMPOUND, {}),
    }
    payload = bytes([COMPOUND]) + pack_string("") + nbt_payload(COMPOUND, root)
    return struct.pack("<II", 10, len(payload)) + payload


def read_manifest(path: Path) -> dict[str, Any]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        raise ValueError(f"Cannot read valid pack manifest at {path}: {exc}") from exc
    header = data.get("header", {})
    if not header.get("uuid") or not isinstance(header.get("version"), list):
        raise ValueError(f"Pack manifest needs header.uuid and header.version: {path}")
    return data


def make_bootstrap_pack(project_slug: str, target: Path) -> tuple[str, list[int]]:
    namespace = uuid.uuid5(uuid.NAMESPACE_URL, f"https://github.com/AllensCreations/MCPE-Curseforges/{project_slug}/oneblock-bootstrap")
    pack_uuid = str(namespace)
    module_uuid = str(uuid.uuid5(namespace, "module"))
    target.mkdir(parents=True, exist_ok=True)
    (target / "functions").mkdir()
    manifest = {
        "format_version": 2,
        "header": {
            "name": "OneBlock Starting Platform (v1.0.0)",
            "description": "Creates the initial OneBlock platform and spawn point. by AllensCreations",
            "uuid": pack_uuid,
            "version": VERSION,
            "min_engine_version": [1, 26, 0],
        },
        "modules": [{"type": "data", "uuid": module_uuid, "version": VERSION}],
        "metadata": {"authors": ["AllensCreations"]},
    }
    (target / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    (target / "functions" / "tick.json").write_text(json.dumps({"values": ["oneblock_setup"]}, indent=2) + "\n", encoding="utf-8")
    lines = [
        "execute if block 0 63 0 air run setblock 0 63 0 bedrock",
        "execute if block 0 64 0 air run setblock 0 64 0 dirt",
        "setworldspawn 0 65 0",
    ]
    (target / "functions" / "oneblock_setup.mcfunction").write_text("\n".join(lines) + "\n", encoding="utf-8")
    return pack_uuid, VERSION


def build_variant(project: Path, project_slug: str, map_name: str, mode: str) -> Path:
    bp_source = project / "behavior_pack"
    rp_source = project / "resource_pack"
    bp_manifest_path = bp_source / "manifest.json"
    if not bp_manifest_path.is_file():
        raise FileNotFoundError(f"Missing required Behavior Pack manifest: {bp_manifest_path}")
    bp_manifest = read_manifest(bp_manifest_path)
    rp_manifest_path = rp_source / "manifest.json"
    rp_manifest = read_manifest(rp_manifest_path) if rp_manifest_path.is_file() else None

    dependencies = bp_manifest.get("dependencies", [])
    uuid_dependencies = [dep for dep in dependencies if isinstance(dep, dict) and dep.get("uuid")]
    if uuid_dependencies and rp_manifest is None:
        raise ValueError(
            f"{project_slug} Behavior Pack declares a UUID dependency but resource_pack/manifest.json is missing."
        )
    if rp_manifest is not None:
        for dep in uuid_dependencies:
            if dep.get("uuid") != rp_manifest["header"]["uuid"]:
                raise ValueError(
                    f"{project_slug} Behavior Pack dependency UUID {dep.get('uuid')} does not match "
                    f"resource_pack/manifest.json UUID {rp_manifest['header']['uuid']}."
                )
            if dep.get("version") != rp_manifest["header"]["version"]:
                raise ValueError(
                    f"{project_slug} Behavior Pack dependency version {dep.get('version')} does not match "
                    f"resource_pack/manifest.json version {rp_manifest['header']['version']}."
                )

    variant_name = f"{map_name} - {mode}"
    # Keep Creative, Survival, and Hardcore downloads together in the map folder.
    out_dir = project
    out_dir.mkdir(parents=True, exist_ok=True)
    output = out_dir / f"{safe_name(variant_name)}.mcworld"

    with tempfile.TemporaryDirectory(prefix="oneblock-world-") as temp:
        stage = Path(temp) / "world"
        (stage / "db").mkdir(parents=True)
        try:
            import plyvel  # type: ignore
        except ImportError as exc:
            raise RuntimeError("Missing build dependency plyvel. Install LevelDB system libraries and plyvel.") from exc
        db = plyvel.DB(str(stage / "db"), create_if_missing=True)
        db.close()

        (stage / "level.dat").write_bytes(make_level_dat(variant_name, mode))
        (stage / "level.dat_old").write_bytes(make_level_dat(variant_name, mode))
        (stage / "levelname.txt").write_text(variant_name, encoding="utf-8")

        bp_folder = safe_name(project.name + "BP")
        shutil.copytree(bp_source, stage / "behavior_packs" / bp_folder)
        bp_links = [{"pack_id": bp_manifest["header"]["uuid"], "version": bp_manifest["header"]["version"]}]

        bootstrap_uuid, bootstrap_version = make_bootstrap_pack(
            project_slug, stage / "behavior_packs" / "OneBlockStartingPlatform"
        )
        bp_links.append({"pack_id": bootstrap_uuid, "version": bootstrap_version})
        (stage / "world_behavior_packs.json").write_text(json.dumps(bp_links, indent=2) + "\n", encoding="utf-8")

        if rp_manifest is not None:
            rp_folder = safe_name(project.name + "RP")
            shutil.copytree(rp_source, stage / "resource_packs" / rp_folder)
            rp_links = [{"pack_id": rp_manifest["header"]["uuid"], "version": rp_manifest["header"]["version"]}]
            (stage / "world_resource_packs.json").write_text(json.dumps(rp_links, indent=2) + "\n", encoding="utf-8")

        with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for item in sorted(stage.rglob("*")):
                rel = item.relative_to(stage).as_posix()
                if item.is_dir():
                    archive.writestr(rel.rstrip("/") + "/", "")
                elif item.is_file():
                    archive.write(item, rel)

    verify_archive(output, bp_manifest, rp_manifest, bootstrap_uuid)
    return output


def verify_archive(path: Path, bp_manifest: dict[str, Any], rp_manifest: dict[str, Any] | None, bootstrap_uuid: str) -> None:
    with zipfile.ZipFile(path) as archive:
        names = set(archive.namelist())
        required = {
            "level.dat", "level.dat_old", "levelname.txt", "db/CURRENT",
            "world_behavior_packs.json", "behavior_packs/OneBlockStartingPlatform/manifest.json",
            "behavior_packs/OneBlockStartingPlatform/functions/tick.json",
            "behavior_packs/OneBlockStartingPlatform/functions/oneblock_setup.mcfunction",
            f"behavior_packs/{safe_name(path.parent.parent.name + 'BP')}/manifest.json",
        }
        if rp_manifest is not None:
            required.add(f"resource_packs/{safe_name(path.parent.parent.name + 'RP')}/manifest.json")
        missing = required - names
        if missing:
            raise RuntimeError(f"{path} is missing required archive entries: {', '.join(sorted(missing))}")
        if not any(n.startswith("db/") and not n.endswith("/") for n in names):
            raise RuntimeError(f"{path} does not contain LevelDB files.")
        bp_links = json.loads(archive.read("world_behavior_packs.json"))
        if not any(x.get("pack_id") == bp_manifest["header"]["uuid"] and x.get("version") == bp_manifest["header"]["version"] for x in bp_links):
            raise RuntimeError(f"{path} does not link its source Behavior Pack.")
        if not any(x.get("pack_id") == bootstrap_uuid for x in bp_links):
            raise RuntimeError(f"{path} does not link the starting-platform pack.")
        if rp_manifest is not None:
            if "world_resource_packs.json" not in names:
                raise RuntimeError(f"{path} is missing world_resource_packs.json.")
            rp_links = json.loads(archive.read("world_resource_packs.json"))
            if not any(x.get("pack_id") == rp_manifest["header"]["uuid"] and x.get("version") == rp_manifest["header"]["version"] for x in rp_links):
                raise RuntimeError(f"{path} does not link its source Resource Pack.")


def find_projects(project_path: str | None) -> list[Path]:
    if project_path:
        candidate = (ROOT / project_path).resolve()
        if MAPS_ROOT.resolve() not in candidate.parents:
            raise ValueError("--project-path must point to a project inside MCPEDL/maps/.")
        if not (candidate / "oneblock.json").is_file():
            raise FileNotFoundError(f"OneBlock marker not found: {candidate / 'oneblock.json'}")
        return [candidate]
    return sorted(path.parent for path in MAPS_ROOT.rglob("oneblock.json"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Build Creative, Survival, and Hardcore OneBlock .mcworld variants.")
    parser.add_argument("--project-path", help="Repository-relative map directory containing oneblock.json.")
    parser.add_argument("--all", action="store_true", help="Build every map marked with oneblock.json.")
    args = parser.parse_args()
    projects = find_projects(args.project_path)
    if not projects:
        print("No OneBlock projects found. Add oneblock.json beside behavior_pack/ to opt a map into generation.")
        return 0

    errors = []
    for project in projects:
        config_path = project / "oneblock.json"
        try:
            config = json.loads(config_path.read_text(encoding="utf-8"))
            if config.get("enabled", True) is not True:
                print(f"Skipping disabled OneBlock project: {project.relative_to(ROOT)}")
                continue
            if config.get("release_enabled", False) is not True:
                print(f"Skipping release worlds until tester sign-off: {project.relative_to(ROOT)}")
                continue
            map_name = str(config.get("name") or project.name.replace("-", " "))
            project_slug = project.relative_to(ROOT).as_posix()
            for mode in MODES:
                output = build_variant(project, project_slug, map_name, mode)
                print(f"Built and structurally verified: {output.relative_to(ROOT)}")
        except Exception as exc:
            errors.append(f"{project.relative_to(ROOT)}: {exc}")
    if errors:
        print("\n".join(f"ERROR: {item}" for item in errors), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
