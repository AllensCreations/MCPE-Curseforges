# Changelog — ALN ChestLog

---

## [v4] - 2026-11-22 - Shapeless Recipe Fix

### Fixed

- **Shapeless Recipes**: The shapeless crafting recipes now use the unlock format shown in the game's own recipe documentation, so they load without errors.

## [3.0.0] - 2026-11-20 - Menu Icons Fix

### Added
- **Menu icons**: The Chest button, Deposit All and every chest in your list now show the ChestLog icon.

### Improved & Balanced
- **Readable text**: All gray text in the menus and item description is now white, yellow or aqua so it stands out from the background.
- **Simpler registration**: Chests are no longer labeled with a sign. The name you type shows in your Chest list.

### Fixed
- **Missing icons**: Menu buttons no longer show purple and black squares.

## [2.0.0] - 2026-11-20 - Wireless Storage Upgrade

### Added
- **Unregister option**: Sneak and use the ChestLog on a registered chest and switch on Unregister to remove it. Waiting items are delivered or dropped.
- **Category sorting**: Chests now sort tools, armor, food, then everything else, alphabetically within each group.
- **Durability kept**: Items sent to an unloaded chest keep their durability as well as names, lore and enchantments.

### Improved & Balanced
- **Shared buffer**: Waiting items are stored per chest for the whole world and delivered as soon as the chunk loads, even while the owner is offline.
- **Busy screen retry**: The menu waits and reopens if another screen was open when you used the item.
- **Clearer messages**: Deposit All now says when nothing matched or when a chest could not buffer items.
- **Minimum version**: Requires Minecraft Bedrock 1.26.60 or newer.

### Fixed
- **Broken chests**: A registered chest that is broken is unregistered and its waiting items drop where it stood.
- **Double chests**: Breaking one half of a registered double chest keeps the other half registered.
- **Menu overlap**: The menu no longer opens on top of a chest screen.
- **Failed saves**: If a save fails, items stay in your inventory instead of being lost.
- **Shared chests**: Only the player who registered a chest can rename or unregister it.

## [1.0.0] - 2026-11-20 - First Release

### Added
- **ChestLog item**: Craft it from a Book, an Ender Pearl and Redstone.
- **Chest registration**: Sneak and use the item on a chest, trapped chest or barrel to name and register it.
- **Remote menu**: Deposit everything with one button or choose exact amounts per item for a single chest.
- **Unloaded chunk buffer**: Items for unloaded chests are held and delivered when the chunk loads.
