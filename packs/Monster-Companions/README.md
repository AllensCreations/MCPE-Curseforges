# Monster Companions - Tameable Hostile Mobs and Mounts for Minecraft Bedrock

![MCPEDL](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/packs/Monster-Companions/1791889944961.jpg "MCPEDL")

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21%20--%201.26+-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Release](https://img.shields.io/badge/Release-v1.0.0-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Monster-Companions/Monster_Companions_AllensCreations.mcaddon)
[![Format](https://img.shields.io/badge/Format-.MCADDON%20%7C%20.MCPACK-orange?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Monster-Companions/Monster_Companions_AllensCreations.mcaddon)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20PC%20%7C%20Console%20%7C%20Realms-yellow?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

Creator: AllensCreations  
Description: Data-driven pacification system to tame 32 hostile monsters into bodyguards and rideable wall-climbing mounts.

---

## Overview

Monster Companions is a data-driven Minecraft Bedrock add-on that enables players to pacify and tame 32 hostile mob types into defensive bodyguards and controllable mounts.

The pack is built entirely using standard Bedrock entity component definitions and requires zero experimental toggles and zero scripting APIs. It operates safely in long-term survival worlds, multiplayer servers, and Realms.

![Monster Companions Banner](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/packs/Monster-Companions/1791889996745.jpg)

---

## Features and Mechanics

### Combat Pacification System
Wild hostile mobs cannot be tamed immediately. The player must engage the target in combat and reduce its health below 50%. Once weakened, feeding the mob a Primal Beast Biscuit pacifies and converts it into an allied companion.

### Companion Squad Mechanics
- Perimeter buffer: Companions follow the player while keeping a buffer distance to prevent obstructing the player camera or mining path. If the player sprints ahead, companions teleport behind the player safely.
- Friendly-fire immunity: Companions are completely immune to player sword sweeps, teammate arrows, splash potions, and explosions. Companions also exclude teammates from their attack targeting.
- Visual status indicators: Tamed companions display an always-visible floating nameplate above their head. Custom name tags can be applied directly without an anvil.
- In-combat healing: Feeding a wounded companion a Primal Beast Biscuit restores 10 HP (5 hearts).
- Sunlight protection: Tamed Zombies, Skeletons, and Phantoms can wear helmets to prevent burning in direct sunlight.
- Kamikaze Creepers: Tamed Creepers will rush enemy threats that damage the player and detonate on the target as a single-use explosive bodyguard.
- Spirit Vexes: Tamed Evokers summon Spirit Vexes that attack hostiles and despawn naturally when their lifespan ends without turning on players.

### Mount Mechanics and Bedrock Ride UI
Equipping a Saddle onto supported large companions enables manual mounting and direct steering:
- On-screen mount prompt: Displays the native Bedrock "Mount" prompt on touch controls, controllers, and mouse/keyboard.
- Sneak-to-interact: Crouching allows players to feed, heal, lead, or rename mounts without accidentally mounting.
- Manual steering: Autonomous wandering and head-turning are disabled while mounted.
- Wall climbing: Tamed Spiders and Cave Spiders can scale vertical surfaces and cliffs while mounted.
- Supported mounts: Spider, Cave Spider, Ravager, Iron Golem, Hoglin, and Zoglin.

---

## Tameable Mob Roster (32 Mobs)

| Category | Supported Mobs | Special Abilities |
| :--- | :--- | :--- |
| **Undead** | Zombie, Drowned, Husk, Zombie Villager, Zombified Pigman | Helmet sunlight protection, melee defense |
| **Skeletons** | Skeleton, Stray, Bogged, Wither Skeleton | Ranged arrow support, Wither effect |
| **Tricky Trials** | Breeze | Wind Charge projectile launcher |
| **Nether Beasts** | Hoglin, Zoglin | High knockback, rideable war beast |
| **Explosives** | Creeper | Targeted single-use defensive explosion |
| **Arachnids** | Spider, Cave Spider | Vertical wall climbing, rideable mount |
| **Dimensionals** | Enderman | Teleport interception, heavy melee damage |
| **Piglins** | Piglin, Piglin Brute | High attack speed, battle axe sweeps |
| **Occult and Slimes** | Witch, Slime, Magma Cube | Lingering potion effects, crowd control |
| **Nether and Sky** | Blaze, Ghast, Phantom | Fireball artillery, aerial escort |
| **Illagers and Spirits**| Ravager, Vindicator, Pillager, Evoker, Vex | Heavy mount, fangs, spirit vex minions |
| **Golems** | Iron Golem, Snow Golem | Frontline defense, rideable mount |

---

## Item Specifications

### Primal Beast Biscuit

![Primal Beast Biscuit Item](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/packs/Monster-Companions/beast_biscuit_preview.png)

| Attribute | Specification |
| :--- | :--- |
| **Identifier** | `custom:beast_biscuit` |
| **Function** | Pacification item (below 50% HP) / Health restoration item |
| **Healing Value** | 10 HP (5 Hearts) |
| **Stack Size** | 64 |
| **Texture File** | `resource_pack/textures/items/beast_biscuit.png` |

---

## Crafting Recipes

### Primal Beast Biscuit Recipe

![Crafting Recipe: Primal Beast Biscuit](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/packs/Monster-Companions/1791890109719.jpg)

- Type: Shapeless Crafting Table Recipe
- Ingredients: 1 Rotten Flesh, 1 Bone, 1 Sweet Berries, 1 Honey Bottle
- Yield: 4x Primal Beast Biscuits

---

## Direct Downloads

| Package | Format | Description | Download Link |
| :--- | :--- | :--- | :--- |
| **All-In-One Pack** | `.mcaddon` | Installs Behavior Pack and Resource Pack in one file | [Download (.mcaddon)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Monster-Companions/Monster_Companions_AllensCreations.mcaddon) |
| **Behavior Pack Only** | `.mcpack` | Mob behaviors, taming components, mounts, and recipes | [Download BP (.mcpack)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Monster-Companions/Monster_Companions_BP.mcpack) |
| **Resource Pack Only** | `.mcpack` | Custom item textures, icons, and localized names | [Download RP (.mcpack)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Monster-Companions/Monster_Companions_RP.mcpack) |

---

## MCPEDL and CurseForge Distribution Checklist

<div align="center">
  <img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/assets/mcpedl.png" alt="MCPEDL" title="MCPEDL" width="150" />
</div>

Ensure that you have already:
- Connected your Curseforge Account.
- Your project has an image with the title MCPEDL (no quotes).
- Your project files are already approved.
- Your project has the third party sharing option enabled.

---

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this pack in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.
