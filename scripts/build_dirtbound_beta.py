#!/usr/bin/env python3
"""Build a complete Dirtbound Kingdom world from the repository OneBlock source archive."""

import json
import shutil
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "Assets" / "Oneblock-assets.mcworld"
PROJECT = ROOT / "MCPEDL" / "maps" / "OneBlock-Dirtbound-Kingdom-Beta"
BP_SOURCE = PROJECT / "behavior_pack"
RP_SOURCE = PROJECT / "resource_pack"
BP_UUID = "8d4d93bf-c8b2-4df4-9f28-52f4f8f08b10"
RP_UUID = "e8d8136a-7a5b-4818-b813-61c21f2e71ad"
VERSION = [0, 1, 3]
WORLD_NAME = "OneBlock Dirtbound Kingdom Beta by AllensCreations (V0.1.3)"
OUTPUT = ROOT / "builds" / "OneBlock-Dirtbound-Kingdom-Beta" / f"{WORLD_NAME}.mcworld"


def safe_extract(source: Path, destination: Path) -> None:
    resolved = destination.resolve()
    with zipfile.ZipFile(source) as archive:
        for entry in archive.infolist():
            target = (destination / entry.filename).resolve()
            if target != resolved and resolved not in target.parents:
                raise ValueError(f"Unsafe path in source world: {entry.filename}")
        archive.extractall(destination)


def rename_level_dat(path: Path, name: str) -> None:
    raw = path.read_bytes()
    prefix = b"\x08\x09\x00LevelName"
    index = raw.find(prefix, 8)
    if index < 0:
        raise ValueError(f"Could not locate LevelName in {path.name}")
    length_at = index + len(prefix)
    old_len = int.from_bytes(raw[length_at:length_at + 2], "little")
    value_at = length_at + 2
    end = value_at + old_len
    encoded = name.encode("utf-8")
    payload = raw[8:length_at] + len(encoded).to_bytes(2, "little") + encoded + raw[end:]
    path.write_bytes(raw[:4] + len(payload).to_bytes(4, "little") + payload)


def build() -> Path:
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Required OneBlock source world is missing: {SOURCE}. Do not substitute another world.")
    required_sources = [
        BP_SOURCE / "manifest.json", BP_SOURCE / "scripts" / "main.js",
        BP_SOURCE / "items" / "trader_ledger.json", RP_SOURCE / "manifest.json",
        RP_SOURCE / "textures" / "item_texture.json", RP_SOURCE / "textures" / "items" / "trader_ledger.png",
    ]
    for path in required_sources:
        if not path.is_file():
            raise FileNotFoundError(f"Required Dirtbound source file is missing: {path}")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="dirtbound-beta-") as temp:
        world_dir = Path(temp) / "world"
        world_dir.mkdir()
        safe_extract(SOURCE, world_dir)
        if not (world_dir / "level.dat").is_file() or not (world_dir / "db").is_dir():
            raise ValueError("The repository OneBlock source archive is incomplete; expected level.dat and db/.")

        for filename in ("level.dat", "level.dat_old"):
            metadata = world_dir / filename
            if metadata.is_file():
                rename_level_dat(metadata, WORLD_NAME)
        (world_dir / "levelname.txt").write_text(WORLD_NAME, encoding="utf-8")

        installed_bp = world_dir / "behavior_packs" / "DirtboundKingdomBP"
        installed_rp = world_dir / "resource_packs" / "DirtboundKingdomRP"
        if installed_bp.exists():
            shutil.rmtree(installed_bp)
        if installed_rp.exists():
            shutil.rmtree(installed_rp)
        shutil.copytree(BP_SOURCE, installed_bp)
        shutil.copytree(RP_SOURCE, installed_rp)

        (world_dir / "world_behavior_packs.json").write_text(
            json.dumps([{"pack_id": BP_UUID, "version": VERSION}], indent=2) + "\n", encoding="utf-8"
        )
        (world_dir / "world_resource_packs.json").write_text(
            json.dumps([{"pack_id": RP_UUID, "version": VERSION}], indent=2) + "\n", encoding="utf-8"
        )

        with zipfile.ZipFile(OUTPUT, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for path in sorted(world_dir.rglob("*")):
                rel = path.relative_to(world_dir).as_posix()
                if path.is_dir():
                    archive.writestr(rel.rstrip("/") + "/", "")
                elif path.is_file():
                    archive.write(path, rel)

    with zipfile.ZipFile(OUTPUT) as archive:
        names = set(archive.namelist())
        required = {
            "level.dat", "levelname.txt", "db/CURRENT", "world_behavior_packs.json", "world_resource_packs.json",
            "behavior_packs/DirtboundKingdomBP/manifest.json",
            "behavior_packs/DirtboundKingdomBP/items/trader_ledger.json",
            "behavior_packs/DirtboundKingdomBP/scripts/main.js",
            "resource_packs/DirtboundKingdomRP/manifest.json",
            "resource_packs/DirtboundKingdomRP/textures/item_texture.json",
            "resource_packs/DirtboundKingdomRP/textures/items/trader_ledger.png",
        }
        missing = required - names
        if missing:
            OUTPUT.unlink(missing_ok=True)
            raise RuntimeError("Incomplete Dirtbound world archive: " + ", ".join(sorted(missing)))
        bp = json.loads(archive.read("world_behavior_packs.json"))
        rp = json.loads(archive.read("world_resource_packs.json"))
        if not any(p.get("pack_id") == BP_UUID and p.get("version") == VERSION for p in bp):
            raise RuntimeError("Behavior Pack is not linked to the world.")
        if not any(p.get("pack_id") == RP_UUID and p.get("version") == VERSION for p in rp):
            raise RuntimeError("Resource Pack is not linked to the world.")
        if not any(n.startswith("db/") and not n.endswith("/") for n in names):
            raise RuntimeError("The generated world has no LevelDB files.")

    print(f"Built from repository source: {SOURCE}")
    print(f"Output: {OUTPUT}")
    print(f"Size: {OUTPUT.stat().st_size} bytes")
    return OUTPUT


if __name__ == "__main__":
    build()
