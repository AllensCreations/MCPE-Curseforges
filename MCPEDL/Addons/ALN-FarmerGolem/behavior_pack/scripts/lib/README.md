# Scripts and lib

This folder holds no helper files yet. All logic lives in scripts/main.js.

## Files

- scripts/main.js: builds the Farmer Golem when a Carved Pumpkin is placed on a Hay Bale, then runs the golem loops (harvest, breeding, healing, movement, dismantling). Registers one block placement event, one script event and two repeating timers (every 10 ticks for decisions, every 2 ticks for movement). Depends on the server module only.

## Custom ids used

- Entity aln:farmer_golem (the one block tall dwarf worker holding a wrench; its home chest position is stored as a tag named aln_home:x,y,z).
- The Farmer Chest is a vanilla barrel, so tapping it opens the normal container screen and the lid opens and closes by itself.
- Block aln:farmer_chest and entity aln:farmer_chest_storage are kept only to convert Farmer Chests built in earlier versions. When the golem finds the old block at its home, it turns it into a barrel, moves the stored items into it and removes the old storage entity.

## Events

- World player block placement: starts the build when the placed block is a Carved Pumpkin on top of a Hay Bale.
- Script event aln:golem_status: prints the state of every Farmer Golem within 64 blocks to the player who ran it (position, home chest block, free chest slots, ripe crop in reach, last problem). Running it needs cheats, which disables achievements in that world.

## Known limits

- The golem moves in short teleport steps toward its goal and only walks through air and plant blocks, so walls and fences stop it.
- Breeding spawns a baby animal and consumes one item per pair; it does not use the vanilla love mode.
- A repeating problem in the golem logic shows a red action bar message near the golem and is written to the log, so it can be reported.
- Crop growth values, barrel block states, particle ids, sound ids and the container access were not checked in game.
