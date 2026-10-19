#!/usr/bin/env python3
"""Render Monster Companions' Beast Biscuit recipe from real Bedrock textures.

No AI artwork is used. Vanilla ingredient sprites come from Mojang's bedrock-samples
resource pack; the output sprite comes from this add-on's own resource pack.
"""
from __future__ import annotations

import json
import os
from pathlib import Path
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


def draw_slot(draw: ImageDraw.ImageDraw, image: Image.Image, x: int, y: int, size: int = 18) -> None:
    draw.rectangle((x, y, x + size - 1, y + size - 1), fill=(139, 139, 139, 255))
    draw.line((x, y, x + size - 1, y), fill=(55, 55, 55, 255))
    draw.line((x, y, x, y + size - 1), fill=(55, 55, 55, 255))
    draw.line((x, y + size - 1, x + size - 1, y + size - 1), fill=(255, 255, 255, 255))
    draw.line((x + size - 1, y, x + size - 1, y + size - 1), fill=(255, 255, 255, 255))
    image.alpha_composite(icon_cache[current_item], (x + 1, y + 1))


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

# Build a compact Bedrock-style crafting interface. Shapeless ingredients are
# displayed in a simple unordered grid, not as a fixed pattern.
width, height = 126, 68
canvas = Image.new("RGBA", (width, height), (198, 198, 198, 255))
draw = ImageDraw.Draw(canvas)
draw.line((0, 0, width - 1, 0), fill=(255, 255, 255, 255), width=2)
draw.line((0, 0, 0, height - 1), fill=(255, 255, 255, 255), width=2)
draw.line((0, height - 1, width - 1, height - 1), fill=(85, 85, 85, 255), width=2)
draw.line((width - 1, 0, width - 1, height - 1), fill=(85, 85, 85, 255), width=2)

positions = [(8, 7), (26, 7), (8, 25), (26, 25), (44, 7), (44, 25), (8, 43), (26, 43), (44, 43)]
for (item_id, icon), (x, y) in zip(ingredients, positions):
    draw.rectangle((x, y, x + 17, y + 17), fill=(139, 139, 139, 255))
    draw.line((x, y, x + 17, y), fill=(55, 55, 55, 255))
    draw.line((x, y, x, y + 17), fill=(55, 55, 55, 255))
    draw.line((x, y + 17, x + 17, y + 17), fill=(255, 255, 255, 255))
    draw.line((x + 17, y, x + 17, y + 17), fill=(255, 255, 255, 255))
    canvas.alpha_composite(icon, (x + 1, y + 1))

# Pixel-style crafting arrow.
for y in (30, 31, 32):
    draw.line((66, y, 78, y), fill=(125, 125, 125, 255))
draw.line((76, 28, 81, 31), fill=(125, 125, 125, 255), width=2)
draw.line((76, 34, 81, 31), fill=(125, 125, 125, 255), width=2)

# Result slot and item count.
draw.rectangle((94, 23, 115, 44), fill=(139, 139, 139, 255))
draw.line((94, 23, 115, 23), fill=(55, 55, 55, 255))
draw.line((94, 23, 94, 44), fill=(55, 55, 55, 255))
draw.line((94, 44, 115, 44), fill=(255, 255, 255, 255))
draw.line((115, 23, 115, 44), fill=(255, 255, 255, 255))
canvas.alpha_composite(result_icon, (97, 26))
if result_count > 1:
    font = ImageFont.load_default()
    count_text = str(result_count)
    draw.text((109 - 3 * (len(count_text) - 1), 36), count_text, font=font,
              fill=(255, 255, 255, 255), stroke_width=1, stroke_fill=(45, 45, 45, 255))

OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
canvas.resize((504, 272), Image.Resampling.NEAREST).save(OUTPUT_FILE)
print(f"Generated recipe image from Bedrock Samples textures: {OUTPUT_FILE}")
