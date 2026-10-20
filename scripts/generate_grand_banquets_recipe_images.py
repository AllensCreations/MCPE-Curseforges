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
ALIASES={
"apple_golden":"apple_golden","cocoa_beans":"dye_powder_brown","cooked_salmon":"fish_salmon_cooked","golden_carrot":"carrot_golden","pumpkin":"pumpkin_side","enchanted_golden_apple":"apple_golden","baked_potato":"potato_baked","cooked_beef":"beef_cooked",
"cooked_chicken":"chicken_cooked","cooked_cod":"fish_cooked","cooked_mutton":"mutton_cooked",
"cooked_porkchop":"porkchop_cooked","cooked_rabbit":"rabbit_cooked","cooked_salmon":"fish_salmon_cooked",
"golden_apple":"apple_golden","lapis_lazuli":"dye_powder_blue","milk_bucket":"bucket_milk","raw_beef":"beef",
"raw_chicken":"chicken","raw_cod":"fish","raw_mutton":"mutton_raw","raw_porkchop":"porkchop_raw",
"raw_rabbit":"rabbit","raw_salmon":"salmon","red_mushroom":"mushroom_red",
"brown_mushroom":"mushroom_brown","dragon_breath":"dragons_breath","wheat_seeds":"seeds_wheat","totem_of_undying":"totem",
"bone_meal":"dye_powder_white","nautilus_shell":"nautilus","tropical_fish":"clownfish",
"pufferfish":"fish_pufferfish_raw","porkchop":"porkchop_raw","cod":"fish","mutton":"mutton_raw"
}
def font(n):
    p=Path("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf")
    return ImageFont.truetype(str(p),n) if p.exists() else ImageFont.load_default()
def vanilla(item):
    short=item.split(":")[-1]
    names=[ALIASES.get(short,short),short]
    for name in dict.fromkeys(names):
        for folder in ("items","blocks"):
            p=SAMPLES/"textures"/folder/(name+".png")
            if p.is_file():
                return Image.open(p).convert("RGBA").resize((32,32),Image.Resampling.NEAREST)
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
    dr.text((14,8),slug.replace("_"," ").title(),font=font(18),fill="white")
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
        "Unresolved recipe assets (checked official Bedrock Samples and add-on textures):\\n- "
        + "\\n- ".join(sorted(missing))
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
