# Ghast Mob Head Transformers - Giant Flying Mob Heads Add-on

![MCPEDL](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/addons/Ghast-Head-Transformers/1791965821315.jpg?v=1791967147 "MCPEDL")

![MCPEDL](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/addons/Ghast-Head-Transformers/pack_icon.png?v=1791967147 "MCPEDL")

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21%20--%201.26%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Release](https://img.shields.io/badge/Release-v1.1.0-blue?style=flat-square)](../README.md#available-source-add-ons)
[![Format](https://img.shields.io/badge/Format-.MCADDON%20%7C%20.MCPACK-orange?style=flat-square)](../README.md#available-source-add-ons)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20PC%20%7C%20Console%20%7C%20Realms-yellow?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

Creator: AllensCreations  
Description: Transform vanilla Ghasts into giant flying mob heads by equipping vanilla skulls or custom heads, with charging faces and shearing drops.

---

## Overview

**Ghast Mob Head Transformers** allows players to interact with any vanilla Ghast while holding a mob skull or custom head item, instantly transforming the Ghast into a colossal, floating version of that mob's head.

The add-on retains 100% of the vanilla Ghast's survival hostility and flying combat mechanics: transformed Ghasts continue to roam the Nether skies, target players, and shoot explosive fireballs. When a transformed Ghast prepares to fire, its facial texture dynamically shifts into an angry, glowing, mouth-open charging expression.

Using a pair of **Shears** on a transformed Ghast removes the equipped head, plays the shears snip audio cue, drops the original skull item on the ground, and restores the Ghast back to its classic white tentacled form.

---

## Transformation Variants & Combat Abilities

Interact with any Ghast while holding one of the following items to initiate the transformation:

| Variant | Item Required | Transformed Entity | Attack Projectile & Fire Rate | Sound Cues (Equip, Charge & Hurt) | Shearing Drop |
| :---: | :--- | :--- | :--- | :--- | :--- |
| **0** | *(Default)* | Classic Vanilla Ghast | Giant Fireball (`minecraft:fireball`) [2.0s] | Classic Ghast scream & moan | None |
| **1** | `minecraft:skeleton_skull` | Giant Skeleton Head | Rapid Piercing Arrow (`minecraft:arrow`) [1.0s] | Skeleton rattle & bone snap | `minecraft:skeleton_skull` |
| **2** | `minecraft:wither_skeleton_skull` | Giant Wither Skeleton Head | Explosive Wither Skull (`minecraft:wither_skull`) [2.2s] | Deep soul rattle & wither launch | `minecraft:wither_skeleton_skull` |
| **3** | `minecraft:zombie_head` | Giant Zombie Head | Splash Poison Potion (`minecraft:splash_potion`) [1.6s] | Undead groans & zombie grunts | `minecraft:zombie_head` |
| **4** | `minecraft:player_head` | Giant Steve / Human Head | Knockback Wind Charge (`minecraft:wind_charge_projectile`) [1.4s] | Player hurt cue & wind burst | `minecraft:player_head` |
| **5** | `minecraft:creeper_head` | Giant Creeper Head | High-Explosive Fireball (`minecraft:fireball`) [2.5s] | **Terrifying Fuse Hiss (`random.fuse`)** | `minecraft:creeper_head` |
| **6** | `minecraft:piglin_head` | Giant Piglin Head | Rapid Blazing Fireballs (`minecraft:small_fireball`) [0.8s] | Angry Piglin snorts & grunts | `minecraft:piglin_head` |
| **7** | `custom:custom_head` | Giant Custom Head | Dragon Breath Fireball (`minecraft:dragon_fireball`) [3.0s] | Ender Dragon roar & dragon hit | `custom:custom_head` |

---

## Gameplay Mechanics

### 1. Equipping a Head
- Approach any Ghast and right-click or tap the **Equip Mob Head** interact button while holding a valid skull.
- Consumes 1 skull item from your hand.
- Triggers that specific mob's authentic audio cue and white smoke burst.
- Replaces the Ghast model with a full 3D head model (featuring 3D hat overlays, 3D Piglin snout, and 3D ears), cleanly hiding all dangling tentacles (`tentacle0` through `tentacle8`).

### 2. Mob Combat & Dynamic Sound Cues
- **Combat Identity:** Transformed Ghasts use custom attack behaviors matching their mob. Piglins unleash rapid small fireballs every 0.8s; Skeletons snipe with rapid high-velocity arrows; Creeper-Ghasts charge up with a chilling **TSSSSSssss...** fuse hiss before blasting devastating fireballs!
- **Mob Audio Cues:** Each variant has dedicated client sound triggers for charging, taking damage, and dying.

### 3. Shearing and Resetting
- Approach any transformed Ghast with **Shears** and interact.
- Damages shears durability by 1 point.
- Triggers the shears snip audio cue (`mob.sheep.shear`).
- Drops the exact equipped skull item on the ground as an entity loot drop, ensuring no lost resources in Survival mode.
- Restores the Ghast back to Variant 0 with classic tentacles.

### 4. Custom Head Template (`custom:custom_head`)
- The add-on includes a custom item identifier (`custom:custom_head`) designed as an easily extensible template for creators and players.
- Obtainable via commands: `/give @s custom:custom_head`.
- Retexturing: Replace `textures/entity/ghast/heads/custom_head.png` (idle) and `custom_head_charging.png` (charging) in the resource pack to load any custom skin, YouTuber face, or custom mob design.

### 5. Behavior Pack Slider Settings (Subpacks)
Configure natural mob head spawn behavior directly from the world settings using the Behavior Pack's gear icon slider:
- **Option 1: `Natural Ghast Spawn with Mob Heads` (Default):** Ghasts naturally spawning in the Nether have an 80% chance to spawn wearing one of the mob heads (Skeleton, Wither Skeleton, Zombie, Steve, Creeper, Piglin, or Custom Head) with their matching custom attack projectiles and audio cues!
- **Option 2: `Manual Equip Only (No Natural Spawn)`:** Ghasts spawn strictly as classic vanilla Ghasts. They only transform when a player manually equips a mob head by interacting with them!

---

## Technical Specifications

- **Target Engine:** Minecraft Bedrock 1.21.0 through 1.26.0+ (Preview, Beta & Release).
- **Experimental Toggles:** Zero experimental gameplay toggles required.
- **Multiplayer & Realms:** 100% compatible with Realms, Dedicated Servers (BDS), and LAN multiplayer.
- **Geometry Architecture:** Custom dual-geometry setup (`geometry.ghast` for default; `geometry.ghast.head` with native 64x64 mob head UV coordinates for transformed states).
- **Render Controllers:** Dynamic Molang texture switching based on `query.variant` and `query.is_charging`.

---

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.
