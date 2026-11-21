# Target HUD Entity Inspector: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/main.js` | 4 | (no header comment) |
| `scripts/target_hud.js` | 553 | (no header comment) |

## Imports

- `@minecraft/server` (in `target_hud.js`)
- `./target_hud.js` (in `main.js`)

## Events

- `world.afterEvents.entityDie`
- `world.afterEvents.entityHurt`
- `world.afterEvents.playerLeave`

## Custom ids

- none found
- plus 5 vanilla `minecraft:` id(s)

## Features found

- repeating timer (system.runInterval)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
