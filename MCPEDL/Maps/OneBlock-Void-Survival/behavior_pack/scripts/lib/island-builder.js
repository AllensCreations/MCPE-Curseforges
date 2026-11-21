import { world } from "@minecraft/server";
import { safeAirOnlySetBlock, getSubsoilBlock, getRockBlock, placeLanternWithFence, buildStats, getIslandArchetype, placeSurfaceVegetation, getOreBlock, getIslandBlockPool, decorateSteppingPaths, getThemeFenceType, getThemeLanternType, PASSABLE_BLOCKS, isPassableBlock } from "./island-blocks.js";
import { isIslandFootprintLoaded } from "./island-layout.js";
import { buildThemedStructure, spawnMobSafe } from "./island-structures.js";
import { buildIslandNaturalTree } from "./island-trees.js";

// =========================================================================
// ADVANCED TERRAFORMING: MICRO-CAVERNS, SATELLITE ISLETS & PATHS
// =========================================================================

function buildMicroCave(dimension, theme, center, seed) {
  const { x: cx, y: cy, z: cz } = center;
  const caveAngle = ((seed * 17) % 360) * (Math.PI / 180);
  const caveDist = theme.size === "huge" ? 3.5 : 2.5;
  const caveX = cx + Math.round(caveDist * Math.cos(caveAngle));
  const caveZ = cz + Math.round(caveDist * Math.sin(caveAngle));
  const caveY = cy - 3; // 3 blocks below surface, safely inside rock mantle

  const caveRadius = theme.size === "huge" ? 2.6 : 2.0;

  // Carve hollow ellipsoid cavern
  for (let dx = -3; dx <= 3; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      for (let dz = -3; dz <= 3; dz++) {
        const d = Math.sqrt(dx * dx + (dy * 1.4) * (dy * 1.4) + dz * dz);
        if (d <= caveRadius) {
          const block = dimension.getBlock({ x: caveX + dx, y: caveY + dy, z: caveZ + dz });
          if (block && !block.isAir && block.typeId !== "minecraft:lodestone" && block.typeId !== "minecraft:chest") {
            block.setType("minecraft:air");
          }
        }
      }
    }
  }

  // Populate Cave Features: Pointed dripstones, glowing lichen, and high-value ore veins!
  try {
    // Minimalized 1-2 Pointed Dripstones per island with guaranteed solid block directly above (never air)
    let dripstonePlaced = 0;
    const maxDripstones = 1 + (seed % 2); // strictly 1 to 2 dripstones
    const dripCandidates = [
      { ox: 0, oz: 0 },
      { ox: 1, oz: 0 },
      { ox: -1, oz: -1 }
    ];
    for (const cand of dripCandidates) {
      if (dripstonePlaced >= maxDripstones) break;
      const ceilPos = { x: caveX + cand.ox, y: caveY + 2, z: caveZ + cand.oz };
      const dripPos = { x: caveX + cand.ox, y: caveY + 1, z: caveZ + cand.oz };
      const ceilBlock = dimension.getBlock(ceilPos);
      if (ceilBlock) {
        // Ensure the top of the dripstone is always solid non-air
        if (ceilBlock.isAir) {
          ceilBlock.setType("minecraft:dripstone_block");
        }
        const b = dimension.getBlock(dripPos);
        if (b && b.isAir) {
          b.setType("minecraft:pointed_dripstone");
          dripstonePlaced++;
        }
      }
    }

    // Exposed Rare Ore Clump in Cave Wall
    const rareOre = theme.tier >= 3 ? "minecraft:deepslate_diamond_ore" : (theme.tier === 2 ? "minecraft:deepslate_gold_ore" : "minecraft:deepslate_iron_ore");
    safeAirOnlySetBlock(dimension, { x: caveX + 2, y: caveY, z: caveZ }, rareOre);
    safeAirOnlySetBlock(dimension, { x: caveX + 2, y: caveY + 1, z: caveZ }, rareOre);

    // Subtle cave glow (Glow lichen)
    safeAirOnlySetBlock(dimension, { x: caveX, y: caveY - 1, z: caveZ }, "minecraft:glow_lichen");
    safeAirOnlySetBlock(dimension, { x: caveX, y: caveY, z: caveZ - 2 }, "minecraft:glow_lichen");
  } catch (ce) {}
}

