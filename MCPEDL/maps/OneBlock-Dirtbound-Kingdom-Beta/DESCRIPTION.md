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
- Selling Dirt grants 1 OneCoin per block.
- Ten shop tiers unlock at 0, 20, 50, 100, 175, 275, 400, 600, 850, and 1,200 blocks mined.
- The shop is designed with 180 purchasable entries across ten tiers.
- Pricing, delivery, block restoration, and the Trader item still require in-game testing.

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
