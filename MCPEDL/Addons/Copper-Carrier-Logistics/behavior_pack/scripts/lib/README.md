# Copper-Carrier Logistics: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/carrier.js` | 362 | (no header comment) |
| `scripts/main.js` | 6 | (no header comment) |
| `scripts/memory.js` | 144 | (no header comment) |
| `scripts/sorting.js` | 300 | (no header comment) |

## Imports

- `@minecraft/server` (in `carrier.js`, `memory.js`, `sorting.js`)
- `./carrier.js` (in `main.js`, `sorting.js`)
- `./memory.js` (in `carrier.js`, `sorting.js`)
- `./sorting.js` (in `main.js`)

## Events

- `world.afterEvents.entityDie`
- `world.afterEvents.entitySpawn`
- `world.afterEvents.playerLeave`
- `world.beforeEvents.playerInteractWithEntity`

## Custom ids

- `cc:buffer` (`memory.js`)
- `cc:golem` (`carrier.js`)
- `cc:home` (`carrier.js`)
- `cc:owner` (`carrier.js`, `sorting.js`)
- plus 10 vanilla `minecraft:` id(s)

## Features found

- dynamic properties (saved data)
- repeating timer (system.runInterval)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
