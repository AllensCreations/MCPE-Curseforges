# OP Sponge: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/main.js` | 167 | (no header comment) |
| `subpacks/normal/scripts/main.js` | 167 | Same as `main.js`, OP Sponge capped at 256 blocks and 16 reach |
| `subpacks/extreme/scripts/main.js` | 167 | Same as `main.js`, OP Sponge capped at 1024 blocks and 32 reach |
| `subpacks/unlimited/scripts/main.js` | 167 | Same as `main.js`, OP Sponge with no cap |

## Imports

- `@minecraft/server` (in `main.js`)

## Events

- `world.afterEvents.playerPlaceBlock`

## Custom ids

- none found
- plus 4 vanilla `minecraft:` id(s)

## Features found

- none of: forms, dynamic properties, runCommand, timers

## Notes (AI review)

- The three subpack scripts are full copies of `main.js` that differ only in the `register("op_sponge", ...)` line. Change all four files together.
- Water is removed while scanning. Afterwards the cleared cells are re-checked up to 3 times to remove water that flowed back in.
- Cells outside 4095 blocks sideways or 511 up and down are never reached. Unloaded chunks are never reached.
- Waterlogged blocks are drained with `Block.setWaterlogged(false)`; errors from it are caught and skipped.
- Nothing here was run in game. Whether the game loads `scripts/main.js` from a behavior pack subpack is not verified.
