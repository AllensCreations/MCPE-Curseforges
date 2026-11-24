import { SERVER_BUY_RATIO, RARE_UNIT_PRICE, RARE_BUY_RATIO } from "./config.js";

const PRICES = {
  "minecraft:coal": [2, 32],
  "minecraft:flint": [1, 32],
  "minecraft:raw_copper": [2, 32],
  "minecraft:copper_ingot": [3, 32],
  "minecraft:raw_iron": [3, 32],
  "minecraft:iron_ingot": [5, 32],
  "minecraft:raw_gold": [5, 16],
  "minecraft:gold_ingot": [9, 16],
  "minecraft:gold_nugget": [1, 32],
  "minecraft:lapis_lazuli": [3, 32],
  "minecraft:redstone": [2, 32],
  "minecraft:quartz": [3, 32],
  "minecraft:glowstone_dust": [3, 32],
  "minecraft:obsidian": [6, 16],
  "minecraft:diamond": [60, 4],
  "minecraft:emerald": [40, 4],
  "minecraft:netherite_scrap": [300, 1],
  "minecraft:wheat": [1, 64],
  "minecraft:carrot": [1, 64],
  "minecraft:potato": [1, 64],
  "minecraft:beetroot": [1, 64],
  "minecraft:pumpkin": [3, 16],
  "minecraft:melon_slice": [1, 64],
  "minecraft:sweet_berries": [1, 32],
  "minecraft:sugar_cane": [1, 64],
  "minecraft:cocoa_beans": [2, 32],
  "minecraft:apple": [3, 16],
  "minecraft:cod": [1, 32],
  "minecraft:salmon": [2, 32],
  "minecraft:tropical_fish": [5, 8],
  "minecraft:pufferfish": [5, 8],
  "minecraft:ink_sac": [2, 32],
  "minecraft:waterlily": [2, 16],
  "minecraft:nautilus_shell": [80, 1],
  "minecraft:name_tag": [40, 1],
  "minecraft:saddle": [120, 1],
  "minecraft:oak_log": [2, 64],
  "minecraft:birch_log": [2, 64],
  "minecraft:spruce_log": [2, 64],
  "minecraft:acacia_log": [2, 64],
  "minecraft:dark_oak_log": [2, 64],
  "minecraft:jungle_log": [2, 64],
  "minecraft:cherry_log": [3, 32],
  "minecraft:stick": [1, 64],
  "minecraft:oak_sapling": [2, 16],
  "minecraft:beef": [2, 32],
  "minecraft:porkchop": [2, 32],
  "minecraft:chicken": [2, 32],
  "minecraft:mutton": [2, 32],
  "minecraft:leather": [3, 32],
  "minecraft:white_wool": [3, 32],
  "minecraft:feather": [1, 64],
  "minecraft:egg": [1, 32],
  "minecraft:bone": [1, 32],
  "minecraft:rabbit_hide": [3, 16],
  "minecraft:nether_wart": [3, 32],
  "minecraft:blaze_rod": [20, 8],
  "minecraft:magma_cream": [15, 8],
};

const FALLBACK = [1, 16];

export function priceInfo(typeId) {
  const entry = PRICES[typeId];
  const [unit, amount] = entry ?? FALLBACK;
  return { unit, amount, listed: Boolean(entry) };
}

export function recommendedTotal(typeId, amount) {
  return Math.max(1, Math.round(priceInfo(typeId).unit * amount));
}
export function serverPayout(typeId, amount) {
  const info = priceInfo(typeId);
  if (!info.listed) return 0;
  const ratio = info.unit >= RARE_UNIT_PRICE ? RARE_BUY_RATIO : SERVER_BUY_RATIO;
  return Math.floor(info.unit * amount * ratio);
}
