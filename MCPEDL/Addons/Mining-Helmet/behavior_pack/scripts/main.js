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
 * - cursor (default): a light near you in the view direction (so it looks like it comes from you)
 *   plus a light at the block face you are looking at (no head fallback, no distance limit)
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
const NEAR_LIGHT_DISTANCE = 2; // Source light in front of you, in blocks (keeps the light looking like it comes from you)

const FACE_OFFSETS = {
  Up: { x: 0, y: 1, z: 0 },
  Down: { x: 0, y: -1, z: 0 },
  North: { x: 0, y: 0, z: -1 },
  South: { x: 0, y: 0, z: 1 },
  East: { x: 1, y: 0, z: 0 },
  West: { x: -1, y: 0, z: 0 }
};

/**
 * State map storing the active light blocks and light level per player
 * @type {Map<string, { dim: any, x: number, y: number, z: number, level: number }[]>}
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
 * Restores one placed light block back to air safely
 * @param {{ dim: any, x: number, y: number, z: number }} light
 */
function clearLightBlock(light) {
  try {
    const block = light.dim.getBlock({ x: light.x, y: light.y, z: light.z });
    if (block && isLightBlock(block.typeId)) {
      block.setPermutation(BlockPermutation.resolve("minecraft:air"));
    }
  } catch (e) {
    // Gracefully handle unloaded chunks or edge conditions
  }
}

/**
 * Restores all of a player's placed light blocks back to air safely
 * @param {string} playerId
 */
function removePlayerLight(playerId) {
  const lights = activePlayerLights.get(playerId);
  if (!lights) return;

  for (const light of lights) {
    clearLightBlock(light);
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
 * Builds the light targets for a player. Each target is a list of fallback
 * positions; the first one that can hold a light block is used.
 * @param {any} player
 * @returns {{x:number,y:number,z:number}[][]}
 */
function getLightTargets(player) {
  if (LIGHT_MODE === "cursor") {
    try {
      const hit = player.getBlockFromViewDirection({
        maxDistance: CURSOR_MAX_DISTANCE,
        includeLiquidBlocks: false,
        includePassableBlocks: false
      });
      // Nothing in view: no cursor light
      if (!hit || !hit.block) return [];

      const bx = hit.block.location.x;
      const by = hit.block.location.y;
      const bz = hit.block.location.z;
      const offset = FACE_OFFSETS[hit.face] || FACE_OFFSETS.Up;
      const targets = [];

      // Source light a short way in front of you, so the light looks like it comes from you
      const head = player.getHeadLocation();
      const dir = player.getViewDirection();
      const fl = hit.faceLocation || { x: 0.5, y: 0.5, z: 0.5 };
      const hitDistance = Math.hypot(bx + fl.x - head.x, by + fl.y - head.y, bz + fl.z - head.z);
      const nearDistance = Math.max(0, Math.min(NEAR_LIGHT_DISTANCE, hitDistance - 1));
      targets.push([
        {
          x: Math.floor(head.x + dir.x * nearDistance),
          y: Math.floor(head.y + dir.y * nearDistance),
          z: Math.floor(head.z + dir.z * nearDistance)
        },
        { x: Math.floor(head.x), y: Math.floor(head.y), z: Math.floor(head.z) }
      ]);

      // Light on the block face you are looking at
      targets.push([{ x: bx + offset.x, y: by + offset.y, z: bz + offset.z }]);

      return targets;
    } catch (e) {
      // Unloaded chunk or nothing targetable: no cursor light
      return [];
    }
  }

  // Head mode: just above the head, falling back to torso level
  const hx = Math.floor(player.location.x);
  const hz = Math.floor(player.location.z);
  return [
    [
      { x: hx, y: Math.floor(player.location.y + 1.6), z: hz },
      { x: hx, y: Math.floor(player.location.y + 0.3), z: hz }
    ]
  ];
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
      const targets = getLightTargets(player);

      // Cursor mode with nothing in view: no light
      if (targets.length === 0) {
        removePlayerLight(playerId);
        continue;
      }

      const oldLights = activePlayerLights.get(playerId) || [];
      const newLights = [];

      for (const group of targets) {
        for (const candidate of group) {
          const duplicate = newLights.some(
            (l) => l.x === candidate.x && l.y === candidate.y && l.z === candidate.z
          );
          if (duplicate) break;

          // Already placed here with the exact power: keep it
          const existing = oldLights.find(
            (l) =>
              l.dim === dim &&
              l.x === candidate.x &&
              l.y === candidate.y &&
              l.z === candidate.z &&
              l.level === power
          );
          if (existing) {
            newLights.push(existing);
            break;
          }

          if (placeLightBlock(dim, candidate.x, candidate.y, candidate.z, power)) {
            newLights.push({ dim, x: candidate.x, y: candidate.y, z: candidate.z, level: power });
            break;
          }
        }
      }

      // Nothing could be placed this tick: keep the previous lights
      if (newLights.length === 0) {
        continue;
      }

      // Clean up previous positions that are no longer used
      for (const old of oldLights) {
        const stillUsed = newLights.some(
          (l) => l.dim === old.dim && l.x === old.x && l.y === old.y && l.z === old.z
        );
        if (!stillUsed) {
          clearLightBlock(old);
        }
      }

      activePlayerLights.set(playerId, newLights);
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
