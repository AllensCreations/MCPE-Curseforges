# OneBlock: Dirtbound Kingdom Beta (source v0.1.23)

**By AllensCreations**

Dirtbound Kingdom is a OneBlock challenge built around a central block, a coin economy accessed exclusively through the custom Trader Ledger item, and ten progression stages. Use the currently published Creative world as the only in-game tester. The editable Creative, Survival, and Hardcore folders under Mcpeworlds/ are the intended foundations for future world builds, but they currently lack complete world databases; the published downloads have not yet been rebuilt from them.

## Overview

Start at the center of the world with the core at **0 0 0**, Bedrock directly underneath at **0 -1 0**, and world spawn at **0 1 0**. The world setup places a starting placeholder at the core position, which should become the current stage block when gameplay initializes. The one-time Void Cleaner clears only the 33 × 33 square from -16 -64 -16 through 16 -64 16 on Y = -64, then places Bedrock at 0 -1 0 and sets world spawn to 0 1 0. It runs only for players who do not have the void_cleaned tag.

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

## Trader Access

- Use the custom **OneBlock Trader Ledger** item to open the shop.
- The Trader Ledger is the only shop access method; no physical Trader Ledger block is used.
- The add-on attempts to restore the Ledger if it is missing from the player's inventory.

## Trading and Balanced Progression

- Starting balance: 50 OneCoins.
- Selling Dirt grants 1 OneCoin per Dirt.
- The shop contains 180 purchasable entries across ten tiers, with prices scaling by tier and reduced quantities for powerful equipment.
- Each shop tier has a one-time bonus of 25, 50, 75, 100, 150, 200, 300, 500, or 1,000 OneCoins at its unlock.
- Every 250 personal core breaks grants another 20 OneCoins.
- Every 500 world-wide core breaks triggers a Core Surge: +50 OneCoins and three hostile mobs near the player who reached the milestone.
- A bonus Emerald Block can appear above the platform. Breaking it grants 30 OneCoins, with a 20% chance of triggering a hostile mob wave.
- After 6,000 personal breaks, Kingdom Prestige can reset that player's personal shop progress for +500 OneCoins and one permanent Prestige level. The shared core does not reset, so prestige is an optional harder challenge.

## Live Balance Text

Your current OneCoins balance appears as a persistent action-bar text line. It updates regularly and does not use the sidebar scoreboard.

## Test Setup

1. Import the Creative `.mcworld` by opening it with Minecraft Bedrock Edition.
2. Enter the imported world and allow its setup to initialize.
3. Confirm that the core is present at **0 0 0**, Bedrock is at **0 -1 0**, and world spawn is **0 1 0**.
4. Break the central block and verify the mining counter, OneCoin balance, and block stage.
5. Confirm the core reappears after each break, including when a break advances the shared stage.
6. Interact with the Trader Ledger Trader Ledger item to open the shop. Test Ledger recovery by removing the item from your inventory.
7. Check the bonus block and 500-break Core Surge after normal progression.

## Compatibility and Test Notes

- Target platform: Minecraft Bedrock Edition 1.26+.
- Package format: `.mcworld` complete world.
- Use the Creative world as the tester. The Survival and Hardcore variants are kept alongside it.
- The current add-on source version is 0.1.23; the currently published `.mcworld` downloads remain from the previous build. The direct editable folders under Mcpeworlds/Creative/, Mcpeworlds/Survival/, and Mcpeworlds/Hardcore/ are the intended mode-specific foundations. Each needs its own complete world database before a new world archive can be generated. World generation remains paused until complete matching world data is supplied, the Creative mechanics are tested in Minecraft, and a rebuild is approved.
- Automated package and syntax checks do not replace live in-game testing. Starting-block recovery and progression still require verification inside Minecraft.
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

Minecraft Bedrock OneBlock survival, Dirtbound Kingdom, evolving OneBlock core, OneBlock Trader Ledger, OneCoins shop economy, ten-stage OneBlock progression, bonus Emerald Block, Minecraft PE survival challenge, MCPEDL map, CurseForge Bedrock, AllensCreations.
