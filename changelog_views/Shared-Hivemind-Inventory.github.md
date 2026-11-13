# Changelog — Team Inventory

## [1.22.0] - 2026-11-13

### Added
- **End Game Confirmation**: Choosing End Game in the Controller menu now asks for confirmation first, so a stray tap no longer ends the game.
- **Personal Layout**: The host or an operator can switch the Controller's Layout to Personal before starting. The team still shares the same items, but each player arranges their own main inventory and hotbar.
- **Shared Ender Chest**: Every player's Ender Chest now holds the same items. Items from all Ender Chests are combined when the game starts, and the Ender Chest is not dropped when a player dies.
- **Hard Mode**: The host or an operator can switch the Controller's Mode to Hard before starting. Health and hunger are then shared by the whole team, and when one player dies, everyone dies.
- **ALNStudios Controller**: The host or an operator receives a Controller item. Using it opens a menu with Start and How to play. Starting uses it up in Survival and keeps it in Creative.
- **Ending the Game**: The function end_game ends sharing and divides the shared items between players. The function give_controller gives a new Controller.
- **Team Start**: Sharing now begins when the host chooses Start, and everyone's items are combined at that moment.

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

### Fixed
- **Lost Items at End**: When the game ended in Personal layout and a player had no room, extra items could disappear. They now drop on the ground instead.
- **Death Drops**: The shared inventory is no longer duplicated when several players die together.
- **First Setup**: Items from every online player are combined instead of only the first player's.
- **Join Sync**: A player's inventory is checked after syncing and retried if it did not update.
- **Saving**: Players are warned when the shared inventory is too large to save, and an outdated saved copy is no longer kept.
- **Error Messages**: Internal error warnings are limited so they no longer flood chat.

### Improved

<details>
<summary><b>1.0.x</b> (1 release)</summary>

### [1.0.0] - 2026-11-04

#### v1.0.x (v1.0.23)
- **End Game Button**: The Controller menu now has an End Game button. The host or an operator can end sharing without using the function, and the shared items are divided between players the same way.

</details>
