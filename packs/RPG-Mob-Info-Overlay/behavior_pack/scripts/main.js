/**
 * RPG-Style Mob Information Overlay
 * Specialized Bedrock Script API (@minecraft/server version 1.13.0+)
 * Created by AllensCreations
 */

import { world, system, EntityComponentTypes } from "@minecraft/server";

// ============================================================================
// 1. CONFIGURATION & CONSTANTS
// ============================================================================

const MARKER_TYPE_ID = "sl:status_marker";
const RAYCAST_MAX_DISTANCE = 12;
const TICK_INTERVAL = 3; // Efficient 3-tick interval (~6.6 checks/sec)

// Types to ignore during view raycasting
const IGNORED_TYPE_IDS = new Set([
  MARKER_TYPE_ID,
  "minecraft:player",
  "minecraft:item",
  "minecraft:xp_orb",
  "minecraft:arrow",
  "minecraft:snowball",
  "minecraft:egg",
  "minecraft:splash_potion",
  "minecraft:lingering_potion",
  "minecraft:ender_pearl",
  "minecraft:eye_of_ender_signal",
  "minecraft:lightning_bolt",
  "minecraft:area_effect_cloud",
  "minecraft:evocation_fangs",
  "minecraft:fishing_hook"
]);

// ============================================================================
// 2. HELPER MAPPING DICTIONARIES
// ============================================================================

/**
 * Rank definitions with colors and display labels
 */
export const RANK_INFO = {
  E: { code: "E-RANK", color: "§7", label: "§7E-RANK" },   // Gray (Common passive/weak)
  D: { code: "D-RANK", color: "§a", label: "§aD-RANK" },   // Green (Moderate passive/weak hostile)
  C: { code: "C-RANK", color: "§b", label: "§bC-RANK" },   // Aqua (Standard hostile)
  B: { code: "B-RANK", color: "§e", label: "§eB-RANK" },   // Yellow (Dangerous hostile / Elite)
  A: { code: "A-RANK", color: "§6", label: "§6A-RANK" },   // Gold (High tier / Miniboss)
  S: { code: "S-RANK", color: "§c", label: "§cS-RANK" }    // Red / Calamitous (Bosses / Ancient horrors)
};

/**
 * Behavior classification mapping (Passive, Neutral, Hostile)
 */
export const BEHAVIOR_TYPES = {
  // --- PASSIVE ---
  "minecraft:cow": "Passive",
  "minecraft:sheep": "Passive",
  "minecraft:pig": "Passive",
  "minecraft:chicken": "Passive",
  "minecraft:horse": "Passive",
  "minecraft:donkey": "Passive",
  "minecraft:mule": "Passive",
  "minecraft:rabbit": "Passive",
  "minecraft:bat": "Passive",
  "minecraft:parrot": "Passive",
  "minecraft:squid": "Passive",
  "minecraft:glow_squid": "Passive",
  "minecraft:villager": "Passive",
  "minecraft:wandering_trader": "Passive",
  "minecraft:cod": "Passive",
  "minecraft:salmon": "Passive",
  "minecraft:tropicalfish": "Passive",
  "minecraft:pufferfish": "Passive",
  "minecraft:axolotl": "Passive",
  "minecraft:frog": "Passive",
  "minecraft:tadpole": "Passive",
  "minecraft:allay": "Passive",
  "minecraft:cat": "Passive",
  "minecraft:ocelot": "Passive",
  "minecraft:strider": "Passive",
  "minecraft:mooshroom": "Passive",
  "minecraft:fox": "Passive",
  "minecraft:camel": "Passive",
  "minecraft:sniffer": "Passive",
  "minecraft:armadillo": "Passive",

  // --- NEUTRAL ---
  "minecraft:wolf": "Neutral",
  "minecraft:polar_bear": "Neutral",
  "minecraft:panda": "Neutral",
  "minecraft:bee": "Neutral",
  "minecraft:iron_golem": "Neutral",
  "minecraft:snow_golem": "Neutral",
  "minecraft:dolphin": "Neutral",
  "minecraft:llama": "Neutral",
  "minecraft:trader_llama": "Neutral",
  "minecraft:enderman": "Neutral",
  "minecraft:zombie_pigman": "Neutral",
  "minecraft:piglin": "Neutral",
  "minecraft:goat": "Neutral",
  "minecraft:spider": "Neutral", // Neutral in daytime, Hostile in dark
  "minecraft:cave_spider": "Neutral",

  // --- HOSTILE ---
  "minecraft:zombie": "Hostile",
  "minecraft:zombie_villager": "Hostile",
  "minecraft:husk": "Hostile",
  "minecraft:drowned": "Hostile",
  "minecraft:skeleton": "Hostile",
  "minecraft:stray": "Hostile",
  "minecraft:wither_skeleton": "Hostile",
  "minecraft:creeper": "Hostile",
  "minecraft:slime": "Hostile",
  "minecraft:magma_cube": "Hostile",
  "minecraft:witch": "Hostile",
  "minecraft:blaze": "Hostile",
  "minecraft:ghast": "Hostile",
  "minecraft:phantom": "Hostile",
  "minecraft:silverfish": "Hostile",
  "minecraft:endermite": "Hostile",
  "minecraft:guardian": "Hostile",
  "minecraft:elder_guardian": "Hostile",
  "minecraft:shulker": "Hostile",
  "minecraft:vindicator": "Hostile",
  "minecraft:evoker": "Hostile",
  "minecraft:pillager": "Hostile",
  "minecraft:ravager": "Hostile",
  "minecraft:vex": "Hostile",
  "minecraft:piglin_brute": "Hostile",
  "minecraft:hoglin": "Hostile",
  "minecraft:zoglin": "Hostile",
  "minecraft:warden": "Hostile",
  "minecraft:wither": "Hostile",
  "minecraft:ender_dragon": "Hostile",
  "minecraft:breeze": "Hostile",
  "minecraft:bogged": "Hostile"
};

