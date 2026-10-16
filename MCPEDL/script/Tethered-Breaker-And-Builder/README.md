# Tethered: Breaker and Builder — Asymmetric Two-Player Co-op Challenge

![MCPEDL](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/script/Tethered-Breaker-And-Builder/pack_icon.png "MCPEDL")

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21.0%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Script API](https://img.shields.io/badge/Script%20API-%40minecraft%2Fserver%201.13.0%2B-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Achievement Friendly](https://img.shields.io/badge/Achievements-Friendly-brightgreen?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![No Experiments Required](https://img.shields.io/badge/Experimental%20Features-NOT%20REQUIRED-success?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCPACK-orange?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/tree/main/MCPEDL/script#available-scripts)
[![Release](https://img.shields.io/badge/Release-v1.0.5-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/tree/main/MCPEDL/script#available-scripts)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20PC%20%7C%20Console%20%7C%20Realms-yellow?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

**By AllensCreations**

**ASYMMETRIC TWO-PLAYER CO-OP & DYNAMIC ENERGY LEASH CHALLENGE**

Survive as partners bound by a 15-meter elastic energy leash with divided mining and building roles.

---

## Overview

Can you and your partner survive when neither of you can play the game alone?

**Tethered: Breaker & Builder** connects two players with a dynamic energy leash that limits your separation to **15 meters**. One player is the **Breaker**, possessing the exclusive ability to mine blocks and fight off hostile mobs, but completely forbidden from placing blocks or fluids. The other is the **Builder**, possessing the exclusive power to construct structures, place fluids, and craft utilities, but unable to break a single block or strike an enemy.

Stray too far, and the elastic tether pulls you back inward. Overstretch past 18 meters, and the strain inflicts continuous damage until you regroup.

No experimental features required. Designed to keep achievements available while challenging your teamwork across standard worlds and multiplayer Realms.

---

## Key Features

| Feature | Description |
| :--- | :--- |
| 15-Meter Energy Leash | Connects two players with dynamic elastic physics, tethering movement to a 15-meter operational radius. |
| Asymmetric Role Division | Distributes survival capabilities strictly between the Breaker (mining/combat) and the Builder (construction/crafting). |
| Ground Anchor Physics | When one partner falls off cliffs or is thrown airborne, the grounded partner anchors them safely back up. |
| 4-Tier Tension States | Real-time particle and audio cues signal Slack (<10m), Tense (10-15m), Overstretched (15-18m), and Strain (>18m). |
| Real-Time Distance HUD | Action bar displays live separation distance in meters with clear color-coded indicators. |
| Co-op Respawn & Re-anchor | Respawning partners automatically reunite directly with their teammate with temporary protective buffs. |
| Clean Role Selection GUI | Interactive pop-up dialog opens on world join for instant role assignments without commands. |

---

## Role Division and Abilities

| Role | Permitted Actions | Restricted Actions |
| :--- | :--- | :--- |
| **The Breaker** | Mining, digging, block harvesting, melee weapon combat, bows, tridents, and mob defense. | Cannot place blocks, cannot place fluids (water/lava), cannot ignite flint & steel. |
| **The Builder** | Block placement, structure construction, fluid placement, crafting table/furnace management. | Cannot break or mine blocks, cannot attack or damage hostile/passive mobs. |

---

## Leash Distance and Tension States

| Distance | Leash Status | Visual & Audio Effects | In-Game Mechanics |
| :--- | :--- | :--- | :--- |
| **< 10 meters** | Slack (Safe) | Green sparkle particles | Unrestricted movement within safe perimeter. |
| **10 – 15 meters** | Tense (Warning) | Golden spark particles | Warning audio cues signal perimeter boundary. |
| **15 – 18 meters** | Overstretched (Pull) | Flame particles & tension sound | Elastic spring force reels partners back inward. |
| **> 18 meters** | Critical Strain | Heavy flame effects & alarm | Continuous strain damage until players regroup. |

---

## Admin Commands

Operators can manage role assignments using native commands:
- `/scriptevent tether:start` - Opens the role selection dialog for all players.
- `/scriptevent tether:breaker` - Assigns the executing player to the Breaker role.
- `/scriptevent tether:builder` - Assigns the executing player to the Builder role.
- `/scriptevent tether:reset` - Clears all role assignments.

---

## Compatibility

- Minecraft Bedrock Edition 1.21.0+
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
