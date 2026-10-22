#!/usr/bin/env python3
"""Canonical renderer for the sole crafting-board source: scripts/CRAFTING_TABLE.svg.

The board image, every slot position, the output slot, and every board color come
from that SVG. No raster board, screenshot, or alternate GUI is ever accepted as
input. Generated PNGs are outputs only; they are not design references.

Expected SVG ids: slot-0 .. slot-8 (row-major 3x3 groups), slot-N-fill (item area),
output (group), output-fill (item area).
"""
from __future__ import annotations

from dataclasses import dataclass
from functools import lru_cache
from io import BytesIO
from pathlib import Path
import re
import xml.etree.ElementTree as ET

import cairosvg
from PIL import Image

CRAFTING_TABLE_SVG = Path(__file__).resolve().parent / "CRAFTING_TABLE.svg"
NATIVE_SIZE = (400, 222)

SLOT_ICON_SIZE = 32
OUTPUT_ICON_SIZE = 38

Rect = tuple[float, float, float, float]  # x, y, width, height in SVG pixels


@dataclass(frozen=True)
class BoardLayout:
    slots: tuple[Rect, ...]  # nine item areas, row-major
    output: Rect  # output item area


def _read_svg() -> bytes:
    if not CRAFTING_TABLE_SVG.is_file():
        raise FileNotFoundError(
            f"Required sole crafting-board reference is missing: {CRAFTING_TABLE_SVG}. "
            "No alternate image or raster fallback is permitted."
        )
    return CRAFTING_TABLE_SVG.read_bytes()


def _parse_svg(source: bytes) -> ET.Element:
    try:
        return ET.fromstring(source)
    except ET.ParseError as exc:
        raise ValueError(f"Unable to parse the sole crafting-board SVG: {CRAFTING_TABLE_SVG}") from exc


def _translate(element: ET.Element) -> tuple[float, float]:
    match = re.search(
        r"translate\(\s*(-?[0-9.]+)[\s,]+(-?[0-9.]+)\s*\)", element.attrib.get("transform", "")
    )
    return (float(match.group(1)), float(match.group(2))) if match else (0.0, 0.0)


def _fill_rect(group: ET.Element, fill_id: str) -> Rect:
    """Absolute rectangle of the item area `fill_id` inside `group`."""
    gx, gy = _translate(group)
    for child in group.iter():
        if child.attrib.get("id") == fill_id:
            try:
                return (
                    gx + float(child.attrib.get("x", 0)),
                    gy + float(child.attrib.get("y", 0)),
                    float(child.attrib["width"]),
                    float(child.attrib["height"]),
                )
            except (KeyError, ValueError) as exc:
                raise ValueError(f"Element {fill_id!r} in CRAFTING_TABLE.svg needs numeric width and height") from exc
    raise ValueError(f"CRAFTING_TABLE.svg is missing required element id {fill_id!r}")


@lru_cache(maxsize=1)
def load_board_layout() -> BoardLayout:
    """Read slot and output positions directly from the SVG's ids."""
    root = _parse_svg(_read_svg())
    groups = {el.attrib["id"]: el for el in root.iter() if "id" in el.attrib}

    slots = []
    for index in range(9):
        group = groups.get(f"slot-{index}")
        if group is None:
            raise ValueError(f"CRAFTING_TABLE.svg is missing required element id 'slot-{index}'")
        slots.append(_fill_rect(group, f"slot-{index}-fill"))

    output_group = groups.get("output")
    if output_group is None:
        raise ValueError("CRAFTING_TABLE.svg is missing required element id 'output'")
    return BoardLayout(slots=tuple(slots), output=_fill_rect(output_group, "output-fill"))


def render_crafting_table_svg() -> Image.Image:
    """Render the exact source SVG at its native dimensions and return RGBA pixels."""
    source = _read_svg()
    root = _parse_svg(source)

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


def _centered(rect: Rect, size: int) -> tuple[int, int]:
    x, y, w, h = rect
    return round(x + (w - size) / 2), round(y + (h - size) / 2)


def compose_recipe_diagram(recipe_type: str, recipe_data: dict, ingredient_icon, result_icon: Image.Image, output_count: int = 1, scale: int = 1) -> Image.Image:
    """Overlay recipe icons onto the real 3x3 grid in CRAFTING_TABLE.svg.

    Shaped recipes retain their exact pattern positions. Shapeless ingredients
    fill grid cells in row-major order. The SVG-rendered board is never rebuilt,
    and all positions and colors come from the SVG.
    """
    board = render_crafting_table_svg()
    if board.size != NATIVE_SIZE:
        raise ValueError(f"Expected native {NATIVE_SIZE[0]}x{NATIVE_SIZE[1]} crafting SVG, got {board.size}")
    layout = load_board_layout()

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

    for row in range(3):
        for col in range(3):
            item_id = grid[row][col]
            if item_id is None:
                continue
            icon = ingredient_icon(item_id).convert("RGBA").resize(
                (SLOT_ICON_SIZE, SLOT_ICON_SIZE), Image.Resampling.NEAREST
            )
            board.alpha_composite(icon, _centered(layout.slots[row * 3 + col], SLOT_ICON_SIZE))

    result = result_icon.convert("RGBA").resize((OUTPUT_ICON_SIZE, OUTPUT_ICON_SIZE), Image.Resampling.NEAREST)
    board.alpha_composite(result, _centered(layout.output, OUTPUT_ICON_SIZE))

    if output_count > 1:
        try:
            from PIL import ImageDraw, ImageFont

            ox, oy, ow, oh = layout.output
            right, bottom = round(ox + ow) - 2, round(oy + oh) - 4
            left, top = right - 14, bottom - 13
            # Badge background uses the slot color sampled from the SVG render.
            badge_fill = board.getpixel((round(ox) + 1, round(oy) + 1))

            draw = ImageDraw.Draw(board)
            font_path = Path("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf")
            font = ImageFont.truetype(str(font_path), 10) if font_path.is_file() else ImageFont.load_default()
            draw.rectangle((left, top, right, bottom), fill=badge_fill)
            draw.text((left + 2, top), str(output_count), font=font, fill=(255, 255, 255, 255), stroke_width=1, stroke_fill=(35, 35, 35, 255))
        except Exception as exc:
            raise RuntimeError("Unable to render recipe output count") from exc

    if scale != 1:
        board = board.resize((board.width * scale, board.height * scale), Image.Resampling.NEAREST)
    return board
