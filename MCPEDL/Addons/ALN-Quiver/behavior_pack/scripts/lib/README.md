# ALN Quiver: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/main.js` | 6 | (no header comment) |
| `scripts/quiver_data.js` | 69 | (no header comment) |
| `scripts/quiver_feed.js` | 68 | (no header comment) |
| `scripts/quiver_storage.js` | 127 | (no header comment) |

## Imports

- `@minecraft/server` (in `quiver_data.js`, `quiver_feed.js`, `quiver_storage.js`)
- `@minecraft/server-ui` (in `quiver_storage.js`)
- `./quiver_data.js` (in `quiver_feed.js`, `quiver_storage.js`)
- `./quiver_feed.js` (in `main.js`)
- `./quiver_storage.js` (in `main.js`)

## Events

- `world.afterEvents.itemUse`
- `world.afterEvents.playerLeave`

## Custom ids

- `aln:quiver` (`quiver_data.js`)
- `aln:quiver_full` (`quiver_data.js`)
- `aln:quiver_half` (`quiver_data.js`)
- plus 4 vanilla `minecraft:` id(s)

## Features found

- ActionFormData
- dynamic properties (saved data)
- repeating timer (system.runInterval)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
