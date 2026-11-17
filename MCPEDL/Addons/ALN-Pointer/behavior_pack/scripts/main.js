import { world, ItemStack, EntityComponentTypes } from "@minecraft/server";
import { POINTER_ID } from "./lib/info.js";
import { openMain } from "./lib/menu.js";
import { initCombat } from "./lib/combat.js";
import { initLoops } from "./lib/loops.js";
import { initBowAim } from "./lib/bowaim.js";

const GIVEN_KEY = "aln_pointer_given";

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (itemStack?.typeId === POINTER_ID) openMain(source);
});

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (!initialSpawn || player.getDynamicProperty(GIVEN_KEY) === true) return;
  const inventory = player.getComponent(EntityComponentTypes.Inventory)?.container;
  if (!inventory) return;
  const left = inventory.addItem(new ItemStack(POINTER_ID, 1));
  if (!left) player.setDynamicProperty(GIVEN_KEY, true);
});

initCombat();
initLoops();
initBowAim();
