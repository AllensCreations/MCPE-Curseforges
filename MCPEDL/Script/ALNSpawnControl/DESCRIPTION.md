# ALN:SpawnControl — Custom Mob Spawn Whitelist & Toggle UI

**By ALNStudios**

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-Stable%20Release-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCPACK%20%7C%20.MCADDON%20%7C%20.MCWORLD-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

**Control world mob spawns with individual switches for 58 creatures, presets, and filter rules opened from a Spawn Control book.**

> ALN:SpawnControl adds an interactive in-game control panel to configure individual mob spawning rules across 4 categorized rosters. It suits world builders, realm administrators, and survival players wanting a fine-tuned environment without custom entities.

## Overview

Rename a vanilla Book to "Spawn Control" on an Anvil and use it to open the control panel. From the dashboard, players can inspect active mob counts, configure 4 categorized mob rosters with individual toggles, apply one-tap presets, configure global filter modes, or open the separate purge menu to remove existing disabled mobs. All preferences are saved persistently to world storage.

## Key Features

### Categorized Mob Rosters
- **What Happens**: Individual toggle switches govern 58 standard mobs organized across 4 distinct groups: Overworld Hostiles, Passive & Neutral Mobs, Nether & End Mobs, and Bosses & Rare Mobs.
- **How It Works**: Open any category to adjust individual toggles, such as turning off Creeper or Phantom while keeping Zombie and Skeleton active. Each category includes a dedicated back switch to return to the dashboard.
- **Good To Know**: All mobs are enabled by default. Mobs that are toggled off are removed immediately when spawning occurs.

### Custom Mob Spawner & Farm Control
- **What Happens**: Fine-tune mob farms and monster spawners by permitting only chosen mob types to spawn while blocking all unwanted background spawns.
- **Good for Chosen Mob Spawner**: Perfect for mob spawner chambers and specialized drop farms (such as Skeleton, Blaze, Witch, or Creeper farms). Disabling other competing mob spawns maximizes spawner efficiency, frees up mob caps, and prevents unwanted entities from crowding your spawn areas.
- **How It Works**: Disable unneeded hostiles to maximize spawn rates for chosen creatures, or block specific mob types around complex farms without breaking the target mob grinder.

### Quick Presets
- **What Happens**: One-tap buttons allow bulk configuration: Enable All Mobs, Disable All Hostiles, Disable All Passive Mobs, or Disable Everything for an empty mob world.
- **How It Works**: Selecting "Disable All Hostiles" immediately switches off all Overworld monsters, Nether threats, and bosses simultaneously.

### Global Filter Rules
- **What Happens**: Global settings let you choose whether spawn restrictions apply only to natural world-gen spawns or also block Spawn Eggs and summon commands.
- **How It Works**: Leaving natural spawn mode active allows administrators to test mobs using Spawn Eggs while preventing wild spawns.

### Entity Purge
- **What Happens**: A dedicated Purge Disabled Mobs menu scans loaded chunks in all three dimensions and removes mobs whose toggles are currently disabled.
- **How It Works**: Choose which of the 4 groups are purged, and decide whether tamed mobs and name-tagged mobs are included. Submitting the menu runs a single-pass removal and reports how many mobs were purged and how many tamed or named mobs were kept.
- **Good To Know**: Tamed mobs and name-tagged mobs are kept by default.

### Admin Tag Lock
- **What Happens**: An optional permission lock restricts opening the control panel to players carrying the administrator tag.
- **How It Works**: When Admin Tag Lock is turned on, a player must carry the tag to open the book; the first player to open the book automatically receives the tag if none exists.

## How to Use

1. Import the .mcpack file and activate ALN:SpawnControl in your world's Behavior Packs.
2. Place a Book (not a Book and Quill) in an Anvil and rename it to "Spawn Control".
3. Hold the renamed book and use it to open the ALN:SpawnControl control panel.

## Common Questions

- **Do I need experimental toggles?**: No experimental toggles or cheats are required for normal menu usage.
- **Does it stop mob spawners?**: When set to block natural spawns or all sources, spawner-generated entities of disabled mob types are intercepted upon spawning.
- **Will turning off a mob remove existing ones?**: New spawns are blocked immediately; use the Purge Disabled Mobs menu to clear existing mobs. Tamed and name-tagged mobs are kept unless you include them.

## Compatibility

- Minecraft Bedrock Edition: 1.26.60
- Experimental features: No experiment requirement detected in the inspected files.
- Achievements: Unknown / needs confirmation.
- Verification: Source created, not tested in game.

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

Minecraft Bedrock add-on, ALN:SpawnControl Bedrock mod, mob spawn whitelist, custom mob toggle, spawn control book, Minecraft PE survival, MCPEDL add-on, CurseForge Bedrock, ALNStudios.

