# Command Vault: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/command_storage.js` | 60 | (no header comment) |
| `scripts/command_ui.js` | 181 | (no header comment) |
| `scripts/main.js` | 21 | (no header comment) |

## Imports

- `@minecraft/server` (in `command_ui.js`, `main.js`)
- `@minecraft/server-ui` (in `command_ui.js`)
- `./command_storage.js` (in `command_ui.js`)
- `./command_ui.js` (in `main.js`)

## Events

- `world.afterEvents.itemUse`
- `world.afterEvents.worldLoad`

## Custom ids

- none found
- plus 2 vanilla `minecraft:` id(s)

## Features found

- ActionFormData
- ModalFormData
- dynamic properties (saved data)
- runCommand

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
