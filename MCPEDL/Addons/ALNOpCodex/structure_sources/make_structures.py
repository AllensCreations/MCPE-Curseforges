import pathlib
import struct

OUT = pathlib.Path(__file__).resolve().parents[1] / "behavior_pack" / "structures" / "aln"
LORE = "§c[ALNStudios] §eGod Tier Gear Level 255"
GOD = 255
IDS = {
    "protection": 0, "fire_protection": 1, "feather_falling": 2, "blast_protection": 3,
    "projectile_protection": 4, "thorns": 5, "respiration": 6, "depth_strider": 7, "aqua_affinity": 8,
    "sharpness": 9, "smite": 10, "bane_of_arthropods": 11, "knockback": 12, "fire_aspect": 13,
    "looting": 14, "efficiency": 15, "silk_touch": 16, "unbreaking": 17, "fortune": 18, "power": 19,
    "punch": 20, "flame": 21, "infinity": 22, "frost_walker": 25, "mending": 26, "soul_speed": 36,
    "swift_sneak": 37, "impaling": 29, "riptide": 30, "loyalty": 31, "channeling": 32, "multishot": 33,
    "piercing": 34, "quick_charge": 35, "wind_burst": 38, "density": 39, "breach": 40, "lunge": 41,
}
LIMITS = {"knockback": 2, "punch": 2, "depth_strider": 3, "frost_walker": 2, "soul_speed": 3, "swift_sneak": 3,
          "riptide": 3, "loyalty": 3, "quick_charge": 3, "wind_burst": 3, "lunge": 3}


def text(value):
    data = value.encode("utf-8")
    return struct.pack("<H", len(data)) + data


def byte(value):
    return 1, struct.pack("<b", value)


def short(value):
    return 2, struct.pack("<h", value)


def integer(value):
    return 3, struct.pack("<i", value)


def string(value):
    return 8, text(value)


def array(kind, items):
    return 9, struct.pack("<bi", kind, len(items)) + b"".join(item[1] for item in items)


def compound(fields):
    return 10, b"".join(bytes([tag[0]]) + text(name) + tag[1] for name, tag in fields.items()) + b"\0"


def item(slot, name, tag):
    return compound({"Slot": byte(slot), "Name": string("minecraft:" + name), "Count": byte(1),
                     "Damage": short(0), "WasPickedUp": byte(0), "tag": compound(tag)})


def display(label):
    return compound({"Name": string(label), "Lore": array(8, [string(LORE)])})


def gear(slot, name, label, enchants):
    entries = [compound({"id": short(IDS[e]), "lvl": short(LIMITS.get(e, GOD))}) for e in enchants.split()]
    return item(slot, name, {"Damage": integer(0), "RepairCost": integer(0), "display": display(label),
                             "ench": array(10, entries)})


def kit(rows):
    return [gear(slot, *row) for slot, row in enumerate(rows)]


KEEP = "unbreaking mending"
DAMAGE = "sharpness smite bane_of_arthropods"
GUARD = "protection fire_protection blast_protection projectile_protection thorns " + KEEP
TOOLS = [
    ("netherite_pickaxe", "God Fortune Pickaxe", "efficiency fortune " + KEEP),
    ("netherite_pickaxe", "God Silk Touch Pickaxe", "efficiency silk_touch " + KEEP),
    ("netherite_sword", "God Sword", DAMAGE + " knockback fire_aspect looting " + KEEP),
    ("netherite_axe", "God Fortune Axe", DAMAGE + " efficiency fortune " + KEEP),
    ("netherite_axe", "God Silk Touch Axe", DAMAGE + " efficiency silk_touch " + KEEP),
    ("netherite_shovel", "God Fortune Shovel", "efficiency fortune " + KEEP),
    ("netherite_shovel", "God Silk Touch Shovel", "efficiency silk_touch " + KEEP),
    ("bow", "God Infinity Bow", "power punch flame infinity unbreaking"),
    ("bow", "God Mending Bow", "power punch flame " + KEEP),
    ("netherite_hoe", "God Fortune Hoe", "efficiency fortune " + KEEP),
    ("netherite_hoe", "God Silk Touch Hoe", "efficiency silk_touch " + KEEP),
    ("trident", "God Loyalty Trident", "impaling loyalty channeling " + KEEP),
    ("trident", "God Riptide Trident", "impaling riptide " + KEEP),
    ("crossbow", "God Multishot Crossbow", "multishot quick_charge " + KEEP),
    ("crossbow", "God Piercing Crossbow", "piercing quick_charge " + KEEP),
    ("mace", "God Mace", "density breach smite bane_of_arthropods wind_burst fire_aspect " + KEEP),
    ("netherite_spear", "God Spear", DAMAGE + " knockback fire_aspect looting lunge " + KEEP),
]
ARMOR = [
    ("netherite_helmet", "God Helmet", GUARD + " respiration aqua_affinity"),
    ("netherite_chestplate", "God Chestplate", GUARD),
    ("netherite_leggings", "God Leggings", GUARD + " swift_sneak"),
    ("netherite_boots", "God Depth Strider Boots", GUARD + " feather_falling soul_speed depth_strider"),
    ("netherite_boots", "God Frost Walker Boots", GUARD + " feather_falling soul_speed frost_walker"),
]


def write(name, color, label, rows):
    box = item(0, color + "_shulker_box", {"display": display(label), "Items": array(10, kit(rows))})
    chest = compound({"id": string("Chest"), "Findable": byte(0), "isMovable": byte(1), "x": integer(0),
                      "y": integer(0), "z": integer(0), "Items": array(10, [box])})
    block = compound({"name": string("minecraft:chest"), "states": compound({}), "version": integer(17959425)})
    palette = compound({"default": compound({
        "block_palette": array(10, [block]),
        "block_position_data": compound({"0": compound({"block_entity_data": chest})})})})
    root = compound({
        "format_version": integer(1),
        "size": array(3, [integer(1), integer(1), integer(1)]),
        "structure": compound({"block_indices": array(9, [array(3, [integer(0)]), array(3, [integer(-1)])]),
                               "entities": array(10, []), "palette": palette}),
        "structure_world_origin": array(3, [integer(0), integer(0), integer(0)])})
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / (name + ".mcstructure")).write_bytes(bytes([10]) + text("") + root[1])
    print(f"wrote {name}.mcstructure ({len(rows)} items)")


write("god_tools", "purple", "OpCodex God Tools", TOOLS)
write("god_armor", "red", "OpCodex God Armor", ARMOR)
