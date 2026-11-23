# Scripts and lib

This folder holds no helper files yet. All logic lives in scripts/main.js.

## Files

- scripts/main.js: builds the Farmer Golem when a Carved Pumpkin is placed on a Hay Bale, then runs the golem loops (harvest, breeding, healing, movement, dismantling). Registers one block placement event and two repeating timers (every 10 ticks for decisions, every 4 ticks for movement). Depends on the server module only.

## Custom ids used

- Block aln:farmer_chest (visual chest, drops a Hay Bale and a Carved Pumpkin when broken).
- Entity aln:farmer_chest_storage (invisible 27-slot container sitting on the chest block, slightly larger than the block so players hit it first, 40 health, rebuilt empty when it goes missing without having been hit).
- Entity aln:farmer_golem (the one block tall dwarf worker; its home chest position is stored as a tag named aln_home:x,y,z).

## Events

- World player block placement: starts the build when the placed block is a Carved Pumpkin on top of a Hay Bale.

## Known limits

- The golem moves in short teleport steps toward its goal and only walks through air and plant blocks, so walls and fences stop it.
- Breeding spawns a baby animal and consumes one item per pair; it does not use the vanilla love mode.
- Crop growth values, particle ids, sound ids and the container interaction were not checked in game.
