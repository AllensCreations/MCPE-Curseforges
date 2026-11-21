# Passive Auto-Switch Tools: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/main.js` | 727 | (no header comment) |

## Imports

- `@minecraft/server` (in `main.js`)

## Events

- `world.afterEvents.entityHitBlock`
- `world.afterEvents.entityHitEntity`
- `world.afterEvents.playerLeave`

## Custom ids

- none found
- plus 5 vanilla `minecraft:` id(s)

## Features found

- delayed task (system.runTimeout)
- repeating timer (system.runInterval)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
