# Changelog — ALN:MobStacker

## [1.0.2] - 2026-11-16 - Persistent Stacks

### Added
- **Rare Drops**: A Sneak Kill now rolls the rare drops of Rabbits (Rabbit's Foot), Zombies (Iron Ingot, Carrot or Potato), Zombified Piglins (Gold Ingot) and Drowned (Copper Ingot) at their vanilla chances, raised by Looting.

### Improved & Balanced
- **Persistent Stacks**: Merged stacks are now spawned to stay in the world, so they should not despawn when you walk away.
- **Batched Merging**: Merging is now done in small batches and skips dimensions with no players, so large farms should cause less stutter.

### Fixed
- **Guardian Drops**: A Sneak Kill on a stack of Guardians now includes Raw Fish and Prismarine Crystals.

<details>
<summary><b>1.0.x</b> (2 releases)</summary>

### [1.0.1] - 2026-11-16 - Gear Safe Stacking

#### Added
- **Cooked Meat Drops**: A Sneak Kill on a burning stack of Cows, Pigs, Sheep, Chickens, Rabbits or Mooshrooms now drops cooked meat.

#### Improved & Balanced
- **Gear Safe Stacking**: Mobs wearing armor or holding items are no longer merged, so their gear is never lost. Skeletons, Strays and Boggeds holding only their bow still stack.

#### Fixed
- **Sheep Mutton Drops**: A Sneak Kill on a stack of Sheep now drops Raw Mutton.

### [1.0.0] - 2026-11-16 - First Release

#### Added
- **Mob Merging**: Identical farm animals and grinder mobs within 4 blocks merge into one mob with a gold count label and no stack size limit.
- **One-by-One Unpeeling**: Killing a stacked mob removes one from the stack and keeps the rest in place.
- **Sneak Kill**: Sneaking during a kill clears the whole stack with drops and experience scaled by Looting.

</details>
