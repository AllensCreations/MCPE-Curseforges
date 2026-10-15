# Changelog — Vanilla Quality of Life

All notable changes to the **Vanilla Quality of Life** add-on by AllensCreations will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.0] - 2026-10-15

### Major Integration Update: The Survival Powerhouse

This major milestone integrates **Passive Auto-Switch Tools**, **Smart Tree Capitator**, and **Domino Ore Miner** directly into the core Vanilla Quality of Life suite, creating the ultimate all-in-one survival add-on for Minecraft Bedrock.

### Added
- **Passive Auto-Switch Tools (Slot 1)**:
  - Automatic tool selection whenever the player attacks or mines blocks while holding **Slot 1** (hotbar index 0).
  - Automatically equips Pickaxe (stone, ores, obsidian, terracotta), Axe (logs, wood, planks), Shovel (dirt, sand, gravel, clay), Shears (cobwebs, leaves), and Hoe.
  - Automatically equips the best melee weapon (Sword, Axe, or Mace) when attacking hostile or passive mobs.
  - Durability health scoring: Intelligently avoids selecting nearly-broken tools to preserve gear.
  - Automated cobweb shear interaction loop.
- **Smart Tree Capitator (Sneak + Axe)**:
  - Sneak while chopping any tree log to fell the entire trunk and connected branches up to **128 logs** in a single tick.
  - **5×5 Extended Footprint Scan (`~2` to `~-2`)**: Follows diagonal and curved trunks/branches across Acacia, Cherry, Large Oak, Dark Oak, and Mangrove without leaving floating orphan logs.
  - **Downward Stump Sweep (`dy: -1..-2`)**: Automatically clears bottom stumps and surface roots when chopping at eye level.
  - **Tree Species Matching**: Ensures Oak only fells Oak and Birch only fells Birch, preventing collateral damage in dense tree farms or forests.
  - Preserves natural leaf canopies for authentic vanilla leaf decay drops (saplings, sticks, apples).
- **Domino Ore Miner (Sneak + Pickaxe)**:
  - Sneak while mining any mineral ore to harvest the entire contiguous vein across **all 26 spatial neighbors** (faces, edges, corners) up to **64 blocks**.
  - **Mineral Category Normalization**: Groups regular and deepslate ore variants so veins crossing stone layers mine seamlessly together.
  - Full Fortune and Silk Touch support: Correctly honors Silk Touch block drops and vanilla Fortune item multipliers.
- **Durability Safety Guard**:
  - Automatically halts chain breaks when tool durability drops to **5 points remaining**.
  - Flashes an on-screen action bar warning and plays an alert sound to protect valuable enchanted tools.

### Changed
- Synchronized Behavior Pack and Resource Pack manifest dependencies and module versions to `[1, 3, 0]`.
- Normalized `min_engine_version` to `[1, 21, 0]` across both manifests for flawless Bedrock 1.21+ compatibility without "missing dependencies" warnings.

---

## [1.2.6] - 2026-10-14

### Added
- **Dynamic Handheld & Offhand Lighting**: Moving Torches and Lanterns emit real-time Light Levels 10–15 via `minecraft:light_block`.
- **Offhand Quick-Swap**: Double-sneak gesture or sneak+use in air to quickly swap Torches, Lanterns, Clocks, and Compasses between mainhand and offhand.
- Script event command `/scriptevent qol:swap` for gamepad/macro controllers.

---

## [1.2.0] - 2026-10-10

### Added
- **Mob Head Trophy Drops**: 2.5% base drop chance on player kills for Zombie, Skeleton, Creeper, and Piglin heads.
- **Wandering Trader Collector Trades**: Rare head exchanges and biome flora trading.
- **Single-Player Sleep**: 1 player sleeping in a bed skips the night on multiplayer worlds and Realms.
- **Guaranteed Shulker Shells**: 2 shells guaranteed per Shulker kill.

---

## [1.1.0] - 2026-10-05

### Added
- **Stonecutter Woodcutter**: Cut all 11 wood types in the Stonecutter at fair 1:1 craft ratios (Planks, Slabs, Stairs, Fences, Gates).
- **Stackable Potions & Milk**: Potions, Splash Potions, Lingering Potions, and Milk Buckets stack up to 16 per inventory slot.

---

## [1.0.0] - 2026-09-28

### Initial Release
- **Universal Leashing**: Support for leashing 101 mobs including Villagers, Golems, and pacified hostiles.
- **Spider Leash Locators**: Custom torso locator alignment for spiders and cave spiders.
- **Pet Friendly-Fire Immunity**: Tamed companions take zero damage from friendly sweeps, arrows, and explosions.
- **Fast Leaf Decay**: Floating leaves decay within 1 to 2 seconds after tree felling.
