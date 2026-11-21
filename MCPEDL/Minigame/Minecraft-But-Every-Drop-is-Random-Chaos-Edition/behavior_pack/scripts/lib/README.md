# Minecraft, But Every Drop is Random: Chaos Edition: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/controller.js` | 181 | (no header comment) |
| `scripts/main.js` | 85 | (no header comment) |
| `scripts/random_drops.js` | 152 | (no header comment) |
| `scripts/random_loot_table.js` | 173 | (no header comment) |

## Imports

- `@minecraft/server` (in `controller.js`, `main.js`, `random_drops.js`, `random_loot_table.js`)
- `@minecraft/server-ui` (in `controller.js`)
- `./controller.js` (in `main.js`)
- `./random_drops.js` (in `main.js`)
- `./random_loot_table.js` (in `main.js`, `random_drops.js`)

## Events

- `system.afterEvents.scriptEventReceive`
- `system.beforeEvents.startup`
- `world.afterEvents.entityDie`
- `world.afterEvents.entitySpawn`
- `world.afterEvents.itemUse`
- `world.afterEvents.playerBreakBlock`
- `world.afterEvents.playerSpawn`
- `world.afterEvents.worldLoad`
- script events (`scriptEventReceive`) are handled

## Custom ids

- `allenscreations:end` (`controller.js`)
- `aln:random_drop_chaos_controller` (`controller.js`)
- `aln:reshuffle` (`main.js`)
- plus 4 vanilla `minecraft:` id(s)

## Features found

- ActionFormData
- delayed task (system.runTimeout)
- dynamic properties (saved data)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
