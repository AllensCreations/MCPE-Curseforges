import { system, world } from "@minecraft/server";
import { autoBreakTick, toggleAdminAutoBreak, summonNextIslandAdmin, summonAllIslandsAdmin, openAdminIslandMenu } from "./lib/admin.js";
import { ONEBLOCK_POS, IS_ADMIN_BUILD, isAdmin } from "./lib/config.js";
import { onEntityHurt, onPlayerBreakBlock, onPlayerDimensionChange, onEntitySpawn, onPlayerSpawn, onScriptEvent, maintenanceTick } from "./lib/handlers.js";
import { getDimKey } from "./lib/helpers.js";
import { islandHealthTick } from "./lib/island-core.js";
import { islandArrivalTick } from "./lib/island-spawn.js";
import { handleAutomatedBlockDestruction, oneBlockRenewTick } from "./lib/oneblock.js";
import { openShifterTradeModal } from "./lib/shifter.js";

if (IS_ADMIN_BUILD) system.runInterval(autoBreakTick, 2);

// Player interaction with entities
try {
  if (world.beforeEvents && world.beforeEvents.playerInteractWithEntity && typeof world.beforeEvents.playerInteractWithEntity.subscribe === "function") {
    world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
  const { player, target } = event;

  if (target.hasTag("dimension_shifter")) {
    event.cancel = true;
    system.run(() => {
      const dimKey = getDimKey(player.dimension.id);
      openShifterTradeModal(player, dimKey);
    });
    return;
  }
});

  }
} catch (e) {}

world.afterEvents.entityHurt.subscribe(onEntityHurt);

// Liquid Protection: Prevent placing water, lava, or powder snow directly into the OneBlock space at (0, 64, 0)
try {
  if (world.beforeEvents && world.beforeEvents.itemUseOn && typeof world.beforeEvents.itemUseOn.subscribe === "function") {
    world.beforeEvents.itemUseOn.subscribe((event) => {
  try {
    const { itemStack, block, source: player } = event;
    if (!itemStack || !block) return;

    const loc = block.location;
    const isBucket = itemStack.typeId === "minecraft:water_bucket" || itemStack.typeId === "minecraft:lava_bucket" || itemStack.typeId === "minecraft:powder_snow_bucket";
    if (isBucket && loc.x === ONEBLOCK_POS.x && loc.y === ONEBLOCK_POS.y && loc.z === ONEBLOCK_POS.z) {
      event.cancel = true;
      if (player) {
        player.sendMessage("§c[Liquid Protection] Liquids cannot be poured directly into the Sacred OneBlock Core!");
        player.playSound("note.bass", player.location, { volume: 0.8, pitch: 0.8 });
      }
    }
  } catch (e) {}
});

  }
} catch (e) {}

// Explosion Hook: When explosions destroy the OneBlock, advance progression and renew
try {
  if (world.afterEvents && world.afterEvents.blockExplode) {
    world.afterEvents.blockExplode.subscribe((event) => {
      try {
        const { block, dimension } = event;
        if (block && block.location.x === ONEBLOCK_POS.x && block.location.y === ONEBLOCK_POS.y && block.location.z === ONEBLOCK_POS.z) {
          system.run(() => {
            handleAutomatedBlockDestruction(dimension);
          });
        }
      } catch (e) {}
    });
  }
} catch (e) {}

world.afterEvents.playerBreakBlock.subscribe(onPlayerBreakBlock);

world.afterEvents.playerDimensionChange.subscribe(onPlayerDimensionChange);

world.afterEvents.entitySpawn.subscribe(onEntitySpawn);

world.afterEvents.playerSpawn.subscribe(onPlayerSpawn);

// Physical Button Push Listener for Admin Station
try {
  if (world.afterEvents && world.afterEvents.buttonPush && typeof world.afterEvents.buttonPush.subscribe === "function") {
    world.afterEvents.buttonPush.subscribe((event) => {
  if (!IS_ADMIN_BUILD) return;
  try {
    const { block, source } = event;
    if (!source || source.typeId !== "minecraft:player") return;
    const loc = block.location;

    // Detect push on podium buttons at x: 3, y: 65 (or x: 3, y: 64)
    if (loc.x === 3 && (loc.y === 65 || loc.y === 64)) {
      if (loc.z === -2) {
        toggleAdminAutoBreak(source);
      } else if (loc.z === -1) {
        summonNextIslandAdmin(source);
      } else if (loc.z === 0) {
        summonAllIslandsAdmin(source);
      } else if (loc.z === 1) {
        openAdminIslandMenu(source);
      } else if (loc.z === 2) {
        // Photo lighting quick toggle: High Noon
        try {
          source.dimension.runCommand("time set noon");
          source.dimension.runCommand("weather clear");
          source.addEffect("night_vision", 999999, { showParticles: false });
          source.sendMessage("§a[Photo Studio] Studio lighting set to High Noon with Night Vision!");
          source.playSound("random.orb", { pitch: 1.2, volume: 0.8 });
        } catch (le) {}
      }
    }
  } catch (e) {}
});

  }
} catch (e) {}

// Item use hook preserved for backward compatibility
try {
  if (world.beforeEvents && world.beforeEvents.itemUse && typeof world.beforeEvents.itemUse.subscribe === "function") {
    world.beforeEvents.itemUse.subscribe((event) => {
  try {
    const { itemStack, source } = event;
    if (!itemStack || !itemStack.nameTag) return;

    if (itemStack.nameTag.includes("Island Inspector")) {
      if (!isAdmin(source)) return;
      event.cancel = true;
      system.run(() => {
        openAdminIslandMenu(source);
      });
    } else if (itemStack.nameTag.includes("Auto-Break Runner")) {
      if (!isAdmin(source)) return;
      event.cancel = true;
      system.run(() => {
        toggleAdminAutoBreak(source);
      });
    }
  } catch (e) {}
});

  }
} catch (e) {}

system.afterEvents.scriptEventReceive.subscribe(onScriptEvent);

system.runInterval(oneBlockRenewTick, 1);

system.runInterval(islandHealthTick, 5);

system.runInterval(maintenanceTick, 20);

system.runInterval(islandArrivalTick, 10);
