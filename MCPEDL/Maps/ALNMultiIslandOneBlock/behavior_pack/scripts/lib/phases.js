import { TRAITS } from "./traits.js";
import { pickWeighted } from "./util.js";

export const PHASES = [
  {
    name: "Forest",
    color: "§a",
    from: 0,
    blocks: [
      ["minecraft:grass_block", 18, "soil"],
      ["minecraft:dirt", 14, "soil"],
      ["minecraft:oak_log", 14, "wood"],
      ["minecraft:birch_log", 10, "wood"],
      ["minecraft:spruce_log", 5, "wood"],
      ["minecraft:oak_leaves", 12, "leaf"],
      ["minecraft:birch_leaves", 6, "leaf"],
      ["minecraft:pumpkin", 4, "crop"],
      ["minecraft:melon_block", 3, "crop"],
      ["minecraft:hay_block", 2, "crop"],
      ["minecraft:moss_block", 2, "crop"],
      ["minecraft:white_wool", 3, "fauna"],
      ["minecraft:brown_wool", 2, "fauna"],
    ],
  },
  {
    name: "Underground",
    color: "§7",
    from: 150,
    blocks: [
      ["minecraft:stone", 22, "stone"],
      ["minecraft:cobblestone", 18, "stone"],
      ["minecraft:andesite", 8, "stone"],
      ["minecraft:granite", 8, "stone"],
      ["minecraft:diorite", 8, "stone"],
      ["minecraft:gravel", 8, "soil"],
      ["minecraft:dirt", 4, "soil"],
      ["minecraft:oak_log", 3, "wood"],
      ["minecraft:coal_ore", 10, "ore"],
      ["minecraft:iron_ore", 8, "ore"],
      ["minecraft:copper_ore", 8, "ore"],
      ["minecraft:lapis_ore", 3, "ore"],
      ["minecraft:redstone_ore", 4, "ore"],
      ["minecraft:bone_block", 2, "fauna"],
    ],
  },
  {
    name: "Desert",
    color: "§e",
    from: 400,
    blocks: [
      ["minecraft:sand", 24, "soil"],
      ["minecraft:sandstone", 18, "stone"],
      ["minecraft:red_sand", 8, "soil"],
      ["minecraft:red_sandstone", 8, "stone"],
      ["minecraft:terracotta", 6, "stone"],
      ["minecraft:gravel", 4, "soil"],
      ["minecraft:acacia_log", 6, "wood"],
      ["minecraft:gold_ore", 3, "ore"],
      ["minecraft:iron_ore", 3, "ore"],
      ["minecraft:hay_block", 4, "crop"],
      ["minecraft:melon_block", 5, "crop"],
      ["minecraft:pumpkin", 4, "crop"],
      ["minecraft:white_wool", 3, "fauna"],
      ["minecraft:bone_block", 3, "fauna"],
    ],
  },
  {
    name: "Frozen Tundra",
    color: "§b",
    from: 750,
    blocks: [
      ["minecraft:snow", 18, "soil"],
      ["minecraft:packed_ice", 8, "soil"],
      ["minecraft:blue_ice", 2, "soil"],
      ["minecraft:spruce_log", 14, "wood"],
      ["minecraft:spruce_leaves", 8, "leaf"],
      ["minecraft:stone", 8, "stone"],
      ["minecraft:coal_ore", 6, "ore"],
      ["minecraft:iron_ore", 6, "ore"],
      ["minecraft:lapis_ore", 3, "ore"],
      ["minecraft:emerald_ore", 2, "ore"],
      ["minecraft:white_wool", 4, "fauna"],
    ],
  },
  {
    name: "Ocean Monument",
    color: "§3",
    from: 1200,
    blocks: [
      ["minecraft:prismarine", 16, "aquatic"],
      ["minecraft:prismarine_bricks", 10, "aquatic"],
      ["minecraft:dark_prismarine", 6, "aquatic"],
      ["minecraft:sponge", 6, "aquatic"],
      ["minecraft:sea_lantern", 3, "aquatic"],
      ["minecraft:clay", 12, "soil"],
      ["minecraft:gravel", 8, "soil"],
      ["minecraft:sand", 8, "soil"],
    ],
  },
  {
    name: "Nether",
    color: "§c",
    from: 1800,
    blocks: [
      ["minecraft:netherrack", 24, "nether"],
      ["minecraft:soul_sand", 8, "nether"],
      ["minecraft:soul_soil", 6, "nether"],
      ["minecraft:blackstone", 10, "stone"],
      ["minecraft:basalt", 8, "stone"],
      ["minecraft:glowstone", 6, "nether"],
      ["minecraft:nether_wart_block", 6, "nether"],
      ["minecraft:crimson_stem", 6, "wood"],
      ["minecraft:warped_stem", 6, "wood"],
      ["minecraft:quartz_ore", 9, "ore"],
      ["minecraft:nether_gold_ore", 8, "ore"],
      ["minecraft:ancient_debris", 1, "ore"],
      ["minecraft:bone_block", 3, "fauna"],
    ],
  },
  {
    name: "Deepslate Depths",
    color: "§8",
    from: 2600,
    blocks: [
      ["minecraft:deepslate", 24, "stone"],
      ["minecraft:tuff", 10, "stone"],
      ["minecraft:calcite", 6, "stone"],
      ["minecraft:amethyst_block", 3, "stone"],
      ["minecraft:deepslate_coal_ore", 8, "ore"],
      ["minecraft:deepslate_iron_ore", 8, "ore"],
      ["minecraft:deepslate_copper_ore", 7, "ore"],
      ["minecraft:deepslate_gold_ore", 6, "ore"],
      ["minecraft:deepslate_redstone_ore", 6, "ore"],
      ["minecraft:deepslate_lapis_ore", 5, "ore"],
      ["minecraft:deepslate_diamond_ore", 4, "ore"],
      ["minecraft:deepslate_emerald_ore", 3, "ore"],
    ],
  },
  {
    name: "The End",
    color: "§5",
    from: 3600,
    blocks: [
      ["minecraft:end_stone", 26, "stone"],
      ["minecraft:end_stone_bricks", 10, "stone"],
      ["minecraft:purpur_block", 10, "stone"],
      ["minecraft:purpur_pillar", 4, "stone"],
      ["minecraft:obsidian", 8, "stone"],
      ["minecraft:amethyst_block", 3, "stone"],
      ["minecraft:deepslate_diamond_ore", 4, "ore"],
      ["minecraft:deepslate_emerald_ore", 3, "ore"],
      ["minecraft:ancient_debris", 2, "ore"],
    ],
  },
];

export function phaseIndexFor(count) {
  let index = 0;
  for (let i = 0; i < PHASES.length; i++) {
    if (count >= PHASES[i].from) index = i;
  }
  return index;
}

export function phaseLabel(index) {
  const p = PHASES[index];
  return `${p.color}${p.name}`;
}

export function breaksToNextPhase(count) {
  const next = PHASES[phaseIndexFor(count) + 1];
  return next ? next.from - count : 0;
}

export function nextBlockId(phaseIndex, traitId) {
  const boost = TRAITS[traitId]?.boost ?? {};
  const entry = pickWeighted(PHASES[phaseIndex].blocks, (b) => b[1] * (boost[b[2]] ?? 1));
  return entry[0];
}

export function rollBonus(phaseIndex, traitId) {
  const trait = TRAITS[traitId];
  if (!trait) return undefined;
  const pool = trait.bonus.filter((b) => b[4] <= phaseIndex);
  if (pool.length === 0) return undefined;
  const pick = pickWeighted(pool, (b) => b[3]);
  const amount = pick[1] + Math.floor(Math.random() * (pick[2] - pick[1] + 1));
  return { id: pick[0], amount };
}
