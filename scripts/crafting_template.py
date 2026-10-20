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
