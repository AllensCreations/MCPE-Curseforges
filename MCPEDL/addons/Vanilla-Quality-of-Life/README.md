# Vanilla Quality of Life — Survival Mechanics and Enhancements for Minecraft Bedrock

![MCPEDL](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Vanilla-Quality-of-Life/banner.jpg "MCPEDL")

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21.0%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Achievement Friendly](https://img.shields.io/badge/Achievements-Friendly-brightgreen?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![No Experiments Required](https://img.shields.io/badge/Experimental%20Features-NOT%20REQUIRED-success?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCADDON-orange?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/tree/main/MCPEDL/addons#available-add-ons)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20PC%20%7C%20Console%20%7C%20Realms-yellow?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

**By AllensCreations**

**THE ALL-IN-ONE SURVIVAL QUALITY OF LIFE SUITE FOR MINECRAFT BEDROCK**

Comprehensive vanilla-plus survival enhancements: dynamic lighting, offhand quick-swap, passive auto-switch tools, smart tree capitator, domino ore miner, and universal leashing.

---

## Overview

**Vanilla Quality of Life** is the ultimate all-in-one survival quality of life pack for Minecraft Bedrock Edition. It resolves everyday survival friction points while maintaining complete game balance and pure vanilla feel.

From dynamic torch lighting and double-sneak offhand item swapping to automatic tool switching on Slot 1, sneak-activated tree capitation with 5×5 branch following, and 26-neighbor domino ore mining with durability safety guards—everything works seamlessly together.

Optimized for smooth survival performance with zero lag. Requires zero experimental toggles, making it safe for long-term survival worlds, multiplayer Realms, and Bedrock Dedicated Servers (BDS).

![Vanilla QoL Banner](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Vanilla-Quality-of-Life/banner.jpg)

---

## Features and Specifications

### Comparison Table

| Feature | Vanilla Bedrock | With Vanilla QoL |
| :--- | :--- | :--- |
| **Tool & Weapon Switching** | Manual hotbar selection | Automatic optimal tool/weapon swap when holding Slot 1 |
| **Tree Harvesting** | 1 log at a time | Sneak-axe fells entire tree up to 128 logs with 26-neighbor 3D scan & canopy protection |
| **Ore Vein Mining** | 1 ore block at a time | Sneak-pickaxe domino mines contiguous veins across 26 neighbors |
| **Tool Durability Safety** | Tools break unexpectedly | Auto-halts chain mining at 1 durability with alert sounds |
| **Offhand Utilities & Lighting** | Shield and Totem only | Double-sneak offhand swap + real-time moving torch/lantern light |
| **Leashing Mobs** | Passive mobs only | All non-boss mobs (Villagers, Golems, Hostiles; Warden/Wither/Dragon immune) |
| **Hostile Mob Aggro on Leads** | Hostile attacks continue | Pacified while attached to a lead |
| **Pet Friendly-Fire** | Pets damaged by player attacks | Immune to player melee sweeps, arrows, and explosions |
| **Leaf Decay Speed** | 10 to 30 seconds | 1 to 2 seconds |
| **Woodcutting in Stonecutter** | Not supported (stone only) | All 12 wood types supported at fair 1:1 ratios |
| **Potion & Milk Stacking** | 1 per inventory slot | Stacks up to 16 |
| **Shulker Shell Yield** | 0 to 1 shell per mob | 1 to 2 shells per Shulker kill (+1 with Looting) |
| **Multiplayer Sleep** | All online players must sleep | 1 player sleeping skips the night |
| **Mob Head Trophy Drops** | Requires Charged Creeper kill | 1.0% base drop chance on player kills (+0.5% per Looting) |

---

### Key Gameplay Mechanics

#### 1. Passive Auto-Switch Tools (Slot 1)
- Hold Slot 1 (hotbar index 0) to activate auto tool selection:
  - Hit stone, ores, or brick -> Equips best Pickaxe (evaluating tier, efficiency, and durability).
  - Hit logs, wood, or planks -> Equips best Axe.
  - Hit dirt, sand, gravel, or clay -> Equips best Shovel.
  - Hit leaves or cobwebs -> Equips Shears.
  - Attack hostile or passive mobs -> Equips best melee Weapon (Sword or Axe).
- Low durability penalty: Automatically favors healthy tools so nearly-broken tools aren't worn down.

#### 2. Smart Tree Capitator (Sneak + Axe)
- Sneak while chopping any tree log with an axe to fell the entire tree in a single tick:
  - **26-Neighbor 3D Flood-Fill**: Sweeps all 26 surrounding block coordinates (`dx, dy, dz ∈ [-1, 0, 1]`) with upward bias (`dy >= 0`), cleanly connecting branches, crooked trunks, and sprawling canopies without digging into terrain beneath the stump.
  - **Species Matching**: Enforces strict wood species matching (Oak only fells Oak) to prevent chain reactions into adjacent trees.
  - **The Leaf Scan (Build & Bush Protection)**: Ignores player-placed decorative leaves (harvested with shears), protecting your custom bushes, hedges, and roof designs while exclusively verifying natural tree canopies.
  - **House Protection (`isTreeCanopy`)**: Requires leaf, wart block, or shroomlight presence within the connected canopy to protect wooden player homes and cabins from accidental felling.
  - **Natural Leaf Decay**: Preserves leaf canopies for authentic leaf decay drops (saplings, sticks, apples).
  - **Capacity Limit**: Up to 128 logs per tree operation.

#### 3. Domino Ore Miner (Sneak + Pickaxe)
- Sneak while mining any mineral ore with a pickaxe to harvest the connected ore vein:
  - **26-Neighbor Detection**: Sweeps faces, edges, and corners across all 3 spatial dimensions.
  - **Category Normalization**: Normalizes stone and deepslate variants (e.g. Coal Ore and Deepslate Coal Ore chain together).
  - **Fortune & Silk Touch**: Honors Silk Touch block drops and vanilla Fortune item multipliers.
  - **Capacity Limit**: Up to 64 ore blocks per vein cluster.

#### 4. Durability Safety Guard
- Automatically halts Tree Capitator and Domino Ore Miner operations if your tool reaches **5 durability points remaining**.
- Plays a warning bass sound and flashes an action bar alert, ensuring your valuable enchanted gear never accidentally breaks.

#### 5. Offhand Quick-Swap, Torch Placement & Dynamic Handheld Lighting
- Supported items: Torches, Soul Torches, Lanterns, Soul Lanterns, Clocks, Compasses, Recovery Compasses.
- **Offhand Torch Placement**: When holding a Torch, Soul Torch, or Redstone Torch in your offhand, simply **Sneak and Click** (right-click / interact) on any block surface to place it from your offhand without swapping items or losing your mainhand tool.
- Quick-swap gestures:
  - **Double-sneak** (crouch twice within 0.7 seconds) to swap held item into offhand.
  - **Sneak + Use/Tap in air** to swap held item into offhand.
  - Run `/scriptevent qol:swap` command.
- Real-time dynamic light: Handheld or offhand torches emit Light Level 14; lanterns emit Light Level 15 as you move.

#### 6. Universal Leashing (101 Mobs)
- Leash any entity: Villagers, Iron Golems, Hostiles, Creepers, Endermen, Wardens, Withers, and Ghasts.
- Pacification on leads: Hostile mobs attached to leads do not attack players, allowing safe relocation.
- Sneak-interaction on Villagers attaches leads without opening the trading UI.

#### 7. Friendly-Fire Immunity for Pets and Mounts
- Tamed Wolves, Cats, Parrots, Horses, Donkeys, Mules, and Llamas take zero damage from player melee attacks, sweeping strikes, and projectile fire.
- Tamed entities are immune to Creeper and TNT explosion damage.

#### 8. Fast Leaf Decay
- Floating leaves from chopped trees decay within 1 to 2 seconds.
- Normal drop rates for saplings, sticks, and apples are preserved without world lag.

#### 9. Stonecutter Woodcutter Integration
- Cut all 12 wood types (Oak, Spruce, Birch, Jungle, Acacia, Dark Oak, Mangrove, Cherry, Pale Oak, Bamboo, Crimson, Warped):
  - Logs -> 4 Planks, 8 Slabs, 4 Stairs
  - Planks -> 2 Slabs, 1 Stair, 1 Trapdoor, 1 Fence, 1 Fence Gate

#### 10. Stackable Potions and Buckets
- Standard Potions, Splash Potions, Lingering Potions, and Milk Buckets stack up to 16 per slot.

#### 11. Mob Head Trophy System
- Slain mobs have a 1.0% base drop chance (+0.5% per Looting level up to 2.5% max at Looting III) on player kills:
  - Zombie, Husk, Drowned -> Zombie Head
  - Skeleton, Stray, Bogged -> Skeleton Skull
  - Creeper -> Creeper Head
  - Piglin, Zombified Piglin -> Piglin Head
  - Wither Skeleton -> 1.0% base drop rate (+0.5% per Looting level)
  - Ender Dragon -> 1.0% drop chance (+0.5% per Looting level)
  - PvP Player Kills -> Slain players have 1.0% drop chance (+0.5% per Looting level) for Player Head

#### 12. Wandering Trader Collector Trades
- Rare 2% spawn rate collector trades offering mob heads for **1 Diamond Block + 16 Emeralds**.
- Biome flora trades: Spore Blossoms, Wither Roses, Nautilus Shells, Bundles, and Heart of the Sea.

---

## Crafting and Recycling Recipes

### Landscaping and Nature
- Dirt + Any Seed -> 1 Grass Block
- 3 Gravel -> 3 Flint (Shapeless)
- 1 Cobblestone or Stone Brick + 1 Moss Block (or Vine) -> 1 Mossy Block
- 4 String + 1 Slimeball -> 1 Cobweb
- 1 Moss Block + 1 Flowering Azalea + 1 Vine -> 1 Spore Blossom
- 1 Diorite + 1 Bone Meal -> 1 Calcite
- 2 Basalt + 2 Cobblestone -> 4 Tuff Blocks
- 1 Gold Block + 3 Stone + 2 Sticks -> 1 Bell
- 1 Sandstone or Red Sandstone -> 4 Sand
- 1 Ink Sac + 1 Glowstone Dust -> 1 Glow Ink Sac
- 1 Quartz + 1 Lapis Lazuli + 2 Sand -> 2 Prismarine Shards

### Fair Crafting Yields
- 6 Blocks -> 8 Stairs (all 95 stair variants)
- 1 Iron Ingot + 2 Iron Nuggets -> 4 Chains
- 3 Sugar Cane -> 6 Paper
- 6 Glass Panes -> 2 Glass Blocks
- 8 Concrete Powder + 1 Water Bottle -> 8 Solid Concrete + 1 Empty Glass Bottle

### Smelting and Recycling
- Smelt Rotten Flesh in a furnace, smoker, or campfire -> Leather
- 2 Slabs -> 1 Full Block
- 4 Stairs -> 3 Full Blocks
- 1 Wool (any color) -> 4 String
- 1 Blast Furnace or Smoker -> 1 Furnace
- Repeaters and Comparators accept Cobblestone, Deepslate, or Blackstone
- Uncrafting support: Amethyst Blocks (4 shards), Quartz Blocks (4 quartz), Clay Blocks (4 clay balls), Glowstone Blocks (4 dust), Magma Blocks (4 cream), Honeycomb Blocks (4 honeycombs), Melons (9 slices), Nether Wart Blocks (9 nether wart)

---

## Compatibility & Packaging Formats

- Minecraft Bedrock Edition 1.21.0+
- Pure vanilla gameplay mechanics
- No experimental features required
- **Available Package Formats**:
  - **Complete `.MCADDON`**: 1-click full install with all features and companion visuals.
  - **Behavior Pack (`.mcpack`)**: Standalone gameplay and survival mechanics.
  - **Resource Pack (`.mcpack`)**: Visual lead attachments and companion animations.
- Compatible with Mobile (iOS / Android), Windows PC, Consoles (Xbox, PlayStation, Switch), and Multiplayer Realms / BDS

---

## Version History and Changelog

Detailed release notes and historical changes for all major versions are documented in the [CHANGELOG.md](https://github.com/AllensCreations/MCPE-Curseforges/blob/main/MCPEDL/addons/Vanilla-Quality-of-Life/CHANGELOG.md).

---

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this pack in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.
