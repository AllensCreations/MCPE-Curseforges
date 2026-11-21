# Tethered: Breaker and Builder: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/controller.js` | 157 | (no header comment) |
| `scripts/main.js` | 668 | (no header comment) |

## Imports

- `@minecraft/server` (in `controller.js`, `main.js`)
- `@minecraft/server-ui` (in `controller.js`, `main.js`)
- `./controller.js` (in `main.js`)

## Events

- `system.afterEvents.scriptEventReceive`
- `world.afterEvents.entityDie`
- `world.afterEvents.itemUse`
- `world.afterEvents.playerLeave`
- `world.afterEvents.playerPlaceBlock`
- `world.afterEvents.playerSpawn`
- `world.beforeEvents.entityHurt`
- `world.beforeEvents.playerBreakBlock`
- `world.beforeEvents.playerInteractWithBlock`
- script events (`scriptEventReceive`) are handled

## Custom ids

- `allenscreations:end` (`controller.js`)
- `aln:tethered_breaker_builder_controller` (`controller.js`)
- `tether:breaker` (`main.js`)
- `tether:builder` (`main.js`)
- `tether:dummy` (`main.js`)
- `tether:leash_beam` (`main.js`)
- `tether:reset` (`main.js`)
- `tether:role` (`main.js`)
- `tether:swap` (`main.js`)
- plus 18 vanilla `minecraft:` id(s)

## Features found

- ActionFormData
- delayed task (system.runTimeout)
- dynamic properties (saved data)
- repeating timer (system.runInterval)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
