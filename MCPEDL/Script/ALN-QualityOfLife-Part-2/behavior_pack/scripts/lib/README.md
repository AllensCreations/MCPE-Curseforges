# Script Library Notes

Each file in this folder registers its own behavior when it is imported by main.js. Nothing is exported, and every file starts its work inside the world load event.

- filter_hopper.js: tracks Hoppers that have a Sign beside them, reads a Sign starting with "Filter:" and pushes any item not on the list out onto a free side of the Hopper. Registers the player place block event and two intervals (1 tick, 200 ticks). Depends on the server module. Saves its Hopper list in a world property named alnqol2:filter_hoppers (150 entries at most).
- vacuum_hopper.js: tracks Hoppers that have a Sign beside them, and for a Sign line reading "Vacuum Hopper" moves loose item entities from a 5 by 5 by 5 box into the Hopper every 10 ticks. Registers the player place block event and two intervals (10 ticks, 200 ticks). Depends on the server module. Saves its Hopper list in a world property named alnqol2:vacuum_hoppers (150 entries at most).
- mechanical_dispenser.js: listens to the entity spawn event for item entities that appear at the front of a Dispenser. A Pickaxe, Axe or Shovel breaks the block in front and loses 1 durability; a placeable block item is placed in an empty space in front. The ejected item is removed and returned to the Dispenser when nothing happens. Depends on the server module. Keeps no saved data.
- auto_breed.js: tracks Chests and Barrels, and every 120 ticks spawns a baby for two healthy adult animals within 8 blocks when the container holds their food. Registers the player place block event and two intervals (20 ticks, 200 ticks). Depends on the server module. Saves its container list in a world property named alnqol2:troughs (100 entries at most) and a breed cooldown dynamic property on each animal named alnqol2:breed_until.

Script events and custom ids: none. The pack adds no custom items, blocks or entities.

Known limits:
- Hoppers, Chests and Barrels placed before the pack was installed are tracked only after they are placed again, or after a Sign is placed beside a Hopper.
- Experience orbs are never collected by the Vacuum Hopper.
- The Dispenser logic reacts to the item a Dispenser drops, so a player standing within 1.5 blocks of that item stops it from firing.
- Breeding spawns a baby directly; animals do not enter love mode.
- Source created, not tested in game.
