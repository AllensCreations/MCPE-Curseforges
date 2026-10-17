# Minecraft Bedrock Developer Reference Suite

This directory contains official development references and schema assets extracted from **Mojang's official [`bedrock-samples`](https://github.com/mojang/bedrock-samples) (Minimal Edition - v1.26.50+)** to serve as a fast, offline lookup for pack development.

---

## Directory Structure

```
reference/
├── README.md                          # This developer guide
└── bedrock-samples/                   # Mojang Bedrock Samples (Min Version)
    ├── behavior_pack/                 # Vanilla Behavior Pack definitions
    │   ├── biomes/                    # Vanilla biome definitions
    │   ├── blocks/                    # Data-driven block templates
    │   ├── entities/                  # All vanilla mob behaviors & components
    │   ├── items/                     # Data-driven item templates
    │   ├── loot_tables/               # Chests, mob drops & fishing tables
    │   ├── recipes/                   # 1,000+ crafting, smelting & stonecutter recipes
    │   ├── spawn_rules/               # Mob spawning biomes and conditions
    │   └── trading/                   # Villager & Wandering Trader trades
    ├── resource_pack/                 # Vanilla Resource Pack definitions
    │   ├── animation_controllers/     # Entity state machines
    │   ├── animations/                # Skeletal animation files
    │   ├── attachables/               # Armor, shields & held item renderers
    │   ├── entity/                    # Client entity definitions (.ce.json)
    │   ├── models/                    # Geometry models (.geo.json)
    │   ├── particles/                 # Particle emitters (.particle.json)
    │   └── render_controllers/        # Texture and material mappings
    ├── metadata/                      # Vanilla Metadata & JSON Schemas
    │   ├── json_schemas/              # Official schemas for VS Code & validation
    │   ├── vanilladata_modules/       # Canonical JSON item, block, and entity lists
    │   │   ├── mojang-items.json      # All 1,600+ valid item identifiers
    │   │   ├── mojang-blocks.json     # All block identifiers & states
    │   │   └── mojang-entities.json   # All entity type IDs
    │   └── molang_modules/            # Molang queries and math functions
    └── documentation/                 # Offline Official HTML Manuals
        ├── Addons.html                # Comprehensive add-on developer guide
        ├── Entities.html              # Entity JSON components & events
        ├── Blocks.html                # Custom block components & permutations
        ├── Item.html                  # Custom item components
        └── Molang.html                # Molang query documentation
```

---

## Complete Bedrock Tools Reference

All canonical tool identifiers derived from [`metadata/vanilladata_modules/mojang-items.json`](bedrock-samples/metadata/vanilladata_modules/mojang-items.json):

### 1. Mining, Digging & Harvesting Tools

| Tool Type | Material Tiers (Lowest to Highest) | Typical Effective Target Blocks |
| :--- | :--- | :--- |
| **Pickaxe** | `wooden_pickaxe` → `stone_pickaxe` → `copper_pickaxe` → `iron_pickaxe` → `diamond_pickaxe` → `netherite_pickaxe` (`golden_pickaxe` for high speed) | Stone, Cobblestone, Deepslate, Ores, Obsidian, Netherrack, Bricks, Concrete, Terracotta, Anvils, Furnaces, Hoppers. |
| **Axe** | `wooden_axe` → `stone_axe` → `copper_axe` → `iron_axe` → `diamond_axe` → `netherite_axe` (`golden_axe`) | Logs, Stripped Wood, Planks, Fences, Gates, Wooden Doors/Trapdoors, Chests, Barrels, Crafting Tables, Bookshelves, Pumpkins, Melons. |
| **Shovel** | `wooden_shovel` → `stone_shovel` → `copper_shovel` → `iron_shovel` → `diamond_shovel` → `netherite_shovel` (`golden_shovel`) | Dirt, Grass Block, Dirt Path, Podzol, Mycelium, Sand, Red Sand, Gravel, Clay, Soul Sand, Soul Soil, Mud, Snow, Concrete Powder. |
| **Hoe** | `wooden_hoe` → `stone_hoe` → `copper_hoe` → `iron_hoe` → `diamond_hoe` → `netherite_hoe` (`golden_hoe`) | Farmland tilling, Leaves, Hay Bales, Target Blocks, Sponges, Sculk Blocks, Moss Blocks, Shroomlights, Nether/Warped Wart Blocks. |

### 2. Weapons & Combat Tools

| Tool / Weapon | Identifiers | Combat Role & Special Mechanics |
| :--- | :--- | :--- |
| **Swords** | `wooden_sword` → `stone_sword` → `copper_sword` → `iron_sword` → `diamond_sword` → `netherite_sword` (`golden_sword`) | Standard melee weapon; sweeps attacks; instant cobweb breaking. |
| **Mace** | `minecraft:mace` | Heavy 1.21 weapon crafted with Heavy Core + Breeze Rod. Deals proportional damage scaling with falling fall distance and unleashes a smash knockback wave. |
| **Trident** | `minecraft:trident` | Hybrid melee/ranged weapon with Loyalty, Riptide, and Channeling enchantments. |

### 3. Specialized Utility Tools

| Tool | Identifier | Primary Gameplay Use |
| :--- | :--- | :--- |
| **Shears** | `minecraft:shears` | Shearing sheep for wool, collecting intact leaves, cobwebs, vines, and carving pumpkins. |
| **Brush** | `minecraft:brush` | Archaeology tool for uncovering pottery sherds and sniffer eggs from Suspicious Sand and Suspicious Gravel. |
| **Fishing Rod** | `minecraft:fishing_rod`, `minecraft:carrot_on_a_stick`, `minecraft:warped_fungus_on_a_stick` | Catching fish and treasure; steering saddled pigs and striders; hooking entities. |
| **Flint and Steel** | `minecraft:flint_and_steel` | Igniting fires, activating Nether Portals, detonating TNT, and lighting Campfires. |
| **Lead** | `minecraft:lead` | Leashing passive, neutral, and transportable mobs to fences or leading them. |
| **Spyglass** | `minecraft:spyglass` | Optical zoom for scouting terrain and landmarks. |
| **Compasses** | `minecraft:compass`, `minecraft:recovery_compass`, `minecraft:lodestone_compass` | Pointing to world spawn, player's last death location, or linked Lodestone blocks. |
| **Clock** | `minecraft:clock` | Tracking celestial time (day/night cycle) underground or indoors. |
| **Buckets** | `bucket`, `water_bucket`, `lava_bucket`, `milk_bucket`, `powder_snow_bucket` | Liquid transport, extinguishing burning players, MLG clutch landing, clearing status effects, capturing water mobs. |

---

## How to Use in Development

1. **Looking up an entity component:**
   Inspect [`bedrock-samples/behavior_pack/entities/<entity>.json`](bedrock-samples/behavior_pack/entities/) to see exact vanilla components (e.g., `minecraft:rideable`, `minecraft:leashable`, `minecraft:health`).
2. **Looking up valid item/block IDs:**
   Search [`bedrock-samples/metadata/vanilladata_modules/mojang-items.json`](bedrock-samples/metadata/vanilladata_modules/mojang-items.json) for exact namespaces.
3. **Validating JSON with Schemas:**
   Configure your editor (VS Code, Bridge) to use the schemas in [`bedrock-samples/metadata/json_schemas/`](bedrock-samples/metadata/json_schemas/).
