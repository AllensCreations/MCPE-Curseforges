import { system, world } from "@minecraft/server";
import { TUTORIAL_BLOCKS, tickCounter } from "./config.js";
import { getDimKey, getCardinalFromCoords } from "./helpers.js";
import { buildThemedIsland } from "./island-builder.js";
import { getIslandLocation, isIslandPhysicallyBuilt } from "./island-layout.js";
import { OVERWORLD_ISLAND_ORDER, ISLAND_THEMES } from "./island-themes.js";

function islandRebuildAllowed(themeId) {
  return world.getDynamicProperty(`island_ob_x_${themeId}`) === undefined &&
    !world.getDynamicProperty(`island_ob_completed_${themeId}`);
}

export function materializeIsland(dimension, theme, phaseIndex, totalCount) {
  try {
    const dimKey = getDimKey(dimension.id);
    const lastX = world.getDynamicProperty(`last_island_x_${dimKey}`) ?? world.getDynamicProperty("last_island_x");
    const lastZ = world.getDynamicProperty(`last_island_z_${dimKey}`) ?? world.getDynamicProperty("last_island_z");
    const lastPos = (lastX !== undefined && lastZ !== undefined) ? { x: lastX, z: lastZ } : null;

    const islandLoc = getIslandLocation(phaseIndex + Math.floor(totalCount / 100), 42, theme, lastPos);

    // Record this island as the last materialized island in dimension & globally
    world.setDynamicProperty(`last_island_x_${dimKey}`, islandLoc.center.x);
    world.setDynamicProperty(`last_island_z_${dimKey}`, islandLoc.center.z);
    world.setDynamicProperty("last_island_x", islandLoc.center.x);
    world.setDynamicProperty("last_island_z", islandLoc.center.z);

    // Store active island target in world dynamic properties for navigation/arrival
    world.setDynamicProperty(`island_spawned_${theme.id}`, true);
    world.setDynamicProperty(`island_target_x_${theme.id}`, islandLoc.center.x);
    world.setDynamicProperty(`island_target_y_${theme.id}`, islandLoc.center.y);
    world.setDynamicProperty(`island_target_z_${theme.id}`, islandLoc.center.z);

    const cardinal = getCardinalFromCoords(islandLoc.center.x, islandLoc.center.z);

    // 1. GUARANTEED IMMEDIATE ANNOUNCEMENT & CELESTIAL AMETHYST CHIME (COMPASS COMPLETELY REMOVED)
    const dimPlayers = world.getAllPlayers().filter(p => p.dimension.id === dimension.id);
    for (const p of dimPlayers) {
      try {
        // Celestial Rift Sound FX & Amethyst Chime
        p.playSound("block.amethyst_block.chime", { pitch: 1.0, volume: 1.0 });
        p.playSound("block.amethyst_block.resonate", { pitch: 1.1, volume: 0.8 });
        p.playSound("ambient.weather.wind", { pitch: 0.9, volume: 0.5 });

        // Small announcement: action bar only (no big centered title)
        p.onScreenDisplay.setActionBar(`§d✦ A new island has materialized in the §b${cardinal}§d! Follow the starlight trail.`);
      } catch (pe) {}
    }

    // 2. Shooting Starlight Trail: Particle stream shooting 30 blocks from OneBlock towards the new island
    try {
      const dx = islandLoc.center.x;
      const dz = islandLoc.center.z;
      const dist = Math.sqrt(dx * dx + dz * dz) || 1;
      const normX = dx / dist;
      const normZ = dz / dist;
      for (let step = 1; step <= 30; step++) {
        system.runTimeout(() => {
          try {
            const px = 0.5 + normX * step;
            const py = 65.5 + Math.sin((step / 30) * Math.PI) * 4;
            const pz = 0.5 + normZ * step;
            dimension.spawnParticle("minecraft:endrod", { x: px, y: py, z: pz });
            dimension.spawnParticle("minecraft:portal_particle", { x: px, y: py, z: pz });
          } catch (e) {}
        }, Math.floor(step * 1.5));
      }
    } catch (pe) {}

    // 3. PHYSICAL MATERIALIZATION & CHUNK PRELOAD:
    // First, try immediate build if chunk is already loaded (e.g. inner 42m ring)
    try {
      const placed = buildThemedIsland(dimension, theme, islandLoc.center);
      if (placed > 0) {
        world.setDynamicProperty(`island_built_${theme.id}`, true);
      }
    } catch (ie1) {}

    // Also attempt temporary ticking area to preload chunk and guarantee immediate materialization:
    const areaName = `temp_isl_${theme.id.slice(0, 8)}`;
    try { dimension.runCommand(`tickingarea remove ${areaName}`); } catch (e) {}
    try { dimension.runCommand(`tickingarea add circle ${islandLoc.center.x} ${islandLoc.center.y} ${islandLoc.center.z} 3 ${areaName} true`); } catch (e) {}

    const retryDelays = [20, 60, 120, 200];
    const attemptBuild = (attempt) => {
      let finished = false;
      try {
        if (!islandRebuildAllowed(theme.id) || isIslandPhysicallyBuilt(dimension, islandLoc.center)) {
          finished = true;
        } else {
          const placed = buildThemedIsland(dimension, theme, islandLoc.center);
          if (placed > 0) {
            world.setDynamicProperty(`island_built_${theme.id}`, true);
            finished = true;
          }
        }
      } catch (ie2) {}
      if (finished || attempt >= retryDelays.length - 1) {
        try { dimension.runCommand(`tickingarea remove ${areaName}`); } catch (e) {}
      } else {
        system.runTimeout(() => attemptBuild(attempt + 1), retryDelays[attempt + 1] - retryDelays[attempt]);
      }
    };
    system.runTimeout(() => attemptBuild(0), retryDelays[0]);
  } catch (err) {}
}

