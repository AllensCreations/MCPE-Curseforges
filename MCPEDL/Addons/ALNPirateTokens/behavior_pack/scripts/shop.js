import { ItemStack } from "@minecraft/server";
import { COMPASS_NAME, CUTLASS_NAME, BREEZE_NAME } from "./config.js";
import { giveAmount, giveStack } from "./vault.js";

const named = (typeId, name, lore) => {
  const stack = new ItemStack(typeId, 1);
  stack.nameTag = name;
  stack.setLore(lore);
  return stack;
};

export function deliver(player, key) {
  if (key === "compass") {
    giveStack(player, named("minecraft:compass", `§6${COMPASS_NAME}`, ["§bUse: locate buried treasure", "§bSneak and use: locate a shipwreck"]));
  } else if (key === "cutlass") {
    giveStack(player, named("minecraft:iron_sword", `§6${CUTLASS_NAME}`, ["§bSpeed while swimming", "§bExtra Pirate Token drops"]));
  } else if (key === "breeze") {
    giveStack(player, named("minecraft:glass_bottle", `§b${BREEZE_NAME}`, ["§bUse: Dolphin's Grace and Water Breathing"]));
  } else if (key === "prismarine") {
    giveAmount(player, "minecraft:prismarine", 32);
    giveAmount(player, "minecraft:prismarine_bricks", 16);
    giveAmount(player, "minecraft:sea_lantern", 8);
  } else if (key === "shipwright") {
    giveAmount(player, "minecraft:dark_oak_planks", 64);
    giveAmount(player, "minecraft:dark_oak_log", 32);
    giveAmount(player, "minecraft:iron_nugget", 16);
  } else if (key === "treasure") {
    giveAmount(player, "minecraft:chest", 4);
    giveAmount(player, "minecraft:gold_block", 2);
    giveAmount(player, "minecraft:emerald", 8);
  }
}
