# Tethered: Breaker & Builder — Asymmetric Two-Player Co-op Challenge

![MCPEDL](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/script/Tethered-Breaker-And-Builder/pack_icon.png "MCPEDL")

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21%20--%201.26%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Achievement Friendly](https://img.shields.io/badge/Achievements-Friendly-brightgreen?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![No Experiments Required](https://img.shields.io/badge/Experimental%20Features-NOT%20REQUIRED-success?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Release](https://img.shields.io/badge/Release-v1.0.4-blue?style=flat-square)](../README.md#available-challenge-scripts)
[![Format](https://img.shields.io/badge/Format-.MCPACK-orange?style=flat-square)](../README.md#available-challenge-scripts)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20PC%20%7C%20Console%20%7C%20Realms-yellow?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

**By AllensCreations**

**NO EXPERIMENTAL NEED & ACHIEVEMENT FRIENDLY**

Two-player asymmetric co-op challenge where partners are bound by an elastic energy leash with divided abilities.

---

## Overview

Can you and your partner survive when neither of you can play the game alone?

**Tethered: Breaker & Builder** connects two players with a dynamic energy leash that limits your separation to **15 meters**. One player is the **Breaker**, possessing the exclusive ability to mine blocks and fight off hostile mobs, but completely forbidden from placing blocks or fluids. The other is the **Builder**, possessing the exclusive power to construct structures, place fluids, and craft utilities, but unable to break a single block or strike an enemy.

Stray too far, and the elastic tether pulls you back inward. Overstretch past 18 meters, and the strain inflicts continuous damage until you regroup.

No experimental features required. Designed to keep achievements available while challenging your teamwork across worlds and Realms.

---

## Core System Mechanics

### 1. Dynamic Leash Mechanics
- **15-Meter Leash Limit**: Partners can explore freely within a 15-meter radius of each other.
- **Visual Status Cues**:
  - **Safe Proximity (< 10m)**: Green sparkle effects indicate safe distance.
  - **Tension Warning (10–15m)**: Golden spark effects signal you are nearing the leash boundary.
  - **Overstretched (> 15m)**: Flame effects, audio warnings, and elastic spring forces pull partners back together.
- **Anchor Physics**: If one partner falls off a cliff or is knocked airborne while the other stands on solid ground, the grounded partner acts as an anchor, safely reeling the airborne partner back up.
- **Strain Damage (> 18m)**: When separated past 18 meters, both partners suffer continuous damage until regrouping.

### 2. Asymmetric Roles
- **Interactive Role Dialog**: Upon joining the world, players receive a clean pop-up menu to select their role.
- **The Breaker**:
  - Mines, digs, and gathers blocks freely.
  - Exclusive access to melee weapons, bows, and mob combat.
  - Cannot place blocks, fluids (water/lava buckets), or light fires.
- **The Builder**:
  - Places blocks, building materials, and fluids freely.
  - Exclusive access to crafting stations, furnaces, and construction.
  - Cannot break blocks and cannot attack mobs.

### 3. Co-op Respawn & Re-anchor
- If either partner falls in battle, upon respawning they automatically reunite directly with their surviving teammate with temporary protection buffs to preserve the tether connection.

### 4. Real-Time HUD Indicator
- Displays live proximity feedback at the top of the screen:
  - `[LEASH: SLACK] Distance: 5.4m`
  - `[LEASH: TENSE] Distance: 12.8m`
  - `[LEASH: OVERSTRETCHED] Distance: 16.3m!`

---

## Admin Commands

Operators can manage role assignments using native commands:
- `/scriptevent tether:start` - Opens the role selection dialog for all players.
- `/scriptevent tether:breaker` - Assigns the executing player to the Breaker role.
- `/scriptevent tether:builder` - Assigns the executing player to the Builder role.
- `/scriptevent tether:reset` - Clears all role assignments.

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
