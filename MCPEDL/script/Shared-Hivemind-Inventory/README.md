# Shared Hivemind Inventory — Synchronized Team Co-op Minigame

![MCPEDL](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/script/Shared-Hivemind-Inventory/pack_icon.png "MCPEDL")

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21%20--%201.26%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Achievement Friendly](https://img.shields.io/badge/Achievements-Friendly-brightgreen?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![No Experiments Required](https://img.shields.io/badge/Experimental%20Features-NOT%20REQUIRED-success?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Release](https://img.shields.io/badge/Release-v1.0.5-blue?style=flat-square)](../README.md#available-challenge-scripts)
[![Format](https://img.shields.io/badge/Format-.MCPACK-orange?style=flat-square)](../README.md#available-challenge-scripts)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20PC%20%7C%20Console%20%7C%20Realms-yellow?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

**By AllensCreations**

**NO EXPERIMENTAL NEED & ACHIEVEMENT FRIENDLY**

Real-time multiplayer synchronization challenge where all connected players share one unified inventory.

---

## Overview

What happens when your entire survival team shares a single brain and a single backpack?

**Shared Hivemind Inventory** synchronizes all 36 main inventory slots, hotbar selections, and offhand slots across every player in your world in real-time. When one player mines diamond ore, it appears instantly in every teammate's inventory. When someone eats food, the stack depletes for the whole party. When an ally crafts new gear, anyone can immediately equip it.

Engineered with built-in loop protection and duplication safeguards, the pack delivers instant synchronization without item duplication or inventory desync.

No experimental features required. Designed to keep achievements available while testing your team's co-op communication across worlds and Realms.

---

## Core System Mechanics

### 1. Real-Time Inventory Synchronization
- **Complete Slot Mirroring**: Synchronizes all 36 main storage slots (hotbars and main inventory) plus offhand shield and totem slots.
- **Instant Mirroring**: Changes made by any player mirror across all online teammates with zero perceived delay.
- **Loop Protection**: Built-in update safeguards prevent circular syncing and duplication exploits.
- **Item Preservation**: Retains exact durability damage, custom anvil names, lore text, and enchantments across transfers.

### 2. Drop Safety and Anti-Duplication
- **Immediate Item Deduction**: Dropping or throwing an item instantly updates the shared inventory so teammates cannot produce ghost duplicates.
- **Conflict Resolution**: Simultaneous actions on the same slot resolve cleanly, preventing lost or corrupted items.
- **Smooth Reconnection**: Teammates joining or reconnecting are immediately synced to the team inventory state.

### 3. Unified Team Wipe Mechanic
- **Physical Spot Drop**: When any teammate dies, the shared inventory drops at that exact coordinate and dimension.
- **On-Screen Coordinate Alert**: Alerts the entire team with on-screen notifications displaying the dimension and coordinates where the loot dropped.
- **Clear Resets**: Prevents confusing duplicate item spawns on death.

### 4. Top-Of-Screen HUD Indicator
- Displays a clean status indicator at the top of your screen:
  `[ HIVEMIND ACTIVE ] Shared Slots: Synchronized`
- During a teammate death, dynamically indicates the recovery coordinates so the team can quickly regroup.

---

## Admin Commands

Operators can manage the shared inventory using native commands:
- `/scriptevent hivemind:sync` - Force resynchronizes all online players to the current shared state.
- `/scriptevent hivemind:status` - Displays online player count and shared storage status.
- `/scriptevent hivemind:clear` - Wipes the shared inventory across all players.

---

## Compatibility

- Minecraft Bedrock Edition 1.21.0 - 1.26+
- No experimental features required
- Designed to preserve achievement eligibility
- Script Behavior Pack (.mcpack) format
- Compatible with Mobile, Windows, Console, and Realms

---

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.
