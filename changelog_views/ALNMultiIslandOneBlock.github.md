# Changelog — ALN:MultiIslandOneBlock

## [v3] - 2026-11-23 - TRADERS Item Return Fix

### Fixed
- **TRADERS Item Return**: A thrown TRADERS Item is now returned even when the game has not finished creating the dropped item yet. A second check every few ticks finds and removes a dropped copy and returns it, and it is delivered as soon as a slot is free when the inventory is full.
- **TRADERS Item on Death**: After dying, the dropped copy is removed and a new TRADERS Item is delivered when you respawn, using the player's current entity instead of the one from before death.

<details>
<summary><b>2.0.x</b> (1 release)</summary>

### [v2] - 2026-11-23 - TRADERS Item

#### Added
- **Permanent TRADERS Item**: If you throw the TRADERS Item away it returns to you. If your inventory is full and you hold none, it is delivered as soon as a slot is free, and you get it back after respawning.

#### Improved & Balanced
- **TRADERS Item**: The Global Pirate Ledger is now named TRADERS Item and is the only trade item in the map.
- **Removed Unused Item**: The OneBlock Trader item that had no role in this map was removed.

</details>

<details>
<summary><b>1.0.x</b> (1 release)</summary>

### [1.0.0] - 2026-11-23 - First Release

#### Added
- **OneBlock World Map**: A void OneBlock world for ten or more players, with Creative, Survival and Hardcore versions.
- **Central Lobby**: The world spawn sits on a single bedrock pillar at the center of the grid.
- **Startup Window**: First-time players see a welcome window with Start / Claim Island and About / Rules buttons, plus a warning that the island choice is permanent.
- **Island Grid**: Each player claims a private island on a square grid with 2,000 blocks between islands, with extra outer rings for more than eight players.
- **Shared OneBlock Phases**: All islands progress through eight phases together, from Forest to The End.
- **Island Richness Traits**: Every island has one of six traits that change its block mix and add bonus drops.
- **Global Pirate Ledger**: A craftable item, made from a Book, a Gold Nugget and an Emerald, that opens the Global Trade Hub from anywhere.
- **Global Trade Hub**: Players can post, browse, search, buy, cancel and collect earnings from item offers made by other islands.

</details>
