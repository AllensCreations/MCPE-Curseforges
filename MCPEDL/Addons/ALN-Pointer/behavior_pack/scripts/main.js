import { world, ItemStack, ItemTypes, EntityComponentTypes } from "@minecraft/server";
import { POINTER_ID } from "./lib/info.js";
import { openMain, tell } from "./lib/menu.js";
import { quickSwitch } from "./lib/store.js";
import { initCombat } from "./lib/combat.js";
import { initLoops } from "./lib/loops.js";
import { initBowAim } from "./lib/bowaim.js";
import { initExtras } from "./lib/extras.js";

const GIVEN_KEY = "aln_pointer_given";
const GIFT_MARKER = "allenscreations:aln_gift_on";

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (itemStack?.typeId !== POINTER_ID) return;
  if (source.isSneaking) tell(source, "§e", quickSwitch(source));
  else openMain(source);
});

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (!initialSpawn || !ItemTypes.get(GIFT_MARKER) || player.getDynamicProperty(GIVEN_KEY) === true) return;
  const inventory = player.getComponent(EntityComponentTypes.Inventory)?.container;
  if (!inventory) return;
  const left = inventory.addItem(new ItemStack(POINTER_ID, 1));
  if (!left) player.setDynamicProperty(GIVEN_KEY, true);
});

initCombat();
initLoops();
initBowAim();
initExtras();
