/**
 * Mining Helmet Dynamic Following Light System
 * Created by AllensCreations — MCPE Curseforges
 *
 * Tracks the custom:mining_helmet in the player's head slot.
 * Generates dynamic light (level 15) via temporary minecraft:light_block
 * and guarantees zero permanent residue upon movement, unequip, death, or leave.
 */
import { world, system, EquipmentSlot, BlockPermutation } from "@minecraft/server";

const HELMET_IDENTIFIER = "custom:mining_helmet";
const LIGHT_LEVEL = 15;
const LIGHT_UPDATE_INTERVAL = 2; // Run every 2 ticks (10 times/sec) for optimal smoothness & TPS

/**
 * State map storing active light block coordinates per player
 * @type {Map<string, { dim: any, x: number, y: number, z: number }>}
 */
const activePlayerLights = new Map();

/**
 * Checks if a block is a light block
 * @param {string} typeId
 */
function isLightBlock(typeId) {
  return typeId === "minecraft:light_block" || (typeId && typeId.startsWith("minecraft:light_block"));
}

/**
 * Validates if a block coordinate can hold a temporary light block
 * @param {any} block
 */
function canHoldLight(block) {
  if (!block) return false;
  try {
    return block.isAir || isLightBlock(block.typeId);
  } catch (e) {
    return false;
  }
}

/**
 * Restores a placed light block back to air safely
 * @param {string} playerId
 */
function removePlayerLight(playerId) {
  const light = activePlayerLights.get(playerId);
  if (!light) return;

  try {
    const block = light.dim.getBlock({ x: light.x, y: light.y, z: light.z });
    if (block && isLightBlock(block.typeId)) {
      block.setPermutation(BlockPermutation.resolve("minecraft:air"));
    }
  } catch (e) {
    // Gracefully handle unloaded chunks or edge conditions
  }

  activePlayerLights.delete(playerId);
}

/**
 * Places a light block with level 15 at the specified coordinates
 * @param {any} dim
 * @param {number} x
 * @param {number} y
 * @param {number} z
 */
function placeLightBlock(dim, x, y, z) {
  try {
    const block = dim.getBlock({ x, y, z });
    if (!canHoldLight(block)) return false;

    try {
      block.setPermutation(BlockPermutation.resolve("minecraft:light_block", { block_light_level: LIGHT_LEVEL }));
      return true;
    } catch {
      try {
        block.setPermutation(BlockPermutation.resolve(`minecraft:light_block_${LIGHT_LEVEL}`));
        return true;
      } catch {
        return false;
      }
    }
  } catch {
    return false;
  }
}

/**
 * Checks whether the player currently has the mining helmet equipped
 * @param {any} player
 */
function isMiningHelmetEquipped(player) {
  try {
    const equippable = player.getComponent("minecraft:equippable") || player.getComponent("equippable");
    if (!equippable) return false;

    const headItem = equippable.getEquipment(EquipmentSlot.Head);
    return !!(headItem && headItem.typeId === HELMET_IDENTIFIER);
  } catch (e) {
    return false;
  }
}

/**
 * Main dynamic lighting loop
 */
system.runInterval(() => {
  let players;
  try {
    players = world.getAllPlayers();
  } catch (e) {
    return;
  }

  for (const player of players) {
    try {
      const playerId = player.id;

      // 1. Check if helmet is equipped and player is alive
      if (!isMiningHelmetEquipped(player)) {
        removePlayerLight(playerId);
        continue;
      }

      const dim = player.dimension;
      const targetX = Math.floor(player.location.x);
      const targetZ = Math.floor(player.location.z);

      // Prefer eye/head coordinate, fallback to torso
      let headY = Math.floor(player.location.y + 1.6);
      let targetY = headY;

      const currentLight = activePlayerLights.get(playerId);

      // Check if light block is already positioned correctly
      if (
        currentLight &&
        currentLight.dim === dim &&
        currentLight.x === targetX &&
        currentLight.y === targetY &&
        currentLight.z === targetZ
      ) {
        continue;
      }

      // Try placing at eye level first, fallback to torso level if head is inside a solid block
      let placed = placeLightBlock(dim, targetX, targetY, targetZ);
      if (!placed) {
        targetY = Math.floor(player.location.y + 0.3);
        placed = placeLightBlock(dim, targetX, targetY, targetZ);
      }

      if (!placed) {
        continue;
      }

      // 2. Clean up previous position if player moved
      if (
        currentLight &&
        (currentLight.dim !== dim ||
          currentLight.x !== targetX ||
          currentLight.y !== targetY ||
          currentLight.z !== targetZ)
      ) {
        try {
          const oldBlock = currentLight.dim.getBlock({
            x: currentLight.x,
            y: currentLight.y,
            z: currentLight.z
          });
          if (oldBlock && isLightBlock(oldBlock.typeId)) {
            oldBlock.setPermutation(BlockPermutation.resolve("minecraft:air"));
          }
        } catch (e) {}
      }

      // 3. Update active light tracking
      activePlayerLights.set(playerId, {
        dim,
        x: targetX,
        y: targetY,
        z: targetZ
      });
    } catch (e) {
      // Continue loop for other players
    }
  }
}, LIGHT_UPDATE_INTERVAL);

// Clean up light block when a player leaves the server
world.afterEvents.playerLeave.subscribe((event) => {
  if (event.playerId) {
    removePlayerLight(event.playerId);
  }
});

// Clean up light block when a player changes dimension
if (world.afterEvents.playerDimensionChange) {
  world.afterEvents.playerDimensionChange.subscribe((event) => {
    if (event.player && event.player.id) {
      removePlayerLight(event.player.id);
    }
  });
}

// Clean up light block when a player dies
world.afterEvents.entityDie.subscribe((event) => {
  const entity = event.deadEntity;
  if (entity && entity.typeId === "minecraft:player") {
    removePlayerLight(entity.id);
  }
});

console.warn("[Mining Helmet] Dynamic light module successfully loaded.");
