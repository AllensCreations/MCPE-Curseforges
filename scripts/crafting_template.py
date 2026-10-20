#!/usr/bin/env python3
"""Canonical renderer for the sole crafting-board source: assets/CRAFTING_TABLE.svg.

No raster board, screenshot, or alternate GUI is ever accepted as input.
Generated PNGs are outputs only; they are not design references.
"""
from __future__ import annotations

from io import BytesIO
from pathlib import Path
import re
import xml.etree.ElementTree as ET

import cairosvg
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
CRAFTING_TABLE_SVG = ROOT / "assets" / "CRAFTING_TABLE.svg"


def render_crafting_table_svg() -> Image.Image:
    """Render the exact source SVG at its native dimensions and return RGBA pixels."""
    if not CRAFTING_TABLE_SVG.is_file():
        raise FileNotFoundError(
            f"Required sole crafting-board reference is missing: {CRAFTING_TABLE_SVG}. "
            "No alternate image or raster fallback is permitted."
        )

    source = CRAFTING_TABLE_SVG.read_bytes()
    try:
        root = ET.fromstring(source)
    except ET.ParseError as exc:
        raise ValueError(f"Unable to parse the sole crafting-board SVG: {CRAFTING_TABLE_SVG}") from exc

    def dimension(value: str) -> float:
        match = re.fullmatch(r"\s*([0-9]+(?:\.[0-9]+)?)(?:px)?\s*", value)
        if not match:
            raise ValueError(
                "CRAFTING_TABLE.svg must declare numeric width and height so its native "
                "proportions can be preserved."
            )
        return float(match.group(1))

    width, height = dimension(root.attrib.get("width", "")), dimension(root.attrib.get("height", ""))
    if width <= 0 or height <= 0:
        raise ValueError(f"Invalid CRAFTING_TABLE.svg dimensions: {width} x {height}")

    expected = (round(width), round(height))
    png = cairosvg.svg2png(
        bytestring=source,
        output_width=expected[0],
        output_height=expected[1],
    )
    image = Image.open(BytesIO(png)).convert("RGBA")
    if image.size != expected:
        raise ValueError(
            f"Rendered CRAFTING_TABLE.svg dimensions {image.size} do not match "
            f"its declared native dimensions {expected}."
        )
    return image


def compose_recipe_diagram(recipe_type: str, recipe_data: dict, ingredient_icon, result_icon: Image.Image, output_count: int = 1, scale: int = 2) -> Image.Image:
    """Overlay recipe icons onto the real 3x3 grid in CRAFTING_TABLE.svg.

    Shaped recipes retain their exact pattern positions. Shapeless ingredients
    fill grid cells in row-major order. The SVG-rendered board is never rebuilt.
    """
    board = render_crafting_table_svg()
    if board.size != (400, 222):
        raise ValueError(f"Expected native 400x222 crafting SVG, got {board.size}")

    grid = [[None for _ in range(3)] for _ in range(3)]
    if recipe_type == "minecraft:recipe_shaped":
        pattern = recipe_data.get("pattern", [])
        key = recipe_data.get("key", {})
        if len(pattern) > 3 or any(len(row) > 3 for row in pattern):
            raise ValueError("Shaped recipe pattern exceeds the 3x3 crafting grid")
        for row, pattern_row in enumerate(pattern):
            for col, symbol in enumerate(pattern_row):
                if symbol == " ":
                    continue
                if symbol not in key or not key[symbol].get("item"):
                    raise ValueError(f"Missing item mapping for shaped recipe symbol {symbol!r}")
                grid[row][col] = key[symbol]["item"]
    elif recipe_type == "minecraft:recipe_shapeless":
        ingredients = recipe_data.get("ingredients", [])
        if len(ingredients) > 9:
            raise ValueError(f"Shapeless recipe has {len(ingredients)} ingredients; crafting grid holds 9")
        for index, entry in enumerate(ingredients):
            item_id = entry.get("item") if isinstance(entry, dict) else None
            if not item_id:
                raise ValueError(f"Unsupported shapeless ingredient entry: {entry!r}")
            grid[index // 3][index % 3] = item_id
    else:
        raise ValueError(f"Unsupported recipe type: {recipe_type}")

    # Centers follow the three rows and columns visibly drawn in the source SVG.
    slot_left = (46, 101, 157)
    slot_top = (43, 98, 153)
    for row in range(3):
        for col in range(3):
            item_id = grid[row][col]
            if item_id is None:
                continue
            icon = ingredient_icon(item_id).convert("RGBA").resize((32, 32), Image.Resampling.NEAREST)
            board.alpha_composite(icon, (slot_left[col], slot_top[row]))

    result = result_icon.convert("RGBA").resize((38, 38), Image.Resampling.NEAREST)
    board.alpha_composite(result, (319, 94))
    if output_count > 1:
        try:
            from PIL import ImageDraw, ImageFont
            draw = ImageDraw.Draw(board)
            font_path = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")
            font = ImageFont.truetype(str(font_path), 10) if font_path.is_file() else ImageFont.load_default()
            label = str(output_count)
            draw.rectangle((355, 128, 369, 141), fill=(139, 139, 139, 255))
            draw.text((357, 128), label, font=font, fill=(255, 255, 255, 255), stroke_width=1, stroke_fill=(35, 35, 35, 255))
        except Exception as exc:
            raise RuntimeError("Unable to render recipe output count") from exc

    if scale != 1:
        board = board.resize((board.width * scale, board.height * scale), Image.Resampling.NEAREST)
    return board
