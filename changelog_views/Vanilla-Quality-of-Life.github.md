# Changelog — Vanilla Quality of Life

## [1.4.4] - 2026-11-06

### Removed
- **Offhand Swap Command**: The command that swapped your offhand item is removed. Use double-sneak or Sneak + Use in the air instead.

<details>
<summary><b>1.4.x</b> (4 releases)</summary>

### [1.4.3] - 2026-11-06

#### Removed
- **Personal Toggles**: The per-player toggles added in the previous update are removed. Choose how Tree Capitator and Domino Ore Miner behave for your world with the Behavior Pack's subpack settings.

### [1.4.2] - 2026-11-06

#### Added
- **Personal Toggles**: Each player can turn Auto-Switch, Tree Capitator, Domino Ore Miner, and Offhand Quick-Swap on or off for themselves with /scriptevent qol:toggle. Use status to see your settings and reset to turn everything back on.

### [1.4.1] - 2026-11-03

#### v1.4.x (v1.4.1 – v1.4.2)
- **Zero Durability Tools**: A tool at 0 durability now breaks only the single block you hit and no longer starts Tree Capitator or Domino Ore Miner.
- **Durability Floor**: Tree Capitator and Domino Ore Miner now use your tool down to 0 durability without breaking it, and the next use of that tool breaks it.

### [1.4.0] - 2026-11-02

#### v1.3.x (v1.3.30)
- **Smoother Held Light**: The light from torches and lanterns in your hands now updates every tick, so it keeps up with you while moving and jumping.
- **Auto-Switch Only While Mining**: Auto-switch now acts only while you are hitting blocks and no longer changes your tool just because you are looking at something.
- **Light Flicker While Pillar Jumping**: Placing a block where your held light was no longer leaves you in the dark; the light moves back to you immediately.
- **Durability After Auto-Switch**: If auto-switch changes your tool at the same moment a tree or ore vein is chain mined, the tool you actually mined with is put back in your hand and takes the durability loss instead of the new tool.
- **Switch Delay After Breaking**: Auto-switch now waits a few ticks after any block breaks before changing your tool, so the tool you broke the block with keeps its durability loss.

</details>

<details>
<summary><b>1.3.x</b> (4 releases)</summary>

### [1.3.29] - 2026-11-02

#### Fixed
- **Tool Durability**: Tree Capitator and Domino Ore Miner now reliably wear down the tool you used, even if auto-switch changes your held item right afterward.
- **Mangrove Trees**: Mangrove trees with moss carpet around their roots are now felled, and breaking Muddy Mangrove Roots no longer switches you to a shovel.
- **Auto-Switch After Chain Mining**: Auto-switch now waits about two seconds after a tree or ore vein is chain mined before it can change your tool.

### [1.3.28] - 2026-11-01

#### Improved & Balanced
- **Clearer Mining Presets**: The three mining presets in the pack settings now describe what they do: Sneak to Chain Mine (Default), Auto Chain Mine: Tool in Slot 1, and Chain Mining Off (Other Features On).
- **Resource Pack Included**: The Behavior Pack now requires its Resource Pack, so both are enabled together when you activate it.

### [1.3.27] - 2026-11-01

#### Fixed
- **Enchanted Tool Offhand Swap**: Swapping an enchanted or damaged tool into your offhand with a torch no longer resets it, so enchantments and remaining durability are kept.

### [1.3.26] - 2026-10-29

#### Improved & Balanced
- **Maintenance release**: Repackaged the pack; no gameplay changes were recorded.

#### Improved & Balanced
- **Durability Guard**: Chain mining now stops only when the tool has 0 durability left, instead of at 1.
- **Offhand Torch Placement Removed**: Torches in the offhand can no longer be placed with Sneak + Click. Offhand quick-swap and held-item light still work.

#### Fixed
- **Auto-Switch With Chain Mining**: Auto-switch now pauses briefly while a tree or ore vein is being mined so the tool in hand cannot change during it.
- **Broken Tool Chain Mining**: Tree Capitator and Domino Ore Miner no longer keep breaking blocks after the tool has broken or has no durability left.

#### Improved & Balanced
- **Continuous Auto-Switch**: While you keep mining, aiming at a different kind of block, such as moving from stone to dirt, now switches to the best tool without stopping.

