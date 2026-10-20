#!/usr/bin/env python3
"""Generate recipe diagrams and texture previews for Grand Banquets."""
import json, os
from io import BytesIO
from pathlib import Path
import cairosvg
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
ADDON=ROOT/"MCPEDL/addons/Grand-Banquets"
RECIPES=ADDON/"behavior_pack/recipes"
TEXTURES=ADDON/"resource_pack/textures/items/banquet"
OUT=ADDON/"assets/recipes"
SAMPLES=Path(os.environ.get("BEDROCK_SAMPLES_ROOT","/root/bedrock-samples"))/"resource_pack"
OUT.mkdir(parents=True,exist_ok=True)
# Explicit, source-verified texture filenames, following the Monster Companions
# generator's direct item-ID-to-texture mapping approach. Keep each item mapped once.
ALIASES={
"apple_golden":"items/apple_golden.png",
"enchanted_golden_apple":"items/apple_golden.png",
"baked_potato":"items/potato_baked.png",
"cooked_beef":"items/beef_cooked.png",
"cooked_chicken":"items/chicken_cooked.png",
"cooked_cod":"items/fish_cooked.png",
"cooked_mutton":"items/mutton_cooked.png",
"cooked_porkchop":"items/porkchop_cooked.png",
"cooked_rabbit":"items/rabbit_cooked.png",
"cooked_salmon":"items/fish_salmon_cooked.png",
"cocoa_beans":"items/dye_powder_brown.png",
"golden_apple":"items/apple_golden.png",
"golden_carrot":"items/carrot_golden.png",
"lapis_lazuli":"items/dye_powder_blue.png",
"milk_bucket":"items/bucket_milk.png",
"raw_beef":"items/beef_raw.png",
"raw_chicken":"items/chicken.png",
"raw_cod":"items/fish.png",
"raw_mutton":"items/mutton_raw.png",
"raw_porkchop":"items/porkchop_raw.png",
"raw_rabbit":"items/rabbit.png",
"raw_salmon":"items/fish_salmon_raw.png",
"red_mushroom":"blocks/mushroom_red.png",
"brown_mushroom":"blocks/mushroom_brown.png",
"dragon_breath":"items/dragons_breath.png",
"wheat_seeds":"items/seeds_wheat.png",
"totem_of_undying":"items/totem.png",
"bone_meal":"items/dye_powder_white.png",
"nautilus_shell":"items/nautilus.png",
"tropical_fish":"items/clownfish.png",
"pufferfish":"items/fish_pufferfish_raw.png",
"porkchop":"items/porkchop_raw.png",
"cod":"items/fish.png",
"mutton":"items/mutton_raw.png",
"emerald":"items/emerald.png",  # inventory sprite, not a block texture
"emerald_block":"blocks/emerald_block.png",  # only for the Emerald Block ingredient
"pumpkin":"blocks/pumpkin_side.png",  # rendered as a small 3D block icon below
"bowl":"items/bowl.png",
"egg":"items/egg.png",
"bread":"items/bread.png",
"carrot":"items/carrot.png",
"gold_ingot":"items/gold_ingot.png",
"magma_cream":"items/magma_cream.png",
"netherite_scrap":"items/netherite_scrap.png",
"wheat":"items/wheat.png",
"honey_bottle":"items/honey_bottle.png",
"feather":"items/feather.png",
"phantom_membrane":"items/phantom_membrane.png",
"sweet_berries":"items/sweet_berries.png",
"glow_berries":"items/glow_berries.png",
"dried_kelp":"items/dried_kelp.png",
"warped_fungus":"blocks/warped_fungus.png",
"beetroot":"items/beetroot.png",
"blaze_powder":"items/blaze_powder.png",
"nether_wart":"items/nether_wart.png",
"crimson_fungus":"blocks/crimson_fungus.png",
"echo_shard":"items/echo_shard.png",
}

