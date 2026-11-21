# Chrono-Bed: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/chrono_bed.js` | 15 | (no header comment) |
| `scripts/main.js` | 4 | (no header comment) |
| `scripts/time_engine.js` | 171 | (no header comment) |

## Imports

- `@minecraft/server` (in `chrono_bed.js`, `time_engine.js`)
- `./chrono_bed.js` (in `main.js`)
- `./time_engine.js` (in `chrono_bed.js`)

## Events

- `world.afterEvents.playerInteractWithBlock`

## Custom ids

- none found
- plus 16 vanilla `minecraft:` id(s)

## Features found

- repeating timer (system.runInterval)
- runCommand

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
