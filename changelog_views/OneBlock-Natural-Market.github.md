# Changelog — OneBlock Natural Market

## [17.0.0] - 2026-11-26 - Natural Market Currency Blocks

### Added
- **Currency Blocks**: the central block is now 30 custom banknote-style blocks, numbered 1 to 30, one per tier. Each has its own break time, from 0.4 to 1.7 seconds, and it is the same with any tool or bare hands.
- **Market demand**: every supply gets more expensive as it is bought. Each bundle bought raises that item's price by about 15 percent, up to 12 times the normal price, and a red percentage shows the current rise. Prices fall back by half every 8 to 25 minutes, and rare items take longer to settle.
- **New natural supplies**: Raw Iron, Raw Copper, Raw Gold, Raw Beef, Raw Porkchop, Raw Chicken, Raw Mutton, Raw Rabbit, Raw Cod and Raw Salmon.

### Improved & Balanced
- **Natural supplies only**: the market no longer sells crafted items such as tools, weapons, planks, ingots, cooked food, redstone parts, glass or bricks. The Tools & Gear, Combat and Redstone sections are gone and Building Blocks is now Natural Blocks.
- **Tool wear**: breaking the core costs more tool durability on higher Currency Blocks, from 1 to 3 times the usual amount.
- **Prices**: late-tier supplies cost more to match the new Coin income and break times.
- **Locked by default**: the Trident, Elytra and Totem of Undying start locked in the sell list.

### Fixed
- **Old core blocks**: a vanilla core block already in an existing world still pays Coins when broken and is then replaced by a Currency Block.

<details>
<summary><b>16.0.x</b> (12 releases)</summary>

### [16.0.11] - 2026-11-24 - Core Tool Durability

#### Improved & Balanced
- **Tool durability**: breaking the central block uses up durability on your pickaxe, axe, shovel, hoe, shears or sword again, and Unbreaking works. Swords lose 2 per break. Nothing is used in creative mode.

### [16.0.10] - 2026-11-24 - Block Values And No Drops

#### Added
- **Block values**: every block type pays its own Coin value, rising with each tier from 1 Coin for Dirt to 60 for Obsidian.

#### Improved & Balanced
- **No drops**: the central block no longer drops items or experience. Breaking it only earns Coins.
- **Tier prices**: market prices now rise faster with tier, up to about 10 times at the last tier, to match the new Coin income. Items in the first 6 tiers cost the same as before.
- **Regeneration pool**: purchased blocks no longer join the central block's pool, and any already added are ignored.

### [16.0.9] - 2026-11-24 - Coins Scoreboard Hidden Names

#### Added
- **Coins scoreboard**: the sidebar always shows every player's Coins, highest first.
- **Hide my name**: the About screen has a switch that replaces your name on the scoreboard with "Hidden" and a number.

#### Improved & Balanced
- **About screen**: the sidebar on and off switch from the last update is replaced by the hide-name switch.

### [16.0.8] - 2026-11-24 - Coins Scoreboard Switch

#### Added
- **Coins scoreboard switch**: the About screen is now a form with a switch that shows or hides a Coins scoreboard on the sidebar. It is off by default, and the sidebar is shared by all players.

### [16.0.7] - 2026-11-24 - Remove ALN Coins

#### Improved & Balanced
- **ALN Coins removed**: breaking the central block no longer gives ALN Coins, and they no longer show in the market menu or the action bar. Coins, rewards and prices are unchanged.

### [16.0.6] - 2026-11-23 - ALN Coins

#### Added
- **ALN Coins**: every central-block break now also gives 1 ALN Coin, a separate currency kept on the `aln_coins` scoreboard. It shows in the market menu and in the action bar. The market still uses Coins.

### [16.0.5] - 2026-11-23 - Sell Form Toggles

#### Improved & Balanced
- **Sell form**: Sell Items now has three buttons: Lock / Unlock Items, Sell All and Exit. Sell All keeps locked items.
- **Lock editor**: Lock / Unlock Items opens a form with one toggle per item. Switch an item on to lock it, then press Save.

### [16.0.4] - 2026-11-23 - Sell Lock List

#### Added
- **Sell Items screen**: lists every sellable item in your inventory with its icon, amount and value. Tap an item to lock it so it is never sold, and tap again to unlock it.
- **Lock All and Unlock All**: two buttons on the Sell Items screen.
- **Saved locks**: locks are kept per player by item type and stay after you rejoin.

