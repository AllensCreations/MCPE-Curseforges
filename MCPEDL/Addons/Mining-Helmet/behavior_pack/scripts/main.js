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
 * - cursor (default): a dim light at yourself (level 1-3) plus a full-power light at the block
 *   (or water) you are looking at (no head fallback, no distance limit)
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
const SELF_LIGHT_MIN = 1; // Dim light at yourself, lowest level
const SELF_LIGHT_MAX = 3; // Dim light at yourself, highest level

/**
 * Light level of the dim light at yourself (1 to 3), scaled from the equipment power
 * @param {number} power
 */
function getSelfLightLevel(power) {
  return Math.max(SELF_LIGHT_MIN, Math.min(SELF_LIGHT_MAX, Math.round(power / 5)));
}

/**
 * Checks if a block is water (placing a light there is undone by restoring the water)
 * @param {string} typeId
 */
function isWaterBlock(typeId) {
  return typeId === "minecraft:water" || typeId === "minecraft:flowing_water";
}

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
 * @type {Map<string, { dim: any, x: number, y: number, z: number, level: number, restore?: any }[]>}
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
    return block.isAir || isLightBlock(block.typeId) || isWaterBlock(block.typeId);
  } catch (e) {
    return false;
  }
}

/**
 * Restores one placed light block back to air (or back to water) safely
 * @param {{ dim: any, x: number, y: number, z: number, restore?: any }} light
 */
function clearLightBlock(light) {
  try {
    const block = light.dim.getBlock({ x: light.x, y: light.y, z: light.z });
    if (block && isLightBlock(block.typeId)) {
      block.setPermutation(light.restore || BlockPermutation.resolve("minecraft:air"));
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
 * @returns {{ restore: any } | null} Placement info (restore = water to put back), or null if it failed
 */
function placeLightBlock(dim, x, y, z, level) {
  try {
    const block = dim.getBlock({ x, y, z });
    if (!canHoldLight(block)) return null;

    // Remember water so it can be put back when the light moves away
    const restore = isWaterBlock(block.typeId) ? block.permutation : null;

    try {
      block.setPermutation(BlockPermutation.resolve("minecraft:light_block", { block_light_level: level }));
      return { restore };
    } catch {
      try {
        block.setPermutation(BlockPermutation.resolve(`minecraft:light_block_${level}`));
        return { restore };
      } catch {
        return null;
      }
    }
  } catch {
    return null;
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
 * Builds the light targets for a player. Each target has a light level and a list of
 * fallback positions; the first one that can hold a light block is used.
 * Targets are ordered brightest first.
 * @param {any} player
 * @param {number} power
 * @returns {{level:number, candidates:{x:number,y:number,z:number}[]}[]}
 */
function getLightTargets(player, power) {
  if (LIGHT_MODE === "cursor") {
    try {
      const head = player.getHeadLocation();
      const hx = Math.floor(head.x);
      const hy = Math.floor(head.y);
      const hz = Math.floor(head.z);

      // Underwater the ray would stop at the water around you, so skip liquids there
      let headInLiquid = false;
      try {
        headInLiquid = !!player.dimension.getBlock({ x: hx, y: hy, z: hz }).isLiquid;
      } catch (e) {}

      const hit = player.getBlockFromViewDirection({
        maxDistance: CURSOR_MAX_DISTANCE,
        includeLiquidBlocks: !headInLiquid,
        includePassableBlocks: false
      });
      // Nothing in view: no cursor light
      if (!hit || !hit.block) return [];

      const offset = FACE_OFFSETS[hit.face] || FACE_OFFSETS.Up;
      const bx = hit.block.location.x;
      const by = hit.block.location.y;
      const bz = hit.block.location.z;

      return [
        // Full power on the block (or water) face you are looking at
        { level: power, candidates: [{ x: bx + offset.x, y: by + offset.y, z: bz + offset.z }] },
        // Dim light at yourself (level 1 to 3)
        {
          level: getSelfLightLevel(power),
          candidates: [
            { x: hx, y: hy, z: hz },
            { x: hx, y: Math.floor(player.location.y + 0.3), z: hz }
          ]
        }
      ];
    } catch (e) {
      // Unloaded chunk or nothing targetable: no cursor light
      return [];
    }
  }

  // Head mode: just above the head, falling back to torso level
  const x = Math.floor(player.location.x);
  const z = Math.floor(player.location.z);
  return [
    {
      level: power,
      candidates: [
        { x, y: Math.floor(player.location.y + 1.6), z },
        { x, y: Math.floor(player.location.y + 0.3), z }
      ]
    }
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
      const targets = getLightTargets(player, power);

      // Cursor mode with nothing in view: no light
      if (targets.length === 0) {
        removePlayerLight(playerId);
        continue;
      }

      const oldLights = activePlayerLights.get(playerId) || [];
      const newLights = [];

      for (const target of targets) {
        for (const candidate of target.candidates) {
          // Spot already used by a brighter light of this player
          const duplicate = newLights.some(
            (l) => l.x === candidate.x && l.y === candidate.y && l.z === candidate.z
          );
          if (duplicate) break;

          // Already placed here with the exact level: keep it
          const existing = oldLights.find(
            (l) =>
              l.dim === dim &&
              l.x === candidate.x &&
              l.y === candidate.y &&
              l.z === candidate.z &&
              l.level === target.level
          );
          if (existing) {
            newLights.push(existing);
            break;
          }

          // Same spot with another level: clear it first so water is restored before re-placing
          const stale = oldLights.find(
            (l) => l.dim === dim && l.x === candidate.x && l.y === candidate.y && l.z === candidate.z
          );
          const placed = placeLightBlock(dim, candidate.x, candidate.y, candidate.z, target.level);
          if (placed) {
            newLights.push({
              dim,
              x: candidate.x,
              y: candidate.y,
              z: candidate.z,
              level: target.level,
              restore: stale ? stale.restore || placed.restore : placed.restore
            });
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
