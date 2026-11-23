export const TRAITS = {
  ore_bounty: {
    name: "Ore Bounty",
    color: "§b",
    blurb: "Ore-heavy block mix and bonus raw metals, coal, redstone and gems.",
    goods: "Iron, copper, gold, coal, redstone, lapis, diamonds, emeralds",
    boost: { ore: 3 },
    bonus: [
      ["minecraft:coal", 2, 5, 10, 0],
      ["minecraft:raw_copper", 1, 4, 8, 1],
      ["minecraft:raw_iron", 1, 4, 8, 1],
      ["minecraft:lapis_lazuli", 2, 6, 5, 1],
      ["minecraft:redstone", 2, 6, 5, 1],
      ["minecraft:raw_gold", 1, 3, 4, 2],
      ["minecraft:emerald", 1, 2, 2, 3],
      ["minecraft:diamond", 1, 1, 2, 5],
    ],
  },
  crop_master: {
    name: "Crop Master",
    color: "§a",
    blurb: "Crop-heavy block mix and bonus harvests, seeds and farm goods.",
    goods: "Wheat, carrots, potatoes, beetroot, pumpkins, melons, berries, sugar cane",
    boost: { crop: 4, soil: 1.5 },
    bonus: [
      ["minecraft:wheat", 2, 6, 10, 0],
      ["minecraft:carrot", 2, 6, 8, 0],
      ["minecraft:potato", 2, 6, 8, 0],
      ["minecraft:beetroot", 2, 5, 6, 0],
      ["minecraft:pumpkin", 1, 3, 6, 0],
      ["minecraft:melon_slice", 2, 6, 6, 0],
      ["minecraft:sweet_berries", 2, 5, 5, 0],
      ["minecraft:sugar_cane", 2, 5, 5, 0],
      ["minecraft:cocoa_beans", 1, 4, 3, 1],
    ],
  },
  treasure_angler: {
    name: "Treasure Angler",
    color: "§3",
    blurb: "Sea-themed block mix and bonus catches, shells and rare treasure.",
    goods: "Fish, ink, nautilus shells, name tags, saddles, lily pads",
    boost: { aquatic: 4 },
    bonus: [
      ["minecraft:cod", 1, 4, 10, 0],
      ["minecraft:salmon", 1, 4, 8, 0],
      ["minecraft:tropical_fish", 1, 2, 3, 0],
      ["minecraft:pufferfish", 1, 2, 3, 0],
      ["minecraft:ink_sac", 1, 3, 6, 0],
      ["minecraft:waterlily", 1, 3, 5, 0],
      ["minecraft:nautilus_shell", 1, 1, 2, 2],
      ["minecraft:name_tag", 1, 1, 2, 2],
      ["minecraft:saddle", 1, 1, 1, 3],
      ["minecraft:emerald", 1, 2, 2, 3],
    ],
  },
  timber_baron: {
    name: "Timber Baron",
    color: "§6",
    blurb: "Wood-heavy block mix and bonus logs, saplings and apples.",
    goods: "Logs of every wood type, saplings, sticks, apples",
    boost: { wood: 3, leaf: 2 },
    bonus: [
      ["minecraft:oak_log", 2, 6, 8, 0],
      ["minecraft:birch_log", 2, 6, 6, 0],
      ["minecraft:spruce_log", 2, 6, 6, 0],
      ["minecraft:acacia_log", 2, 5, 5, 0],
      ["minecraft:dark_oak_log", 2, 5, 5, 0],
      ["minecraft:jungle_log", 2, 5, 4, 0],
      ["minecraft:stick", 3, 8, 6, 0],
      ["minecraft:apple", 1, 3, 4, 0],
      ["minecraft:oak_sapling", 1, 2, 4, 0],
      ["minecraft:cherry_log", 1, 4, 2, 2],
    ],
  },
  beast_herder: {
    name: "Beast Herder",
    color: "§d",
    blurb: "Wool-heavy block mix and bonus meat, leather, feathers and eggs.",
    goods: "Beef, pork, chicken, mutton, leather, wool, feathers, eggs, bones",
    boost: { fauna: 4 },
    bonus: [
      ["minecraft:beef", 1, 4, 8, 0],
      ["minecraft:porkchop", 1, 4, 8, 0],
      ["minecraft:chicken", 1, 3, 6, 0],
      ["minecraft:mutton", 1, 3, 6, 0],
      ["minecraft:leather", 1, 4, 8, 0],
      ["minecraft:white_wool", 1, 4, 6, 0],
      ["minecraft:feather", 2, 5, 6, 0],
      ["minecraft:egg", 2, 6, 5, 0],
      ["minecraft:bone", 1, 4, 6, 0],
      ["minecraft:rabbit_hide", 1, 3, 2, 1],
    ],
  },
  ember_forager: {
    name: "Ember Forager",
    color: "§c",
    blurb: "Nether-heavy block mix and bonus coal, quartz, glowstone and blaze goods.",
    goods: "Coal, flint, nether wart, quartz, glowstone, gold nuggets, blaze rods",
    boost: { nether: 3 },
    bonus: [
      ["minecraft:coal", 2, 5, 8, 0],
      ["minecraft:flint", 1, 4, 8, 0],
      ["minecraft:gold_nugget", 2, 7, 8, 0],
      ["minecraft:nether_wart", 1, 4, 6, 2],
      ["minecraft:quartz", 1, 4, 6, 2],
      ["minecraft:glowstone_dust", 1, 4, 6, 2],
      ["minecraft:blaze_rod", 1, 2, 3, 4],
      ["minecraft:magma_cream", 1, 2, 3, 4],
      ["minecraft:netherite_scrap", 1, 1, 1, 6],
    ],
  },
};

export const TRAIT_IDS = Object.keys(TRAITS);

export function traitInfo(id) {
  return TRAITS[id];
}

export function traitLabel(id) {
  const t = TRAITS[id];
  return t ? `${t.color}${t.name}` : "§7Unknown";
}

export function pickTrait(slotRecords) {
  const counts = {};
  for (const id of TRAIT_IDS) counts[id] = 0;
  for (const key of Object.keys(slotRecords)) {
    const t = slotRecords[key].trait;
    if (counts[t] !== undefined) counts[t]++;
  }
  const least = Math.min(...TRAIT_IDS.map((id) => counts[id]));
  const pool = TRAIT_IDS.filter((id) => counts[id] === least);
  return pool[Math.floor(Math.random() * pool.length)];
}
