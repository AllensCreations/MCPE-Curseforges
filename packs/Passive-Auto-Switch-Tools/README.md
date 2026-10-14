# Passive Auto-Switch Tools - Automatic Tool Selection for Minecraft Bedrock

<div align="center">
  <img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/assets/mcpedl.png" alt="MCPEDL" title="MCPEDL" width="150" />
</div>

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21%20--%201.26+-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Release](https://img.shields.io/badge/Release-v1.0.0-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Passive-Auto-Switch-Tools/Passive_Auto_Switch_Tools_AllensCreations.mcpack)
[![Format](https://img.shields.io/badge/Format-.MCPACK%20%7C%20.MCADDON-orange?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Passive-Auto-Switch-Tools/Passive_Auto_Switch_Tools_AllensCreations.mcpack)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20PC%20%7C%20Console%20%7C%20Realms-yellow?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

Creator: AllensCreations  
Description: Background tool selection utility for Minecraft Bedrock that equips the optimal tool from player inventory when targeting blocks.

---

## Overview

Passive Auto-Switch Tools is a Script API behavior pack that automates tool selection in Minecraft Bedrock Edition. When targeting a block within reach distance while holding hotbar slot 1, the script scans the player inventory and equips the highest-tier matching tool into the active hand.

Hotbar slots 2 through 9 remain unmanaged, ensuring uninterrupted block placement, combat, and consumable item usage.

![Passive Auto-Switch Tools Icon](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/packs/Passive-Auto-Switch-Tools/pack_icon.png)

---

## Mechanics and Operation

### Hotbar Slot 1 Activation

The automation engine operates exclusively when the player selects hotbar slot 1:
- Hotbar Slot 1: Active auto-switch slot. Targeting blocks triggers automatic tool selection.
- Hotbar Slots 2 through 9: Standard manual operation. The script performs no item swaps while these slots are selected.

### Block-to-Tool Type Matching

Targeting a block within 6 blocks determines the required tool class:
- Pickaxe: Stone, deepslate, ores, obsidian, terracotta, cobblestone, and metal blocks.
- Axe: Logs, wood, planks, fences, fence gates, chests, crafting tables, melons, and pumpkins.
- Shovel: Dirt, grass, sand, gravel, clay, mud, soul sand, snow, and concrete powder.
- Shears / Sword: Leaves, wool, cobwebs, and vines.
- Hoe: Hay bales, target blocks, sponges, sculk, moss, and nether wart blocks.

### Tier Priority Hierarchy

When multiple matching tools are present in inventory, the system selects the highest tier available:

```text
Netherite > Diamond > Iron > Stone > Golden / Wooden
```

If tools of equal tier exist across hotbar and main inventory, the item already present in the hotbar is given priority.

### Item Integrity and Preservation

Item components are preserved during swaps:
- Durability damage values remain exact.
- Custom anvil names and lore strings are preserved.
- Enchantments (Efficiency, Fortune, Silk Touch, Unbreaking, Mending) are preserved intact.
- Active tool locking: If the currently held tool is already valid for the targeted block class, no redundant inventory swaps occur.

---

## Technical Specifications

| Parameter | Value | Reference / Notes |
| :--- | :--- | :--- |
| **Script Module** | `@minecraft/server` | `1.13.0` |
| **Minimum Engine Version** | `1.21.0` | `manifest.json` |
| **Targeting Range** | 6.0 blocks | Player raycast distance |
| **Execution Tick Rate** | Real-time raycast | Script tick loop |
| **Experimental Toggles** | Beta APIs enabled | Required for Script API execution |

---

## Comparison Table

| Feature | Vanilla Bedrock | With Passive Auto-Switch Tools |
| :--- | :--- | :--- |
| **Tool Swapping** | Manual hotbar selection | Automatic tool selection upon block raycast |
| **Tool Wear Protection** | Manual caution required | Matches optimal tool type directly |
| **Building and Off-Hand Usage** | Unaffected | Hotbar slots 2 to 9 remain completely manual |
| **Touch Controls Usability** | Frequent manual hotbar tapping | Automated selection reduces input overhead |
| **Configuration Requirements** | Not applicable | Zero scoreboard or command setup required |

---

## Direct Downloads

| Package | Format | Description | Download Link |
| :--- | :--- | :--- | :--- |
| **Passive Auto-Switch Tools Pack** | `.mcpack` | Behavior Pack archive for Minecraft Bedrock | [Download (.mcpack)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Passive-Auto-Switch-Tools/Passive_Auto_Switch_Tools_AllensCreations.mcpack) |
| **Passive Auto-Switch Tools Addon** | `.mcaddon` | All-In-One add-on archive | [Download (.mcaddon)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Passive-Auto-Switch-Tools/Passive_Auto_Switch_Tools_AllensCreations.mcaddon) |

---

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this pack in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.
