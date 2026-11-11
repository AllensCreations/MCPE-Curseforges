# Changelog — OneBlock Natural Market

## [1.0.1] - 2026-11-11

### Added
- **Chest-inspired market grid**: Action-form buttons are presented in a 3-row by 9-column inventory-style layout with item icons and compact supply labels.
- **Paged catalogue**: Large categories are split into pages that fit the 27-slot grid.

### Improved
- **Direct purchasing**: Tapping a supply slot purchases its configured bundle immediately; successful delivery, coin deduction, and regeneration-pool updates continue through the existing purchase handler.
- **Stable scripting baseline**: Keeps `@minecraft/server` 2.10.0 and `@minecraft/server-ui` 2.2.0 without beta modules or experimental toggles.

### Compatibility note
