# Changelog — ALN:LootSpawner (Arcane Relic Duplicator)

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
