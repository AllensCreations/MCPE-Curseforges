# Smart Tree Capitator & Domino Ore Miner — Vein & Tree Miner for Minecraft Bedrock

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21.0%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Script API](https://img.shields.io/badge/Script%20API-%40minecraft%2Fserver%201.13.0%2B-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCPACK%20%2F%20.MCADDON-orange?style=flat-square)](../README.md#available-source-add-ons)
[![Release](https://img.shields.io/badge/Release-v1.0.0-blue?style=flat-square)](../README.md#available-source-add-ons)

**By AllensCreations**

**SNEAK-ACTIVATED VEIN MINING & BUILT-IN TOOL PROTECTION**

Fell entire trees and mine contiguous ore veins in a single sneak-break, protected by automated durability safety stops.

---

## Overview

Mining large underground ore clusters and chopping tall trees one block at a time takes unnecessary time.

**Smart Tree Capitator & Domino Ore Miner** adds sneak-activated chain mining to Minecraft Bedrock Edition using the Script API (`@minecraft/server`). Sneak while breaking a log or ore to fell the entire tree or harvest the connected ore vein in a single tick. Tools stop mining when durability drops to 5, preventing accidental breakage.

Standing upright leaves standard vanilla single-block mining untouched. The add-on adds no extra hunger or exhaustion penalties.

---

## Key Features

| Feature | Description |
| :--- | :--- |
| Sneak-Activated Mining | Chains only while sneaking, keeping single-block mining intact when upright. |
| Footprint Tree Capitator | Layer-by-layer 3x3 footprint scan captures straight trunks, diagonal branches, and 2x2 mega trees. |
| 26-Neighbor Domino Ore Miner | True 3D breadth-first search connects full clusters through face, edge, and corner connections up to 64 blocks. |
| Mineral Category Normalization | Groups regular and deepslate ore variants so veins crossing stone layers mine together. |
| Durability Safety Guard | Automatically stops chain mining when tool durability reaches 5 points remaining. |
| Unbreaking Respect | Factors in vanilla Unbreaking enchantment probabilities (`100 / (level + 1)%`). |
| Fortune & Silk Touch Support | Honors Silk Touch drops and vanilla Fortune item multipliers. |
| Zero Hunger Penalties | Applies no extra exhaustion or hunger drain beyond standard block breaking. |
| Instant Burst Mode | Breaks the full cluster or felled tree in the exact same tick with zero delay. |
| Natural Drops | Drops items at each block's location with authentic survival physics. |
| Vanilla Leaf Decay | Leaves canopies intact so leaves naturally decay into saplings and apples. |

---

## How It Works

| Action | Requirement | What Happens |
| :--- | :--- | :--- |
| Standard Mining | Standing or walking | Breaks single block with standard vanilla drops. |
| Tree Capitation | Sneak with an Axe | Fells connected trunk logs and branches upward up to 128 blocks in one tick. |
| Domino Ore Mining | Sneak with a Pickaxe | Sweeps contiguous ore veins across 26 spatial neighbors up to 64 blocks. |
| Durability Protection | Tool hits 5 durability | Halts chain break immediately, preserves tool, and plays alert sound. |
| Tool Switch Safety | Switch or unequip tool | Terminates chain process instantly before processing the next block. |

---

## Tree Capitator Footprint Pattern

When you break an eligible log while sneaking with an axe, the add-on scans upward through the tree:

1. **Base Level**: Scans the 8 horizontal perimeter blocks around the broken log to catch 2x2 mega trunks (Dark Oak, Jungle, Spruce).
2. **Ascending Layers**: Evaluates a 3x3 footprint centered at every active trunk and branch coordinate found in the layer below.
3. **Safety Limits**: Capped at 128 logs per tree and bounded by world height (-64 to 320) to prevent runaway chain reactions into adjacent forests.

### Supported Trees
- **Overworld**: Oak, Spruce, Birch, Jungle, Acacia, Dark Oak, Mangrove (including roots), Cherry, and Pale Oak.
- **Nether**: Crimson Stem, Warped Stem, Crimson Hyphae, Warped Hyphae.
- **Wood Variants**: All stripped logs and all 6-sided bark wood blocks.
- **Canopy Leaves**: Left intact for natural leaf decay so saplings, sticks, and apples drop normally over time.

---

## Domino Ore Miner & Mineral Categories

Domino Ore Miner checks all 26 spatial neighbors (faces, edges, and corners) using iterative breadth-first search. Veins are contiguous with no arbitrary distance limits up to the 64-block cluster cap. Regular stone and deepslate ores share the same mineral category, allowing veins that cross stone layers to mine seamlessly:

| Category | Supported Block IDs | Minimum Pickaxe | Drops |
| :--- | :--- | :--- | :--- |
| **Coal** | `minecraft:coal_ore`, `minecraft:deepslate_coal_ore` | Wooden+ | Coal |
| **Iron** | `minecraft:iron_ore`, `minecraft:deepslate_iron_ore` | Stone+ | Raw Iron |
| **Copper** | `minecraft:copper_ore`, `minecraft:deepslate_copper_ore` | Stone+ | Raw Copper (2–5) |
| **Gold** | `minecraft:gold_ore`, `minecraft:deepslate_gold_ore` | Iron+ | Raw Gold |
| **Nether Gold** | `minecraft:nether_gold_ore` | Wooden+ | Gold Nuggets (2–6) |
| **Lapis Lazuli** | `minecraft:lapis_ore`, `minecraft:deepslate_lapis_ore` | Stone+ | Lapis Lazuli (4–9) |
| **Redstone** | `minecraft:redstone_ore`, `minecraft:deepslate_redstone_ore` | Iron+ | Redstone Dust (4–5) |
| **Diamond** | `minecraft:diamond_ore`, `minecraft:deepslate_diamond_ore` | Iron+ | Diamond |
| **Emerald** | `minecraft:emerald_ore`, `minecraft:deepslate_emerald_ore` | Iron+ | Emerald |
| **Nether Quartz** | `minecraft:quartz_ore`, `minecraft:nether_quartz_ore` | Wooden+ | Nether Quartz |
| **Ancient Debris** | `minecraft:ancient_debris` | Diamond+ | Ancient Debris Block |

*Only blocks of the same mineral category are traversed. Pickaxe tier validation ensures lower-tier tools will not trigger higher-tier ore chains.*

---

## Durability Protection System

- Queries `minecraft:durability` before breaking each secondary block.
- Halts immediately when remaining durability (`maxDurability - damage`) reaches 5 or less.
- Plays an audible warning sound (`note.bass`) and displays an action bar alert:
  ```text
  [Tool Protection] Stopped mining to save tool! (5 durability left)
  ```
- Revalidates the equipped tool before each block break. If the tool is switched or removed, chain mining stops instantly.
- Applies standard vanilla Unbreaking probabilities (`100 / (level + 1)%`) per block.

---

## Configuration

Settings can be customized in [`behavior_pack/scripts/config.js`](behavior_pack/scripts/config.js):

```javascript
export const CONFIG = {
  TREE_CAPITATOR_ENABLED: true,      // Enable or disable tree felling
  DOMINO_ORE_MINER_ENABLED: true,    // Enable or disable ore vein mining
  MAX_TREE_BLOCKS: 128,              // Maximum logs broken per tree
  MAX_TREE_HEIGHT: 320,              // Maximum vertical search height
  MAX_ORE_CLUSTER_SIZE: 64,          // Maximum ores broken per vein
  INSTANT_BURST: true,               // Break entire cluster in a single tick
  DURABILITY_SAFETY_THRESHOLD: 5,    // Stop mining when durability hits this number
  ALERT_SOUND: "note.bass",          // Sound played when tool protection activates
  ALERT_PITCH: 0.7,                  // Pitch of the protection sound
  ALERT_VOLUME: 1.0,                 // Volume of the protection sound
  NETHER_GOLD_POLICY: "nether_gold", // "nether_gold" (distinct) or "gold" (shared)
};
```

---

## Compatibility

- Minecraft Bedrock Edition 1.21.0+
- Requires `@minecraft/server` 1.13.0+
- Requires Beta APIs experimental toggle
- Pure Behavior Pack format (.mcpack and .mcaddon)
- Compatible with Mobile, Windows, Console, and Realms
- Multiplayer compatible with isolated per-player recursion guards

---

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Permitted to feature this add-on in gameplay videos and streams with attribution to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.
