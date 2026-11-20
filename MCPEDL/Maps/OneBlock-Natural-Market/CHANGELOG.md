# Changelog — OneBlock Natural Market

---

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
