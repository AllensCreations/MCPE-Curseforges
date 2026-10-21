# Changelog — OneBlock Dirtbound Kingdom Beta

---

## [0.1.24] - 2026-10-21

### Improved & Balanced
- **Cleaner Starting Area:** The starting area is cleared before the central block progression begins.
- **Trader Ledger Shop Access:** The Trader Ledger is the only way to open the shop.
- **Live Balance Display:** The OneCoins balance appears in the action bar instead of a sidebar display.

## [0.1.23] - 2026-10-21

### Changed
- Removed the lectern and all physical Trader Post blocks.
- Made the custom Trader Ledger item the only way to open the shop.
- Removed the old lectern-based shop access; the Trader Ledger is the only way to open the shop.

## [0.1.22] - 2026-10-21

### Changed
- Changed the original shop station during the transition to item-only shop access.
- Replaced the sidebar balance with live OneCoins text in the action bar.
- Simplified currency and mining status text; no special Minecoin or wooden-pickaxe symbols are required.

### Fixed
- Balance text refreshes regularly and displays the live player balance.

---

## [0.1.21] - 2026-10-21

### Fixed
- **Reliable world setup:** The starting area is cleaned before OneBlock progression begins.
- **Stable Core Startup:** The central block initializes after the starting-area cleanup.

## [0.1.20] - 2026-10-21

### Fixed
- **Startup core recovery:** The central block is restored when missing during world startup or player entry, without replacing an occupied core.
- **Progression stability:** Routine world maintenance no longer replaces the evolving central block.
- **Pack version alignment:** The Behavior Pack and Resource Pack use matching release versions.

## [0.1.18] - 2026-10-21

### Fixed
- **Reliable Starting Block:** The central Dirt can recover if saved progression information is unavailable.
- **Correct Starting Location:** World spawn is configured during setup without teleporting players who are already online.
- **Restored Foundation:** Missing Bedrock footing is restored automatically.

## [0.1.17] - 2026-10-21

### Fixed
- **Reliable starting platform:** The OneBlock now initializes as Dirt at 0 64 0, with a Bedrock footing at 0 63 0.
- **Correct World Spawn:** The starting spawn is set during one-time setup without moving players who are already online.
- **Platform Protection:** The Bedrock footing is restored if it is missing.

## [0.1.16] - 2026-10-21

### Fixed
- **Core spawning fallback:** The central block can recover as Dirt when progression information is unavailable, while later stages remain protected.

### Improved
- **Permanent colored scoreboard:** Added a persistent colored sidebar showing players' OneCoins balances.

## [0.1.15] - 2026-10-21

### Fixed
- **Immediate Core Restoration:** The central block returns after a successful break, using the newly unlocked stage when progression changes.
- **Consistent mining rewards:** Core restoration does not trigger a second player-break reward.

## [0.1.14] - 2026-10-21

### Improved & Balanced
- **Core difficulty curve:** Reordered the late-game blocks so Ancient Debris precedes Obsidian, followed by Crying Obsidian and a Block of Netherite.
- **Shared progress display:** The status bar now shows both the current core stage and the world's total core-break count.

## [0.1.13] - 2026-10-21

### Added
- **Permanent Trader Post:** Open the shop from the base station, recover a missing Trader Ledger, and keep access even after losing the item.
- **Ten evolving core stages:** The central block progresses from Dirt through increasingly tough stone, ore, ancient debris, obsidian, and a Block of Netherite as the world reaches 6,000 total breaks.
- **Bonus Emerald Block:** Find an occasional bonus block and claim 30 OneCoins, with a chance of a hostile encounter.
- **Core Surge events:** Every 500 world-wide breaks grants a coin bonus and starts a hostile mob challenge.
- **Kingdom Prestige:** Players who reach 6,000 personal breaks may reset their own shop progress for bonus coins and a permanent Prestige level.

### Improved & Balanced
- **Tier-based mining rewards:** Later core stages grant more OneCoins per break to help fund better tools and supplies.
- **Regular milestones:** Every 250 personal breaks grants a small bonus, alongside the larger shop-tier rewards.
- **Trader recovery:** The Ledger is automatically restored when missing and inventory space is available.

## [0.1.11] - 2026-10-21

### Fixed
- **Mining Progress:** Breaking the central block advances the mining counter and updates the OneCoin balance.
- **Dirt sales:** Dirt is only removed after the balance update succeeds, preventing lost inventory when the economy is not ready.

### Improved & Balanced
- **Longer progression:** Expanded tier milestones through 6,000 central-block breaks.
- **Mining rewards:** Earn 1 OneCoin for each central block broken and 1 OneCoin for each Dirt block sold.
- **Milestone bonuses:** Receive additional OneCoins at each progression unlock, with larger rewards reserved for later milestones.
- **Clearer status display:** Added distinct pickaxe and coin indicators to the live status bar and trading menus.

## [0.1.10] - 2026-10-21

### Changed
- **Core Recovery:** The central Dirt returns when its position is empty, without replacing another block.
- Added the custom OneBlock Trader item.
- Kept shop access, currency, purchases, and progression together in the add-on.

## [0.1.8] - 2026-10-21

### Fixed
- Fixed a problem that prevented the trading interface from loading.

## [0.1.7] - 2026-10-21

### Fixed
- **Central Block Startup:** Improved the starting block setup so the central block appears when the world is ready.
- Set the intended world difficulty and Survival gameplay defaults.
- Players enter Survival when joining the challenge.

## [0.1.6] - 2026-10-21

### Improved
- Tuned tier pricing and purchase quantities to keep starter supplies affordable and rare endgame equipment costly.

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