#### Improved & Balanced
- **Tools and weapons start locked**: pickaxes, axes, shovels, hoes, swords, shears, fishing rod, bow, crossbow, trident and shield are locked until you unlock them.
- **Sell Items**: replaces Sell Eligible Items and only sells unlocked items.

### [16.0.3] - 2026-11-22 - Brick Block MCicons Icon

#### Changed

### [16.0.2] - 2026-11-22 - MCicons Market Icons

#### Changed

#### Added

#### Fixed

### [16.0.1] - 2026-11-21 - Core Tier Reorder

#### Changed

#### Added

### [16.0.0] - 2026-11-21 - 30 Tiers And Spawn Eggs

#### Added

#### Changed

#### Fixed

</details>

<details>
<summary><b>15.0.x</b> (1 release)</summary>

### [15.0.0] - 2026-11-21 - Core Pool And Ledger Return Fix

#### Fixed

#### Changed

</details>

<details>
<summary><b>14.0.x</b> (2 releases)</summary>

### [14.0.1] - 2026-11-21 - Startup Crash Fix

#### Fixed

### [14.0.0] - 2026-11-21 - Inventory Icons And Core Height

#### Fixed
- **Inventory icons**: market slots now use each item's inventory icon (the flat item sprite) wherever the game has one, and the block's own texture for full blocks. 26 slots with missing or wrong textures were corrected, including Lever, Hopper, Repeater, Comparator, Nautilus Shell, Dragon's Breath, Heart of the Sea, Furnace, Oak Door, Piston, Shulker Box, Bamboo, Observer, Tripwire Hook, Warped and Crimson Stem, Ender Chest, Conduit, Lantern and Sugar Cane.

#### Changed
- **Core height**: the central block is now at 0, 64, 0 and the world spawn point is at 0, 65, 0 (on top of the block).

</details>

<details>
<summary><b>13.0.x</b> (1 release)</summary>

### [13.0.0] - 2026-11-21 - Ledger Keep, Icon Fixes, Action Bar, About Button

</details>

<details>
<summary><b>12.0.x</b> (1 release)</summary>

### [v12] - 2026-11-20 - Tutorial Platform Update

#### Added
- **Tutorial platform**: each of the first 8 core breaks adds a grass block beside the core, building a 3x3 platform around it. Players get a short message for each step.
- **Anti-phase rescue**: a player inside the central block or the 3x3 platform is teleported on top of the central block.

#### Changed
- **No bedrock**: the core no longer sits on a bedrock block. Existing worlds clear the old bedrock block automatically.
- **Standard market screen**: the market uses the game's standard form screen again. The chest-style screen files were moved to `resource_pack/ui_chest_disabled/` and are not loaded.

</details>

<details>
<summary><b>11.0.x</b> (1 release)</summary>

### [v11] - 2026-11-20 - Chest Market Screen Restored

#### Fixed

#### Changed

</details>

<details>
<summary><b>10.0.x</b> (1 release)</summary>

### [v10] - 2026-11-20 - Standard Market Screen

#### Fixed

#### Changed

</details>

<details>
<summary><b>9.0.x</b> (1 release)</summary>

### [v9] - 2026-11-20 - Standard Screen Option

#### Added

</details>

<details>
<summary><b>8.0.x</b> (1 release)</summary>

### [v8] - 2026-11-20 - Market Screen Fix

#### Fixed

</details>

<details>
<summary><b>7.0.x</b> (1 release)</summary>

### [v7] - 2026-11-20 - Chest Market UI

#### Fixed

#### Improved

</details>

<details>
<summary><b>6.0.x</b> (1 release)</summary>

### [v6] - 2026-11-20 - Responsive Market UI

#### Fixed

#### Improved

</details>

<details>
<summary><b>5.0.x</b> (1 release)</summary>

### [v5] - 2026-11-20 - Diagnostic Log

#### Added

</details>

<details>
<summary><b>4.0.x</b> (1 release)</summary>

### [v4] - 2026-11-20 - Startup Fix

#### Fixed

</details>

<details>
<summary><b>3.0.x</b> (1 release)</summary>

### [v3] - 2026-11-20 - Core Reliability Update

#### Fixed

#### Improved

</details>

<details>
<summary><b>2.0.x</b> (1 release)</summary>

### [v2] - 2026-11-11

#### Improved

#### Compatibility note

</details>
