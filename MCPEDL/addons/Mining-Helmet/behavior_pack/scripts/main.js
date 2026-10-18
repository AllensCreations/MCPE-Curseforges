/**
 * Mining Helmet Dynamic Following Light System
 * Created by AllensCreations — MCPE Curseforges
 *
 * Tracks the Mining Helmet in the player's head slot and handheld light sources.
 * Generates dynamic light with specific power levels:
 * - Lantern Helmet / Lantern: Level 15 (maximum bright emission)
 * - Torch Helmet / Torch: Level 10 (warm localized emission)
 * Restores placed light blocks back to air upon movement, unequip, death, or disconnect.
 */
import { world, system, EquipmentSlot, BlockPermutation } from "@minecraft/server";

const LIGHT_POWERS = {
  "custom:mining_helmet": 15,
  "custom:torch_mining_helmet": 10,
  "minecraft:lantern": 15,
  "minecraft:torch": 10,
  "minecraft:soul_lantern": 10,
  "minecraft:soul_torch": 10
};

const LIGHT_UPDATE_INTERVAL = 2; // Run every 2 ticks (10 times/sec)

/**
 * State map storing active light block coordinates and current light level per player
 * @type {Map<string, { dim: any, x: number, y: number, z: number, level: number }>}
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
 * Places a light block with a specific level at the target coordinates
 * @param {any} dim
 * @param {number} x
 * @param {number} y
 * @param {number} z
 * @param {number} level
 */
function placeLightBlock(dim, x, y, z, level) {
  try {
    const block = dim.getBlock({ x, y, z });
    if (!canHoldLight(block)) return false;

    try {
      block.setPermutation(BlockPermutation.resolve("minecraft:light_block", { block_light_level: level }));
      return true;
    } catch {
      try {
        block.setPermutation(BlockPermutation.resolve(`minecraft:light_block_${level}`));
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
 * Resolves the highest light power emitted by a player's equipment
 * @param {any} player
 * @returns {number} Light power level (0 if unlit)
 */
function getPlayerLightPower(player) {
  let maxLevel = 0;
  try {
    const equippable = player.getComponent("minecraft:equippable") || player.getComponent("equippable");
    if (!equippable) return 0;

    const headItem = equippable.getEquipment(EquipmentSlot.Head);
    if (headItem && LIGHT_POWERS[headItem.typeId]) {
      maxLevel = Math.max(maxLevel, LIGHT_POWERS[headItem.typeId]);
    }

    const offhandItem = equippable.getEquipment(EquipmentSlot.Offhand);
    if (offhandItem && LIGHT_POWERS[offhandItem.typeId]) {
      maxLevel = Math.max(maxLevel, LIGHT_POWERS[offhandItem.typeId]);
    }

    const mainhandItem = equippable.getEquipment(EquipmentSlot.Mainhand);
    if (mainhandItem && LIGHT_POWERS[mainhandItem.typeId]) {
      maxLevel = Math.max(maxLevel, LIGHT_POWERS[mainhandItem.typeId]);
    }
  } catch (e) {}

  return maxLevel;
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
      const power = getPlayerLightPower(player);

      // If no light power is active, extinguish light
      if (power <= 0) {
        removePlayerLight(playerId);
        continue;
      }

      const dim = player.dimension;
      const targetX = Math.floor(player.location.x);
      const targetZ = Math.floor(player.location.z);

      let headY = Math.floor(player.location.y + 1.6);
      let targetY = headY;

      const currentLight = activePlayerLights.get(playerId);

      // Check if light block is already positioned and has the exact light power
      if (
        currentLight &&
        currentLight.dim === dim &&
        currentLight.x === targetX &&
        currentLight.y === targetY &&
        currentLight.z === targetZ &&
        currentLight.level === power
      ) {
        continue;
      }

      // Try placing at eye level first, fallback to torso level if head is inside a solid block
      let placed = placeLightBlock(dim, targetX, targetY, targetZ, power);
      if (!placed) {
        targetY = Math.floor(player.location.y + 0.3);
        placed = placeLightBlock(dim, targetX, targetY, targetZ, power);
      }

      if (!placed) {
        continue;
      }

      // Clean up previous position if player moved or light level changed
      if (
        currentLight &&
        (currentLight.dim !== dim ||
          currentLight.x !== targetX ||
          currentLight.y !== targetY ||
          currentLight.z !== targetZ ||
          currentLight.level !== power)
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

      // Update active light tracking
      activePlayerLights.set(playerId, {
        dim,
        x: targetX,
        y: targetY,
        z: targetZ,
        level: power
      });
    } catch (e) {}
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

console.warn("[Mining Helmet] Dynamic light system initialized with power levels (Torch: 10, Lantern: 15).");
