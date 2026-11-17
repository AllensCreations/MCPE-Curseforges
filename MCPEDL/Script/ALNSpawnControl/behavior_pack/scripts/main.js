import { world } from "@minecraft/server";
import { registerSpawnFilter } from "./spawn_filter.js";
import { registerSpawnUI } from "./spawn_ui.js";

world.afterEvents.worldLoad.subscribe(() => {
  registerSpawnFilter();
  registerSpawnUI();
});
