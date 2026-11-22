import { world } from "@minecraft/server";
import { POINTER_ID } from "./lib/info.js";
import { openMain } from "./lib/menu.js";
import { initBowAim } from "./lib/bowaim.js";
import { initHud } from "./lib/hud.js";

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (itemStack?.typeId === POINTER_ID) openMain(source);
});

initBowAim();
initHud();
