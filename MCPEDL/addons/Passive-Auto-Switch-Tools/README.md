# Passive Auto-Switch Tools - Automatic Tool Selection for Minecraft Bedrock

![MCPEDL](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Passive-Auto-Switch-Tools/pack_icon.png "MCPEDL")

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21%20--%201.26%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Achievement Friendly](https://img.shields.io/badge/Achievements-Friendly-brightgreen?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![No Experiments Required](https://img.shields.io/badge/Experimental%20Features-NOT%20REQUIRED-success?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Release](https://img.shields.io/badge/Release-v1.1.11-blue?style=flat-square)](../README.md#available-source-add-ons)
[![Format](https://img.shields.io/badge/Format-.MCPACK-orange?style=flat-square)](../README.md#available-source-add-ons)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20PC%20%7C%20Console%20%7C%20Realms-yellow?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

**By AllensCreations**

**NO EXPERIMENTAL NEED & ACHIEVEMENT FRIENDLY**

Automatic intelligent tool and combat equipment selection for survival.

---

## Overview

Passive Auto-Switch Tools is a Script API behavior pack that automates tool and weapon selection in Minecraft Bedrock Edition. When holding hotbar slot 1, the script activates exclusively when you **start to break/hit a block** (avoiding annoying swaps when merely looking around), and **when attacking a mob** by automatically equipping your highest-tier axe or sword.

Hotbar slots 2 through 9 remain completely unmanaged, ensuring uninterrupted building, offhand usage, and consumable item management.

![Passive Auto-Switch Tools Icon](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Passive-Auto-Switch-Tools/pack_icon.png)

---

## Mechanics and Operation

### Hotbar Slot 1 Activation

The automation engine operates exclusively when the player selects hotbar slot 1:
- Hotbar Slot 1: Active auto-switch slot. Striking blocks triggers tool selection; attacking mobs triggers weapon selection.
- Hotbar Slots 2 through 9: Standard manual operation. The script performs no item swaps while these slots are selected.

### Block-to-Tool & Combat Matching

- **Pickaxe**: Stone, deepslate, ores, obsidian, terracotta, cobblestone, and metal blocks.
- **Axe**: Logs, wood, planks, fences, fence gates, chests, crafting tables, melons, and pumpkins.
- **Shovel**: Dirt, grass, sand, gravel, clay, mud, soul sand, snow, and concrete powder.
- **Shears / Sword**: Leaves, wool, cobwebs, and vines.
- **Hoe**: Hay bales, target blocks, sponges, sculk, moss, and nether wart blocks.
- **Combat (Sword or Axe)**: When attacking any mob or combat entity, automatically equips the best available sword or axe.

### Tier Priority Hierarchy

When multiple matching tools or weapons are present in inventory, the system selects the highest tier available:

```text
Netherite > Diamond > Iron > Stone > Golden / Wooden
```

If items of equal tier exist across hotbar and main inventory, the item already present in the hotbar is given priority. For combat, swords have a slight damage preference in Bedrock, while existing axes or swords already in Slot 1 are retained.

### Item Integrity and Preservation

Item components are preserved during swaps:
- Durability damage values remain exact.
- Custom anvil names and lore strings are preserved.
- Enchantments (Efficiency, Fortune, Silk Touch, Unbreaking, Mending, Sharpness, etc.) are preserved intact.
- Active tool locking: If the currently held tool or weapon is already valid for the target block or combat, no redundant inventory swaps occur.
- No looking-at-block jitter: Tools only switch when you actually start breaking, never while simply looking around.

---

## Technical Specifications

| Parameter | Value | Reference / Notes |
| :--- | :--- | :--- |
| **Script Module** | `@minecraft/server` | `1.13.0` (STABLE) |
| **Minimum Engine Version** | `1.21.0` | `manifest.json` |
| **Execution Trigger** | Event-Driven | `entityHitBlock` & `entityHitEntity` |
| **Idle Overhead** | 0% (Zero-polling) | No background interval or raycast loops |
| **Experimental Toggles** | Beta APIs enabled | Required for Script API execution |

---

## Comparison Table

| Feature | Vanilla Bedrock | With Passive Auto-Switch Tools v1.1.0 |
| :--- | :--- | :--- |
| **Tool Swapping** | Manual hotbar selection | Automatic tool selection upon hitting/starting to break |
| **Combat Swapping** | Manual weapon selection | Automatic switch to axe or sword when hitting mobs |
| **Look-Around Stability** | Static | Clean & stable (no unwanted swaps while looking) |
| **Tool Wear Protection** | Manual caution required | Matches optimal tool type directly |
| **Building and Off-Hand Usage** | Unaffected | Hotbar slots 2 to 9 remain completely manual |
| **Touch Controls Usability** | Frequent manual hotbar tapping | Automated selection reduces input overhead |
| **Configuration Requirements** | Not applicable | Zero scoreboard or command setup required |

---

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this pack in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.
