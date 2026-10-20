#!/usr/bin/env python3
"""Generate recipe diagrams and texture previews for Grand Banquets."""
import json, os
from pathlib import Path
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
"pumpkin":"blocks/pumpkin_side.png",
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
"emerald_block":"blocks/emerald_block.png",
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
def vanilla(item):
    short=item.split(":")[-1]
    mapped=ALIASES.get(short)
    candidates=[SAMPLES/"textures"/mapped] if mapped else [
        SAMPLES/"textures"/"items"/(short+".png"),
        SAMPLES/"textures"/"blocks"/(short+".png"),
    ]
    for path in candidates:
        if path.is_file():
            return Image.open(path).convert("RGBA").resize((32,32),Image.Resampling.NEAREST)
    raise FileNotFoundError(f"No verified Bedrock Samples texture mapping/file for ingredient {item}")
def recipe(path):
    d=json.loads(path.read_text(encoding="utf-8"))
    for k in ("minecraft:recipe_shaped","minecraft:recipe_shapeless"):
        if k in d:return k,d[k]
    raise ValueError(f"Unsupported recipe type: {path}")
def render(path):
    kind,r=recipe(path); result=r.get("result",{}); slug=result.get("item","").split(":")[-1]
    rp=TEXTURES/(slug+".png")
    if not rp.is_file():raise FileNotFoundError(f"Missing custom result texture: {rp}")
    outicon=Image.open(rp).convert("RGBA").resize((32,32),Image.Resampling.NEAREST)
    im=Image.new("RGBA",(500,204),(42,42,46,255)); dr=ImageDraw.Draw(im)
    dr.text((14,8),DISPLAY_NAMES.get(slug,slug.replace("_"," ").title()),font=font(18),fill="white")
    sx,sy,slot=18,42,48
    for y in range(3):
        for x in range(3):
            px,py=sx+x*53,sy+y*53
            dr.rectangle((px,py,px+slot,py+slot),fill=(128,128,128),outline=(230,230,230),width=2)
    if kind=="minecraft:recipe_shaped":
        pattern,key=r.get("pattern",[]),r.get("key",{})
        if len(pattern)>3 or any(len(row)>3 for row in pattern):raise ValueError(f"Pattern exceeds 3x3: {path}")
        for y,row in enumerate(pattern):
            for x,ch in enumerate(row):
                if ch==" " or ch not in key:continue
                ing=key[ch].get("item")
                if not ing:raise ValueError(f"Unsupported ingredient {ch} in {path}")
                im.alpha_composite(vanilla(ing),(sx+x*53+8,sy+y*53+8))
    else:
        ingredients=r.get("ingredients",[])
        if len(ingredients)>9:raise ValueError(f"More than 9 shapeless ingredients: {path}")
        for i,obj in enumerate(ingredients):
            ing=obj.get("item") if isinstance(obj,dict) else None
            if not ing:raise ValueError(f"Unsupported shapeless ingredient {obj} in {path}")
            y,x=divmod(i,3); im.alpha_composite(vanilla(ing),(sx+x*53+8,sy+y*53+8))
    dr.text((375,92),"→",font=font(32),fill="white")
    dr.rectangle((426,82,490,146),fill=(128,128,128),outline=(230,230,230),width=2)
    im.alpha_composite(outicon,(442,98))
    dr.text((433,151),f"Output x{result.get('count',1)}",font=font(12),fill="white")
    dr.text((18,190),"Shaped" if kind=="minecraft:recipe_shaped" else "Shapeless",font=font(11),fill=(220,220,220))
    p=OUT/(slug+"_recipe.png"); im.resize((1000,408),Image.Resampling.NEAREST).save(p)
    return slug,outicon,p
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
for filename,slugs in tiers:
    selected=[e for e in entries if e[0] in slugs]
    if len(selected)!=len(slugs):raise RuntimeError(f"Missing recipe for {filename}")
    board=Image.new("RGBA",(1012,4*204+64),(35,35,38,255)); dr=ImageDraw.Draw(board)
    dr.text((16,8),filename.replace("_"," ").replace(".png","").title(),font=font(22),fill="white")
    for i,(_,_,p) in enumerate(selected):
        card=Image.open(p).convert("RGBA").resize((500,204),Image.Resampling.NEAREST)
        board.alpha_composite(card,(6+(i%2)*506,48+(i//2)*204))
    board.save(OUT/filename)
print("Generated 32 recipe diagrams, item preview sheet, and four tier sheets.")
