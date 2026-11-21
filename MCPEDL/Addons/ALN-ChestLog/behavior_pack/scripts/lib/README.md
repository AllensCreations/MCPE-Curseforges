# ALN ChestLog: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/chest_register.js` | 133 | (no header comment) |
| `scripts/chest_sync.js` | 593 | (no header comment) |
| `scripts/chest_ui.js` | 162 | (no header comment) |
| `scripts/main.js` | 11 | (no header comment) |

## Imports

- `@minecraft/server` (in `chest_register.js`, `chest_sync.js`, `chest_ui.js`, `main.js`)
- `@minecraft/server-ui` (in `chest_register.js`, `chest_sync.js`, `chest_ui.js`)
- `./chest_register.js` (in `main.js`)
- `./chest_sync.js` (in `chest_register.js`, `chest_ui.js`, `main.js`)
- `./chest_ui.js` (in `main.js`)

## Events

- `world.afterEvents.itemUse`
- `world.afterEvents.worldLoad`
- `world.beforeEvents.playerInteractWithBlock`

## Custom ids

- `aln:chest_log` (`chest_sync.js`)
- plus 17 vanilla `minecraft:` id(s)

## Features found

- ActionFormData
- ModalFormData
- delayed task (system.runTimeout)
- dynamic properties (saved data)
- repeating timer (system.runInterval)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
