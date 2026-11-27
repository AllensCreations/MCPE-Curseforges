import { world, system, ItemStack } from "@minecraft/server";
import { openRootMenu } from "./lib/op_menu_ui.js";

const BOOK_ID = "aln:op_book";

function giveBookOnce(player) {
  const key = `aln:op_book_given_${player.id}`;
  if (world.getDynamicProperty(key) !== undefined) return;
  const container = player.getComponent("minecraft:inventory")?.container;
  if (!container || container.emptySlotsCount < 1) return;
  container.addItem(new ItemStack(BOOK_ID, 1));
  world.setDynamicProperty(key, "yes");
}

world.afterEvents.worldLoad.subscribe(() => {
  world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
    if (itemStack?.typeId === BOOK_ID) openRootMenu(source);
  });
  for (const player of world.getAllPlayers()) giveBookOnce(player);
});

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (initialSpawn) system.run(() => giveBookOnce(player));
});
