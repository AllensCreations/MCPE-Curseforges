# Changelog — Waypoint Helper

## [1.1.10] - 2026-11-14

### Improved & Balanced
- **Rename And Move Removed**: The Rename and Move buttons are gone from the main menu. Name a slot when you save it, and save into the same slot again to change its name.
- **Empty Name**: Leaving the name empty when you save now always shows the coordinates, even on a slot that had a name.
- **Menu Fade-In**: Menus fade in again with a quick 0.12 second fade, much faster than the old animation.
- **Countdown Number**: The seconds in the teleport countdown are now bold and white so they stand out from the rest of the message.

### Added
- **Move Slot**: A new Move button on the main menu changes where a waypoint sits in your list. Pick the slot, then pick where it goes, and a filled slot swaps places with it.
- **Name On Save**: After you pick a slot, Save now asks you to name it. Leave the name empty to show the coordinates, or to keep the slot's current name.

<details>
<summary><b>1.1.x</b> (4 releases)</summary>

### [1.1.6] - 2026-11-14

#### Improved & Balanced
- **Dimension Colors In Menus**: Saved slots and the Last Death button now show their text in green for the Overworld, red for the Nether and yellow for The End.

### [1.1.5] - 2026-11-13

#### Added
- **Last Death**: Your death location is now saved automatically and shown as the first button in Load.
- **Remove Extra Slots**: Delete now removes empty extra slots from the end of the list. The first 10 slots always stay.
- **Delete Slot**: A new Delete button on the main menu clears a saved slot after you confirm.
- **Cancel On Move Or Damage**: Moving or taking damage during the countdown cancels the teleport.
- **Teleport Cooldown**: There is a 10 second wait after each teleport before you can teleport again.
- **Arrival Effect**: A portal particle effect plays where you arrive.
- **Fall Protection**: You get 5 seconds of slow falling after you arrive.

#### Fixed
- **Cooldown After Reload**: The teleport wait now carries over when the world reloads or you rejoin.

#### Improved & Balanced
- **Menu Colors**: Menu buttons and text now use the default color. Colors only appear in the title bar and on action bar messages.
- **Action Bar Messages**: Rename, delete and spawn point messages now show on the action bar instead of in chat.

### [1.1.3] - 2026-11-13

#### Fixed
- **Add-on Tag**: The Behavior Pack is now marked as an add-on, matching the Resource Pack, so both packs are listed together as one add-on.
- **Mid-Air Landing**: Loading a waypoint whose spot is now in the air no longer drops you from a height.

#### Added
- **Solid Ground Landing**: After a teleport, the Waypoint Helper checks the spot you arrive at. If it is now empty air you land on the ground below, and if it is inside blocks you are moved up to open space.
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
