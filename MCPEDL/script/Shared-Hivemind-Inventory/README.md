# Team Inventory (v1.0.22)

Share one inventory with everyone in your Minecraft Bedrock world.

## Overview

Team Inventory turns a group of players into a team that shares a single set of supplies. When the host starts it, everyone's main inventory, armor, offhand and Ender Chest items are combined, and from then on any item one player picks up, uses or drops changes it for the whole team.

Only the host or an operator can start the shared inventory, using the AllensCreations Controller item.

## Key Features

### Shared Inventory
- **What Happens**: Main inventory, armor and offhand items are the same for every player who takes part.
- **Conflicts**: If two players change the same stack at the same moment, both changes are combined instead of losing or duplicating items.

### AllensCreations Controller
- **What Happens**: The host or an operator receives a Controller item. Using it opens a menu with Start, How to play, Mode and Layout.
- **Survival**: Starting the game uses up the Controller.
- **Creative**: The Controller is kept.

### Shared Ender Chest
- **What Happens**: Every player's Ender Chest holds the same items, so something stored by one player can be taken out by another.
- **Start and End**: Ender Chest items from every player are combined when the game starts. When it ends, the host keeps the shared Ender Chest items and everyone else's Ender Chest is emptied.
- **Deaths**: The Ender Chest is not dropped when a player dies.

### Personal Layout
- **What Happens**: When the Layout is Personal, the team still shares the same items, but each player arranges their own main inventory and hotbar. New items go into the first free slot.
- **Armor, Offhand and Ender Chest**: These keep the same layout for everyone.
- **Moving Items**: Items that leave a player's inventory for less than a second, such as while moving a stack, are not taken from teammates. A stack held for longer is taken from teammates and returned when it is put back.
- **Full Inventory**: If a player has no free space, the missing items arrive as soon as space is free.

### Hard Mode
- **What Happens**: The host or an operator can switch the Controller's Mode to Hard before choosing Start. Health and hunger are then shared by every player who takes part.
- **Damage and Healing**: Damage taken by one player is taken by the whole team. Healing and eating raise the shared value once.
- **Starting Values**: Everyone's health and hunger are set to the lowest among the players when the game starts.
- **Deaths**: When one player dies, every other player who takes part dies too.

### Team Deaths
- **What Happens**: When any player dies, the whole shared inventory drops once at that spot and is emptied for the team.
- **Keep Inventory**: While sharing is running the world's keep inventory rule is switched on so items are never dropped twice. It returns to its earlier setting when sharing ends.

### Ending the Game
- **What Happens**: An operator uses the function end_game. The shared items are divided between the players, the host keeps the shared armor, and everyone else is emptied so no item is duplicated.
- **New Controller**: The host or an operator receives a fresh Controller when the game ends. The function give_controller also gives one.

### Joining and Leaving
- **What Happens**: Players who join while sharing is running receive the team inventory in place of their own items.
- **Creative and Spectator**: Players in these modes are not part of the shared inventory.

## How to Use

1. Import the pack and enable the Behavior Pack and the Resource Pack in the world settings.
2. The host or an operator uses the Controller, optionally switches the Mode to Hard or the Layout to Personal, and chooses Start.
3. Play together. Coordinate item use, since every change affects the team.
4. When you finish, an operator runs the function end_game.

## Compatibility

- Minecraft Bedrock Edition: 1.26.40 or newer. Older versions were not checked.
- Experimental features: No experiment requirement detected in the inspected files.
- Achievements: Unknown / needs confirmation.
- Verification: Source created, not tested in game.
