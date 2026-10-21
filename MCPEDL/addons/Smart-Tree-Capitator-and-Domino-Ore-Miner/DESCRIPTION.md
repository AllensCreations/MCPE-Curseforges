# Smart Tree Capitator and Domino Ore Miner (v1.0.8) — Vein and Tree Miner

**By AllensCreations**

**SNEAK-ACTIVATED VEIN MINING & BUILT-IN TOOL PROTECTION**

Fell entire trees and mine contiguous ore veins in a single sneak-break, protected by automated durability safety stops.

---

## Overview

Mining large underground ore clusters and chopping tall trees one block at a time takes unnecessary time.

**Smart Tree Capitator & Domino Ore Miner** adds sneak-activated chain mining to Minecraft Bedrock Edition . Sneak while breaking a log or ore to fell the entire tree or harvest the connected ore vein in one action. Chain mining stops when the tool has 5 durability points remaining, helping prevent breakage.

Standing upright leaves standard vanilla single-block mining untouched. The add-on adds no extra hunger or exhaustion penalties.

---

## Key Features

### Sneak-Activated Mining
- **Description**: Chains only while sneaking, keeping single-block mining intact when upright.

### Connected Tree Felling
- **Description**: Follows connected logs and branches while matching wood types and protecting nearby builds.

### Connected Ore Mining
- **Description**: Connects touching ore blocks, including diagonal connections, up to 64 blocks.

### Mineral Category Normalization
- **Description**: Groups regular and deepslate ore variants so veins crossing stone layers mine together.

### Durability Safety Guard
- **Description**: Automatically stops chain mining when tool durability reaches 5 points remaining.

### Unbreaking Respect
- **Description**: Factors in vanilla Unbreaking enchantment probabilities (standard Unbreaking enchantment behavior).

### Fortune & Silk Touch Support
- **Description**: Honors Silk Touch drops and vanilla Fortune item multipliers.

### Zero Hunger Penalties
- **Description**: Applies no extra exhaustion or hunger drain beyond standard block breaking.

### Instant Burst Mode
- **Description**: Breaks the full cluster or felled tree in the in one action.

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

## How Tree Felling Works

When you break an eligible log while sneaking with an axe, the add-on scans upward through the tree:

1. **Connected Branches**: Follows connected logs and branches, including diagonal connections.
2. **Matching Wood Types**: Only the same wood type is felled, helping protect nearby trees.
3. **The Leaf Scan (Player-Placed Leaves Ignored)**: Ignores player-placed leaves (sheared decorative leaves), ensuring custom hedges, bushes, and decorative roof foliage are never falsely detected as natural tree canopies.
4. **Build Protection**: Uses nearby natural canopy clues to reduce accidental damage to wooden builds.
5. **Safety Limits**: Capped at 128 logs per tree and bounded by world height (-64 to 320) to prevent runaway chain reactions.

### Supported Trees
- **Overworld**: Oak, Spruce, Birch, Jungle, Acacia, Dark Oak, Mangrove (including roots), Cherry, and Pale Oak.
- **Nether**: Crimson Stem, Warped Stem, Crimson Hyphae, Warped Hyphae.
- **Wood Variants**: All stripped logs and all 6-sided bark wood blocks.
- **Canopy Leaves**: Left intact for natural leaf decay so saplings, sticks, and apples drop normally over time.

---

## How Ore Mining Works

Domino Ore Miner checks all 26 spatial neighbors (faces, edges, and corners) using iterative breadth-first search. Veins are contiguous with no arbitrary distance limits up to the 64-block cluster cap. Regular stone and deepslate ores share the same mineral category, allowing veins that cross stone layers to mine seamlessly:

### Coal
- **Supported Ores**: 
- **Minimum Pickaxe**: Wooden+
- **Drops**: Coal

### Iron
- **Supported Ores**: 
- **Minimum Pickaxe**: Stone+
- **Drops**: Raw Iron

### Copper
- **Supported Ores**: 
- **Minimum Pickaxe**: Stone+
- **Drops**: Raw Copper (2–5)

### Gold
- **Supported Ores**: 
- **Minimum Pickaxe**: Iron+
- **Drops**: Raw Gold

### Nether Gold
- **Supported Ores**: 
- **Minimum Pickaxe**: Wooden+
- **Drops**: Gold Nuggets (2–6)

### Lapis Lazuli
- **Supported Ores**: 
- **Minimum Pickaxe**: Stone+
- **Drops**: Lapis Lazuli (4–9)

### Redstone
- **Supported Ores**: 
- **Minimum Pickaxe**: Iron+
- **Drops**: Redstone Dust (4–5)

### Diamond
- **Supported Ores**: 
- **Minimum Pickaxe**: Iron+
- **Drops**: Diamond

### Emerald
- **Supported Ores**: 
- **Minimum Pickaxe**: Iron+
- **Drops**: Emerald

### Nether Quartz
- **Supported Ores**: 
- **Minimum Pickaxe**: Wooden+
- **Drops**: Nether Quartz

### Ancient Debris
- **Supported Ores**: 
- **Minimum Pickaxe**: Diamond+
- **Drops**: Ancient Debris Block

*Only blocks of the same mineral category are traversed. Pickaxe tier validation ensures lower-tier tools will not trigger higher-tier ore chains.*

---

## Durability Protection System

- Queries  before breaking each secondary block.
- Halts immediately when remaining durability () reaches 5 or less.
- Plays an audible warning sound (warning sound) and displays an action bar alert:
  > **[Tool Protection]** Stopped mining to save tool! (5 durability left)
- Revalidates the equipped tool before each block break. If the tool is switched or removed, chain mining stops instantly.
- Applies standard vanilla Unbreaking probabilities (standard Unbreaking enchantment behavior) per block.

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
- Experimental features: Check the current release instructions and world settings.
- Pure Behavior Pack format (.mcpack and .mcaddon)
- Multiplayer behavior should be checked in the target game version.

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

Smart Tree Capitator and Domino Ore Miner Bedrock add-on, Sneak Minecraft Bedrock, Mineral Category Normalization Minecraft Bedrock, Durability Safety Guard Minecraft Bedrock, Unbreaking Respect Minecraft Bedrock, Minecraft PE mod, MCPEDL add-on, CurseForge Bedrock, AllensCreations.
