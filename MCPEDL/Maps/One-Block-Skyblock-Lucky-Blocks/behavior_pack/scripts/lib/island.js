// First join: builds the island, starter chest and spawn point, tags the player, and shows the first tip.
import { world, system, ItemStack } from "@minecraft/server";
import { LUCKY, TIP_KEY, BUILT_KEY, SETUP_TAG, CORE, SPAWN_BLOCK, SPAWN_STAND, CHEST_AT, STARTER } from "./config.js";

let setupRunning = false;

function blockAt(dimension, x, y, z) {
  const block = dimension.getBlock({ x, y, z });
  if (!block) throw new Error("chunk not loaded");
  return block;
}

function buildIsland() {
  const dimension = world.getDimension("overworld");
  for (let x = -16; x <= 16; x++) {
    for (let z = -16; z <= 16; z++) blockAt(dimension, x, -64, z).setType("minecraft:air");
  }
  blockAt(dimension, 0, 63, 0).setType("minecraft:bedrock");
  for (let x = -1; x <= 1; x++) {
    for (let z = -1; z <= 1; z++) blockAt(dimension, x, 64, z).setType("minecraft:grass_block");
  }
  blockAt(dimension, CORE.x, CORE.y, CORE.z).setType(LUCKY);
  const chest = blockAt(dimension, CHEST_AT.x, CHEST_AT.y, CHEST_AT.z);
  chest.setType("minecraft:chest");
  const container = chest.getComponent("minecraft:inventory")?.container;
  if (!container) throw new Error("chest inventory missing");
  STARTER.forEach(([id, amount], slot) => container.setItem(slot, new ItemStack(id, amount)));
  world.setDefaultSpawnLocation(SPAWN_BLOCK);
  world.setDynamicProperty(BUILT_KEY, true);
}

function runSetup(player, tries) {
  try {
    buildIsland();
    player.teleport(SPAWN_STAND);
    player.addTag(SETUP_TAG);
    setupRunning = false;
  } catch (e) {
    if (tries >= 15) {
      setupRunning = false;
      return;
    }
    system.runTimeout(() => runSetup(player, tries + 1), 20);
  }
}

export function registerIsland() {
  world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
    if (!initialSpawn || world.getDynamicProperty(TIP_KEY)) return;
    world.setDynamicProperty(TIP_KEY, true);
    system.runTimeout(() => {
      try {
        player.onScreenDisplay.setActionBar("§6Break the lucky block under you. Open the chest first. The first 20 breaks are a safe tutorial.");
      } catch (e) {
        return;
      }
    }, 100);
  });

  world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
    if (!initialSpawn || setupRunning) return;
    try {
      if (player.hasTag(SETUP_TAG)) return;
      if (world.getDynamicProperty(BUILT_KEY)) {
        player.addTag(SETUP_TAG);
        return;
      }
    } catch (e) {
      return;
    }
    setupRunning = true;
    system.runTimeout(() => runSetup(player, 0), 20);
  });
}
