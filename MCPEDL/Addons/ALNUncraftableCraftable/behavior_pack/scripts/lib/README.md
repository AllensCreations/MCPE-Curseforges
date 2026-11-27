# Script Library Notes

Scripts for ALN:UncraftableCraftable. Source created, not tested in game.

- `../main.js`: registers the Fabrication Altar block component (`aln:fabrication_altar`) before the world starts and sets a ready flag in `world.afterEvents.worldLoad`. Opens the altar form on block interact. Depends on `lib/altar_form.js`. No tick loop is used.
- `recipe_registry.js`: exports `RECIPES` (five endgame recipes) and `getRecipe(id)`. Pure data, no dependencies.
- `validator.js`: exports `getContainer`, `evaluate(player, recipe)` and `craft(player, recipe)`. Counts ingredients in the player inventory, consumes them, adds the output, and restores the inventory snapshot when the output does not fit. Depends on `@minecraft/server`.
- `effects.js`: exports `celebrate(dimension, location)`. Spawns particle `aln:fabricate_burst` and plays sound event `aln.uncraftablecraftable.altar.chime`, each inside try/catch. No dependencies.
- `altar_form.js`: exports `openAltar(player, block)`. Recipe list form, ingredient detail form with Fabricate and Back, then calls `craft` and `celebrate`. Depends on `@minecraft/server-ui`, `recipe_registry.js`, `validator.js`, `effects.js`.

Custom ids used: items `aln:dragon_essence`, `aln:void_shard`, `aln:phantom_core`; block `aln:fabrication_altar`.

Known limits: named exports between `lib/` files, `worldLoad`, the block `onPlayerInteract` event shape, `ItemStack.clone`, `Container.size`, particle format and the sound event are not verified against documentation and not tested in game. Ingredients are matched by item type only, so enchanted or renamed items count as plain ones.