/**
 * Rank mapping dictionary based on entity type ID
 */
export const MOB_RANKS = {
  // S-Rank (Bosses, Ancient Terrors, Calamitous)
  "minecraft:warden": "S",
  "minecraft:wither": "S",
  "minecraft:ender_dragon": "S",
  "minecraft:elder_guardian": "S",

  // A-Rank (Raid leaders, high threat brutes & constructs)
  "minecraft:ravager": "A",
  "minecraft:evoker": "A",
  "minecraft:iron_golem": "A",
  "minecraft:piglin_brute": "A",

  // B-Rank (Dangerous nether/end monsters & elite forces)
  "minecraft:wither_skeleton": "B",
  "minecraft:blaze": "B",
  "minecraft:ghast": "B",
  "minecraft:enderman": "B",
  "minecraft:shulker": "B",
  "minecraft:vindicator": "B",
  "minecraft:guardian": "B",
  "minecraft:breeze": "B",
  "minecraft:witch": "B",

  // C-Rank (Standard nighttime hostile mobs)
  "minecraft:creeper": "C",
  "minecraft:skeleton": "C",
  "minecraft:stray": "C",
  "minecraft:bogged": "C",
  "minecraft:zombie": "C",
  "minecraft:husk": "C",
  "minecraft:drowned": "C",
  "minecraft:spider": "C",
  "minecraft:cave_spider": "C",
  "minecraft:phantom": "C",
  "minecraft:pillager": "C",
  "minecraft:piglin": "C",
  "minecraft:hoglin": "C",
  "minecraft:zoglin": "C",
  "minecraft:zombie_pigman": "C",

  // D-Rank (Low-threat hostiles & large neutrals/pets)
  "minecraft:slime": "D",
  "minecraft:magma_cube": "D",
  "minecraft:silverfish": "D",
  "minecraft:endermite": "D",
  "minecraft:vex": "D",
  "minecraft:wolf": "D",
  "minecraft:polar_bear": "D",
  "minecraft:horse": "D",
  "minecraft:camel": "D",
  "minecraft:sniffer": "D",
  "minecraft:llama": "D",
  "minecraft:goat": "D",
  "minecraft:panda": "D",
  "minecraft:dolphin": "D",

  // E-Rank (Common passive livestock & ambient wildlife)
  "minecraft:cow": "E",
  "minecraft:sheep": "E",
  "minecraft:pig": "E",
  "minecraft:chicken": "E",
  "minecraft:rabbit": "E",
  "minecraft:bat": "E",
  "minecraft:parrot": "E",
  "minecraft:squid": "E",
  "minecraft:glow_squid": "E",
  "minecraft:villager": "E",
  "minecraft:wandering_trader": "E",
  "minecraft:cod": "E",
  "minecraft:salmon": "E",
  "minecraft:tropicalfish": "E",
  "minecraft:pufferfish": "E",
  "minecraft:axolotl": "E",
  "minecraft:frog": "E",
  "minecraft:tadpole": "E",
  "minecraft:allay": "E",
  "minecraft:cat": "E",
  "minecraft:ocelot": "E",
  "minecraft:strider": "E",
  "minecraft:mooshroom": "E",
  "minecraft:fox": "E",
  "minecraft:armadillo": "E",
  "minecraft:snow_golem": "E",
  "minecraft:bee": "E"
};

