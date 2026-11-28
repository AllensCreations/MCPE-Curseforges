# Changelog — ALN:CamouflageDoors

---

## [v4] - 2026-11-28 - Anvil Screen

### Added
- **Anvil-style screen**: The Door Painter now opens a custom screen with Door, Bottom Block, Top Block and Result slots, each showing an item icon.

### Improved & Balanced
- **Item picker**: Choosing an item shows a scrolling list with icons, and Empty slot clears a slot.

## [v3] - 2026-11-28 - Painted Door Fix

### Fixed
- **Painted Door item**: Taking the result in the Door Painter no longer fails, and the painted door keeps its bottom and top blocks.

## [v2] - 2026-11-28 - Right-Click Fix

### Added
- **Chat diagnostics**: The add-on posts a start-up check result when you join and a chat message for each Door Painter and Painted Door step, so a failing step shows up in chat.

### Fixed
- **Door Painter menu**: Right-clicking the Door Painter now opens the paint menu.
- **Painted Door**: Right-clicking a placed Painted Door now opens and closes it.
- **Silent failures**: Menu, placing and opening errors now report the failing step instead of doing nothing.

## [1.0.0] - 2026-11-27 - Door Painter

### Added
- **Door Painter**: A craftable workstation with a custom 3D model that opens the paint menu on a normal right-click.
- **Anvil-Style Paint Menu**: Combine a door with a bottom block and a top block to get a Painted Door.
- **Painted Door**: A two-block-tall door that shows the chosen block textures on each half and opens and closes with a right-click.
