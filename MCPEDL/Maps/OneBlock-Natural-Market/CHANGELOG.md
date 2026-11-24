# Changelog — OneBlock Natural Market

---

## [16.0.10] - 2026-11-24 - Block Values And No Drops

### Added
- **Block values**: every block type pays its own Coin value, rising with each tier from 1 Coin for Dirt to 60 for Obsidian.

### Improved & Balanced
- **No drops**: the central block no longer drops items or experience. Breaking it only earns Coins.
- **Tier prices**: market prices now rise faster with tier, up to about 10 times at the last tier, to match the new Coin income. Items in the first 6 tiers cost the same as before.
- **Regeneration pool**: purchased blocks no longer join the central block's pool, and any already added are ignored.

## [16.0.9] - 2026-11-24 - Coins Scoreboard Hidden Names

### Added
- **Coins scoreboard**: the sidebar always shows every player's Coins, highest first.
- **Hide my name**: the About screen has a switch that replaces your name on the scoreboard with "Hidden" and a number.

### Improved & Balanced
- **About screen**: the sidebar on and off switch from the last update is replaced by the hide-name switch.

## [16.0.8] - 2026-11-24 - Coins Scoreboard Switch

### Added
- **Coins scoreboard switch**: the About screen is now a form with a switch that shows or hides a Coins scoreboard on the sidebar. It is off by default, and the sidebar is shared by all players.

## [16.0.7] - 2026-11-24 - Remove ALN Coins

### Improved & Balanced
- **ALN Coins removed**: breaking the central block no longer gives ALN Coins, and they no longer show in the market menu or the action bar. Coins, rewards and prices are unchanged.

## [16.0.6] - 2026-11-23 - ALN Coins

### Added
- **ALN Coins**: every central-block break now also gives 1 ALN Coin, a separate currency kept on the `aln_coins` scoreboard. It shows in the market menu and in the action bar. The market still uses Coins.

## [16.0.5] - 2026-11-23 - Sell Form Toggles

### Improved & Balanced
- **Sell form**: Sell Items now has three buttons: Lock / Unlock Items, Sell All and Exit. Sell All keeps locked items.
- **Lock editor**: Lock / Unlock Items opens a form with one toggle per item. Switch an item on to lock it, then press Save.

## [16.0.4] - 2026-11-23 - Sell Lock List

### Added
- **Sell Items screen**: lists every sellable item in your inventory with its icon, amount and value. Tap an item to lock it so it is never sold, and tap again to unlock it.
- **Lock All and Unlock All**: two buttons on the Sell Items screen.
- **Saved locks**: locks are kept per player by item type and stay after you rejoin.

### Improved & Balanced
- **Tools and weapons start locked**: pickaxes, axes, shovels, hoes, swords, shears, fishing rod, bow, crossbow, trident and shield are locked until you unlock them.
- **Sell Items**: replaces Sell Eligible Items and only sells unlocked items.

## [16.0.3] - 2026-11-22 - Brick Block MCicons Icon

### Changed
- Brick Block now uses its MCicons icon (the Bricks icon), so all market items use MCicons.

## [16.0.2] - 2026-11-22 - MCicons Market Icons

### Changed
- Market icons now use the MCicons set (Minecraft item and block icons), shipped in the resource pack, instead of the game's own texture paths. This covers the 11 category buttons and every market item except Brick Block, which has no MCicons icon and keeps its old one.

### Added
- The MCicons notice file (`ASSET-NOTICE.md`) sits beside the icons in the resource pack.

### Fixed
- Shield now shows an icon in the market.

## [16.0.1] - 2026-11-21 - Core Tier Reorder

### Changed
- The core block order is now Dirt, Wood, Stone, Ores, then Blocks across the 30 tiers, ending with Obsidian at tier 30.
- Ancient Debris moved to tier 29.
- Netherite Block can no longer enter the core pool, even if bought.
- Mossy Cobblestone, Sandstone, Deepslate, Netherrack, Soul Sand, Blackstone, Basalt and End Stone are no longer part of the tier order.

### Added
- Clay, Coarse Dirt, Jungle Log, Acacia Log, Andesite, Diorite, Granite, Stone Bricks and Quartz Block join the tier order.

## [16.0.0] - 2026-11-21 - 30 Tiers And Spawn Eggs