DISPLAY_NAMES = {
    "bacon_and_eggs": "Smoked Bacon & Eggs",
    "braised_ribs": "Braised Forest Ribs",
    "celestial_roast": "Celestial Echo Roast",
    "cheese_bread_pot": "Baked Cheese & Bread Pot",
    "citadel_ham": "Golden Citadel Glazed Ham",
    "dragonlords_galantine": "Dragonlord's Abyssal Galantine",
    "fishermans_platter": "Fisherman's Platter",
    "glazed_ham": "Glazed Ham Tray",
    "glazed_wings": "Glazed Amber Glider Wings",
    "harvest_loaf": "Farmer's Harvest Loaf",
    "highland_venison": "Highland Runner's Venison",
    "honey_berry_tart": "Sunlit Honey Berry Tart",
    "hunters_stew": "Campfire Hunter's Stew",
    "imperial_feast": "Imperial Hero's Crown Feast",
    "kelp_fish_broth": "Savory Kelp & Fish Broth",
    "lumberjacks_ham": "Lumberjack's Spiced Ham",
    "mariners_pot": "Mariner's Deepwater Pot",
    "miners_roast": "Deep Delver's Miners Roast",
    "mushroom_casserole": "Creamy Mushroom Casserole",
    "phoenix_roast": "Phoenix Spiced Roast",
    "potato_loaf": "Rustic Potato Loaf",
    "pumpkin_casserole": "Autumn Pumpkin Casserole",
    "roast_turkey": "Stuffed Roast Turkey",
    "roasted_roots": "Roasted Root Feast",
    "sausage_pan": "Country Pork Sausage Pan",
    "scholars_dumplings": "Lapis Scholar's Dumplings",
    "shepherds_pie": "Hearty Shepherd's Pie",
    "sovereign_platter": "Tide Sovereign's Seafood Platter",
    "strider_gumbo": "Nether Strider's Gumbo",
    "veggie_skillet": "Vegetable Medley Skillet",
    "verdant_ambrosia": "Verdant Sovereign Ambrosia",
    "warlords_steak": "Warlord's Crimson Steak Feast",
}

def font(n):
    p=Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
    return ImageFont.truetype(str(p),n) if p.exists() else ImageFont.load_default()
def isometric_block_icon(side_filename, top_filename=None, right_shade=0.72):
    """Render a crisp isometric inventory icon from verified official block faces."""
    root = SAMPLES / "textures" / "blocks"
    side_path = root / side_filename
    top_path = root / (top_filename or side_filename)
    for path in dict.fromkeys((side_path, top_path)):
        if not path.is_file():
            raise FileNotFoundError(f"Required official Bedrock Samples block texture is missing: {path}")

    icon = Image.new("RGBA", (32, 32), (0, 0, 0, 0))

    def face(texture_path, box, points, shade=1.0):
        x0, y0, x1, y1 = box
        texture = Image.open(texture_path).convert("RGBA").resize(
            (x1 - x0, y1 - y0), Image.Resampling.NEAREST
        )
        if shade != 1.0:
            pixels = texture.load()
            for y in range(texture.height):
                for x in range(texture.width):
                    r, g, b, a = pixels[x, y]
                    pixels[x, y] = (int(r * shade), int(g * shade), int(b * shade), a)
        layer = Image.new("RGBA", (32, 32), (0, 0, 0, 0))
        layer.alpha_composite(texture, (x0, y0))
        mask = Image.new("L", (32, 32), 0)
        ImageDraw.Draw(mask).polygon(points, fill=255)
        from PIL import ImageChops
        layer.putalpha(ImageChops.multiply(layer.getchannel("A"), mask))
        icon.alpha_composite(layer)

    # Three visible faces make block items read like inventory icons, not flat
    # world-texture squares. Use the official top texture when one exists.
    face(top_path, (4, 2, 28, 16), [(16, 2), (28, 9), (16, 16), (4, 9)])
    face(side_path, (4, 9, 17, 30), [(4, 9), (16, 16), (16, 30), (4, 23)])
    face(side_path, (16, 9, 29, 30), [(16, 16), (28, 9), (28, 23), (16, 30)], right_shade)
    return icon


def pumpkin_block_icon():
    """Render Pumpkin as a small cube using official top and side textures."""
    return isometric_block_icon("pumpkin_side.png", "pumpkin_top.png")


def emerald_block_icon():
    """Render Block of Emerald as a cube, not a flat world-face texture."""
    return isometric_block_icon("emerald_block.png", "emerald_block.png", right_shade=0.72)

def vanilla(item):
    short=item.split(":")[-1]
    # Prefer the true inventory sprite for items. When Samples provides only
    # world-face textures for a placeable block, render a 3D inventory-style icon.
    if short == "pumpkin":
        return pumpkin_block_icon()
    if short == "emerald_block":
        return emerald_block_icon()

    mapped=ALIASES.get(short)
    # Emerald uses its actual inventory sprite; never substitute the block icon.
    if mapped:
        path=SAMPLES/"textures"/mapped
        if not path.is_file():
            raise FileNotFoundError(f"Mapped official Bedrock Samples texture is missing for {item}: {path}")
    else:
        path=SAMPLES/"textures"/"items"/(short+".png")
        if not path.is_file():
            raise FileNotFoundError(
                f"No verified inventory-item texture mapping in Bedrock Samples for {item}. "
                "Add an explicit, source-verified ALIASES entry; do not guess a block texture."
            )
    return Image.open(path).convert("RGBA").resize((32,32),Image.Resampling.NEAREST)
