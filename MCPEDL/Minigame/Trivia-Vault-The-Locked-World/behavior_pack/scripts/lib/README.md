# Trivia Vault: The Locked World: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/consequences.js` | 2 | (no header comment) |
| `scripts/controller.js` | 181 | (no header comment) |
| `scripts/difficulty.js` | 2 | (no header comment) |
| `scripts/main.js` | 252 | (no header comment) |
| `scripts/questions.js` | 633 | (no header comment) |

## Imports

- `@minecraft/server` (in `controller.js`, `main.js`)
- `@minecraft/server-ui` (in `controller.js`, `main.js`)
- `./consequences.js` (in `main.js`)
- `./controller.js` (in `main.js`)
- `./difficulty.js` (in `main.js`)
- `./questions.js` (in `main.js`)

## Events

- `system.afterEvents.scriptEventReceive`
- `world.afterEvents.entityDie`
- `world.afterEvents.itemUse`
- `world.afterEvents.playerLeave`
- `world.afterEvents.playerSpawn`
- `world.afterEvents.worldLoad`
- `world.beforeEvents.playerBreakBlock`
- script events (`scriptEventReceive`) are handled

## Custom ids

- `allenscreations:end` (`controller.js`)
- `aln:trivia_vault_controller` (`controller.js`)
- plus 11 vanilla `minecraft:` id(s)

## Features found

- ActionFormData
- delayed task (system.runTimeout)
- dynamic properties (saved data)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
