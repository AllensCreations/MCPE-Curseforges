# Cheat Stick: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/main.js` | 364 | (no header comment) |

## Imports

- `@minecraft/server` (in `main.js`)
- `@minecraft/server-ui` (in `main.js`)

## Events

- `world.afterEvents.entityDie`
- `world.afterEvents.itemUse`

## Custom ids

- `cheatstick:slot` (`main.js`)
- plus 7 vanilla `minecraft:` id(s)

## Features found

- ActionFormData
- ModalFormData
- dynamic properties (saved data)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
