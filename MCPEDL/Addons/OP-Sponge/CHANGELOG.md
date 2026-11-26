# Changelog — OP Sponge

---

## [v8] - 2026-11-26 - Letter S Flicker Fix

### Fixed

- **Letter S**: The S layer now sits a little further off the sponge surface, so it no longer flickers.

## [v7] - 2026-11-26 - Power Levels And Water Recheck

### Added

- **Power Levels**: Three subpacks for the OP Sponge. Normal OP absorbs up to 256 water blocks, Extremely OP up to 1,024, and Unlimited OP has no block limit. Unlimited OP is the default. Choose one in the pack settings.

### Fixed

- **Sponges**: After draining, every sponge now re-checks the cleared cells up to 3 times and removes water that flowed back in.

## [v6] - 2026-11-25 - Letter S And Waterlogged Blocks

### Changed

- **Textures**: Back to the vanilla sponge textures. The OP Sponge and the Water-Filled OP Sponge now show a letter S on every side.
- **Sponges**: Every sponge now also drains water inside waterlogged blocks, such as stairs and slabs.

### Removed

- The v5 gold and blue sponge textures.

## [v5] - 2026-11-25 - Sponge Fix And New Textures

### Fixed

- **OP Sponge**: Water is now removed while the sponge scans, so you see it draining right away instead of waiting for the whole scan to finish. Big oceans now use much less memory.

### Added

- **Textures**: New 64x64 pixel textures for the dry and the water-filled sponge (gold with a diamond sparkle, and a wet blue version). All sponge tiers share them.

## [v4] - 2026-11-24 - Unlimited OP Sponge

### Changed

- **OP Sponge**: It now absorbs all the connected water around it instead of stopping at 256 water blocks and 16 blocks of reach. Water in chunks that are not loaded is not reached.

## [v3] - 2026-11-22 - Shapeless Recipe Fix

### Fixed

- **Shapeless Recipes**: The shapeless crafting recipes now use the unlock format shown in the game's own recipe documentation, so they load without errors.

## [v2] - 2026-11-11

### Added
- **Super Sponge I to X**: Ten sponge levels. Super Sponge I absorbs up to 512 water blocks within 18 blocks, and each level adds 256 blocks and 2 blocks of reach, up to 2,816 blocks within 36 blocks at level X.
- **Extreme Sponge I**: A sponge that keeps absorbing connected water until none is left, up to 100,000 water blocks in one use.
- **Sponge Books**: Super Sponge I to X Books and an Extreme Sponge I Book. Craft one with an OP Sponge to get the matching sponge. Two books of the same level combine into one level higher, and two Super Sponge X Books make an Extreme Sponge I Book.
- **Glowing Sponges**: Super Sponges, Extreme Sponges, their filled versions, and the books glow like enchanted items. Placed Super and Extreme Sponges send out sparkles when they absorb water.
- **Book Loot and Trades**: Sponge books can appear in ten kinds of structure chests, and Librarian villagers sell them for Emeralds and a Book.

## [1.0.0] - 2026-11-11

### Added
- **OP Sponge**: A sponge that absorbs up to 256 water blocks within 16 blocks when placed, then turns into a Water-Filled OP Sponge.
- **Water-Filled OP Sponge**: A block that shows the sponge has been used. Smelt it in a furnace to get a dry OP Sponge back.
- **Recipe**: Craft an OP Sponge from a Sponge and Prismarine Crystals.