/**
 * Threat level scale mapping
 */
export const THREAT_LEVELS = {
  S: "§4Super High (Calamitous)",
  A: "§cHigh",
  B: "§6Moderate",
  C: "§eLow",
  D: "§aLow",
  E: "§7Very Low"
};

// ============================================================================
// 3. FORMATTING HELPERS
// ============================================================================

/**
 * Formats entity typeId into clean uppercase display name
 * @param {string} typeId
 * @returns {string}
 */
function formatMobName(typeId) {
  const raw = typeId.replace(/^.*:/, "");
  return raw.replace(/_/g, " ").toUpperCase();
}

/**
 * Generates a 10-pip visual health bar with numerical readout
 * @param {number} current
 * @param {number} max
 * @returns {string} Example: "§c[■■■■■■□□□□] §f12/20 HP"
 */
function generateHealthBar(current, max) {
  const safeCurrent = Math.max(0, current);
  const safeMax = Math.max(1, max);
  const fraction = Math.min(1.0, safeCurrent / safeMax);
  const filledPips = Math.round(fraction * 10);
  const emptyPips = 10 - filledPips;

  // Choose health bar tint based on health percentage
  let pipColor = "§a"; // Green (Healthy)
  if (fraction <= 0.25) {
    pipColor = "§c"; // Red (Critical)
  } else if (fraction <= 0.5) {
    pipColor = "§e"; // Yellow (Injured)
  }

  const filledStr = "■".repeat(filledPips);
  const emptyStr = "□".repeat(emptyPips);

  return `${pipColor}[${filledStr}§8${emptyStr}${pipColor}] §f${Math.ceil(safeCurrent)}/${Math.ceil(safeMax)} HP`;
}

/**
 * Estimates height offset so marker floats neatly above entity's head
 * @param {import("@minecraft/server").Entity} entity
 * @returns {number}
 */
function getEntityHeadOffset(entity) {
  const typeId = entity.typeId;
  if (typeId === "minecraft:warden") return 3.4;
  if (typeId === "minecraft:ender_dragon") return 4.0;
  if (typeId === "minecraft:wither") return 3.8;
  if (typeId === "minecraft:iron_golem" || typeId === "minecraft:ravager") return 3.2;
  if (typeId === "minecraft:ghast") return 4.5;
  if (typeId === "minecraft:enderman") return 3.1;
  if (typeId === "minecraft:horse" || typeId === "minecraft:camel" || typeId === "minecraft:sniffer") return 2.6;
  if (typeId === "minecraft:spider" || typeId === "minecraft:cave_spider") return 1.1;
  if (typeId === "minecraft:bat" || typeId === "minecraft:bee" || typeId === "minecraft:parrot" || typeId === "minecraft:chicken" || typeId === "minecraft:rabbit") return 0.9;
  return 2.2; // Standard biped & humanoid height
}

/**
 * Constructs the exact 3-line RPG nametag string
 * @param {import("@minecraft/server").Entity} target
 * @param {number} currentHp
 * @param {number} maxHp
 * @returns {string}
 */
function buildOverlayText(target, currentHp, maxHp) {
  const typeId = target.typeId;
  const mobName = formatMobName(typeId);
  const rankKey = MOB_RANKS[typeId] || "E";
  const rank = RANK_INFO[rankKey] || RANK_INFO.E;
  const behavior = BEHAVIOR_TYPES[typeId] || (rankKey === "S" || rankKey === "A" || rankKey === "B" || rankKey === "C" ? "Hostile" : "Neutral");
  const threat = THREAT_LEVELS[rankKey] || "§7Very Low";

  // Line 1: [ <RANK> ] <MOB_NAME> (<BEHAVIOR_TYPE>)
  const line1 = `[ ${rank.label} §f] ${mobName} (${behavior})`;

  // Line 2: Visual Health Bar + Current/Max numerical HP
  const line2 = generateHealthBar(currentHp, maxHp);

  // Line 3: Threat Level
  const line3 = `§fThreat: ${threat}`;

  return `${line1}\n${line2}\n${line3}`;
}

// ============================================================================
// 4. PLAYER TRACKING STATE & CORE LOOP
// ============================================================================

/**
 * Tracks marker entities attached to players
 * Key: Player ID (string)
 * Value: { marker: Entity, targetId: string }
 * @type {Map<string, { marker: import("@minecraft/server").Entity, targetId: string }>}
 */
const activeOverlays = new Map();

/**
 * Safely despawns marker entity associated with a player
 * @param {string} playerId
 */