function buildSatelliteIslet(dimension, theme, center, maxR, seed, index) {
  const { x: cx, y: cy, z: cz } = center;
  const angle = (((seed * 37 + index * 131) % 360) * Math.PI) / 180;
  const distance = maxR + 5 + (seed % 3);
  const sx = cx + Math.round(distance * Math.cos(angle));
  const sz = cz + Math.round(distance * Math.sin(angle));
  const sy = cy - (index === 0 ? 1 : 2);

  const satR = index === 0 ? 2.4 : 1.8;

  // Build mini asteroid rock
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      const d = Math.sqrt(dx * dx + dz * dz);
      if (d <= satR) {
        // Surface
        safeAirOnlySetBlock(dimension, { x: sx + dx, y: sy, z: sz + dz }, theme.floor);
        // Subsurface depth
        const satDepth = Math.max(1, Math.round((satR - d) * 1.5));
        for (let dy = 1; dy <= satDepth; dy++) {
          const mat = dy === 1 ? getSubsoilBlock(theme, dx, dz, seed) : getRockBlock(theme, dx, dz, dy, seed);
          safeAirOnlySetBlock(dimension, { x: sx + dx, y: sy - dy, z: sz + dz }, mat);
        }
        // Hanging stalactite tip
        if (d <= 1.0) {
          safeAirOnlySetBlock(dimension, { x: sx + dx, y: sy - satDepth - 1, z: sz + dz }, "minecraft:cobbled_deepslate");
        }
      }
    }
  }

  // Hanging Iron Chains Tether (connecting edge of main island to satellite)
  if (index === 0) {
    const mainEdgeX = cx + Math.round((maxR - 0.5) * Math.cos(angle));
    const mainEdgeZ = cz + Math.round((maxR - 0.5) * Math.sin(angle));
    const steps = 4;
    for (let s = 1; s <= steps; s++) {
      const t = s / (steps + 1);
      const chainX = Math.round(mainEdgeX + (sx - mainEdgeX) * t);
      const chainZ = Math.round(mainEdgeZ + (sz - mainEdgeZ) * t);
      const sag = Math.round(Math.sin(t * Math.PI) * 1.2);
      safeAirOnlySetBlock(dimension, { x: chainX, y: cy - sag, z: chainZ }, "minecraft:iron_chain");
    }
  }

  // Thematic Feature on Satellite:
  try {
    const tr = theme.trait;
    if (tr === "ore_rich") {
      // Raw mineral boulder with lantern on fence
      safeAirOnlySetBlock(dimension, { x: sx, y: sy + 1, z: sz }, theme.tier >= 3 ? "minecraft:raw_gold_block" : "minecraft:raw_iron_block");
      placeLanternWithFence(dimension, { x: sx, y: sy + 2, z: sz }, "minecraft:oak_fence", "minecraft:lantern");
    } else if (tr === "village" || tr === "animals") {
      // Abandoned campsite with lantern on fence post
      safeAirOnlySetBlock(dimension, { x: sx, y: sy + 1, z: sz }, "minecraft:campfire");
      safeAirOnlySetBlock(dimension, { x: sx + 1, y: sy + 1, z: sz }, "minecraft:barrel");
      placeLanternWithFence(dimension, { x: sx - 1, y: sy + 1, z: sz }, "minecraft:oak_fence", "minecraft:lantern");
    } else if (tr === "dungeon" || theme.biome.includes("nether")) {
      // Spire with crying obsidian & soul lantern on fence
      safeAirOnlySetBlock(dimension, { x: sx, y: sy + 1, z: sz }, "minecraft:crying_obsidian");
      placeLanternWithFence(dimension, { x: sx, y: sy + 2, z: sz }, "minecraft:nether_brick_fence", "minecraft:soul_lantern");
    } else if (tr === "ancient_shrine") {
      // Quartz monolith
      safeAirOnlySetBlock(dimension, { x: sx, y: sy + 1, z: sz }, "minecraft:chiseled_quartz_block");
      safeAirOnlySetBlock(dimension, { x: sx, y: sy + 2, z: sz }, "minecraft:sea_lantern");
    } else {
      // Flowering azalea bonsai with lantern on fence post
      safeAirOnlySetBlock(dimension, { x: sx, y: sy + 1, z: sz }, "minecraft:flowering_azalea");
      placeLanternWithFence(dimension, { x: sx + 1, y: sy + 1, z: sz }, "minecraft:oak_fence", "minecraft:lantern");
    }
  } catch (fe) {}
}

