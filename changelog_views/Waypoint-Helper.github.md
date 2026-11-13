# Changelog — Waypoint Helper

## [1.1.2] - 2026-11-13 - Safe Teleport Landing

### Added
- **Solid Ground Landing**: After a teleport, the Waypoint Helper checks the spot you arrive at. If it is now empty air you land on the ground below, and if it is inside blocks you are moved up to open space.

### Fixed
- **Mid-Air Landing**: Loading a waypoint whose spot is now in the air no longer drops you from a height.

<details>
<summary><b>1.1.x</b> (2 releases)</summary>

### [1.1.1] - 2026-11-13 - Teleport Countdown And Sounds

#### Added
- **Teleport Countdown**: Loading a waypoint now counts down 3 seconds on the action bar before you teleport.
- **Teleport Sounds**: A click plays on each countdown second and a teleport sound plays when you arrive.

#### Improved & Balanced
- **Dimension Colors**: The save message is now green in the Overworld, red in the Nether and yellow in The End.
- **Action Bar Messages**: Save and teleport messages now show on the action bar instead of in chat.

### [1.1.0] - 2026-11-12

#### Added
- **Exit Button**: Every menu now starts with an Exit button that closes the Waypoint Helper. Menus opened from the main menu also have a Back button at the top.

#### Improved & Balanced
- **Instant Menu Switching**: Moving between Waypoint Helper menus no longer plays the slow open and close animation.

#### Fixed
- **Title Bar**: The orange pack name and version in the title bar now show correctly.
- **Button Look**: Buttons now have a flat dark fill with a thin raised edge instead of a blocky two-tone block.

</details>

<details>
<summary><b>1.0.x</b> (3 releases)</summary>

### [1.0.2] - 2026-11-12

#### Added
- **Cheatstick Menu Look**: All Waypoint Helper menus now use the Cheatstick panel, title bar and button textures with colored text. The pack is now a Complete Pack (.mcaddon) with a Resource Pack.

#### Fixed
- **Menu Compass**: The Waypoint Helper no longer gives you a Compass when you spawn. Use any Compass you already own to open the menu.

### [1.0.1] - 2026-11-12

#### Fixed
- **Menu Compass**: The Waypoint Helper Compass is now given only once, the first time a player joins the world. It is no longer given again on respawn.

### [1.0.0] - 2026-11-12

#### Added
- **Waypoint Menu**: Use a Compass to open a menu with Save Spawn Here, Save, Load, Rename and About.
- **Waypoint Slots**: Every player starts with 10 slots. Once all slots are filled, Save offers an Add Slot button that adds one more slot each time, with no upper limit.
- **Save and Load**: Save stores your position, facing and dimension in a slot. Load teleports you back to it.
- **Rename**: Give a slot a name. A named slot shows only its name and hides its coordinates. Leaving the name empty shows the coordinates again.
- **Save Spawn Here**: Sets your respawn point to the spot where you are standing.

</details>
