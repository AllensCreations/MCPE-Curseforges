# scripts/lib

scripts/lib/ holds no .js files yet. Everything lives in scripts/main.js.

## Files

- scripts/main.js: registers all Soul Lantern behavior. Depends on @minecraft/server.
- scripts/lib/README.md: this file.

## What main.js does

- Before-event on player interaction with an entity: a sneaking player holding aln:soul_lantern seals the target mob. The mob is saved with a world structure (entities only), its id and display facts are stored on the item as dynamic properties, and the item becomes aln:soul_lantern_<kind> (or aln:soul_lantern_filled for mobs without an icon).
- Before-event on player interaction with a block: a sneaking player holding a filled lantern places the saved structure on top of the clicked block, deletes the structure, and returns an aln:soul_lantern.
- After-event on item use: a sneaking player releases the mob in front of them in open air. A player who is not sneaking calls the Spectral Ally, or recalls it when one is already out. Each lantern (by saved structure id) has one spirit and a 10-second recharge that starts when the spirit leaves.
- Repeating timer every 4 ticks: ends spirits after 400 ticks, teleports one back to its owner when it strays, spawns the particle trail, regrows a shrunken Kamikaze Spirit, and detonates it next to a monster.
- World load: removes leftover entities tagged aln_spirit.

## Ids

- Items: aln:soul_lantern, aln:soul_lantern_filled, aln:soul_lantern_<kind> for creeper, skeleton, zombie, spider, pig, cow, sheep, chicken, wolf, villager, iron_golem, enderman, blaze, snow_golem.
- Recipes: aln:soul_lantern_soil, aln:soul_lantern_sand.
- Dynamic properties on a filled item: aln_sid, aln_type, aln_name, aln_hp, aln_max_hp, aln_baby, aln_details.
- Entity: aln:spirit, tag aln_spirit, property aln:size, events aln:mode_<mode> and aln:fig_<n>. Structure ids: aln:soul_<random>.

## Known limits

- Bosses (Ender Dragon, Wither, Warden, Elder Guardian), players, armor stands, NPCs and agents cannot be sealed.
- The Spectral Ally floats, never attacks players, and uses an attack mode (melee, fast, heavy, kamikaze, archer, snow) from the captured mob type.
- Villager profession is kept by the saved structure but is not shown anywhere.
- Cooldowns and active allies reset when the world reloads.
- The behavior manifest still lists @minecraft/server-ui, which the script no longer uses.
- Not tested in game.
