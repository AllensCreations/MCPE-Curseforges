# Smart Tree Capitator & Domino Ore Miner

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21.0%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Script API](https://img.shields.io/badge/Script%20API-%40minecraft%2Fserver%201.13.0%2B-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCPACK%20%2F%20.MCADDON-orange?style=flat-square)](../README.md#available-source-add-ons)
[![Release](https://img.shields.io/badge/Release-v1.0.0-blue?style=flat-square)](../README.md#available-source-add-ons)

**By AllensCreations**

Sneak-activated vein mining and tree felling with built-in tool durability protection for Minecraft Bedrock Edition.

---

## Overview

Mining large underground ore clusters and chopping tall trees one block at a time takes unnecessary time.

**Smart Tree Capitator & Domino Ore Miner** adds sneak-activated chain mining to Minecraft Bedrock Edition using the Script API (`@minecraft/server`). Sneak while breaking a log or ore to fell the entire tree or harvest the connected ore vein in a single tick. Tools stop mining when durability drops to 5, preventing accidental breakage.

Standing upright leaves standard vanilla single-block mining untouched. The add-on adds no extra hunger or exhaustion penalties.

---

## Installation & World Setup

This add-on uses the Bedrock Script API and requires the **Beta APIs** experimental toggle.

### 1. Import the Pack
- **Windows / PC**: Double-click the downloaded `.mcpack` or `.mcaddon` file. Minecraft Bedrock will open and import the pack automatically.
- **Android / iOS**: Tap the downloaded file in your file browser or downloads menu and select **Open in Minecraft**.
- **Dedicated Server / Realm**: Upload the pack folder or `.mcpack` to the server's `behavior_packs/` directory and add the pack UUID to `world_behavior_packs.json`.

### 2. Apply to Your World
1. Edit an existing world or create a new one.
2. Navigate to **Behavior Packs** in the left sidebar.
3. Under **Available**, locate **Smart Tree Capitator & Domino Ore Miner** and click **Activate**.

### 3. Enable Required Experiments
1. Scroll down to the **Experiments** section in World Settings.
2. Toggle **Beta APIs** to **On**.
3. Confirm the prompt to enable experiments.

---

## Controls

Both mechanics trigger only while crouching (sneaking). When standing, all blocks mine normally.

| Platform | Sneak Input | Mining Action |
| :--- | :--- | :--- |
| **Keyboard & Mouse (PC)** | Hold `Shift` | Mine log with axe or ore with pickaxe |
| **Touch Controls (Mobile)** | Double-tap or toggle crouch button | Mine log with axe or ore with pickaxe |
| **Controller (Console / PC)** | Press right stick or crouch button | Mine log with axe or ore with pickaxe |

### Mining Rules

| Stance | Tool | Target Block | Result |
| :--- | :--- | :--- | :--- |
| Standing / Walking | Any | Any block | Normal vanilla single-block break |
| **Sneaking** | Axe | Log, Wood, Stem, or Hyphae | Fells trunk and connected branches upward |
| **Sneaking** | Pickaxe | Supported Ore Block | Mines entire connected ore cluster |

---

## Tree Capitator

When you break a log while sneaking with an axe in hand, the add-on scans upward through the tree canopy.

### Footprint Scan Pattern
1. **Base Level**: Scans the 8 horizontal perimeter blocks around the broken log to catch 2x2 mega trunks (Dark Oak, Jungle, Spruce).
2. **Ascending Layers**: Evaluates a 3x3 footprint centered at every active trunk and branch coordinate found in the layer below.
3. **Safety Limits**: Capped at 128 logs per tree and bounded by world height (-64 to 320) to prevent runaway chain reactions into adjacent forests.

### Supported Trees
- **Overworld**: Oak, Spruce, Birch, Jungle, Acacia, Dark Oak, Mangrove (including roots), Cherry, and Pale Oak.
- **Nether**: Crimson Stem, Warped Stem, Crimson Hyphae, Warped Hyphae.
- **Wood Variants**: All stripped logs and all 6-sided bark wood blocks.
- **Canopy Leaves**: Left intact for natural leaf decay so saplings, sticks, and apples drop normally over time.

---

## Domino Ore Miner

When you mine an ore block while sneaking with a pickaxe, the add-on runs an iterative 3D breadth-first search across all 26 spatial neighbors (faces, edges, and corners).

### Rules & Limits
- **Connected Only**: Finds contiguous veins without jumping through stone or air pockets.
- **Cluster Cap**: Up to 64 ore blocks per vein.
- **Instant Burst**: Breaks the matching cluster in the same tick.
- **Tier Validation**: Pickaxe tier must meet or exceed the ore requirement. Breaking diamond ore with a stone pickaxe will not trigger a chain.

### Mineral Categories & Drop Rules

Regular stone and deepslate ores share the same mineral category, allowing veins that cross the stone/deepslate layer boundary to mine seamlessly:

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

*Note: Nether Gold is a separate category from Overworld Gold to prevent unintended cross-mining in custom or glitch scenarios.*

---

## Durability & Enchantment Handling

### Tool Protection
- Reads `minecraft:durability` before breaking each secondary block.
- Halts immediately when remaining durability (`maxDurability - damage`) reaches **5 or less**.
- Plays a warning sound (`note.bass`) and displays an action bar message:
  ```text
  [Tool Protection] Stopped mining to save tool! (5 durability left)
  ```
- Stops immediately if you swap or unequip the tool during mining.

### Enchantment Compatibility
- **Silk Touch**: Preserves full ore blocks (such as Diamond Ore or Deepslate Coal Ore) instead of dropping items.
- **Fortune (I–III)**: Applies standard vanilla Fortune drop multipliers for ores that drop items.
- **Unbreaking (I–III)**: Uses vanilla probability `100 / (level + 1)%` per secondary block. The tool takes less damage over large clusters.

---

## Configuration

Settings can be modified in [`behavior_pack/scripts/config.js`](behavior_pack/scripts/config.js):

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

- Minecraft Bedrock Edition 1.21.0 or newer
- Requires `@minecraft/server` 1.13.0 or newer
- Requires **Beta APIs** experimental toggle
- Pure Behavior Pack (no custom entities, no custom items, no resource pack required)
- Works on Windows, iOS, Android, Xbox, PlayStation, Nintendo Switch, and dedicated servers / Realms

---

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Free to feature this add-on in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload the pack or mirror downloads behind monetization links. Link to the official repository page.

---

© All rights reserved for AllensCreations.
