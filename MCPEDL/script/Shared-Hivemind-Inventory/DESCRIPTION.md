# Team Inventory (v1.0.14) — Shared Multiplayer Inventory

**By AllensCreations**

Share inventory progress with everyone in the same world. Team Inventory synchronizes players' main inventory, armor, offhand items, and selected hotbar slot so the group can manage one shared set of supplies.

## Overview

The add-on keeps the team's inventory state synchronized as players join and play. It attempts to preserve supported item details, including names, lore, durability, and enchantments when the game exposes that information.

## Key Features

### Shared Inventory
- **What Happens:** The team's main inventory, armor, offhand, and selected hotbar slot are shared among online players.

### Joining Players
- **What Happens:** Players who join a world that already has a shared inventory receive the team inventory. Their own items are replaced, so store anything personal before joining.
- **First Setup:** When the add-on starts with no saved team inventory, every online player's items are combined into it and extra items are dropped at their feet.

### Conflict Recovery
- **What Happens:** When players make conflicting inventory changes, the add-on attempts to preserve affected items as world drops and provides brief feedback.

### Death Handling
- **What Happens:** The shared inventory is dropped once on death and then cleared for the team.
- **Keep Inventory On:** The add-on drops the shared items itself.
- **Keep Inventory Off:** The game's own death drop is used, so items are not duplicated.

### World Settings
- **Important:** The add-on does not force the world's keep-inventory setting. The result of death drops can therefore depend on the world's existing setting.

## How to Use

1. Import the pack and enable it in the world's Behavior Packs settings.
2. Have players join the same world; the shared inventory is synchronized for the group.
3. Coordinate item use with teammates, since inventory changes affect everyone.

## Compatibility and Limitations

- Minecraft Bedrock Edition. Check the current package listing for the supported game version.
- Synchronization happens periodically, so changes may take a short moment to appear.
- Items keep every detail while the world is running. After the world is restarted, only names, lore, durability and enchantments are restored. Shulker box and bundle contents, potion types, dyed colors, banner patterns and maps are not.
- If the shared inventory becomes too large to save, players are warned and the saved copy stops updating until it is smaller.
- Every player's selected hotbar slot is shared; if several players change it at the same moment, the first change wins.
- Exact preservation of every item component is not guaranteed; supported item details depend on what Minecraft makes available.

## Creator and Permissions

- [CurseForge Profile](https://www.curseforge.com/members/allenscreations/projects)
- [MCPEDL Profile](https://mcpedl.com/user/allenscreations/)

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: You may feature this pack in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.

---

## Search & Discovery Keywords

Minecraft Bedrock shared inventory, Team Inventory add-on, multiplayer shared items, shared hotbar Minecraft, shared armor and offhand, Minecraft PE multiplayer tool, team survival inventory, MCPEDL, CurseForge Bedrock, AllensCreations.

