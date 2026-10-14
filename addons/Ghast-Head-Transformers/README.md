# Ghast Mob Head Transformers - Giant Flying Mob Heads Add-on

![MCPEDL](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/addons/Ghast-Head-Transformers/pack_icon.png "MCPEDL")

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21%20--%201.26+-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Release](https://img.shields.io/badge/Release-v1.0.0-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Ghast-Head-Transformers/Ghast_Head_Transformers_AllensCreations.mcaddon)
[![Format](https://img.shields.io/badge/Format-.MCADDON%20%7C%20.MCPACK-orange?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Ghast-Head-Transformers/Ghast_Head_Transformers_AllensCreations.mcaddon)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20PC%20%7C%20Console%20%7C%20Realms-yellow?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

Creator: AllensCreations  
Description: Transform vanilla Ghasts into giant flying mob heads by equipping vanilla skulls or custom heads, with charging faces and shearing drops.

---

## Overview

**Ghast Mob Head Transformers** allows players to interact with any vanilla Ghast while holding a mob skull or custom head item, instantly transforming the Ghast into a colossal, floating version of that mob's head.

The add-on retains 100% of the vanilla Ghast's survival hostility and flying combat mechanics: transformed Ghasts continue to roam the Nether skies, target players, and shoot explosive fireballs. When a transformed Ghast prepares to fire, its facial texture dynamically shifts into an angry, glowing, mouth-open charging expression.

Using a pair of **Shears** on a transformed Ghast removes the equipped head, plays the shears snip audio cue, drops the original skull item on the ground, and restores the Ghast back to its classic white tentacled form.

---

## Transformation Variants

Interact with any Ghast while holding one of the following items to initiate the transformation:

| Variant | Item Required | Transformed Entity | Charging State Expression | Shearing Drop |
| :---: | :--- | :--- | :--- | :--- |
| **0** | *(Default)* | Classic Vanilla Ghast | Classic red-eyed crying / shooting face | None |
| **1** | `minecraft:skeleton_skull` | Giant Skeleton Head | Flaming red eye sockets & open jaw cavity | `minecraft:skeleton_skull` |
| **2** | `minecraft:wither_skeleton_skull` | Giant Wither Skeleton Head | Blazing cyan soul-fire eyes & open maw | `minecraft:wither_skeleton_skull` |
| **3** | `minecraft:zombie_head` | Giant Zombie Head | Bloodshot crimson eyes & snarling fangs | `minecraft:zombie_head` |
| **4** | `minecraft:player_head` | Giant Steve / Human Head | Furrowed angry eyebrows & screaming mouth | `minecraft:player_head` |
| **5** | `minecraft:creeper_head` | Giant Creeper Head | Flashing white sizzle & glowing red mouth | `minecraft:creeper_head` |
| **6** | `minecraft:piglin_head` | Giant Piglin Head | Crimson battle eyes, tusks & flared snout | `minecraft:piglin_head` |
| **7** | `custom:custom_head` | Giant Custom Head | Neon cyan matrix overload & energy roar | `custom:custom_head` |

---

## Gameplay Mechanics

### 1. Equipping a Head
- Approach any Ghast and right-click or tap the **Equip Mob Head** interact button while holding a valid skull.
- Consumes 1 skull item from your hand.
- Triggers a loud Ghast screech audio cue (`mob.ghast.scream`) and white smoke burst.
- Replaces the Ghast model with a clean 16x16x16 giant head cube, cleanly hiding all dangling tentacles (`tentacle0` through `tentacle8`).

### 2. Shearing and Resetting
- Approach any transformed Ghast with **Shears** and interact.
- Damages shears durability by 1 point.
- Triggers the shears snip audio cue (`mob.sheep.shear`).
- Drops the exact equipped skull item on the ground as an entity loot drop, ensuring no lost resources in Survival mode.
- Restores the Ghast back to Variant 0 with classic tentacles.

### 3. Custom Head Template (`custom:custom_head`)
- The add-on includes a custom item identifier (`custom:custom_head`) designed as an easily extensible template for creators and players.
- Obtainable via commands: `/give @s custom:custom_head`.
- Retexturing: Replace `textures/entity/ghast/heads/custom_head.png` (idle) and `custom_head_charging.png` (charging) in the resource pack to load any custom skin, YouTuber face, or custom mob design.

---

## Technical Specifications

- **Target Engine:** Minecraft Bedrock 1.21.0 through 1.26.0+ (Preview, Beta & Release).
- **Experimental Toggles:** Zero experimental gameplay toggles required.
- **Multiplayer & Realms:** 100% compatible with Realms, Dedicated Servers (BDS), and LAN multiplayer.
- **Geometry Architecture:** Custom dual-geometry setup (`geometry.ghast` for default; `geometry.ghast.head` with native 64x64 mob head UV coordinates for transformed states).
- **Render Controllers:** Dynamic Molang texture switching based on `query.variant` and `query.is_charging`.

---

## Direct Downloads

| Package | Format | Description | Download Link |
| :--- | :--- | :--- | :--- |
| **All-In-One Bundle** | `.mcaddon` | Complete Behavior and Resource Pack | [Download (.mcaddon)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Ghast-Head-Transformers/Ghast_Head_Transformers_AllensCreations.mcaddon) |
| **Behavior Pack** | `.mcpack` | Entity components, interaction definitions & loot tables | [Download BP (.mcpack)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Ghast-Head-Transformers/Ghast_Head_Transformers_BP.mcpack) |
| **Resource Pack** | `.mcpack` | Geometries, render controllers, textures & item atlas | [Download RP (.mcpack)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Ghast-Head-Transformers/Ghast_Head_Transformers_RP.mcpack) |

---

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.
