# Tethered: Breaker & Builder

![MCPEDL](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/script/Tethered-Breaker-And-Builder/pack_icon.png "MCPEDL")

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21%20--%201.26%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Release](https://img.shields.io/badge/Release-v1.0.0-blue?style=flat-square)](../README.md#available-challenge-scripts)
[![Format](https://img.shields.io/badge/Format-.MCPACK-orange?style=flat-square)](../README.md#available-challenge-scripts)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20PC%20%7C%20Console%20%7C%20Realms-yellow?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

Creator: AllensCreations  
Description: Two-player asymmetric co-op challenge where partners are tethered by an elastic energy leash with separated mining and building abilities.

---

## About The Minigame

Can you and your partner survive when neither of you can play the game alone?

**Tethered: Breaker & Builder** connects two players with a dynamic, physical energy leash that limits your separation to **15 meters**. One player is the **Breaker**, possessing the exclusive ability to mine blocks and fight off hostiles, but completely forbidden from placing blocks or fluids. The other is the **Builder**, possessing the exclusive power to build, place fluids, and craft utilities, but unable to break a single block or strike an enemy.

Stray too far, and the elastic tether violently reels you back inward. Overstretch past 18 meters, and the strain inflicts continuous damage until you regroup!

---

## Core System Mechanics

### 1. Dynamic Leash Physics (Anchor-Aware Elastic Spring)
- **15-Meter Leash Limit:** Partners can roam freely up to 15 meters from each other.
- **Color-Coded Particle Connection:**
  - **Slack (< 10m):** Green sparkles (`minecraft:villager_happy`) indicating safe proximity.
  - **Tense (10–15m):** Golden electric sparks (`minecraft:electric_spark_particle`) warning of approaching limits.
  - **Overstretched (> 15m):** Bright red flames (`minecraft:basic_flame_particle`), warning audio cues, and an elastic spring force.
- **Anchor Logic:** If one partner falls off a cliff or is knocked back into the air while the other stands on solid ground, the grounded partner acts as a solid anchor, safely reeling the airborne partner back up.
- **Strain Damage (> 18m):** If players are separated past 18 meters, both suffer 2 points of damage (1 full heart) every second until they regroup.

---

### 2. Asymmetric Roles
- **Interactive Role Picker UI:** Upon joining the world, players receive a modal dialog form to choose their preferred role.
- **The Breaker:**
  - Mines and breaks blocks freely.
  - Exclusive access to melee weapons and mob combat.
  - CANNOT place blocks, fluids (water/lava buckets), or ignite fires.
- **The Builder:**
  - Places blocks and fluids freely.
  - Exclusive access to utility crafting stations, furnaces, and building.
  - CANNOT break blocks and CANNOT attack mobs or players.

---

### 3. Co-op Respawn & Re-anchor
- If either partner dies during the adventure, upon respawning they automatically teleport directly to their surviving teammate with 5 seconds of Resistance V and Regeneration II to maintain the tether connection without breaking across dimensions.

---

### 4. Persistent HUD Action Bar
- Live metric readout at the top of the screen:
  - `[LEASH: SLACK] Distance: 5.4m` (when < 10m)
  - `[LEASH: TENSE] Distance: 12.8m` (when 10–15m)
  - `[LEASH: OVERSTRETCHED] Distance: 16.3m!` (when > 15m)

---

## How to Apply and Activate (Experiments Guide)

Because this minigame uses the Bedrock Script API (`@minecraft/server` and `@minecraft/server-ui`), follow these activation steps:

### 1. Apply the Behavior Pack
1. In Minecraft Bedrock, open your World Settings (or create a New World).
2. Scroll down on the left menu to **Behavior Packs**.
3. Under **Available**, locate **Tethered: Breaker & Builder BP by AllensCreations** and click **Activate**.

### 2. Enable Experimental Toggles
4. Scroll down on the left menu to **Experiments**.
5. Toggle **ON** the following switch:
   - **Beta APIs** -> **Turn ON** *(Required to enable the Script API JavaScript engine)*.
6. Click **Play** or **Create**! Both players will receive the role selection dialog upon joining.

---

## Admin Commands

Operators can use `/scriptevent` commands to manage roles:
- `/scriptevent tether:start` -- Re-opens the role selection dialog for all players.
- `/scriptevent tether:breaker` -- Assigns the executing player to Breaker.
- `/scriptevent tether:builder` -- Assigns the executing player to Builder.
- `/scriptevent tether:reset` -- Clears all role assignments.

---

## Terms of Use and Guidelines

- **Creator Attribution:** Created by **AllensCreations**.
- **Rights & Reservation:** All rights reserved for AllensCreations.
- **Content Creators (YouTube, TikTok, Twitch):** You are 100% welcome to showcase this challenge in videos, live streams, and speedruns! Please include credit to **AllensCreations** and link to the official download page or this GitHub repository.
- **No Direct Re-uploading:** Do not re-upload this pack, its individual files, or modified copies to any website, app store, or file-sharing service.
- **No Paywalls or Link Shorteners:** It is strictly prohibited to distribute this pack behind paywalls, ad-gate links (e.g., AdFly, Linkvertise, Boost.ink), or paid monetization walls.
- **Server and Realm Use:** You are free to use this challenge pack on your personal worlds, private servers, and Bedrock Realms.

---

© All rights reserved for AllensCreations.

