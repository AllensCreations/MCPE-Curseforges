# Expanded Basic Arsenal: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/lib/common.js` | 73 | (no header comment) |
| `scripts/main.js` | 3 | (no header comment) |
| `scripts/melee_weapons.js` | 202 | (no header comment) |
| `scripts/slingshot.js` | 121 | (no header comment) |

## Imports

- `@minecraft/server` (in `lib/common.js`, `melee_weapons.js`, `slingshot.js`)
- `./lib/common.js` (in `melee_weapons.js`, `slingshot.js`)
- `./melee_weapons.js` (in `main.js`)
- `./slingshot.js` (in `main.js`)

## Events

- `world.afterEvents.entityHitEntity`
- `world.afterEvents.itemReleaseUse`
- `world.afterEvents.itemStartUse`
- `world.afterEvents.itemUse`
- `world.afterEvents.playerLeave`
- `world.afterEvents.projectileHitBlock`
- `world.afterEvents.projectileHitEntity`

## Custom ids

- `aln:blowgun` (`melee_weapons.js`)
- `aln:blowgun_dart` (`melee_weapons.js`)
- `aln:copper_dagger` (`melee_weapons.js`)
- `aln:flint_spear` (`melee_weapons.js`)
- `aln:flint_spear_projectile` (`melee_weapons.js`)
- `aln:set_damage_4` (`slingshot.js`)
- `aln:set_damage_6` (`slingshot.js`)
- `aln:set_damage_8` (`slingshot.js`)
- `aln:slingshot` (`slingshot.js`)
- `aln:slingshot_pebble` (`slingshot.js`)
- `aln:wooden_club` (`melee_weapons.js`)
- plus 10 vanilla `minecraft:` id(s)

## Features found

- delayed task (system.runTimeout)
- repeating timer (system.runInterval)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