### Added
- 30 progression tiers. The core block pool and market supplies unlock across 30 tiers (10,000 breaks), ending with Obsidian at tier 30.
- Spawn Eggs category with 28 mob eggs, unlocking at tiers 10 to 21. Eggs cannot be sold back.
- Copper Ore and Copper Ingot in the market.

### Changed
- Coin reward per core break rises from 1 to 12 across the tiers.
- Market prices scale with tier from tier 6 up.
- Wood supplies unlock at tier 2, and gold, redstone, diamond, Nether and End supplies unlock at their own tiers.
- Ancient Debris and Netherite Block now appear in the core at tiers 27 and 28, and Obsidian is last.
- Your tier is recalculated from your mined blocks, so it can differ from before.

### Fixed
- Anvils bought in the market no longer enter the core pool, because they fall into the void.

## [15.0.0] - 2026-11-21 - Core Pool And Ledger Return Fix

### Fixed
- Building Blocks bought in the market no longer join the OneBlock regeneration pool. Building Blocks added by earlier purchases are removed from the pool. Milestone blocks are unchanged.
- The Ledger now comes back when you free an inventory slot. Before, a dropped Ledger could be deleted while your inventory was full, and a Ledger that could not be given at join was only retried when you rejoined.
- Fixed missing market icons for Magma Block and Conduit.
- Fixed the missing Redstone category icon.
- Removed the "Balance & Progress" button, which never displayed its message. Coins, breaks and tier are shown in the menu text.
- Back and Next Page buttons now use left and right arrow icons.
- Removed special characters from menu text and replaced gray text colors with white.
- The About screen now has a single Close button.

### Changed
- Market prices now scale with tier. Tier 4 and above cost more, up to 6x at the last tier. Tiers 1 to 3 and all sell values are unchanged, except the three drops below.
- Netherite Block, Hay Block, Redstone Block and Iron Block cost more, so crafting them into ingots or dust and selling no longer earns a profit.
- Netherite Block, Ancient Debris and Obsidian sell for less, so rare core drops no longer outweigh the Coin reward.

## [14.0.1] - 2026-11-21 - Startup Crash Fix

### Fixed
- Fixed the map script stopping at startup with "cannot read property 'subscribe' of undefined". The Ledger throw event is not available in the game's script version, so it was replaced with a scan that returns a dropped Ledger to its owner. The market, core regeneration and rewards run again.

## [14.0.0] - 2026-11-21 - Inventory Icons And Core Height

### Fixed
- **Inventory icons**: market slots now use each item's inventory icon (the flat item sprite) wherever the game has one, and the block's own texture for full blocks. 26 slots with missing or wrong textures were corrected, including Lever, Hopper, Repeater, Comparator, Nautilus Shell, Dragon's Breath, Heart of the Sea, Furnace, Oak Door, Piston, Shulker Box, Bamboo, Observer, Tripwire Hook, Warped and Crimson Stem, Ender Chest, Conduit, Lantern and Sugar Cane.
- Shield and Magma Block have no flat icon in the game files, so they show text only instead of a broken picture.

### Changed
- **Core height**: the central block is now at 0, 64, 0 and the world spawn point is at 0, 65, 0 (on top of the block).
- Existing worlds: a block left at the old height (0, 0, 0) is not moved.

## [13.0.0] - 2026-11-21 - Ledger Keep, Icon Fixes, Action Bar, About Button

- **Ledger keep**: the Natural Market Ledger now has `keep_on_death` and returns to your inventory automatically when thrown.
- **Icon fixes**: corrected texture paths for Nautilus Shell, Crimson Stem, Warped Stem, Soul Torch, Ender Chest, and Conduit so their market slots show the correct icons.
- **Action bar feedback**: all market messages (purchases, balance, errors) now display on the action bar instead of in chat.
- **About button**: a new ℹ About button at the bottom of the main market menu shows pack info.

## [v12] - 2026-11-20 - Tutorial Platform Update

### Added
- **Tutorial platform**: each of the first 8 core breaks adds a grass block beside the core, building a 3x3 platform around it. Players get a short message for each step.
- **Anti-phase rescue**: a player inside the central block or the 3x3 platform is teleported on top of the central block.

### Changed
- **No bedrock**: the core no longer sits on a bedrock block. Existing worlds clear the old bedrock block automatically.
- **Standard market screen**: the market uses the game's standard form screen again. The chest-style screen files were moved to `resource_pack/ui_chest_disabled/` and are not loaded.

