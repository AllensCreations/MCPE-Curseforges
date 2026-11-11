# Changelog — Target HUD Entity Inspector

---

## [1.1.0] - 2026-11-11

**What's new in v1.1.0:** Packed with the v1.0.2 update.

### Added

- **Distance Readout**: The display now ends with how far away the target is, such as 5m.
- **Armor Points**: Players you look at now show their armor points beside their health.
- **Tamed Pets**: Your own tamed Wolves and Cats now show as Tamed instead of Neutral or Passive.

### Improved & Balanced

- **Lower Minimum Version**: The Behavior Pack now asks for Minecraft 1.26.30 instead of 1.26.50.

## [1.0.1] - 2026-11-11

### Added
- **Health Bar**: A ten-segment bar such as ||||||.... now sits beside the health numbers, so health reads at a glance during a fight.
- **Aggressive Status**: Neutral mobs you hurt now show as Aggressive for one minute after your last hit, then return to Neutral.

### Improved & Balanced
- **Cleaner Display**: The Target label and the status effects list are gone, leaving name, health bar, health numbers and type.
- **Colored Types**: Each type has its own color: Player, Hostile, Aggressive, Passive and Neutral.
- **Faster Refresh**: The display updates every 2 ticks instead of every 3.

### Fixed
- **Lingering Display**: The display is cleared at once when you look away from a mob, instead of fading out slowly.



## [1.0.0] - 2026-11-11

### Added
- **Entity Inspector**: Look at a mob or player within 16 blocks to see its name, health, type and status effects on the Action Bar.
