# Vanilla Quality of Life - Survival Mechanics and Enhancements for Minecraft Bedrock
![MCPEDL](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Vanilla-Quality-of-Life/banner.jpg "MCPEDL")

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21%20--%201.26%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Achievement Friendly](https://img.shields.io/badge/Achievements-Friendly-brightgreen?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![No Experiments Required](https://img.shields.io/badge/Experimental%20Features-NOT%20REQUIRED-success?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Release](https://img.shields.io/badge/Release-v1.2.5-blue?style=flat-square)](../README.md#available-source-add-ons)
[![Format](https://img.shields.io/badge/Format-.MCADDON-orange?style=flat-square)](../README.md#available-source-add-ons)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20PC%20%7C%20Console%20%7C%20Realms-yellow?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

**By AllensCreations**

**NO EXPERIMENTAL NEED & ACHIEVEMENT FRIENDLY**

Lightweight vanilla-plus survival enhancements, universal leashing, and fast leaf decay.

---

## Overview

Vanilla Quality of Life is a lightweight, pure data-driven behavior pack that addresses common survival gameplay friction points while preserving core vanilla game balance.

The pack modifies entity definitions, loot tables, and recipes using standard Bedrock components. It requires zero experimental toggles, making it safe for long-term survival worlds, multiplayer servers, and Bedrock Dedicated Servers (BDS).

![Vanilla QoL Banner](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Vanilla-Quality-of-Life/banner.jpg)

---

## Features and Specifications

### Comparison Table

| Feature | Vanilla Bedrock | With Vanilla QoL |
| :--- | :--- | :--- |
| **Leashing Mobs** | Passive mobs only | All 101 mobs (Villagers, Golems, Hostiles) |
| **Hostile Mob Aggro on Leads** | Hostile attacks continue | Pacified while attached to a lead |
| **Pet Friendly-Fire** | Pets damaged by player weapons | Immune to player sweeps, arrows, and explosions |
| **Leaf Decay Speed** | 10 to 30 seconds | 1 to 2 seconds |
| **Woodcutting in Stonecutter** | Not supported (stone only) | All 11 wood types supported at 1:1 ratios |
| **Potion and Milk Stacking** | 1 per inventory slot | Stacks up to 16 |
| **Offhand Utilities and Dynamic Light** | Shield and Totem only | Double-sneak swap with real-time moving light |
| **Shulker Shell Yield** | 0 to 1 shell per mob | Guaranteed 2 shells per Shulker kill |
| **Multiplayer Sleep** | All online players must sleep | 1 player sleeping skips the night |
| **Mob Head Drops** | Requires Charged Creeper kill | 2.5% base drop chance on player kills |

---

### Detailed Mechanics

#### Universal Leashing (101 Mobs)
- Leash any entity: Villagers, Wandering Traders, Iron Golems, Turtles, Zombies, Skeletons, Creepers, Endermen, Wardens, Withers, and Ghasts.
- Spider lead alignment: Custom client locators ensure leashes connect naturally to the spider torso.
- Pacification on leads: Hostile mobs attached to leads do not attack players, allowing safe relocation.
- Villager interaction controls:
  - Primary interaction (tap/right-click): Opens standard trading menu.
  - Sneak interaction with lead: Attaches leash without opening the trade interface.

#### Friendly-Fire Immunity for Pets and Mounts
- Tamed Wolves, Cats, Parrots, Horses, Donkeys, Mules, and Llamas take zero damage from player melee attacks, sweeping strikes, and projectile fire.
- Tamed entities are immune to Creeper and TNT explosion damage.

#### Fast Leaf Decay
- Floating leaves from chopped trees decay within 1 to 2 seconds.
- Normal drop rates for saplings, sticks, and apples are preserved without world lag.

#### Stonecutter Woodcutter Integration
- Cut all 11 wood types (Oak, Spruce, Birch, Jungle, Acacia, Dark Oak, Mangrove, Cherry, Bamboo, Crimson, Warped):
  - Logs -> 4 Planks, 8 Slabs, 4 Stairs
  - Planks -> 2 Slabs, 1 Stair, 1 Trapdoor, 1 Fence, 1 Fence Gate

#### Stackable Potions and Buckets
- Standard Potions, Splash Potions, Lingering Potions, and Milk Buckets stack up to 16 per slot.

#### Offhand Quick-Swap and Dynamic Lighting
- Supported utility items: Torches, Soul Torches, Lanterns, Soul Lanterns, Clocks, Compasses, Recovery Compasses.
- Equip controls:
  - Double-sneak (crouch twice within 0.7 seconds) while holding the item in mainhand to swap into offhand.
  - Sneak and tap/right-click in air to swap into offhand.
  - Double-sneak again to retrieve the item back to the mainhand.
- Dynamic lighting: Equipped Torches emit Light Level 14; equipped Lanterns emit Light Level 15 in real time.

#### Mob Head Trophy System
- Slain mobs have a 2.5% base drop chance (+1% per Looting level) on player kills:
  - Zombie, Husk, Drowned -> Zombie Head
  - Skeleton, Stray, Bogged -> Skeleton Skull
  - Creeper -> Creeper Head
  - Piglin, Zombified Piglin -> Piglin Head
  - Wither Skeleton -> 10% base drop rate
  - Ender Dragon -> Guaranteed 1 Dragon Head + 1 Elytra
  - PvP Player Kills -> Slain players drop their Player Head

#### Wandering Trader Collector Trades
- Exchange 1 Diamond Block for rare heads: Zombie, Skeleton, Creeper, Wither Skeleton, Piglin, Player, or Dragon Head.
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

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this pack in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.
