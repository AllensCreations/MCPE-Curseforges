#!/usr/bin/env python3
"""Render Beast Biscuit recipe art using CRAFTING_TABLE.svg as the sole board reference.

Vanilla ingredient icons come from Mojang's Bedrock Samples resource pack.
The output icon comes from Monster Companions' own resource pack. The crafting
board, slot, and arrow artwork are rendered directly from assets/CRAFTING_TABLE.svg.
"""
from __future__ import annotations

import json
import os
from pathlib import Path

from PIL import Image
from crafting_template import compose_recipe_diagram

ROOT = Path(__file__).resolve().parents[1]
SAMPLES_ROOT = Path(os.environ.get("BEDROCK_SAMPLES_ROOT", "/root/bedrock-samples"))
VANILLA_TEXTURES = SAMPLES_ROOT / "resource_pack" / "textures" / "items"
ADDON = ROOT / "MCPEDL" / "addons" / "Monster-Companions"
RECIPE_FILE = ADDON / "behavior_pack" / "recipes" / "beast_biscuit.json"
RESULT_TEXTURE = ADDON / "resource_pack" / "textures" / "items" / "beast_biscuit.png"
OUTPUT_FILE = ADDON / "beast_biscuit_recipe.png"

TEXTURES = {
    "minecraft:rotten_flesh": VANILLA_TEXTURES / "rotten_flesh.png",
    "minecraft:bone": VANILLA_TEXTURES / "bone.png",
    "minecraft:sweet_berries": VANILLA_TEXTURES / "sweet_berries.png",
    "minecraft:honey_bottle": VANILLA_TEXTURES / "honey_bottle.png",
}


def load_icon(path: Path, size: tuple[int, int] = (32, 32)) -> Image.Image:
    if not path.is_file():
        raise FileNotFoundError(f"Required texture not found: {path}")
    return Image.open(path).convert("RGBA").resize(size, Image.Resampling.NEAREST)


if not RECIPE_FILE.is_file():
    raise FileNotFoundError(f"Recipe JSON not found: {RECIPE_FILE}")
if not RESULT_TEXTURE.is_file():
    raise FileNotFoundError(f"Add-on result texture not found: {RESULT_TEXTURE}")

recipe_root = json.loads(RECIPE_FILE.read_text(encoding="utf-8"))
recipe_type = "minecraft:recipe_shapeless"
recipe = recipe_root.get(recipe_type)
if not recipe:
    raise ValueError("Expected minecraft:recipe_shapeless in the Beast Biscuit recipe JSON.")

result = recipe.get("result", {})
result_id = result.get("item")
result_count = int(result.get("count", 1))
if result_id != "allenscreations:beast_biscuit":
    raise ValueError(f"Unexpected recipe result: {result_id}")

def ingredient_icon(item_id: str) -> Image.Image:
    if item_id not in TEXTURES:
        raise ValueError(f"No official Bedrock Samples texture mapping for ingredient: {item_id}")
    return load_icon(TEXTURES[item_id])

result_icon = load_icon(RESULT_TEXTURE, (38, 38))
canvas = compose_recipe_diagram(
    recipe_type, recipe, ingredient_icon, result_icon, result_count, scale=2
)

OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
canvas.save(OUTPUT_FILE)
print(f"Generated recipe image directly from CRAFTING_TABLE.svg: {OUTPUT_FILE}")
