# Changelog — Tethered: Breaker and Builder

## [1.12.1] - 2026-11-15 - Performance and Stability

### Added
- **Waiting for partner**: If your partner leaves or has not chosen a role yet, the screen says you are waiting and the leash timers pause.
- **Role menu protection**: Players are protected for five seconds while the role menu is open.

### Improved & Balanced
- **Smoother gameplay**: The leash, restrictions and on-screen display do far less work, which cuts lag, especially on phones and busy worlds.
- **Lighter beam**: The leash beam is drawn less often with fewer particles, and is hidden when partners are very close.
- **Steadier on-screen display**: The leash distance is shown in half-meter steps and only refreshes when it changes.
- **No cost between games**: The pack does no leash work until a challenge is started and stops when it ends.

### Fixed
- **Restriction messages**: Messages explaining blocked actions now appear right away, even before both roles are chosen.
- **Controller after respawn**: The host or an operator gets the Controller back after respawning when no challenge is running.

<details>
<summary><b>1.12.x</b> (1 release)</summary>

### [1.12.0] - 2026-10-29

#### Improved & Balanced
- **Maintenance release**: Repackaged the pack; no gameplay changes were recorded.

</details>

<details>
<summary><b>1.7.x</b> (1 release)</summary>

### [1.7.0] - 2026-10-27

#### Added
- **Controller**: The host or an operator starts the challenge from the ALNStudios Controller. Roles and the leash are active only while the challenge is running.
- **Win condition**: Defeating the Ender Dragon ends the challenge.
- **Recall**: Partners who stay more than 64 blocks apart, or in different dimensions, are brought together.

#### Improved & Balanced
- **Role choice**: Each role can be held by one player. Players without a role cannot build, mine or fight, and are asked again until they choose.
- **Breaker limits**: Spawn eggs, boats, minecarts, armor stands, item frames, paintings, end crystals and bone meal are now blocked along with buckets and fire. Anything placed anyway is removed and returned.
- **Builder limits**: Builders can no longer hurt anything with bows, tridents or thrown items, or set off TNT.
- **Gentler leash**: The pull is weaker and stays horizontal. Strain damage starts after 3 seconds and never takes you below one heart. Creative and spectator players are not pulled.

#### Fixed
- **Pack failed to work**: The pack stopped working after the role menu in current versions of Minecraft. The leash, restrictions and respawn support now work.
- **Role cheating**: Closing the role menu no longer removes restrictions, and roles cannot be changed with the tag command.
- **Lag from distant partners**: Very distant partners no longer cause lag from beam particles.
- **Joining**: Joining the world no longer teleports you to your partner.
- **Restriction messages**: Messages explaining blocked actions now stay on screen.
- **Description**: Removed the claim that the Builder has exclusive crafting.

</details>
