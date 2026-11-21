# Combat Helper: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/lib/bowaim.js` | 166 | (no header comment) |
| `scripts/lib/combat.js` | 140 | (no header comment) |
| `scripts/lib/extras.js` | 147 | (no header comment) |
| `scripts/lib/friends.js` | 19 | (no header comment) |
| `scripts/lib/gear.js` | 55 | (no header comment) |
| `scripts/lib/info.js` | 5 | (no header comment) |
| `scripts/lib/loops.js` | 124 | (no header comment) |
| `scripts/lib/menu.js` | 236 | (no header comment) |
| `scripts/lib/saved.js` | 28 | (no header comment) |
| `scripts/lib/store.js` | 81 | (no header comment) |
| `scripts/lib/tuning.js` | 37 | (no header comment) |
| `scripts/main.js` | 33 | (no header comment) |

## Imports

- `@minecraft/server` (in `lib/bowaim.js`, `lib/combat.js`, `lib/extras.js`, `lib/friends.js`, `lib/gear.js`, `lib/loops.js`, `lib/menu.js`, `lib/saved.js`, `lib/store.js`, `main.js`)
- `@minecraft/server-ui` (in `lib/menu.js`)
- `./bowaim.js` (in `lib/extras.js`)
- `./extras.js` (in `lib/menu.js`)
- `./friends.js` (in `lib/bowaim.js`, `lib/loops.js`, `lib/menu.js`)
- `./gear.js` (in `lib/combat.js`)
- `./info.js` (in `lib/bowaim.js`, `lib/combat.js`, `lib/extras.js`, `lib/friends.js`, `lib/menu.js`)
- `./lib/bowaim.js` (in `main.js`)
- `./lib/combat.js` (in `main.js`)
- `./lib/extras.js` (in `main.js`)
- `./lib/gear.js` (in `main.js`)
- `./lib/info.js` (in `main.js`)
- `./lib/loops.js` (in `main.js`)
- `./lib/menu.js` (in `main.js`)
- `./lib/store.js` (in `main.js`)
- `./saved.js` (in `lib/friends.js`, `lib/tuning.js`)
- `./store.js` (in `lib/bowaim.js`, `lib/combat.js`, `lib/extras.js`, `lib/loops.js`, `lib/menu.js`)
- `./tuning.js` (in `lib/bowaim.js`, `lib/combat.js`, `lib/extras.js`, `lib/loops.js`, `lib/menu.js`)

## Events

- `world.afterEvents.entityHurt`
- `world.afterEvents.entitySpawn`
- `world.afterEvents.itemUse`
- `world.afterEvents.playerLeave`
- `world.afterEvents.playerSpawn`
- `world.beforeEvents.entityHurt`

## Custom ids

- `allenscreations:aln_gift_on` (`main.js`)
- `allenscreations:aln_pointer` (`lib/info.js`)
- `allenscreations:aln_target` (`lib/extras.js`)
- plus 25 vanilla `minecraft:` id(s)

## Features found

- ActionFormData
- ModalFormData
- delayed task (system.runTimeout)
- dynamic properties (saved data)
- repeating timer (system.runInterval)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
