#!/usr/bin/env python3
"""Generate crafting recipe diagrams for ANY add-on pack (general generator, not tied to one pack).

For every pack under MCPEDL/*/* that has behavior_pack/recipes/*.json, each shaped or shapeless crafting-table
recipe becomes a 400x222 diagram at <pack>/assets/recipes/<result>_recipe.png, drawn on scripts/CRAFTING_TABLE.svg by
scripts/crafting_template.py. The description builder shows that folder automatically.

Textures
  custom items  : the pack's own resource_pack (BP item icon -> item_texture.json, then textures/items/**/<name>.png)
  vanilla items : Mojang Bedrock Samples (env BEDROCK_SAMPLES_ROOT, default /tmp/bedrock-samples), through the verified
                  VANILLA_OVERRIDES table first, then textures/items/<name>.png, then Samples' item_texture.json.
                  Nothing is guessed: an ingredient with no verified texture is reported and nothing is written.
Every problem of every recipe is reported together (INSTRUCTIONS.md 1.5), and nothing is written until all resolve.

Usage
  python3 scripts/generate_recipe_images.py                  all packs (same as --all)
  python3 scripts/generate_recipe_images.py --project MCPEDL/Addons/<pack>
  python3 scripts/generate_recipe_images.py --samples PATH   use another Bedrock Samples folder
  python3 scripts/generate_recipe_images.py --check          resolve everything, write nothing (exit 1 on problems)
  python3 scripts/generate_recipe_images.py --sheet          also write assets/all_recipes_sheet.png (kept up to date
                                                             automatically when that file already exists)
  python3 scripts/generate_recipe_images.py --project MCPEDL/Addons/<pack> --item custom:my_item [--item ...]
                                                             copy item sprites to <pack>/assets/items/ (128x128)
  --include-dedicated   also process packs that still have their own generator script (skipped by default)
"""
from __future__ import annotations

import argparse
import json
import os
import re
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SAMPLES_ROOT = Path(os.environ.get("BEDROCK_SAMPLES_ROOT", "/tmp/bedrock-samples"))
DEDICATED = {"Grand-Banquets", "Monster-Companions"}  # packs with their own generator script
SUPPORTED = ("minecraft:recipe_shaped", "minecraft:recipe_shapeless")
ITEM_SPRITE_SIZE = 128

