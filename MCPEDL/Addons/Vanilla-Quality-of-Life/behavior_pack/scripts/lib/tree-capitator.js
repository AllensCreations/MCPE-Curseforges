// Tree Capitator.
import { addGroupedDrop, removeBlockAt, spawnGroupedDrops } from "./blocks.js";
import { CONFIG } from "./config.js";
import { applyToolDurabilityDamage, checkToolSafety, notifyToolProtection, notifyTreeTooLarge } from "./durability.js";
import { clearTreeLeaves } from "./leaves.js";
import { replantSaplings } from "./replant.js";
import { isGameMode, normalizeId } from "./utils.js";

export const AXE_IDENTIFIERS = new Set([
  "minecraft:wooden_axe", "minecraft:stone_axe", "minecraft:iron_axe",
  "minecraft:golden_axe", "minecraft:diamond_axe", "minecraft:netherite_axe",
]);

export function isAxe(typeId) {
  if (!typeId) return false;
  return AXE_IDENTIFIERS.has(typeId) || typeId.endsWith("_axe");
}

export const ELIGIBLE_LOGS = new Set([
  "minecraft:oak_log", "minecraft:stripped_oak_log", "minecraft:oak_wood", "minecraft:stripped_oak_wood",
  "minecraft:spruce_log", "minecraft:stripped_spruce_log", "minecraft:spruce_wood", "minecraft:stripped_spruce_wood",
  "minecraft:birch_log", "minecraft:stripped_birch_log", "minecraft:birch_wood", "minecraft:stripped_birch_wood",
  "minecraft:jungle_log", "minecraft:stripped_jungle_log", "minecraft:jungle_wood", "minecraft:stripped_jungle_wood",
  "minecraft:acacia_log", "minecraft:stripped_acacia_log", "minecraft:acacia_wood", "minecraft:stripped_acacia_wood",
  "minecraft:dark_oak_log", "minecraft:stripped_dark_oak_log", "minecraft:dark_oak_wood", "minecraft:stripped_dark_oak_wood",
  "minecraft:mangrove_log", "minecraft:stripped_mangrove_log", "minecraft:mangrove_wood", "minecraft:stripped_mangrove_wood",
  "minecraft:mangrove_roots", "minecraft:muddy_mangrove_roots",
  "minecraft:cherry_log", "minecraft:stripped_cherry_log", "minecraft:cherry_wood", "minecraft:stripped_cherry_wood",
  "minecraft:pale_oak_log", "minecraft:stripped_pale_oak_log", "minecraft:pale_oak_wood", "minecraft:stripped_pale_oak_wood",
  "minecraft:crimson_stem", "minecraft:stripped_crimson_stem", "minecraft:crimson_hyphae", "minecraft:stripped_crimson_hyphae",
  "minecraft:warped_stem", "minecraft:stripped_warped_stem", "minecraft:warped_hyphae", "minecraft:stripped_warped_hyphae",
]);

export function isEligibleLog(blockId) {
  if (!blockId) return false;
  if (ELIGIBLE_LOGS.has(blockId)) return true;
  return /(_log|_wood|_hyphae|mangrove_roots|(crimson|warped)_stem)$/i.test(blockId);
}

export function getWoodSpecies(typeId) {
  if (!typeId) return null;
  const match = typeId.match(/(dark_oak|pale_oak|oak|spruce|birch|jungle|acacia|mangrove|cherry|crimson|warped)/i);
  return match ? match[1].toLowerCase() : null;
}

export function isMatchingLog(blockId, targetSpecies) {
  if (!isEligibleLog(blockId)) return false;
  if (!CONFIG.MATCH_TREE_SPECIES || !targetSpecies) return true;
  const species = getWoodSpecies(blockId);
  return !species || species === targetSpecies;
}

export function isTreeCanopy(dimension, blocks, targetSpecies) {
  if (!blocks || blocks.length === 0) return false;
  const candidates = [...blocks].sort((a, b) => b.y - a.y).slice(0, 8);
  for (const pos of candidates) {
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dy = 0; dy <= 2; dy++) {
          try {
            const b = dimension.getBlock({ x: pos.x + dx, y: pos.y + dy, z: pos.z + dz });
            if (!b) continue;

            if ((targetSpecies === "crimson" || targetSpecies === "warped") &&
                (b.typeId.includes("wart_block") || b.typeId.includes("shroomlight"))) {
              return true;
            }

            if (b.typeId.includes("leaves")) {
              const permutation = b.permutation;
              const isPersistent = permutation?.getState("persistent_bit");
              if (isPersistent === true) {
                continue;
              }
              return true;
            }
          } catch (e) {}
        }
      }
    }
  }
  return false;
}

