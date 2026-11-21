# One-Block Hardcore Survival Economy: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/main.js` | 158 | (no header comment) |
| `scripts/phases.js` | 62 | 20-phase block pools. Each phase starts at `from` blocks broken and lasts until the next phase starts. |

## Imports

- `@minecraft/server` (in `main.js`)
- `./phases.js` (in `main.js`)

## Events

- `world.afterEvents.playerBreakBlock`
- `world.afterEvents.playerLeave`

## Custom ids

- none found
- plus 3 vanilla `minecraft:` id(s)

## Features found

- delayed task (system.runTimeout)
- dynamic properties (saved data)
- repeating timer (system.runInterval)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
