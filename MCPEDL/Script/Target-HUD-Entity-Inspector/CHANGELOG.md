# Changelog — Target HUD Entity Inspector

---

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
