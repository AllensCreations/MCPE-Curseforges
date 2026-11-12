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
 * - cursor (default): a dim light at yourself (level 2) plus a light at the block, water or entity
 *   you are looking at (distance falloff, no head fallback, no distance limit)
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

const SELF_LIGHT_LEVEL = 2; // Fixed dim light at yourself (keep between 1 and 3)

// Distance falloff for the light on what you look at (power 15 fades to 10; power 10 never fades)
const FALLOFF_START = 32; // Full power up to this distance, in blocks
const FALLOFF_RANGE = 64; // Fade completes this many blocks after FALLOFF_START
const FALLOFF_MIN_LEVEL = 10; // Lowest level the fade reaches

// Cheaper raycast: skip recalculating while your view is unchanged
const CURSOR_REFRESH_TICKS = 20; // Always recalculate at least once per second

// Entities the cursor light ignores
const IGNORED_ENTITIES = new Set(["minecraft:item", "minecraft:xp_orb", "minecraft:arrow", "minecraft:snowball"]);

/**
 * Light level of the light on what you look at, with distance falloff
 * @param {number} power
 * @param {number} distance
 */
function getFarLightLevel(power, distance) {
  const floor = Math.min(power, FALLOFF_MIN_LEVEL);
  const t = Math.max(0, Math.min(1, (distance - FALLOFF_START) / FALLOFF_RANGE));
  return Math.round(power - (power - floor) * t);
}

/**
 * Checks if a block is a still water source (flowing water is never replaced)
 * @param {any} block
 */
function isWaterSource(block) {
  try {
    return block.typeId === "minecraft:water" && block.permutation.getState("liquid_depth") === 0;
  } catch (e) {
    return false;
  }
}

/**
 * State map storing the active light blocks and light level per player
 * @type {Map<string, { dim: any, x: number, y: number, z: number, level: number, restore?: any }[]>}
 */
const activePlayerLights = new Map();

/**
 * Per-player cursor cache used to skip raycasts while the view is unchanged
 * @type {Map<string, { key: string, tick: number, hasEntity: boolean }>}
 */
const cursorCache = new Map();

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
    return block.isAir || isLightBlock(block.typeId) || isWaterSource(block);
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
 * @param {boolean} [keepCache] Keep the cursor cache (used when nothing is in view)
 */
function removePlayerLight(playerId, keepCache = false) {
  if (!keepCache) cursorCache.delete(playerId);
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

    // Remember still water so it can be put back when the light moves away
    const restore = isWaterSource(block) ? block.permutation : null;

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
 * Finds the nearest entity you are looking at, before the given distance
 * @param {any} player
 * @param {number} maxDistance
 * @returns {{ entity: any, distance: number } | null}
 */
function getLookedAtEntity(player, maxDistance) {
  try {
    const found = player.getEntitiesFromViewDirection({
      maxDistance,
      ignoreBlockCollision: true // maxDistance is already the distance to the block in view
    });
    for (const item of found) {
      const entity = item.entity;
      if (!entity || entity.id === player.id || IGNORED_ENTITIES.has(entity.typeId)) continue;
      return { entity, distance: item.distance };
    }
  } catch (e) {}
  return null;
}

/**
 * Builds the light targets for a player. Each target has a light level and a list of
 * fallback positions; the first one that can hold a light block is used.
 * Targets are ordered brightest first.
 * @param {any} player
 * @param {number} power
 * @returns {{ targets: {level:number, candidates:{x:number,y:number,z:number}[]}[], hasEntity: boolean }}
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

      let blockDistance = CURSOR_MAX_DISTANCE;
      if (hit && hit.block) {
        const fl = hit.faceLocation || { x: 0.5, y: 0.5, z: 0.5 };
        blockDistance = Math.hypot(
          hit.block.location.x + fl.x - head.x,
          hit.block.location.y + fl.y - head.y,
          hit.block.location.z + fl.z - head.z
        );
      }

      // An entity in front of the block (or with no block at all) gets the light instead
      const looked = getLookedAtEntity(player, blockDistance);

      let farCandidates;
      let farDistance;
      if (looked) {
        const eyes = looked.entity.getHeadLocation ? looked.entity.getHeadLocation() : looked.entity.location;
        const feet = looked.entity.location;
        farCandidates = [
          { x: Math.floor(eyes.x), y: Math.floor(eyes.y), z: Math.floor(eyes.z) },
          { x: Math.floor(feet.x), y: Math.floor(feet.y), z: Math.floor(feet.z) }
        ];
        farDistance = looked.distance;
      } else if (hit && hit.block) {
        const offset = FACE_OFFSETS[hit.face] || FACE_OFFSETS.Up;
        farCandidates = [
          {
            x: hit.block.location.x + offset.x,
            y: hit.block.location.y + offset.y,
            z: hit.block.location.z + offset.z
          }
        ];
        farDistance = blockDistance;
      } else {
        // Nothing in view: no cursor light
        return { targets: [], hasEntity: false };
      }

      return {
        hasEntity: !!looked,
        targets: [
          // Light on what you look at, fading with distance
          { level: getFarLightLevel(power, farDistance), candidates: farCandidates },
          // Dim light at yourself
          {
            level: SELF_LIGHT_LEVEL,
            candidates: [
              { x: hx, y: hy, z: hz },
              { x: hx, y: Math.floor(player.location.y + 0.3), z: hz }
            ]
          }
        ]
      };
    } catch (e) {
      // Unloaded chunk or nothing targetable: no cursor light
      return { targets: [], hasEntity: false };
    }
  }

  // Head mode: just above the head, falling back to torso level
  const x = Math.floor(player.location.x);
  const z = Math.floor(player.location.z);
  return {
    hasEntity: false,
    targets: [
      {
        level: power,
        candidates: [
          { x, y: Math.floor(player.location.y + 1.6), z },
          { x, y: Math.floor(player.location.y + 0.3), z }
        ]
      }
    ]
  };
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

      // Cursor mode: skip the raycasts while your view is unchanged (and no entity is lit)
      let cacheKey = null;
      if (LIGHT_MODE === "cursor") {
        const eye = player.getHeadLocation();
        const dir = player.getViewDirection();
        cacheKey = [
          eye.x.toFixed(1), eye.y.toFixed(1), eye.z.toFixed(1),
          dir.x.toFixed(2), dir.y.toFixed(2), dir.z.toFixed(2),
          power, dim.id
        ].join(",");
        const cached = cursorCache.get(playerId);
        if (
          cached &&
          cached.key === cacheKey &&
          !cached.hasEntity &&
          system.currentTick - cached.tick < CURSOR_REFRESH_TICKS
        ) {
          continue;
        }
      }

      const { targets, hasEntity } = getLightTargets(player, power);
      if (cacheKey) {
        cursorCache.set(playerId, { key: cacheKey, tick: system.currentTick, hasEntity });
      }

      // Cursor mode with nothing in view: no light
      if (targets.length === 0) {
        removePlayerLight(playerId, true);
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
