import { world, system } from "@minecraft/server";
import { openWorkbench } from "./fletcher.js";
import { registerImpactSystem } from "./impact.js";

const FLETCHING_TABLE = "minecraft:fletching_table";

world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
  const { player, block } = event;
  if (block.typeId !== FLETCHING_TABLE || player.isSneaking) return;
  event.cancel = true;
  if (event.isFirstEvent === false) return;
  system.run(() => openWorkbench(player, block));
});

registerImpactSystem();
