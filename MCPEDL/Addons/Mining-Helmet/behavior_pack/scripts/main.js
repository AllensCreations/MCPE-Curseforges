/**
 * Mining Helmet Dynamic Following Light System
 * Created by ALNStudios — MCPE Curseforges
 *
 * Tracks the Mining Helmet in the player's head slot and handheld light sources.
 * Generates dynamic light with specific power levels:
 * - Lantern Helmet / Lantern: Level 15 (maximum bright emission)
 * - Torch Helmet / Torch: Level 10 (warm localized emission)
 * Restores placed light blocks back to air upon movement, unequip, death, or disconnect.
 *
 * Light modes (chosen by the Behavior Pack subpack, see scripts/mode.js):
 * - cursor (default): light is placed at the block face you are looking at (no head fallback)
 * - head: light is placed just above your head
 */
import { world, system, EquipmentSlot, BlockPermutation } from "@minecraft/server";
import { LIGHT_MODE } from "./mode.js";

const LIGHT_POWERS = {
  "custom:mining_helmet": 15,
  "custom:torch_mining_helmet": 10,
  "minecraft:lantern": 15,
  "minecraft:torch": 10,
  "minecraft:soul_lantern": 10,
  "minecraft:soul_torch": 10
};

const LIGHT_UPDATE_INTERVAL = 2; // Run every 2 ticks (10 times/sec)
const CURSOR_MAX_DISTANCE = 1000; // Effectively unlimited; the game only reaches loaded chunks

const FACE_OFFSETS = {
  Up: { x: 0, y: 1, z: 0 },
  Down: { x: 0, y: -1, z: 0 },
  North: { x: 0, y: 0, z: -1 },
  South: { x: 0, y: 0, z: 1 },
  East: { x: 1, y: 0, z: 0 },
  West: { x: -1, y: 0, z: 0 }
};

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
 * Builds the ordered list of positions where the light may be placed
 * @param {any} player
 * @returns {{x:number,y:number,z:number}[]}
 */
function getLightCandidates(player) {
  const candidates = [];

  if (LIGHT_MODE === "cursor") {
    try {
      const hit = player.getBlockFromViewDirection({
        maxDistance: CURSOR_MAX_DISTANCE,
        includeLiquidBlocks: false,
        includePassableBlocks: false
      });
      if (hit && hit.block) {
        const offset = FACE_OFFSETS[hit.face] || FACE_OFFSETS.Up;
        candidates.push({
          x: hit.block.location.x + offset.x,
          y: hit.block.location.y + offset.y,
          z: hit.block.location.z + offset.z
        });
      }
    } catch (e) {
      // Nothing targetable (unloaded chunk or no block in view): no cursor light
    }
    return candidates;
  }

  // Head mode: just above the head, falling back to torso level
  const hx = Math.floor(player.location.x);
  const hz = Math.floor(player.location.z);
  candidates.push({ x: hx, y: Math.floor(player.location.y + 1.6), z: hz });
  candidates.push({ x: hx, y: Math.floor(player.location.y + 0.3), z: hz });

  return candidates;
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
      const candidates = getLightCandidates(player);

      // Cursor mode with nothing in view: no light
      if (candidates.length === 0) {
        removePlayerLight(playerId);
        continue;
      }

      const currentLight = activePlayerLights.get(playerId);

      // Skip work if the light is already at the preferred position with the exact power
      const first = candidates[0];
      if (
        currentLight &&
        currentLight.dim === dim &&
        currentLight.x === first.x &&
        currentLight.y === first.y &&
        currentLight.z === first.z &&
        currentLight.level === power
      ) {
        continue;
      }

      // Use the first position that can hold a light block
      let target = null;
      for (const candidate of candidates) {
        if (placeLightBlock(dim, candidate.x, candidate.y, candidate.z, power)) {
          target = candidate;
          break;
        }
      }

      if (!target) {
        continue;
      }
      const targetX = target.x;
      const targetY = target.y;
      const targetZ = target.z;

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

console.warn(`[Mining Helmet] Dynamic light system initialized (mode: ${LIGHT_MODE}, Torch: 10, Lantern: 15).`);
