# ALN:SpawnControl: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/main.js` | 9 | (no header comment) |
| `scripts/spawn_filter.js` | 80 | (no header comment) |
| `scripts/spawn_registry.js` | 143 | (no header comment) |
| `scripts/spawn_ui.js` | 595 | (no header comment) |

## Imports

- `@minecraft/server` (in `main.js`, `spawn_filter.js`, `spawn_ui.js`)
- `@minecraft/server-ui` (in `spawn_ui.js`)
- `./spawn_filter.js` (in `main.js`, `spawn_ui.js`)
- `./spawn_registry.js` (in `spawn_filter.js`, `spawn_ui.js`)
- `./spawn_ui.js` (in `main.js`)

## Events

- `world.afterEvents.entitySpawn`
- `world.afterEvents.itemUse`
- `world.afterEvents.worldLoad`

## Custom ids

- none found
- plus 92 vanilla `minecraft:` id(s)

## Features found

- ActionFormData
- MessageFormData
- ModalFormData
- dynamic properties (saved data)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
