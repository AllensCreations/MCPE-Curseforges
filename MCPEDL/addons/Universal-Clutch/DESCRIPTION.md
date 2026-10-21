# Universal Clutch (v1.0.2) — Intelligent Fall Mitigation Add-on by AllensCreations

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21.0%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCPACK-orange?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/tree/main/MCPEDL/addons#available-add-ons)

**By AllensCreations**

Explore more creations: [CurseForge Profile](https://www.curseforge.com/members/allenscreations/projects) · [MCPEDL Profile](https://mcpedl.com/user/allenscreations/)

**AUTOMATIC CLUTCH SYSTEM & FALL PROTECTION UTILITY**

Dynamic clutch execution system that automatically places lifesavers when falling from dangerous heights, featuring predictive impact timing, arm swing animations, multi-item support, native waterlogging, and automatic water scooping.

---

## Overview

Universal Clutch provides a vanilla-faithful safety mechanic for Minecraft Bedrock players. Powered by the modern Minecraft Bedrock mechanics, the system continuously calculates player trajectory, downward velocity, and pitch angle during freefall.

When aiming down and falling beyond the configured block height threshold, the add-on predicts impact 1 to 2 ticks ahead of ground contact, triggers an authentic arm swing animation with placement audio, deploys the appropriate clutch item from your mainhand or offhand, and automatically re-scoops placed water upon touchdown.

---

## Key Features

### Multi-Item Clutch Support
- **Description**: Automatically identifies and uses Water Buckets, Powder Snow Buckets, Twisted Vines, Hay Bales, Cobwebs, Slime Blocks, Scaffolding, Boats/Rafts, or Sweet Berries.

### Dimension-Aware Clutches
- **Description**: Automatically disables evaporating Water Buckets in the Nether, prioritizing Twisted Vines & Powder Snow Buckets instead.

### Dual Hand & Inventory Detection
- **Description**: Evaluates mainhand items first, with failover to offhand, hotbar, and upper inventory.

### Totem of Undying Fail-Safe
- **Description**: When falling to certain death with no clutch item, automatically searches inventory and equips a Totem of Undying into the offhand slot before impact.

### Authentic Boat Placement
- **Description**: Spawns the boat at maximum player reach distance (~4.5 blocks) first, then seats the player with a slight delay upon touchdown. Strictly no teleportation.

### 1-2 Tick Impact Prediction
- **Description**: Uses velocity-based vertical raycasting to trigger placements 1 to 2 ticks before ground impact rather than snapping prematurely.

### Arm Placement Animation
- **Description**: Triggers vanilla arm swing animations (`animation.player.attack_bare_hand`) synced directly to placement audio.

### Native Waterlogged Handling
- **Description**: Detects stairs, slabs, fences, walls, and trapdoors beneath the player and applies native `{ waterlogged: true }` states without destroying structures.

### Automatic Scoop with Fire Check
- **Description**: Automatically retrieves placed water or powder snow 3 ticks after touchdown; verifies powder snow wasn't consumed to extinguish fire before re-scooping.

---

## Supported Clutch Items and Behaviors

### Water Bucket
- **Identifier**: `minecraft:water_bucket`
- **Placement Target**: Surface (waterlog) or Impact Air
- **Mechanical Effect**: Negates fall damage; auto-scooped 3 ticks after landing (disabled in Nether)
- **Placement Sound**: `bucket.empty_water`

### Powder Snow Bucket
- **Identifier**: `minecraft:powder_snow_bucket`
- **Placement Target**: Impact Air Block
- **Mechanical Effect**: Absorbs fall damage; auto-scooped 3 ticks after landing (unless melted by fire)
- **Placement Sound**: `bucket.empty_powder_snow`

### Twisted Vines
- **Identifier**: `minecraft:twisted_vines`
- **Placement Target**: Top Face of Solid Ground Block
- **Mechanical Effect**: Nether-native climbing vine; resets vertical momentum and absorbs fall damage
- **Placement Sound**: `dig.grass`

### Hay Bale
- **Identifier**: `minecraft:hay_block`
- **Placement Target**: Impact Air Block
- **Mechanical Effect**: Reduces fall damage by 80% upon touchdown
- **Placement Sound**: `dig.grass`

### Cobweb
- **Identifier**: `minecraft:web`
- **Placement Target**: Impact Air Block
- **Mechanical Effect**: Decelerates player velocity and completely negates fall damage
- **Placement Sound**: `dig.cloth`

### Slime Block
- **Identifier**: `minecraft:slime`
- **Placement Target**: Impact Air Block
- **Mechanical Effect**: Completely eliminates fall damage and bounces player upward
- **Placement Sound**: `block.slime_block.place`

### Scaffolding
- **Identifier**: `minecraft:scaffolding`
- **Placement Target**: Impact Air Block
- **Mechanical Effect**: Traverses falling entity momentum and absorbs fall damage
- **Placement Sound**: `block.scaffolding.place`

### Boat / Raft
- **Identifier**: Any `*_boat` / `*_raft`
- **Placement Target**: Impact Air Coordinate
- **Mechanical Effect**: Placed at max reach distance (~4.5 blocks) first, auto-riding player with slight delay
- **Placement Sound**: `step.wood`

### Sweet Berries
- **Identifier**: `minecraft:sweet_berries`
- **Placement Target**: Impact Air Block
- **Mechanical Effect**: Places sweet berry bush to decelerate and cancel fall damage
- **Placement Sound**: `block.sweet_berry_bush.place`

### Totem of Undying
- **Identifier**: `minecraft:totem_of_undying`
- **Placement Target**: Offhand Slot (Emergency Swap)
- **Mechanical Effect**: Auto-equipped when falling with no clutch items to guarantee survival
- **Placement Sound**: `armor.equip_generic`

---

## Activation Conditions

All four conditions must be met simultaneously for clutch placement to trigger:

1. **Player Pitch Angle:** The player must be actively looking downward (`pitch >= 65 degrees`). Looking horizontally or upward prevents unwanted placements.
2. **Freefall State:** The player must be in a freefall state (`player.isFalling === true` or downward velocity `<= -0.6 blocks/tick`).
3. **Fall Height Threshold:** Total fallen distance must equal or exceed the subpack threshold (`player.fallDistance >= threshold`).
4. **Trajectory Timing:** The player's vertical position must be within 1 to 2 ticks of ground impact based on current downward velocity (`distance <= fallSpeed * 1.8 + 0.3`).

---

## Operating Modes & Subpack Configuration

Universal Clutch supports three distinct operating modes selectable via subpack settings slider in World Settings or customizable per-player in-game:

### Operating Modes

- **Full Mode (Auto-Switch Inventory):**
  If a clutch item is not already held in hand, the system automatically scans your hotbar and upper inventory for available clutch items, switches or swaps it directly into your active hand, executes the clutch placement, and remains holding the switched item. Requires the player to aim downward (`pitch >= 55°`).
- **Simple Mode (Held Item Only):**
  Clutch placements only trigger if you are actively holding a supported clutch item in your mainhand or offhand slot. If holding a sword, pickaxe, or empty hand, no placement will occur. Requires the player to aim downward (`pitch >= 55°`).
- **Extreme Mode (Auto Smooth Look-Down & Auto-Switch):**
  When falling from dangerous heights, the add-on automatically and smoothly tilts the player's camera pitch downward toward the impact surface, scans and auto-switches to the best available clutch item in inventory, places it 1–2 ticks before impact, and remains holding the switched item. **Doom Condition:** If there is no clutch item available anywhere in your inventory or hands, the system will *not* adjust your camera and will *not* intervene—allowing you to plummet to your doom.

### Built-in Subpack Presets

Configurable via the Behavior Pack subpack settings slider in World Settings:

1. **Full Mode (Auto-Switch Inventory):** Recommended default. Automatically detects, equips, and places clutch items from inventory, keeping the switched item active.
2. **Simple Mode (Held Item Only):** Traditional manual clutching. Only executes if a supported clutch item is already held in mainhand or offhand.
3. **Extreme Mode (Auto Smooth Look-Down & Auto-Switch):** Hands-free safety system with auto smooth camera rotation and auto item switching. If inventory has no clutch item, doom is guaranteed.

### In-Game Tag Overrides

Individual players can customize their personal settings on multiplayer servers without modifying world settings:
- Toggle Full Mode: `/tag @s add clutch_mode:full`
- Toggle Simple Mode: `/tag @s add clutch_mode:simple`
- Toggle Extreme Mode: `/tag @s add clutch_mode:extreme`
- Custom Height Threshold: `/tag @s add clutch_threshold:12`

---

## Highlights & Performance

- **Responsive Clutch Engine**: High-precision impact calculation prevents fatal fall damage right before hitting the ground.
- **Survival Balanced**: Consumes clutch items faithfully from your inventory or hand in Survival and Adventure modes.
- **Waterlogging Support**: Supports clutching onto waterloggable blocks without awkward water spilling.
- **Anti-Spam Cooldown**: Built-in placement cooldown guarantees one clean clutch per fall.

---

## Compatibility

- Minecraft Bedrock Edition 1.21.0+
- Compatible with Bedrock 1.21.50+ and 1.26.0+ releases
- Enable Beta APIs in World Settings
- Multiplayer ready with per-player tracking and isolated execution states

---

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.

---

## Search & Discovery Keywords

Universal Clutch Minecraft Bedrock, Multi-Item Clutch Support Bedrock, Dimension-Aware Clutches Bedrock, Dual Hand & Inventory Detection Bedrock, Totem of Undying Fail-Safe Bedrock, Minecraft PE survival, MCPEDL, CurseForge Bedrock, AllensCreations.
