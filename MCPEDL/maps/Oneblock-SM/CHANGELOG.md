# Changelog

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
