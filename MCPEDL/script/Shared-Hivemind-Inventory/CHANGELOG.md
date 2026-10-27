# Changelog — Team Inventory

---

## [1.0.14] - 2026-10-27

### Fixed
- **Death Drops:** The shared inventory is no longer duplicated on death when the world's keep-inventory setting is off.
- **First Setup:** Items from every online player are combined into the shared inventory instead of only the first player's.
- **Join Sync:** Players are checked after syncing and retried if their inventory did not update.
- **Saving:** Players are warned when the shared inventory is too large to save.
- **Hotbar Selection:** Simultaneous hotbar changes no longer fight each other.
- **Error Messages:** Internal error warnings are limited so they no longer flood chat.

### Improved
- **Performance:** Inventory comparison skips detailed checks when item type or amount already differ.
- **Compatibility:** Updated to the current stable game scripting version.

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
