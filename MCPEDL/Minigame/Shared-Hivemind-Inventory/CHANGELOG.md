# Changelog — Team Inventory

---

## [1.22.6] - 2026-11-14

**What's new in v1.22.6:** Packed with 3 updates, from v1.22.4 through v1.22.6. Includes: Personal Layout Removal; Death Drops and Joining Fix; Personal Layout Throw Fix.

### Improved & Balanced

- **Personal Layout Removed**: The Personal layout and its Controller button are gone. Everyone now shares one identical inventory, which keeps the add-on lighter on busy teams.
- **Running Games**: A game that was running in Personal layout keeps its items and continues as a normal shared inventory.
- **Personal Layout Speed**: Personal layout checks inventories every 4 ticks instead of every tick.
- **Save Limit Warning**: The team is warned when the shared inventory is close to the save limit.

### Fixed

- **Death Drops**: The shared inventory now drops where a player dies, even when the death spot cannot be read, and Keep Inventory stays on while sharing.
- **Item Details**: In Personal layout, teammates now get exact copies of items, so dye colors, banner patterns and trims are kept.
- **Joining Players**: A player who joins while a game runs now adds their own items to the team instead of losing them.
- **Thrown Items**: In Personal layout, items one player throws away are now removed for the rest of the team, and a failed removal no longer brings the items back.

## [1.22.3] - 2026-11-13

**What's new in v1.22.3:** Packed with the v1.22.3 update. Includes: Controller Merge.

### Improved & Balanced

- **Single Controller**: Mode, Layout, Hard Health, Hard Hunger and the Team list are now in the Controller menu, so the separate Team Settings item is gone.



## [1.22.2] - 2026-11-13

**What's new in v1.22.2:** Packed with the v1.22.2 update. Includes: Death Drops Fix.

### Fixed

- **Death Drops**: The shared inventory now drops where a player dies and is then emptied for the team.





## [1.22.1] - 2026-11-13

**What's new in v1.22.1:** Packed with the v1.22.1 update. Includes: Offline Shares and Safer Ending.

### Added

- **End Game Button**: The Controller menu has an End Game button. The host or an operator can end sharing without using a command, and the shared items are divided between players the same way.
- **End Game Confirmation**: Choosing End Game now asks for confirmation first, so a stray tap no longer ends the game.
- **Offline Player Shares**: Players who are offline when the game ends receive their share of the items the next time they join.
- **Hard Mode Death Message**: When one player dies in Hard Mode, chat now says who died.

### Improved & Balanced

- **Start Message**: The chat message shown when sharing starts now lists the chosen Mode and Layout.
- **Locked Menu Buttons**: The Mode and Layout buttons are marked as locked while sharing is running.
- **Controller Name**: The Controller is now named ALNStudios Controller in game, matching its description.
- **Larger Saves**: A bigger shared inventory can now be saved before the too-large warning appears.
- **Lighter Syncing**: Item checks reuse earlier results instead of rebuilding them every tick.

### Fixed

- **Lost Items at End**: When the game ended in Personal layout and a player had no room, extra items could disappear. They now drop on the ground instead.
- **Waiting Clears**: Starting a new game no longer skips cleaning the items of players who were offline when the last game ended.







## [1.22.0] - 2026-11-13 - Personal Layout

**What's new in v1.22.0:** Packed with 12 updates, from v1.6.0 through v1.0.1. Includes: End Game Safety Fixes.

### Added

- **End Game Confirmation**: Choosing End Game in the Controller menu now asks for confirmation first, so a stray tap no longer ends the game.
- **Personal Layout**: The host or an operator can switch the Controller's Layout to Personal before starting. The team still shares the same items, but each player arranges their own main inventory and hotbar.
- **Shared Ender Chest**: Every player's Ender Chest now holds the same items. Items from all Ender Chests are combined when the game starts, and the Ender Chest is not dropped when a player dies.
- **Hard Mode**: The host or an operator can switch the Controller's Mode to Hard before starting. Health and hunger are then shared by the whole team, and when one player dies, everyone dies.
- **ALNStudios Controller**: The host or an operator receives a Controller item. Using it opens a menu with Start and How to play. Starting uses it up in Survival and keeps it in Creative.
- **Ending the Game**: An operator command ends sharing and divides the shared items between players. Another operator command gives a new Controller.
- **Team Start**: Sharing now begins when the host chooses Start, and everyone's items are combined at that moment.
- **Private Syncing Message**: Players receive a short shared-inventory syncing message when they join, without repeating it on death respawn.
- **Persistent Shared Inventory**: Shared inventory state is retained when the world is restarted.
- **Equipment Sharing**: Armor, offhand items, and the selected hotbar slot are included in the shared inventory.
- **Conflict Feedback**: Players receive brief feedback when simultaneous slot changes conflict.

### Improved & Balanced

- **Start Message**: The chat message shown when sharing starts now lists the chosen Mode and Layout.
- **Locked Menu Buttons**: The Mode and Layout buttons are marked as locked while sharing is running.
- **Controller Name**: The Controller is now named ALNStudios Controller in game, matching its description.
- **Controller Menu**: The menu now shows the current layout and has a Layout button.
- **Controller Menu**: The menu now shows the current mode and has a Mode button.
- **Ending the Game**: The host keeps the shared Ender Chest items and everyone else's Ender Chest is emptied.
- **Death Chat**: The chat message that announced a player's death and where the shared inventory dropped is gone. The shared inventory still drops once at the spot where the player died.
- **Maintenance release**: Repackaged the pack; no gameplay changes were recorded.
- **Simultaneous Changes**: Changes made by several players at the same moment are combined instead of dropping a spare copy of the stack.
- **Faster Syncing**: Inventories are checked every tick and only changed slots are updated.
- **Hotbar Selection**: Every player now keeps their own selected hotbar slot.
- **Creative and Spectator**: Players in these modes no longer take part in the shared inventory.
- **Restarts**: Items keep their full details after a restart when a teammate still holds the same item.
- **World Settings**: The add-on leaves the world's inventory-on-death setting unchanged.
- **Clearer Status**: Removed the always-visible status display and custom command controls.

### Fixed

- **Lost Items at End**: When the game ended in Personal layout and a player had no room, extra items could disappear. They now drop on the ground instead.
- **Death Drops**: The shared inventory is no longer duplicated when several players die together.
- **First Setup**: Items from every online player are combined instead of only the first player's.
- **Join Sync**: A player's inventory is checked after syncing and retried if it did not update.
- **Saving**: Players are warned when the shared inventory is too large to save, and an outdated saved copy is no longer kept.
- **Error Messages**: Internal error warnings are limited so they no longer flood chat.
- **Join Notification**: The inventory-sync message is shown more reliably when players join.
- **Join Notification**: Improved delivery of the inventory-sync message when players join.

### Improved & Balanced

- **In-Game Title**: The in-game add-on title now shows the correct release version.
- **Team Inventory Name**: Updated the in-game name to Team Inventory.









## [1.0.0] - 2026-11-04

**What's new in v1.1.0:** Packed with the v1.0.23 update.

### v1.0.x (v1.0.23)

#### Added
- **End Game Button**: The Controller menu now has an End Game button. The host or an operator can end sharing without using the function, and the shared items are divided between players the same way.
