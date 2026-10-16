# Grimoire Relics V2 — Magical Offhand Grimoires for Minecraft Bedrock

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21.0%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Achievement Friendly](https://img.shields.io/badge/Achievements-Friendly-brightgreen?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCADDON-orange?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/tree/main/MCPEDL/addons#available-add-ons)

**By AllensCreations**

**MAGICAL OFFHAND RELICS SYSTEM & PASSIVE AURA ENGINE**

20 craftable ancient grimoires granting unique passive blessings, dynamic defensive reactive triggers, and orbiting particle auras—active strictly and only while equipped in your offhand slot.

---

## Overview

**Grimoire Relics V2** brings an RPG-style relic progression system to Minecraft Bedrock Edition without requiring experimental toggles or breaking achievement eligibility. Built on modern Minecraft Bedrock mechanics, it monitors your offhand equipment in real-time.

Holding a Grimoire in your offhand dynamically attunes your character:
1. Displays an attunement actionbar title and lists relic perks.
2. Applies continuous passive buffs and status effects.
3. Generates a subtle, ambient orbiting sparkle around the player.
4. Activates reactive combat triggers on hurt (defensive) or hit (offensive).
5. Automatically strips away active buffs and removes temporary constructs immediately upon un-equipping or switching offhand items.

---

## The 20 Grimoire Relics

| Relic Name | Abilities & Mechanics | Acquisition |
| :--- | :--- | :--- |
| <img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Grimoire-Relics-V2/assets/items/tome_phoenix.png" width="20" height="20" alt="Infernal Phoenix"> **Infernal Phoenix** | Permanent Fire Resistance. Attackers that melee hit you are set on fire for 5s; targets you melee hit burn for 5s. | **Ancient Relic (Loot Only)**: Bastion Treasure |
| <img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Grimoire-Relics-V2/assets/items/tome_abyss.png" width="20" height="20" alt="Abyssal Tide"> **Abyssal Tide** | Permanent Water Breathing. Night Vision while underwater. Dolphin's Grace while swimming. | Craftable |
| <img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Grimoire-Relics-V2/assets/items/tome_zephyr.png" width="20" height="20" alt="Zephyr Wind"> **Zephyr Wind** | Speed II + Jump Boost I. Auto Slow Falling when plunging (downward velocity < -0.5). Full fall damage immunity. | Craftable |
| <img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Grimoire-Relics-V2/assets/items/tome_lich.png" width="20" height="20" alt="Necrotic Lich"> **Necrotic Lich** | Melee strikes inflict Wither II for 3s on victims. | **Ancient Relic (Loot Only)**: Bastion Treasure |
| <img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Grimoire-Relics-V2/assets/items/tome_titan.png" width="20" height="20" alt="Mountain Titan"> **Mountain Titan** | Permanent Resistance II and Slowness I. Complete knockback immunity (cancels knockback velocity on damage). | Craftable |
| <img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Grimoire-Relics-V2/assets/items/tome_vampire.png" width="20" height="20" alt="Blood Vampire"> **Blood Vampire** | Life Leech: Every successful melee strike restores 1 full heart (2 HP). | **Ancient Relic (Loot Only)**: Dungeon Monster Rooms |
| <img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Grimoire-Relics-V2/assets/items/tome_lunar.png" width="20" height="20" alt="Lunar Eclipse"> **Lunar Eclipse** | Nocturnal Blessing: Invisibility and Strength I during nighttime (13000–23000 ticks) in the Overworld. | Craftable |
| <img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Grimoire-Relics-V2/assets/items/tome_solar.png" width="20" height="20" alt="Solar Dawn"> **Solar Dawn** | Solar Nourishment: Saturation and Regeneration I under open daylight skies in the Overworld. | Craftable |
| <img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Grimoire-Relics-V2/assets/items/tome_druid.png" width="20" height="20" alt="Verdant Druid"> **Verdant Druid** | Poison immunity. Naturally fertilizes crops and advances saplings within a 3-block radius. | Craftable |
| <img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Grimoire-Relics-V2/assets/items/tome_frost.png" width="20" height="20" alt="Frost Weaver"> **Frost Weaver** | Frost Walker II (freezes water underfoot into frosted ice, unless sneaking). Complete immunity to powder snow freezing. | Craftable |
| <img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Grimoire-Relics-V2/assets/items/tome_storm.png" width="20" height="20" alt="Stormcaller"> **Stormcaller** | Speed III outdoors during rain or thunderstorms. 15% chance to strike melee attackers with real lightning. | Craftable |
| <img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Grimoire-Relics-V2/assets/items/tome_delver.png" width="20" height="20" alt="Deep Delver"> **Deep Delver** | Permanent Haste II. Automatically manifests an invisible light block at feet when below Y=55 in the dark. | Craftable |
| <img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Grimoire-Relics-V2/assets/items/tome_void.png" width="20" height="20" alt="Void Phantom"> **Void Phantom** | Emergency Void Rescue (The End only): Falling into the void launches you upward with a 2-second Level 60 fast phase elevation out of the abyss, followed by 1-second Slow Falling triggered at ground contact on descent to completely negate fall damage (5 min cooldown). | **Ancient Relic (Loot Only)**: Ancient Cities |
| <img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Grimoire-Relics-V2/assets/items/tome_golem.png" width="20" height="20" alt="Iron Golem"> **Iron Golem** | Fortified Armor: Grants 4 Absorption hearts every 30s. Melee strikes launch enemies upward into the air. | Craftable |
| <img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Grimoire-Relics-V2/assets/items/tome_hydra.png" width="20" height="20" alt="Venom Hydra"> **Venom Hydra** | Full immunity to Poison and Wither. Melee attacks inflict Poison II (5s). | Craftable |
| <img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Grimoire-Relics-V2/assets/items/tome_alchemist.png" width="20" height="20" alt="Cursed Alchemist"> **Cursed Alchemist** | Potion Mastery: Permanently preserves and refreshes the duration of active beneficial potion effects. | Craftable |
| <img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Grimoire-Relics-V2/assets/items/tome_seraph.png" width="20" height="20" alt="Radiant Seraph"> **Radiant Seraph** | Permanent Regeneration II. Complete immunity to Blindness and Nausea. | Craftable |
| <img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Grimoire-Relics-V2/assets/items/tome_scholar.png" width="20" height="20" alt="Arcane Scholar"> **Arcane Scholar** | Arcane Intellect: Triples all experience gained from mob drops, mining, and orbs. | Craftable |
| <img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Grimoire-Relics-V2/assets/items/tome_mirror.png" width="20" height="20" alt="Mirror Trickster"> **Mirror Trickster** | Elusive Phase: 25% chance upon taking damage to negate all incoming damage and blink 3 blocks backward through smoke. | **Ancient Relic (Loot Only)**: Ancient Cities |
| <img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Grimoire-Relics-V2/assets/items/tome_dragon.png" width="20" height="20" alt="Cataclysm Dragon"> **Cataclysm Dragon** | Strength II and Resistance I. Complete immunity to dragon breath and explosions (recovers damage as health). | **Ancient Relic (Loot Only)**: End Cities |

---

## Crafting Pattern

There are **14 craftable tomes** crafted at a standard Crafting Table surrounding a central Book. The **6 Ancient tomes** (Void Phantom, Cataclysm Dragon, Necrotic Lich, Mirror Trickster, Blood Vampire, and Infernal Phoenix) cannot be crafted and must be uncovered by exploring rare world structures:

<p align="center">
  <img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/addons/Grimoire-Relics-V2/assets/all_recipes_sheet.png" alt="Grimoire Relics V2 Crafting Recipes" width="850">
</p>

---

## Durability, Enchanting & World Generation

### Relic Durability, Enchanting & Repairing
- **100 Max Durability** (`minecraft:durability`): Each Grimoire possesses a durability health bar.
- **Event-Only Wear**: Passive stat buffs (such as Water Breathing, Speed, or Haste) do **not** drain durability. Durability is consumed strictly upon active mechanical execution:
  - *Combat triggers* (e.g. Phoenix burn on hit/hurt, Vampire life-steal, Iron Golem absorption & launch, Hydra poison, Lich wither): 1 durability per event.
  - *Environmental abilities* (e.g. Druid crop boost, Frost Weaver water freeze, Stormcaller lightning strike, Mirror Trickster blink): 1 to 2 durability per event.
  - *Emergency Lifesavers* (e.g. Void Phantom surface/End platform rescue): 10 durability.
- **Enchanting Table & Anvil Compatible**:
  - Can be enchanted via the Enchanting Table or Anvil with enchantments like **Mending**, **Efficiency**, and **Unbreaking**.
  - **Mending** restores tome durability automatically as you collect experience orbs.
- **Anvil Repairing**:
  - Combine two of the same tomes on an Anvil to restore their remaining durability.
  - Can also be repaired on an Anvil using standard **Books** (`minecraft:book`) at a strict **1:1 ratio** (1 book restores 1 durability point).
- **Shatter**: If durability reaches 0 without being repaired or protected, the tome shatters (`random.break` audio with item break particles) and is removed from your equipment.

### World Chest Distribution & Found Condition
Ancient tomes generate naturally inside exploration chests across the world, occasionally replacing rare loot like Enchanted Golden Apples. Due to their age, discovered tomes spawn **partially worn** (15% to 70% used durability):
- **Ancient Cities**: High chance for **Void Phantom** (`tome_void`) and **Mirror Trickster** (`tome_mirror`).
- **Bastion Remnants (Treasure)**: **Infernal Phoenix** (`tome_phoenix`) and **Necrotic Lich** (`tome_lich`).
- **End Cities**: **Cataclysm Dragon** (`tome_dragon`).
- **Stronghold Libraries**: **Arcane Scholar** (`tome_scholar`) and **Cursed Alchemist** (`tome_alchemist`).
- **Shipwreck Treasuries**: **Abyssal Tide** (`tome_abyss`).
- **Monster Rooms / Simple Dungeons**: **Blood Vampire** (`tome_vampire`) and **Deep Delver** (`tome_delver`).

---

## Performance & Optimization

- **Zero Experimental Flags**: Works in standard survival worlds, servers, and Realms with achievements fully preserved.
- **Instant Offhand Gating**: Un-equipping or switching away immediately removes active buffs and effects.
- **Lag-Free Engine**: Lightweight background updates ensure smooth multiplayer gameplay without frame drops.
- **In-Game Tooltips**: Hovering over any Grimoire displays full colored lore and perk descriptions in your inventory.

---

## Guidelines and Attribution

- **Creator**: AllensCreations
- **Rights & Reservation**: All rights reserved for AllensCreations.
- **Content Creators**: Content creators are permitted to feature this creation in videos and streams with credit to AllensCreations.
- **Redistribution**: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.
