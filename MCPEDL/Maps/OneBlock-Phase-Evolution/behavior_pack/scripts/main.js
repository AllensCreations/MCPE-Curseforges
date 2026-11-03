import { world, system } from "@minecraft/server";
import "./team_inventory.js";

const CORE = { x: 0, y: 0, z: 0 };
const BREAKS_KEY = "oneblock_phase_break_count";
const PHASES = [
  { name: "The Beginning", threshold: 0, blocks: [{ id: "minecraft:dirt", weight: 100 }] },
  { name: "The Greenlands", threshold: 100, blocks: [{ id: "minecraft:grass_block", weight: 30 }, { id: "minecraft:coarse_dirt", weight: 20 }, { id: "minecraft:rooted_dirt", weight: 10 }, { id: "minecraft:oak_log", weight: 25 }, { id: "minecraft:oak_leaves", weight: 10 }, { id: "minecraft:oak_planks", weight: 5 }] },
  { name: "The Wildlands", threshold: 250, blocks: [{ id: "minecraft:birch_log", weight: 20 }, { id: "minecraft:birch_leaves", weight: 10 }, { id: "minecraft:birch_planks", weight: 10 }, { id: "minecraft:spruce_log", weight: 20 }, { id: "minecraft:spruce_leaves", weight: 10 }, { id: "minecraft:spruce_planks", weight: 10 }, { id: "minecraft:dark_oak_log", weight: 10 }, { id: "minecraft:moss_block", weight: 5 }, { id: "minecraft:podzol", weight: 3 }, { id: "minecraft:mycelium", weight: 2 }] },
  { name: "The Drylands", threshold: 450, blocks: [{ id: "minecraft:sandstone", weight: 20 }, { id: "minecraft:red_sandstone", weight: 10 }, { id: "minecraft:terracotta", weight: 10 }, { id: "minecraft:acacia_log", weight: 15 }, { id: "minecraft:acacia_planks", weight: 5 }, { id: "minecraft:acacia_leaves", weight: 4 }] },
  { name: "The Underground", threshold: 700, blocks: [{ id: "minecraft:stone", weight: 25 }, { id: "minecraft:cobblestone", weight: 20 }, { id: "minecraft:clay", weight: 8 }, { id: "minecraft:coal_ore", weight: 12 }, { id: "minecraft:copper_ore", weight: 10 }, { id: "minecraft:iron_ore", weight: 7 }, { id: "minecraft:dripstone_block", weight: 3 }, { id: "minecraft:moss_block", weight: 3 }] },
  { name: "The Frozen Frontier", threshold: 1000, blocks: [{ id: "minecraft:snow_block", weight: 25 }, { id: "minecraft:packed_ice", weight: 15 }, { id: "minecraft:blue_ice", weight: 5 }, { id: "minecraft:calcite", weight: 10 }, { id: "minecraft:tuff", weight: 10 }, { id: "minecraft:polished_diorite", weight: 10 }] },
  { name: "The Tropical Frontier", threshold: 1400, blocks: [{ id: "minecraft:jungle_log", weight: 20 }, { id: "minecraft:jungle_leaves", weight: 10 }, { id: "minecraft:jungle_planks", weight: 10 }, { id: "minecraft:mangrove_log", weight: 15 }, { id: "minecraft:mangrove_leaves", weight: 10 }, { id: "minecraft:mangrove_planks", weight: 10 }, { id: "minecraft:cherry_log", weight: 10 }, { id: "minecraft:cherry_leaves", weight: 5 }, { id: "minecraft:cherry_planks", weight: 5 }, { id: "minecraft:bamboo_block", weight: 5 }] },
  { name: "The Deep World", threshold: 1900, blocks: [{ id: "minecraft:deepslate", weight: 20 }, { id: "minecraft:deepslate_coal_ore", weight: 12 }, { id: "minecraft:deepslate_copper_ore", weight: 10 }, { id: "minecraft:deepslate_iron_ore", weight: 10 }, { id: "minecraft:deepslate_gold_ore", weight: 8 }, { id: "minecraft:deepslate_redstone_ore", weight: 8 }, { id: "minecraft:deepslate_lapis_ore", weight: 7 }, { id: "minecraft:deepslate_diamond_ore", weight: 3 }, { id: "minecraft:amethyst_block", weight: 5 }, { id: "minecraft:tuff", weight: 7 }, { id: "minecraft:emerald_ore", weight: 2 }] },
  { name: "The Oceanic World", threshold: 2500, blocks: [{ id: "minecraft:prismarine", weight: 25 }, { id: "minecraft:prismarine_bricks", weight: 15 }, { id: "minecraft:dark_prismarine", weight: 10 }, { id: "minecraft:sea_lantern", weight: 5 }, { id: "minecraft:sponge", weight: 5 }, { id: "minecraft:wet_sponge", weight: 5 }, { id: "minecraft:tube_coral_block", weight: 8 }, { id: "minecraft:brain_coral_block", weight: 8 }, { id: "minecraft:bubble_coral_block", weight: 6 }, { id: "minecraft:fire_coral_block", weight: 6 }, { id: "minecraft:horn_coral_block", weight: 7 }] },
  { name: "The Nether", threshold: 3200, blocks: [{ id: "minecraft:netherrack", weight: 20 }, { id: "minecraft:nether_quartz_ore", weight: 12 }, { id: "minecraft:nether_gold_ore", weight: 8 }, { id: "minecraft:glowstone", weight: 8 }, { id: "minecraft:soul_sand", weight: 8 }, { id: "minecraft:soul_soil", weight: 7 }, { id: "minecraft:basalt", weight: 8 }, { id: "minecraft:polished_basalt", weight: 5 }, { id: "minecraft:blackstone", weight: 8 }, { id: "minecraft:crimson_stem", weight: 5 }, { id: "minecraft:warped_stem", weight: 5 }, { id: "minecraft:shroomlight", weight: 3 }, { id: "minecraft:nether_brick", weight: 2 }, { id: "minecraft:magma_block", weight: 1 }] },
  { name: "The End", threshold: 4000, blocks: [{ id: "minecraft:end_stone", weight: 45 }, { id: "minecraft:purpur_block", weight: 25 }, { id: "minecraft:purpur_pillar", weight: 15 }, { id: "minecraft:obsidian", weight: 10 }, { id: "minecraft:crying_obsidian", weight: 5 }] },
  { name: "The Eternal World", threshold: 5000, blocks: [{ id: "minecraft:ancient_debris", weight: 2 }, { id: "minecraft:netherite_block", weight: 1 }, { id: "minecraft:emerald_ore", weight: 12 }, { id: "minecraft:deepslate_emerald_ore", weight: 10 }, { id: "minecraft:diamond_ore", weight: 12 }, { id: "minecraft:deepslate_diamond_ore", weight: 12 }, { id: "minecraft:obsidian", weight: 20 }, { id: "minecraft:crying_obsidian", weight: 8 }, { id: "minecraft:gold_ore", weight: 10 }, { id: "minecraft:nether_gold_ore", weight: 13 }] }
];

