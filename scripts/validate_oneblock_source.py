#!/usr/bin/env python3
"""Static source checks for the Dirtbound OneBlock map.

This validation never generates or modifies .mcworld files. Minecraft gameplay
must be tested separately before the manual world-archive build is approved.
"""
from __future__ import annotations

import json
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / "MCPEDL/maps/OneBlock-Dirtbound-Kingdom-Beta"
BP = PROJECT / "behavior_pack"
RP = PROJECT / "resource_pack"
HTML = ROOT / "CreateWorld/McpeWorld.html"
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
    tick_function_path = BP / "functions/oneblock_tick.mcfunction"
    setup_path = BP / "functions/oneblock_setup.mcfunction"
    require(tick_function_path.is_file(), "registered oneblock_tick.mcfunction is missing")
    require(setup_path.is_file(), "oneblock_setup.mcfunction is missing")
    tick_source = tick_function_path.read_text(encoding="utf-8")
    setup_source = setup_path.read_text(encoding="utf-8")
    require("function oneblock_setup" in tick_source, "oneblock_tick must call oneblock_setup")
    require("setblock 0 63 0 bedrock" in tick_source, "tick recovery must protect Bedrock at 0 63 0")
    require("setblock 2 65 0 barrel" in tick_source, "tick recovery must protect the Trader Post at 2 65 0")
    require("setblock 0 64 0" not in tick_source, "tick recovery must not compete with Script API core progression")
    require("setworldspawn" not in tick_source, "tick recovery must not reset world spawn every tick")
    require("tp @s" not in tick_source and "tp @s" not in setup_source,
            "OneBlock setup/recovery must never teleport players")
    for expected in ("setworldspawn 0 65 0", "setblock 0 63 0 bedrock", "setblock 0 64 0 dirt",
                     "setblock 2 65 0 barrel", "tag @a[tag=!void_cleaned] add void_cleaned"):
        require(expected in setup_source, f"oneblock_setup is missing required setup behavior: {expected}")

    script_path = BP / "scripts/main.js"
    script = script_path.read_text(encoding="utf-8")
    for expected in ("initializeCoreIfMissing", "restoreCoreImmediately", "playerBreakBlock.subscribe",
                     "onCoreBreak(p)", "STAGES[stageFor(globalScore"):
        require(expected in script, f"main.js is missing core recovery/progression marker: {expected}")

    html = HTML.read_text(encoding="utf-8")
    for expected in ("setblock 0 0 0 minecraft:grass_block", "setworldspawn 0 1 0", "void_cleaned"):
        require(expected in html, f"CreateWorld/McpeWorld.html reference is missing: {expected}")

    builder = BUILDER.read_text(encoding="utf-8")
    require("db/CURRENT" in builder and "world_behavior_packs.json" in builder,
            "world builder must preserve LevelDB and verify world pack links")
    require("MODES = (\"Creative\", \"Survival\", \"Hardcore\")" in builder,
            "world builder must retain all three world variants")
    require(re.search(r"def verify_archive\(", builder) is not None,
            "world builder must include archive verification")

    print(f"PASS: Dirtbound source validation (v{'.'.join(map(str, bp_version))})")
    print("PASS: matching pack manifests/dependency, tick registration, one-time setup, no-teleport rule")
    print("PASS: core startup recovery and progression markers, HTML reference, three-variant builder")
    print("NOTE: static checks do not test Minecraft gameplay and do not generate .mcworld files.")


if __name__ == "__main__":
    main()
