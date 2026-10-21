# Changelog — Vanilla Quality of Life

## [1.3.17] - 2026-10-18

### Fixed
- Corrected offhand torch stack updates so placing any supported torch consumes exactly one item in Survival and Adventure modes.
- Corrected wall-mounted orientation for regular torches, Soul Torches, and Redstone Torches so they face their supporting block instead of breaking immediately.

## [1.3.15] - 2026-10-18

### Improved & Balanced
- Added Redstone Torch to offhand quick-swap and dynamic handheld lighting, using light level 7.
- Kept chain-mining durability protection aligned with the configured one-durability-point threshold.

### Fixed
- Corrected tool selection for sandstone, red sandstone, and mud-brick blocks.
- Prevented axes from qualifying as pickaxes for ore-chain mining.
- Restricted Fortune multipliers to eligible ore categories, excluding raw iron, raw gold, and ancient debris.
- Tightened tree-canopy checks to reduce false positives from blocks below the trunk and unrelated Nether canopy blocks.

## [1.3.13] - 2026-10-17

### Changed
- Standardized the available mining presets so players can choose the intended tool behavior.
- Kept the no-sneak behavior limited to Tree Capitator and Domino Ore Miner; the required tool must be held in selected hotbar slot 1.
- Removed obsolete mining preset choices.

## [1.3.9] - 2026-10-17

### Changed
- Simplified mining presets to three choices: No Sneak (Slot 1 Required), Both Off, and Default (Sneak Required).
- Added a No Sneak preset for Tree Capitator and Domino Ore Miner; it only activates when the required tool is held in the selected first hotbar slot.
- Kept the sneak requirement for mining in the Default preset and left other add-on features unchanged.
- Aligned the pack versions so the add-on components remain in step.

## [1.3.6] - 2026-10-17

### Fixed
- Added a **Default (All Features)** mining preset.
- Kept the default configuration enabled for both Tree Capitator and Vein Miner.

## [1.3.3] - 2026-10-17

### Added
- **Optional Mining Presets**: Added selectable Behavior Pack presets for Tree Capitator Only, Vein Miner Only, and Vanilla Mining (both disabled). The default pack keeps both features enabled. Other QoL features remain active in every preset.
- **Independent Mining Presets:** Players can choose Tree Capitator, Vein Miner, or vanilla mining behavior through the available presets.

---

## [1.3.2] - 2026-10-16

### Added & Improved
- **The Leaf Scan (Player-Placed Leaves Ignored)**: Overworld tree canopy detection now evaluates natural leaf growth. Decorative leaves harvested with shears and placed manually by players are recognized as custom decorations and completely ignored, preventing custom hedges, bushes, and decorative roof foliage from falsely triggering tree felling or getting destroyed. Only naturally grown leaves and Nether canopies validate the tree canopy.

---

## [1.3.1] - 2026-10-15

### Balance & Compatibility Update
- **Mob Head Drops Balanced**: Standardized mob head drops (Zombie, Skeleton, Creeper, Piglin, Wither Skeleton, Ender Dragon, PvP Player) to a balanced 1.0% base drop chance (+0.5% per Looting level up to 2.5% max at Looting III).
- **Wandering Trader Collector Head Trades**: Adjusted head trade offering probability to a rare 2% spawn rate in collector trade pools, priced at 1 Diamond Block + 16 Emeralds per head.
- **Shulker Shell Drop Rate**: Adjusted Shulker Shell drops to 1 to 2 shells (yielding 2 to 3 with Looting enchantments).
- **Boss Leashing Immunity**: Removed leashing capability from the Warden, Wither, and Ender Dragon to maintain boss encounter integrity while preserving universal leashing on all 98 standard entities.
- **Tree Capitator House Protection & 26-Neighbor Traversal**: Upgraded tree log detection to a unified upward-biased 26-neighbor 3D flood-fill algorithm (evaluating all adjacent coordinates `dx, dy, dz ∈ [-1, 0, 1]` with `dy >= 0`), allowing seamless felling of complex branching and diagonal canopies while maintaining strict species matching and canopy protection (`isTreeCanopy`) to prevent accidental cabin destruction.
- **Domino Ore Miner Ancient Debris Cap**: Capped contiguous Ancient Debris chain mining to a maximum of 4 blocks (`MAX_ANCIENT_DEBRIS_CLUSTER_SIZE: 4`) to preserve Netherite vein discovery balance.
- **Durability Safety Guard Threshold**: Tuned durability safety guard threshold from 5 to 1 durability point, giving players maximum tool usage before emergency protection activates.
- **Stonecutter Woodcutter All 12 Woods**: Added full Stonecutter recipe support for Pale Oak (Logs to Planks, Slabs, Stairs, Fences, Fence Gates, and Trapdoors), completing support for all 12 wood variants in Minecraft Bedrock.
- **Standalone BP Compatibility**: Decoupled the Resource Pack UUID dependency from `behavior_pack/pack settings`, allowing the Behavior Pack (`.mcpack`) to run independently without "missing pack" warnings, while still bundling seamlessly in the `.mcaddon`.

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
  - Sneak while chopping any tree log to fell the entire trunk and connected branches up to **128 logs** immediately.
  - **3×3 Trunk Column Scan**: Evaluates 8 side blocks around the cut log (`~-1 ~ ~-1` to `~1 ~ ~1`) and 9 blocks directly above layer-by-layer up the trunk with zero downward digging.
  - **Canopy / Branch "Virus" Flood-Fill**: Once the trunk column ends, an outward contagion flood-fill infects and fells all contiguous horizontal and upward branch logs (`dy >= 0`) until no connected tree logs remain.
  - **Tree Species Matching**: Ensures Oak only fells Oak and Birch only fells Birch, preventing collateral damage in dense tree farms or forests.
  - Preserves natural leaf canopies for authentic vanilla leaf decay drops (saplings, sticks, apples).
- **Domino Ore Miner (Sneak + Pickaxe)**:
  - Sneak while mining any mineral ore to harvest the entire contiguous vein across **all 26 spatial neighbors** (faces, edges, corners) up to **64 blocks**.
  - **Mineral Category Normalization**: Groups regular and deepslate ore variants so veins crossing stone layers mine seamlessly together.
  - Full Fortune and Silk Touch support: Correctly honors Silk Touch block drops and vanilla Fortune item multipliers.
- **Offhand Torch Placement (Sneak + Click Block)**:
  - When holding a Torch, Soul Torch, or Redstone Torch in your offhand, simply **Sneak and Click** on any block to place it directly from your offhand onto the floor or wall.
  - Automatically determines wall/floor orientation (`top`, `north`, `south`, `east`, `west`) and plays authentic placement sound.
  - Decrements offhand stack in Survival/Adventure mode (unlimited in Creative).
  - Cave-mining quality of life: keep your Pickaxe in your mainhand while placing torches without swapping items.
- **Durability Safety Guard**:
  - Automatically halts chain breaks when tool durability drops to **1 point remaining**.
  - Flashes an on-screen action bar warning and plays an alert sound to protect valuable enchanted tools.

### Changed
- Aligned the pack requirements to reduce missing-dependency warnings on supported game versions.

---

## [1.2.6] - 2026-10-14

### Added
- **Dynamic Handheld & Offhand Lighting**: Moving Torches and Lanterns emit real-time Light Levels 10–15 via `minecraft:light_block`.
- **Offhand Quick-Swap**: Double-sneak gesture or sneak+use in air to quickly swap Torches, Lanterns, Clocks, and Compasses between mainhand and offhand.


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
