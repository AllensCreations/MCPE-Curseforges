# Universal Clutch — Intelligent Fall Mitigation Add-on for Minecraft Bedrock

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21.0%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Achievement Friendly](https://img.shields.io/badge/Achievements-Friendly-brightgreen?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Script API](https://img.shields.io/badge/Script%20API-%40minecraft%2Fserver%201.13.0%2B-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCADDON-orange?style=flat-square)](../README.md#available-source-add-ons)
[![Release](https://img.shields.io/badge/Release-v1.0.0-blue?style=flat-square)](../README.md#available-source-add-ons)

**By AllensCreations**

**AUTOMATIC CLUTCH SYSTEM & FALL PROTECTION UTILITY**

Dynamic clutch execution system that automatically places lifesavers when falling from dangerous heights, featuring predictive impact timing, arm swing animations, multi-item support, native waterlogging, and automatic water scooping.

---

## Overview

Universal Clutch provides a vanilla-faithful safety mechanic for Minecraft Bedrock players. Powered by the Bedrock Script API (`@minecraft/server` v1.13.0+), the system continuously calculates player trajectory, downward velocity, and pitch angle during freefall.

When aiming down and falling beyond the configured block height threshold, the add-on predicts impact 1 to 2 ticks ahead of ground contact, triggers an authentic arm swing animation with placement audio, deploys the appropriate clutch item from your mainhand or offhand, and automatically re-scoops placed water upon touchdown.

---

## Key Features

| Feature | Description |
| :--- | :--- |
| **Multi-Item Clutch Support** | Automatically identifies and uses Water Buckets, Hay Bales, Cobwebs, Slime Blocks, Ladders, Boats/Rafts, or Sweet Berries. |
| **Dual Hand Detection** | Evaluates mainhand items first, with automatic failover to the offhand slot. |
| **1-2 Tick Impact Prediction** | Uses velocity-based vertical raycasting to trigger placements 1 to 2 ticks before ground impact rather than snapping prematurely. |
| **Arm Placement Animation** | Triggers vanilla arm swing animations (`animation.player.attack_bare_hand`) synced directly to placement audio. |
| **Native Waterlogged Handling** | Detects stairs, slabs, fences, walls, and trapdoors beneath the player and applies native `{ waterlogged: true }` states without destroying structures. |
| **Automatic Water Re-Scoop** | Automatically retrieves placed water 3 ticks after player touchdown, restoring an empty bucket into a water bucket. |
| **Subpack Height Configuration** | Configurable via Behavior Pack subpack settings: Default (8+ blocks), Careful (12+ blocks), and Extreme (20+ blocks). |

---

## Supported Clutch Items and Behaviors

| Item | Identifier | Placement Target | Mechanical Effect | Placement Sound |
| :--- | :--- | :--- | :--- | :--- |
| **Water Bucket** | `minecraft:water_bucket` | Surface (waterlog) or Impact Air | Negates fall damage; auto-scooped 3 ticks after landing | `bucket.empty_water` |
| **Hay Bale** | `minecraft:hay_block` | Impact Air Block | Reduces fall damage by 80% upon touchdown | `dig.grass` |
| **Cobweb** | `minecraft:web` | Impact Air Block | Decelerates player velocity and completely negates fall damage | `dig.cloth` |
| **Slime Block** | `minecraft:slime` | Impact Air Block | Completely eliminates fall damage and bounces player upward | `block.slime_block.place` |
| **Ladder** | `minecraft:ladder` | Adjacent Solid Wall | Detects adjacent vertical wall face and mounts facing outward | `block.ladder.place` |
| **Boat / Raft** | Any `*_boat` / `*_raft` | Impact Air Coordinate | Summons boat entity at target position to absorb impact | `step.wood` |
| **Sweet Berries** | `minecraft:sweet_berries` | Impact Air Block | Places sweet berry bush to decelerate and cancel fall damage | `block.sweet_berry_bush.place` |

---

## Activation Conditions

All four conditions must be met simultaneously for clutch placement to trigger:

1. **Player Pitch Angle:** The player must be actively looking downward (`pitch >= 65 degrees`). Looking horizontally or upward prevents unwanted placements.
2. **Freefall State:** The player must be in a freefall state (`player.isFalling === true` or downward velocity `<= -0.6 blocks/tick`).
3. **Fall Height Threshold:** Total fallen distance must equal or exceed the subpack threshold (`player.fallDistance >= threshold`).
4. **Trajectory Timing:** The player's vertical position must be within 1 to 2 ticks of ground impact based on current downward velocity (`distance <= fallSpeed * 1.8 + 0.3`).

---

## Operating Modes & Subpack Configuration

Universal Clutch supports two distinct operating modes selectable via subpack settings or customizable per-player in-game:

### Operating Modes

- **Full Mode (Auto-Switch Inventory):**
  If a clutch item is not already held in hand, the system automatically scans your hotbar and upper inventory for available clutch items (Water Bucket > Slime > Cobweb > Hay Bale > Boat > Ladder > Sweet Berries), switches or swaps it directly into your active hand, executes the clutch placement, and automatically restores your previously held item upon landing.
- **Simple Mode (Held Item Only):**
  Clutch placements only trigger if you are actively holding a supported clutch item in your mainhand or offhand slot. If holding a sword, pickaxe, or empty hand, no placement will occur.

### Built-in Subpack Presets

Configurable via the Behavior Pack settings slider in World Settings:

1. **Full Mode (Auto-Switch Inventory - 8+ Blocks):** Recommended default. Automatically equips clutch items from inventory on 8+ block falls.
2. **Simple Mode (Held Item Only - 8+ Blocks):** Classic manual clutching for 8+ block falls.
3. **Full Mode - Careful (Auto-Switch - 12+ Blocks):** Auto-switches only during deeper falls of 12+ blocks.
4. **Simple Mode - Careful (Held Item Only - 12+ Blocks):** Manual held-item clutching for 12+ block falls.
5. **Full Mode - Extreme (Auto-Switch - 20+ Blocks):** Emergency auto-switch reserved for lethal falls of 20+ blocks.
6. **Simple Mode - Extreme (Held Item Only - 20+ Blocks):** Emergency held-item clutching for lethal falls of 20+ blocks.

### In-Game Tag Overrides

Individual players can customize their personal settings on multiplayer servers without modifying world settings:
- Toggle Full Mode: `/tag @s add clutch_mode:full`
- Toggle Simple Mode: `/tag @s add clutch_mode:simple`
- Custom Height Threshold: `/tag @s add clutch_threshold:15`

---

## Technical Specifications

- **Script API Version:** `@minecraft/server` v1.13.0+
- **Update Frequency:** Runs on `system.runInterval` every 1 tick for responsive collision detection.
- **Debounce Window:** 25-tick cooldown prevents duplicate placements within a single fall trajectory.
- **Gamemode Integrity:** In Survival and Adventure modes, single-use blocks and boat items are consumed from the active hand stack; in Creative mode, items remain infinite.
- **Waterlogging Logic:** Natively resolves `BlockPermutation.withState("waterlogged", true)` on compatible blocks.
- **Package Format:** Unified `.mcaddon` bundle containing Behavior Pack and Resource Pack.

---

## Compatibility

- Minecraft Bedrock Edition 1.21.0+
- Compatible with Bedrock 1.21.50+ and 1.26.0+ releases
- Requires Beta APIs / Script API capability enabled in world settings
- Compatible with Windows, Android, iOS, Xbox, PlayStation, and dedicated servers / Realms
- Multiplayer ready with per-player tracking and isolated execution states

---

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.
