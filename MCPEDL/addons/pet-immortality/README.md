# Pet Immortality — Damage Immunity Add-on for Minecraft Bedrock

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21.0%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Release](https://img.shields.io/badge/Release-v1.0.1-blue?style=flat-square)](../README.md#available-source-add-ons)
[![Format](https://img.shields.io/badge/Format-.MCPACK-orange?style=flat-square)](../README.md#available-source-add-ons)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20PC%20%7C%20Console%20%7C%20Realms-yellow?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

Creator: AllensCreations  
Description: Prevents all incoming damage to tamed pets using Bedrock Script API event cancellation.

---

## Overview

**Pet Immortality** protects your beloved tamed companions from dying in Minecraft Bedrock Edition. Whether exploring treacherous caves, facing hostile mob raids, or navigating lava-filled Nether terrain, your tamed pets are rendered completely immune to all sources of lethal and non-lethal damage.

Powered by the Minecraft Bedrock Script API (`@minecraft/server`), the add-on listens for entity damage before it applies and intercepts the event, canceling damage calculations entirely without requiring invasive entity model overrides or disabling natural mob behaviors.

---

## Features

- **Total Damage Interception**: Intercepts and cancels the `world.beforeEvents.entityHurt` event, eliminating damage from melee strikes, arrows, creeper explosions, falls, drowning, fire, lava, suffocation, and void damage.
- **Tamed Status Verification**: Uses component queries (`minecraft:tameable.isTamed`) to ensure only player-tamed companions receive immunity, leaving wild animals vulnerable.
- **Pure Script API Implementation**: Lightweight and lag-free with zero entity JSON replacements, ensuring seamless compatibility alongside custom texture packs and other add-ons.
- **Modular Presets Included**: Provides individual target presets so players can protect specific animal types or all tamed companions at once.

---

## Available Modular Presets

The add-on package includes specialized presets located under `presets/` to allow fine-grained control over which pets receive immunity:

| Preset Name | Target Entities | Description |
| :--- | :--- | :--- |
| **All-Tamed** | All Tamed Mobs | Universal protection for all tamed animals (Wolves, Cats, Parrots, Horses, Donkeys, Mules, Llamas). |
| **Wolf** | Tamed Wolves | Grants total damage immunity exclusively to tamed wolves. |
| **Cat** | Tamed Cats | Grants total damage immunity exclusively to tamed cats. |
| **Horse** | Tamed Equines | Protects tamed Horses, Donkeys, Mules, and Skeleton Horses. |
| **Parrot** | Tamed Parrots | Protects tamed parrots from accidental projectile hits, suffocations, and falls. |

---

## Technical Mechanics

### Event Interception
The core engine attaches to the Bedrock `entityHurt` pre-event pipeline:
```javascript
world.beforeEvents.entityHurt.subscribe((event) => {
    if (isProtected(event.hurtEntity)) {
        event.cancel = true;
    }
});
```
When `event.cancel = true` is invoked:
- No knockback or flinch animation is triggered.
- Health points are not decremented.
- Aggro calculations from attacker to victim are cleanly avoided.
- Pets remain interactable, breedable, commandable (sit/stand), and leasheable.

---

## Installation

1. Download the \`Pet_immortality_AllensCreations.mcpack\` file from the [releases](../README.md).
2. Double-tap or open the file to auto-import into Minecraft Bedrock.
3. Apply the **Pet Immortality BP** (or your preferred modular preset) to your world's Behavior Packs.
4. Join your survival or multiplayer world. All currently tamed pets and newly tamed companions will immediately possess damage immunity.

---

## Guidelines and Attribution

- Creator: AllensCreations
- Video & Showcase: Content creators may feature this addon in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload or provide direct monetized download bypasses.
- Rights: All rights reserved for AllensCreations.

---

© All rights reserved for AllensCreations.
