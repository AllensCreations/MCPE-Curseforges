# Changelog — ALN:MobStacker

---

## [v5] - 2026-11-24 - Calmer Towers

### Added
- **Tower Copy Protection**: Feeding, shearing, milking, naming or leashing the copies above a stack tower is now blocked, so they cannot be used to breed animals or farm wool.

### Improved & Balanced
- **Steadier Towers**: Tower copies now fall slowly and are only moved when they drift away from their spot, so they bob less and need fewer moves.

## [v4] - 2026-11-24 - Stack Towers

### Added
- **Stack Towers**: Farm animal stacks now show up to 3 mobs standing on top of each other, with the number label on the bottom mob. The mobs above are cosmetic copies that cannot be hurt.

## [v3] - 2026-11-20 - Faster Grinders

### Added
- **Grinder Batches**: A stack mob that dies to lava, fall damage, fire or anything else that is not a player now takes up to 5 stack mobs with it at once, dropping their normal items without experience or rare drops.

### Improved & Balanced
- **Idle Scanning**: Merging now checks less often after several quiet passes with nothing to merge, and checks normally again when a new mob appears.
- **Armor Drop Chance**: Looting now raises the chance that a Zombie or Husk stack drops armor in a Sneak Kill.

## [v2] - 2026-11-17 - Armor Drops and Smoother Loot

### Added
- **Armor Drops**: A Sneak Kill on Zombie and Husk stacks now has a small chance per extra mob to drop a piece of armor.

### Improved & Balanced
- **Smoother Loot**: Sneak Kill drops now appear over a few ticks instead of all at once, and a single kill spawns at most 256 item piles.
- **Baby Farm Stacks**: Baby farm animal stacks now keep their original mob, so its growth timer is no longer reset when the stack forms.

## [1.0.4] - 2026-11-17 - Separate Baby Stacks

### Improved & Balanced
- **Baby and Adult Stacks**: Babies and adults of every mob type stay in separate stacks again, and a killed stack mob is replaced by the same kind.
- **Zombie Variants**: Zombies, Husks, Drowned and Zombified Piglins each keep their own stack, and armored ones stay separate again.

### Fixed
- **Random Babies**: Adult stacks no longer turn into random baby mobs when a mob is killed.

## [1.0.3] - 2026-11-17 - Mixed Zombie Stacks

### Added
- **Random Spawn Stacks**: Zombie, Husk, Drowned and Zombified Piglin stacks now mix babies and adults, and each mob that replaces a killed one is a fresh random spawn that can be a baby or wear armor like a normal spawn.

### Improved & Balanced
- **Mixed Merging**: These four mobs now merge even when wearing armor or holding items, so their gear is not kept.
- **Sneak Kill Experience**: A Sneak Kill on these four mobs now counts about one baby in twenty for the baby experience bonus.

## [1.0.2] - 2026-11-16 - Persistent Stacks

### Added
- **Rare Drops**: A Sneak Kill now rolls the rare drops of Rabbits (Rabbit's Foot), Zombies (Iron Ingot, Carrot or Potato), Zombified Piglins (Gold Ingot) and Drowned (Copper Ingot) at their vanilla chances, raised by Looting.

### Improved & Balanced
- **Persistent Stacks**: Merged stacks are now spawned to stay in the world, so they should not despawn when you walk away.
- **Batched Merging**: Merging is now done in small batches and skips dimensions with no players, so large farms should cause less stutter.

### Fixed
- **Guardian Drops**: A Sneak Kill on a stack of Guardians now includes Raw Fish and Prismarine Crystals.

## [1.0.1] - 2026-11-16 - Gear Safe Stacking

### Added
- **Cooked Meat Drops**: A Sneak Kill on a burning stack of Cows, Pigs, Sheep, Chickens, Rabbits or Mooshrooms now drops cooked meat.

### Improved & Balanced
- **Gear Safe Stacking**: Mobs wearing armor or holding items are no longer merged, so their gear is never lost. Skeletons, Strays and Boggeds holding only their bow still stack.

### Fixed
- **Sheep Mutton Drops**: A Sneak Kill on a stack of Sheep now drops Raw Mutton.

## [1.0.0] - 2026-11-16 - First Release

### Added
- **Mob Merging**: Identical farm animals and grinder mobs within 4 blocks merge into one mob with a gold count label and no stack size limit.
- **One-by-One Unpeeling**: Killing a stacked mob removes one from the stack and keeps the rest in place.
- **Sneak Kill**: Sneaking during a kill clears the whole stack with drops and experience scaled by Looting.
