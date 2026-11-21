# OneBlock Void Survival: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/islands.js` | 4252 | 42+ Unique Themed Secret Void Islands for OneBlock Survival |
| `scripts/main.js` | 2868 | (no header comment) |
| `scripts/mode.js` | 2 | (no header comment) |
| `scripts/phases.js` | 450 | 15 Comprehensive Overworld Phases including all classic biomes & modern 1.20 - 1.26+ updates |
| `scripts/rarities.js` | 94 | 20 Rarity Tiers and their exact percentage distribution (totaling 100%) |

## Imports

- `@minecraft/server` (in `islands.js`, `main.js`)
- `@minecraft/server-ui` (in `main.js`)
- `./islands.js` (in `main.js`)
- `./mode.js` (in `main.js`)
- `./phases.js` (in `main.js`)
- `./rarities.js` (in `main.js`)

## Events

- `system.afterEvents.scriptEventReceive`
- `world.afterEvents.blockExplode`
- `world.afterEvents.buttonPush`
- `world.afterEvents.entityHurt`
- `world.afterEvents.entitySpawn`
- `world.afterEvents.playerBreakBlock`
- `world.afterEvents.playerDimensionChange`
- `world.afterEvents.playerSpawn`
- `world.beforeEvents.itemUse`
- `world.beforeEvents.itemUseOn`
- `world.beforeEvents.playerInteractWithEntity`
- script events (`scriptEventReceive`) are handled

## Custom ids

- `ob:admin` (`main.js`)
- `ob:all` (`main.js`)
- `ob:island` (`main.js`)
- `ob:menu` (`main.js`)
- `ob:run` (`main.js`)
- `ob:summon_all` (`main.js`)
- `test:run` (`main.js`)
- plus 483 vanilla `minecraft:` id(s)

## Features found

- ActionFormData
- delayed task (system.runTimeout)
- dynamic properties (saved data)
- repeating timer (system.runInterval)
- runCommand

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