function clearOverlay(playerId) {
  const state = activeOverlays.get(playerId);
  if (!state) return;

  try {
    if (state.marker && state.marker.isValid()) {
      state.marker.remove();
    }
  } catch (err) {
    // Entity might already be removed
  }

  activeOverlays.delete(playerId);
}

/**
 * Main update routine executed every TICK_INTERVAL ticks
 */
function onTick() {
  const players = world.getAllPlayers();
  const activePlayerIds = new Set();

  for (const player of players) {
    if (!player.isValid()) continue;
    activePlayerIds.add(player.id);

    // 1. Raycast entities from player's view direction
    let hits = [];
    try {
      hits = player.getEntitiesFromViewDirection({
        maxDistance: RAYCAST_MAX_DISTANCE
      });
    } catch (e) {
      hits = [];
    }

    // 2. Filter out invalid/ignored targets
    let validTarget = null;
    for (const hit of hits) {
      const ent = hit.entity;
      if (!ent || !ent.isValid()) continue;
      if (ent.id === player.id) continue;
      if (IGNORED_TYPE_IDS.has(ent.typeId)) continue;

      validTarget = ent;
      break;
    }

    // 3. If no target found, remove active marker
    if (!validTarget) {
      clearOverlay(player.id);
      continue;
    }

    // 4. Read target health
    let currentHp = 20;
    let maxHp = 20;
    try {
      const healthComp = validTarget.getComponent(EntityComponentTypes.Health);
      if (healthComp) {
        currentHp = healthComp.currentValue;
        maxHp = healthComp.effectiveMax;
      }
    } catch (e) {
      // Fallback
    }

    // If target has zero or negative health (dying), remove overlay
    if (currentHp <= 0) {
      clearOverlay(player.id);
      continue;
    }

    // 5. Calculate floating position directly above target head
    const targetLoc = validTarget.location;
    const yOffset = getEntityHeadOffset(validTarget);
    const markerLoc = {
      x: targetLoc.x,
      y: targetLoc.y + yOffset,
      z: targetLoc.z
    };

    const overlayText = buildOverlayText(validTarget, currentHp, maxHp);
    const existing = activeOverlays.get(player.id);

    // 6. Reuse or spawn marker entity
    if (existing && existing.marker && existing.marker.isValid()) {
      try {
        existing.marker.teleport(markerLoc, { dimension: validTarget.dimension });
        existing.marker.nameTag = overlayText;
        existing.targetId = validTarget.id;
      } catch (err) {
        // If teleport failed, respawn
        clearOverlay(player.id);
        spawnNewMarker(player, validTarget, markerLoc, overlayText);
      }
    } else {
      spawnNewMarker(player, validTarget, markerLoc, overlayText);
    }
  }

  // Despawn markers for disconnected players
  for (const playerId of activeOverlays.keys()) {
    if (!activePlayerIds.has(playerId)) {
      clearOverlay(playerId);
    }
  }
}

/**
 * Spawns a new marker entity above target and stores state
 * @param {import("@minecraft/server").Player} player
 * @param {import("@minecraft/server").Entity} target
 * @param {import("@minecraft/server").Vector3} location
 * @param {string} text
 */
function spawnNewMarker(player, target, location, text) {
  try {
    const marker = target.dimension.spawnEntity(MARKER_TYPE_ID, location);
    marker.nameTag = text;
    activeOverlays.set(player.id, {
      marker: marker,
      targetId: target.id
    });
  } catch (err) {
    // Dimension might be unloaded or marker entity type not registered
  }
}

// ============================================================================
// 5. EVENT CLEANUP LISTENERS
// ============================================================================

// Clean up markers immediately when entities die
world.afterEvents.entityDie.subscribe((event) => {
  const deadId = event.deadEntity?.id;
  if (!deadId) return;

  for (const [playerId, state] of activeOverlays.entries()) {
    if (state.targetId === deadId || state.marker?.id === deadId) {
      clearOverlay(playerId);
    }
  }
});

// Clean up when player leaves
world.afterEvents.playerLeave.subscribe((event) => {
  clearOverlay(event.playerId);
});

// Cleanup any lingering status markers on initialization
system.run(() => {
  try {
    for (const dimName of ["overworld", "nether", "the_end"]) {
      try {
        const dim = world.getDimension(dimName);
        if (dim) {
          const markers = dim.getEntities({ type: MARKER_TYPE_ID });
          for (const m of markers) {
            m.remove();
          }
        }
      } catch (de) {}
    }
  } catch (e) {}
});

// Start optimized interval loop
system.runInterval(onTick, TICK_INTERVAL);

