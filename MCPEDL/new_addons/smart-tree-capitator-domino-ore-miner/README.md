# Smart Tree Capitator & Domino Ore Miner — Vein & Tree Miner for Minecraft Bedrock

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21.0%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Achievement Friendly](https://img.shields.io/badge/Achievements-Friendly-brightgreen?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Script API](https://img.shields.io/badge/Script%20API-%40minecraft%2Fserver%201.13.0%2B-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCPACK-orange?style=flat-square)](../README.md#available-source-add-ons)
[![Release](https://img.shields.io/badge/Release-v1.0.0-blue?style=flat-square)](../README.md#available-source-add-ons)

**By AllensCreations**

**SNEAK-ACTIVATED VEIN MINING & BUILT-IN TOOL PROTECTION**

Effortlessly fell entire trees and mine contiguous ore veins with a single sneak-break, protected by automated durability safety stops.

---

## Overview

Mining deep underground veins block-by-block and cutting tall jungle or acacia trees from the canopy down can be tedious.

**Smart Tree Capitator & Domino Ore Miner** introduces high-speed sneak-activated vein mining and tree felling to Minecraft Bedrock Edition. Built on the modern Bedrock Script API (`@minecraft/server`), it allows you to topple whole trees and sweep full ore veins in smooth domino sequence—while guaranteeing that your favorite enchanted tools will never break by mistake.

No extra hunger penalties. Normal single-block mining is preserved whenever you stand upright.

---

## Key Features

| Feature | Description |
| :--- | :--- |
| **Sneak-Activated** | Only activates while sneaking. Stand upright to mine normal single blocks with zero interference. |
| **Footprint Tree Capitator** | Layer-by-layer 3×3 vertical footprint scan captures straight trunks, diagonal branches, and 2×2 giant trees without jumping across forest boundaries. |
| **26-Neighbor Domino Ore Miner** | True 3D breadth-first search connects full clusters through face, edge, and corner connections up to 64 blocks. |
| **Mineral Category Normalization** | Groups deepslate and regular variants into unified mineral families (e.g. Deepslate Diamond + Diamond Ore). |
| **Durability Safety Guard** | Automatically stops chain mining when tool durability hits 5 points remaining, playing an alert sound and preserving your gear. |
| **Unbreaking Respect** | Accurately factors in the vanilla Unbreaking enchantment formula (`100 / (level + 1)%` damage chance). |
| **Fortune & Silk Touch Support** | Silk Touch drops whole ore blocks; Fortune rolls authentic multi-drop quantities. |
| **Zero Hunger Penalties** | Applies no additional exhaustion or hunger drain beyond the normal block break. |
| **Instantaneous Burst Mode** | Breaks the entire cluster or felled tree in the exact same tick with zero delay. |
| **Natural Drops** | Drops items naturally at each block's location with authentic survival physics. |
| **Vanilla Leaf Decay** | Leaves natural gradual leaf decay intact so canopies drop saplings and apples gradually. |

---

## Core Activation Rules & Controls

| Action | Stance | Held Tool | Target Block | Result |
| :--- | :--- | :--- | :--- | :--- |
| **Standard Mining** | Standing / Walking | Any | Any block | Normal vanilla single-block break. |
| **Tree Capitation** | **Sneaking** | Axe | Any Log, Wood, or Stem | Fells connected trunk and branches upward. |
| **Domino Ore Mining** | **Sneaking** | Pickaxe | Any Supported Ore | Mines the full contiguous ore cluster. |

---

## Tree Capitator Footprint Pattern

Tree Capitator utilizes a vertical footprint scan designed specifically for Bedrock Edition trees:

1. **Layer 0 (Base Level)**: Scans the 8 horizontal perimeter neighbors around the broken block to detect 2×2 mega trunks (e.g. Dark Oak, Jungle, Spruce).
2. **Ascending Layers (y + 1 to y + 36)**: Evaluates a 3×3 footprint centered at every active trunk and branch coordinate found at the previous layer.
3. **Safety Caps**: Limits maximum blocks to 128 logs per operation to prevent excessive processing, adhering to world build boundaries.

### Supported Tree Types
- **Overworld**: Oak, Spruce, Birch, Jungle, Acacia, Dark Oak, Mangrove (including roots), Cherry, and Pale Oak.
- **Nether Fungi**: Crimson and Warped Stems and Hyphae.
- **Wood Variants**: All stripped logs and six-sided wood bark blocks.

---

## Domino Ore Miner & Mineral Categories

Domino Ore Miner checks all 26 spatial neighbors (faces, edges, and vertices) using iterative breadth-first search (BFS). There is no arbitrary distance limit: it traverses purely contiguous connected ores up to the 64-block cluster ceiling. Ore blocks are normalized into mineral categories so stone and deepslate variants seamlessly connect:

| Mineral Category | Supported Block Identifiers | Min Tool Tier | Default Drops |
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

*Only blocks of the same mineral category are traversed. Tool tier validation ensures wooden or stone pickaxes will not trigger diamond or ancient debris chains.*

---

## Durability Protection System

Never lose a god-pickaxe to an unexpected huge cluster:

1. **Safety Threshold**: Prior to breaking each secondary block, the script queries `minecraft:durability`.
2. **Threshold Halt**: If `maxDurability - damage <= 5`, chain mining ceases immediately.
3. **Audio & Visual Alert**: Plays an audible warning sound (`note.bass`) and displays an action bar alert:
   ```text
   [Tool Protection] Stopped mining to save tool! (5 durability left)
   ```
4. **Tool Re-Validation**: If the tool is switched or unequipped during mining, processing terminates instantly.

---

## Configuration

All search limits, thresholds, and pacing values can be customized in [`scripts/config.js`](scripts/config.js):

```javascript
export const CONFIG = {
  TREE_CAPITATOR_ENABLED: true,      // Enable/disable tree capitator
  DOMINO_ORE_MINER_ENABLED: true,    // Enable/disable domino ore miner
  MAX_TREE_BLOCKS: 128,              // Maximum logs per tree
  MAX_TREE_HEIGHT: 36,               // Maximum vertical search blocks
  MAX_ORE_CLUSTER_SIZE: 64,          // Maximum ores per cluster
  MAX_ORE_SEARCH_DISTANCE: 16,       // Maximum block radius for ore veins
  BLOCKS_PER_TICK: 6,                // Blocks broken per tick (6 = smooth 20 TPS)
  DURABILITY_SAFETY_THRESHOLD: 5,    // Stop threshold for tool durability
  ALERT_SOUND: "note.bass",          // Protection alert sound cue
  NETHER_GOLD_POLICY: "nether_gold", // Category policy for Nether gold ore
};
```

---

## Compatibility

- Minecraft Bedrock Edition 1.21.0+ (compatible with 1.26+ standards)
- Requires `@minecraft/server` 1.13.0+
- Behavior Pack format (zero custom entities or resource packs required)
- Compatible with Windows, Android, iOS, Xbox, PlayStation, Nintendo Switch, and dedicated servers/Realms
- Fully multiplayer compatible with per-player recursion guards

---

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Permitted to feature this add-on in gameplay videos and streams with attribution to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.
