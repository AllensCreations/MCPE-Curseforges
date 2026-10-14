# Mining Helmet - Dynamic Lighting Add-on for Minecraft Bedrock

![MCPEDL](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/addons/Mining-Helmet/1791946330457.jpg "MCPEDL")

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.20.80%20--%201.26%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Release](https://img.shields.io/badge/Release-v1.0.0-blue?style=flat-square)](../README.md#available-source-add-ons)
[![Format](https://img.shields.io/badge/Format-.MCADDON-orange?style=flat-square)](../README.md#available-source-add-ons)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20PC%20%7C%20Console%20%7C%20Realms-yellow?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

Creator: AllensCreations  
Description: Hands-free dynamic following light system for cave mining and night exploration.

---

## Overview

The Mining Helmet add-on adds wearable headgear with dynamic following light to Minecraft Bedrock Edition. When equipped in the head armor slot, it illuminates the player's immediate surroundings in real time, freeing both hands for mining tools, weapons, and shields.

The lighting engine is powered by the Bedrock Script API (@minecraft/server). It places temporary native Minecraft light blocks at the player's position and restores them back to air upon movement, unequip, dimension change, player death, or disconnect.

---

## Features and Light Power Ratings

The add-on features tiered light emission based on the light source used to craft or power the helmet:

| Equipment / Item | Light Power Level | Illumination Type | Description |
| :--- | :---: | :--- | :--- |
| **Mining Helmet (Lantern)** | **15** | High-Intensity Beam | Full daylight-equivalent illumination. Maximum light level in Minecraft Bedrock. |
| **Mining Helmet (Torch)** | **10** | Medium Warm Glow | Atmospheric survival light suitable for early-game spelunking. |
| **Handheld / Offhand Lantern** | **15** | Portable Floodlight | Dynamic light emitted when holding a standard Lantern in mainhand or offhand. |
| **Handheld / Offhand Torch** | **10** | Portable Torch Light | Dynamic light emitted when holding a standard Torch in mainhand or offhand. |

### Technical Mechanics
- Dynamic cleanup: Light blocks automatically clear when moving to a new block coordinate, leaving zero residual light blocks in the world.
- Armor protection: 2 defense points (equivalent to standard Golden/Iron helmet grade).
- Durability: 165 uses, repairable on an anvil using Gold Ingots (minecraft:gold_ingot).
- Enchantment support: Fully compatible with Enchanting Tables and Anvils for Protection, Unbreaking, Mending, Aqua Affinity, and Respiration.

---

## Item Specifications

### Lantern Version (`custom:mining_helmet`) - Light Power: Level 15
![Mining Helmet Lantern Texture](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/addons/Mining-Helmet/mining_helmet_preview.png)

Features a front-mounted metallic alloy lantern bracket with an intense electric white-hot glowing headlamp.

### Torch Version (`custom:torch_mining_helmet`) - Light Power: Level 10
![Mining Helmet Torch Texture](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/addons/Mining-Helmet/torch_mining_helmet_preview.png)

Features a front-mounted wooden torch stalk held by an iron bracket with an active flickering orange-yellow flame.

| Attribute | Lantern Version | Torch Version |
| :--- | :--- | :--- |
| **Identifier** | `custom:mining_helmet` | `custom:torch_mining_helmet` |
| **Light Power** | Level 15 (Daylight Maximum) | Level 10 (Warm Atmospheric Glow) |
| **Item Texture** | `textures/items/mining_helmet.png` | `textures/items/torch_mining_helmet.png` |
| **Armor Model Texture** | `textures/models/armor/mining_helmet_1.png` | `textures/models/armor/torch_mining_helmet_1.png` |
| **Equipment Slot** | Head Armor (`slot.armor.head`) | Head Armor (`slot.armor.head`) |
| **Defense / Durability** | 2 Armor Points / 165 Uses | 2 Armor Points / 165 Uses |
| **Repair Item** | Gold Ingot (`minecraft:gold_ingot`) | Gold Ingot (`minecraft:gold_ingot`) |

---

## Crafting Recipes

### 1. Lantern Recipe (Light Power Level 15)

Combines a standard Lantern with a Golden Helmet to produce the Level 15 Mining Helmet.

![Crafting Recipe: Lantern Mining Helmet](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/addons/Mining-Helmet/recipe_lantern.png)

- Pattern: Row 1 = [Empty, Lantern, Empty], Row 2 = [Empty, Golden Helmet, Empty]
- Result: 1x Mining Helmet (Lantern)
- Light Power: Level 15

### 2. Torch Recipe (Light Power Level 10)

Combines a standard Torch with a Golden Helmet to produce the Level 10 Mining Helmet for early survival.

![Crafting Recipe: Torch Mining Helmet](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/addons/Mining-Helmet/recipe_torch.png)

- Pattern: Row 1 = [Empty, Torch, Empty], Row 2 = [Empty, Golden Helmet, Empty]
- Result: 1x Mining Helmet (Torch)
- Light Power: Level 10

### 3. Helmet Upgrade Recipe

Players who crafted the Torch Mining Helmet can upgrade it directly to the Level 15 Lantern version on a crafting table:
- Pattern: Row 1 = [Empty, Lantern, Empty], Row 2 = [Empty, Mining Helmet (Torch), Empty]
- Result: 1x Mining Helmet (Lantern)
- Light Power: Level 15

---

## Guidelines and Attribution

- Creator: AllensCreations
- Video & Showcase: Content creators are permitted to feature this add-on in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload the pack or provide direct monetized download bypasses. Link directly to the official repository page.
- Rights: All rights reserved for AllensCreations.

---

© All rights reserved for AllensCreations.
