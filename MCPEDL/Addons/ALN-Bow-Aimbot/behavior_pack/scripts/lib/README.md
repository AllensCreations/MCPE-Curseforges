# ALN: Bow Aimbot: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Nothing here was run in game. The code was taken from the Combat Helper add-on (v21) and cut down to the Bow Aimbot parts.

## Files

| File | Purpose |
| :-- | :-- |
| `scripts/main.js` | Opens the menu when the item is used and starts the aimbot and the circle loop. |
| `scripts/lib/info.js` | Pack name, version and ids. `PACK_VERSION` must be bumped in every update. |
| `scripts/lib/bowaim.js` | Picks the target inside the aim circle and steers arrows toward it. Exports `pickTarget` and `initBowAim`. |
| `scripts/lib/hud.js` | Target picture, `Locked on` text and the on-screen aim circle. Exports `initHud`. |
| `scripts/lib/menu.js` | Main menu, Bow Aimbot Settings, Friends, Tuning and About. Exports `openMain` and `tell`. |
| `scripts/lib/store.js` | The two toggles (Bow Aimbot, Target Highlight), saved per player. |
| `scripts/lib/tuning.js` | Slider and choice values, saved per player. |
| `scripts/lib/friends.js` | Friends list, saved per player. |
| `scripts/lib/saved.js` | Cached read and write of per player saved data. |

## Events

- `world.afterEvents.entitySpawn`
- `world.afterEvents.itemUse`
- `world.afterEvents.itemStartUse`
- `world.afterEvents.itemStopUse`
- `world.afterEvents.playerLeave`

## Custom ids

- `allenscreations:aln_bow_aimbot` (item, `lib/info.js`)
- `allenscreations:aln_bow_target` (particle, `lib/hud.js`)

## Notes (AI review)

- The aim circle is `resource_pack/ui/hud_screen.json`, shown by a title `alnb_z<zoom>` (zoom 50 to 300, step 10). `CIRCLE_HEIGHT` in `lib/bowaim.js` must equal the circle size in that file (20% at zoom 100). `lib/hud.js` resends the title every 30 minutes. Any other title shown to the player clears the circle.
- Bow zoom while drawing (`bowZoom`) is how many percent the game's field of view shrinks at full draw, 0 by default. The real amount was not confirmed from the docs. Draw time is assumed to be 20 ticks.
- Bow Aimbot aims the arrow once, then calls `projectile.shoot` again every 2 ticks for up to 4 seconds. Arrow drag and gravity numbers were not confirmed, and re-shooting in flight was not confirmed in game. All arrows of a crossbow multishot aim at the same target. Edit `NEUTRAL` and `IGNORED` in `lib/bowaim.js` to change which mobs count as neutral or are never targeted.
- Module versions were reused from the Combat Helper add-on. `@minecraft/server-ui` 2.3.0 was confirmed as the latest in the docs; `@minecraft/server` 2.11.0 was not re-checked.
- `LAYOUT` in `lib/menu.js` must list every id in `FEATURES` (`lib/store.js`) and every id in `TUNING` (`lib/tuning.js`) except `screenFov`.
