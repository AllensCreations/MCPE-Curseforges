# OneBlock: Dirtbound Kingdom Beta — MCAddon Test Build

**By AllensCreations**

This test package brings a longer OneBlock survival economy with ten evolving core stages, ten shop tiers, and a permanent Trader Post. It contains the Behavior Pack and Resource Pack but does not include a prebuilt world.

## Ten Core Stages

The shared central block becomes tougher as the world-wide break count increases. Each break grants stage-based OneCoins.

- **0 breaks — Forgotten Soil:** Dirt; +1 OneCoin per break.
- **50 breaks — Stone Core:** Stone; +2 OneCoins per break.
- **150 breaks — Cobbleheart:** Cobblestone; +2 OneCoins per break.
- **350 breaks — Iron Heart:** Iron Ore; +3 OneCoins per break.
- **700 breaks — Golden Core:** Gold Ore; +3 OneCoins per break.
- **1,200 breaks — Diamond Core:** Diamond Ore; +4 OneCoins per break.
- **2,000 breaks — Ancient Core:** Ancient Debris; +5 OneCoins per break.
- **3,000 breaks — Obsidian Core:** Obsidian; +6 OneCoins per break.
- **4,500 breaks — Crying Core:** Crying Obsidian; +7 OneCoins per break.
- **6,000 breaks — Kingdom Core:** Block of Netherite; +8 OneCoins per break.

Use suitable pickaxes for later blocks. The core stage is shared by the world, while shop unlocks and personal milestone rewards are tracked separately for each player.

## Permanent Trader Access

- A permanent Trader Post is restored at coordinates `2 65 0` whenever that position is air.
- Interact with the Trader Post barrel to open the shop without needing the custom item.
- The OneBlock Trader Ledger can be recovered through the Trader menu, and the add-on attempts to restore it if it is missing from the player's inventory.
- The existing `/function give_trader` recovery command remains available to the host.

## Trading and Balanced Progression

- Starting balance: 50 OneCoins.
- Selling Dirt grants 1 OneCoin per Dirt.
- The shop contains 180 purchasable entries across ten tiers, with prices scaling by tier and reduced quantities for powerful equipment.
- Each shop tier has a one-time bonus of 25, 50, 75, 100, 150, 200, 300, 500, or 1,000 OneCoins at its unlock.
- Every 250 personal core breaks grants another 20 OneCoins.
- Every 500 world-wide core breaks triggers a Core Surge: +50 OneCoins and three hostile mobs near the player who reached the milestone.
- A bonus Emerald Block can appear above the platform. Breaking it grants 30 OneCoins, with a 20% chance of triggering a hostile mob wave.
- After 6,000 personal breaks, Kingdom Prestige can reset that player's personal shop progress for +500 OneCoins and one permanent Prestige level. The shared core does not reset, so prestige is an optional harder challenge.

## Test Setup

1. Import the MCAddon and create a new, disposable Bedrock world.
2. Enable both imported packs.
3. Check that the central core position (`0 64 0`) is air or the intended core block, and that the Trader Post position (`2 65 0`) is available.
4. Break the central block and verify the mining counter, OneCoin balance, and block stage.
5. Interact with the Trader Post barrel to open the shop. Test Ledger recovery by removing the item from your inventory.
6. Watch for bonus blocks and the 500-break Core Surge.

The scheduled block function only fills the core and Trader Post positions when they are air. It does not clear terrain or build a void platform, so test in a disposable world with the intended OneBlock platform.

## Compatibility and Test Notes

- Target platform: Minecraft Bedrock Edition 1.26+.
- Package format: MCAddon containing a Behavior Pack and Resource Pack.
- This package is for testing and does not contain a world save.
- The automated package build and syntax checks do not replace live in-game testing. Stage hardness, station interaction, mob spawning, item recovery, and the economy should be tested in Minecraft.
- Experimental settings, achievement status, and multiplayer balance have not been verified.

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.
- [CurseForge Profile](https://www.curseforge.com/members/allenscreations/projects)
- [MCPEDL Profile](https://mcpedl.com/user/allenscreations/)

---

© All rights reserved for AllensCreations.

## Search & Discovery Keywords

Minecraft Bedrock OneBlock survival, Dirtbound Kingdom, evolving OneBlock core, OneBlock Trader Post, OneCoins shop economy, ten-stage OneBlock progression, bonus Emerald Block, Minecraft PE survival challenge, MCPEDL map, CurseForge Bedrock, AllensCreations.
