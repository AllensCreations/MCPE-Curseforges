# Script notes: ALN HyperPipes

- `main.js`: registers the pipe block component (place and interact), the place-block fallback, loads saved pipes and starts the network loop. Depends on every file in `lib/`.
- `lib/constants.js`: ids, faces, offsets, timing values, furnace slots, fuel list, helper checks. No dependencies.
- `lib/state.js`: in-memory pipe records with saving and loading through world dynamic properties; keeps the set of pipes that hold an item or are receivers. Depends on `constants.js`.
- `lib/network.js`: one repeating loop every 3 ticks. Receivers pull up to 4 items every 4th step, items hop one pipe per step, junctions rotate between three outputs, containers receive the items at the end of a line, furnaces get fuel and input in the right slots, and records of broken pipes are cleaned up. Depends on `constants.js` and `state.js`.
- `lib/filter.js`: stores the held item type on a Filter Pipe, shows or clears it. Depends on `state.js`, `constants.js` and `wrench.js`.
- `lib/wrench.js`: cycles the output face (Top, North, South, East, West, Down; reverse while sneaking) and plays the click sound, particle and action bar text. Depends on `constants.js`.

Ids used: `aln:pipe_standard`, `aln:pipe_receiver`, `aln:pipe_filter`, `aln:pipe_junction`, `aln:pipe_wrench`, block state `aln:out`, custom block component `aln:pipe`.

Known limits: items in transit keep their enchantments and names only while the world stays loaded; after a reload only the item type and amount return. Non-matching items wait in the pipe before a Filter Pipe. Several members used here are not verified against the documentation: Container.addItem, onPlace, playerPlaceBlock, Dimension.playSound, Dimension.spawnParticle, Dimension.spawnItem, getDynamicPropertyIds, named exports from lib files, and furnace inventory access.
