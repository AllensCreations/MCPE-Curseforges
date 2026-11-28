# Changelog — ALN Wireless Hopper

---

## [2.0.0] - 2026-11-28 - Wireless Remote Rework

### Added
- **Linked Wireless Remote**: Right-click any Hopper with the Wireless Remote to register it. The Remote gets a new texture and shows which Hopper it controls.
- **Hopper Registration**: Right-click the registered Hopper again with its Linked Remote to turn it back into a blank Remote.

### Improved & Balanced
- **Any Hopper Sends**: A normal Hopper is now the sender. Items it takes in are delivered to every linked Chest, Barrel or Hopper about four times per second.
- **Wireless Hopper Block Removed**: The custom block and its recipe are gone. Wireless Hopper blocks already placed in a world disappear.
- **Link Rules**: A sending Hopper cannot be a receiver, and a Hopper cannot be its own receiver.

## [1.0.1] - 2026-11-28 - Block Loading Fix

### Fixed
- **Wireless Hopper Not Appearing**: The Wireless Hopper now loads correctly in the world, and its crafting recipe works again.

## [1.0.0] - 2026-11-28 - Initial Release

### Added
- **Wireless Hopper**: A hopper block with a radio antenna and glowing rings. Items sent into it are delivered to every linked container.
- **Wireless Remote**: A handheld tool that links a Wireless Hopper to Chests, Barrels and Hoppers with right-clicks, no menu needed.
- **Even Distribution**: Items are split evenly across all linked containers. Full or unloaded containers are skipped, and anything left over goes back to you.
- **Dropped Item Pickup**: Items dropped onto a Wireless Hopper are beamed to the linked containers.
- **Crafting Recipes**: Both the Wireless Hopper and the Wireless Remote are craftable from the start.
