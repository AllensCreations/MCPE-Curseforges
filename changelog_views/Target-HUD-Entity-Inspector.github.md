# Changelog — Target HUD Entity Inspector

## [1.1.1] - 2026-11-14

### Added
- **Held Item**: The item in the target's main hand now appears beside its armor.
- **Armor on Mobs**: Mobs that wear armor now show their armor points, not only players.
- **Pet Owners**: Pets tamed by other players now show as Tamed with the owner's name when that player is online.

### Improved & Balanced
- **Smooth Health Bar**: The bar now has 20 segments and turns from green to yellow to red as health drops.
- **Adaptive Refresh**: The display updates every tick in a fight, every 2 ticks on a target and every 5 ticks while idle.
- **Steadier Display**: An unchanged line is no longer sent over and over, which removes needless flicker.
- **Absorption Marker**: A gold plus sign appears beside the health numbers when the target has Absorption.
- **More Mobs Recognized**: More vanilla mobs have a type, and unknown mobs use their game family before falling back to Neutral.
- **Any Tamed Animal**: Tamed animals other than Wolves and Cats now show as Tamed.

### Fixed
- **Hidden Targets**: Invisible mobs, invisible players and players in Spectator mode no longer show their health.

<details>
<summary><b>1.1.x</b> (1 release)</summary>

### [1.1.0] - 2026-11-11

#### Added
- **Distance Readout**: The display now ends with how far away the target is, such as 5m.
- **Armor Points**: Players you look at now show their armor points beside their health.
- **Tamed Pets**: Your own tamed Wolves and Cats now show as Tamed instead of Neutral or Passive.

#### Improved & Balanced
- **Lower Minimum Version**: The Behavior Pack now asks for Minecraft 1.26.30 instead of 1.26.50.

</details>

<details>
<summary><b>1.0.x</b> (2 releases)</summary>

### [1.0.1] - 2026-11-11

#### Added
- **Health Bar**: A ten-segment bar such as ||||||.... now sits beside the health numbers, so health reads at a glance during a fight.
- **Aggressive Status**: Neutral mobs you hurt now show as Aggressive for one minute after your last hit, then return to Neutral.

#### Improved & Balanced
- **Cleaner Display**: The Target label and the status effects list are gone, leaving name, health bar, health numbers and type.
- **Colored Types**: Each type has its own color: Player, Hostile, Aggressive, Passive and Neutral.
- **Faster Refresh**: The display updates every 2 ticks instead of every 3.

#### Fixed
- **Lingering Display**: The display is cleared at once when you look away from a mob, instead of fading out slowly.

### [1.0.0] - 2026-11-11

#### Added
- **Entity Inspector**: Look at a mob or player within 16 blocks to see its name, health, type and status effects on the Action Bar.

</details>
