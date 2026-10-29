# Changelog — Team Inventory

---

## [1.0.19] - 2026-10-29

### Improved & Balanced

- **Maintenance release**: Repackaged the pack; no gameplay changes were recorded.

## [1.0.14] - 2026-10-27

### Added
- **AllensCreations Controller**: The host or an operator receives a Controller item. Using it opens a menu with Start and How to play. Starting uses it up in Survival and keeps it in Creative.
- **Ending the Game**: The function end_game ends sharing and divides the shared items between players. The function give_controller gives a new Controller.
- **Team Start**: Sharing now begins when the host chooses Start, and everyone's items are combined at that moment.

### Improved & Balanced
- **Simultaneous Changes**: Changes made by several players at the same moment are combined instead of dropping a spare copy of the stack.
- **Faster Syncing**: Inventories are checked every tick and only changed slots are updated.
- **Hotbar Selection**: Every player now keeps their own selected hotbar slot.
- **Creative and Spectator**: Players in these modes no longer take part in the shared inventory.
- **Restarts**: Items keep their full details after a restart when a teammate still holds the same item.

### Fixed
- **Death Drops**: The shared inventory is no longer duplicated when several players die together.
- **First Setup**: Items from every online player are combined instead of only the first player's.
- **Join Sync**: A player's inventory is checked after syncing and retried if it did not update.
- **Saving**: Players are warned when the shared inventory is too large to save, and an outdated saved copy is no longer kept.
- **Error Messages**: Internal error warnings are limited so they no longer flood chat.

---

## [1.0.12] - 2026-10-18

### Fixed
- **Join Notification:** The inventory-sync message is shown more reliably when players join.

---

## [1.0.11] - 2026-10-18

### Improved
- **In-Game Title:** The in-game add-on title now shows the correct release version.

---

## [1.0.10] - 2026-10-18

### Fixed
- **Join Notification:** Improved delivery of the inventory-sync message when players join.

---

## [1.0.9] - 2026-10-18

### Added
- **Private Syncing Message:** Players receive a short shared-inventory syncing message when they join, without repeating it on death respawn.

---

## [1.0.7] - 2026-10-18

### Improved
- **Team Inventory Name:** Updated the in-game name to Team Inventory.

---

## [1.0.6] - 2026-10-18

### Added
- **Persistent Shared Inventory:** Shared inventory state is retained when the world is restarted.
- **Equipment Sharing:** Armor, offhand items, and the selected hotbar slot are included in the shared inventory.
- **Conflict Feedback:** Players receive brief feedback when simultaneous slot changes conflict.

### Improved & Balanced
- **World Settings:** The add-on leaves the world's inventory-on-death setting unchanged.
- **Clearer Status:** Removed the always-visible status display and custom command controls.
