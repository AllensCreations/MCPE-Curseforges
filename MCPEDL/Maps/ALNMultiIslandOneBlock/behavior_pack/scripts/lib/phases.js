import { TRAITS } from "./traits.js";
import { ONEBLOCK_PROGRESSION_POOLS, OneblockPoolProvider } from "./Oneblock_Progression.js";

function pickWeighted(list, weightOf) {
  let total = 0;
  for (const entry of list) total += weightOf(entry);
  if (total <= 0) return list[0];
  let roll = Math.random() * total;
  for (const entry of list) {
    roll -= weightOf(entry);
    if (roll < 0) return entry;
  }
  return list[list.length - 1];
}

const PHASE_COLORS = [
  "§a", 
  "§7", 
  "§b", 
  "§3", 
  "§2", 
  "§e", 
  "§6", 
  "§g", 
  "§d", 
  "§2", 
  "§d", 
  "§f", 
  "§9", 
  "§6", 
  "§8", 
  "§1", 
  "§c", 
  "§4", 
  "§5", 
  "§5", 
  "§d", 
];

/**
 * Classifies blocks into trait categories:
 * - ore, wood, crop, aquatic, nether, fauna, soil, leaf, stone
 */
export function classifyBlock(blockId) {
  const id = blockId.replace(/^minecraft:/, "");
  if (id.includes("ore") || id === "ancient_debris" || id.startsWith("raw_")) return "ore";
  if (id.includes("log") || id.includes("stem") || id.includes("wood") || id.includes("planks") || id === "bamboo_block") return "wood";
  if (id.includes("leaves") || id.includes("vine") || id.includes("creaking_heart")) return "leaf";
  if (
    id.includes("pumpkin") ||
    id.includes("melon") ||
    id.includes("hay_block") ||
    id.includes("moss_block") ||
    id.includes("mushroom_block") ||
    id.includes("honeycomb_block") ||
    id.includes("cactus") ||
    id.includes("shroomlight")
  ) {
    return "crop";
  }
  if (id.includes("prismarine") || id.includes("sponge") || id.includes("sea_lantern") || id.includes("coral")) return "aquatic";
  if (
    id.includes("netherrack") ||
    id.includes("soul_sand") ||
    id.includes("soul_soil") ||
    id.includes("glowstone") ||
    id.includes("magma") ||
    id.includes("nether_wart_block") ||
    id.includes("warped_wart_block") ||
    id.includes("blackstone") ||
    id.includes("basalt") ||
    id.includes("crying_obsidian") ||
    id.includes("gilded_blackstone") ||
    id.includes("respawn_anchor")
  ) {
    return "nether";
  }
  if (id.includes("wool") || id.includes("bone_block") || id.includes("sculk") || id.includes("honey_block")) return "fauna";
  if (
    id.includes("dirt") ||
    id.includes("grass_block") ||
    id.includes("mud") ||
    id.includes("sand") ||
    id.includes("gravel") ||
    id.includes("clay") ||
    id.includes("snow") ||
    id.includes("ice")
  ) {
    return "soil";
  }
  return "stone";
}

let cumulativeBreaks = 0;
export const PHASES = ONEBLOCK_PROGRESSION_POOLS.map((pool, idx) => {
  const from = cumulativeBreaks;
  cumulativeBreaks += pool.blocksRequired;
  return {
    name: pool.name,
    color: PHASE_COLORS[idx] || "§f",
    from,
    blocksRequired: pool.blocksRequired,
    blocks: pool.blocks,
    chests: pool.chests,
    mobs: pool.mobs,
  };
});

export const poolProvider = new OneblockPoolProvider();

export function phaseIndexFor(count) {
  let index = 0;
  for (let i = 0; i < PHASES.length; i++) {
    if (count >= PHASES[i].from) index = i;
  }
  return index;
}

export function phaseLabel(index) {
  const p = PHASES[index];
  return p ? `${p.color}${p.name}` : "§fUnknown";
}

export function breaksToNextPhase(count) {
  const currentIndex = phaseIndexFor(count);
  const next = PHASES[currentIndex + 1];
  return next ? next.from - count : 0;
}

/**
 * Returns the next block ID for a player's island core block.
 * Uses OneblockPoolProvider unlocked pool with the player's island trait boost applied!
 */
export function nextBlockId(phaseIndex, traitId) {
  const trait = TRAITS[traitId];
  const boost = trait?.boost ?? {};

  const poolPhase = phaseIndex + 1;
  const unlocked = poolProvider.getUnlockedPool(poolPhase, "blocks");

  if (!unlocked || unlocked.length === 0) return "minecraft:grass_block";

  const entry = pickWeighted(unlocked, (item) => {
    const category = classifyBlock(item.id);
    const multiplier = boost[category] ?? 1;
    return item.weight * multiplier;
  });

  return entry?.id ?? "minecraft:grass_block";
}

/**
 * Rolls bonus rewards tailored to the player's island trait and progress.
 */
export function rollBonus(phaseIndex, traitId) {
  const trait = TRAITS[traitId];
  if (!trait) return undefined;
  const pool = trait.bonus.filter((b) => b[4] <= phaseIndex);
  if (pool.length === 0) return undefined;
  const pick = pickWeighted(pool, (b) => b[3]);
  const amount = pick[1] + Math.floor(Math.random() * (pick[2] - pick[1] + 1));
  return { id: pick[0], amount };
}
