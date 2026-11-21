# OneBlock: Sovereign Market: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/config.js` | 172 | All tunable numbers live here. Block and item ids are written without the "minecraft:" prefix. |
| `scripts/game.js` | 647 | (no header comment) |
| `scripts/main.js` | 185 | (no header comment) |
| `scripts/store.js` | 101 | (no header comment) |
| `scripts/ui.js` | 233 | (no header comment) |

## Imports

- `@minecraft/server` (in `game.js`, `main.js`, `store.js`, `ui.js`)
- `@minecraft/server-ui` (in `ui.js`)
- `./config.js` (in `game.js`, `main.js`, `store.js`, `ui.js`)
- `./game.js` (in `main.js`, `ui.js`)
- `./store.js` (in `game.js`, `main.js`, `ui.js`)
- `./ui.js` (in `main.js`)

## Events

- `system.afterEvents.scriptEventReceive`
- `world.afterEvents.itemUse`
- `world.afterEvents.playerBreakBlock`
- `world.afterEvents.playerLeave`
- `world.afterEvents.playerPlaceBlock`
- `world.afterEvents.playerSpawn`
- `world.beforeEvents.explosion`
- `world.beforeEvents.playerBreakBlock`
- `world.beforeEvents.playerInteractWithBlock`
- `world.beforeEvents.playerPlaceBlock`
- script events (`scriptEventReceive`) are handled

## Custom ids

- `allenscreations:trader_ledger` (`config.js`)
- `osm:market` (`main.js`)
- `osm:player` (`store.js`)
- `osm:world` (`store.js`)
- plus 53 vanilla `minecraft:` id(s)

## Features found

- ActionFormData
- delayed task (system.runTimeout)
- dynamic properties (saved data)
- repeating timer (system.runInterval)
- runCommand

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
