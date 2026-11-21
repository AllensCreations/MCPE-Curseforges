# Changelog — ALN:LootSpawner (Arcane Relic Duplicator)

---

## [1.0.1] - 2026-11-22 - Bug Fixes: Block Definition and Render Method

### Fixed
- **Block definition parse error**: Removed the invalid "minecraft:" namespace prefix from menu_category group; corrected to "itemGroup.name.decorative".
- **Recipe cascade fix**: The recipe result error was caused by the block failing to register; fixing the block definition resolves it automatically.
- **Glass render method conflict**: Changed the glass material instance from "blend" to "alpha_test" so it no longer conflicts with the opaque wildcard instance.
- **blocks.json registry warning**: Removed the redundant custom block entry from the RP blocks.json; texture routing for custom-geometry blocks uses material_instances and terrain_texture.json only.

## [1.0.0] - 2026-11-21 - First Release

### Added
- **Loot Spawner block**: Players can place the ornate 1x1 Beacon-style display block in survival.
- **Rarity classification engine**: Items are automatically sorted into Common, Uncommon, Rare, or Epic tiers with cycle times of 8, 20, 60, and 240 seconds.
- **Item attunement**: Players interact with an empty block while holding an item to consume one unit as the template relic.
- **Duplication loop**: The block produces one copy of the template item on each completed cycle.
- **Container output**: Duplicates insert automatically into a chest, barrel, or hopper directly beneath the block.
- **Inspection UI**: Players open a form showing item name, rarity tier with color coding, progress percentage, and time until the next duplicate.
- **Template retrieval**: Players retrieve the original item from the inspection UI, resetting the block.
- **Container protection**: Filled shulker boxes and bundles are blocked from attunement to prevent rarity timer bypasses.
- **Survival crafting recipe**: Glass Panes, Obsidian, and Gold Ingots craft the block at a crafting table.
- **Light emission**: The placed block emits light level 10 from its core.
