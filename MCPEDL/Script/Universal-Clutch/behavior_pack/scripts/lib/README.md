# Universal Clutch: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/main.js` | 727 | (no header comment) |

## Imports

- `@minecraft/server` (in `main.js`)

## Events

- `system.afterEvents.scriptEventReceive`
- `world.afterEvents.entityDie`
- `world.afterEvents.playerLeave`
- `world.afterEvents.playerSpawn`
- script events (`scriptEventReceive`) are handled

## Custom ids

- `clutch:off` (`main.js`)
- `clutch:on` (`main.js`)
- `clutch_mode:extreme` (`main.js`)
- `clutch_mode:full` (`main.js`)
- `clutch_mode:simple` (`main.js`)
- plus 68 vanilla `minecraft:` id(s)

## Features found

- delayed task (system.runTimeout)
- dynamic properties (saved data)
- repeating timer (system.runInterval)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
