# Combat Helper: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/lib/bowaim.js` | 166 | (no header comment) |
| `scripts/lib/combat.js` | 140 | (no header comment) |
| `scripts/lib/extras.js` | 166 | (no header comment) |
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

Known limits and things to check. Nothing here was run in game.

- `lib/info.js` `PACK_VERSION` must be bumped in every update. It shows in the menu title and About screen.
- `lib/combat.js` works on `world.beforeEvents.entityHurt` and `event.damage`. It is not confirmed whether armor is already applied to that number, which matters for Keep Gear, Immortal and the totem toggles.
- `lib/gear.js` (Keep Gear On Death) keeps items in memory only. They are lost if the world closes before the player respawns.
- The aim circle is `resource_pack/ui/hud_screen.json`, shown by a title `aln_z<zoom>` (zoom 50 to 300, step 10). `CIRCLE_HEIGHT` in `lib/bowaim.js` must equal the circle size in that file (20% at zoom 100). `lib/extras.js` resends the title every 30 minutes because the title stay time is 72000 ticks. Any other title shown to the player clears the circle.
- The starter item is given only when the item `allenscreations:aln_gift_on` exists, which only the `gift` subpack defines. Not confirmed in game.
- Bow Aimbot does not model arrow drag, so long shots may land short. All arrows of a crossbow multishot aim at the same target. Edit `NEUTRAL` and `IGNORED` in `lib/bowaim.js` to change which mobs count as neutral or are never targeted.
- Aura Mode has no line of sight check, so it can hit through walls.
- `LAYOUT` in `lib/menu.js` must list every id in `FEATURES` (`lib/store.js`). Every id in `TUNING` (`lib/tuning.js`) except `screenFov` must appear in `LAYOUT`.
