import { world } from "@minecraft/server";
import { registerTriggers } from "./sort_triggers.js";

world.afterEvents.worldLoad.subscribe(() => {
  registerTriggers();
  console.warn("[ALN:OneClickSort] Loaded.");
});
