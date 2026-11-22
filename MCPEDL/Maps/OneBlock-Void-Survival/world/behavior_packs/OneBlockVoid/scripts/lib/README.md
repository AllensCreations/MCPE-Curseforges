# OneBlock Void Survival: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/main.js` | 153 | Entry point: wires every game event and timer to the handlers in lib/ |
| `scripts/lib/admin.js` | 444 | Admin build tools: auto-break runner, island photo studio menus, inspector tool |
| `scripts/lib/config.js` | 85 | Shared constants, switches, state maps and the tick counter |
| `scripts/lib/handlers.js` | 481 | Event handlers (block break, spawn, dimension change, script events) and the 1-second maintenance loop |
| `scripts/lib/helpers.js` | 256 | Shared helpers: dimension keys, phase state, loot and chest spawning |
| `scripts/lib/island-blocks.js` | 529 | Island block pools, rock/ore/subsoil picking, safe block placement and vegetation |
| `scripts/lib/island-builder.js` | 512 | Builds a full themed island (buildThemedIsland), micro caves and satellite islets |
| `scripts/lib/island-core.js` | 420 | Island core mining, completion (floor, chest, message) and the island health check |
| `scripts/lib/island-layout.js` | 105 | Island positions, built-checks and chunk footprint checks |
| `scripts/lib/island-spawn.js` | 291 | Island materializing, random island spawns, discovery registration and arrival loop |
| `scripts/lib/island-structures.js` | 1362 | Per-theme island structures, safe mob spawns and structure chests |
| `scripts/lib/island-themes.js` | 1496 | 42+ Unique Themed Secret Void Islands for OneBlock Survival (theme data and spawn order) |
| `scripts/lib/island-trees.js` | 250 | Island tree placement rules and natural tree building |
| `scripts/lib/mode.js` | 1 | World mode (creative or survival), written by build_worlds.py |
| `scripts/lib/oneblock.js` | 279 | Main OneBlock renewal, automated block destruction handling and scoreboard cleanup |
| `scripts/lib/phase-events.js` | 357 | Phase transitions, mini bosses, lucky rush, void surge, jackpot and block counting |
| `scripts/lib/phases.js` | 449 | 15 Comprehensive Overworld Phases including all classic biomes & modern 1.20 - 1.26+ updates |
| `scripts/lib/rarities.js` | 93 | 20 Rarity Tiers and their exact percentage distribution (totaling 100%) |
| `scripts/lib/shifter.js` | 251 | Dimension Shifter merchant: visits, random trades and trade menu |

`scripts/main.js` is the only file directly in `scripts/`. Everything else lives in `scripts/lib/` and is imported with relative `./lib/...` paths from `main.js` and `./...` paths between lib files. `build_worlds.py` rewrites `scripts/lib/mode.js` for each world build.

## Imports

- `@minecraft/server` (in `lib/admin.js`, `lib/handlers.js`, `lib/helpers.js`, `lib/island-builder.js`, `lib/island-core.js`, `lib/island-spawn.js`, `lib/island-structures.js`, `lib/oneblock.js`, `lib/phase-events.js`, `lib/shifter.js`, `main.js`)
- `@minecraft/server-ui` (in `lib/admin.js`, `lib/shifter.js`)
- `./lib/*.js` (in `main.js`)
- `./*.js` siblings (between the files in `lib/`)

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

- `ob:admin` (`lib/handlers.js`)
- `ob:all` (`lib/handlers.js`)
- `ob:island` (`lib/handlers.js`)
- `ob:menu` (`lib/handlers.js`)
- `ob:run` (`lib/handlers.js`)
- `ob:summon_all` (`lib/handlers.js`)
- `test:run` (`lib/handlers.js`)
- plus 483 vanilla `minecraft:` id(s)

## Features found

- ActionFormData
- delayed task (system.runTimeout)
- dynamic properties (saved data)
- repeating timer (system.runInterval)
- runCommand

## Notes (AI review)

Island completion state: `island_ob_completed_<id>` = every core block mined, `island_ob_done_<id>` = floor, chest and message finished (set last, retried until it works), `island_ob_final_<id>` = kept for the Islands completed counter. Islands finished by an older version without `island_ob_done_` are checked once on load and repaired when the core still holds a mineable block or bedrock.

Background loops (`oneBlockRenewTick`, `islandHealthTick`, nether and end particles) skip dimensions without players. Island core positions are cached in memory and finished islands are only re-checked every 5 seconds, so `island_ob_x/y/z_<id>` must not be edited by hand while the script runs. The `getPlayerDims` helper in `lib/helpers.js` is memoized for 5 ticks.
