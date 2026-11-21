import { isPassableBlock, safeAirOnlySetBlock } from "./island-blocks.js";

// Determines the tree placement, wood log type, leaf type, and accessories per theme
function getIslandTreePlacement(theme, center) {
  const { x: cx, y: cy, z: cz } = center;
  switch (theme.id) {
    case "cherry_sanctuary":
      return { pos: { x: cx - 3, y: cy, z: cz - 2 }, log: "minecraft:cherry_log", leaves: "minecraft:cherry_leaves", beeNest: true };
    case "pale_garden_spire":
      return { pos: { x: cx - 3, y: cy, z: cz - 2 }, log: "minecraft:dark_oak_log", leaves: "minecraft:dark_oak_leaves" };
    case "jungle_temple":
      return { pos: { x: cx - 3, y: cy, z: cz - 2 }, log: "minecraft:jungle_log", leaves: "minecraft:jungle_leaves" };
    case "sky_oasis":
      return { pos: { x: cx + 3, y: cy, z: cz + 3 }, log: "minecraft:oak_log", leaves: "minecraft:oak_leaves" };
    case "bee_apiary":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:birch_log", leaves: "minecraft:birch_leaves", beeNest: true };
    case "pumpkin_patch":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:spruce_log", leaves: "minecraft:spruce_leaves" };
    case "bamboo_monastery":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:jungle_log", leaves: "minecraft:jungle_leaves" };
    case "witch_swamp_hut":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:mangrove_log", leaves: "minecraft:mangrove_leaves" };
    case "slime_biosphere":
      return { pos: { x: cx + 3, y: cy, z: cz + 3 }, log: "minecraft:mangrove_log", leaves: "minecraft:mangrove_leaves" };
    case "melon_greenhouse":
      return { pos: { x: cx - 3, y: cy, z: cz + 3 }, log: "minecraft:jungle_log", leaves: "minecraft:jungle_leaves" };
    case "bakery_windmill":
      return { pos: { x: cx - 3, y: cy, z: cz + 3 }, log: "minecraft:oak_log", leaves: "minecraft:oak_leaves" };
    case "crimson_forest_isle":
      return { pos: { x: cx + 3, y: cy, z: cz + 3 }, log: "minecraft:crimson_stem", leaves: "minecraft:nether_wart_block" };
    case "warped_forest_isle":
      return { pos: { x: cx + 3, y: cy, z: cz + 3 }, log: "minecraft:warped_stem", leaves: "minecraft:warped_wart_block" };
    case "pillager_watchtower":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:dark_oak_log", leaves: "minecraft:dark_oak_leaves" };
    case "alchemist_laboratory":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:dark_oak_log", leaves: "minecraft:dark_oak_leaves" };
    case "ancient_crypt":
      return { pos: { x: cx - 3, y: cy, z: cz + 3 }, log: "minecraft:jungle_log", leaves: "minecraft:jungle_leaves" };
    case "desert_well_oasis":
      return { pos: { x: cx + 3, y: cy, z: cz + 3 }, log: "minecraft:jungle_log", leaves: "minecraft:jungle_leaves" };
    case "fossil_excavation":
      return { pos: { x: cx - 3, y: cy, z: cz - 3 }, log: "minecraft:bone_block", leaves: "minecraft:smooth_sandstone" };
    case "badlands_mesa":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:acacia_log", leaves: "minecraft:acacia_leaves" };
    case "ice_spike_peak":
      return { pos: { x: cx - 3, y: cy, z: cz - 3 }, log: "minecraft:spruce_log", leaves: "minecraft:spruce_leaves" };
    case "mushroom_haven":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:mushroom_stem", leaves: "minecraft:red_mushroom_block" };
    case "amethyst_geode":
      return { pos: { x: cx - 3, y: cy, z: cz + 3 }, log: "minecraft:smooth_basalt", leaves: "minecraft:amethyst_block" };
    case "spider_nest":
      return { pos: { x: cx + 3, y: cy, z: cz + 3 }, log: "minecraft:oak_log", leaves: "minecraft:oak_leaves" };
    case "creeper_dungeon":
      return { pos: { x: cx - 3, y: cy, z: cz - 3 }, log: "minecraft:oak_log", leaves: "minecraft:moss_block" };
    case "deepslate_forge":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:deepslate", leaves: "minecraft:deepslate_tiles" };
    case "sculk_laboratory":
      return { pos: { x: cx - 3, y: cy, z: cz + 3 }, log: "minecraft:deepslate", leaves: "minecraft:sculk" };
    case "trial_vault":
      return { pos: { x: cx + 3, y: cy, z: cz + 3 }, log: "minecraft:polished_tuff", leaves: "minecraft:cut_copper" };
    case "blacksmith_workshop":
      return { pos: { x: cx - 3, y: cy, z: cz + 3 }, log: "minecraft:spruce_log", leaves: "minecraft:spruce_leaves" };
    case "library_observatory":
      return { pos: { x: cx - 3, y: cy, z: cz - 3 }, log: "minecraft:spruce_log", leaves: "minecraft:spruce_leaves" };
    case "armory_vault":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:spruce_log", leaves: "minecraft:spruce_leaves" };
    case "golden_pantheon":
      return { pos: { x: cx - 3, y: cy, z: cz + 3 }, log: "minecraft:smooth_quartz", leaves: "minecraft:quartz_block" };
    case "ocean_monument_shrine":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:dark_prismarine", leaves: "minecraft:prismarine_bricks" };
    case "aquarium_atoll":
      return { pos: { x: cx - 3, y: cy, z: cz + 3 }, log: "minecraft:jungle_log", leaves: "minecraft:jungle_leaves" };
    case "tuff_golem_sanctuary":
      return { pos: { x: cx + 3, y: cy, z: cz + 3 }, log: "minecraft:tuff", leaves: "minecraft:polished_tuff" };
    case "nether_fortress_spire":
      return { pos: { x: cx - 3, y: cy, z: cz + 3 }, log: "minecraft:nether_brick", leaves: "minecraft:nether_wart_block" };
    case "bastion_treasury":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:basalt", leaves: "minecraft:gilded_blackstone" };
    case "soul_sand_valley":
      return { pos: { x: cx - 3, y: cy, z: cz - 3 }, log: "minecraft:bone_block", leaves: "minecraft:soul_soil" };
    case "glowstone_meteor":
      return { pos: { x: cx + 3, y: cy, z: cz + 3 }, log: "minecraft:basalt", leaves: "minecraft:glowstone" };
    case "meteorite_crater":
      return { pos: { x: cx - 3, y: cy, z: cz + 3 }, log: "minecraft:crying_obsidian", leaves: "minecraft:obsidian" };
    case "stronghold_portal":
      return { pos: { x: cx + 3, y: cy, z: cz - 3 }, log: "minecraft:stone_bricks", leaves: "minecraft:mossy_stone_bricks" };
    case "end_city_tower":
      return { pos: { x: cx - 3, y: cy, z: cz + 3 }, log: "minecraft:purpur_pillar", leaves: "minecraft:purpur_block" };
    case "void_gateway_outpost":
      return { pos: { x: cx + 3, y: cy, z: cz + 3 }, log: "minecraft:end_bricks", leaves: "minecraft:purpur_block" };
    default:
      return null; // islands without a tree design get no tree
  }
}

