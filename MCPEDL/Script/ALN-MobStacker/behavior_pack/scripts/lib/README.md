# ALN:MobStacker: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/main.js` | 8 | (no header comment) |
| `scripts/stack_combat.js` | 252 | (no header comment) |
| `scripts/stack_config.js` | 376 | (no header comment) |
| `scripts/stack_merger.js` | 217 | (no header comment) |
| `scripts/stack_tower.js` | 190 | (no header comment) |

## Imports

- `@minecraft/server` (in `stack_combat.js`, `stack_config.js`, `stack_merger.js`, `stack_tower.js`)
- `./stack_combat.js` (in `main.js`)
- `./stack_config.js` (in `stack_combat.js`, `stack_merger.js`, `stack_tower.js`)
- `./stack_merger.js` (in `main.js`)
- `./stack_tower.js` (in `main.js`, `stack_combat.js`, `stack_merger.js`)

## Events

- `world.afterEvents.entityDie`
- `world.afterEvents.entityRemove`
- `world.afterEvents.entitySpawn`
- `world.beforeEvents.playerInteractWithEntity`

## Custom ids

- none found
- plus 109 vanilla `minecraft:` id(s)

## Features found

- dynamic properties (saved data)
- repeating timer (system.runInterval)

## Notes (AI review)

- Stack towers (farm animals only): the extra mobs are real copies tagged as visuals. They get long resistance, fire resistance, slowness and slow falling effects and are checked every 2 ticks, then teleported above the stack mob only when they drift more than 0.15 blocks or turn more than 5 degrees. Player interactions with a copy are cancelled. Not tested in game: that the effects stop all damage, that the copies stay still, that slow falling keeps them in place, and that the interaction block catches every action (feeding, shearing, milking, naming, leashing).
- Tower heights in `TOWER_MOB_HEIGHTS` come from the vanilla collision boxes in the Mojang samples. The rabbit value (1.0) is taken as written there.
