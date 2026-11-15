import { world, system, CommandPermissionLevel, CustomCommandStatus } from "@minecraft/server";
import { registerController, endGame } from "./controller.js";
import { initLootTable, reshuffle, getPoolSize } from "./random_loot_table.js";
import { registerDropHooks, setActive, isActive } from "./random_drops.js";

const DRAGON_ID = "minecraft:ender_dragon";
const BOOK_ID = "minecraft:book";

function broadcast(message) {
  for (const player of world.getAllPlayers()) {
    try {
      player.onScreenDisplay.setActionBar(message);
    } catch (e) {}
  }
}

function tryReshuffle(player) {
  if (isActive()) {
    try {
      player?.onScreenDisplay.setActionBar("§cThe drop table is locked while a game is running.");
    } catch (e) {}
    return false;
  }
  const seed = reshuffle();
  broadcast(`§aThe drop table was reshuffled. Run code: ${seed}`);
  return true;
}

function win() {
  broadcast("§aThe Ender Dragon is down. Chaos conquered!");
  endGame();
}

registerController({
  title: "Every Drop is Random",
  gameInfo: "Type: Challenge\nPlayers: 1 or more\nGoal: Defeat the Ender Dragon while every block and mob drop is swapped for a different item.",
  howToPlay: "Goal: Defeat the Ender Dragon.\nRules: While a game runs, every item dropped by a broken block or a defeated mob is replaced by another item. The same item always turns into the same replacement during one run, and each Start shuffles a new table. Rare swaps show the original and the new item on the action bar.\nReshuffle: Outside a game, use the command aln:reshuffle or sneak and use a Book.\nHow it ends: Defeating the Ender Dragon wins, or the host ends the game from the Controller.",
  onStart: () => {
    const seed = reshuffle();
    setActive(true);
    broadcast(`§aChaos started. ${getPoolSize()} items shuffled. Run code: ${seed}`);
  },
  onEnd: () => {
    setActive(false);
    broadcast("§eThe game ended. Drops are normal again.");
  }
});

registerDropHooks();

world.afterEvents.worldLoad.subscribe(() => {
  initLootTable();
});

world.afterEvents.entityDie.subscribe(({ deadEntity }) => {
  try {
    if (isActive() && deadEntity.typeId === DRAGON_ID) win();
  } catch (e) {}
});

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (itemStack?.typeId !== BOOK_ID) return;
  if (!source.isSneaking) return;
  tryReshuffle(source);
});

system.beforeEvents.startup.subscribe(({ customCommandRegistry }) => {
  customCommandRegistry.registerCommand(
    {
      name: "aln:reshuffle",
      description: "Reshuffle the random drop table for a new run",
      permissionLevel: CommandPermissionLevel.Any,
      cheatsRequired: false
    },
    (origin) => {
      const player = origin.sourceEntity;
      system.run(() => {
        tryReshuffle(player && player.typeId === "minecraft:player" ? player : undefined);
      });
      return { status: CustomCommandStatus.Success };
    }
  );
});