function getBreakCount() {
  const value = world.getDynamicProperty(BREAKS_KEY);
  return typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
}

function phaseForCount(count) {
  let phase = 1;
  for (let i = 0; i < PHASES.length; i++) if (count >= PHASES[i].threshold) phase = i + 1;
  return phase;
}

function weightedPick(entries) {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0);
  let roll = Math.random() * total;
  for (const entry of entries) {
    roll -= entry.weight;
    if (roll < 0) return entry;
  }
  return entries[entries.length - 1];
}

function phaseWeights(unlocked) {
  const weights = [];
  for (let phase = 1; phase <= unlocked; phase++) {
    const age = unlocked - phase;
    if (age === 0) weights.push({ phase, weight: 45 });
    else if (age === 1) weights.push({ phase, weight: 25 });
    else if (age === 2) weights.push({ phase, weight: 15 });
    else if (age === 3) weights.push({ phase, weight: 10 });
    else weights.push({ phase, weight: 5 / (unlocked - 4) });
  }
  return weights;
}

function chooseBlock(unlocked) {
  const selectedPhase = weightedPick(phaseWeights(unlocked)).phase;
  return weightedPick(PHASES[selectedPhase - 1].blocks).id;
}

function initializeCore(player) {
  if (!player.hasTag("void_cleaned")) return;
  try {
    const block = world.getDimension("overworld").getBlock(CORE);
    if (block && block.typeId === "minecraft:grass_block") block.setType("minecraft:dirt");
    if (typeof world.getDynamicProperty(BREAKS_KEY) !== "number") world.setDynamicProperty(BREAKS_KEY, 0);
  } catch (e) {}
}

world.afterEvents.playerSpawn.subscribe(({ player }) => {
  system.runTimeout(() => initializeCore(player), 2);
});

world.afterEvents.playerBreakBlock.subscribe((event) => {
  const location = event.block.location;
  if (location.x !== CORE.x || location.y !== CORE.y || location.z !== CORE.z) return;
  if (!event.player.hasTag("void_cleaned")) return;
  const previousCount = getBreakCount();
  const nextCount = previousCount + 1;
  world.setDynamicProperty(BREAKS_KEY, nextCount);
  const oldPhase = phaseForCount(previousCount);
  const newPhase = phaseForCount(nextCount);
  if (newPhase > oldPhase) world.sendMessage(`Phase ${newPhase} unlocked: ${PHASES[newPhase - 1].name}. New resources have been added to the OneBlock pool.`);
  const nextBlock = chooseBlock(newPhase);
  const dimension = event.block.dimension;
  system.run(() => {
    try {
      const core = dimension.getBlock(CORE);
      if (core && core.isAir) core.setType(nextBlock);
    } catch (e) {}
  });
});
