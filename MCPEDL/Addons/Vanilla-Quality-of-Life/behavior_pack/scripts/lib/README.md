# Scripts: lib

`main.js` only imports these files. Edit the file that matches the feature.

| File | What it does |
|---|---|
| `config.js` | Settings and item tables. Chain mining switches come from `../mining-options.js`. |
| `state.js` | Per-player data shared between files. |
| `utils.js` | Small helpers for items, containers and targets. |
| `offhand.js`, `light.js`, `player-loop.js` | Offhand quick-swap and moving held light. |
| `tool-categories.js` | Which tool each block needs. Add new block IDs here. |
| `tool-scoring.js`, `slot-switch.js`, `autoswitch.js` | Picking and swapping the best tool. |
| `durability.js` | Stops chain mining before a tool breaks. |
| `blocks.js` | Removes blocks and groups drops. |
| `tree-capitator.js`, `replant.js` | Tree felling and sapling replanting. |
| `ore-miner.js` | Domino Ore Miner, Fortune and experience. |
| `chain-mining.js` | Starts Tree Capitator or Domino Ore Miner when a block breaks. |
| `lifecycle.js` | Player-leave cleanup, startup tasks and the startup log. |

Useful switches in `config.js`: `REPLANT_SAPLINGS`, `REPLANT_REQUIRES_SAPLING`, `MAX_REPLANT_SPOTS`, `APPLY_RANDOM_TICK_SPEED`, `RANDOM_TICK_SPEED`.
