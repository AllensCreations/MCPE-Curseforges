#!/usr/bin/env python3
"""Package the Dirtbound Kingdom beta as a complete Bedrock .mcworld."""

import json
import shutil
import tempfile
import zipfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "Assets" / "Oneblock-assets.mcworld"
PACK_SOURCE = ROOT / "MCPEDL" / "maps" / "OneBlock-Dirtbound-Kingdom-Beta" / "behavior_pack"
PACK_UUID = "8d4d93bf-c8b2-4df4-9f28-52f4f8f08b10"
PACK_VERSION = [0, 1, 0]
WORLD_NAME = "OneBlock Dirtbound Kingdom Beta v0.1.0"
OUTPUT = ROOT / "builds" / "OneBlock-Dirtbound-Kingdom-Beta" / f"{WORLD_NAME}.mcworld"


def safe_extract(source: Path, destination: Path) -> None:
    resolved = destination.resolve()
    with zipfile.ZipFile(source) as archive:
        for entry in archive.infolist():
            target = (destination / entry.filename).resolve()
            if target != resolved and resolved not in target.parents:
                raise ValueError(f"Unsafe archive path: {entry.filename}")
        archive.extractall(destination)


def rename_level_dat(path: Path, name: str) -> None:
    raw = path.read_bytes()
    prefix = b"\x08\x09\x00LevelName"
    index = raw.find(prefix, 8)
    if index < 0:
        raise ValueError("Could not locate LevelName in level.dat")
    length_at = index + len(prefix)
    old_len = int.from_bytes(raw[length_at:length_at + 2], "little")
    value_at = length_at + 2
    end = value_at + old_len
    encoded = name.encode("utf-8")
    payload = raw[8:length_at] + len(encoded).to_bytes(2, "little") + encoded + raw[end:]
    path.write_bytes(raw[:4] + len(payload).to_bytes(4, "little") + payload)


def build() -> Path:
    if not SOURCE.is_file():
        raise FileNotFoundError(f"Source world not found: {SOURCE}")
    if not (PACK_SOURCE / "manifest.json").is_file() or not (PACK_SOURCE / "scripts" / "main.js").is_file():
        raise FileNotFoundError("Dirtbound behavior pack source is incomplete")

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="dirtbound-beta-") as temp:
        world_dir = Path(temp) / "world"
        world_dir.mkdir()
        safe_extract(SOURCE, world_dir)

        for filename in ("level.dat", "level.dat_old"):
            metadata = world_dir / filename
            if metadata.is_file():
                rename_level_dat(metadata, WORLD_NAME)
        (world_dir / "levelname.txt").write_text(WORLD_NAME, encoding="utf-8")

        installed_pack = world_dir / "behavior_packs" / "DirtboundKingdomBP"
        if installed_pack.exists():
            shutil.rmtree(installed_pack)
        shutil.copytree(PACK_SOURCE, installed_pack)

        (world_dir / "world_behavior_packs.json").write_text(
            json.dumps([{"pack_id": PACK_UUID, "version": PACK_VERSION}], indent=2) + "\n",
            encoding="utf-8",
        )
        if not (world_dir / "world_resource_packs.json").exists():
            (world_dir / "world_resource_packs.json").write_text("[]\n", encoding="utf-8")

        with zipfile.ZipFile(OUTPUT, "w", compression=zipfile.ZIP_DEFLATED) as archive:
            for path in sorted(world_dir.rglob("*")):
                rel = path.relative_to(world_dir).as_posix()
                if path.is_dir():
                    archive.writestr(rel.rstrip("/") + "/", "")
                else:
                    archive.write(path, rel)

    with zipfile.ZipFile(OUTPUT) as archive:
        names = set(archive.namelist())
        required = {
            "level.dat", "levelname.txt", "db/CURRENT", "world_behavior_packs.json",
            "behavior_packs/DirtboundKingdomBP/manifest.json",
            "behavior_packs/DirtboundKingdomBP/scripts/main.js",
        }
        missing = required - names
        if missing:
            OUTPUT.unlink(missing_ok=True)
            raise RuntimeError("Incomplete beta world archive: " + ", ".join(sorted(missing)))
        pack_ref = json.loads(archive.read("world_behavior_packs.json"))
        if not any(item.get("pack_id") == PACK_UUID for item in pack_ref):
            OUTPUT.unlink(missing_ok=True)
            raise RuntimeError("Behavior pack is not linked to the world.")

    print(f"Built: {OUTPUT}")
    print(f"Size: {OUTPUT.stat().st_size} bytes")
    return OUTPUT


if __name__ == "__main__":
    build()
