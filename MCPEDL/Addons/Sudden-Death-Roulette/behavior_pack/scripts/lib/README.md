# Sudden Death Roulette: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/main.js` | 276 | (no header comment) |

## Imports

- `@minecraft/server` (in `main.js`)

## Events

- `system.afterEvents.scriptEventReceive`
- `world.afterEvents.playerLeave`
- script events (`scriptEventReceive`) are handled

## Custom ids

- `sdr:race_over` (`main.js`)
- `sdr:reset` (`main.js`)
- plus 6 vanilla `minecraft:` id(s)

## Features found

- delayed task (system.runTimeout)
- dynamic properties (saved data)
- repeating timer (system.runInterval)
- runCommand

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
