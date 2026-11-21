# ALN PortalDoors script notes

- `scripts/main.js`: the whole add-on logic in one file. Depends on `@minecraft/server` and `@minecraft/server-ui`.
- `scripts/lib/`: holds no `.js` files yet; this README is the only file here.

## What main.js does

- Registry: one dynamic property per door plus one index property. A door stores name, owner id, dimension, base position, facing and exit spot.
- `playerPlaceBlock` (after): registers a placed `aln:portal_door`, builds the upper half `aln:portal_door_top`, opens the naming form.
- `playerInteractWithBlock` (before): cancels the interaction and opens the destination menu one tick later.
- `playerBreakBlock` (before): cancels the break and runs owner-only pickup, which returns the item and removes the door from the registry.
- `runInterval`: every 4 ticks spawns converging glyph particles around doors within 24 blocks of a player; every 200 ticks drops registry entries whose base block is gone.
- Warp: teleports to the stored exit spot facing outward, plays sounds and particles, adds 2.5 seconds of Nausea level 1, sets a 2 second cooldown.

## Ids used

- Blocks: `aln:portal_door`, `aln:portal_door_top`.
- Recipes: `aln:portal_door_amethyst`, `aln:portal_door_book`.

## Known limits

- Both door halves use the vanilla full-block shape, so all four sides look the same.
- Items and blocks cannot be placed against a door unless the player holds the Portal Door item.
- Breaking is always intercepted; only the owner can pick a door up.
