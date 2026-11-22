# Changelog — ALN:LootSpawner (Arcane Relic Duplicator)

## [1.0.4] - 2026-11-23 - Fix Duplication Timer and Add Break Drops

### Added
- **Template drop on break**: Breaking a Loot Spawner now drops its template item, so the attuned relic is never lost.
- **Sparks and chime**: Gold sparks appear around the chamber and grow more frequent as the timer fills, with a burst and a chime each time a duplicate is produced.

### Fixed
- **Duplication timer**: The old timer loop searched a 64-block volume every tick through a call whose signature could not be verified. Spawners are now tracked in a saved list and checked once per second, and they keep counting after the world is reloaded.
- **Container output**: Duplicates now go into a chest, barrel, or hopper below through the container's own add-item routine, and pop out on top of the block when the container is full.
- **Description accuracy**: The block renders as solid tinted glass, so the description no longer promises see-through panels.

<details>
<summary><b>1.0.x</b> (4 releases)</summary>

### [1.0.3] - 2026-11-22 - Fix Black Rendering: Unify Render Method

#### Fixed
- **Block rendering as solid black**: The glass and core material instances carried render_method "alpha_test" with a texture using partial-alpha pixels; alpha_test only supports fully transparent or fully opaque pixels, so every partial-alpha pixel in the glass texture was discarded outright, leaving the chamber faces unrendered. All four material instances (frame, glass, core, *) now use render_method "opaque", which draws the texture's RGB color regardless of alpha. This trades true see-through glass for a solid tinted glass look, but renders correctly and reliably.

### [1.0.2] - 2026-11-22 - Bug Fixes: Render Method and Script Crash

#### Fixed
- **MaterialInstances render conflict**: All material instances now use "alpha_test" uniformly. Bedrock rejects any block where named instances mix opaque and alpha_test, causing a component error and warning on load.
- **Script crash in tick loop**: blockKey received block.location (a plain Vector3 with no dimension property) instead of the Block object. All four call sites now pass the Block directly so dimension.id resolves correctly.

### [1.0.1] - 2026-11-22 - Bug Fixes: Block Definition and Render Method

#### Fixed
- **Block definition parse error**: Removed the invalid "minecraft:" namespace prefix from menu_category group; corrected to "itemGroup.name.decorative".
- **Recipe cascade fix**: The recipe result error was caused by the block failing to register; fixing the block definition resolves it automatically.
- **Glass render method conflict**: Changed the glass material instance from "blend" to "alpha_test" so it no longer conflicts with the opaque wildcard instance.
- **blocks.json registry warning**: Removed the redundant custom block entry from the RP blocks.json; texture routing for custom-geometry blocks uses material_instances and terrain_texture.json only.

### [1.0.0] - 2026-11-21 - First Release

#### Added
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

</details>
