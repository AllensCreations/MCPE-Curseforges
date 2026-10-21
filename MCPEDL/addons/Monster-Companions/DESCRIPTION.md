# Monster Companions (v1.0.9)

*Tameable Hostile Mobs and Mounts by AllensCreations*

![MCPEDL](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Monster-Companions/1791889944961.jpg "MCPEDL")

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21%20--%201.26%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCADDON%20%7C%20.MCPACK-orange?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/tree/main/MCPEDL/addons#available-add-ons)

**By AllensCreations**

Explore more creations: [CurseForge Profile](https://www.curseforge.com/members/allenscreations/projects) · [MCPEDL Profile](https://mcpedl.com/user/allenscreations/)

Tame 32 hostile monsters into defensive bodyguards and controllable mounts.


---

## Overview

Monster Companions is a data-driven Minecraft Bedrock add-on that enables players to pacify and tame 32 hostile mob types into defensive bodyguards and controllable mounts.

The pack adds tamable companion behavior and mount interactions to selected hostile mobs.

![Monster Companions Banner](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Monster-Companions/1791889996745.jpg)

## Compatibility and World Settings

- **Minecraft Version:** Minecraft Bedrock 1.26+
- **Format:** Behavior Pack and Resource Pack (`.mcaddon` / `.mcpack`)
- **Achievement Status:** Likely achievement-friendly based on the inspected pack manifests and data-driven setup; this is not a guarantee for every world or game version.
- **Experimental Features:** No experiment requirement detected in the inspected pack files. The actual world settings were not inspected, and compatibility may change with future Minecraft updates.
- **Offline Play:** The recipe is included in the Behavior Pack and does not need an internet connection after the pack is imported and enabled locally.

---

## Features and Mechanics

### Combat Pacification System
Wild hostile mobs cannot be tamed immediately. The player must engage the target in combat and reduce its health below 50%. Once weakened, feeding the mob a Primal Beast Biscuit pacifies and converts it into an allied companion.

### Companion Squad Mechanics
- Perimeter buffer: Companions follow the player while keeping a buffer distance to prevent obstructing the player camera or mining path. If the player sprints ahead, companions teleport behind the player safely.
- Friendly-fire immunity: Companions are configured to avoid friendly-fire damage and exclude teammates from their attack targeting. Companions also exclude teammates from their attack targeting.
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
- **Specification**: `allenscreations:beast_biscuit`

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

![Crafting Recipe: Primal Beast Biscuit](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Monster-Companions/beast_biscuit_recipe.png)

- Type: Shapeless Crafting Table Recipe
- Ingredients: 1 Rotten Flesh, 1 Bone, 1 Sweet Berries, 1 Honey Bottle
- Yield: 4x Primal Beast Biscuits
- Recipe Identifier: `allenscreations:beast_biscuit_recipe`
- Recipe book: The recipe is configured as always unlocked so it can appear in the crafting recipe list.
- Offline crafting: The recipe is bundled in the Behavior Pack; internet access is not needed during local gameplay.

---

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this pack in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.
- Community feedback: Found a bug or a feature that isn't working? Please leave a comment and let me know. Add-on ideas and feature suggestions are always welcome.

---

© All rights reserved for AllensCreations.

---

## Search & Discovery Keywords

Monster Companions Bedrock add-on, Combat Pacification System Minecraft Bedrock, Companion Squad Mechanics Minecraft Bedrock, Mount Mechanics and Bedrock Ride UI Minecraft Bedrock, Undead Minecraft Bedrock, Minecraft PE mod, MCPEDL add-on, CurseForge Bedrock, AllensCreations.
