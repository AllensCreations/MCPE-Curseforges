import { world, system, ItemStack, CommandPermissionLevel } from "@minecraft/server";
import { openRootMenu } from "./lib/op_menu_ui.js";

const BOOK_ID = "aln:op_book";

function giveBook(player) {
  const container = player.getComponent("minecraft:inventory")?.container;
  if (!container) return;
  for (let slot = 0; slot < container.size; slot++) {
    if (container.getItem(slot)?.typeId === BOOK_ID) return;
  }
  if (container.emptySlotsCount < 1) return;
  try {
    container.addItem(new ItemStack(BOOK_ID, 1));
  } catch (e) {
    console.warn(`[OpCodex] book: ${e}`);
  }
}

system.beforeEvents.startup.subscribe(({ customCommandRegistry }) => {
  customCommandRegistry.registerCommand(
    { name: "aln:alnop", description: "Open the ALN:OpCodex menu", permissionLevel: CommandPermissionLevel.Any, cheatsRequired: false },
    (origin) => {
      const player = origin.sourceEntity;
      if (player?.typeId === "minecraft:player") system.run(() => openRootMenu(player));
    }
  );
});

world.afterEvents.worldLoad.subscribe(() => {
  world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
    if (itemStack?.typeId === BOOK_ID) openRootMenu(source);
  });
  for (const player of world.getAllPlayers()) giveBook(player);
});

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (initialSpawn) system.run(() => giveBook(player));
});
