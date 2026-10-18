# Passive Auto-Switch Tools - Automatic Tool Selection by AllensCreations

![MCPEDL](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Passive-Auto-Switch-Tools/pack_icon.png "MCPEDL")

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21%20--%201.26%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCPACK-orange?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/tree/main/MCPEDL/addons#available-add-ons)

**By AllensCreations**

Automatic intelligent tool and combat equipment selection for survival.

---

## Overview

Passive Auto-Switch Tools is an intelligent survival add-on that automates tool and weapon selection in Minecraft Bedrock Edition. When holding hotbar slot 1, the script activates exclusively when you **start to break/hit a block** (avoiding annoying swaps when merely looking around), and **when attacking a mob** by automatically equipping your highest-tier axe or sword.

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

**Netherite > Diamond > Iron > Stone > Golden / Wooden**

If items of equal tier exist across hotbar and main inventory, the item already present in the hotbar is given priority. For combat, swords have a slight damage preference in Bedrock, while existing axes or swords already in Slot 1 are retained.

### Item Integrity and Preservation

Item components are preserved during swaps:
- Durability damage values remain exact.
- Custom anvil names and lore strings are preserved.
- Enchantments (Efficiency, Fortune, Silk Touch, Unbreaking, Mending, Sharpness, etc.) are preserved intact.
- Active tool locking: If the currently held tool or weapon is already valid for the target block or combat, no redundant inventory swaps occur.
- No looking-at-block jitter: Tools only switch when you actually start breaking, never while simply looking around.

---

## Performance & Optimization

- **Zero Idle Lag**: Only activates the moment you strike a block or engage a mob.
- **Instant Response**: Seamless weapon and tool swapping tailored for console, mobile touch, and PC.

---

## Feature Comparison Highlights

### Tool Swapping
- **Vanilla Bedrock**: Manual hotbar selection
- **With Passive Auto-Switch Tools**: Automatic tool selection upon hitting/starting to break

### Combat Swapping
- **Vanilla Bedrock**: Manual weapon selection
- **With Passive Auto-Switch Tools**: Automatic switch to axe or sword when hitting mobs

### Look-Around Stability
- **Vanilla Bedrock**: Static
- **With Passive Auto-Switch Tools**: Clean & stable (no unwanted swaps while looking)

### Tool Wear Protection
- **Vanilla Bedrock**: Manual caution required
- **With Passive Auto-Switch Tools**: Matches optimal tool type directly

### Building and Off-Hand Usage
- **Vanilla Bedrock**: Unaffected
- **With Passive Auto-Switch Tools**: Hotbar slots 2 to 9 remain completely manual

### Touch Controls Usability
- **Vanilla Bedrock**: Frequent manual hotbar tapping
- **With Passive Auto-Switch Tools**: Automated selection reduces input overhead

### Configuration Requirements
- **Vanilla Bedrock**: Not applicable
- **With Passive Auto-Switch Tools**: Zero scoreboard or command setup required

---

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this pack in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.

---

## Search & Discovery Keywords

Minecraft Bedrock auto switch tools, intelligent tool switcher, Slot 1 auto equip, Bedrock weapon auto swap, survival tool selector, touch controls optimization, MCPEDL, CurseForge, AllensCreations.
