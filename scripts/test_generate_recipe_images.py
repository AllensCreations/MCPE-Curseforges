#!/usr/bin/env python3
"""Tests for scripts/generate_recipe_images.py (texture lookup, planning, writing, item export).
CairoSVG is stubbed, so this runs anywhere Pillow is installed. Run: python3 scripts/test_generate_recipe_images.py"""
import json
import sys
import tempfile
import types
import unittest
from pathlib import Path

from PIL import Image

sys.path.insert(0, str(Path(__file__).resolve().parent))
import generate_recipe_images as gri  # noqa: E402


def png(path, color=(200, 50, 50, 255), size=(16, 16)):
    path.parent.mkdir(parents=True, exist_ok=True)
    Image.new("RGBA", size, color).save(path)


def wj(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data), encoding="utf-8")


def stub_template():
    mod = types.ModuleType("crafting_template")

    def compose(kind, data, icon_fn, result, count, scale=1):
        entries = data.get("ingredients", []) if kind.endswith("shapeless") else list(data.get("key", {}).values())
        for e in entries:
            icon_fn(e["item"])
        return Image.new("RGBA", (400, 222), (60, 60, 60, 255))

    mod.compose_recipe_diagram = compose
    sys.modules["crafting_template"] = mod


class Base(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.samples = self.root / "samples"
        rp = self.samples / "resource_pack" / "textures"
        for n in ("stick", "iron_ingot", "bone"):
            png(rp / "items" / f"{n}.png")
        png(rp / "blocks" / "obsidian.png")
        png(rp / "blocks" / "pumpkin_side.png")
        png(rp / "blocks" / "pumpkin_top.png")
        png(rp / "items" / "json_only.png")
        wj(rp / "item_texture.json", {"texture_data": {"odd_name": {"textures": "textures/items/json_only"}}})
        self.pack = self.root / "MCPEDL" / "Addons" / "Demo"
        bp, res = self.pack / "behavior_pack", self.pack / "resource_pack" / "textures"
        wj(bp / "recipes" / "helmet.json", {"minecraft:recipe_shaped": {
            "tags": ["crafting_table"], "pattern": ["III", "I I"],
            "key": {"I": {"item": "minecraft:iron_ingot"}}, "result": {"item": "custom:demo_helmet", "count": 1}}})
        wj(bp / "recipes" / "gem.json", {"minecraft:recipe_shapeless": {
            "tags": ["crafting_table"], "ingredients": [{"item": "custom:demo_gem"}, {"item": "minecraft:stick"}],
            "result": {"item": "custom:demo_wand", "count": 2}}})
        wj(bp / "recipes" / "smelt.json", {"minecraft:recipe_furnace": {"input": "x", "output": "y"}})
        wj(bp / "recipes" / "cut.json", {"minecraft:recipe_shaped": {"tags": ["stonecutter"], "pattern": ["I"],
            "key": {"I": {"item": "minecraft:stick"}}, "result": {"item": "custom:demo_helmet"}}})
        wj(bp / "items" / "gem.json", {"minecraft:item": {"description": {"identifier": "custom:demo_gem"},
            "components": {"minecraft:icon": {"textures": {"default": "gem_icon"}}}}})
        wj(res / "item_texture.json", {"texture_data": {"gem_icon": {"textures": "textures/items/gem_file"}}})
        png(res / "items" / "gem_file.png", (10, 200, 10, 255))
        png(res / "items" / "demo_helmet.png", (10, 10, 200, 255))
        png(res / "items" / "demo_wand.png", (200, 10, 200, 255))
        stub_template()

    def tearDown(self):
        self.tmp.cleanup()
        sys.modules.pop("crafting_template", None)

    def plan(self):
        return gri.plan_pack(self.pack, self.samples)


class PlanTests(Base):
    def test_resolves_custom_and_vanilla_and_skips_other_recipes(self):
        jobs, skipped, problems = self.plan()
        self.assertEqual(problems, [])
        self.assertEqual(sorted(j["out"] for j in jobs), ["demo_helmet_recipe.png", "demo_wand_recipe.png"])
        self.assertEqual(sorted(skipped), ["behavior_pack/recipes/cut.json", "behavior_pack/recipes/smelt.json"])
        wand = next(j for j in jobs if j["out"].startswith("demo_wand"))
        self.assertEqual(wand["count"], 2)
        self.assertEqual(wand["icons"]["custom:demo_gem"].getpixel((0, 0)), (10, 200, 10, 255))  # BP icon -> item_texture.json

    def test_every_problem_is_reported_together(self):
        wj(self.pack / "behavior_pack" / "recipes" / "bad1.json", {"minecraft:recipe_shapeless": {
            "tags": ["crafting_table"], "ingredients": [{"item": "minecraft:mystery_thing"}], "result": {"item": "custom:demo_wand"}}})
        wj(self.pack / "behavior_pack" / "recipes" / "bad2.json", {"minecraft:recipe_shapeless": {
            "tags": ["crafting_table"], "ingredients": [{"tag": "minecraft:planks"}], "result": {"item": "custom:demo_wand"}}})
        wj(self.pack / "behavior_pack" / "recipes" / "bad3.json", {"minecraft:recipe_shapeless": {
            "tags": ["crafting_table"], "ingredients": [{"item": "minecraft:stick", "data": 3}], "result": {"item": "custom:demo_wand"}}})
        wj(self.pack / "behavior_pack" / "recipes" / "bad4.json", {"minecraft:recipe_shapeless": {
            "tags": ["crafting_table"], "ingredients": [{"item": "minecraft:stick"}], "result": {"item": "custom:no_texture"}}})
        _, _, problems = self.plan()
        self.assertEqual(len(problems), 4)
        text = "\n".join(problems)
        for needle in ("mystery_thing", "no single item", "data value", "no_texture"):
            self.assertIn(needle, text)

    def test_same_result_twice_gets_distinct_file_names(self):
        wj(self.pack / "behavior_pack" / "recipes" / "helmet_alt.json", json.loads(
            (self.pack / "behavior_pack" / "recipes" / "helmet.json").read_text()))
        jobs, _, problems = self.plan()
        self.assertEqual(problems, [])
        self.assertEqual(len({j["out"] for j in jobs}), 3)

    def test_vanilla_lookup_order(self):
        self.assertEqual(gri.vanilla_icon("minecraft:bone", self.samples).size, (16, 16))   # textures/items/<name>.png
        self.assertEqual(gri.vanilla_icon("minecraft:odd_name", self.samples).size, (16, 16))  # Samples item_texture.json
        with self.assertRaises(gri.Unresolved):
            gri.vanilla_icon("minecraft:never_heard_of_it", self.samples)

    def test_verified_overrides_survive_the_rewrite(self):
        self.assertGreaterEqual(len(gri.VANILLA_OVERRIDES), 80)
        self.assertEqual(gri.VANILLA_OVERRIDES["minecraft:nautilus_shell"][0], "textures/items/nautilus.png")
        self.assertEqual(gri.VANILLA_OVERRIDES["minecraft:obsidian"][1], "block_item")
        self.assertEqual(gri.VANILLA_OVERRIDES["minecraft:pumpkin"][1], "iso_block")

    def test_block_icons(self):
        self.assertEqual(gri.vanilla_icon("minecraft:obsidian", self.samples).size, (16, 16))
        self.assertEqual(gri.vanilla_icon("minecraft:pumpkin", self.samples).size, (32, 32))


class WriteTests(Base):
    def test_main_writes_recipe_images_for_all_packs(self):
        rc = gri.main(["--root", str(self.root), "--samples", str(self.samples)])
        self.assertEqual(rc, 0)
        out = self.pack / "assets" / "recipes"
        self.assertEqual(sorted(p.name for p in out.iterdir()), ["demo_helmet_recipe.png", "demo_wand_recipe.png"])
        with Image.open(out / "demo_helmet_recipe.png") as im:
            self.assertEqual(im.size, (400, 222))
        self.assertFalse((self.pack / "assets" / "all_recipes_sheet.png").exists())

    def test_sheet_only_when_asked_or_already_there(self):
        sheet = self.pack / "assets" / "all_recipes_sheet.png"
        gri.main(["--root", str(self.root), "--samples", str(self.samples)])
        self.assertFalse(sheet.exists())
        gri.main(["--root", str(self.root), "--samples", str(self.samples), "--sheet"])
        self.assertTrue(sheet.exists())
        sheet.write_bytes(b"old")
        gri.main(["--root", str(self.root), "--samples", str(self.samples)])  # exists -> kept up to date
        self.assertGreater(len(sheet.read_bytes()), 100)

    def test_nothing_is_written_when_any_ingredient_is_unresolved(self):
        wj(self.pack / "behavior_pack" / "recipes" / "bad.json", {"minecraft:recipe_shapeless": {
            "tags": ["crafting_table"], "ingredients": [{"item": "minecraft:mystery"}], "result": {"item": "custom:demo_wand"}}})
        rc = gri.main(["--root", str(self.root), "--samples", str(self.samples)])
        self.assertEqual(rc, 1)
        self.assertFalse((self.pack / "assets").exists())

    def test_check_writes_nothing(self):
        self.assertEqual(gri.main(["--root", str(self.root), "--samples", str(self.samples), "--check"]), 0)
        self.assertFalse((self.pack / "assets").exists())

    def test_dedicated_packs_are_skipped_unless_included(self):
        other = self.root / "MCPEDL" / "Addons" / "Grand-Banquets" / "behavior_pack" / "recipes"
        other.mkdir(parents=True)
        names = [p.name for p in gri.find_packs(self.root, None, False)]
        self.assertEqual(names, ["Demo"])
        names = [p.name for p in gri.find_packs(self.root, None, True)]
        self.assertEqual(names, ["Demo", "Grand-Banquets"])

    def test_item_export_is_128_nearest(self):
        written, problems = gri.export_items(self.pack, ["custom:demo_wand", "custom:missing"], self.samples)
        self.assertEqual([w.name for w in written], ["demo_wand.png"])
        self.assertEqual(len(problems), 1)
        with Image.open(written[0]) as im:
            self.assertEqual(im.size, (128, 128))
            self.assertEqual(im.getpixel((100, 100)), (200, 10, 200, 255))


if __name__ == "__main__":
    unittest.main()
