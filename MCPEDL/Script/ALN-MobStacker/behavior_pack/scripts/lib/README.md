# ALN:MobStacker: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/main.js` | 6 | (no header comment) |
| `scripts/stack_combat.js` | 249 | (no header comment) |
| `scripts/stack_config.js` | 359 | (no header comment) |
| `scripts/stack_merger.js` | 209 | (no header comment) |

## Imports

- `@minecraft/server` (in `stack_combat.js`, `stack_config.js`, `stack_merger.js`)
- `./stack_combat.js` (in `main.js`)
- `./stack_config.js` (in `stack_combat.js`, `stack_merger.js`)
- `./stack_merger.js` (in `main.js`)

## Events

- `world.afterEvents.entityDie`
- `world.afterEvents.entityRemove`
- `world.afterEvents.entitySpawn`

## Custom ids

- none found
- plus 109 vanilla `minecraft:` id(s)

## Features found

- dynamic properties (saved data)
- repeating timer (system.runInterval)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
