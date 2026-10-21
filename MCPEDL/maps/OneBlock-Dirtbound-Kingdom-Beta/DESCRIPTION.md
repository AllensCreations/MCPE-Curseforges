# OneBlock: Dirtbound Kingdom Beta — MCAddon Test Build

**By AllensCreations**

This troubleshooting package tests the OneBlock block-restoration function separately from world generation. It includes the custom OneBlock Trader and the trading interface, but does not include a prebuilt world.

## Test the OneBlock

1. Import the MCAddon and create a new, disposable Bedrock world.
2. Enable both imported packs and turn on cheats for this test.
3. Run `/function give_trader` to receive the OneBlock Trader.
4. Check coordinates `0 64 0` for the central Dirt block.
5. Break the Dirt block. It should return on the next scheduled tick if the position is air.
6. Hold and use the OneBlock Trader to open the trading menu.

The block function only fills the central position when it is air; it does not clear other blocks or build a void platform. A regular world may already have terrain at those coordinates, so use a test world and inspect the exact position.

## Trading and Progression

- Starting balance: 50 OneCoins.
- Breaking the central OneBlock grants 1 OneCoin and advances the mining counter by 1.
- Selling Dirt grants 1 additional OneCoin per Dirt block sold.
- Ten shop tiers unlock at 0, 50, 150, 350, 700, 1,200, 2,000, 3,000, 4,500, and 6,000 central-block breaks.
- The economy keeps a 50-OneCoin starting balance; starter supplies remain cheaper, while rare endgame gear costs substantially more.
- Milestone bonuses add 25, 50, 75, 100, 150, 200, 300, 500, and 1,000 OneCoins at the nine unlocks after the starter tier.
- The live status bar displays Block Mined and OneCoins with pickaxe and coin indicators.
- The shop is designed with 180 purchasable entries across ten tiers.
- Pricing, delivery, icon rendering, block restoration, and the Trader item still require in-game testing.

## Compatibility and Test Notes

- Target platform: Minecraft Bedrock Edition 1.26+.
- Package format: MCAddon containing a Behavior Pack and Resource Pack.
- This package is for testing and does not contain a world save.
- Enable cheats to run the item-giving function.
- Experimental settings, achievement status, and multiplayer behavior have not been verified.

## Creator and Permissions

- Creator: AllensCreations
- [CurseForge Profile](https://www.curseforge.com/members/allenscreations/projects)
- [MCPEDL Profile](https://mcpedl.com/user/allenscreations/)
- Rights & Reservation: All rights reserved for AllensCreations.
- Content creators may feature this creation in videos and streams with credit to AllensCreations. Do not re-upload or redistribute the package without permission.

---

© All rights reserved for AllensCreations.

## Search & Discovery Keywords

Minecraft Bedrock OneBlock test add-on, Dirtbound Kingdom, OneBlock Trader item, block restoration, survival shop, Dirt selling economy, OneCoins, Minecraft PE OneBlock, MCPEDL map, CurseForge Bedrock, AllensCreations.
