# Changelog — OneBlock Sovereign Market

---

## [1.1.2] - 2026-10-29

### Improved & Balanced
- **Auto-Miner Stone Drops**: The Auto-Miner now stores Cobblestone when the OneBlock is Stone, like mining by hand.
- **Island Size Check**: Placing, breaking and using blocks no longer rereads the saved world data to find the island size.

### Fixed
- **Water and Lava Cleanup on Large Islands**: On islands of 81 x 81 and larger, stray water and lava were not removed. Cleanup now works on every island size.
- **Auto-Miner Toggle**: Switching the Auto-Miner ON and OFF repeatedly gave extra instant breaks. Each instant break now uses part of the day's mining time.
- **Auto-Miner Drops**: Deepslate, Clay, Melon, Nether Gold Ore, Mycelium and mushroom blocks mined by the Auto-Miner now become items the market buys.
- **Island Permit Charge**: A permit is no longer charged when part of the new border area is not loaded. You are asked to stand near the OneBlock and try again.
- **OneBlock Respawn**: The OneBlock could stay missing after being broken if an error happened while the next block was being created. It now recovers.
- **Plot Edge Protection**: Boats, minecarts, armor stands, item frames, paintings, end crystals, spawn eggs, flint and steel and fire charges can no longer be used at the edge of your island to place things outside the permitted area.
- **OneBlock Explosion Protection**: Explosions no longer destroy the OneBlock, the chest above it or the foundation Bedrock.

## 1.0.0
- First version: Dirt-only OneBlock, wallet, Trader's Ledger, ten license tiers, supply-and-demand market, five loot contracts, six island levels.
- Starter island is 9 x 9 and centered on the OneBlock. Island sizes are now 9, 17, 33, 65, 67, 69, all odd and centered on the OneBlock.
- Building outside the permitted area shows a "Plot not owned" warning.

## 1.0.1
- Loot and chest contents exclude fluids, buckets, biome and structure items. Chests never spawn beside liquid.
- Dirt keeps at least 25 percent of the OneBlock pool once other licenses are owned.
- Stray water and lava are removed from the island area every 30 seconds.
- Island expansion fills only empty space in the new ring.
- Admin market report via /scriptevent osm:market (osm_admin tag).
- Startup log lists unknown loot and block ids.

## 1.0.2
- The Trader's Ledger stays in hotbar slot 9 and returns within half a second if thrown away. Dropped copies are removed.

## 1.0.3
- One-tap shop: every license, contract and perk is a single button that buys on tap and then shows its next state (Buy, Owned; Activate, Upgrade Lv2, Upgrade Lv3, MAX). The menu reopens in place with the result on top. Only purchases of 2,000 coins or more ask for confirmation.
- Island permits and the Auto-Mining Subscription now share one screen, "Island & Auto-Mine".
- Auto-mining no longer reads the saved world data every tick. The subscription is cached, so the per-tick check is near zero when nobody has a subscription.
- Pack versions, changelog and descriptions now match (1.0.3).

## 1.0.4
- Auto-Miner rebuilt: five permanent levels (every 10, 6, 4, 2, then 1 tick per OneBlock break), an ON/OFF toggle, and about 2 minutes of mining per Minecraft day. When the time runs out it shows "Auto-mining is exhausted". Each break plays the block-destroy animation and stores what the OneBlock held in the chest above it.
- Basic Supply Chest now lives inside the OneBlock: with the contract active, the OneBlock sometimes turns into a loot chest (5 percent per level). It no longer spawns chests randomly on the island.
- Transaction History removed from the Ledger.
- Market prices react more strongly to every sale, and the sale receipt shows the price before and after.
- Plot protection: bucket placement is checked, and placed or broken blocks outside the permitted area are undone as a backup.

## 1.0.5
- How to Play guide in the Trader's Ledger: six short pages covering mining, licenses, selling, contracts, the island and the Auto-Miner.
- A progress hint at the top of the Ledger menu that follows what the player has done so far.
- New achievement "Quick Learner": finish the guide for 25 coins.
- New players see a short tip pointing to How to Play when they first join.

## 1.0.6
- Removed an incorrect line about Sell All from the How to Play guide.

## 1.1.0
- Dirt no longer pays coins when you break the OneBlock. Dirt is now an item you sell at the market like any other (1 coin minimum each).
- How to Play is mandatory and read once. New and existing players cannot move, build or open the Ledger until they finish it. Close is gone, pressing it reopens the page, and the Ledger button disappears afterwards. Operators can skip it with `/tag <player> add tutorial_done`.
- Island expansion draws only a border (polished deepslate) and no longer fills grass. Sizes are 9, 17, 33, 65, then 67, 69, 71 and so on, up to 129. From 67 on, each permit costs about 10 percent more than the last.
- Auto-Miner: toggling it ON breaks the OneBlock immediately, a countdown shows on the action bar, and fast levels show the break effect every 4th break.
- OneBlock additions: every 100th hand break pays a tier-based coin bonus and the next OneBlock becomes a bonus loot chest; a 1 percent gold block jackpot pays 20 to 60 coins per owned tier. Neither triggers from the Auto-Miner.
- Block pools now contain only blocks that generate naturally. Removed: planks, stripped logs, polished stone variants, stone, mud, nether and end bricks, packed mud, raw metal blocks, purpur and dyed terracotta. Added natural blocks such as mycelium, moss, azalea leaves, deepslate, sandstone, calcite, mushroom blocks, pumpkin, melon, nether stems and soul soil. Contract loot no longer contains planks or glass.
