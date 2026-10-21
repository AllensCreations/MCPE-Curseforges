#!/usr/bin/env python3
"""Static source checks for Dirtbound and its three uploaded world templates.

This validation does not claim that gameplay has been tested in Minecraft.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / "MCPEDL/maps/OneBlock-Dirtbound-Kingdom-Beta"
BP = PROJECT / "behavior_pack"
RP = PROJECT / "resource_pack"
TEMPLATES = {
    "Creative": ROOT / "Mcpeworlds/Creative",
    "Survival": ROOT / "Mcpeworlds/Survival",
    "Hardcore": ROOT / "Mcpeworlds/Hardcore",
}
BUILDER = ROOT / "scripts/build_oneblock_variants_from_template.py"


def require(condition: bool, message: str) -> None:
    if not condition:
        raise SystemExit(f"ERROR: {message}")


def load_json(path: Path):
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception as exc:
        raise SystemExit(f"ERROR: invalid JSON at {path.relative_to(ROOT)}: {exc}") from exc


def manifest_version(manifest: dict, path: Path) -> tuple[int, int, int]:
    header = manifest.get("header", {})
    version = header.get("version")
    require(isinstance(version, list) and len(version) == 3 and all(isinstance(v, int) for v in version),
            f"{path.relative_to(ROOT)} header.version must be [major, minor, patch]")
    version_tuple = tuple(version)
    expected_suffix = f"(v{version_tuple[0]}.{version_tuple[1]}.{version_tuple[2]})"
    require(header.get("name", "").endswith(expected_suffix),
            f"{path.relative_to(ROOT)} title must end with {expected_suffix}")
    require(header.get("description", "").count("by AllensCreations") == 1,
            f"{path.relative_to(ROOT)} header.description must contain 'by AllensCreations' exactly once")
    return version_tuple


def main() -> None:
    config = load_json(PROJECT / "oneblock.json")
    require(config.get("enabled") is True, "Dirtbound must remain opted into OneBlock variant builds")

    bp_path = BP / "manifest.json"
    rp_path = RP / "manifest.json"
    bp = load_json(bp_path)
    rp = load_json(rp_path)
    bp_version = manifest_version(bp, bp_path)
    rp_version = manifest_version(rp, rp_path)
    require(bp_version == rp_version, "Behavior Pack and Resource Pack versions do not match")

    bp_header = bp["header"]
    rp_header = rp["header"]
    deps = [d for d in bp.get("dependencies", []) if d.get("uuid") == rp_header.get("uuid")]
    require(len(deps) == 1, "Behavior Pack must declare the actual Resource Pack UUID exactly once")
    require(deps[0].get("version") == list(rp_version), "Behavior Pack's Resource Pack dependency version is stale")

    tick_path = BP / "functions/tick.json"
    tick = load_json(tick_path)
    values = tick.get("values")
    require(isinstance(values, list) and "oneblock_tick" in values,
            "functions/tick.json must register oneblock_tick")
    require(values[0] == "void_cleaner",
            "functions/tick.json must run void_cleaner first, before oneblock_tick")
    tick_function_path = BP / "functions/oneblock_tick.mcfunction"
    setup_path = BP / "functions/oneblock_setup.mcfunction"
    require(tick_function_path.is_file(), "registered oneblock_tick.mcfunction is missing")
    require(setup_path.is_file(), "oneblock_setup.mcfunction is missing")
    cleaner_path = BP / "functions/void_cleaner.mcfunction"
    require(cleaner_path.is_file(), "void_cleaner.mcfunction is required for every OneBlock map")
    tick_source = tick_function_path.read_text(encoding="utf-8")
    setup_source = setup_path.read_text(encoding="utf-8")
    cleaner_source = cleaner_path.read_text(encoding="utf-8")
    require("function oneblock_setup" in tick_source, "oneblock_tick must call oneblock_setup")
    require("function void_cleaner" in setup_source,
            "oneblock_setup must invoke the per-player Void Cleaner")
    for expected in (
        "execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air",
        "execute as @a[tag=!void_cleaned] run tp @s 0 1 0",
        "execute as @a[tag=!void_cleaned] run setblock 0 -1 0 bedrock",
        "execute as @a[tag=!void_cleaned] run setblock 0 0 0 minecraft:grass_block",
        "execute as @a[tag=!void_cleaned] run setworldspawn 0 1 0",
        "execute as @a[tag=!void_cleaned] run tellraw @a",
        "tag @a[tag=!void_cleaned] add void_cleaned",
    ):
        require(expected in cleaner_source, f"Void Cleaner is missing required command: {expected}")
    require("setblock 0 -1 0 bedrock" in tick_source, "tick recovery must protect Bedrock at 0 -1 0")
    require("setblock 2 1 0 lectern" not in tick_source, "tick recovery must not create a physical Trader Post")
    require("setblock 0 0 0" not in tick_source, "tick recovery must not compete with Script API core progression")
    require("setworldspawn" not in tick_source, "tick recovery must not reset world spawn every tick")
    require("tp @s" not in tick_source and "tp @s" not in setup_source,
            "Only the requested first-join Void Cleaner may teleport players")
    script_path = BP / "scripts/main.js"
    script = script_path.read_text(encoding="utf-8")
    for expected in ("const ORIGIN={x:0,y:0,z:0};", "const TRADER_POS={x:2,y:1,z:0};",
                     "const BONUS_POS={x:1,y:1,z:0};", "minecraft:grass_block",
                     "initializeCoreIfMissing", "restoreCoreImmediately", "playerBreakBlock.subscribe",
                     "onCoreBreak(p)", "STAGES[stageFor(globalScore"):
        require(expected in script, f"main.js is missing required core coordinate/recovery/progression marker: {expected}")

    foundation_blockers = []
    for mode, template in TEMPLATES.items():
        require(template.is_dir(), f"{mode} reference folder is missing: {template.relative_to(ROOT)}")
        require((template / "level.dat").is_file(),
                f"{mode} reference folder must contain level.dat: {template.relative_to(ROOT)}")
        setup = template / "behavior_packs/void_cleaner/functions/setup_void.mcfunction"
        require(setup.is_file(), f"{mode} reference setup function is missing: {setup.relative_to(ROOT)}")
        setup_source = setup.read_text(encoding="utf-8")
        require("execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air" in setup_source,
                f"{mode} reference has the wrong bounded Void Cleaner command")
        db = template / "db"
        data_files = [p for p in db.iterdir() if p.is_file() and p.name not in
                      {"CURRENT", "LOCK", "LOG", "LOG.old"} and not p.name.startswith("MANIFEST")] if db.is_dir() else []
        if not (db / "CURRENT").is_file() or not data_files:
            message = f"{mode} Mcpeworlds foundation has no complete LevelDB; world generation must remain paused."
            foundation_blockers.append(message)
            print(f"BLOCKER: {message}")
        else:
            print(f"PASS: {mode} Mcpeworlds foundation has LevelDB data.")

    for document_name in ("README.md", "DESCRIPTION.md"):
        document = (PROJECT / document_name).read_text(encoding="utf-8")
        for coordinate in ("0 0 0", "0 -1 0", "0 1 0"):
            require(coordinate in document,
                    f"{document_name} must document Dirtbound's current coordinate {coordinate}")
        for stale_coordinate in ("0 64 0", "0 63 0", "0 65 0", "2 65 0"):
            require(stale_coordinate not in document,
                    f"{document_name} contains obsolete Dirtbound coordinate {stale_coordinate}")

    builder = BUILDER.read_text(encoding="utf-8")
    require("db/CURRENT" in builder and "world_behavior_packs.json" in builder,
            "world builder must preserve LevelDB and verify world pack links")
    require("validate_leveldb" in builder and "DATABASE_CARRIER" not in builder,
            "world builder must require each selected Mcpeworlds foundation's own LevelDB and never borrow another world's database")
    require("SOURCE_WORLDS" in builder and "Mcpeworlds" in builder
            and "SOURCE_ARCHIVES" not in builder and '"Mcpeworlds" / "Creative"' in builder
            and "locate_world_root" in builder,
            "world builder must use the three direct editable template folders with no archive fallback")
    require("expected_cleaner" in builder and "33x33 Y=-64" in builder,
            "world builder must verify the exact bounded Void Cleaner in each generated archive")
    require("Mcpeworlds" in builder,
            "world builder must use the uploaded Mcpeworlds templates")
    require("MODES = (\"Creative\", \"Survival\", \"Hardcore\")" in builder,
            "world builder must retain all three world variants")
    require("def verify_archive(" in builder,
            "world builder must include archive verification")

    print(f"PASS: Dirtbound source validation (v{'.'.join(map(str, bp_version))})")
    print("PASS: matching pack manifests/dependency, Void Cleaner first in tick order, setup, core gated on void_cleaned")
    print("PASS: all three direct Mcpeworlds source folders exist and builder uses mode-specific foundations")
    print("NOTE: static checks do not test Minecraft gameplay.")
    if foundation_blockers:
        print("FAIL: complete mode-specific Mcpeworlds foundations are required before world generation.")
        for blocker in foundation_blockers:
            print(f"- {blocker}")
        raise SystemExit(2)


if __name__ == "__main__":
    main()
