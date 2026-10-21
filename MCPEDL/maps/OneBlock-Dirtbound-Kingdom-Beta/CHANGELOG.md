# Changelog — OneBlock: Dirtbound Kingdom Beta

---

## [0.1.11] - 2026-10-21

### Fixed
- **Mining progress tracking:** Central OneBlock breaks now read the block's actual position, so each successful break advances the mining counter and updates the OneCoin balance.
- **Dirt sales:** Dirt is only removed after the balance update succeeds, preventing lost inventory when the economy is not ready.

### Improved & Balanced
- **Longer progression:** Expanded tier milestones through 6,000 central-block breaks.
- **Mining rewards:** Earn 1 OneCoin for each central block broken and 1 OneCoin for each Dirt block sold.
- **Milestone bonuses:** Receive additional OneCoins at each progression unlock, with larger rewards reserved for later milestones.
- **Clearer status display:** Added distinct pickaxe and coin indicators to the live status bar and trading menus.

## [0.1.10] - 2026-10-21

### Changed
- Moved central Dirt restoration into a scheduled function that places Dirt only when the target position is air.
- Added a separate function to give the custom OneBlock Trader item.
- Kept the trading interface, currency, purchases, and progression in the script.
- Removed block placement, player teleportation, and game-mode changes from the script.

## [0.1.8] - 2026-10-21

### Fixed
- Corrected a malformed line break in the trading script that prevented the script from parsing.
- Added a test package so the OneBlock behavior can be checked separately from world generation.

### Changed
- Paused new world generation while the add-on is tested.
- Updated both packs to the same test version.

## [0.1.7] - 2026-10-21

### Fixed
- Restored the central OneBlock by repairing the startup script and waiting for the spawn area to load before placing the block.
- Set the world default to Survival on Hard difficulty.
- Players are returned to Survival when they join, preventing Creative mode from overriding the intended gameplay.

## [0.1.6] - 2026-10-21

### Improved
- Tuned tier pricing and purchase quantities to keep starter supplies affordable and rare endgame equipment costly.
- Synced the world builder and pack versions for the complete world release.

## [0.1.5] - 2026-10-21

### Added
- Expanded the Trader shop to 180 purchasable entries across ten progression tiers.
- Added mining milestones from the Settler tier through Kingdom Master.

### Improved
- Adjusted shop prices to scale with progression and keep starter supplies accessible.
- Purchases deduct coins only for items successfully delivered.

## [0.1.3] - 2026-10-21

### Improved
- Replaced chat commands with an interactive OneBlock Trader item and Trading UI.
- Moved Dirt selling, supply purchases, currency, and phase progression into the menu.
- Added a custom inventory icon for the Trader item.

### Fixed
- The world builder was configured to start from the repository's OneBlock source world and preserve its world database.
