# ALN:XRayVisor (Tactical Ore-Scanner Headgear) by ALNStudios: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/main.js` | 10 | (no header comment) |
| `scripts/visor_scanner.js` | 175 | (no header comment) |
| `scripts/visor_toggle.js` | 134 | (no header comment) |

## Imports

- `@minecraft/server` (in `main.js`, `visor_scanner.js`, `visor_toggle.js`)
- `./visor_scanner.js` (in `main.js`)
- `./visor_toggle.js` (in `main.js`, `visor_scanner.js`)

## Events

- `world.afterEvents.itemUse`
- `world.afterEvents.worldLoad`

## Custom ids

- `aln:ore_common` (`visor_scanner.js`)
- `aln:ore_diamond` (`visor_scanner.js`)
- `aln:ore_gold` (`visor_scanner.js`)
- `aln:ore_iron` (`visor_scanner.js`)
- `aln:ore_redstone` (`visor_scanner.js`)
- `aln:stone_haze` (`visor_scanner.js`)
- `aln:xray_visor` (`visor_scanner.js`, `visor_toggle.js`)
- plus 12 vanilla `minecraft:` id(s)

## Features found

- dynamic properties (saved data)
- repeating timer (system.runInterval)

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