## [v11] - 2026-11-20 - Chest Market Screen Restored

### Fixed
- Fixed the blank chest-style market screen. The game's form container is 0 x 0 pixels, so the percentage sizes resolved to nothing. The container now fills the screen, and the market panel sizes itself from that.

### Changed
- The chest-style screen is active again. Run `/tag @s add obm_vanilla_ui` to use the game's standard form screen instead, and `/tag @s remove obm_vanilla_ui` to switch back.

## [v10] - 2026-11-20 - Standard Market Screen

### Fixed
- The market now opens in the game's standard form screen. The custom chest-style screen showed a blank menu in testing, and it also produced `Unknown property [orientation]` UI errors, so it has been taken out of the loaded resource pack.
- The market menus, purchases and selling work as before.

### Changed
- The chest-style screen files were moved to `resource_pack/ui_chest_disabled/` and are not loaded by the game. The `obm_vanilla_ui` tag from v9 is no longer needed.

## [v9] - 2026-11-20 - Standard Screen Option

### Added
- Added an option to use the game's standard form screen for the market. Run `/tag @s add obm_vanilla_ui` to switch to it, and `/tag @s remove obm_vanilla_ui` to switch back to the chest-style screen. The market menus and purchases work the same on both screens.

## [v8] - 2026-11-20 - Market Screen Fix

### Fixed
- Fixed the market screen showing blank. The screen is now created through the game's form factory, so it receives the form's title, text and slot buttons.

## [v7] - 2026-11-20 - Chest Market UI

### Fixed
- Fixed the UI errors `Unknown property [orientation]` for `dynamic_button`, `long_form_dynamic_buttons_panel` and `inside_header_panel`. The market screen no longer redefines the game's own form controls; it uses its own uniquely named controls instead.
- Other forms in your world (from other add-ons) use the normal game screen again. The market screen now appears only for Natural Market forms.

### Improved
- The market is now a large chest-style panel, 88% of the screen height, with 9 square slots per row. It scales with any screen size or UI scale.

## [v6] - 2026-11-20 - Responsive Market UI

### Fixed
- The market screen now sizes itself as a percentage of the screen, so it adjusts to any screen size or UI scale instead of using a fixed 460 x 350 panel.
- The slot grid is now 9 columns by 3 rows as described, instead of 3 columns by 9 rows, which ran past the bottom of the panel.

### Improved
- Slots, item icons and labels scale with the panel and keep square slots.

## [v5] - 2026-11-20 - Diagnostic Log

### Added
- Added a diagnostic log for map creators and testers. It records startup, core regeneration, Ledger use, core breaks, player spawns and errors in the content log.
- Added an optional in-game debug mode that shows the same messages in chat, and a status command that reports the current core state.

## [v4] - 2026-11-20 - Startup Fix

### Fixed
- Fixed the map script stopping during startup. Because of this, the Natural Market Ledger, core regeneration, Coin rewards and the automatic core restore from v3 did not run.
- The central block now regenerates after being broken, and is restored if something else removes it.

## [v3] - 2026-11-20 - Core Reliability Update

### Fixed
- The central block is now restored automatically if an explosion, piston or command removes it.
- Selling items no longer risks deleting items that were moved while the confirmation was open.
- Blocks that cannot stand on their own (torches, doors, saplings and similar) no longer enter the regeneration pool.
- The next-tier message now correctly shows personal breaks.

### Improved
- Saved regeneration-pool data is more compact and no longer repeats unlocked milestone blocks.

## [v2] - 2026-11-11

### Improved
- Reworked the Ledger's Action Form presentation with a wood-framed market panel and individual inventory-style slot backgrounds.
- Added distinct default, hover, and pressed slot states while retaining Minecraft item icons and the existing 3 × 9 button grid.
- Kept the category catalogue's 25-item page size so the Next Page and Back controls fit in the remaining two slots.

### Compatibility note
- This remains a simulated inventory-style Action Form, not a native chest container. It does not provide draggable item slots or vanilla container transfer behavior.
- The visual layer uses legacy resource-pack JSON UI, which Minecraft is deprecating in favor of Ore UI. Future game updates may require maintenance.
- No experimental gameplay toggle was added. Source structure is updated; Minecraft in-game rendering has not been verified.
