# Team Inventory (v1.0.18)

Share one inventory with everyone in your Minecraft Bedrock world.

## Overview

Team Inventory turns a group of players into a team that shares a single set of supplies. When the host starts it, everyone's main inventory, armor and offhand items are combined, and from then on any item one player picks up, uses or drops changes it for the whole team.

Only the host or an operator can start the shared inventory, using the AllensCreations Controller item.

## Key Features

### Shared Inventory
- **What Happens**: Main inventory, armor and offhand items are the same for every player who takes part.
- **Conflicts**: If two players change the same stack at the same moment, both changes are combined instead of losing or duplicating items.

### AllensCreations Controller
- **What Happens**: The host or an operator receives a Controller item. Using it opens a menu with Start and How to play.
- **Survival**: Starting the game uses up the Controller.
- **Creative**: The Controller is kept.

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
2. The host or an operator uses the Controller and chooses Start.
3. Play together. Coordinate item use, since every change affects the team.
4. When you finish, an operator runs the function end_game.

## Compatibility

- Minecraft Bedrock Edition: 1.26.40 or newer. Older versions were not checked.
- Experimental features: No experiment requirement detected in the inspected files.
- Achievements: Unknown / needs confirmation.
- Verification: Source created, not tested in game.
