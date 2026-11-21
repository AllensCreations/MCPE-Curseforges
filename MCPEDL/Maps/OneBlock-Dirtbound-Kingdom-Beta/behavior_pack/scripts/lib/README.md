# OneBlock Dirtbound Kingdom Beta: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/main.js` | 396 | (no header comment) |

## Imports

- `@minecraft/server` (in `main.js`)
- `@minecraft/server-ui` (in `main.js`)

## Events

- `world.afterEvents.itemUse`
- `world.afterEvents.playerBreakBlock`
- `world.afterEvents.playerLeave`
- `world.afterEvents.playerSpawn`

## Custom ids

- `allenscreations:trader_ledger` (`main.js`)
- plus 9 vanilla `minecraft:` id(s)

## Features found

- ActionFormData
- MessageFormData
- delayed task (system.runTimeout)
- repeating timer (system.runInterval)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