# Verified vanilla item id -> (path inside Samples resource_pack, kind[, top texture]).
# kinds: item (inventory sprite) | block_item (shaded flat block icon) | plant_item / flat_block (flat sprite)
#        head_item (skull head crop) | iso_block (isometric cube from side + top faces)
VANILLA_OVERRIDES = {
    "minecraft:amethyst_shard": ("textures/items/amethyst_shard.png", "item"),
    "minecraft:apple_golden": ("textures/items/apple_golden.png", "item"),
    "minecraft:baked_potato": ("textures/items/potato_baked.png", "item"),
    "minecraft:beetroot": ("textures/items/beetroot.png", "item"),
    "minecraft:blaze_powder": ("textures/items/blaze_powder.png", "item"),
    "minecraft:blaze_rod": ("textures/items/blaze_rod.png", "item"),
    "minecraft:bone_meal": ("textures/items/dye_powder_white.png", "item"),
    "minecraft:book": ("textures/items/book_normal.png", "item"),
    "minecraft:bowl": ("textures/items/bowl.png", "item"),
    "minecraft:bread": ("textures/items/bread.png", "item"),
    "minecraft:brown_mushroom": ("textures/blocks/mushroom_brown.png", "flat_block"),
    "minecraft:carrot": ("textures/items/carrot.png", "item"),
    "minecraft:carved_pumpkin": ("textures/blocks/pumpkin_face_off.png", "block_item"),
    "minecraft:chorus_fruit": ("textures/items/chorus_fruit.png", "item"),
    "minecraft:cocoa_beans": ("textures/items/dye_powder_brown.png", "item"),
    "minecraft:cod": ("textures/items/fish.png", "item"),
    "minecraft:cooked_beef": ("textures/items/beef_cooked.png", "item"),
    "minecraft:cooked_chicken": ("textures/items/chicken_cooked.png", "item"),
    "minecraft:cooked_cod": ("textures/items/fish_cooked.png", "item"),
    "minecraft:cooked_mutton": ("textures/items/mutton_cooked.png", "item"),
    "minecraft:cooked_porkchop": ("textures/items/porkchop_cooked.png", "item"),
    "minecraft:cooked_rabbit": ("textures/items/rabbit_cooked.png", "item"),
    "minecraft:cooked_salmon": ("textures/items/fish_salmon_cooked.png", "item"),
    "minecraft:copper_ingot": ("textures/items/copper_ingot.png", "item"),
    "minecraft:crimson_fungus": ("textures/blocks/crimson_fungus.png", "flat_block"),
    "minecraft:crying_obsidian": ("textures/blocks/crying_obsidian.png", "block_item"),
    "minecraft:dragon_breath": ("textures/items/dragons_breath.png", "item"),
    "minecraft:dried_kelp": ("textures/items/dried_kelp.png", "item"),
    "minecraft:echo_shard": ("textures/items/echo_shard.png", "item"),
    "minecraft:egg": ("textures/items/egg.png", "item"),
    "minecraft:emerald": ("textures/items/emerald.png", "item"),
    "minecraft:emerald_block": ("textures/blocks/emerald_block.png", "iso_block", "textures/blocks/emerald_block.png"),
    "minecraft:enchanted_golden_apple": ("textures/items/apple_golden.png", "item"),
    "minecraft:ender_pearl": ("textures/items/ender_pearl.png", "item"),
    "minecraft:experience_bottle": ("textures/items/experience_bottle.png", "item"),
    "minecraft:feather": ("textures/items/feather.png", "item"),
    "minecraft:fermented_spider_eye": ("textures/items/spider_eye_fermented.png", "item"),
    "minecraft:glass_bottle": ("textures/items/potion_bottle_empty.png", "item"),
    "minecraft:glistering_melon_slice": ("textures/items/melon_speckled.png", "item"),
    "minecraft:glow_berries": ("textures/items/glow_berries.png", "item"),
    "minecraft:glowstone": ("textures/blocks/glowstone.png", "block_item"),
    "minecraft:gold_ingot": ("textures/items/gold_ingot.png", "item"),
    "minecraft:golden_apple": ("textures/items/apple_golden.png", "item"),
    "minecraft:golden_carrot": ("textures/items/carrot_golden.png", "item"),
    "minecraft:honey_bottle": ("textures/items/honey_bottle.png", "item"),
    "minecraft:iron_block": ("textures/blocks/iron_block.png", "block_item"),
    "minecraft:iron_ingot": ("textures/items/iron_ingot.png", "item"),
    "minecraft:lapis_block": ("textures/blocks/lapis_block.png", "block_item"),
    "minecraft:lapis_lazuli": ("textures/items/dye_powder_blue.png", "item"),
    "minecraft:lightning_rod": ("textures/blocks/lightning_rod.png", "plant_item"),
    "minecraft:magma_cream": ("textures/items/magma_cream.png", "item"),
    "minecraft:milk_bucket": ("textures/items/bucket_milk.png", "item"),
    "minecraft:moss_block": ("textures/blocks/moss_block.png", "block_item"),
    "minecraft:mutton": ("textures/items/mutton_raw.png", "item"),
    "minecraft:nautilus_shell": ("textures/items/nautilus.png", "item"),
    "minecraft:nether_wart": ("textures/items/nether_wart.png", "item"),
    "minecraft:netherite_scrap": ("textures/items/netherite_scrap.png", "item"),
    "minecraft:obsidian": ("textures/blocks/obsidian.png", "block_item"),
    "minecraft:packed_ice": ("textures/blocks/ice_packed.png", "block_item"),
    "minecraft:phantom_membrane": ("textures/items/phantom_membrane.png", "item"),
    "minecraft:porkchop": ("textures/items/porkchop_raw.png", "item"),
    "minecraft:prismarine_shard": ("textures/items/prismarine_shard.png", "item"),
    "minecraft:pufferfish": ("textures/items/fish_pufferfish_raw.png", "item"),
    "minecraft:pumpkin": ("textures/blocks/pumpkin_side.png", "iso_block", "textures/blocks/pumpkin_top.png"),
    "minecraft:raw_beef": ("textures/items/beef_raw.png", "item"),
    "minecraft:raw_chicken": ("textures/items/chicken.png", "item"),
    "minecraft:raw_cod": ("textures/items/fish.png", "item"),
    "minecraft:raw_iron": ("textures/items/raw_iron.png", "item"),
    "minecraft:raw_mutton": ("textures/items/mutton_raw.png", "item"),
    "minecraft:raw_porkchop": ("textures/items/porkchop_raw.png", "item"),
    "minecraft:raw_rabbit": ("textures/items/rabbit.png", "item"),
    "minecraft:raw_salmon": ("textures/items/fish_salmon_raw.png", "item"),
    "minecraft:red_mushroom": ("textures/blocks/mushroom_red.png", "flat_block"),
    "minecraft:redstone_block": ("textures/blocks/redstone_block.png", "block_item"),
    "minecraft:slime_ball": ("textures/items/slimeball.png", "item"),
    "minecraft:snowball": ("textures/items/snowball.png", "item"),
    "minecraft:soul_sand": ("textures/blocks/soul_sand.png", "block_item"),
    "minecraft:spider_eye": ("textures/items/spider_eye.png", "item"),
    "minecraft:sunflower": ("textures/blocks/double_plant_sunflower_front.png", "plant_item"),
    "minecraft:sweet_berries": ("textures/items/sweet_berries.png", "item"),
    "minecraft:tinted_glass": ("textures/blocks/tinted_glass.png", "block_item"),
    "minecraft:totem_of_undying": ("textures/items/totem.png", "item"),
    "minecraft:tropical_fish": ("textures/items/clownfish.png", "item"),
    "minecraft:warped_fungus": ("textures/blocks/warped_fungus.png", "flat_block"),
    "minecraft:wheat": ("textures/items/wheat.png", "item"),
    "minecraft:wheat_seeds": ("textures/items/seeds_wheat.png", "item"),
    "minecraft:wither_skeleton_skull": ("textures/entity/skulls/wither_skeleton.png", "head_item"),}


