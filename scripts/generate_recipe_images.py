import os
import json
import re
from pathlib import Path
from PIL import Image
from crafting_template import compose_recipe_diagram

ROOT_BEDROCK = os.path.join(os.environ.get("BEDROCK_SAMPLES_ROOT", "/root/bedrock-samples"), "resource_pack")
OUT_DIR = "MCPEDL/addons/Grimoire-Relics-V2/assets/recipes"
os.makedirs(OUT_DIR, exist_ok=True)

# Item textures directly from bedrock-samples items/ directory
RAW_TEXTURE_MAP = {
    # Items
    "minecraft:book": os.path.join(ROOT_BEDROCK, "textures/items/book_normal.png"),
    "minecraft:blaze_rod": os.path.join(ROOT_BEDROCK, "textures/items/blaze_rod.png"),
    "minecraft:magma_cream": os.path.join(ROOT_BEDROCK, "textures/items/magma_cream.png"),
    "minecraft:prismarine_shard": os.path.join(ROOT_BEDROCK, "textures/items/prismarine_shard.png"),
    "minecraft:nautilus_shell": os.path.join(ROOT_BEDROCK, "textures/items/nautilus.png"),
    "minecraft:feather": os.path.join(ROOT_BEDROCK, "textures/items/feather.png"),
    "minecraft:phantom_membrane": os.path.join(ROOT_BEDROCK, "textures/items/phantom_membrane.png"),
    "minecraft:fermented_spider_eye": os.path.join(ROOT_BEDROCK, "textures/items/spider_eye_fermented.png"),
    "minecraft:amethyst_shard": os.path.join(ROOT_BEDROCK, "textures/items/amethyst_shard.png"),
    "minecraft:lapis_lazuli": os.path.join(ROOT_BEDROCK, "textures/items/dye_powder_blue.png"),
    "minecraft:gold_ingot": os.path.join(ROOT_BEDROCK, "textures/items/gold_ingot.png"),
    "minecraft:bone_meal": os.path.join(ROOT_BEDROCK, "textures/items/dye_powder_white.png"),
    "minecraft:snowball": os.path.join(ROOT_BEDROCK, "textures/items/snowball.png"),
    "minecraft:copper_ingot": os.path.join(ROOT_BEDROCK, "textures/items/copper_ingot.png"),
    "minecraft:raw_iron": os.path.join(ROOT_BEDROCK, "textures/items/raw_iron.png"),
    "minecraft:ender_pearl": os.path.join(ROOT_BEDROCK, "textures/items/ender_pearl.png"),
    "minecraft:chorus_fruit": os.path.join(ROOT_BEDROCK, "textures/items/chorus_fruit.png"),
    "minecraft:iron_ingot": os.path.join(ROOT_BEDROCK, "textures/items/iron_ingot.png"),
    "minecraft:spider_eye": os.path.join(ROOT_BEDROCK, "textures/items/spider_eye.png"),
    "minecraft:slime_ball": os.path.join(ROOT_BEDROCK, "textures/items/slimeball.png"),
    "minecraft:glass_bottle": os.path.join(ROOT_BEDROCK, "textures/items/potion_bottle_empty.png"),
    "minecraft:nether_wart": os.path.join(ROOT_BEDROCK, "textures/items/nether_wart.png"),
    "minecraft:golden_apple": os.path.join(ROOT_BEDROCK, "textures/items/apple_golden.png"),
    "minecraft:glistering_melon_slice": os.path.join(ROOT_BEDROCK, "textures/items/melon_speckled.png"),
    "minecraft:experience_bottle": os.path.join(ROOT_BEDROCK, "textures/items/experience_bottle.png"),
    "minecraft:echo_shard": os.path.join(ROOT_BEDROCK, "textures/items/echo_shard.png"),
    "minecraft:dragon_breath": os.path.join(ROOT_BEDROCK, "textures/items/dragons_breath.png"),
    
    # Blocks to be rendered into crisp 16x16 inventory item icons
    "minecraft:soul_sand": (os.path.join(ROOT_BEDROCK, "textures/blocks/soul_sand.png"), "block_item"),
    "minecraft:obsidian": (os.path.join(ROOT_BEDROCK, "textures/blocks/obsidian.png"), "block_item"),
    "minecraft:iron_block": (os.path.join(ROOT_BEDROCK, "textures/blocks/iron_block.png"), "block_item"),
    "minecraft:redstone_block": (os.path.join(ROOT_BEDROCK, "textures/blocks/redstone_block.png"), "block_item"),
    "minecraft:sunflower": (os.path.join(ROOT_BEDROCK, "textures/blocks/double_plant_sunflower_front.png"), "plant_item"),
    "minecraft:moss_block": (os.path.join(ROOT_BEDROCK, "textures/blocks/moss_block.png"), "block_item"),
    "minecraft:packed_ice": (os.path.join(ROOT_BEDROCK, "textures/blocks/ice_packed.png"), "block_item"),
    "minecraft:lightning_rod": (os.path.join(ROOT_BEDROCK, "textures/blocks/lightning_rod.png"), "plant_item"),
    "minecraft:glowstone": (os.path.join(ROOT_BEDROCK, "textures/blocks/glowstone.png"), "block_item"),
    "minecraft:carved_pumpkin": (os.path.join(ROOT_BEDROCK, "textures/blocks/pumpkin_face_off.png"), "block_item"),
    "minecraft:lapis_block": (os.path.join(ROOT_BEDROCK, "textures/blocks/lapis_block.png"), "block_item"),
    "minecraft:tinted_glass": (os.path.join(ROOT_BEDROCK, "textures/blocks/tinted_glass.png"), "block_item"),
    "minecraft:crying_obsidian": (os.path.join(ROOT_BEDROCK, "textures/blocks/crying_obsidian.png"), "block_item"),
    "minecraft:wither_skeleton_skull": (os.path.join(ROOT_BEDROCK, "textures/entity/skulls/wither_skeleton.png"), "head_item")
}

