# Changelog — OneBlock Natural Market

---

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
