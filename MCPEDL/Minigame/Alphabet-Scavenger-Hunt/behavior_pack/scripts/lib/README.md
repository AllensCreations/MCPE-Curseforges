# Alphabet Scavenger Hunt: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/controller.js` | 181 | (no header comment) |
| `scripts/item_data.js` | 372 | Item Database & Verification Engine for Alphabet Scavenger Hunt |
| `scripts/main.js` | 752 | Alphabet Scavenger Hunt Challenge |

## Imports

- `@minecraft/server` (in `controller.js`, `main.js`)
- `@minecraft/server-ui` (in `controller.js`)
- `./controller.js` (in `main.js`)
- `./item_data.js` (in `main.js`)

## Events

- `system.afterEvents.scriptEventReceive`
- `world.afterEvents.entityDie`
- `world.afterEvents.itemUse`
- `world.afterEvents.playerSpawn`
- `world.afterEvents.worldLoad`
- script events (`scriptEventReceive`) are handled

## Custom ids

- `allenscreations:end` (`controller.js`)
- `aln:alphabet_scavenger_hunt_controller` (`controller.js`)
- plus 8 vanilla `minecraft:` id(s)

## Features found

- ActionFormData
- delayed task (system.runTimeout)
- dynamic properties (saved data)
- repeating timer (system.runInterval)
- runCommand

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
