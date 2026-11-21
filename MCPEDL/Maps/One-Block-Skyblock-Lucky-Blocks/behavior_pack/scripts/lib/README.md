# One Block Skyblock Lucky Blocks: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/main.js` | 546 | (no header comment) |

## Imports

- `@minecraft/server` (in `main.js`)

## Events

- `world.afterEvents.itemUse`
- `world.afterEvents.playerBreakBlock`
- `world.afterEvents.playerSpawn`

## Custom ids

- `allenscreations:lucky_block` (`main.js`)
- `allenscreations:trader_ledger` (`main.js`)
- plus 162 vanilla `minecraft:` id(s)

## Features found

- delayed task (system.runTimeout)
- dynamic properties (saved data)
- repeating timer (system.runInterval)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