def recipe(path):
    d=json.loads(path.read_text(encoding="utf-8"))
    for k in ("minecraft:recipe_shaped","minecraft:recipe_shapeless"):
        if k in d:return k,d[k]
    raise ValueError(f"Unsupported recipe type: {path}")
# The SVG itself is the sole crafting-board reference. Render it directly;
# never read another PNG or board image as a substitute.
BOARD_SVG_PATH = ROOT / "assets/CRAFTING_TABLE.svg"
if not BOARD_SVG_PATH.is_file():
    raise FileNotFoundError(f"Required crafting template SVG is missing: {BOARD_SVG_PATH}")
svg_source = BOARD_SVG_PATH.read_bytes()
BOARD = Image.open(BytesIO(cairosvg.svg2png(bytestring=svg_source, output_width=400))).convert("RGBA")
if BOARD.size != (400, 222):
    raise ValueError(f"Unexpected rendered CRAFTING_TABLE.svg dimensions {BOARD.size}; expected 400x222")

# Crop the slot and arrow artwork from the directly rendered CRAFTING_TABLE.svg template.
# The ingredient slot is reused vertically so every recipe uses one column.
INGREDIENT_SLOT = BOARD.crop((34, 30, 86, 84))
OUTPUT_SLOT = BOARD.crop((306, 80, 370, 146))
ARROW = BOARD.crop((252, 96, 284, 122))

def recipe_ingredients(kind, data, path):
    """Return ingredient IDs in recipe order, counting repeated ingredients."""
    found = []
    if kind == "minecraft:recipe_shaped":
        pattern, key = data.get("pattern", []), data.get("key", {})
        if len(pattern) > 3 or any(len(row) > 3 for row in pattern):
            raise ValueError(f"Pattern exceeds 3x3: {path}")
        for row in pattern:
            for char in row:
                if char == " ":
                    continue
                if char not in key:
                    raise ValueError(f"Pattern character {char!r} has no key entry in {path}")
                ingredient = key[char].get("item")
                if not ingredient:
                    raise ValueError(f"Unsupported ingredient {char!r} in {path}")
                found.append(ingredient)
    else:
        for obj in data.get("ingredients", []):
            ingredient = obj.get("item") if isinstance(obj, dict) else None
            if not ingredient:
                raise ValueError(f"Unsupported shapeless ingredient {obj} in {path}")
            found.append(ingredient)
    # Preserve first-seen order while grouping identical ingredients.
    grouped = []
    for ingredient in found:
        match = next((entry for entry in grouped if entry[0] == ingredient), None)
        if match:
            match[1] += 1
        else:
            grouped.append([ingredient, 1])
    if not grouped:
        raise ValueError(f"Recipe has no supported ingredients: {path}")
    return grouped

def render(path):
    kind, data = recipe(path)
    result = data.get("result", {})
    slug = result.get("item", "").split(":")[-1]
    rp = TEXTURES / (slug + ".png")
    if not rp.is_file():
        raise FileNotFoundError(f"Missing custom result texture: {rp}")
    outicon = Image.open(rp).convert("RGBA").resize((40, 40), Image.Resampling.NEAREST)
    ingredients = recipe_ingredients(kind, data, path)

    # A single vertical ingredient column; the diagram is a guide, not a literal
    # crafting-grid pattern. Its dimensions grow with the ingredient count.
    slot_step = 58
    top = 48
    height = max(204, top + len(ingredients) * slot_step + 26)
    im = Image.new("RGBA", (500, height), (139, 139, 139, 255))
    dr = ImageDraw.Draw(im)
    title = DISPLAY_NAMES.get(slug, slug.replace("_", " ").title())
    dr.text((14, 10), title, font=font(18), fill=(35, 35, 35))

    for index, (ingredient, count) in enumerate(ingredients):
        y = top + index * slot_step
        im.alpha_composite(INGREDIENT_SLOT.resize((50, 52), Image.Resampling.NEAREST), (22, y))
        icon = vanilla(ingredient)
        im.alpha_composite(icon.resize((32, 32), Image.Resampling.NEAREST), (31, y + 10))
        dr.text((82, y + 17), ingredient.split(":")[-1].replace("_", " ").title(),
                font=font(12), fill=(35, 35, 35))
        if count > 1:
            dr.text((82, y + 33), f"Quantity: {count}", font=font(10), fill=(55, 55, 55))

    mid_y = top + (len(ingredients) - 1) * slot_step // 2
    im.alpha_composite(ARROW.resize((46, 26), Image.Resampling.NEAREST), (300, mid_y + 10))
    output_y = max(top, mid_y - 8)
    im.alpha_composite(OUTPUT_SLOT.resize((62, 62), Image.Resampling.NEAREST), (408, output_y))
    im.alpha_composite(outicon, (419, output_y + 11))
    dr.text((402, output_y + 66), f"Output x{result.get('count', 1)}",
            font=font(11), fill=(35, 35, 35))
    dr.text((22, height - 18),
            "Shaped recipe — ingredients listed in one column" if kind == "minecraft:recipe_shaped"
            else "Shapeless recipe — ingredients listed in one column",
            font=font(10), fill=(55, 55, 55))

    output_path = OUT / (slug + "_recipe.png")
    im.save(output_path)
    return slug, outicon, output_path