export const PLAYER_BUILD_PATTERN = /(planks|stairs|slab|door|trapdoor|glass|brick|fence|(^|_)bed$|crafting_table|chest|barrel|furnace|concrete|wool|carpet|bookshelf)/;

export function isNearPlayerBuild(dimension, blocks, startLoc) {
  const checked = new Set();
  const positions = [startLoc, ...blocks];
  for (const pos of positions) {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const x = pos.x + dx;
          const y = pos.y + dy;
          const z = pos.z + dz;
          const key = `${x},${y},${z}`;
          if (checked.has(key)) continue;
          checked.add(key);
          try {
            const b = dimension.getBlock({ x, y, z });
            if (!b) continue;
            const builtId = normalizeId(b.typeId);
            if (builtId !== "moss_carpet" && PLAYER_BUILD_PATTERN.test(builtId)) return true;
          } catch (e) {}
        }
      }
    }
  }
  return false;
}

export function executeTreeCapitator(player, dimension, startLoc, startBlockId, onComplete) {
  if (typeof startBlockId === "function") {
    onComplete = startBlockId;
    startBlockId = null;
  }
  if (!CONFIG.TREE_CAPITATOR_ENABLED) {
    if (onComplete) onComplete();
    return;
  }

  const targetSpecies = startBlockId ? getWoodSpecies(startBlockId) : null;
  const visited = new Set();
  visited.add(`${startLoc.x},${startLoc.y},${startLoc.z}`);

  const blocksToBreak = [];
  const queue = [{ x: startLoc.x, y: startLoc.y, z: startLoc.z }];

  while (queue.length > 0 && blocksToBreak.length < CONFIG.MAX_TREE_BLOCKS) {
    const cur = queue.shift();

    for (let dy = 0; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (dx === 0 && dy === 0 && dz === 0) continue;

          const nx = cur.x + dx;
          const ny = cur.y + dy;
          const nz = cur.z + dz;

          if (ny < startLoc.y) continue;
          if (ny > startLoc.y + CONFIG.MAX_TREE_HEIGHT) continue;
          if (
            Math.abs(nx - startLoc.x) > CONFIG.TREE_MAX_HORIZONTAL_SPREAD ||
            Math.abs(nz - startLoc.z) > CONFIG.TREE_MAX_HORIZONTAL_SPREAD
          ) continue;

          const key = `${nx},${ny},${nz}`;
          if (visited.has(key)) continue;
          visited.add(key);

          try {
            const block = dimension.getBlock({ x: nx, y: ny, z: nz });
            if (block && isMatchingLog(block.typeId, targetSpecies)) {
              const logPos = { x: nx, y: ny, z: nz };
              blocksToBreak.push(logPos);
              queue.push(logPos);
              if (blocksToBreak.length >= CONFIG.MAX_TREE_BLOCKS) break;
            }
          } catch (e) {}
        }
        if (blocksToBreak.length >= CONFIG.MAX_TREE_BLOCKS) break;
      }
      if (blocksToBreak.length >= CONFIG.MAX_TREE_BLOCKS) break;
    }
  }

  if (blocksToBreak.length === 0) {
    if (onComplete) onComplete();
    return;
  }

  if (!isTreeCanopy(dimension, blocksToBreak, targetSpecies)) {
    if (onComplete) onComplete();
    return;
  }

  if (isNearPlayerBuild(dimension, blocksToBreak, startLoc)) {
    if (onComplete) onComplete();
    return;
  }

  const capped = blocksToBreak.length >= CONFIG.MAX_TREE_BLOCKS;
  const creative = isGameMode(player, "creative");
  const drops = new Map();
  let removedCount = 0;
  for (const pos of blocksToBreak) {
    if (!player || !player.isValid) break;

    const safety = checkToolSafety(player);
    if (!safety.safe) {
      notifyToolProtection(player, safety.remaining);
      break;
    }

    try {
      const brokenId = removeBlockAt(dimension, pos);
      if (brokenId) removedCount++;
      if (brokenId && !creative) addGroupedDrop(drops, pos, brokenId, 1);
      applyToolDurabilityDamage(player);
    } catch (err) {}
  }
  spawnGroupedDrops(dimension, drops);
  if (capped) notifyTreeTooLarge(player);
  if (!capped && removedCount === blocksToBreak.length) {
    replantSaplings(player, dimension, startLoc, blocksToBreak, targetSpecies);
    const isTreeLog = (id) => isEligibleLog(id) && getWoodSpecies(id) === targetSpecies;
    clearTreeLeaves(player, dimension, [startLoc, ...blocksToBreak], targetSpecies, isTreeLog);
  }

  if (onComplete) onComplete();
}
