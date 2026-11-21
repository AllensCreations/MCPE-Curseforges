# Padlock & Key: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/lib/doors.js` | 49 | (no header comment) |
| `scripts/lib/lockdata.js` | 236 | (no header comment) |
| `scripts/lib/pistons.js` | 146 | (no header comment) |
| `scripts/main.js` | 325 | (no header comment) |

## Imports

- `@minecraft/server` (in `lib/doors.js`, `lib/lockdata.js`, `lib/pistons.js`, `main.js`)
- `./lib/doors.js` (in `main.js`)
- `./lib/lockdata.js` (in `main.js`)
- `./lib/pistons.js` (in `main.js`)
- `./lockdata.js` (in `lib/doors.js`, `lib/pistons.js`)

## Events

- `world.afterEvents.pistonActivate`
- `world.afterEvents.playerLeave`
- `world.afterEvents.playerPlaceBlock`
- `world.beforeEvents.explosion`
- `world.beforeEvents.itemUse`
- `world.beforeEvents.playerBreakBlock`
- `world.beforeEvents.playerInteractWithBlock`

## Custom ids

- `pnk:key` (`main.js`)
- `pnk:key_glow` (`main.js`)
- `pnk:padlock` (`main.js`)
- plus 15 vanilla `minecraft:` id(s)

## Features found

- delayed task (system.runTimeout)
- dynamic properties (saved data)
- repeating timer (system.runInterval)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
