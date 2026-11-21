# 2-in-1 Loot & XP Booster: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/main.js` | 464 | (no header comment) |

## Imports

- `@minecraft/server` (in `main.js`)
- `@minecraft/server-ui` (in `main.js`)

## Events

- `system.beforeEvents.startup`
- `world.afterEvents.entityDie`
- `world.afterEvents.itemUse`
- `world.afterEvents.playerBreakBlock`
- `world.afterEvents.playerInteractWithBlock`
- `world.afterEvents.playerLeave`
- `world.afterEvents.playerPlaceBlock`

## Custom ids

- `aln:booster` (`main.js`)
- plus 28 vanilla `minecraft:` id(s)

## Features found

- ActionFormData
- ModalFormData
- delayed task (system.runTimeout)
- dynamic properties (saved data)
- repeating timer (system.runInterval)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
