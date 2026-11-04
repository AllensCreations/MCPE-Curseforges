import { world } from "@minecraft/server";
import { startTimeLapse } from "./time_engine.js";

const isBed = (block) => {
  const id = block?.typeId;
  return typeof id === "string" && id.startsWith("minecraft:") && id.endsWith("_bed");
};

export function initChronoBed() {
  world.afterEvents.playerInteractWithBlock.subscribe(({ player, block, isFirstEvent }) => {
    if (isFirstEvent === false || !isBed(block)) return;
    startTimeLapse(player, world.getTimeOfDay());
  });
}
