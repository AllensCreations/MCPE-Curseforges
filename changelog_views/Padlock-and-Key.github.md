# Changelog — Padlock & Key

## [1.0.7] - 2026-11-16 - Piston Safety and Iron Door Feel

### Added
- **Piston Safety**: A Piston cannot be placed aimed at a locked block, and a block cannot be locked while a Piston is aimed at it. If a locked block still gets moved, for example in a Slime Block machine, its lock moves with it and the block stays locked.
- **Lock Cleanup**: Locks left behind by a block that no longer exists are removed automatically, so a new block placed there never inherits an old lock.

### Improved & Balanced
- **Iron Door Feel**: Locked doors, trapdoors and fence gates cannot be opened by hand, like an Iron Door. If one still opens, it snaps shut again. Redstone can still open them.
- **Protected Door Floor**: The block under a locked door can no longer be broken or blown up until the door is unlocked.

### Fixed
- **Pistons Unlocked Blocks**: Pushing or pulling a locked block with a Piston no longer leaves it unlocked.
- **Copper Chest Pairs**: A Copper Chest next to a locked Copper Chest now counts as part of the same lock.

<details>
<summary><b>1.0.x</b> (8 releases)</summary>

### [1.0.7] - 2026-11-15 - Piston Safety and Iron Door Feel

#### Added
- **Piston Safety**: A Piston cannot be placed aimed at a locked block, and a block cannot be locked while a Piston is aimed at it. If a locked block still gets moved, for example in a Slime Block machine, its lock moves with it and the block stays locked.
- **Lock Cleanup**: Locks left behind by a block that no longer exists are removed automatically, so a new block placed there never inherits an old lock.

#### Improved & Balanced
- **Iron Door Feel**: Locked doors, trapdoors and fence gates cannot be opened by hand, like an Iron Door. If one still opens, it snaps shut again. Redstone can still open them.
- **Protected Door Floor**: The block under a locked door can no longer be broken or blown up until the door is unlocked.

#### Fixed
- **Pistons Unlocked Blocks**: Pushing or pulling a locked block with a Piston no longer leaves it unlocked.
- **Copper Chest Pairs**: A Copper Chest next to a locked Copper Chest now counts as part of the same lock.

### [1.0.4.2] - 2026-11-11

#### Improved & Balanced
- **Immovable Locks**: Pistons can no longer push or pull a locked block or the block under a locked container. Locked blocks stay where they are.

### [1.0.4.1] - 2026-11-11

#### Added
- **Hopper Minecart Guard**: A Hopper Minecart that ends up under a locked container is destroyed, so it can no longer pull items from it.

#### Fixed
- **Pistons Keep Locks**: Locked blocks pushed or pulled by a Piston now keep their lock instead of becoming public.

### [1.0.4] - 2026-11-10

#### Added
- **More Lockable Storage**: Every Chest type, including Copper Chests, plus Crafters and Decorated Pots can now be locked.

#### Improved & Balanced
- **Locked Doors Stay Shut**: Locked doors, trapdoors and fence gates no longer open when right-clicked, even with the matching Key. Sneak and right-click with the Key to unlock them.

#### Fixed
- **Floor Check**: Locking no longer asks for a solid block when another block already sits under the container. Open air, liquids, Hoppers and rails under it still stop the lock.

### [1.0.3] - 2026-11-10

#### Added
- **Locked Floor**: The block directly under a locked container can no longer be broken or blown up until the lock is removed.
- **Solid Floor Needed**: A container can only be locked when a solid block sits under it, so hoppers and hopper minecart rails cannot be placed there.

### [1.0.2] - 2026-11-10

#### Added
- **Blast Protection**: Explosions no longer destroy locked blocks. Everything around them can still be damaged.

### [1.0.1] - 2026-11-10

#### Added
- **Glowing Key**: Keys you receive from locking or copying now have an enchanted glow.
- **Padlock Return**: Unlocking a block with Sneak + Key disperses that Key and returns the Padlock with the same name to your inventory.
- **Hopper Guard**: Hoppers cannot be placed directly under a locked block, and a block cannot be locked while a Hopper sits under it.

#### Improved & Balanced
- **Subtext Messages**: Lock, unlock, denied and copy messages now show above your hotbar instead of in chat.
- **Break With Key**: A locked block can now be broken while you hold its matching Key. The lock is removed, the Key disperses, and the Padlock returns. Without the Key, the block still cannot be broken.

### [1.0.0] - 2026-11-10

#### Added
- **Padlock**: Craft it with 1 Iron Ingot and 1 Amethyst Shard, rename it on an anvil, then use it on a chest, door, or other supported block to lock it with that name as the password.
- **Key**: Locking a block gives you 1 Key with the same name. Hold the Key in either hand to open the locked block.
- **Permanent unlock**: Sneak and right-click a locked block with the correct Key to remove the lock.
- **Break protection**: Locked blocks cannot be broken by anyone until they are unlocked.
- **Key copies**: Hold a Key in your main hand and an Iron Nugget in your offhand, then use the Key to make one extra Key with the same name.

</details>
