# Alphabet Scavenger Hunt Challenge — Fast-Paced Survival Minigame

![MCPEDL](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/script/Alphabet-Scavenger-Hunt/1791906906852.jpg "MCPEDL")

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21%20--%201.26%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Achievement Friendly](https://img.shields.io/badge/Achievements-Friendly-brightgreen?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![No Experiments Required](https://img.shields.io/badge/Experimental%20Features-NOT%20REQUIRED-success?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Release](https://img.shields.io/badge/Release-v1.0.4-blue?style=flat-square)](../README.md#available-challenge-scripts)
[![Format](https://img.shields.io/badge/Format-.MCPACK-orange?style=flat-square)](../README.md#available-challenge-scripts)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20PC%20%7C%20Console%20%7C%20Realms-yellow?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

**By AllensCreations**

**NO EXPERIMENTAL NEED & ACHIEVEMENT FRIENDLY**

High-stakes 20-round survival challenge to find items matching the target letter before time runs out.

---

## Overview

![Alphabet Scavenger Hunt Banner](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/script/Alphabet-Scavenger-Hunt/1791906974481.jpg)

Can you think on your feet and scavenge your surroundings under immense pressure?

**Alphabet Scavenger Hunt** is an intense, fast-paced survival minigame challenge for Minecraft Bedrock. In each round, the game randomly chooses a balanced letter from the alphabet. You have exactly **60 seconds** to craft, mine, gather, or locate an item in your inventory whose name begins with that letter.

Items are verified automatically in real-time, recognizing both common and formal item names (such as Cooked Beef matching both B for Beef and S for Steak).

Succeed, and you earn an intermission to prepare for the next round. Fail, and you suffer a permanent health penalty that stacks with each failure until your vitality is depleted.

No experimental features required. Designed to keep achievements available while challenging your survival skills across worlds and Realms.

---

## Core Rules and Mechanics

### 1. 20-Round Gauntlet
- **Total Rounds**: Survive and conquer **20 progressive rounds** to claim ultimate victory.
- **Fair Letter Balancing**: Letters that are impossible or excessively tedious in early survival are excluded to keep gameplay fast, fun, and strategic.
- **Round Intermission**: Completing a round grants a **30-second rest period** to organize your inventory, smelt ores, or explore terrain before the next letter.

### 2. Top-Of-Screen Objective Display
- **Clean Vision**: The current challenge objective, target letter, countdown timer, and health status are displayed cleanly at the top of your screen.
- **Zero Screen Obstruction**: Never blocks your crosshair or view during intense survival moments.
- **Live Tracker**:
  - Round Counter (e.g., `Round 5/20`)
  - Target Letter (e.g., `Letter: [ C ]`)
  - Live Countdown Timer with sound warning cues
  - Real-time penalty indicator

### 3. Instant Inventory Verification
- Scans inventory slots and held items continuously.
- Recognizes all common item names, compound words, and custom anvil names.
- Upon finding a matching item:
  - Plays a triumphant level-up fanfare.
  - Displays confirmation in chat announcing the discovered item.
  - Automatically advances your progress and begins intermission.

### 4. Health Decay Penalty
- If the **60-second timer reaches 0** before acquiring a matching item:
  - Suffer an un-regenerable maximum health penalty (-2 Max HP / 1 full heart per failure).
  - Health ceiling is clamped until the run is reset or completed.
  - If cumulative penalties reduce your vitality to zero, the challenge ends.

### 5. Victory Celebration
- Successfully conquer all **20 rounds** to achieve ultimate victory with celebratory fireworks, fanfares, and announcements.

---

## Game Controls

- **Automatic Start**: The challenge begins automatically 15 seconds after entering the world.
- **Item Gesture (Mobile & Console Friendly)**: Hold any Compass, Clock, or Stick, crouch, and interact to start or inspect the run without typing.
- **Commands**:
  - `/scriptevent scavenger:start` - Starts a fresh 20-round run.
  - `/scriptevent scavenger:reset` - Resets the run and restores full health.
  - `/scriptevent scavenger:status` - Displays current round, target letter, and remaining time.
- **Chat**: Type `!start` or `start` in chat.

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
