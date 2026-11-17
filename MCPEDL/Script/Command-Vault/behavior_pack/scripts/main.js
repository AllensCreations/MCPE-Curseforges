import { world } from "@minecraft/server";
import { openMainMenu } from "./command_ui.js";

world.afterEvents.worldLoad.subscribe(() => {
});

world.afterEvents.itemUse.subscribe((event) => {
  const { itemStack, source: player } = event;
  if (!itemStack || !player) return;

  const typeId = itemStack.typeId;
  if (typeId !== "minecraft:book" && typeId !== "minecraft:writable_book") {
    return;
  }

  const nameTag = itemStack.nameTag;
  if (nameTag && nameTag.trim().toLowerCase() === "command vault") {
    openMainMenu(player);
  }
});