class Unresolved(Exception):
    pass


# ---------------------------------------------------------------- JSON helpers
def load_json(path: Path):
    text = path.read_text(encoding="utf-8-sig")
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        stripped = "\n".join(l for l in text.splitlines() if not l.lstrip().startswith("//"))
        return json.loads(stripped)


def short(item_id: str) -> str:
    return item_id.split(":")[-1] if item_id.count(":") <= 1 else item_id.split(":")[1]


# ---------------------------------------------------------------- vanilla textures
def _samples_rp(samples_root: Path) -> Path:
    return samples_root / "resource_pack"


def _shade(img: Image.Image, factor: float) -> Image.Image:
    img = img.copy()
    px = img.load()
    for y in range(img.height):
        for x in range(img.width):
            r, g, b, a = px[x, y]
            px[x, y] = (min(255, int(r * factor)), min(255, int(g * factor)), min(255, int(b * factor)), a)
    return img


def make_block_item_icon(face_path: Path) -> Image.Image:
    face = Image.open(face_path).convert("RGBA").resize((16, 16), Image.Resampling.NEAREST)
    out = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
    out.paste(face.resize((12, 12), Image.Resampling.NEAREST), (2, 2))
    for x in range(2, 14):
        r, g, b, a = out.getpixel((x, 2))
        if a > 0:
            out.putpixel((x, 2), (min(255, int(r * 1.25)), min(255, int(g * 1.25)), min(255, int(b * 1.25)), a))
        r, g, b, a = out.getpixel((x, 13))
        if a > 0:
            out.putpixel((x, 13), (int(r * 0.65), int(g * 0.65), int(b * 0.65), a))
    for y in range(2, 14):
        r, g, b, a = out.getpixel((2, y))
        if a > 0:
            out.putpixel((2, y), (min(255, int(r * 1.15)), min(255, int(g * 1.15)), min(255, int(b * 1.15)), a))
        r, g, b, a = out.getpixel((13, y))
        if a > 0:
            out.putpixel((13, y), (int(r * 0.75), int(g * 0.75), int(b * 0.75), a))
    return out


