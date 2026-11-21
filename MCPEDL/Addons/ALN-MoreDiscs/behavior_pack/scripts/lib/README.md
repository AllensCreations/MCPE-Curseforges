# ALN MoreDiscs: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Extracted from the script files; nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/disc_jukebox.js` | 210 | (no header comment) |
| `scripts/main.js` | 4 | (no header comment) |

## Imports

- `@minecraft/server` (in `disc_jukebox.js`)
- `./disc_jukebox.js` (in `main.js`)

## Events

- `system.afterEvents.scriptEventReceive`
- `world.afterEvents.playerBreakBlock`
- `world.beforeEvents.playerInteractWithBlock`
- script events (`scriptEventReceive`) are handled

## Custom ids

- `aln:disc_query` (`disc_jukebox.js`)
- `aln:disc_started` (`disc_jukebox.js`)
- `aln:disc_stopped` (`disc_jukebox.js`)
- `aln:music_disc_crystal_caverns` (`disc_jukebox.js`)
- `aln:music_disc_deepslate_echoes` (`disc_jukebox.js`)
- `aln:music_disc_ember_lantern` (`disc_jukebox.js`)
- `aln:music_disc_golden_hour` (`disc_jukebox.js`)
- `aln:music_disc_midnight_drive` (`disc_jukebox.js`)
- `aln:music_disc_neon_horizon` (`disc_jukebox.js`)
- `aln:music_disc_pixel_parade` (`disc_jukebox.js`)
- `aln:music_disc_quiet_tides` (`disc_jukebox.js`)
- `aln:music_disc_starlight_express` (`disc_jukebox.js`)
- `aln:music_disc_sunlit_meadow` (`disc_jukebox.js`)
- `aln_morediscs:active` (`disc_jukebox.js`)
- plus 3 vanilla `minecraft:` id(s)

## Features found

- delayed task (system.runTimeout)
- dynamic properties (saved data)
- repeating timer (system.runInterval)
- runCommand

## Notes (AI review)

Known limits, design decisions and things to check on the next update go here. Not filled in yet.
