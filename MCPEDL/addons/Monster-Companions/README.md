# Monster Companions - Tameable Hostile Mobs and Mounts by AllensCreations

![MCPEDL](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Monster-Companions/1791889944961.jpg "MCPEDL")

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21%20--%201.26%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Achievement Friendly](https://img.shields.io/badge/Achievements-Friendly-brightgreen?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![No Experiments Required](https://img.shields.io/badge/Experimental%20Features-NOT%20REQUIRED-success?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCADDON%20%7C%20.MCPACK-orange?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/tree/main/MCPEDL/addons#available-add-ons)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20PC%20%7C%20Console%20%7C%20Realms-yellow?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

**By AllensCreations**

**NO EXPERIMENTAL NEED & ACHIEVEMENT FRIENDLY**

Tame 32 hostile monsters into defensive bodyguards and controllable mounts.

---

## Overview

Monster Companions is a data-driven Minecraft Bedrock add-on that enables players to pacify and tame 32 hostile mob types into defensive bodyguards and controllable mounts.

The pack is built entirely using standard Bedrock entity component definitions and requires zero experimental toggles and zero scripting APIs. It operates safely in long-term survival worlds, multiplayer servers, and Realms.

![Monster Companions Banner](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Monster-Companions/1791889996745.jpg)

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

### Undead
- **Supported Mobs**: Zombie, Drowned, Husk, Zombie Villager, Zombified Pigman
- **Special Abilities**: Helmet sunlight protection, melee defense

### Skeletons
- **Supported Mobs**: Skeleton, Stray, Bogged, Wither Skeleton
- **Special Abilities**: Ranged arrow support, Wither effect

### Tricky Trials
- **Supported Mobs**: Breeze
- **Special Abilities**: Wind Charge projectile launcher

### Nether Beasts
- **Supported Mobs**: Hoglin, Zoglin
- **Special Abilities**: High knockback, rideable war beast

### Explosives
- **Supported Mobs**: Creeper
- **Special Abilities**: Targeted single-use defensive explosion

### Arachnids
- **Supported Mobs**: Spider, Cave Spider
- **Special Abilities**: Vertical wall climbing, rideable mount

### Dimensionals
- **Supported Mobs**: Enderman
- **Special Abilities**: Teleport interception, heavy melee damage

### Piglins
- **Supported Mobs**: Piglin, Piglin Brute
- **Special Abilities**: High attack speed, battle axe sweeps

### Occult and Slimes
- **Supported Mobs**: Witch, Slime, Magma Cube
- **Special Abilities**: Lingering potion effects, crowd control

### Nether and Sky
- **Supported Mobs**: Blaze, Ghast, Phantom
- **Special Abilities**: Fireball artillery, aerial escort

### Illagers and Spirits
- **Supported Mobs**: Ravager, Vindicator, Pillager, Evoker, Vex
- **Special Abilities**: Heavy mount, fangs, spirit vex minions

### Golems
- **Supported Mobs**: Iron Golem, Snow Golem
- **Special Abilities**: Frontline defense, rideable mount

---

## Item Specifications

### Primal Beast Biscuit

![Primal Beast Biscuit Item](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Monster-Companions/beast_biscuit_preview.png)

### Identifier
- **Specification**: `custom:beast_biscuit`

### Function
- **Specification**: Pacification item (below 50% HP) / Health restoration item

### Healing Value
- **Specification**: 10 HP (5 Hearts)

### Stack Size
- **Specification**: 64

### Texture File
- **Specification**: `resource_pack/textures/items/beast_biscuit.png`

---

## Crafting Recipes

### Primal Beast Biscuit Recipe

![Crafting Recipe: Primal Beast Biscuit](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Monster-Companions/1791890109719.jpg)

- Type: Shapeless Crafting Table Recipe
- Ingredients: 1 Rotten Flesh, 1 Bone, 1 Sweet Berries, 1 Honey Bottle
- Yield: 4x Primal Beast Biscuits

---

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this pack in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.

---

## Search & Discovery Keywords

Minecraft Bedrock monster companions, tame hostile mobs, rideable spiders creepers, beast biscuit taming, bodyguard mobs Bedrock, companion add-on, MCPEDL, CurseForge, AllensCreations.