#### Improved & Balanced
- **Redstone Fortune**: Chain-mined Redstone Ore with Fortune now drops extra dust the way the single-block version does, instead of multiplying the whole stack.
- **Ore Experience**: Chain-mined ores now drop their normal experience as orbs when mined without Silk Touch.
- **Tree Capitator Limits**: Logs more than 8 blocks away from the broken log are ignored, so neighboring trees are far less likely to be felled together.
- **Player Build Protection**: Trees touching planks, doors, fences, glass, bricks, or storage blocks are left standing.
- **Game Rules**: Sleep skipping and the faster random tick speed are now set once when the world first loads, so you can change them afterward.

#### Fixed
- **Cobweb Shears Switch**: Looking at a cobweb no longer swaps shears into your hand; the swap now happens only when you hit the cobweb.
- **Creative Mode**: Chain mining and tree felling no longer wear down tools or drop items in Creative.
- **Melon and Pumpkin Stems**: Breaking a stem with an axe no longer fells nearby trees.
- **Accidental Hand Swap**: Quickly tapping sneak while moving or in the air, such as while bridging, no longer swaps your hands.
- **Leftover Light Blocks**: Moving light blocks left behind after a crash or reload are now removed the next time the world loads.

#### Fixed

#### Improved & Balanced

#### Fixed

#### Changed

#### Changed

#### Fixed

#### Added
- **Optional Mining Presets**: Added selectable Behavior Pack presets for Tree Capitator Only, Vein Miner Only, and Vanilla Mining (both disabled). The default pack keeps both features enabled. Other QoL features remain active in every preset.

#### Added & Improved
- **The Leaf Scan (Player-Placed Leaves Ignored)**: Overworld tree canopy detection now evaluates natural leaf growth. Decorative leaves harvested with shears and placed manually by players are recognized as custom decorations and completely ignored, preventing custom hedges, bushes, and decorative roof foliage from falsely triggering tree felling or getting destroyed. Only naturally grown leaves and Nether canopies validate the tree canopy.

#### Added
- **Mob Head Drops Balanced**: Standardized mob head drops (Zombie, Skeleton, Creeper, Piglin, Wither Skeleton, Ender Dragon, PvP Player) to a balanced 1.0% base drop chance (+0.5% per Looting level up to 2.5% max at Looting III).
- **Wandering Trader Collector Head Trades**: Adjusted head trade offering probability to a rare 2% spawn rate in collector trade pools, priced at 1 Diamond Block + 16 Emeralds per head.
- **Shulker Shell Drop Rate**: Adjusted Shulker Shell drops to 1 to 2 shells (yielding 2 to 3 with Looting enchantments).
- **Boss Leashing Immunity**: Removed leashing capability from the Warden, Wither, and Ender Dragon to maintain boss encounter integrity while preserving universal leashing on all 98 standard entities.
- **tool durability stop**: Tuned tool durability stop from 5 to 1 durability point, giving players maximum tool usage before emergency protection activates.
- **Stonecutter Woodcutter All 12 Woods**: Added full Stonecutter recipe support for Pale Oak (Logs to Planks, Slabs, Stairs, Fences, Fence Gates, and Trapdoors), completing support for all 12 wood variants in Minecraft Bedrock.

#### Changed

#### Added
- **Offhand Quick-Swap**: Double-sneak gesture or sneak+use in air to quickly swap Torches, Lanterns, Clocks, and Compasses between mainhand and offhand.

#### Added
- **Mob Head Trophy Drops**: 2.5% base drop chance on player kills for Zombie, Skeleton, Creeper, and Piglin heads.
- **Wandering Trader Collector Trades**: Rare head exchanges and biome flora trading.
- **Single-Player Sleep**: 1 player sleeping in a bed skips the night on multiplayer worlds and Realms.
- **Guaranteed Shulker Shells**: 2 shells guaranteed per Shulker kill.

#### Added
- **Stonecutter Woodcutter**: Cut all 11 wood types in the Stonecutter at fair 1:1 craft ratios (Planks, Slabs, Stairs, Fences, Gates).
- **Stackable Potions & Milk**: Potions, Splash Potions, Lingering Potions, and Milk Buckets stack up to 16 per inventory slot.

#### Added
- **Universal Leashing**: Support for leashing 101 mobs including Villagers, Golems, and pacified hostiles.
- **Spider Leash Locators**: Custom torso locator alignment for spiders and cave spiders.
- **Pet Friendly-Fire Immunity**: Tamed companions take zero damage from friendly sweeps, arrows, and explosions.
- **Fast Leaf Decay**: Floating leaves decay within 1 to 2 seconds after tree felling.

</details>
