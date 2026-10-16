import os
import json
import re
from PIL import Image

ROOT_BEDROCK = "/root/bedrock-samples/resource_pack"
OUT_DIR = "MCPEDL/new_addons/Grimoire-Relics-V2/assets/recipes"
os.makedirs(OUT_DIR, exist_ok=True)

def load_jsonc(path):
    with open(path) as f:
        text = f.read()
    text = re.sub(r'//.*', '', text)
    return json.loads(text)

items_meta = load_jsonc(os.path.join(ROOT_BEDROCK, "textures/item_texture.json"))["texture_data"]
blocks_meta = load_jsonc(os.path.join(ROOT_BEDROCK, "textures/terrain_texture.json"))["texture_data"]

INGREDIENT_MAP = {
    "minecraft:book": os.path.join(ROOT_BEDROCK, "textures/items/book_normal.png"),
    "minecraft:blaze_rod": os.path.join(ROOT_BEDROCK, "textures/items/blaze_rod.png"),
    "minecraft:magma_cream": os.path.join(ROOT_BEDROCK, "textures/items/magma_cream.png"),
    "minecraft:prismarine_shard": os.path.join(ROOT_BEDROCK, "textures/items/prismarine_shard.png"),
    "minecraft:nautilus_shell": os.path.join(ROOT_BEDROCK, "textures/items/nautilus.png"),
    "minecraft:feather": os.path.join(ROOT_BEDROCK, "textures/items/feather.png"),
    "minecraft:phantom_membrane": os.path.join(ROOT_BEDROCK, "textures/items/phantom_membrane.png"),
    "minecraft:soul_sand": os.path.join(ROOT_BEDROCK, "textures/blocks/soul_sand.png"),
    "minecraft:wither_skeleton_skull": os.path.join(ROOT_BEDROCK, "textures/items/skull_wither.png"),
    "minecraft:obsidian": os.path.join(ROOT_BEDROCK, "textures/blocks/obsidian.png"),
    "minecraft:iron_block": os.path.join(ROOT_BEDROCK, "textures/blocks/iron_block.png"),
    "minecraft:redstone_block": os.path.join(ROOT_BEDROCK, "textures/blocks/redstone_block.png"),
    "minecraft:fermented_spider_eye": os.path.join(ROOT_BEDROCK, "textures/items/spider_eye_fermented.png"),
    "minecraft:amethyst_shard": os.path.join(ROOT_BEDROCK, "textures/items/amethyst_shard.png"),
    "minecraft:lapis_lazuli": os.path.join(ROOT_BEDROCK, "textures/items/dye_powder_blue.png"),
    "minecraft:sunflower": os.path.join(ROOT_BEDROCK, "textures/blocks/double_plant_sunflower_front.png"),
    "minecraft:gold_ingot": os.path.join(ROOT_BEDROCK, "textures/items/gold_ingot.png"),
    "minecraft:bone_meal": os.path.join(ROOT_BEDROCK, "textures/items/dye_powder_white.png"),
    "minecraft:moss_block": os.path.join(ROOT_BEDROCK, "textures/blocks/moss_block.png"),
    "minecraft:packed_ice": os.path.join(ROOT_BEDROCK, "textures/blocks/ice_packed.png"),
    "minecraft:snowball": os.path.join(ROOT_BEDROCK, "textures/items/snowball.png"),
    "minecraft:copper_ingot": os.path.join(ROOT_BEDROCK, "textures/items/copper_ingot.png"),
    "minecraft:lightning_rod": os.path.join(ROOT_BEDROCK, "textures/blocks/lightning_rod.png"),
    "minecraft:raw_iron": os.path.join(ROOT_BEDROCK, "textures/items/raw_iron.png"),
    "minecraft:glowstone": os.path.join(ROOT_BEDROCK, "textures/blocks/glowstone.png"),
    "minecraft:ender_pearl": os.path.join(ROOT_BEDROCK, "textures/items/ender_pearl.png"),
    "minecraft:chorus_fruit": os.path.join(ROOT_BEDROCK, "textures/items/chorus_fruit.png"),
    "minecraft:carved_pumpkin": os.path.join(ROOT_BEDROCK, "textures/blocks/pumpkin_face_off.png"),
    "minecraft:iron_ingot": os.path.join(ROOT_BEDROCK, "textures/items/iron_ingot.png"),
    "minecraft:spider_eye": os.path.join(ROOT_BEDROCK, "textures/items/spider_eye.png"),
    "minecraft:slime_ball": os.path.join(ROOT_BEDROCK, "textures/items/slimeball.png"),
    "minecraft:glass_bottle": os.path.join(ROOT_BEDROCK, "textures/items/potion_bottle_empty.png"),
    "minecraft:nether_wart": os.path.join(ROOT_BEDROCK, "textures/items/nether_wart.png"),
    "minecraft:golden_apple": os.path.join(ROOT_BEDROCK, "textures/items/apple_golden.png"),
    "minecraft:glistering_melon_slice": os.path.join(ROOT_BEDROCK, "textures/items/melon_speckled.png"),
    "minecraft:lapis_block": os.path.join(ROOT_BEDROCK, "textures/blocks/lapis_block.png"),
    "minecraft:experience_bottle": os.path.join(ROOT_BEDROCK, "textures/items/experience_bottle.png"),
    "minecraft:tinted_glass": os.path.join(ROOT_BEDROCK, "textures/blocks/tinted_glass.png"),
    "minecraft:echo_shard": os.path.join(ROOT_BEDROCK, "textures/items/echo_shard.png"),
    "minecraft:dragon_breath": os.path.join(ROOT_BEDROCK, "textures/items/dragons_breath.png"),
    "minecraft:crying_obsidian": os.path.join(ROOT_BEDROCK, "textures/blocks/crying_obsidian.png")
}

