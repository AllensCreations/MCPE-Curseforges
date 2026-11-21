# ALN-GlobalMarket: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/main.js` | 20 | (no header comment) |
| `scripts/trade_catalog.js` | 61 | (no header comment) |
| `scripts/trade_icons.js` | 141 | (no header comment) |
| `scripts/trade_storage.js` | 191 | (no header comment) |
| `scripts/trade_ui.js` | 347 | (no header comment) |

## Imports

- `@minecraft/server` (in `main.js`, `trade_storage.js`, `trade_ui.js`)
- `@minecraft/server-ui` (in `trade_ui.js`)
- `./trade_catalog.js` (in `trade_ui.js`)
- `./trade_icons.js` (in `trade_catalog.js`)
- `./trade_storage.js` (in `main.js`, `trade_ui.js`)
- `./trade_ui.js` (in `main.js`)

## Events

- `world.afterEvents.itemUse`
- `world.afterEvents.playerSpawn`
- `world.afterEvents.worldLoad`

## Custom ids

- none found
- plus 15 vanilla `minecraft:` id(s)

## Features found

- ActionFormData
- ModalFormData
- delayed task (system.runTimeout)
- dynamic properties (saved data)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
