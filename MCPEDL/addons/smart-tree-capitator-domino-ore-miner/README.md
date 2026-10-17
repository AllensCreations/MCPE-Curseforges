# Smart Tree Capitator and Domino Ore Miner — Vein and Tree Miner by AllensCreations

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21.0%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCPACK%20%2F%20.MCADDON-orange?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/tree/main/MCPEDL/addons#available-add-ons)

**By AllensCreations**

**SNEAK-ACTIVATED VEIN MINING & BUILT-IN TOOL PROTECTION**

Fell entire trees and mine contiguous ore veins in a single sneak-break, protected by automated durability safety stops.

---

## Overview

Mining large underground ore clusters and chopping tall trees one block at a time takes unnecessary time.

**Smart Tree Capitator & Domino Ore Miner** adds sneak-activated chain mining to Minecraft Bedrock Edition using the modern Minecraft Bedrock mechanics. Sneak while breaking a log or ore to fell the entire tree or harvest the connected ore vein in a single tick. Tools stop mining when durability drops to 5, preventing accidental breakage.

Standing upright leaves standard vanilla single-block mining untouched. The add-on adds no extra hunger or exhaustion penalties.

---

## Key Features

### Sneak-Activated Mining
- **Description**: Chains only while sneaking, keeping single-block mining intact when upright.

### 26-Neighbor Tree Capitator
- **Description**: Upward-biased 26-neighbor 3D flood-fill scan captures straight trunks, diagonal branches, and mega canopies with species matching and house protection.

### 26-Neighbor Domino Ore Miner
- **Description**: True 3D breadth-first search connects full clusters through face, edge, and corner connections up to 64 blocks.

### Mineral Category Normalization
- **Description**: Groups regular and deepslate ore variants so veins crossing stone layers mine together.

### Durability Safety Guard
- **Description**: Automatically stops chain mining when tool durability reaches 5 points remaining.

### Unbreaking Respect
- **Description**: Factors in vanilla Unbreaking enchantment probabilities (`100 / (level + 1)%`).

### Fortune & Silk Touch Support
- **Description**: Honors Silk Touch drops and vanilla Fortune item multipliers.

### Zero Hunger Penalties
- **Description**: Applies no extra exhaustion or hunger drain beyond standard block breaking.

### Instant Burst Mode
- **Description**: Breaks the full cluster or felled tree in the exact same tick with zero delay.

### Natural Drops
- **Description**: Drops items at each block's location with authentic survival physics.

### Vanilla Leaf Decay
- **Description**: Leaves canopies intact so leaves naturally decay into saplings and apples.

---

## How It Works

### Standard Mining
- **Requirement**: Standing or walking
- **What Happens**: Breaks single block with standard vanilla drops.

### Tree Capitation
- **Requirement**: Sneak with an Axe
- **What Happens**: Fells connected trunk logs and branches upward up to 128 blocks in one tick.

### Domino Ore Mining
- **Requirement**: Sneak with a Pickaxe
- **What Happens**: Sweeps contiguous ore veins across 26 spatial neighbors up to 64 blocks.

### Durability Protection
- **Requirement**: Tool hits 5 durability
- **What Happens**: Halts chain break immediately, preserves tool, and plays alert sound.

### Tool Switch Safety
- **Requirement**: Switch or unequip tool
- **What Happens**: Terminates chain process instantly before processing the next block.

---

## Tree Capitator 26-Neighbor Traversal Pattern

When you break an eligible log while sneaking with an axe, the add-on scans upward through the tree:

1. **26-Neighbor Contiguous Search**: Evaluates all 26 surrounding spatial block coordinates (`dx, dy, dz ∈ [-1, 0, 1]`) with upward bias (`dy >= 0`), cleanly connecting branches, crooked trunks, and diagonal logs.
2. **Species Matching**: Only fells logs of the exact same wood species (e.g. Oak only fells Oak) to prevent jumping into adjacent trees.
3. **The Leaf Scan (Player-Placed Leaves Ignored)**: Ignores player-placed leaves (sheared decorative leaves), ensuring custom hedges, bushes, and decorative roof foliage are never falsely detected as natural tree canopies.
4. **House Protection (`isTreeCanopy`)**: Requires natural leaf, wart block, or shroomlight presence within the connected canopy before felling to protect log cabins and player builds from accidental destruction.
5. **Safety Limits**: Capped at 128 logs per tree and bounded by world height (-64 to 320) to prevent runaway chain reactions.

### Supported Trees
- **Overworld**: Oak, Spruce, Birch, Jungle, Acacia, Dark Oak, Mangrove (including roots), Cherry, and Pale Oak.
- **Nether**: Crimson Stem, Warped Stem, Crimson Hyphae, Warped Hyphae.
- **Wood Variants**: All stripped logs and all 6-sided bark wood blocks.
- **Canopy Leaves**: Left intact for natural leaf decay so saplings, sticks, and apples drop normally over time.