// ISLAND TREE OVERHAUL: a tree is only planted on a verified ground spot inside the island.
// Real trees (logs/stems) need matching soil; the soil patch is laid only over natural island ground.
const TREE_COMMON_SOIL = ["minecraft:grass_block", "minecraft:dirt", "minecraft:podzol", "minecraft:coarse_dirt", "minecraft:rooted_dirt", "minecraft:moss_block"];

function getTreeSoilRule(logId) {
  switch (logId) {
    case "minecraft:oak_log":
    case "minecraft:birch_log":
    case "minecraft:jungle_log":
    case "minecraft:acacia_log":
    case "minecraft:cherry_log":
      return { valid: TREE_COMMON_SOIL, plot: "minecraft:grass_block" };
    case "minecraft:dark_oak_log":
      return { valid: TREE_COMMON_SOIL, plot: "minecraft:podzol" };
    case "minecraft:spruce_log":
      return { valid: TREE_COMMON_SOIL.concat(["minecraft:snow"]), plot: "minecraft:podzol" };
    case "minecraft:mangrove_log":
      return { valid: ["minecraft:mud", "minecraft:muddy_mangrove_roots", "minecraft:grass_block", "minecraft:dirt", "minecraft:moss_block"], plot: "minecraft:mud" };
    case "minecraft:mushroom_stem":
      return { valid: ["minecraft:mycelium", "minecraft:podzol"], plot: "minecraft:mycelium" };
    case "minecraft:crimson_stem":
      return { valid: ["minecraft:crimson_nylium"], plot: "minecraft:crimson_nylium" };
    case "minecraft:warped_stem":
      return { valid: ["minecraft:warped_nylium"], plot: "minecraft:warped_nylium" };
    default:
      return null; // constructed "trees" (bone, tuff, quartz...) may stand on any solid island ground
  }
}

