# ALN:OneClickSort: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/feedback_profile.js` | 2 | (no header comment) |
| `scripts/main.js` | 8 | (no header comment) |
| `scripts/sort_engine.js` | 85 | (no header comment) |
| `scripts/sort_triggers.js` | 297 | (no header comment) |
| `scripts/sort_ui.js` | 72 | (no header comment) |

## Imports

- `@minecraft/server` (in `main.js`, `sort_triggers.js`, `sort_ui.js`)
- `@minecraft/server-ui` (in `sort_ui.js`)
- `./feedback_profile.js` (in `sort_triggers.js`)
- `./sort_engine.js` (in `sort_triggers.js`)
- `./sort_triggers.js` (in `main.js`)
- `./sort_ui.js` (in `sort_triggers.js`)

## Events

- `world.afterEvents.itemUse`
- `world.afterEvents.playerLeave`
- `world.afterEvents.worldLoad`
- `world.beforeEvents.playerInteractWithBlock`

## Custom ids

- `allenscreations:auto_sort_feather` (`sort_triggers.js`)
- `allenscreations:restock_feather` (`sort_triggers.js`)
- `allenscreations:sort_settings_book` (`sort_ui.js`)
- plus 8 vanilla `minecraft:` id(s)

## Features found

- ModalFormData
- delayed task (system.runTimeout)
- dynamic properties (saved data)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
