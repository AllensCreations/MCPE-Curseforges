# Changelog — Vanilla Quality of Life

## [1.3.21] — 2026-10-28

### Improved & Balanced
- **Redstone Fortune**: Chain-mined Redstone Ore with Fortune now drops extra dust the way the single-block version does, instead of multiplying the whole stack.
- **Ore Experience**: Chain-mined ores now award their normal experience when mined without Silk Touch.
- **Tree Capitator Limits**: Logs more than 8 blocks away from the broken log are ignored, so neighboring trees are far less likely to be felled together.
- **Player Build Protection**: Trees touching planks, doors, fences, glass, bricks, or storage blocks are left standing.
- **Game Rules**: Sleep skipping and the faster random tick speed are now set once when the world first loads, so you can change them afterward.

### Fixed
- **Cobweb Shears Switch**: Looking at a cobweb no longer swaps shears into your hand; the swap now happens only when you hit the cobweb.
- **Creative Mode**: Chain mining and tree felling no longer wear down tools or drop items in Creative.
- **Adventure Mode**: Offhand torch placement no longer works in Adventure mode.
- **Melon and Pumpkin Stems**: Breaking a stem with an axe no longer fells nearby trees.
- **Accidental Hand Swap**: Quickly tapping sneak while moving or in the air, such as while bridging, no longer swaps your hands.
- **Leftover Light Blocks**: Moving light blocks left behind after a crash or reload are now removed the next time the world loads.

## [1.3.17] — 2026-10-18

### Fixed
- Corrected offhand torch stack updates so placing any supported torch consumes exactly one item in Survival and Adventure modes.
- Corrected wall-mounted orientation for regular torches, Soul Torches, and Redstone Torches so they face their supporting block instead of breaking immediately.

## [1.3.15] — 2026-10-18

### Improved & Balanced
- Added Redstone Torch to offhand quick-swap and dynamic handheld lighting, using light level 7.
- Kept chain-mining durability protection aligned with the configured one-durability-point threshold.

### Fixed
- Corrected tool selection for sandstone, red sandstone, and mud-brick blocks.
- Prevented axes from qualifying as pickaxes for ore-chain mining.
- Restricted Fortune multipliers to eligible ore categories, excluding raw iron, raw gold, and ancient debris.
- Tightened tree-canopy checks to reduce false positives from blocks below the trunk and unrelated Nether canopy blocks.

## [1.3.13] — 2026-10-17

### Changed
- Standardized the available mining presets so players can choose the intended tool behavior.
- Kept the no-sneak behavior limited to Tree Capitator and Domino Ore Miner; the required tool must be held in selected hotbar slot 1.
- Removed outdated mining preset options.

## [1.3.9] — 2026-10-17

### Changed
- Simplified mining presets to three choices: No Sneak (first hotbar slot required), Both Off, and Default (Sneak Required).
- Added a No Sneak preset for Tree Capitator and Domino Ore Miner; it only activates when the required tool is held in the selected first hotbar slot.
- Kept the sneak requirement for mining in the Default preset and left other add-on features unchanged.
- Kept the included packs on the same release.

## [1.3.6] — 2026-10-17

### Fixed
- Added a **Default (All Features)** mining preset.
- Kept the default configuration enabled for both Tree Capitator and Vein Miner.

## [1.3.3] — 2026-10-17

### Added
- **Optional Mining Presets**: Added selectable Behavior Pack presets for Tree Capitator Only, Vein Miner Only, and Vanilla Mining (both disabled). The default pack keeps both features enabled. Other QoL features remain active in every preset.
- **Independent Mining Presets:** Players can choose Tree Capitator, Vein Miner, or vanilla mining behavior through the available presets.

---

## [1.3.2] — 2026-10-16

### Added & Improved
- **The Leaf Scan (Player-Placed Leaves Ignored)**: Overworld tree canopy detection now evaluates natural leaf growth. Decorative leaves harvested with shears and placed manually by players are recognized as custom decorations and completely ignored, preventing custom hedges, bushes, and decorative roof foliage from falsely triggering tree felling or getting destroyed. Only naturally grown leaves and Nether canopies validate the tree canopy.

---

## [1.3.1] — 2026-10-15

