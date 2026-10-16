# Alphabet Scavenger Hunt Challenge — Fast-Paced Survival Minigame

![MCPEDL](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/script/Alphabet-Scavenger-Hunt/1791906906852.jpg "MCPEDL")

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21.0%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Achievement Friendly](https://img.shields.io/badge/Achievements-Friendly-brightgreen?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![No Experiments Required](https://img.shields.io/badge/Experimental%20Features-NOT%20REQUIRED-success?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCPACK-orange?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/tree/main/MCPEDL/script#available-scripts)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20PC%20%7C%20Console%20%7C%20Realms-yellow?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

**By AllensCreations**

**20-ROUND SURVIVAL SCAVENGER CHALLENGE & INVENTORY GAUNTLET**

Scavenge items matching randomly assigned target letters under strict 60-second timers or suffer progressive health penalties.

---

## Overview

![Alphabet Scavenger Hunt Banner](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/script/Alphabet-Scavenger-Hunt/1791906974481.jpg)

Can you think on your feet and scavenge your surroundings under immense pressure?

**Alphabet Scavenger Hunt** is an intense, fast-paced survival minigame challenge for Minecraft Bedrock Edition. In each round, the game randomly chooses a balanced letter from the alphabet. You have exactly **60 seconds** to craft, mine, gather, or locate an item in your inventory whose name begins with that letter.

Items are verified automatically in real-time, recognizing both common and formal item names (such as Cooked Beef matching both B for Beef and S for Steak).

Succeed, and you earn an intermission to prepare for the next round. Fail, and you suffer an un-regenerable maximum health penalty that stacks with each failure until your vitality is depleted.

No experimental features required. Designed to keep achievements available while challenging your survival skills across solo worlds and multiplayer Realms.

---

## Key Features

| Feature | Description |
| :--- | :--- |
| 20-Round Gauntlet | Conquer 20 progressive rounds to claim ultimate victory with celebratory fireworks and fanfares. |
| Balanced Letter Selection | Letter pools exclude impossible early-game letters (e.g., X, Z) to keep survival gameplay fast and fair. |
| 60-Second Timers | Fast-paced countdown per round with dynamic audio cues signaling urgency. |
| 30-Second Intermissions | Earned rest period after successful rounds to organize inventory, smelt ores, or explore terrain. |
| Real-Time Top HUD | Non-intrusive action bar display showing active round, target letter, countdown timer, and penalty state. |
| Instant Inventory Verification | Scans inventory slots continuously and recognizes colloquial, formal, and compound item names. |
| Stacking Health Decay | Failing a round penalizes your maximum health by -2 HP (1 full heart) until run reset. |
| Mobile & Console Friendly | Gesture activation (crouch + interact with compass, clock, or stick) allows controls without typing. |

---

## How It Works

| Action / Event | Trigger | In-Game Result |
| :--- | :--- | :--- |
| Start Run | World load + 15s or `/scriptevent scavenger:start` | Initializes round 1, announces first letter, and starts 60s timer. |
| Match Found | Item with target initial in inventory | Plays level-up fanfare, displays chat confirmation, and awards 30s rest. |
| Timer Depletion | 60 seconds expire without match | Inflicts -2 Max HP penalty, plays failure cue, and advances to next letter. |
| Intermission End | 30 seconds rest period expires | Announces next target letter and starts fresh 60s countdown. |
| Victory Run | Complete round 20 | Triggers victory announcement, firework celebrations, and restores max health. |
| Vitality Depletion | Max HP reaches 0 from failures | Ends challenge run with fail summary and prompts reset. |

---

## Game Controls and Commands

- **Automatic Start**: The challenge begins automatically 15 seconds after entering the world.
- **Item Gesture (Mobile & Console Friendly)**: Hold any Compass, Clock, or Stick, crouch, and interact to start or inspect the run without typing.
- **Native Commands**:
  - `/scriptevent scavenger:start` - Starts a fresh 20-round run.
  - `/scriptevent scavenger:reset` - Resets the run and restores full health.
  - `/scriptevent scavenger:status` - Displays current round, target letter, and remaining time.
- **Chat Commands**: Type `!start` or `start` in chat.

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