---

## Domino Ore Miner & Mineral Categories

Domino Ore Miner checks all 26 spatial neighbors (faces, edges, and corners) using iterative breadth-first search. Veins are contiguous with no arbitrary distance limits up to the 64-block cluster cap. Regular stone and deepslate ores share the same mineral category, allowing veins that cross stone layers to mine seamlessly:

### Coal
- **Supported Block IDs**: `minecraft:coal_ore`, `minecraft:deepslate_coal_ore`
- **Minimum Pickaxe**: Wooden+
- **Drops**: Coal

### Iron
- **Supported Block IDs**: `minecraft:iron_ore`, `minecraft:deepslate_iron_ore`
- **Minimum Pickaxe**: Stone+
- **Drops**: Raw Iron

### Copper
- **Supported Block IDs**: `minecraft:copper_ore`, `minecraft:deepslate_copper_ore`
- **Minimum Pickaxe**: Stone+
- **Drops**: Raw Copper (2–5)

### Gold
- **Supported Block IDs**: `minecraft:gold_ore`, `minecraft:deepslate_gold_ore`
- **Minimum Pickaxe**: Iron+
- **Drops**: Raw Gold

### Nether Gold
- **Supported Block IDs**: `minecraft:nether_gold_ore`
- **Minimum Pickaxe**: Wooden+
- **Drops**: Gold Nuggets (2–6)

### Lapis Lazuli
- **Supported Block IDs**: `minecraft:lapis_ore`, `minecraft:deepslate_lapis_ore`
- **Minimum Pickaxe**: Stone+
- **Drops**: Lapis Lazuli (4–9)

### Redstone
- **Supported Block IDs**: `minecraft:redstone_ore`, `minecraft:deepslate_redstone_ore`
- **Minimum Pickaxe**: Iron+
- **Drops**: Redstone Dust (4–5)

### Diamond
- **Supported Block IDs**: `minecraft:diamond_ore`, `minecraft:deepslate_diamond_ore`
- **Minimum Pickaxe**: Iron+
- **Drops**: Diamond

### Emerald
- **Supported Block IDs**: `minecraft:emerald_ore`, `minecraft:deepslate_emerald_ore`
- **Minimum Pickaxe**: Iron+
- **Drops**: Emerald

### Nether Quartz
- **Supported Block IDs**: `minecraft:quartz_ore`, `minecraft:nether_quartz_ore`
- **Minimum Pickaxe**: Wooden+
- **Drops**: Nether Quartz

### Ancient Debris
- **Supported Block IDs**: `minecraft:ancient_debris`
- **Minimum Pickaxe**: Diamond+
- **Drops**: Ancient Debris Block

*Only blocks of the same mineral category are traversed. Pickaxe tier validation ensures lower-tier tools will not trigger higher-tier ore chains.*

---

## Durability Protection System

- Queries `minecraft:durability` before breaking each secondary block.
- Halts immediately when remaining durability (`maxDurability - damage`) reaches 5 or less.
- Plays an audible warning sound (`note.bass`) and displays an action bar alert:
  > **[Tool Protection]** Stopped mining to save tool! (5 durability left)
- Revalidates the equipped tool before each block break. If the tool is switched or removed, chain mining stops instantly.
- Applies standard vanilla Unbreaking probabilities (`100 / (level + 1)%`) per block.

---

## Default Settings

### Tree Capitator
- **Default Value**: Enabled
- **Description**: Fells connected trunks and branches up to 128 logs

### Domino Ore Miner
- **Default Value**: Enabled
- **Description**: Mines connected ore clusters up to 64 blocks

### Mining Speed
- **Default Value**: Instant Burst
- **Description**: Mines the full vein or tree in a single stroke

### Durability Safety Stop
- **Default Value**: 5 Durability
- **Description**: Halts automatically to protect rare tools from breaking

### Alert Audio
- **Default Value**: Bass Note
- **Description**: Plays an alert sound when safety stop activates

---

## Compatibility

- Minecraft Bedrock Edition 1.21.0+
- Experimental Features toggle enabled in World Settings
- Pure Behavior Pack format (.mcpack and .mcaddon)
- Multiplayer compatible with isolated per-player recursion guards

---

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Permitted to feature this add-on in gameplay videos and streams with attribution to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.

---

## Search & Discovery Keywords

Minecraft Bedrock tree capitator, domino ore miner, sneak vein mining, chain ore miner, Bedrock lumberjack mod, tool durability safety, Minecraft PE mining mod, MCPEDL, CurseForge, AllensCreations.