def isometric_block_icon(side_path: Path, top_path: Path, right_shade: float = 0.72) -> Image.Image:
    icon = Image.new("RGBA", (32, 32), (0, 0, 0, 0))

    def face(texture_path, box, points, shade=1.0):
        x0, y0, x1, y1 = box
        tex = Image.open(texture_path).convert("RGBA").resize((x1 - x0, y1 - y0), Image.Resampling.NEAREST)
        if shade != 1.0:
            tex = _shade(tex, shade)
        layer = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
        layer.alpha_composite(tex, (x0, y0))
        mask = Image.new("L", (32, 32), 0)
        ImageDraw.Draw(mask).polygon(points, fill=255)
        layer.putalpha(ImageChops.multiply(layer.getchannel("A"), mask))
        icon.alpha_composite(layer)

    face(top_path, (4, 2, 28, 16), [(16, 2), (28, 9), (16, 16), (4, 9)])
    face(side_path, (4, 9, 17, 30), [(4, 9), (16, 16), (16, 30), (4, 23)])
    face(side_path, (16, 9, 29, 30), [(16, 16), (28, 9), (28, 23), (16, 30)], right_shade)
    return icon


def _texture_from_json(rp: Path, name: str) -> Path | None:
    """item_texture.json: texture_data[name].textures -> <rp>/<path>.png"""
    index = rp / "textures" / "item_texture.json"
    if not index.is_file():
        return None
    entry = load_json(index).get("texture_data", {}).get(name)
    if not entry:
        return None
    tex = entry.get("textures")
    if isinstance(tex, list):
        tex = tex[0] if tex else None
    if isinstance(tex, dict):
        tex = tex.get("path")
    if not isinstance(tex, str):
        return None
    path = rp / (tex if tex.endswith(".png") else tex + ".png")
    return path if path.is_file() else None


def vanilla_icon(item_id: str, samples_root: Path = None) -> Image.Image:
    rp = _samples_rp(samples_root or SAMPLES_ROOT)
    name = short(item_id)
    entry = VANILLA_OVERRIDES.get(f"minecraft:{name}")
    if entry:
        path, kind = rp / entry[0], entry[1]
        if not path.is_file():
            raise Unresolved(f"{item_id}: mapped Samples texture is missing: {path}")
        if kind == "block_item":
            return make_block_item_icon(path)
        if kind == "iso_block":
            top = rp / entry[2]
            if not top.is_file():
                raise Unresolved(f"{item_id}: Samples top texture is missing: {top}")
            return isometric_block_icon(path, top)
        if kind == "head_item":
            head = Image.open(path).convert("RGBA").crop((0, 0, 16, 16))
            out = Image.new("RGBA", (16, 16), (0, 0, 0, 0))
            out.paste(head.resize((12, 12), Image.Resampling.NEAREST), (2, 2))
            return out
        im = Image.open(path).convert("RGBA")  # item, plant_item, flat_block
        return im if im.size == (16, 16) else im.resize((16, 16), Image.Resampling.NEAREST)
    direct = rp / "textures" / "items" / f"{name}.png"
    if direct.is_file():
        return Image.open(direct).convert("RGBA")
    indexed = _texture_from_json(rp, name)
    if indexed:
        return Image.open(indexed).convert("RGBA")
    raise Unresolved(f"{item_id}: no verified vanilla texture. Add it to VANILLA_OVERRIDES after checking Samples "
                     "(never guess a block texture).")


# ---------------------------------------------------------------- custom textures (the pack's own files)
def custom_texture_path(pack: Path, item_id: str) -> Path | None:
    rp = pack / "resource_pack"
    name = short(item_id)
    icon_name = None
    items_dir = pack / "behavior_pack" / "items"
    if items_dir.is_dir():
        for f in sorted(items_dir.rglob("*.json")):
            try:
                data = load_json(f).get("minecraft:item", {})
            except (json.JSONDecodeError, OSError):
                continue
            if data.get("description", {}).get("identifier") != item_id:
                continue
            icon = data.get("components", {}).get("minecraft:icon")
            if isinstance(icon, str):
                icon_name = icon
            elif isinstance(icon, dict):
                tex = icon.get("texture") or (icon.get("textures") or {}).get("default")
                icon_name = tex if isinstance(tex, str) else None
            break
    for candidate in (icon_name, name):
        if candidate:
            found = _texture_from_json(rp, candidate)
            if found:
                return found
    hits = sorted((rp / "textures" / "items").rglob(f"{name}.png")) if (rp / "textures" / "items").is_dir() else []
    return hits[0] if hits else None


