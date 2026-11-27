import { world, system, CommandPermissionLevel } from "@minecraft/server";
import { openRootMenu } from "./lib/op_menu_ui.js";

const BOOK_ID = "aln:op_book";

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
});

