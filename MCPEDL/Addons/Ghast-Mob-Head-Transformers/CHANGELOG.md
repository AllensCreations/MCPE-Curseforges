# Changelog — Ghast Mob Head Transformers

---

## [1.16.1] - 2026-11-13

**What's new in v1.16.1:** Packed with the v1.16.1 update. Includes: Head Drops, Abilities and Fixes.

### Fixed

- **Dragon Head in subpacks**: The Dragon variant was missing from the Natural Spawn and Manual Only subpacks, so the Dragon Head transformation could not apply there. All subpacks now include it.
- **Health mismatch**: The main file gave the default Ghast 40 HP while subpacks gave 10. Health is now defined per variant and identical across subpacks.
- **Creeper description**: The attack is no longer described as high-explosive. It uses the standard fireball; the Creeper's danger is now its death explosion.

### Added

- **Head drops on death**: Transformed Ghasts can drop their head when killed by a player (33%, Dragon 50%, Looting increases the chance) along with Ghast Tears and Gunpowder.
- **Per-head abilities**: Wither aura (Wither within 8 blocks), Zombie summons, Creeper death explosion, and Piglin calming with a Gold Ingot (30s).
- **Hard Mode subpack**: Doubled health and more frequent heads.

### Improved & Balanced

- **Per-variant health**: Classic 10, Skeleton 20, Wither 30, Zombie 25, Player 25, Creeper 20, Piglin 15, Dragon 100.
- **Fire rates**: Skeleton fires every 1.2s (was 1.0s); Piglin every 1.0s (was 0.8s).
- **XP**: Dragon kills give 50 XP; Wither Ghasts give 10 XP.
- **Compatibility notes**: The description now states what is and is not verified and warns about other Ghast add-ons.

### Needs in-game testing

- **New abilities**: They use `minecraft:on_death`, `minecraft:mob_effect`, `minecraft:spawn_entity` and `minecraft:timer`, which have not been run in Minecraft.

## [1.16.0] - 2026-10-29

### Improved & Balanced

- **Changelog started**: Version history is recorded from this release onward.
