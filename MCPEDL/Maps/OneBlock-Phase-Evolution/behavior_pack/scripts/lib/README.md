# OneBlock Phase Evolution: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/main.js` | 92 | (no header comment) |
| `scripts/team_inventory.js` | 276 | (no header comment) |

## Imports

- `@minecraft/server` (in `main.js`, `team_inventory.js`)
- `./team_inventory.js` (in `main.js`)

## Events

- `world.afterEvents.entityDie`
- `world.afterEvents.playerBreakBlock`
- `world.afterEvents.playerSpawn`
- `world.beforeEvents.playerLeave`

## Custom ids

- `allenscreations:phase_team_inventory_v1` (`team_inventory.js`)
- `allenscreations:phase_team_keep` (`team_inventory.js`)
- plus 96 vanilla `minecraft:` id(s)

## Features found

- delayed task (system.runTimeout)
- dynamic properties (saved data)
- repeating timer (system.runInterval)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