const TREE_GROUND_REJECT = /(leaves|_log|_wood|_stem|fence|chest|barrel|spawner|bedrock|lodestone|beacon|_bed$|door|glass|ice$|bee_nest|bell|lantern|chain|slab|stairs|_wall$|torch|water|lava|portal|frame|sign|banner|furnace|crafting_table|bookshelf|anvil|brewing|cauldron|campfire|lectern|loom|smithing|stonecutter|grindstone|composter|planks)/;

const TREE_NATURAL_GROUND = /^minecraft:((stone|cobblestone|deepslate|gravel|sand|red_sand|sandstone|red_sandstone|snow|netherrack|end_stone|tuff|dripstone_block|dirt|coarse_dirt|grass_block|podzol|mud|moss_block|mycelium|soul_sand|soul_soil|blackstone|basalt|crimson_nylium|warped_nylium|terracotta)|[a-z_]+_terracotta)$/;

// Finds the top solid ground block of a column near the island surface. Returns null when blocked or unloaded.
function findTreeGround(dimension, x, z, cy) {
  for (let y = cy + 2; y >= cy - 4; y--) {
    const b = dimension.getBlock({ x, y, z });
    if (!b) return null;
    if (isPassableBlock(b)) continue;
    if (TREE_GROUND_REJECT.test(b.typeId)) return null;
    return { y, id: b.typeId };
  }
  return null;
}

function evaluateTreeSpot(dimension, theme, center, x, z, rule) {
  const ground = findTreeGround(dimension, x, z, center.y);
  if (!ground) return null;
  const gy = ground.y;
  // Trunk column must be free of structures
  for (let h = 1; h <= 6; h++) {
    const b = dimension.getBlock({ x, y: gy + h, z });
    if (!b || !isPassableBlock(b)) return null;
  }
  // Not on a lone edge column: at least 3 of 4 neighbours need ground at about the same height
  let supported = 0;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const g = findTreeGround(dimension, x + dx, z + dz, gy);
    if (g && Math.abs(g.y - gy) <= 1) supported++;
  }
  if (supported < 3) return null;
  if (rule && !rule.valid.includes(ground.id)) {
    // Only natural island ground may be turned into a soil patch (never house floors or paths)
    if (ground.id !== theme.floor && !TREE_NATURAL_GROUND.test(ground.id)) return null;
  }
  return { x, z, gy, groundId: ground.id };
}

