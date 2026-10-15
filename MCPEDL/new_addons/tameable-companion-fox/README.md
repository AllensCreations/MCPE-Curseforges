# Tameable Companion Fox — Minecraft Bedrock Addon

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21.0%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Release](https://img.shields.io/badge/Release-v1.0.0-blue?style=flat-square)](../README.md#available-source-add-ons)
[![Format](https://img.shields.io/badge/Format-.MCADDON-orange?style=flat-square)](../README.md#available-source-add-ons)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20PC%20%7C%20Console%20%7C%20Realms-yellow?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

Creator: AllensCreations  
Description: Tame wild foxes into loyal combat companions with sitting commands and custom weapon equipment mechanics.

---

## Overview

**Tameable Companion Fox** transforms wild foxes into obedient, combat-ready survival pets. Using sweet berries or glow berries, players can tame both red and arctic foxes, command them to sit or follow, and equip swords or axes directly into their mouths to boost their attack power.

Tamed foxes receive an upgraded health pool of 30 HP, defend their owner from hostile attackers, and feature complete animation controller support for realistic curl-up sitting poses.

---

## Features

- **Sweet & Glow Berry Taming**: Tame wild foxes with sweet berries or glow berries (75% base success rate).
- **Combat Protection**: Tamed foxes automatically attack mobs that hurt their owner or targets their owner attacks.
- **Enhanced Health Pool**: Increases maximum vitality from 20 HP to 30 HP upon successful taming.
- **Sit and Stand Commands**: Interact with an empty hand to switch between following mode and resting pose.
- **Weapon Equipment**: Equip any sword or axe into the fox's mouth by interacting with the weapon in hand.
- **Custom Sleeping Animations**: Dedicated animation controllers replicate authentic resting postures.
- **Zero Experimental Flags**: Fully compatible with standard survival worlds, Realms, and Bedrock servers.

---

## How It Works & In-Game Usage

| Interaction / Action | Requirement / Item | In-Game Result |
| :--- | :--- | :--- |
| **Tame Fox** | Sweet Berries or Glow Berries | Pacifies wild fox, emits heart particles, and sets owner bond. |
| **Command Sit** | Empty Hand (on standing tamed fox) | Fox sits down in resting pose and stays anchored in place. |
| **Command Stand** | Empty Hand (on sitting tamed fox) | Fox stands up and resumes active bodyguard following. |
| **Equip Sword** | Hold any Sword (Wood to Netherite) | Equips weapon into fox mouth for enhanced attack damage. |
| **Equip Axe** | Hold any Axe (Wood to Netherite) | Equips axe into fox mouth for high-impact combat strikes. |
| **Heal Fox** | Sweet Berries / Glow Berries | Restores companion health during or after combat. |

---

## Technical Specifications

- **Identifier**: `minecraft:fox`
- **Component Groups**: `fox:wild`, `fox:tamed`, `fox:standing`, `fox:sitting`
- **Tamed Health**: 30 Hit Points (`minecraft:health`)
- **Follow Distance**: Starts following at 10 blocks, stops at 2 blocks (`minecraft:behavior.follow_owner`)
- **Combat Behaviors**: `minecraft:behavior.owner_hurt_target`, `minecraft:behavior.owner_hurt_by_target`
- **Equipment Slot**: `slot.weapon.mainhand` (`minecraft:is_sword`, `minecraft:is_axe`)

---

## Installation

1. Download the `.mcaddon` file from the [releases](../README.md).
2. Open or double-tap the file to auto-import into Minecraft Bedrock.
3. Apply the **Tameable Companion Fox BP** and **RP** in your world settings.
4. Launch your world and tame foxes across Taiga and Grove biomes.

---

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.
