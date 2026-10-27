# Team Inventory (v1.0.14) — Shared Multiplayer Inventory

**By AllensCreations**

One inventory for the whole team. Team Inventory combines every player's main inventory, armor and offhand items and keeps them identical for everyone until the game is ended.

## Overview

The host or an operator starts the shared inventory with the AllensCreations Controller. From that moment, anything one player picks up, uses or drops changes it for the whole team. The add-on keeps names, lore, durability and enchantments of items while the world is running.

## Key Features

### Shared Inventory
- **What Happens**: Main inventory, armor and offhand items are shared by every player who takes part.
- **Simultaneous Changes**: When two players change the same stack at once, both changes are combined instead of lost or duplicated.

### AllensCreations Controller
- **What Happens**: Only the host or an operator can hold and use the Controller. It offers Start and How to play.
- **Survival**: Start uses up the Controller.
- **Creative**: The Controller is kept.

### Team Deaths
- **What Happens**: The shared inventory drops once when a player dies and is then emptied for the team.
- **Keep Inventory**: The rule is switched on while sharing runs so nothing drops twice, and restored when sharing ends.

### Ending the Game
- **What Happens**: An operator uses the function end_game. The shared items are divided between players, the host keeps the armor, and everyone else is emptied so items are not duplicated.
- **Controller Replacement**: The host or an operator gets a new Controller when the game ends. The function give_controller also gives one.

### Joining Players
- **What Happens**: Players who join while sharing is running receive the team inventory. Their own items are replaced, so store anything personal before joining.

## How to Use

1. Import the pack and enable both the Behavior Pack and the Resource Pack in the world settings.
2. The host or an operator uses the Controller and chooses Start.
3. Play together and coordinate item use with teammates.
4. An operator runs the function end_game to finish.

## Compatibility

- Minecraft Bedrock Edition: 1.26.40 or newer. Older versions were not checked.
- Experimental features: No experiment requirement detected in the inspected files.
- Achievements: Unknown / needs confirmation.
- Verification: Source created, not tested in game.
- After the world is restarted, only names, lore, durability and enchantments of items are restored. Shulker box and bundle contents, potion types, dyed colors, banner patterns and maps may be lost.
- If the shared inventory becomes too large to save, players are warned and the saved copy is cleared until it is smaller.
- Players in Creative or Spectator mode are not part of the shared inventory.

## Creator and Permissions

- [CurseForge Profile](https://www.curseforge.com/members/allenscreations/projects)
- [MCPEDL Profile](https://mcpedl.com/user/allenscreations/)

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.

---

## Search & Discovery Keywords

Minecraft Bedrock add-on, Team Inventory Bedrock mod, shared inventory, multiplayer shared items, shared armor and offhand, team survival inventory, Minecraft PE multiplayer, MCPEDL add-on, CurseForge Bedrock, AllensCreations.