export function checkRandomIslandSpawn(dimension, phaseIndex, totalCount) {
  try {
    const dimKey = getDimKey(dimension.id);
    const targetDim = (dimKey === "nether") ? "nether" : ((dimKey === "end") ? "the_end" : "overworld");

    // Avoid triggering island rifts during tutorial and early starter phases (up to Phase 3) in overworld
    if (dimKey === "overworld" && (totalCount < TUTORIAL_BLOCKS.length || phaseIndex <= 3)) return;

    // 1. Track blocks mined since last island spawn in this dimension:
    const lastMineProp = `last_island_mine_count_${dimKey}`;
    const lastMineCount = world.getDynamicProperty(lastMineProp) ?? 0;
    const blocksSinceLast = totalCount - lastMineCount;

    // 2. Dynamic Pity timer: roughly 1 island per 120 blocks mined (~0.8% chance per block)
    const isPity = (blocksSinceLast >= 120);
    const isRandom = (Math.random() < 0.008);

    if (!isPity && !isRandom) return;

    let selectedTheme = null;

    if (targetDim === "overworld") {
      // STRICT SEQUENTIAL CIRCLE PROGRESSION:
      // Focus on Circle 1 first (Ring 1, 6 islands, r=72m).
      // Only when ALL 6 islands of Circle 1 are materialized, advance to Circle 2 (Ring 2, 8 islands, r=125m)!
      // Only when ALL 8 islands of Circle 2 are materialized, advance to Circle 3 (Ring 3, 10 islands, r=180m)!
      // Only when ALL 10 islands of Circle 3 are materialized, advance to Circle 4 (Ring 4, 9 islands, r=240m) until the end!
      const circles = [
        OVERWORLD_ISLAND_ORDER.slice(0, 6),   // Circle 1 (r=72m): sky_oasis, cherry, mushroom, desert_well, bamboo, bee
        OVERWORLD_ISLAND_ORDER.slice(6, 14),  // Circle 2 (r=125m): pumpkin, melon, bakery, aquarium, crypt, badlands, ice, jungle
        OVERWORLD_ISLAND_ORDER.slice(14, 24), // Circle 3 (r=180m): deepslate, fossil, blacksmith, armory, spider, creeper, slime, geode, witch, watchtower
        OVERWORLD_ISLAND_ORDER.slice(24, 33)  // Circle 4 (r=240m): monument, library, alchemist, trial, pale, sculk, tuff, pantheon, stronghold
      ];

      for (const circleIds of circles) {
        for (const id of circleIds) {
          if (!world.getDynamicProperty(`island_spawned_${id}`)) {
            selectedTheme = ISLAND_THEMES.find(t => t.id === id);
            break;
          }
        }
        if (selectedTheme) break; // Found next unspawned island in current active circle!
      }
    } else if (targetDim === "nether") {
      const netherThemes = ISLAND_THEMES.filter(t => t.dimension === "nether");
      for (const t of netherThemes) {
        if (!world.getDynamicProperty(`island_spawned_${t.id}`)) {
          selectedTheme = t;
          break;
        }
      }
    } else {
      const endThemes = ISLAND_THEMES.filter(t => t.dimension === "the_end");
      for (const t of endThemes) {
        if (!world.getDynamicProperty(`island_spawned_${t.id}`)) {
          selectedTheme = t;
          break;
        }
      }
    }

    if (!selectedTheme) return;

    // Mark spawned and record mine count for this dimension
    world.setDynamicProperty(`island_spawned_${selectedTheme.id}`, true);
    world.setDynamicProperty(lastMineProp, totalCount);

    materializeIsland(dimension, selectedTheme, phaseIndex, totalCount);
  } catch (err) {}
}

// =========================================================================
// ISLAND DISCOVERY & ARRIVAL REGISTRATION SYSTEM
// =========================================================================

