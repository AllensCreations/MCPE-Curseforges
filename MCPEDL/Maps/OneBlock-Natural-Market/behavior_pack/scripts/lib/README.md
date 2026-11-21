# OneBlock Natural Market: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/main.js` | 685 | (no header comment) |

## Imports

- `@minecraft/server` (in `main.js`)
- `@minecraft/server-ui` (in `main.js`)

## Events

- `system.afterEvents.scriptEventReceive`
- `world.afterEvents.itemUse`
- `world.afterEvents.playerBreakBlock`
- `world.afterEvents.playerLeave`
- `world.afterEvents.playerSpawn`
- script events (`scriptEventReceive`) are handled

## Custom ids

- `allenscreations:obm_status` (`main.js`)
- `allenscreations:oneblock_ready` (`main.js`)
- `allenscreations:trader_ledger` (`main.js`)
- plus 32 vanilla `minecraft:` id(s)

## Features found

- ActionFormData
- MessageFormData
- delayed task (system.runTimeout)
- dynamic properties (saved data)
- repeating timer (system.runInterval)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
