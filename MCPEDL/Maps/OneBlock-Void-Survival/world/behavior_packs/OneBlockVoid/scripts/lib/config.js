import { WORLD_MODE } from "./mode.js";

// Admin Build Configuration
// In Survival: false (pure vanilla experience: no Actionbar HUD, no !run or admin command intercepts)
// In Admin World: true (enables !run auto-break testing runner, !hud toggle, !admin GUI, and inspector tools)
export const IS_ADMIN_BUILD = false;

export function isAdmin(player) {
  return IS_ADMIN_BUILD === true;
}

export const BASE_MODE = WORLD_MODE === "creative" ? "creative" : "survival";

// Progressive Phase Length Scaling:
// Early Biomes (Phases 0-4): 50 blocks (fast progression through starter woods/caves)
// Mid Biomes (Phases 5-9): 100 blocks (steady exploration)
// Late & Dimension Biomes (Phases 10+): 150 blocks (deep progression through Trials, Deepslate, End)
export function getPhaseLength(phaseIndex) {
  if (phaseIndex <= 4) return 50;
  if (phaseIndex <= 9) return 100;
  return 150;
}

export const ONEBLOCK_POS = { x: 0, y: 64, z: 0 };

export const CHEST_CHANCE = 0.02; // 2%

export const MOB_CHANCE = 0.03;   // 3%

export const LUCKY_RUSH_CHANCE = 0.005; // 0.5% (1 in 200 blocks)

export const VOID_SURGE_CHANCE = 0.005; // 0.5% (1 in 200 blocks)

export const JACKPOT_CHANCE = 0.001;    // 0.1% (1 in 1000 blocks)

export const activeCountdowns = new Map();

export const activeLuckyRush = new Map(); // dimensionKey -> secondsLeft

export const recentIslandBreaks = new Map();

export const mainPending = new Map();

export const lastProgressTick = new Map();

export const islandPending = new Map();

// 8 perimeter positions around (0, 64, 0)
export const SURROUNDING_OFFSETS = [
  { x: -1, z: -1 }, { x: 0, z: -1 }, { x: 1, z: -1 },
  { x: -1, z: 0 },                    { x: 1, z: 0 },
  { x: -1, z: 1 },  { x: 0, z: 1 },  { x: 1, z: 1 }
];

// 15 Total Curated Tutorial Blocks that perfectly build up the player's starter setup:
// Steps 0-7: 8 Dirts (each auto-places at one side to build safe 3x3 platform)
// Steps 8-10: 3 Oak Logs (1 for Crafting Table, 1 for Sticks, 1 for Pickaxe)
// Steps 11-13: 3 Stones (mine Cobblestone for a Stone Pickaxe)
// Step 14: 1 Coal Ore (for torches & smelting)
export const TUTORIAL_BLOCKS = [
  { block: "minecraft:dirt", msg: "§6[Step 1/15] §eMining Dirt... §aAuto-placed 1/8 of safe platform!" },
  { block: "minecraft:dirt", msg: "§6[Step 2/15] §eMining Dirt... §aAuto-placed 2/8 of safe platform!" },
  { block: "minecraft:dirt", msg: "§6[Step 3/15] §eMining Dirt... §aAuto-placed 3/8 of safe platform!" },
  { block: "minecraft:dirt", msg: "§6[Step 4/15] §eMining Dirt... §aAuto-placed 4/8 of safe platform!" },
  { block: "minecraft:dirt", msg: "§6[Step 5/15] §eMining Dirt... §aAuto-placed 5/8 of safe platform!" },
  { block: "minecraft:dirt", msg: "§6[Step 6/15] §eMining Dirt... §aAuto-placed 6/8 of safe platform!" },
  { block: "minecraft:dirt", msg: "§6[Step 7/15] §eMining Dirt... §aAuto-placed 7/8 of safe platform!" },
  { block: "minecraft:dirt", msg: "§6[Step 8/15] §aPlatform complete! Safe 3x3 foundation built!" },
  { block: "minecraft:oak_log", msg: "§6[Step 9/15] §eWood #1! Use for a Crafting Table." },
  { block: "minecraft:oak_log", msg: "§6[Step 10/15] §eWood #2! Use for crafting Sticks." },
  { block: "minecraft:oak_log", msg: "§6[Step 11/15] §eWood #3! Craft a Wooden Pickaxe!" },
  { block: "minecraft:stone", msg: "§6[Step 12/15] §eStone #1! Mine with pickaxe for Cobblestone." },
  { block: "minecraft:stone", msg: "§6[Step 13/15] §eStone #2! Keep gathering Cobblestone." },
  { block: "minecraft:stone", msg: "§6[Step 14/15] §eStone #3! Craft a sturdy Stone Pickaxe!" },
  { block: "minecraft:coal_ore", msg: "§a§l[Tutorial Complete!] §eCoal for torches! Phase 1 begins!" }
];

export const lastKnownOneBlockType = {};

// Periodic maintenance & loop (1 second)
export let tickCounter = 0;

export function advanceTick() {
  tickCounter++;
}
