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
VERSION = [0, 1, 8]
OUTPUT = OUT_DIR / "OneBlock Dirtbound Kingdom MCAddon Test (v0.1.8).mcaddon"


def read_json(path: Path):
    with path.open(encoding="utf-8") as handle:
        return json.load(handle)


def validate_pack(pack_dir: Path, expected_type: str) -> dict:
    manifest_path = pack_dir / "manifest.json"
    if not manifest_path.is_file():
        raise FileNotFoundError(f"Missing pack manifest: {manifest_path}")
    manifest = read_json(manifest_path)
    header = manifest.get("header", {})
    if header.get("version") != VERSION:
        raise ValueError(f"{manifest_path}: header.version must be {VERSION}")
    if not header.get("name", "").endswith("(v0.1.8)"):
        raise ValueError(f"{manifest_path}: display name must end in (v0.1.8)")
    if header.get("description", "").count("by AllensCreations") != 1:
        raise ValueError(f"{manifest_path}: description must include 'by AllensCreations' exactly once")
    if not any(module.get("type") == expected_type for module in manifest.get("modules", [])):
        raise ValueError(f"{manifest_path}: missing {expected_type} module")
    return manifest


def build() -> Path:
    required = [
        BP / "scripts" / "main.js",
        BP / "items" / "trader_ledger.json",
        RP / "textures" / "item_texture.json",
        RP / "textures" / "items" / "trader_ledger.png",
    ]
    for path in required:
        if not path.is_file():
            raise FileNotFoundError(f"Required add-on test file is missing: {path}")

    bp_manifest = validate_pack(BP, "data")
    rp_manifest = validate_pack(RP, "resources")
    bp_dependencies = bp_manifest.get("dependencies", [])
    if not any(dep.get("uuid") == rp_manifest["header"]["uuid"] and dep.get("version") == VERSION
               for dep in bp_dependencies):
        raise ValueError("Behavior Pack must depend on the matching Resource Pack version.")

    main_js = (BP / "scripts" / "main.js").read_text(encoding="utf-8")
    if r"\nconst SHOPS=" in main_js:
        raise ValueError("main.js still contains a literal \\n before the SHOPS declaration.")

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT.unlink(missing_ok=True)
    with zipfile.ZipFile(OUTPUT, "w", compression=zipfile.ZIP_DEFLATED) as archive:
        for pack_name, pack_dir in (("DirtboundKingdomBP", BP), ("DirtboundKingdomRP", RP)):
            for path in sorted(pack_dir.rglob("*")):
                if not path.is_file():
                    continue
                archive.write(path, (Path(pack_name) / path.relative_to(pack_dir)).as_posix())

    with zipfile.ZipFile(OUTPUT) as archive:
        bad_file = archive.testzip()
        if bad_file:
            raise RuntimeError(f"Corrupt archive member: {bad_file}")
        names = set(archive.namelist())
        required_members = {
            "DirtboundKingdomBP/manifest.json",
            "DirtboundKingdomBP/scripts/main.js",
            "DirtboundKingdomBP/items/trader_ledger.json",
            "DirtboundKingdomRP/manifest.json",
            "DirtboundKingdomRP/textures/item_texture.json",
            "DirtboundKingdomRP/textures/items/trader_ledger.png",
        }
        missing = required_members - names
        if missing:
            raise RuntimeError("MCAddon package is incomplete: " + ", ".join(sorted(missing)))

    print(f"Built MCAddon test package: {OUTPUT}")
    print(f"Package size: {OUTPUT.stat().st_size} bytes")
    print("No .mcworld was generated.")
    return OUTPUT


if __name__ == "__main__":
    build()
