# ALN MoreDiscs: script notes (scripts/lib)

For the AI review. Keep this file in step with the scripts: update it whenever a file in `scripts/` changes.
Nothing here was run in game.

## Files

| File | Lines | Purpose |
| :-- | --: | :-- |
| `scripts/disc_jukebox.js` | 268 | Own Jukebox handling for the 30 discs: insert, play, eject, end, break, headphones events |
| `scripts/main.js` | 4 | Entry point, calls `initDiscJukebox()` |

## Imports

- `@minecraft/server` (in `disc_jukebox.js`, namespace import)
- `./disc_jukebox.js` (in `main.js`)

## Events

- `world.beforeEvents.playerInteractWithBlock`: a disc used on a Jukebox is cancelled and handled by the script; any use on a Jukebox that holds one of the discs ejects it
- `world.afterEvents.playerBreakBlock`: breaking a Jukebox that holds a disc ends the track and drops the disc
- `system.afterEvents.scriptEventReceive`: `aln:disc_query` resends `aln:disc_started` for every track that is playing
- `system.runInterval`: every 40 ticks ends finished tracks, drops the disc if the Jukebox is gone

## Custom ids

- Script events: `aln:disc_started`, `aln:disc_stopped`, `aln:disc_query`
- Dynamic property: `aln_morediscs:active` (stored discs, state version 2)
- Item ids: the 30 `aln:music_disc_<name>` ids listed in the `DISCS` table of `disc_jukebox.js`
- Sound events: `record.<name>` for each disc, defined in `resource_pack/sounds/sound_definitions.json`

## Features found

- cancel an interaction (beforeEvents) and finish the work in `system.run`
- dimension.playSound, `stopsound` through runCommand, spawnItem
- dynamic properties (saved data)
- repeating timer (system.runInterval)

## Notes (AI review)

- The discs have no `minecraft:record` component: its `sound_event` only accepts vanilla names (13, cat, blocks, chirp, far, mall, mellohi, stal, strad, ward, 11, wait, pigstep, otherside, 5, relic) unless the Beta APIs experiment is on (checked in the docs on 2026-11-22). The game log showed all 30 items failing on it. The script therefore plays the tracks itself, so no experiment is needed.
- Differences from a vanilla record: no spinning disc, no comparator signal, a Jukebox that already holds a vanilla record has to be emptied first, and a track does not resume after the world reloads (the disc stays inside).
- Not verified in the docs: `ContainerSlot.setItem`/`amount`, the `minecraft:equippable` and `minecraft:inventory` component ids, `minecraft:record_player` `getRecord()`, the `volume` and `pitch` fields of the sound options, and the `stopsound` command with a custom sound. Each use is wrapped so a failure does nothing instead of breaking the pack.
- Note particles were removed in v7: the vanilla note particle asked for color variables (`.r`, `.g`, `.b`) that the game log reported as missing, and its definition could not be checked in the docs.
- Not tested in game.
