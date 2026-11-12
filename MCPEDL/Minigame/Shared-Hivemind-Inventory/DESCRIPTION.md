# Team Inventory — Shared Multiplayer Inventory

**By ALNStudios**

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-Stable%20Release-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCPACK%20%7C%20.MCADDON%20%7C%20.MCWORLD-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

One inventory for the whole team. Team Inventory combines every player's main inventory, armor, offhand and Ender Chest items and keeps them identical for everyone until the game is ended.

## Overview

The host or an operator starts the shared inventory with the ALNStudios Controller. From that moment, anything one player picks up, uses or drops changes it for the whole team. The add-on keeps names, lore, durability and enchantments of items while the world is running. Team Inventory is a drop-in add-on: add it to any world and the Controller gives you the shared inventory, Hard Mode and Personal Layout without any extra setup.

## Key Features

### Shared Inventory
- **What Happens**: Main inventory, armor and offhand items are shared by every player who takes part.
- **Simultaneous Changes**: When two players change the same stack at once, both changes are combined instead of lost or duplicated.

### ALNStudios Controller
- **What Happens**: Only the host or an operator can hold and use the Controller. It offers Start, How to play, a Mode switch between Normal and Hard, a Layout switch between Shared and Personal, and an End Game button.
- **Survival**: Start uses up the Controller.
- **Creative**: The Controller is kept.

### Shared Ender Chest
- **What Happens**: Every player's Ender Chest holds the same items, so something stored by one player can be taken out by another.
- **Start**: Ender Chest items from every player are combined when the game starts.
- **Deaths**: The Ender Chest is not dropped when a player dies.

### Personal Layout
- **What Happens**: When the Layout is Personal, the team still shares the same items, but each player arranges their own main inventory and hotbar. New items go into the first free slot.
- **Armor, Offhand and Ender Chest**: These keep the same layout for everyone.
- **Moving Items**: Items that leave a player's inventory for less than a second, such as while moving a stack, are not taken from teammates. A stack held for longer is taken from teammates and returned when it is put back.
- **Full Inventory**: If a player has no free space, the missing items arrive as soon as space is free.

### Hard Mode
- **What Happens**: The host or an operator can switch the Mode to Hard before choosing Start. Health and hunger are then shared by every player who takes part.
- **Damage and Healing**: Damage taken by one player is taken by the whole team. Healing and eating raise the shared value once.
- **Starting Values**: Everyone's health and hunger are set to the lowest among the players when the game starts.
- **Deaths**: When one player dies, every other player who takes part dies too.

### Team Deaths
- **What Happens**: The shared inventory drops once when a player dies and is then emptied for the team.
- **Keep Inventory**: The rule is switched on while sharing runs so nothing drops twice, and restored when sharing ends.

### Ending the Game
- **What Happens**: The host or an operator chooses End Game in the Controller menu or uses the function end_game. The shared items are divided between players, the host keeps the armor and the shared Ender Chest items, and everyone else is emptied so items are not duplicated.
- **Survival**: Start uses up the Controller, so run the function give_controller to get a new one before choosing End Game.
- **Controller Replacement**: The host or an operator gets a new Controller when the game ends. The function give_controller also gives one.

### Joining Players
- **What Happens**: Players who join while sharing is running receive the team inventory. Their own items are replaced, so store anything personal before joining.

## How to Use

1. Import the pack and enable both the Behavior Pack and the Resource Pack in the settings of any world you want to play.
2. The host or an operator uses the Controller, optionally switches the Mode to Hard or the Layout to Personal, and chooses Start.
3. Play together and coordinate item use with teammates.
4. The host or an operator chooses End Game in the Controller menu, or runs the function end_game, to finish.

## Compatibility

- Minecraft Bedrock Edition: 1.26.40 or newer. Older versions were not checked.
- Experimental features: No experiment requirement detected in the inspected files.
- Achievements: Likely achievement-friendly; world settings or cheats can disable achievements.
- Verification: Source created, not tested in game.
- After the world is restarted, only names, lore, durability and enchantments of items are restored. Shulker box and bundle contents, potion types, dyed colors, banner patterns and maps may be lost.
- If the shared inventory becomes too large to save, players are warned and the saved copy is cleared until it is smaller.
- Players in Creative or Spectator mode are not part of the shared inventory.

## Creator and Permissions

- [CurseForge Profile](https://www.curseforge.com/members/allenscreations/projects)
- [MCPEDL Profile](https://mcpedl.com/user/allenscreations/)

<a href="https://www.curseforge.com/members/allenscreations/projects"><img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/assets/Images/curseforge.jpg" alt="CurseForge" width="45%"></a> <a href="https://mcpedl.com/user/allenscreations/"><img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/assets/Images/MCPEDL.jpg" alt="MCPEDL" width="45%"></a>
- [MCPEDL Profile](https://mcpedl.com/user/alnstudios/)

<a href="https://www.curseforge.com/members/allenscreations/projects"><img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/assets/Images/curseforge.jpg" alt="CurseForge" width="45%"></a> <a href="https://mcpedl.com/user/alnstudios/"><img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/assets/Images/MCPEDL.jpg" alt="MCPEDL" width="45%"></a>

## Guidelines and Attribution

- Creator: ALNStudios
- Rights & Reservation: All rights reserved for ALNStudios.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to ALNStudios.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.
- Disclaimer: This is an unofficial community creation. It is not an official Minecraft product and is not approved by or associated with Mojang or Microsoft.

---

© All rights reserved for ALNStudios.

---

## Search & Discovery Keywords

Minecraft Bedrock add-on, Team Inventory Bedrock mod, shared inventory, multiplayer shared items, shared armor and offhand, shared ender chest, shared health and hunger, hard mode, personal inventory layout, works in any world, team survival inventory, Minecraft PE multiplayer, MCPEDL add-on, CurseForge Bedrock, ALNStudios.

