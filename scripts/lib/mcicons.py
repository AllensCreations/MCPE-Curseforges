"""Minecraft item and block icons, read straight out of the MCicons release file reference/mcicons/mcicons-<ver>.tgz.

The .tgz stays ONE file in the repo (scripts/sync_mcicons.py downloads it); nothing is unpacked to disk.

  icon_image("minecraft:diamond_sword") -> PIL RGBA Image (64x64) or None
  has_icon("minecraft:diamond_sword")   -> bool
Only the Mojang-namespace ids exist there (icon file minecraft_<id>.png); custom ids (aln:...) are the pack's own textures.
Env MCICONS_TGZ points at another .tgz (tests).
"""
import io
import os
import tarfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent.parent
PREFIX = "package/dist/icons/"
_cache = {}


def tgz_path():
    env = os.environ.get("MCICONS_TGZ")
    if env:
        return Path(env)
    found = sorted((ROOT / "reference" / "mcicons").glob("mcicons-*.tgz"))
    return found[-1] if found else None


def _load(path):
    key = str(path)
    if key not in _cache:
        icons = {}
        with tarfile.open(path, mode="r:gz") as tf:
            for m in tf:  # one sequential pass; every PNG is a few KB
                if m.isfile() and m.name.startswith(PREFIX) and m.name.endswith(".png") and "/" not in m.name[len(PREFIX):]:
                    icons[m.name[len(PREFIX):]] = tf.extractfile(m).read()
        _cache[key] = icons
    return _cache[key]


def _icons():
    p = tgz_path()
    return _load(p) if p and p.is_file() else {}


BEDROCK_TO_MCICONS = {
    "noteblock": "note_block",
    "brick_block": "bricks",
    "web": "cobweb",
    "end_bricks": "end_stone_bricks",
    "end_brick_stairs": "end_stone_brick_stairs",
    "netherbrick": "nether_brick",
    "red_nether_brick": "red_nether_bricks",
    "normal_stone_stairs": "stone_stairs",
    "magma": "magma_block",
    "melon_block": "melon",
}


def _file_name(item_id):
    ns, _, name = item_id.rpartition(":")
    if ns not in ("", "minecraft") or not name:
        return None
    mapped = BEDROCK_TO_MCICONS.get(name, name)
    return f"minecraft_{mapped}.png"


def has_icon(item_id: str) -> bool:
    return _file_name(item_id) in _icons()


def icon_image(item_id: str):
    from PIL import Image
    data = _icons().get(_file_name(item_id) or "")
    return Image.open(io.BytesIO(data)).convert("RGBA") if data else None
