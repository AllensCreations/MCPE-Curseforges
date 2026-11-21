# Gameplay Optimizer: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/lib/effects.js` | 31 | (no header comment) |
| `scripts/lib/itemcap.js` | 39 | (no header comment) |
| `scripts/lib/menu.js` | 134 | (no header comment) |
| `scripts/lib/portal.js` | 117 | (no header comment) |
| `scripts/lib/settings.js` | 54 | (no header comment) |
| `scripts/main.js` | 10 | (no header comment) |

## Imports

- `@minecraft/server` (in `lib/effects.js`, `lib/itemcap.js`, `lib/menu.js`, `lib/portal.js`, `lib/settings.js`)
- `@minecraft/server-ui` (in `lib/menu.js`)
- `./itemcap.js` (in `lib/menu.js`)
- `./lib/effects.js` (in `main.js`)
- `./lib/itemcap.js` (in `main.js`)
- `./lib/menu.js` (in `main.js`)
- `./lib/portal.js` (in `main.js`)
- `./settings.js` (in `lib/effects.js`, `lib/itemcap.js`, `lib/menu.js`, `lib/portal.js`)

## Events

- `world.afterEvents.effectAdd`
- `world.afterEvents.entitySpawn`
- `world.afterEvents.itemUse`
- `world.afterEvents.playerDimensionChange`
- `world.afterEvents.playerLeave`
- `world.afterEvents.worldLoad`

## Custom ids

- none found
- plus 9 vanilla `minecraft:` id(s)

## Features found

- ActionFormData
- ModalFormData
- delayed task (system.runTimeout)
- dynamic properties (saved data)
- repeating timer (system.runInterval)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