function findTreeSpot(dimension, theme, center, preferred, avoid, rule) {
  const R = 9;
  const list = [];
  for (let dx = -R; dx <= R; dx++) {
    for (let dz = -R; dz <= R; dz++) {
      if (Math.hypot(dx, dz) < 3.5) continue; // keep clear of the OneBlock core and its collar
      const x = center.x + dx, z = center.z + dz;
      if (avoid && Math.hypot(x - avoid.x, z - avoid.z) < 5) continue;
      list.push({ x, z, d: Math.hypot(x - preferred.x, z - preferred.z) });
    }
  }
  list.sort((a, b) => a.d - b.d);
  for (const c of list) {
    const spot = evaluateTreeSpot(dimension, theme, center, c.x, c.z, rule);
    if (spot) return spot;
  }
  return null;
}

export function buildIslandNaturalTree(dimension, theme, center, mirror, avoid) {
  const treeConfig = getIslandTreePlacement(theme, center);
  if (!treeConfig) return null;
  let preferred = treeConfig.pos;
  if (mirror) {
    preferred = { x: 2 * center.x - preferred.x, y: preferred.y, z: 2 * center.z - preferred.z };
    treeConfig.beeNest = false;
  }
  const rule = getTreeSoilRule(treeConfig.log);
  const spot = findTreeSpot(dimension, theme, center, preferred, avoid, rule);
  if (!spot) return null; // no valid ground on this island: skip instead of planting in the wrong place

  const { x: tx, z: tz, gy } = spot;

  // 1. Soil patch under living trees (3x3, natural island ground only)
  if (rule) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        try {
          const g = dimension.getBlock({ x: tx + dx, y: gy, z: tz + dz });
          const above = dimension.getBlock({ x: tx + dx, y: gy + 1, z: tz + dz });
          if (!g || !above || !isPassableBlock(above)) continue;
          if (rule.valid.includes(g.typeId) || g.typeId === rule.plot) continue;
          if (g.typeId === theme.floor || TREE_NATURAL_GROUND.test(g.typeId)) g.setType(rule.plot);
        } catch (e) {}
      }
    }
  }

  // 2. Clear plants out of the trunk column, then grow a 5 tall trunk
  for (let h = 1; h <= 6; h++) {
    try {
      const b = dimension.getBlock({ x: tx, y: gy + h, z: tz });
      if (b && !b.isAir && b.typeId !== "minecraft:air" && isPassableBlock(b)) b.setType("minecraft:air");
    } catch (e) {}
  }
  for (let h = 1; h <= 5; h++) {
    safeAirOnlySetBlock(dimension, { x: tx, y: gy + h, z: tz }, treeConfig.log);
  }

  // 3. Canopy layer 1 (gy + 4): 5x5 with corners cut
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      if (Math.abs(dx) === 2 && Math.abs(dz) === 2) continue;
      if (dx === 0 && dz === 0) continue;
      safeAirOnlySetBlock(dimension, { x: tx + dx, y: gy + 4, z: tz + dz }, treeConfig.leaves);
    }
  }
  // 4. Canopy layer 2 (gy + 5): 3x3 around the top trunk block
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (dx === 0 && dz === 0) continue;
      safeAirOnlySetBlock(dimension, { x: tx + dx, y: gy + 5, z: tz + dz }, treeConfig.leaves);
    }
  }
  // 5. Crown cross (gy + 6)
  safeAirOnlySetBlock(dimension, { x: tx, y: gy + 6, z: tz }, treeConfig.leaves);
  safeAirOnlySetBlock(dimension, { x: tx + 1, y: gy + 6, z: tz }, treeConfig.leaves);
  safeAirOnlySetBlock(dimension, { x: tx - 1, y: gy + 6, z: tz }, treeConfig.leaves);
  safeAirOnlySetBlock(dimension, { x: tx, y: gy + 6, z: tz + 1 }, treeConfig.leaves);
  safeAirOnlySetBlock(dimension, { x: tx, y: gy + 6, z: tz - 1 }, treeConfig.leaves);

  // 6. Bee nest (bee and cherry islands)
  if (treeConfig.beeNest) {
    safeAirOnlySetBlock(dimension, { x: tx - 1, y: gy + 3, z: tz }, "minecraft:bee_nest");
  }
  return { x: tx, z: tz };
}