recipes=sorted(RECIPES.glob("*.json"))
if len(recipes)!=32:raise RuntimeError(f"Expected 32 recipes, found {len(recipes)}")

# Resolve every ingredient before rendering so CI reports all missing mappings in one run.
missing=set()
for path in recipes:
    kind,data=recipe(path)
    if kind=="minecraft:recipe_shaped":
        ingredients=[obj.get("item") for obj in data.get("key",{}).values() if isinstance(obj,dict)]
    else:
        ingredients=[obj.get("item") for obj in data.get("ingredients",[]) if isinstance(obj,dict)]
    for item in ingredients:
        try:
            vanilla(item)
        except FileNotFoundError:
            missing.add(item)
    result=data.get("result",{}).get("item","").split(":")[-1]
    if not (TEXTURES/(result+".png")).is_file():
        missing.add(f"custom result texture: {result}.png")
if missing:
    raise FileNotFoundError(
        "Unresolved recipe assets (checked official Bedrock Samples and add-on textures):\n- "
        + "\n- ".join(sorted(missing))
    )

entries=[render(p) for p in recipes]
# Texture preview sheet
sheet=Image.new("RGBA",(872,64+8*64),(35,35,38,255)); dr=ImageDraw.Draw(sheet)
dr.text((16,10),"Grand Banquets — Custom Food Items",font=font(24),fill="white")
for i,(slug,icon,_) in enumerate(entries):
    x=16+(i%4)*210; y=48+(i//4)*64
    sheet.alpha_composite(icon.resize((48,48),Image.Resampling.NEAREST),(x,y))
    dr.text((x+54,y+15),slug.replace("_"," ").title(),font=font(12),fill="white")
sheet.save(OUT/"item_previews.png")
tiers=[
("tier_1_recipes.png",["potato_loaf","harvest_loaf","roasted_roots","kelp_fish_broth","mushroom_casserole","pumpkin_casserole","cheese_bread_pot","veggie_skillet"]),
("tier_2_recipes.png",["bacon_and_eggs","sausage_pan","hunters_stew","braised_ribs","glazed_ham","glazed_wings","honey_berry_tart","roast_turkey"]),
("tier_3_recipes.png",["miners_roast","mariners_pot","highland_venison","lumberjacks_ham","fishermans_platter","strider_gumbo","scholars_dumplings","warlords_steak"]),
("tier_4_recipes.png",["citadel_ham","sovereign_platter","phoenix_roast","verdant_ambrosia","dragonlords_galantine","celestial_roast","imperial_feast","shepherds_pie"])]
for filename, slugs in tiers:
    selected = [entry for entry in entries if entry[0] in slugs]
    if len(selected) != len(slugs):
        raise RuntimeError(f"Missing recipe for {filename}")
    cards = [(slug, icon, path, Image.open(path).convert("RGBA")) for slug, icon, path in selected]
    tile_height = max(card.height for _, _, _, card in cards)
    board = Image.new("RGBA", (1012, 48 + 4 * tile_height), (139, 139, 139, 255))
    dr = ImageDraw.Draw(board)
    dr.text((16, 8), filename.replace("_", " ").replace(".png", "").title(),
            font=font(22), fill=(35, 35, 35))
    for i, (_, _, _, card) in enumerate(cards):
        x = 6 + (i % 2) * 506
        y = 48 + (i // 2) * tile_height
        board.alpha_composite(card, (x, y))
    board.save(OUT / filename)
print("Generated 32 recipe diagrams, item preview sheet, and four tier sheets.")
