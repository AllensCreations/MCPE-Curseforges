# Fletching Table Arsenal: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/fletcher.js` | 233 | (no header comment) |
| `scripts/impact.js` | 194 | (no header comment) |
| `scripts/main.js` | 16 | (no header comment) |

## Imports

- `@minecraft/server` (in `fletcher.js`, `impact.js`, `main.js`)
- `@minecraft/server-ui` (in `fletcher.js`)
- `./fletcher.js` (in `impact.js`, `main.js`)
- `./impact.js` (in `main.js`)

## Events

- `world.afterEvents.entitySpawn`
- `world.afterEvents.itemStartUse`
- `world.afterEvents.playerLeave`
- `world.afterEvents.projectileHitBlock`
- `world.afterEvents.projectileHitEntity`
- `world.beforeEvents.playerInteractWithBlock`

## Custom ids

- none found
- plus 19 vanilla `minecraft:` id(s)

## Features found

- ActionFormData
- delayed task (system.runTimeout)
- repeating timer (system.runInterval)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
