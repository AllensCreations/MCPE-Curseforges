# Changelog — Universal Clutch

## [1.5.4] - 2026-11-17

### Improved & Balanced
- **Closer to Vanilla**: Clutch items now trigger at most about 7 blocks above the ground, closer to normal play.
- **Boat Reach**: The boat now appears up to 7 blocks above the ground.
- **Earlier Placement**: Clutch items are now placed from higher above the ground, giving you more time to land on them.
- **Boat Timing**: The boat now appears higher above the ground and seats you later, in time with your fall.

### Fixed
- **Late Placement**: Fixed falls that ended before the clutch item was placed.
- **Landing Inside Blocks**: Fixed landing inside a placed block instead of on top of it.

<details>
<summary><b>1.5.x</b> (3 releases)</summary>

### [1.5.2] - 2026-11-14

#### Added
- **On/Off Command**: Each player can turn Universal Clutch off or on with /scriptevent clutch:off and /scriptevent clutch:on. The choice is saved per player.

#### Improved & Balanced
- **Natural Falling**: The camera is never moved or forced, and your falling speed is no longer reset.
- **Extreme Mode**: Now works without looking down.

### [1.5.1] - 2026-11-14

#### Improved & Balanced
- **Script Pack**: Universal Clutch is now released as a Script pack (.mcpack).
- **Default Mode**: Full Mode is now the default subpack on every device.
- **Safer Landings**: No item is used when you would land in water, lava, or on a soft block.
- **Totem Fail-Safe**: The Totem of Undying is only equipped when the fall would be fatal, and keeps its name and data.
- **Creative and Spectator**: Clutching no longer triggers in Creative or Spectator mode.

#### Fixed
- **Twisting Vines**: Twisting Vines are now recognized as a clutch item.
- **Waterlogging**: Removed the waterlogging claim; water is always placed in the air block above the ground.
- **Fall Height**: Fall height no longer carries over after swimming, gliding, or leaving the game.
- **Water Recovery**: Fixed an error when a player left within a moment of landing.
- **Minimum Version**: The Behavior Pack now requires Minecraft 1.21.20 or newer.

### [1.5.0] - 2026-10-29

#### Improved & Balanced
- **Changelog started**: Version history is recorded from this release onward.

</details>
