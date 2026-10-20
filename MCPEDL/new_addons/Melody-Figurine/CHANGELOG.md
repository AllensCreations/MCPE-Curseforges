# Changelog — Melody Figurine

---

## [1.0.10] - 2026-10-21

### Added
- Four party modes: Party, Chill, Dance Battle, and Music Only.
- Sneak-interaction to cycle the mode used by the next activation.
- Different movement styles for hopping mobs, gentle-swaying animals, flying mobs, and robotic-looking hostile mobs.
- A more energetic final five seconds with an extra particle burst around the figurine.

### Improved
- Dance Battle uses faster turns and more frequent particles; Chill Mode softens movement and reduces visual effects.
- Nearby mobs can join while they enter the 20-block party radius.
- The original facing direction of surviving mobs is restored when the dance session ends.
- Rainbow screen-color effects use shorter fades to reduce obstruction. The available screen-fade effect does not support true transparency or an opacity slider.

### Retained
- The included soundtrack, placeable figurine, inventory icon, and placed-block texture.
- Party effects end after the configured song-length session (approximately 66 seconds).

## [1.0.9] - 2026-10-21

### Improved & Balanced
- Nearby mobs spin and hop more frequently, with more frequent musical particles during the song.
- Rainbow screen colors transition with gentle fades and no solid-color hold, helping keep the world visible between color changes.
- Added a small orbiting musical sparkle effect around the figurine while the song plays.

### Fixed
- Reworked the dance loop to add visible hopping and more reliable mob validity checks.
- Updated the stable Script API dependency and linked the Behavior Pack to its Resource Pack.
- Simplified the inventory icon reference and corrected the pack dependency direction so textures and custom audio can load together.
- Added clearer in-game feedback if the soundtrack cannot start.

## [1.0.8] - 2026-10-21

### Fixed
- Rebuilt the block texture asset and released the corrected package with the custom figurine model and inventory icon.

## [1.0.7] - 2026-10-21

### Fixed
- Replaced the cube placeholder with a small figurine model.
- Added a matching inventory icon and corrected the item icon definition.
- Removed the unsupported replacement-item setting that could interfere with placement.

## [1.0.6] - 2026-10-20

### Fixed
- Reliable Placement: Updated the figurine item so it can place its block correctly.
- Visible Texture: Added a texture for the item icon and placed block.
- Song Timing: Adjusted the dance effects to stop at approximately the end of the soundtrack.

## [1.0.5] - 2026-10-20

### Improved
- Included the soundtrack in the pack.

## [1.0.1] - 2026-10-20

### Added
- Musical Figurine: A placeable figurine that starts a song when interacted with.
- Mob Dance Effects: Nearby mobs spin and hop within a 20-block radius with colorful particle effects.

### Notes
- The initial release expected the song to be supplied separately.
- The initial dance session defaulted to 60 seconds.