const EXTRA_TREE_FLOORS = new Set(["minecraft:grass_block", "minecraft:podzol", "minecraft:moss_block", "minecraft:mycelium", "minecraft:crimson_nylium", "minecraft:warped_nylium", "minecraft:mud"]);

const EXTRA_ISLAND_MOBS = {
  sky_oasis: ["minecraft:cow", "minecraft:sheep"],
  cherry_sanctuary: ["minecraft:sheep", "minecraft:rabbit"],
  bakery_windmill: ["minecraft:cow", "minecraft:chicken", "minecraft:pig"],
  melon_greenhouse: ["minecraft:sheep", "minecraft:chicken"],
  pumpkin_patch: ["minecraft:pig", "minecraft:chicken"],
  bee_apiary: ["minecraft:rabbit"],
  mushroom_haven: ["minecraft:mooshroom"],
  jungle_temple: ["minecraft:ocelot"]
};

export function buildThemedIsland(dimension, theme, center) {
  const { x: cx, y: cy, z: cz } = center;

  if (!isIslandFootprintLoaded(dimension, center)) return 0;

  buildStats.placed = 0;

  // 1. AUTO-CHANGE BIOME: Paint true native Minecraft biome across island volume
  try {
    const biomeName = ({ dark_forest: "roofed_forest", nether_wastes: "hell" })[theme.biome] || theme.biome || "plains";
    dimension.runCommand(`fillbiome ${cx - 14} ${cy - 12} ${cz - 14} ${cx + 14} ${cy + 18} ${cz + 14} ${biomeName}`);
  } catch (be) {}

  // 2. PROCEDURAL SHAPE & SCALE PER THEME:
  let seed = 0;
  for (let i = 0; i < theme.id.length; i++) {
    seed = (seed * 31 + theme.id.charCodeAt(i)) & 0xffffff;
  }

  // Radius scale by size category:
  let baseRadius = 6.2;
  if (theme.size === "huge") baseRadius = 10.5;
  else if (theme.size === "big") baseRadius = 8.2;
  else if (theme.size === "medium") baseRadius = 6.4;
  else if (theme.size === "compact") baseRadius = 4.8;

  const freq1 = 2 + (seed % 3);
  const freq2 = 3 + ((seed >> 2) % 3);
  const freq3 = 4 + ((seed >> 4) % 2);
  const amp1 = 0.9 + ((seed % 10) / 12);
  const amp2 = 0.6 + (((seed >> 3) % 10) / 18);
  const amp3 = 0.4 + (((seed >> 6) % 10) / 25);
  const ridgeAngle = ((seed % 8) * Math.PI) / 4;

  const isOreRich = theme.trait === "ore_rich";
  const oreChance = isOreRich ? 18 : 7; // Rich ore density (18%) vs standard/flora (7%)
  const archetype = getIslandArchetype(theme);

  const maxR = Math.ceil(baseRadius + amp1 + amp2 + amp3 + 1);

  // 3. TERRAIN VOLUME GENERATION (5 GEOLOGICAL ARCHETYPES):
  for (let dx = -maxR; dx <= maxR; dx++) {
    for (let dz = -maxR; dz <= maxR; dz++) {
      const angle = Math.atan2(dz, dx);
      const shapeMod = baseRadius + amp1 * Math.cos(freq1 * angle) + amp2 * Math.sin(freq2 * angle) + amp3 * Math.cos(freq3 * angle);
      const dist = Math.sqrt(dx * dx + dz * dz);

      if (dist <= shapeMod) {
        let surfaceY = cy;
        let depth = Math.max(1, Math.round((shapeMod - dist) * 1.35));
        let isLagoon = false;

        if (archetype === "atoll") {
          // Central sunken lagoon crater with perimeter ring reef
          if (dist <= shapeMod * 0.45) {
            isLagoon = true;
            surfaceY = cy - 1;
            depth = Math.max(2, Math.round((shapeMod * 0.45 - dist) * 0.9) + 2);
          } else {
            surfaceY = cy;
            depth = Math.max(1, Math.round((shapeMod - dist) * 1.25));
          }
        } else if (archetype === "spire") {
          // Conical needle peak rising sharply at center and deep vertical underside stalactite
          const norm = Math.max(0, 1 - (dist / shapeMod));
          surfaceY = cy + Math.round(norm * norm * 5);
          depth = Math.max(1, Math.round((shapeMod - dist) * 1.5 + norm * norm * 6));
        } else if (archetype === "terrace") {
          // Crisp 3-tier stepped geological plateaus
          if (dist <= shapeMod * 0.35) {
            surfaceY = cy + 3; // Summit plateau
          } else if (dist <= shapeMod * 0.68) {
            surfaceY = cy + 1; // Mid terrace
          } else {
            surfaceY = cy; // Lower perimeter terrace
          }
          depth = Math.max(2, Math.round((shapeMod - dist) * 1.25));
        } else if (archetype === "archipelago") {
          // Main islet + satellite stepping islets with natural gap channels
          const lobe = Math.cos(3 * angle);
          if (dist > shapeMod * 0.65 && lobe < -0.25) {
            // Natural channel / water gap between islets
            continue;
          }
          surfaceY = (dist > shapeMod * 0.65) ? cy - 1 : cy;
          depth = Math.max(1, Math.round((shapeMod - dist) * 1.15));
        } else {
          // Rolling topography (gentle natural rolling hills)
          const dot = Math.cos(angle - ridgeAngle);
          if (dot > 0.35 && dist > 1.5) surfaceY = cy + 1;
          if (dot > 0.72 && dist > 3.0) surfaceY = cy + 2;
          depth = Math.max(1, Math.round((shapeMod - dist) * 1.35));
        }

        // POND ALCOVE (for water spring / nature if rolling):
        const dot = Math.cos(angle - ridgeAngle);
        const isSpringPond = (archetype === "rolling") && (theme.trait === "water_spring" || theme.trait === "animals") && (dot < -0.45 && dist >= 2.0 && dist <= 4.2);

        // Place surface layer:
        if (isLagoon) {
          if (theme.biome.includes("nether") || theme.id === "meteorite_crater") {
            safeAirOnlySetBlock(dimension, { x: cx + dx, y: cy, z: cz + dz }, "minecraft:lava");
            safeAirOnlySetBlock(dimension, { x: cx + dx, y: cy - 1, z: cz + dz }, "minecraft:magma");
          } else {
            safeAirOnlySetBlock(dimension, { x: cx + dx, y: cy, z: cz + dz }, "minecraft:water");
            safeAirOnlySetBlock(dimension, { x: cx + dx, y: cy - 1, z: cz + dz }, "minecraft:water");
            safeAirOnlySetBlock(dimension, { x: cx + dx, y: cy - 2, z: cz + dz }, ((dx + dz) % 2 === 0) ? "minecraft:tube_coral_block" : "minecraft:brain_coral_block");
          }
        } else if (isSpringPond) {
          safeAirOnlySetBlock(dimension, { x: cx + dx, y: cy, z: cz + dz }, "minecraft:water");
          safeAirOnlySetBlock(dimension, { x: cx + dx, y: cy - 1, z: cz + dz }, "minecraft:clay");
        } else {
          safeAirOnlySetBlock(dimension, { x: cx + dx, y: surfaceY, z: cz + dz }, theme.floor);
          placeSurfaceVegetation(dimension, theme, { x: cx + dx, y: surfaceY, z: cz + dz }, seed);

          // Fill elevated hill/terrace/spire steps underneath with subsoil & rock
          if (surfaceY > cy) {
            for (let upY = cy; upY < surfaceY; upY++) {
              safeAirOnlySetBlock(dimension, { x: cx + dx, y: upY, z: cz + dz }, getSubsoilBlock(theme, dx, dz, seed));
            }
          }
        }

        // 4. SUBSOIL & ROCK STRATA UNDERSIDE:
        for (let d = 1; d <= depth; d++) {
          let blockMat;
          if (d <= 2) {
            // Subsoil layer (rich 2-4 organic subsoil blocks)
            blockMat = getSubsoilBlock(theme, dx, dz, seed);
          } else {
            // Stone strata with real ore veins (rich vs poor economy)
            const oreHash = Math.random() * 100;
            if (oreHash < oreChance) {
              blockMat = getOreBlock(theme, d, dx, dz, seed);
            } else {
              blockMat = getRockBlock(theme, dx, dz, d, seed);
            }
          }
          safeAirOnlySetBlock(dimension, { x: cx + dx, y: cy - d, z: cz + dz }, blockMat);
        }

        // Hanging root stalactites underneath:
        if (dist <= 3.2 && Math.random() < 0.45) {
          const rootMat = getRockBlock(theme, dx, dz, depth + 1, seed);
          safeAirOnlySetBlock(dimension, { x: cx + dx, y: cy - depth - 1, z: cz + dz }, rootMat);
          if (dist <= 1.5) {
            safeAirOnlySetBlock(dimension, { x: cx + dx, y: cy - depth - 2, z: cz + dz }, rootMat);
          }
        }

        // Hanging underside foliage (roots & vines under soil/rock overhangs):
        if (dist >= baseRadius * 0.45 && Math.random() < 0.22) {
          const hangLoc = { x: cx + dx, y: cy - depth - 1, z: cz + dz };
          if (theme.biome.includes("nether") || theme.biome.includes("crimson")) {
            safeAirOnlySetBlock(dimension, hangLoc, "minecraft:weeping_vines");
          } else if (theme.floor === "minecraft:grass_block" || theme.floor === "minecraft:podzol") {
            safeAirOnlySetBlock(dimension, hangLoc, "minecraft:hanging_roots");
          }
        }
      }
    }
  }

  // 5. TEMPORARY ISLAND ONEBLOCK CORE (30-50 Blocks Capacity):
  // Placed flush directly at the island surface center (cx, coreY, cz) matching archetype height!
  let coreY = cy;
  if (archetype === "spire") coreY = cy + 5;
  else if (archetype === "terrace") coreY = cy + 3;

  const obPos = { x: cx, y: coreY, z: cz };
  const coreExists = world.getDynamicProperty(`island_ob_x_${theme.id}`) !== undefined;
  try {
    if (coreExists) throw new Error("core already exists");
    const maxBlocks = 30 + Math.floor(Math.random() * 21); // 30 to 50 randomized blocks
    world.setDynamicProperty(`island_ob_x_${theme.id}`, obPos.x);
    world.setDynamicProperty(`island_ob_y_${theme.id}`, obPos.y);
    world.setDynamicProperty(`island_ob_z_${theme.id}`, obPos.z);
    world.setDynamicProperty(`island_ob_max_${theme.id}`, maxBlocks);
    world.setDynamicProperty(`island_ob_mined_${theme.id}`, 0);
    world.setDynamicProperty(`island_ob_completed_${theme.id}`, false);

    // Initial block from theme's curated block pool placed flush on the surface
    const pool = getIslandBlockPool(theme);
    const obBlock = dimension.getBlock(obPos);
    if (obBlock) {
      let placed = false;
      try {
        obBlock.setType(pool[0]);
        if (!obBlock.isAir && obBlock.typeId !== "minecraft:air") {
          placed = true;
          buildStats.placed++;
        }
      } catch (e1) {}
      if (!placed) {
        try {
          obBlock.setType(theme.floor);
          if (!obBlock.isAir && obBlock.typeId !== "minecraft:air") {
            placed = true;
            buildStats.placed++;
          }
        } catch (e2) {}
      }
      if (!placed) {
        try {
          obBlock.setType("minecraft:dirt");
          buildStats.placed++;
        } catch (e3) {}
      }
    }

    // Bedrock foundation directly underneath the Island OneBlock
    const underBlock = dimension.getBlock({ x: cx, y: coreY - 1, z: cz });
    if (underBlock) {
      try {
        underBlock.setType("minecraft:bedrock");
        buildStats.placed++;
      } catch (ue) {}
    }

    // The blocks directly beside the Island OneBlock are Bedrock
    const besideOffsets = [
      { x: 1, z: 0 },
      { x: -1, z: 0 },
      { x: 0, z: 1 },
      { x: 0, z: -1 }
    ];
    for (const off of besideOffsets) {
      const bBlock = dimension.getBlock({ x: cx + off.x, y: coreY, z: cz + off.z });
      if (bBlock) {
        try {
          bBlock.setType("minecraft:bedrock");
          buildStats.placed++;
        } catch (se) {}
      }
    }
  } catch (e) {}

  // 6b. ORGANIC STEPPING PATHS:
  decorateSteppingPaths(dimension, theme, center, seed);

  // 6c. HOLLOW MICRO-CAVERN (For Huge & Big Islands):
  if (theme.size === "huge" || theme.size === "big") {
    buildMicroCave(dimension, theme, center, seed);
  }

  // 6d. SATELLITE MICRO-ISLETS & HANGING CHAINS (For Huge & Big Islands):
  if (theme.size === "huge" || theme.size === "big") {
    buildSatelliteIslet(dimension, theme, center, maxR, seed, 0);
    if (theme.size === "huge") {
      buildSatelliteIslet(dimension, theme, center, maxR, seed, 1);
    }
  }

  // 7. THEMATIC SPECIAL STRUCTURES & COMPACT VANILLA DESIGNS:
  let structureMobSpawned = false;
  try {
    structureMobSpawned = buildThemedStructure(dimension, theme, center);
  } catch (fe) {}

  // 7b. ISLAND NATURAL CANOPY TREES:
  // Authentic 5-tall wood trunk with a ~33-leaf rounded canopy for all forest/woodland/flora themes
  try {
    const firstTree = buildIslandNaturalTree(dimension, theme, center, false, null);
    if (theme.size !== "compact" && EXTRA_TREE_FLOORS.has(theme.floor)) buildIslandNaturalTree(dimension, theme, center, true, firstTree);
  } catch (te) {}

  // 8. CORNER LIGHTING POSTS:
  // Dynamically find valid solid ground perimeter spots, place thematic fence and lantern on top!
  const themeFence = getThemeFenceType(theme);
  const themeLantern = getThemeLanternType(theme);

  // LAMP_POST_V2
  const candidateOffsets = [
    { dx: 3, dz: -2 },
    { dx: -4, dz: 2 },
    { dx: 2, dz: 4 },
    { dx: -3, dz: -3 },
    { dx: 4, dz: 2 },
    { dx: -2, dz: 4 },
    { dx: 1, dz: -4 },
    { dx: -4, dz: -2 },
    { dx: -5, dz: 1 },
    { dx: 5, dz: -1 },
    { dx: 0, dz: 5 },
    { dx: 0, dz: -5 }
  ];

  const isPostGround = (b) => {
    if (!b || b.isAir || b.typeId === "minecraft:air") return false;
    const t = b.typeId;
    if (t.includes("water") || t.includes("lava") || t.includes("chest") || t.includes("leaves") || t.includes("fence") || t.includes("log") || t.includes("wall") || t.includes("bedrock") || t.includes("lodestone") || t.includes("lantern") || t.includes("chain")) return false;
    return !PASSABLE_BLOCKS.test(t);
  };

  let postsPlaced = 0;
  for (const off of candidateOffsets) {
    if (postsPlaced >= 3) break;
    const px = cx + off.dx;
    const pz = cz + off.dz;

    let groundY = null;
    for (let scanY = coreY + 1; scanY >= cy - 3; scanY--) {
      const b = dimension.getBlock({ x: px, y: scanY, z: pz });
      if (!b || b.isAir || b.typeId === "minecraft:air") continue;
      if (b.typeId.includes("leaves") || b.typeId.includes("log") || b.typeId.includes("fence") || b.typeId.includes("lantern") || b.typeId.includes("chain") || PASSABLE_BLOCKS.test(b.typeId)) continue;
      if (!isPostGround(b)) break;
      const solidBelow = isPostGround(dimension.getBlock({ x: px, y: scanY - 1, z: pz })) && isPostGround(dimension.getBlock({ x: px, y: scanY - 2, z: pz }));
      const openAbove = [1, 2, 3].every((up) => isPassableBlock(dimension.getBlock({ x: px, y: scanY + up, z: pz })));
      let flat = 0;
      for (const [ox, oz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        if (isPostGround(dimension.getBlock({ x: px + ox, y: scanY, z: pz + oz }))) flat++;
      }
      if (solidBelow && openAbove && flat >= 3) groundY = scanY;
      break;
    }

    if (groundY === null) continue;

    const fenceLoc = { x: px, y: groundY + 1, z: pz };
    if (placeLanternWithFence(dimension, fenceLoc, themeFence, themeLantern)) {
      postsPlaced++;
    }
  }

  for (let up = 1; up <= 2; up++) {
    const topBlock = dimension.getBlock({ x: cx, y: coreY + up, z: cz });
    if (topBlock && !topBlock.isAir && topBlock.typeId !== "minecraft:air" && PASSABLE_BLOCKS.test(topBlock.typeId)) {
      try { topBlock.setType("minecraft:air"); } catch (ce) {}
    }
  }

  // 9. THEMATIC COMPANION MOB (if not already spawned by structure):
  if (theme.mob && !structureMobSpawned) {
    try {
      spawnMobSafe(dimension, theme.mob, { x: cx + 0.5, y: coreY + 1.2, z: cz - 1.5 });
    } catch (e) {}
  }

  const extraMobs = EXTRA_ISLAND_MOBS[theme.id];
  if (extraMobs && !world.getDynamicProperty(`island_mobs_${theme.id}`)) {
    world.setDynamicProperty(`island_mobs_${theme.id}`, true);
    const spots = [{ x: 2.5, z: 1.5 }, { x: -2.5, z: 1.5 }, { x: 1.5, z: -2.5 }, { x: -1.5, z: -2.5 }];
    extraMobs.forEach((mobId, n) => {
      const s = spots[n % spots.length];
      try {
        spawnMobSafe(dimension, mobId, { x: cx + s.x, y: coreY + 2, z: cz + s.z });
      } catch (e) {}
    });
  }

  return buildStats.placed;
}
