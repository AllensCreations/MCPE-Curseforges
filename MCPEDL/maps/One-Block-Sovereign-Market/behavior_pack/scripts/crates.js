// crates.js - Mystery Crates. Each opens 2 rolls; expected loot value stays well below the price.
import { ItemStack } from "@minecraft/server";
import { spendCoins, prettyName } from "./economy.js";
import { bumpStat } from "./stats.js";

// loot: [item id, amount, weight]
export const CRATES = [
  { name: "Common Crate", cost: 100, phase: 0, loot: [
    ["minecraft:cobblestone", 64, 30], ["minecraft:oak_log", 32, 20], ["minecraft:coal", 32, 15], ["minecraft:copper_ingot", 16, 12],
    ["minecraft:iron_ingot", 6, 8], ["minecraft:wheat", 32, 15], ["minecraft:bone_meal", 16, 10], ["minecraft:gold_ingot", 6, 2] ] },
  { name: "Rare Crate", cost: 500, phase: 3, loot: [
    ["minecraft:iron_ingot", 32, 20], ["minecraft:gold_ingot", 16, 15], ["minecraft:diamond", 4, 10], ["minecraft:redstone", 64, 15],
    ["minecraft:lapis_lazuli", 64, 15], ["minecraft:emerald", 4, 8], ["minecraft:copper_ingot", 64, 17], ["minecraft:coal", 64, 20] ] },
  { name: "Epic Crate", cost: 2500, phase: 5, loot: [
    ["minecraft:diamond", 32, 10], ["minecraft:emerald", 32, 10], ["minecraft:gold_ingot", 64, 20], ["minecraft:iron_ingot", 64, 30],
    ["minecraft:diamond", 16, 15], ["minecraft:emerald", 16, 15] ] },
];

export function openCrate(player, index) {
  const crate = CRATES[index];
  if (!crate) return { ok: false, msg: "Unknown crate." };
  if (!spendCoins(player, crate.cost)) return { ok: false, msg: "Not enough coins." };
  const total = crate.loot.reduce((s, l) => s + l[2], 0);
  const got = [];
  const container = player.getComponent("minecraft:inventory")?.container;
  for (let n = 0; n < 2; n++) {
    let roll = Math.random() * total;
    const pick = crate.loot.find((l) => (roll -= l[2]) <= 0) ?? crate.loot[0];
    got.push(`${pick[1]}x ${prettyName(pick[0])}`);
    const left = container?.addItem(new ItemStack(pick[0], pick[1]));
    if (left) player.dimension.spawnItem(left, player.location);
  }
  bumpStat(player, "crates");
  return { ok: true, msg: `${crate.name}: ${got.join(" + ")}` };
}
