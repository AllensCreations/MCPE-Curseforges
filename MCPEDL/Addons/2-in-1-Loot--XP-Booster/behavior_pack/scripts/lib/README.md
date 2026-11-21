# 2-in-1 Loot & XP Booster: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/main.js` | 464 | (no header comment) |

## Imports

- `@minecraft/server` (in `main.js`)
- `@minecraft/server-ui` (in `main.js`)

## Events

- `system.beforeEvents.startup`
- `world.afterEvents.entityDie`
- `world.afterEvents.itemUse`
- `world.afterEvents.playerBreakBlock`
- `world.afterEvents.playerInteractWithBlock`
- `world.afterEvents.playerLeave`
- `world.afterEvents.playerPlaceBlock`

## Custom ids

- `aln:booster` (`main.js`)
- plus 28 vanilla `minecraft:` id(s)

## Features found

- ActionFormData
- ModalFormData
- delayed task (system.runTimeout)
- dynamic properties (saved data)
- repeating timer (system.runInterval)

## Notes (AI review)

- Block loot: the block's own loot is rolled again with the tool used. Silk Touch, unfinished crops, bone meal crops and Creative mode are skipped. The Creative check reads the text of `getGameMode()` and is not verified in game.
- Mob loot: the mob's own loot is rolled again with the killer's main hand item. Baby mobs are not checked (not verified).
- Extra drops from one break or kill are combined into full stacks with `isStackableWith` before they are spawned.
- XP: nearby orbs are multiplied by spawning extra orbs for the closest player. The value of an extra orb is not set by the script (not verified); `Dimension.spawnXp` sets an exact value from 1 to 12000 if this needs changing.
- Nothing here was run in game.
