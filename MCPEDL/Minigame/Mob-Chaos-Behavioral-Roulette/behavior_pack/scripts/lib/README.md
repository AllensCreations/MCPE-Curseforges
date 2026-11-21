# Mob Chaos: Behavioral Roulette: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/main.js` | 775 | (no header comment) |

## Imports

- `@minecraft/server` (in `main.js`)
- `@minecraft/server-ui` (in `main.js`)

## Events

- `system.afterEvents.scriptEventReceive`
- `world.afterEvents.itemUse`
- `world.afterEvents.playerLeave`
- `world.afterEvents.playerSpawn`
- script events (`scriptEventReceive`) are handled

## Custom ids

- `allenscreations:end` (`main.js`)
- `allenscreations:restart` (`main.js`)
- `allenscreations:start` (`main.js`)
- `aln:mob_chaos_roulette_controller` (`main.js`)
- plus 52 vanilla `minecraft:` id(s)

## Features found

- ActionFormData
- delayed task (system.runTimeout)
- dynamic properties (saved data)
- repeating timer (system.runInterval)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
