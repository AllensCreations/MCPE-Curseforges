# Changelog — OneBlock: Dirtbound Kingdom Beta

## [0.1.23] - 2026-10-21

### Changed
- Removed the lectern and all physical Trader Post blocks.
- Made the custom Trader Ledger item the only way to open the shop.
- Removed automatic lectern recovery; the item remains the sole shop access method.

## [0.1.22] - 2026-10-21

### Changed
- Removed the Trader Post barrel and replaced it with a lectern at the same coordinates.
- Replaced the sidebar balance display with live OneCoins text in the action bar.
- Simplified currency and mining status text; no special Minecoin or wooden-pickaxe symbols are required.

### Fixed
- Balance text refreshes regularly and displays the live player balance.

---

## [0.1.21] - 2026-10-21

### Fixed
- **Reliable world setup:** The starting area is cleaned before OneBlock progression begins.
- **Stable core startup:** The central block initializes after the starting-area cleanup, preventing setup from replacing the intended starting block.
- **World archive safety:** Existing world downloads were left unchanged. Rebuilding still requires a successful Creative in-game test, complete matching world foundations for every mode, and explicit approval.

## [0.1.20] - 2026-10-21

### Fixed
- **Startup core recovery:** The central block is restored when missing during world startup or player entry, without replacing an occupied core.
- **Progression stability:** Routine world maintenance no longer replaces the evolving central block.
- **Pack version alignment:** The Behavior Pack and Resource Pack use matching release versions.

### Improved
- **World foundation safety:** Published world downloads remain unchanged until complete matching world data is available and the Creative world has been tested in Minecraft.

## [0.1.18] - 2026-10-21

### Fixed
- **Reliable starting block:** The central Dirt now has a direct recovery path that does not depend on saved progression data being available.
- **Correct starting location:** World spawn is set to 0 65 0 with spawn spread disabled, without teleporting players who are already online.
- **Restored foundation and Trader Post:** Missing Bedrock and the permanent Trader Post are restored automatically.

## [0.1.17] - 2026-10-21

### Fixed
- **Reliable starting platform:** The OneBlock now initializes as Dirt at 0 64 0, with a Bedrock footing at 0 63 0.
- **Correct world spawn:** The world spawn is set to 0 65 0 during one-time setup, without teleporting players.
- **Platform protection:** Missing Bedrock footing and the Trader Post are restored by the scheduled function.

## [0.1.16] - 2026-10-21

### Fixed
- **Core spawning fallback:** The central block can recover as Dirt when progression information is unavailable, while later stages remain protected.

### Improved
- **Permanent colored scoreboard:** Added a persistent colored sidebar showing players' OneCoins balances.

## [0.1.15] - 2026-10-21

### Fixed
- **Immediate core restoration:** The central block returns as soon as a successful break is processed, using the newly unlocked stage when progression changes.
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
