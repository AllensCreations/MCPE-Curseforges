#!/usr/bin/env python3
"""Render Beast Biscuit recipe art using CRAFTING_TABLE.svg as the sole board reference.

Vanilla ingredient icons come from Mojang's Bedrock Samples resource pack.
The output icon comes from Monster Companions' own resource pack. The crafting
board, slot, and arrow artwork are rendered directly from assets/CRAFTING_TABLE.svg.
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
BOARD_SVG = ROOT / "assets" / "CRAFTING_TABLE.svg"

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


def font(size: int) -> ImageFont.ImageFont:
    path = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
    return ImageFont.truetype(str(path), size) if path.is_file() else ImageFont.load_default()


if not BOARD_SVG.is_file():
    raise FileNotFoundError(
        f"Required crafting reference is missing: {BOARD_SVG}. "
        "No PNG or alternative board image may be used as a substitute."
    )
if not RECIPE_FILE.is_file():
    raise FileNotFoundError(f"Recipe JSON not found: {RECIPE_FILE}")
if not RESULT_TEXTURE.is_file():
    raise FileNotFoundError(f"Add-on result texture not found: {RESULT_TEXTURE}")

# Render the exact SVG directly in memory. Do not load CRAFTING_TABLE.png or
# any other raster board as a source/reference.
board_bytes = cairosvg.svg2png(
    bytestring=BOARD_SVG.read_bytes(),
    output_width=400,
)
board = Image.open(BytesIO(board_bytes)).convert("RGBA")
if board.size != (400, 222):
    raise ValueError(f"Unexpected CRAFTING_TABLE.svg dimensions after rendering: {board.size}; expected 400x222")

# All GUI artwork is cropped from the SVG render, never redrawn.
ingredient_slot = board.crop((34, 30, 86, 84))
output_slot = board.crop((306, 80, 370, 146))
arrow = board.crop((252, 96, 284, 122))

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
if not ingredients:
    raise ValueError("The Beast Biscuit recipe has no ingredients.")

result_icon = load_icon(RESULT_TEXTURE, (40, 40))

# Keep the user's single-column recipe presentation. Each slot, the arrow, and
# output slot originate from the one authorized SVG; only the diagram canvas and
# text labels are composed around those source-derived elements.
slot_step = 58
top = 42
height = max(204, top + len(ingredients) * slot_step + 30)
canvas = Image.new("RGBA", (500, height), (139, 139, 139, 255))
draw = ImageDraw.Draw(canvas)
draw.text((14, 10), "Beast Biscuit", font=font(18), fill=(35, 35, 35))

for index, (item_id, icon) in enumerate(ingredients):
    y = top + index * slot_step
    canvas.alpha_composite(
        ingredient_slot.resize((50, 52), Image.Resampling.NEAREST),
        (22, y),
    )
    canvas.alpha_composite(icon, (31, y + 10))
    label = item_id.split(":")[-1].replace("_", " ").title()
    draw.text((82, y + 17), label, font=font(12), fill=(35, 35, 35))

mid_y = top + (len(ingredients) - 1) * slot_step // 2
canvas.alpha_composite(arrow.resize((46, 26), Image.Resampling.NEAREST), (300, mid_y + 10))
output_y = max(top, mid_y - 8)
canvas.alpha_composite(output_slot.resize((62, 62), Image.Resampling.NEAREST), (408, output_y))
canvas.alpha_composite(result_icon, (419, output_y + 11))
draw.text((402, output_y + 66), f"Output x{result_count}", font=font(11), fill=(35, 35, 35))
draw.text((22, height - 18), "Shapeless recipe — ingredients listed in one column",
          font=font(10), fill=(55, 55, 55))

OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
canvas.save(OUTPUT_FILE)
print(f"Generated recipe image directly from CRAFTING_TABLE.svg: {OUTPUT_FILE}")
