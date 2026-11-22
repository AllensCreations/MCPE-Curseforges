# scripts/lib

scripts/lib/ holds no .js files yet. Everything lives in scripts/main.js.

## Files

- scripts/main.js: registers all Soul Lantern behavior. Depends on @minecraft/server and @minecraft/server-ui.
- scripts/lib/README.md: this file.

## What main.js does

- Before-event on player interaction with an entity: a sneaking player holding aln:soul_lantern seals the target mob. The mob is saved with a world structure (entities only), its id and display facts are stored on the item as dynamic properties, and the item becomes aln:soul_lantern_filled.
- Before-event on player interaction with a block: aln:soul_lantern_filled places the saved structure on top of the clicked block, renames the mob if a lantern name was set, deletes the structure, and returns an aln:soul_lantern.
- After-event on item use: aln:soul_lantern_filled opens the Spirit menu (details, Project Spectral Ally, Rename Captured Mob). aln:soul_lantern shows a hint.
- Repeating timer every 2 ticks: ends spectral allies after 400 ticks, orbits them around the owner, spawns the particle trail, and damages one nearby monster every 15 ticks.
- World load: removes leftover entities tagged aln_spirit.

## Ids

- Items: aln:soul_lantern, aln:soul_lantern_filled.
- Recipes: aln:soul_lantern_soil, aln:soul_lantern_sand.
- Dynamic properties on the filled item: aln_sid, aln_type, aln_name, aln_hp, aln_max_hp, aln_baby, aln_details, aln_rename.
- Entity: aln:spirit, tag aln_spirit. Structure ids: aln:soul_<random>.

## Known limits

- Bosses (Ender Dragon, Wither, Warden, Elder Guardian), players, armor stands, NPCs and agents cannot be sealed.
- The Spectral Ally is a light-blue, slightly transparent spirit entity that never attacks players. It does not copy the captured mob's model; its name shows the species.
- Villager profession is kept by the saved structure but is not shown in the menu.
- Cooldowns and active allies reset when the world reloads.
- Not tested in game.
