# Changelog — Padlock & Key

## [1.0.4.1] - 2026-11-11

### Added
- **Hopper Minecart Guard**: A Hopper Minecart that ends up under a locked container is destroyed, so it can no longer pull items from it.

### Fixed
- **Pistons Keep Locks**: Locked blocks pushed or pulled by a Piston now keep their lock instead of becoming public.

<details>
<summary><b>1.0.x</b> (5 releases)</summary>

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
