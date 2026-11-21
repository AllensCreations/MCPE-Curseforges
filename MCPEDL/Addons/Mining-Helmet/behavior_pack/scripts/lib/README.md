# Mining Helmet: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/main.js` | 473 | Mining Helmet Dynamic Following Light System |
| `scripts/mode.js` | 6 | Mining Helmet light mode (Cursor Light). |

## Imports

- `@minecraft/server` (in `main.js`)
- `./mode.js` (in `main.js`)

## Events

- `world.afterEvents.entityDie`
- `world.afterEvents.playerDimensionChange`
- `world.afterEvents.playerLeave`

## Custom ids

- `custom:mining_helmet` (`main.js`)
- `custom:torch_mining_helmet` (`main.js`)
- plus 13 vanilla `minecraft:` id(s)

## Features found

- repeating timer (system.runInterval)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
