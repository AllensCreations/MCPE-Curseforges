#!/usr/bin/env python3
"""Render Monster Companions' Beast Biscuit recipe from real Bedrock textures.

No AI artwork is used. Vanilla ingredient sprites come from Mojang's bedrock-samples
resource pack; the output sprite comes from this add-on's own resource pack.
"""
from __future__ import annotations

import json
import os
from io import BytesIO
from pathlib import Path
import cairosvg
from PIL import Image, ImageDraw, ImageFont

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


def load_icon(path: Path) -> Image.Image:
    if not path.is_file():
        raise FileNotFoundError(
            f"Required texture not found: {path}\n"
            "Check out Mojang's bedrock-samples repository and confirm the texture path."
        )
    return Image.open(path).convert("RGBA").resize((16, 16), Image.Resampling.NEAREST)


if not RECIPE_FILE.is_file():
    raise FileNotFoundError(f"Recipe JSON not found: {RECIPE_FILE}")
if not RESULT_TEXTURE.is_file():
    raise FileNotFoundError(f"Add-on result texture not found: {RESULT_TEXTURE}")

recipe_root = json.loads(RECIPE_FILE.read_text(encoding="utf-8"))
recipe = recipe_root.get("minecraft:recipe_shapeless")
if not recipe:
    raise ValueError("Expected minecraft:recipe_shapeless in the Beast Biscuit recipe JSON.")

ingredients = []
for entry in recipe.get("ingredients", []):
    item_id = entry.get("item")
    if item_id not in TEXTURES:
        raise ValueError(f"No official Bedrock Samples texture mapping for ingredient: {item_id}")
    ingredients.append((item_id, load_icon(TEXTURES[item_id])))

result = recipe.get("result", {})
result_id = result.get("item")
result_count = int(result.get("count", 1))
if result_id != "allenscreations:beast_biscuit":
    raise ValueError(f"Unexpected recipe result: {result_id}")

result_icon = load_icon(RESULT_TEXTURE)
if len(ingredients) > 9:
    raise ValueError("A 3x3 crafting grid cannot display more than 9 ingredients.")

# Render the sole authorized crafting-board reference directly from its SVG.
# No hand-drawn grid, alternate image, or fallback board is allowed.
BOARD_SVG = ROOT / "assets" / "CRAFTING_TABLE.svg"
if not BOARD_SVG.is_file():
    raise FileNotFoundError(
        f"Required crafting template SVG is missing: {BOARD_SVG}. "
        "No alternative crafting board may be used."
    )
canvas = Image.open(
    BytesIO(cairosvg.svg2png(bytestring=BOARD_SVG.read_bytes(), output_width=400))
).convert("RGBA")
if canvas.size != (400, 222):
    raise ValueError(f"Unexpected CRAFTING_TABLE.svg dimensions: {canvas.size}")

# Ingredient slot coordinates are taken from CRAFTING_TABLE.svg.
slot_x = [35, 90, 146]
slot_y = [32, 90, 145]
for index, (_, icon) in enumerate(ingredients):
    row, col = divmod(index, 3)
    if row >= 3:
        raise ValueError("A 3x3 crafting grid cannot display more than 9 ingredients.")
    icon = icon.resize((32, 32), Image.Resampling.NEAREST)
    x = slot_x[col] + 9
    y = slot_y[row] + 9
    canvas.alpha_composite(icon, (x, y))

# Place the custom result in the SVG's existing output slot.
result_icon = load_icon(RESULT_TEXTURE).resize((40, 40), Image.Resampling.NEAREST)
canvas.alpha_composite(result_icon, (318, 94))
if result_count > 1:
    draw = ImageDraw.Draw(canvas)
    font = ImageFont.load_default()
    count_text = str(result_count)
    draw.text((360 - 6 * len(count_text), 132), count_text, font=font,
              fill=(255, 255, 255, 255), stroke_width=1, stroke_fill=(45, 45, 45, 255))

OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
canvas.resize((800, 444), Image.Resampling.NEAREST).save(OUTPUT_FILE)
print(f"Generated recipe image from Bedrock Samples textures: {OUTPUT_FILE}")