def icon_for(pack: Path, item_id: str, samples_root: Path = None) -> Image.Image:
    if item_id.startswith("minecraft:") or ":" not in item_id:
        return vanilla_icon(item_id, samples_root)
    path = custom_texture_path(pack, item_id)
    if not path:
        raise Unresolved(f"{item_id}: no texture found in the pack's resource_pack (checked the BP item icon, "
                         "item_texture.json and textures/items/**).")
    return Image.open(path).convert("RGBA")


# ---------------------------------------------------------------- recipes
def recipe_files(pack: Path) -> list[Path]:
    d = pack / "behavior_pack" / "recipes"
    return sorted(d.rglob("*.json")) if d.is_dir() else []


def parse_recipe(path: Path):
    """-> (type, data) for a crafting-table recipe, or None when it is another kind of recipe."""
    doc = load_json(path)
    for kind in SUPPORTED:
        if kind in doc:
            data = doc[kind]
            tags = data.get("tags")
            if tags is not None and "crafting_table" not in tags:
                return None
            return kind, data
    return None


def result_of(data: dict) -> tuple[str, int]:
    res = data.get("result")
    if isinstance(res, str):
        return res, 1
    if isinstance(res, dict) and res.get("item"):
        return res["item"], int(res.get("count", 1))
    raise Unresolved("recipe has no usable result item")


def ingredient_entries(kind: str, data: dict):
    if kind == "minecraft:recipe_shaped":
        used = {c for row in data.get("pattern", []) for c in row if c != " "}
        return [data.get("key", {}).get(c) for c in sorted(used)]
    return list(data.get("ingredients", []))


def plan_pack(pack: Path, samples_root: Path = None):
    """Resolve every recipe of a pack. -> (jobs, skipped, problems). Nothing is written here."""
    jobs, skipped, problems = [], [], []
    names_used = {}
    for f in recipe_files(pack):
        label = f.relative_to(pack).as_posix()
        try:
            parsed = parse_recipe(f)
        except (json.JSONDecodeError, OSError) as exc:
            problems.append(f"{label}: cannot read recipe ({exc})")
            continue
        if parsed is None:
            skipped.append(label)
            continue
        kind, data = parsed
        try:
            result_id, count = result_of(data)
            for entry in ingredient_entries(kind, data):
                if not isinstance(entry, dict) or not entry.get("item"):
                    raise Unresolved(f"ingredient {entry!r} has no single item (tag or missing key); add an explicit item")
                if entry.get("data") not in (None, 0):
                    raise Unresolved(f"{entry['item']} uses data value {entry['data']}; one icon cannot show it")
            ingredients = {e["item"] for e in ingredient_entries(kind, data)}
            icons = {i: icon_for(pack, i, samples_root) for i in sorted(ingredients)}
            result_icon = icon_for(pack, result_id, samples_root)
        except Unresolved as exc:
            problems.append(f"{label}: {exc}")
            continue
        slug = short(result_id)
        out_name = f"{slug}_recipe.png"
        if out_name in names_used:
            out_name = f"{slug}_{f.stem}_recipe.png"
        names_used[out_name] = f
        jobs.append(dict(file=f, kind=kind, data=data, count=count, icons=icons, result=result_icon, out=out_name))
    return jobs, skipped, problems


