// 20-phase block pools. Each phase starts at `from` blocks broken and lasts until the next phase starts.
// Names are Bedrock block ids (without the "minecraft:" prefix).
const POOLS = [
  { name: "Humble Beginnings", from: 0, blocks: ["dirt", "grass_block", "oak_log", "gravel", "clay"] },
  { name: "Stone Age", from: 151, blocks: ["cobblestone", "stone", "mossy_cobblestone", "oak_log", "coarse_dirt"] },
  { name: "Mossy Grove", from: 401, blocks: ["moss_block", "azalea_leaves", "oak_log", "birch_log", "mud"] },
  { name: "Cavern Depths", from: 751, blocks: ["andesite", "diorite", "granite", "coal_ore", "deepslate"] },
  { name: "Iron Forge", from: 1201, blocks: ["raw_iron_block", "stone", "iron_ore", "smooth_basalt", "calcite"] },
  { name: "Ocean Floor", from: 1801, blocks: ["clay", "gravel", "prismarine", "sponge", "dripstone_block"] },
  { name: "Mushroom Realm", from: 2501, blocks: ["red_mushroom_block", "brown_mushroom_block", "mycelium", "podzol"] },
  { name: "Jungle Canopy", from: 3301, blocks: ["jungle_log", "bamboo_block", "melon_block", "mossy_stone_bricks"] },
  { name: "Desert Dunes", from: 4201, blocks: ["sand", "red_sand", "sandstone", "smooth_sandstone", "hardened_clay", "raw_gold_block"] },
  { name: "Frozen Tundra", from: 5201, blocks: ["packed_ice", "blue_ice", "snow", "spruce_log"] },
  { name: "Redstone Caverns", from: 6301, blocks: ["redstone_ore", "redstone_block", "basalt", "smooth_stone", "obsidian"] },
  { name: "Nether Gate", from: 7501, blocks: ["netherrack", "soul_sand", "soul_soil", "magma", "quartz_ore"] },
  { name: "Crimson Wastes", from: 8801, blocks: ["crimson_stem", "warped_stem", "nether_wart_block", "shroomlight", "blackstone"] },
  { name: "Fortress of Embers", from: 10201, blocks: ["nether_brick", "glowstone", "nether_gold_ore", "red_nether_brick"] },
  { name: "Deep Dark Geodes", from: 11801, blocks: ["deepslate", "cobbled_deepslate", "lapis_ore", "amethyst_block"] },
  { name: "Diamond Vaults", from: 13501, blocks: ["deepslate_diamond_ore", "diamond_block", "obsidian", "crying_obsidian"] },
  { name: "Sculk Abyss", from: 15501, blocks: ["sculk", "sculk_catalyst", "ancient_debris", "bone_block"] },
  { name: "End Isles", from: 17801, blocks: ["end_stone", "end_bricks", "purpur_block", "purpur_pillar"] },
  { name: "Royal Treasury", from: 20301, blocks: ["crying_obsidian", "end_bricks", "gilded_blackstone", "emerald_block"] },
  { name: "Cosmic Chaos", from: 23001, blocks: [] }
];

export const PHASE_COUNT = POOLS.length;

export function phaseName(index) {
  return POOLS[index].name;
}

// Index (0-19) of the phase that applies once `total` blocks have been broken.
export function phaseIndexFor(total) {
  for (let i = POOLS.length - 1; i >= 0; i--) {
    if (total >= POOLS[i].from) return i;
  }
  return 0;
}

function randomFrom(list) {
  return list[Math.floor(Math.random() * list.length)];
}

// Phase 20 draws from every earlier pool; later pools are weighted heavier.
function cosmicPick() {
  const last = POOLS.length - 1;
  let weight = 0;
  for (let i = 0; i < last; i++) weight += i + 1;
  let roll = Math.random() * weight;
  for (let i = 0; i < last; i++) {
    roll -= i + 1;
    if (roll < 0) return randomFrom(POOLS[i].blocks);
  }
  return randomFrom(POOLS[last - 1].blocks);
}

// Returns a full block id for the given phase index.
export function pickBlock(index) {
  const block = index === POOLS.length - 1 ? cosmicPick() : randomFrom(POOLS[index].blocks);
  return "minecraft:" + block;
}
