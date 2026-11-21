# Grimoire Relics V2: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/main.js` | 711 | (no header comment) |

## Imports

- `@minecraft/server` (in `main.js`)

## Events

- `world.afterEvents.entityHurt`
- `world.afterEvents.playerLeave`
- `world.afterEvents.playerSpawn`
- `world.afterEvents.weatherChange`

## Custom ids

- `custom:tome_abyss` (`main.js`)
- `custom:tome_alchemist` (`main.js`)
- `custom:tome_delver` (`main.js`)
- `custom:tome_dragon` (`main.js`)
- `custom:tome_druid` (`main.js`)
- `custom:tome_frost` (`main.js`)
- `custom:tome_golem` (`main.js`)
- `custom:tome_hydra` (`main.js`)
- `custom:tome_lich` (`main.js`)
- `custom:tome_lunar` (`main.js`)
- `custom:tome_mirror` (`main.js`)
- `custom:tome_phoenix` (`main.js`)
- `custom:tome_scholar` (`main.js`)
- `custom:tome_seraph` (`main.js`)
- `custom:tome_solar` (`main.js`)
- `custom:tome_storm` (`main.js`)
- `custom:tome_titan` (`main.js`)
- `custom:tome_vampire` (`main.js`)
- `custom:tome_void` (`main.js`)
- `custom:tome_zephyr` (`main.js`)
- plus 40 vanilla `minecraft:` id(s)

## Features found

- delayed task (system.runTimeout)
- repeating timer (system.runInterval)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