def write_pack(pack: Path, jobs: list, with_sheet: bool):
    from crafting_template import compose_recipe_diagram  # needs CairoSVG; imported only when writing
    out_dir = pack / "assets" / "recipes"
    out_dir.mkdir(parents=True, exist_ok=True)
    written = []
    for job in jobs:
        icons = job["icons"]
        diagram = compose_recipe_diagram(job["kind"], job["data"], lambda i, _m=icons: _m[i], job["result"], job["count"], scale=1)
        target = out_dir / job["out"]
        diagram.save(target)
        written.append(target)
    sheet = pack / "assets" / "all_recipes_sheet.png"
    if written and (with_sheet or sheet.is_file()):
        pad, w, h = 8, 400, 222
        canvas = Image.new("RGBA", (w + 2 * pad, len(written) * h + (len(written) + 1) * pad), (35, 35, 38, 255))
        for i, p in enumerate(sorted(written)):
            with Image.open(p) as frame:
                canvas.paste(frame, (pad, pad + i * (h + pad)))
        canvas.save(sheet)
        written.append(sheet)
    return written


def export_items(pack: Path, item_ids: list[str], samples_root: Path = None):
    """Copy item sprites to <pack>/assets/items/<name>.png, nearest-neighbor ITEM_SPRITE_SIZE square."""
    out_dir = pack / "assets" / "items"
    problems, written = [], []
    for item_id in item_ids:
        try:
            icon = icon_for(pack, item_id, samples_root)
        except Unresolved as exc:
            problems.append(str(exc))
            continue
        out_dir.mkdir(parents=True, exist_ok=True)
        target = out_dir / f"{short(item_id)}.png"
        icon.resize((ITEM_SPRITE_SIZE, ITEM_SPRITE_SIZE), Image.Resampling.NEAREST).save(target)
        written.append(target)
    return written, problems


def find_packs(root: Path, project: str | None, include_dedicated: bool):
    if project:
        p = Path(project)
        p = p if p.is_absolute() else root / p
        return [p] if p.is_dir() else []
    packs = sorted({d.parent.parent for d in root.glob("MCPEDL/*/*/behavior_pack/recipes") if d.is_dir()})
    return [p for p in packs if include_dedicated or p.name not in DEDICATED]


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--all", action="store_true", help="every pack under MCPEDL/*/* (default when no --project)")
    ap.add_argument("--project", help="one pack folder, e.g. MCPEDL/Addons/Mining-Helmet")
    ap.add_argument("--check", action="store_true", help="resolve everything and write nothing")
    ap.add_argument("--sheet", action="store_true", help="also write assets/all_recipes_sheet.png")
    ap.add_argument("--item", action="append", default=[], metavar="ID", help="export this custom item's sprite (repeatable)")
    ap.add_argument("--include-dedicated", action="store_true", help="also process packs with their own generator")
    ap.add_argument("--root", default=str(ROOT), help="repo root")
    ap.add_argument("--samples", help="Bedrock Samples folder (default: env BEDROCK_SAMPLES_ROOT or /tmp/bedrock-samples)")
    a = ap.parse_args(argv)
    root = Path(a.root)
    samples = Path(a.samples) if a.samples else None
    if a.item and not a.project:
        ap.error("--item needs --project")
    packs = find_packs(root, a.project, a.include_dedicated)
    if not packs:
        print("No packs with recipes found.")
        return 0 if not a.project else 1
    bad = 0
    for pack in packs:
        if a.item:
            written, problems = export_items(pack, a.item, samples)
            for p in problems:
                print(f"FAIL {pack.name}: {p}")
            for w in written:
                print(f"item   {w.relative_to(root)}")
            bad += len(problems)
        jobs, skipped, problems = plan_pack(pack, samples)
        for p in problems:
            print(f"FAIL {pack.name}: {p}")
        bad += len(problems)
        if problems:
            print(f"{pack.name}: nothing written ({len(problems)} problem(s) above).")
            continue
        if a.check:
            print(f"ok     {pack.name}: {len(jobs)} recipe(s) resolve" + (f", {len(skipped)} skipped" if skipped else ""))
            continue
        written = write_pack(pack, jobs, a.sheet) if jobs else []
        print(f"{pack.name}: {len(jobs)} recipe image(s)" + (f", {len(skipped)} other recipe(s) skipped" if skipped else ""))
        for w in written:
            print(f"  wrote {w.relative_to(root)}")
    print("Done." if not bad else f"{bad} problem(s). See FAIL lines.")
    return 1 if bad else 0


if __name__ == "__main__":
    sys.exit(main())