function triggerIslandRegistration(player, matchedTheme, blockPos) {
  try {
    const dimension = player.dimension;
    const loc = blockPos || {
      x: world.getDynamicProperty(`island_target_x_${matchedTheme.id}`) ?? player.location.x,
      y: (world.getDynamicProperty(`island_target_y_${matchedTheme.id}`) ?? 65),
      z: world.getDynamicProperty(`island_target_z_${matchedTheme.id}`) ?? player.location.z
    };

    const regKey = `island_registered_${matchedTheme.id}`;
    if (world.getDynamicProperty(regKey)) return; // Already registered
    world.setDynamicProperty(regKey, true);

    // Launch celebration fireworks
    try {
      for (let i = 0; i < 5; i++) {
        system.runTimeout(() => {
          try {
            dimension.spawnEntity("minecraft:fireworks_rocket", {
              x: loc.x + 0.5 + (Math.random() - 0.5) * 3,
              y: loc.y + 1.5,
              z: loc.z + 0.5 + (Math.random() - 0.5) * 3
            });
          } catch (fe) {}
        }, i * 8);
      }
    } catch (fwe) {}

    // Totem dissolving particles on player
    try {
      dimension.spawnParticle("minecraft:totem_particle", {
        x: player.location.x,
        y: player.location.y + 1,
        z: player.location.z
      });
    } catch (pe) {}

    // Audio & Visual Discovery Alert
    player.playSound("ui.toast.challenge_complete", { pitch: 1.2, volume: 1.0 });
    player.playSound("random.levelup", { pitch: 1.5, volume: 1.0 });

    const sizeStr = matchedTheme.size ? matchedTheme.size.toUpperCase() : "MEDIUM";
    player.onScreenDisplay.setActionBar(`§6Island discovered: §a${matchedTheme.name} §7(${sizeStr})`);
    player.sendMessage(`\n§6★ [Island Discovered] §aYou arrived at §e§l${matchedTheme.name}§r§a!`);
    player.sendMessage(`§7The island monument is now unlocked! Enjoy your rewards in the treasure chest!\n`);
  } catch (err) {}
}

// Proactive Auto-Discovery & Chunk Preloading on Arrival
const activeIslandTargetCache = new Map();

let lastCacheRefresh = 0;

function getActiveSpawnedIslands() {
  if (tickCounter - lastCacheRefresh > 5 || activeIslandTargetCache.size === 0) {
    lastCacheRefresh = tickCounter;
    activeIslandTargetCache.clear();
    for (const t of ISLAND_THEMES) {
      const tx = world.getDynamicProperty(`island_target_x_${t.id}`);
      const tz = world.getDynamicProperty(`island_target_z_${t.id}`);
      if (tx !== undefined && tz !== undefined) {
        const ty = world.getDynamicProperty(`island_target_y_${t.id}`) ?? 64;
        let arrivalDist = 8.5;
        if (t.size === "huge") arrivalDist = 14.0;
        else if (t.size === "big") arrivalDist = 11.0;
        else if (t.size === "medium") arrivalDist = 8.5;
        else if (t.size === "compact") arrivalDist = 6.5;
        const isRegistered = world.getDynamicProperty(`island_registered_${t.id}`) === true;
        activeIslandTargetCache.set(t.id, { theme: t, tx, ty, tz, arrivalDist, isRegistered });
      }
    }
  }
  return activeIslandTargetCache;
}

export function islandArrivalTick() {
  try {
    const activeIslands = getActiveSpawnedIslands();
    if (activeIslands.size === 0) return;

    for (const player of world.getAllPlayers()) {
      const pLoc = player.location;
      const dimKey = getDimKey(player.dimension.id);
      const targetDim = (dimKey === "nether") ? "nether" : ((dimKey === "end") ? "the_end" : "overworld");

      for (const [themeId, data] of activeIslands) {
        if ((data.theme.dimension || "overworld") !== targetDim) continue;
        const dist = Math.hypot(pLoc.x - data.tx, pLoc.z - data.tz);

        // Proactive building: If player is within 100 blocks of island target (8-chunk sim distance = 128 blocks)
        if (dist <= 100) {
          const center = { x: data.tx, y: data.ty, z: data.tz };
          if (islandRebuildAllowed(data.theme.id) && !isIslandPhysicallyBuilt(player.dimension, center)) {
            const placed = buildThemedIsland(player.dimension, data.theme, center);
            if (placed > 0) {
              world.setDynamicProperty(`island_built_${data.theme.id}`, true);
            }
          }
        }

        if (!data.isRegistered && dist <= data.arrivalDist) {
          triggerIslandRegistration(player, data.theme, { x: data.tx, y: data.ty, z: data.tz });
          data.isRegistered = true;
          break;
        }
      }
    }
  } catch (e) {}
}