### Added
- **Mob Head Drops Balanced**: Standardized mob head drops (Zombie, Skeleton, Creeper, Piglin, Wither Skeleton, Ender Dragon, PvP Player) to a balanced 1.0% base drop chance (+0.5% per Looting level up to 2.5% max at Looting III).
- **Wandering Trader Collector Head Trades**: Adjusted head trade offering probability to a rare 2% spawn rate in collector trade pools, priced at 1 Diamond Block + 16 Emeralds per head.
- **Shulker Shell Drop Rate**: Adjusted Shulker Shell drops to 1 to 2 shells (yielding 2 to 3 with Looting enchantments).
- **Boss Leashing Immunity**: Removed leashing capability from the Warden, Wither, and Ender Dragon to maintain boss encounter integrity while preserving universal leashing on all 98 standard entities.
- **tool durability stop**: Tuned tool durability stop from 5 to 1 durability point, giving players maximum tool usage before emergency protection activates.
- **Stonecutter Woodcutter All 12 Woods**: Added full Stonecutter recipe support for Pale Oak (Logs to Planks, Slabs, Stairs, Fences, Fence Gates, and Trapdoors), completing support for all 12 wood variants in Minecraft Bedrock.

---

## [1.3.0] — 2026-10-15

This major milestone integrates **Passive Auto-Switch Tools**, **Smart Tree Capitator**, and **Domino Ore Miner** directly into the core Vanilla Quality of Life suite, creating the ultimate all-in-one survival add-on for Minecraft Bedrock.

  — Automatic tool selection whenever the player attacks or mines blocks while holding **Slot 1** (first hotbar slot).
  — Automatically equips Pickaxe (stone, ores, obsidian, terracotta), Axe (logs, wood, planks), Shovel (dirt, sand, gravel, clay), Shears (cobwebs, leaves), and Hoe.
  — Automatically equips the best melee weapon (Sword, Axe, or Mace) when attacking hostile or passive mobs.
  — Durability health scoring: Intelligently avoids selecting nearly-broken tools to preserve gear.
  — Automated cobweb shear interaction loop.

  — Sneak while chopping any tree log to fell the entire trunk and connected branches up to **128 logs** immediately.
  — **Tree Species Matching**: Ensures Oak only fells Oak and Birch only fells Birch, preventing collateral damage in dense tree farms or forests.
  — Preserves natural leaf canopies for authentic vanilla leaf decay drops (saplings, sticks, apples).

  — Sneak while mining any mineral ore to harvest the entire contiguous vein across **all 26 spatial neighbors** (faces, edges, corners) up to **64 blocks**.
  — **Mineral Category Normalization**: Groups regular and deepslate ore variants so veins crossing stone layers mine seamlessly together.
  — Full Fortune and Silk Touch support: Correctly honors Silk Touch block drops and vanilla Fortune item multipliers.

  — When holding a Torch, Soul Torch, or Redstone Torch in your offhand, simply **Sneak and Click** on any block to place it directly from your offhand onto the floor or wall.
  — Decrements offhand stack in Survival/Adventure mode (unlimited in Creative).
  — Cave-mining quality of life: keep your Pickaxe in your mainhand while placing torches without swapping items.

  — Automatically halts chain breaks when tool durability drops to **1 point remaining**.
  — Flashes an on-screen action bar warning and plays an alert sound to protect valuable enchanted tools.

### Changed
- Aligned the pack requirements to reduce missing-dependency warnings on supported game versions.

---

## [1.2.6] — 2026-10-14

### Added
- **Offhand Quick-Swap**: Double-sneak gesture or sneak+use in air to quickly swap Torches, Lanterns, Clocks, and Compasses between mainhand and offhand.

---

## [1.2.0] — 2026-10-10

### Added
- **Mob Head Trophy Drops**: 2.5% base drop chance on player kills for Zombie, Skeleton, Creeper, and Piglin heads.
- **Wandering Trader Collector Trades**: Rare head exchanges and biome flora trading.
- **Single-Player Sleep**: 1 player sleeping in a bed skips the night on multiplayer worlds and Realms.
- **Guaranteed Shulker Shells**: 2 shells guaranteed per Shulker kill.

---

## [1.1.0] — 2026-10-05

### Added
- **Stonecutter Woodcutter**: Cut all 11 wood types in the Stonecutter at fair 1:1 craft ratios (Planks, Slabs, Stairs, Fences, Gates).
- **Stackable Potions & Milk**: Potions, Splash Potions, Lingering Potions, and Milk Buckets stack up to 16 per inventory slot.

---

## [1.0.0] — 2026-09-28

### Added
- **Universal Leashing**: Support for leashing 101 mobs including Villagers, Golems, and pacified hostiles.
- **Spider Leash Locators**: Custom torso locator alignment for spiders and cave spiders.
- **Pet Friendly-Fire Immunity**: Tamed companions take zero damage from friendly sweeps, arrows, and explosions.
- **Fast Leaf Decay**: Floating leaves decay within 1 to 2 seconds after tree felling.
