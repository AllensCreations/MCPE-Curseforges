# ALN Wireless Headphones: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/headphone_common.js` | 277 | (no header comment) |
| `scripts/headphone_link.js` | 105 | (no header comment) |
| `scripts/headphone_mute.js` | 72 | (no header comment) |
| `scripts/headphone_stream.js` | 194 | (no header comment) |
| `scripts/main.js` | 5 | (no header comment) |

## Imports

- `@minecraft/server` (in `headphone_common.js`, `headphone_link.js`, `headphone_mute.js`, `headphone_stream.js`)
- `./headphone_common.js` (in `headphone_link.js`, `headphone_mute.js`, `headphone_stream.js`, `main.js`)
- `./headphone_link.js` (in `main.js`)
- `./headphone_mute.js` (in `main.js`)
- `./headphone_stream.js` (in `main.js`)

## Events

- `world.afterEvents.playerInteractWithBlock`

## Custom ids

- `aln:headphones` (`headphone_common.js`)
- plus 4 vanilla `minecraft:` id(s)

## Features found

- delayed task (system.runTimeout)
- dynamic properties (saved data)
- repeating timer (system.runInterval)
- runCommand

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
