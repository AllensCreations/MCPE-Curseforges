# OneBlock Void Survival - Progressive Void World for Minecraft Bedrock

![MCPEDL](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/maps/OneBlock-Void-Survival/behavior_pack/pack_icon.png "MCPEDL")

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21.x+-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Version](https://img.shields.io/badge/Map%20Version-v1.2.0-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCWORLD%20%7C%20.MCPACK-orange?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Experiments](https://img.shields.io/badge/Experiments-None%20(Pure%20Vanilla)-brightgreen?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

Creator: AllensCreations  
Description: Void survival map featuring progressive block mining, 43 procedural theme islands, and vanilla survival compatibility.

---

## Overview

OneBlock Void Survival is an infinite void survival map and game system for Minecraft Bedrock Edition. The player begins on a single block suspended above the void. Mining the block yields progressively advancing blocks, resources, and triggers the manifestation of 43 secret islands across three dimensions.

The system is powered by stable Bedrock Script API (`@minecraft/server` v1.13.0) and requires zero experimental flags (`experiments_ever_used: 0`), preserving full Xbox Achievement compatibility and multiplayer stability.

---

## Features and Technical Specifications

### OneBlock Auto-Renewal Engine
- Block Coordinate: Centered at `(0, 64, 0)`.
- Bedrock Foundation: Solid bedrock anchored at `(0, 63, 0)` prevents gravity-affected blocks (sand, gravel, concrete powder) from falling into the void.
- Renewal Latency: 1 tick (0.05 seconds). Breaking by hand, tool, piston, or explosion instantly restores the block.
- Fallback System: Multi-layer engine execution using `block.setType`, `block.setPermutation`, and native `setblock` guarantees the block never remains air.

### Progressive Phase Scaling
- Starter Biomes (Phases 0-4): 50 blocks per phase for early progression.
- Mid Biomes (Phases 5-9): 100 blocks per phase for steady resource gathering.
- Dimension Biomes (Phases 10+): 150 blocks per phase through Trials, Deepslate, Nether, and The End tiers.

### In-Game Events and Mechanics
- Starter Platform Assist: The first 8 dirt blocks mined automatically place around the central block to form a 3x3 platform.
- Starter Resource Chest: At 15 blocks mined, a starter reward chest spawns containing 2 Ice Blocks and 1 Lava Bucket.
- Entity Chests (2% probability): Phase-specific supply chests.
- Lucky Rush (0.5% probability): 10 seconds of accelerated mineral block generation.
- Void Surge (0.5% probability): Particle event accelerating phase progression.
- Dimension Shifter Merchant: Periodically spawns offering exclusive trades for biome saplings, seeds, and ancient items.

---

## Island Manifestation Catalog (43 Islands)

As block milestones are achieved, handcrafted islands generate in unloaded air chunks (140 to 250 blocks away) across three dimensions:

| Dimension | Island Count | Biomes and Structures |
| :--- | :---: | :--- |
| **Overworld** | 28 | Plains Oasis, Desert Temple, Lush Caves, Deep Dark Shrine, Trial Chamber, Mushroom Field, Cherry Grove, Badlands Mesa, Mangrove Swamp, Ice Spikes |
| **The Nether** | 8 | Crimson Forest, Warped Grove, Soul Sand Valley, Piglin Bastion Treasury, Nether Fortress Outpost, Basalt Deltas |
| **The End** | 7 | End City Outpost, Chorus Orchard, Purpur Citadel, Void Dragon Altar, Shulker Spire |

All islands feature satellite mini-islands, lantern markers, custom loot tables, and safe perimeter buffers.

---

## Administration and Photography Studio

The map package includes an Admin Edition (`OneBlock_Void_Survival_Admin.mcworld`):
- All 43 islands pre-manifested upon launch.
- Studio GUI opened via double-sneak gesture.
- Elevated 3/4 isometric panoramic camera coordinates for each island.
- Time-of-day and lighting toggles (High Noon, Sunset, Midnight, Night Vision).
- Automated block-breaking runner simulating 10 blocks/sec for progression testing.

---

## Compatibility and Installation

- Minecraft Bedrock Version: 1.21.0 through 1.26.x+
- Experimental Flags: None required (`experiments_ever_used: 0`)
- Multiplayer: Fully compatible with LAN, Dedicated Servers (BDS), and Realms

---

## Direct Downloads

| File | Type | Description | Download Link |
| :--- | :--- | :--- | :--- |
| **`OneBlock_Void_Survival.mcworld`** | World | Standard Survival Experience | [Download Survival (.mcworld)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/OneBlock-Void-Survival/OneBlock_Void_Survival.mcworld) |
| **`OneBlock_Void_Survival_Admin.mcworld`** | World | Testing and Photography Studio Edition | [Download Admin (.mcworld)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/OneBlock-Void-Survival/OneBlock_Void_Survival_Admin.mcworld) |
| **`OneBlock_Void_Survival.mcpack`** | Behavior Pack | Standalone Behavior Pack for Custom Worlds | [Download BP (.mcpack)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/OneBlock-Void-Survival/OneBlock_Void_Survival.mcpack) |

---

## MCPEDL and CurseForge Distribution Checklist

<div align="center">
  <img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/assets/mcpedl.png" alt="MCPEDL" title="MCPEDL" width="150" />
</div>

Ensure that you have already:
- Connected your Curseforge Account.
- Your project has an image with the title MCPEDL (no quotes).
- Your project files are already approved.
- Your project has the third party sharing option enabled.

---

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this map in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this map, its individual files, or modified copies to any website, app store, or file-sharing service. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.
