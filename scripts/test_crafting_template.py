#!/usr/bin/env python3
"""Test for scripts/crafting_template.py and scripts/CRAFTING_TABLE.svg.

Run: python tests/test_crafting_template.py
Writes sample images to tests/output/ (not committed; the workflow uploads them).
"""
from pathlib import Path
import sys

from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "scripts"))
import crafting_template as ct  # noqa: E402

OUT = Path(__file__).resolve().parent / "output"
OUT.mkdir(exist_ok=True)

COLORS = {
    "minecraft:diamond": (80, 220, 230, 255),
    "minecraft:stick": (150, 100, 40, 255),
    "minecraft:iron_ingot": (220, 220, 220, 255),
}
RESULT = (255, 0, 0, 255)


def icon(item_id):
    return Image.new("RGBA", (16, 16), COLORS[item_id])


def center(rect):
    x, y, w, h = rect
    return int(x + w / 2), int(y + h / 2)


def check(condition, message):
    if not condition:
        raise AssertionError(message)
    print(f"PASS  {message}")


# 1. Layout read from the SVG ids
layout = ct.load_board_layout()
check(len(layout.slots) == 9, "SVG defines nine crafting slots")
for i, (x, y, w, h) in enumerate(layout.slots):
    check(0 <= x and 0 <= y and x + w <= 400 and y + h <= 222, f"slot-{i} is inside the 400x222 board")
check(layout.output[0] > max(x + w for x, _, w, _ in layout.slots), "output slot is right of the grid")
for row in range(3):
    ys = {layout.slots[row * 3 + col][1] for col in range(3)}
    check(len(ys) == 1, f"row {row} slots share one top edge")

# 2. Native render
board = ct.render_crafting_table_svg()
check(board.size == (400, 222), "board renders at native 400x222")

# 3. Shaped recipe: icons land in the correct cells and empty cells stay empty
shaped = {
    "pattern": ["DDD", " S ", " S "],
    "key": {"D": {"item": "minecraft:diamond"}, "S": {"item": "minecraft:stick"}},
}
img = ct.compose_recipe_diagram("minecraft:recipe_shaped", shaped, icon, Image.new("RGBA", (16, 16), RESULT), 3)
img.save(OUT / "shaped.png")
expected = {0: "minecraft:diamond", 1: "minecraft:diamond", 2: "minecraft:diamond", 4: "minecraft:stick", 7: "minecraft:stick"}
for index in range(9):
    pixel = img.getpixel(center(layout.slots[index]))
    if index in expected:
        check(pixel == COLORS[expected[index]], f"slot-{index} shows {expected[index]}")
    else:
        check(pixel not in COLORS.values(), f"slot-{index} is empty")
check(img.getpixel((center(layout.output)[0] - 8, center(layout.output)[1] - 8)) == RESULT, "result icon is centered in the output slot")

# 4. Shapeless recipe fills row-major from the first cell
shapeless = {"ingredients": [{"item": "minecraft:iron_ingot"}] * 4}
img = ct.compose_recipe_diagram("minecraft:recipe_shapeless", shapeless, icon, Image.new("RGBA", (16, 16), RESULT), 1)
img.save(OUT / "shapeless.png")
for index in range(9):
    pixel = img.getpixel(center(layout.slots[index]))
    check((pixel == COLORS["minecraft:iron_ingot"]) == (index < 4), f"shapeless slot-{index} {'filled' if index < 4 else 'empty'}")

# 5. Bad input fails clearly
try:
    ct.compose_recipe_diagram("minecraft:recipe_shapeless", {"ingredients": [{"item": "minecraft:diamond"}] * 10}, icon, icon("minecraft:diamond"))
except ValueError:
    print("PASS  more than nine shapeless ingredients is rejected")
else:
    raise AssertionError("ten shapeless ingredients should be rejected")

print("All crafting template checks passed.")