# Crop wither skull head if skull_wither not exists
wither_head_src = os.path.join(ROOT_BEDROCK, "textures/entity/skulls/wither_skeleton.png")
if not os.path.exists(INGREDIENT_MAP["minecraft:wither_skeleton_skull"]):
    if os.path.exists(wither_head_src):
        wim = Image.open(wither_head_src).convert("RGBA")
        head = wim.crop((0, 0, 16, 16))
        head.save(INGREDIENT_MAP["minecraft:wither_skeleton_skull"])

def make_crafting_gui():
    W, H = 126, 68
    bg = Image.new('RGBA', (W, H), (198, 198, 198, 255))
    
    # 3D borders for window
    for x in range(W):
        bg.putpixel((x, 0), (255, 255, 255, 255))
        bg.putpixel((x, 1), (255, 255, 255, 255))
        bg.putpixel((x, H-1), (85, 85, 85, 255))
        bg.putpixel((x, H-2), (85, 85, 85, 255))
    for y in range(H):
        bg.putpixel((0, y), (255, 255, 255, 255))
        bg.putpixel((1, y), (255, 255, 255, 255))
        bg.putpixel((W-1, y), (85, 85, 85, 255))
        bg.putpixel((W-2, y), (85, 85, 85, 255))

    def draw_slot(sx, sy, size=18):
        for x in range(sx, sx + size):
            bg.putpixel((x, sy), (55, 55, 55, 255))
            bg.putpixel((x, sy + size - 1), (255, 255, 255, 255))
        for y in range(sy, sy + size):
            bg.putpixel((sx, y), (55, 55, 55, 255))
            bg.putpixel((sx + size - 1, y), (255, 255, 255, 255))
        for x in range(sx + 1, sx + size - 1):
            for y in range(sy + 1, sy + size - 1):
                bg.putpixel((x, y), (139, 139, 139, 255))

    # 3x3 grid starting at (8, 7)
    for row in range(3):
        for col in range(3):
            draw_slot(8 + col * 18, 7 + row * 18)

    # Arrow
    arrow_pixels = [
        (72, 31), (73, 31), (74, 31), (75, 31), (76, 31), (77, 31), (78, 31), (79, 31),
        (72, 32), (73, 32), (74, 32), (75, 32), (76, 32), (77, 32), (78, 32), (79, 32),
        (72, 33), (73, 33), (74, 33), (75, 33), (76, 33), (77, 33), (78, 33), (79, 33),
        (80, 29), (80, 30), (80, 31), (80, 32), (80, 33), (80, 34), (80, 35),
        (81, 30), (81, 31), (81, 32), (81, 33), (81, 34),
        (82, 31), (82, 32), (82, 33),
        (83, 32)
    ]
    for px, py in arrow_pixels:
        bg.putpixel((px, py), (139, 139, 139, 255))

    draw_slot(96, 23, size=22)
    return bg

def load_texture(path):
    if not os.path.exists(path):
        return None
    im = Image.open(path).convert("RGBA")
    if im.size != (16, 16):
        im = im.resize((16, 16), Image.Resampling.NEAREST)
    return im

RECIPES_DIR = "MCPEDL/new_addons/Grimoire-Relics-V2/behavior_pack/recipes"
RP_TEXTURES = "MCPEDL/new_addons/Grimoire-Relics-V2/resource_pack/textures/items"

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

    # Load output texture
    out_tex_path = os.path.join(RP_TEXTURES, f"{tome_name}.png")
    out_tex = load_texture(out_tex_path)

    canvas = make_crafting_gui()

    # Draw grid items
    for row_idx, row in enumerate(grid_pattern):
        for col_idx, ch in enumerate(row):
            if ch in key_map:
                item_id = key_map[ch]["item"]
                tex_file = INGREDIENT_MAP.get(item_id)
                if tex_file:
                    tex = load_texture(tex_file)
                    if tex:
                        # slot is at (8 + col * 18, 7 + row * 18), 18x18, item is 16x16, offset +1, +1
                        canvas.paste(tex, (8 + col_idx * 18 + 1, 7 + row_idx * 18 + 1), tex)

    # Output slot is at (96, 23), size 22x22, item offset +3, +3
    if out_tex:
        canvas.paste(out_tex, (96 + 3, 23 + 3), out_tex)

    # Scale 4x using NEAREST for crisp pixel art
    scale_factor = 4
    scaled = canvas.resize((canvas.width * scale_factor, canvas.height * scale_factor), Image.Resampling.NEAREST)
    
    out_file = os.path.join(OUT_DIR, f"{tome_name}_recipe.png")
    scaled.save(out_file)
    print(f"Generated: {out_file} ({scaled.size[0]}x{scaled.size[1]}px)")

print("All recipes generated successfully!")
