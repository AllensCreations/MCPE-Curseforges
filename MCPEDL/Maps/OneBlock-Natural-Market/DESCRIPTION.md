# OneBlock Natural Market — A OneBlock economy and supply shop

**By ALNStudios**

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-Stable%20Release-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCPACK%20%7C%20.MCADDON%20%7C%20.MCWORLD-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

**Use the Natural Market Ledger to buy supplies for a regenerating OneBlock survival challenge.**

## Overview

Start in the void on the central block at (0, 0, 0), with no bedrock beneath it. A short tutorial builds your platform: each of the first 8 breaks adds a block beside the core until a 3x3 platform surrounds it. Breaking it earns Coins and advances shared progression. Use the Natural Market Ledger to buy supplies with the Coins you earn.

## Key Features

### Regenerating OneBlock
- The central block returns after a successful break. It drops no items; breaking it only earns Coins.
- The core is a set of 30 custom Currency Blocks, numbered 1 to 30. Each has its own break time, the same with any tool or bare hands, and uses up more tool durability the higher it goes.
- After every 50 breaks the core turns into Bedrock for 30 seconds, and for 60 seconds at every new phase. A countdown shows on screen and the core comes back by itself.
- The central block is also restored automatically if something other than a player removes it.
- If a player ends up inside the central block or the 3x3 platform, they are teleported on top of the central block.
- The available natural block pool expands as shared mining milestones are reached.
- The starting core is Currency Block 1 and is managed by the map script after one-time void setup.

### Natural Market Ledger
- Opens the market in the game's standard form screen: a button list with item icons for each category and supply bundle.
- Tap a supply slot to purchase its displayed bundle directly; no separate purchase-confirmation screen.
- The Search button finds any unlocked supply by name, so you do not have to browse each section.
- Large categories use pages that reserve two slots for navigation controls.
- The catalogue only sells natural supplies (blocks, crops, raw food, raw ores, mob drops, Nether and End finds) plus mid-game Spawn Eggs. Crafted items are not sold. Entries unavailable in the current game version are hidden.
- Prices rise as supplies are bought and settle back down over time. Common supplies recover faster than rare ones.
- The market uses the standard server Action Form. It is **not a chest container screen** and does not support draggable slots or native container transfers.

### Coins and Selling
- Each central-block break awards Coins. Every block type has its own value, and higher tiers pay more.
- A Coins scoreboard is always shown on the sidebar. The About screen has a switch to hide your own name on it.
- Eligible catalogue items can be sold through the Ledger. Each item type can be locked so it is never sold; the Trident, Elytra and Totem of Undying start locked.

### Progression and Supply Pool
- Personal mining milestones unlock additional market supplies across 30 tiers, ending with Currency Block 30.
- The central block pool is set by the tiers only. Purchased blocks do not change it.

## How to Use

1. Import the Creative world first for initial checks.
2. Use the Natural Market Ledger from your inventory.
3. Tap a category, then tap a supply slot to buy its listed bundle.
4. Break the central block to earn Coins and progress.
5. Use the selling option in the market to exchange eligible catalogue items for Coins.

## Compatibility and Limitations

- Minecraft Bedrock Edition: minimum engine version 1.26.50.
- Stable Script API dependencies: `@minecraft/server` 2.10.0 and `@minecraft/server-ui` 2.2.0.
- Experimental features: none are turned on by the pack files. The custom Currency Blocks have not been tested in game.
- UI compatibility: The market uses the game's standard forms, so it does not depend on a custom screen and works with other add-ons that customize form screens.
- Achievements: Yes, achievement-friendly.
- Verification: Source updated; no package build or in-game test has been run for this UI revision.

## Creator and Permissions

- Creator: ALNStudios
- Profiles: [CurseForge Profile](https://www.curseforge.com/members/allenscreations/projects) · [MCPEDL Profile](https://mcpedl.com/user/alnstudios/)

<a href="https://www.curseforge.com/members/allenscreations/projects"><img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/assets/Images/curseforge.jpg" alt="CurseForge" width="45%"></a> <a href="https://mcpedl.com/user/alnstudios/"><img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/assets/Images/MCPEDL.jpg" alt="MCPEDL" width="45%"></a>

## Guidelines and Attribution

- Creator: ALNStudios
- Rights & Reservation: All rights reserved for ALNStudios.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to ALNStudios.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.
- Disclaimer: This is an unofficial community creation. It is not an official Minecraft product and is not approved by or associated with Mojang or Microsoft.

---

© All rights reserved for ALNStudios.

---

## Search & Discovery Keywords

Minecraft Bedrock add-on, OneBlock Natural Market Bedrock mod, Minecraft PE survival, MCPEDL add-on, CurseForge Bedrock, ALNStudios.