def make_block_item_icon(face_path):
    if not os.path.isfile(face_path):
        raise FileNotFoundError(f'Required vanilla texture not found: {face_path}')
    face = Image.open(face_path).convert('RGBA').resize((16, 16), Image.Resampling.NEAREST)
    out = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
    scaled = face.resize((12, 12), Image.Resampling.NEAREST)
    out.paste(scaled, (2, 2))
    # 3D shading
    for x in range(2, 14):
        r, g, b, a = out.getpixel((x, 2))
        if a > 0: out.putpixel((x, 2), (min(255, int(r*1.25)), min(255, int(g*1.25)), min(255, int(b*1.25)), a))
        r, g, b, a = out.getpixel((x, 13))
        if a > 0: out.putpixel((x, 13), (int(r*0.65), int(g*0.65), int(b*0.65), a))
    for y in range(2, 14):
        r, g, b, a = out.getpixel((2, y))
        if a > 0: out.putpixel((2, y), (min(255, int(r*1.15)), min(255, int(g*1.15)), min(255, int(b*1.15)), a))
        r, g, b, a = out.getpixel((13, y))
        if a > 0: out.putpixel((13, y), (int(r*0.75), int(g*0.75), int(b*0.75), a))
    return out

def get_ingredient_icon(item_id):
    entry = RAW_TEXTURE_MAP.get(item_id)
    if not entry:
        raise ValueError(f"No verified vanilla texture mapping for recipe ingredient: {item_id}")
    if isinstance(entry, tuple):
        path, kind = entry
        if kind == "block_item":
            return make_block_item_icon(path)
        elif kind == "head_item":
            wim = Image.open(path).convert("RGBA")
            head = wim.crop((0, 0, 16, 16))
            out = Image.new('RGBA', (16, 16), (0, 0, 0, 0))
            out.paste(head.resize((12, 12), Image.Resampling.NEAREST), (2, 2))
            return out
        else: # plant_item
            if not os.path.isfile(path):
                raise FileNotFoundError(f"Required vanilla texture not found: {path}")
            p_im = Image.open(path).convert("RGBA")
            return p_im.resize((16, 16), Image.Resampling.NEAREST)
    else:
        if not os.path.isfile(entry):
            raise FileNotFoundError(f"Required vanilla texture not found: {entry}")
        im = Image.open(entry).convert("RGBA")
        if im.size != (16, 16):
            im = im.resize((16, 16), Image.Resampling.NEAREST)
        return im

def make_crafting_gui():
    """Render the one authorized source, assets/CRAFTING_TABLE.svg."""
    return render_crafting_table_svg()

RECIPES_DIR = "MCPEDL/addons/Grimoire-Relics-V2/behavior_pack/recipes"
RP_TEXTURES = "MCPEDL/addons/Grimoire-Relics-V2/resource_pack/textures/items"

for rf in sorted(os.listdir(RECIPES_DIR)):
    if not rf.endswith(".json"):
        continue
    rpath = os.path.join(RECIPES_DIR, rf)
    with open(rpath) as fp:
        rdata = json.load(fp)["minecraft:recipe_shaped"]
    
    key_map = rdata.get("key", {})
    grid_pattern = rdata.get("pattern", [])
    result_item = rdata.get("result", {}).get("item", "")
    tome_name = result_item.replace("custom:", "")

    out_tex_path = os.path.join(RP_TEXTURES, f"{tome_name}.png")
    out_tex = Image.open(out_tex_path).convert("RGBA").resize((40, 40), Image.Resampling.NEAREST)

    result_count = int(rdata.get("result", {}).get("count", 1))
    canvas = compose_recipe_diagram(
        "minecraft:recipe_shaped",
        rdata,
        get_ingredient_icon,
        out_tex,
        result_count,
        scale=2,
    )
    scaled = canvas
    
    out_file = os.path.join(OUT_DIR, f"{tome_name}_recipe.png")
    scaled.save(out_file)

# Re-create sheet for 14 craftable tomes
files = [
    'tome_abyss_recipe.png', 'tome_zephyr_recipe.png', 'tome_titan_recipe.png',
    'tome_lunar_recipe.png', 'tome_solar_recipe.png', 'tome_druid_recipe.png',
    'tome_frost_recipe.png', 'tome_storm_recipe.png', 'tome_delver_recipe.png',
    'tome_golem_recipe.png', 'tome_hydra_recipe.png', 'tome_alchemist_recipe.png',
    'tome_seraph_recipe.png', 'tome_scholar_recipe.png'
]

cols = 4
rows = 4
img_w, img_h = 800, 444
pad = 12

sheet_w = cols * img_w + (cols + 1) * pad
sheet_h = rows * img_h + (rows + 1) * pad

sheet = Image.new('RGBA', (sheet_w, sheet_h), (35, 35, 38, 255))

for i, fn in enumerate(files):
    r = i // cols
    c = i % cols
    x = pad + c * (img_w + pad)
    y = pad + r * (img_h + pad)
    im = Image.open(os.path.join(OUT_DIR, fn))
    sheet.paste(im, (x, y))

out_path = 'MCPEDL/addons/Grimoire-Relics-V2/assets/all_recipes_sheet.png'
sheet.save(out_path)
print(f'Montage regenerated for {len(files)} craftable recipes: {out_path}')
