#!/usr/bin/env python3
"""Package Dirtbound Kingdom's behavior/resource packs as an MCAddon test build.

This script intentionally does not create or modify a .mcworld.
"""
import json
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
PROJECT = ROOT / "MCPEDL" / "maps" / "OneBlock-Dirtbound-Kingdom-Beta"
BP = PROJECT / "behavior_pack"
RP = PROJECT / "resource_pack"
OUT_DIR = ROOT / "builds" / "OneBlock-Dirtbound-Kingdom-Beta"
VERSION = None
OUTPUT = None


def read_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def validate_pack(pack_dir: Path, expected_type: str) -> dict:
    manifest_path = pack_dir / "manifest.json"
    if not manifest_path.is_file():
        raise FileNotFoundError(f"Missing pack manifest: {manifest_path}")
    manifest = read_json(manifest_path)
    header = manifest.get("header", {})
    version = header.get("version")
    if not isinstance(version, list) or len(version) != 3:
        raise ValueError(f"{manifest_path}: header.version must be a three-part version")
    expected_title_suffix = "(v" + ".".join(str(part) for part in version) + ")"
    if not header.get("name", "").endswith(expected_title_suffix):
        raise ValueError(f"{manifest_path}: display name must end in {expected_title_suffix}")
    if header.get("description", "").count("by AllensCreations") != 1:
        raise ValueError(f"{manifest_path}: description must include 'by AllensCreations' exactly once")
    if not any(module.get("type") == expected_type for module in manifest.get("modules", [])):
        raise ValueError(f"{manifest_path}: missing {expected_type} module")
    return manifest


def build() -> Path:
    required = [
        BP / "scripts" / "main.js",
        BP / "items" / "trader_ledger.json",
        BP / "functions" / "tick.json",
        BP / "functions" / "oneblock_tick.mcfunction",
        BP / "functions" / "give_trader.mcfunction",
        RP / "textures" / "item_texture.json",
        RP / "textures" / "items" / "trader_ledger.png",
    ]
    for path in required:
        if not path.is_file():
            raise FileNotFoundError(f"Required add-on test file is missing: {path}")

    bp_manifest = validate_pack(BP, "data")
    rp_manifest = validate_pack(RP, "resources")
    version = bp_manifest["header"]["version"]
    if rp_manifest["header"]["version"] != version:
        raise ValueError("Behavior Pack and Resource Pack versions do not match.")
    version_text = ".".join(str(part) for part in version)
    output = OUT_DIR / f"OneBlock Dirtbound Kingdom MCAddon Test (v{version_text}).mcaddon"
    bp_dependencies = bp_manifest.get("dependencies", [])
    if not any(dep.get("uuid") == rp_manifest["header"]["uuid"] and dep.get("version") == version
               for dep in bp_dependencies):
        raise ValueError("Behavior Pack must depend on the matching Resource Pack version.")

    tick_config = read_json(BP / "functions" / "tick.json")
    if "oneblock_tick" not in tick_config.get("values", []):
        raise ValueError("tick.json must schedule oneblock_tick.")
    tick_function = (BP / "functions" / "oneblock_tick.mcfunction").read_text(encoding="utf-8")
    if "execute if block 0 64 0 air run setblock 0 64 0 dirt" not in tick_function:
        raise ValueError("OneBlock tick function must restore Dirt only when the center is air.")
    give_function = (BP / "functions" / "give_trader.mcfunction").read_text(encoding="utf-8")
    if "give @s allenscreations:trader_ledger 1" not in give_function:
        raise ValueError("give_trader function must give the custom Trader item.")
    main_js = (BP / "scripts" / "main.js").read_text(encoding="utf-8")
    if r"\nconst SHOPS=" in main_js:
        raise ValueError("main.js still contains a literal \\n before the SHOPS declaration.")
    if "maintain()" in main_js or "setblock" in main_js or "GameMode" in main_js:
        raise ValueError("Block generation and game-mode handling must stay outside main.js.")
    if "function initialize(p)" not in main_js:
        raise ValueError("main.js must initialize player economy scores.")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    output.unlink(missing_ok=True)
    with zipfile.ZipFile(output, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for pack_name, pack_dir in (("DirtboundKingdomBP", BP), ("DirtboundKingdomRP", RP)):
            for path in sorted(pack_dir.rglob("*")):
                if not path.is_file():
                    continue
                archive.write(path, (Path(pack_name) / path.relative_to(pack_dir)).as_posix())

    with zipfile.ZipFile(output) as archive:
        bad_file = archive.testzip()
        if bad_file:
            raise RuntimeError(f"Corrupt archive member: {bad_file}")
        names = set(archive.namelist())
        required_members = {
            "DirtboundKingdomBP/manifest.json",
            "DirtboundKingdomBP/scripts/main.js",
            "DirtboundKingdomBP/items/trader_ledger.json",
            "DirtboundKingdomBP/functions/tick.json",
            "DirtboundKingdomBP/functions/oneblock_tick.mcfunction",
            "DirtboundKingdomBP/functions/give_trader.mcfunction",
            "DirtboundKingdomRP/manifest.json",
            "DirtboundKingdomRP/textures/item_texture.json",
            "DirtboundKingdomRP/textures/items/trader_ledger.png",
        }
        missing = required_members - names
        if missing:
            raise RuntimeError("MCAddon package is incomplete: " + ", ".join(sorted(missing)))

    print(f"Built MCAddon test package: {output}")
    print(f"Package size: {output.stat().st_size} bytes")
    print("No .mcworld was generated.")
    return output


if __name__ == "__main__":
    build()
