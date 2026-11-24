# Changelog — ALN:MultiIslandOneBlock

---

## [v9] - 2026-11-24 - Claim Lock

### Improved & Balanced
- **Claim Lock**: A player who has not claimed an island yet is frozen in place at the lobby spawn by a maximum Slowness effect while the startup window is active. If they close the window it opens again, and the effect is removed as soon as they press Start or the window stops reopening.

## [v8] - 2026-11-24 - Rare Bonus Drops

### Improved & Balanced
- **Rare Bonus Drops**: Richness bonus drops now happen on about 5% of OneBlock breaks instead of 30%.

## [v7] - 2026-11-24 - TRADERS Item Sale Fix

### Fixed
- **TRADERS Item Sale Bug**: The TRADERS Item can no longer be listed or sold. It is hidden from the sell lists, and any old offer that held it is removed.

## [v6] - 2026-11-24 - Market Income and Coin Scoreboard

### Added
- **Sell to Market**: A new hub button sells items that have a recommended price straight to the market for half of the recommended price.
- **OneBlock Coin Reward**: Players earn 1 ALN Coin for every 10 OneBlock breaks.
- **@ALNStudios Scoreboard**: A sidebar scoreboard titled @ALNStudios ranks island owners by their ALN Coins and refreshes every two seconds.
### Improved & Balanced
- **Price Guard**: The lowest allowed offer price is now half of the recommended price, so nobody can buy cheaply from a player and resell to the market for a profit.

## [v5] - 2026-11-23 - Price Guard and Weighted Richness

### Added
- **Offline Earnings Message**: Sellers who were offline when an offer sold are told how many ALN Coins they earned when they join.
### Improved & Balanced
- **Price Guard**: For items with a recommended price, an offer must stay between one quarter and four times the recommended price, which blocks typo and scam prices.
- **Weighted Richness**: New islands still get a random Richness trait, but traits that many islands already have are less likely.
### Fixed
- **Recipe Errors**: The TRADERS Item crafting recipe was removed, which also removes its recipe errors from the content log. The item is now only given when an island is claimed and returns to you if thrown.

## [v4] - 2026-11-23 - ALN Coins and Random Islands

### Added
- **ALN Coins**: The Global Trade Hub now uses ALN Coins instead of item-for-item swaps. Every player starts with 500 ALN Coins, offers are priced in coins, and a sale pays the seller right away, even when offline.
- **Recommended Prices**: Every item shows a recommended price and amount when you create an offer, and empty fields use them.
### Improved & Balanced
- **Random Richness**: Each new island now gets a random Richness trait instead of an evenly balanced one.
- **Random Island Spots**: Each new island now takes a random free spot of the innermost ring that still has room instead of the next spot in order.
- **Old Offers**: Open item-for-item offers from the previous version are cancelled and the items are returned to their sellers.

## [v3] - 2026-11-23 - TRADERS Item Return Fix

### Fixed
- **TRADERS Item Return**: A thrown TRADERS Item is now returned even when the game has not finished creating the dropped item yet. A second check every few ticks finds and removes a dropped copy and returns it, and it is delivered as soon as a slot is free when the inventory is full.
- **TRADERS Item on Death**: After dying, the dropped copy is removed and a new TRADERS Item is delivered when you respawn, using the player's current entity instead of the one from before death.

## [v2] - 2026-11-23 - TRADERS Item

### Added
- **Permanent TRADERS Item**: If you throw the TRADERS Item away it returns to you. If your inventory is full and you hold none, it is delivered as soon as a slot is free, and you get it back after respawning.
### Improved & Balanced
- **TRADERS Item**: The Global Pirate Ledger is now named TRADERS Item and is the only trade item in the map.
- **Removed Unused Item**: The OneBlock Trader item that had no role in this map was removed.

## [1.0.0] - 2026-11-23 - First Release

### Added
- **OneBlock World Map**: A void OneBlock world for ten or more players, with Creative, Survival and Hardcore versions.
- **Central Lobby**: The world spawn sits on a single bedrock pillar at the center of the grid.
- **Startup Window**: First-time players see a welcome window with Start / Claim Island and About / Rules buttons, plus a warning that the island choice is permanent.
- **Island Grid**: Each player claims a private island on a square grid with 2,000 blocks between islands, with extra outer rings for more than eight players.
- **Shared OneBlock Phases**: All islands progress through eight phases together, from Forest to The End.
- **Island Richness Traits**: Every island has one of six traits that change its block mix and add bonus drops.
- **Global Pirate Ledger**: A craftable item, made from a Book, a Gold Nugget and an Emerald, that opens the Global Trade Hub from anywhere.
- **Global Trade Hub**: Players can post, browse, search, buy, cancel and collect earnings from item offers made by other islands.
