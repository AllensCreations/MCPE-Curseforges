# Team Inventory: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/controller.js` | 186 | (no header comment) |
| `scripts/hard_mode.js` | 99 | (no header comment) |
| `scripts/main.js` | 821 | (no header comment) |

## Imports

- `@minecraft/server` (in `controller.js`, `hard_mode.js`, `main.js`)
- `@minecraft/server-ui` (in `controller.js`, `main.js`)
- `./controller.js` (in `main.js`)
- `./hard_mode.js` (in `main.js`)

## Events

- `system.afterEvents.scriptEventReceive`
- `world.afterEvents.entityDie`
- `world.afterEvents.itemUse`
- `world.afterEvents.playerInventoryItemChange`
- `world.afterEvents.playerSpawn`
- `world.afterEvents.worldLoad`
- `world.beforeEvents.playerLeave`
- script events (`scriptEventReceive`) are handled

## Custom ids

- `allenscreations:end` (`controller.js`)
- `allenscreations:hard_health` (`main.js`)
- `allenscreations:hard_hunger` (`main.js`)
- `allenscreations:hard_mode` (`main.js`)
- `allenscreations:hivemind_v106` (`main.js`)
- `allenscreations:layout` (`main.js`)
- `allenscreations:team_clear` (`main.js`)
- `allenscreations:team_keep` (`main.js`)
- `allenscreations:team_members` (`main.js`)
- `allenscreations:team_names` (`main.js`)
- `allenscreations:team_share_` (`main.js`)
- `aln:shared_hivemind_inventory_controller` (`controller.js`)
- plus 7 vanilla `minecraft:` id(s)

## Features found

- ActionFormData
- delayed task (system.runTimeout)
- dynamic properties (saved data)
- repeating timer (system.runInterval)
- runCommand

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
