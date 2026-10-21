# OneBlock: Dirtbound Kingdom Beta (v0.1.8) — MCAddon Test Build

**By AllensCreations**

This temporary test build separates the OneBlock gameplay script from the world-generation and packaging process. It installs the behavior and resource packs, but **does not include a prebuilt OneBlock world**.

## Test Scope

- The script is intended to place Dirt at the central OneBlock position and restore it after it is broken.
- The test build includes the OneBlock Trader item and a shop with 180 purchasable entries across ten progression tiers.
- The current goal is to verify that the script loads and the central block appears before building another world package.
- These behaviors have not yet been confirmed in a live Minecraft session.

## How to Test

1. Import the `.mcaddon` test package.
2. Create a new, disposable Minecraft Bedrock world.
3. Enable both imported packs in the world settings.
4. Join the world and inspect the area around the spawn point for the central Dirt block.
5. If the block appears, break it once and check whether it returns.
6. Hold the OneBlock Trader and interact with it to test whether the trading menu opens.

Use a disposable world only. The test script can change blocks and teleport the joining player near the world origin.

## Planned Gameplay

### OneBlock Trader
- Intended to provide a trading menu for selling Dirt, checking OneCoins, and buying supplies.

### OneCoins and Progression
- Intended starting balance: 50 OneCoins.
- Each Dirt block sold is intended to grant 1 OneCoin.
- Ten shop tiers are intended to unlock at 0, 20, 50, 100, 175, 275, 400, 600, 850, and 1,200 mined blocks.
- Item delivery, pricing, and all 180 shop entries still require in-game testing.

## Compatibility and Test Notes

- Target platform: Minecraft Bedrock Edition 1.26+.
- Package format: MCAddon containing a Behavior Pack and Resource Pack.
- This package is a troubleshooting build, not a finished map.
- World generation is paused until the central block and script behavior are confirmed in-game.
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

Minecraft Bedrock OneBlock test add-on, Dirtbound Kingdom, OneBlock Trader item, OneBlock block restoration, 180 item survival shop, Dirt selling economy, OneCoins survival, Minecraft PE OneBlock, MCPEDL map, CurseForge Bedrock, AllensCreations.
