// The 20-break tutorial: fixed safe rewards given in random order, tracked in a saved world value.
import { world } from "@minecraft/server";
import { TUTORIAL_KEY } from "./config.js";
import { rand, items, kit, mobs, both, later } from "./helpers.js";

export const TUTORIAL = [
  ["Oak Logs", items([["minecraft:oak_log", 12]]), "Craft logs into planks in your inventory"],
  ["Oak Planks", items([["minecraft:oak_planks", 24]]), "Planks make tables, tools and blocks"],
  ["Sticks", items([["minecraft:stick", 16]]), "Sticks are part of every tool"],
  ["Crafting Table", items([["minecraft:crafting_table", 1]]), "Place it to craft bigger recipes"],
  ["Wooden Pickaxe and Axe", kit("minecraft:wooden_pickaxe", "minecraft:wooden_axe"), "Pickaxe for stone, axe for wood"],
  ["Wooden Shovel and Sword", kit("minecraft:wooden_shovel", "minecraft:wooden_sword"), "A sword keeps early mobs away"],
  ["Leather Helmet and Chestplate", kit("minecraft:leather_helmet", "minecraft:leather_chestplate"), "Equip armor from your inventory"],
  ["Leather Leggings and Boots", kit("minecraft:leather_leggings", "minecraft:leather_boots"), "Wear all four pieces for full protection"],
  ["Dirt", items([["minecraft:dirt", 32]]), "Dirt helps you grow your island"],
  ["Cobblestone", items([["minecraft:cobblestone", 32]]), "Your first strong building block"],
  ["Sand", items([["minecraft:sand", 16]]), "Smelt sand in a furnace to make glass"],
  ["Furnace and Coal", items([["minecraft:furnace", 1], ["minecraft:coal", 8]]), "Furnaces cook food and smelt ores"],
  ["Torches", items([["minecraft:torch", 16]]), "Light keeps mobs from spawning"],
  ["Food Basket", items([["minecraft:bread", 8], ["minecraft:cooked_beef", 6]]), "Eat when your hunger bar drops"],
  ["Crop Seeds", items([["minecraft:wheat_seeds", 8], ["minecraft:carrot", 4], ["minecraft:potato", 4]]), "Plant seeds on dirt near water"],
  ["Saplings and Bone Meal", items([["minecraft:oak_sapling", 4], ["minecraft:bone_meal", 8]]), "Plant saplings on grass, then use bone meal"],
  ["Water Bucket", items([["minecraft:water_bucket", 1]]), "Water makes farmland and an endless supply"],
  ["Bed", items([["minecraft:red_bed", 1]]), "Sleep to skip the night and set your spawn"],
  ["Farm Animals", both(mobs("minecraft:cow", 1), mobs("minecraft:sheep", 1)), "Animals give food and wool"],
  ["Birch Logs", items([["minecraft:birch_log", 12]]), "Mix wood types for different looks"],
];

const tutorialRaw = () => world.getDynamicProperty(TUTORIAL_KEY);
export const tutorialActive = () => tutorialRaw() !== "done";

export function takeTutorial() {
  const raw = tutorialRaw();
  if (raw === "done") return null;
  const left = typeof raw === "string" && raw.length > 0 ? raw.split(",").map(Number) : TUTORIAL.map((entry, index) => index);
  const index = left.splice(rand(left.length), 1)[0];
  world.setDynamicProperty(TUTORIAL_KEY, left.length > 0 ? left.join(",") : "done");
  return { entry: TUTORIAL[index], number: TUTORIAL.length - left.length, last: left.length === 0 };
}

export function showTutorial(player, dimension, loc, step) {
  const ctx = { player, dimension, loc, top: { x: loc.x + 0.5, y: loc.y + 1.2, z: loc.z + 0.5 } };
  try {
    step.entry[1](ctx);
  } catch (e) {
    return;
  }
  try {
    player.onScreenDisplay.setActionBar(`§bTutorial ${step.number}/${TUTORIAL.length} §8|§r §a${step.entry[0]} §8-§r §7${step.entry[2]}`);
    player.playSound("random.levelup");
    dimension.spawnParticle("minecraft:villager_happy", ctx.top);
  } catch (e) {
    return;
  }
  if (step.last) later(80, () => player.onScreenDisplay.setActionBar("§6Tutorial complete! From now on every break is a random prize."));
}
