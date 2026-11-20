import {
  world,
  system,
  MolangVariableMap,
  EquipmentSlot,
  EntityComponentTypes,
} from "@minecraft/server";
import { isActive, getBattery } from "./visor_toggle.js";

const VISOR_ID      = "aln:xray_visor";
const SCAN_INTERVAL = 10;
const RADIUS_MIN    = 3;
const RADIUS_MAX    = 7;
const ORE_LIMIT     = 20;
const STONE_LIMIT   = 10;

const ORE_TIERS = [
  {
    suffixes: ["diamond_ore", "emerald_ore"],
    particle: "aln:ore_diamond",
    color: { red: 0.0, green: 1.0, blue: 0.93 },
  },
  {
    suffixes: ["gold_ore", "ancient_debris"],
    particle: "aln:ore_gold",
    color: { red: 1.0, green: 0.84, blue: 0.0 },
  },
  {
    suffixes: ["iron_ore", "copper_ore"],
    particle: "aln:ore_iron",
    color: { red: 1.0, green: 0.55, blue: 0.26 },
  },
  {
    suffixes: ["redstone_ore"],
    particle: "aln:ore_redstone",
    color: { red: 1.0, green: 0.13, blue: 0.13 },
  },
  {
    suffixes: ["lapis_ore", "coal_ore", "nether_quartz_ore", "nether_gold_ore"],
    particle: "aln:ore_common",
    color: { red: 0.53, green: 0.6, blue: 0.8 },
  },
];

const STONE_IDS = new Set([
  "minecraft:stone",
  "minecraft:deepslate",
  "minecraft:cobbled_deepslate",
  "minecraft:dirt",
  "minecraft:grass_block",
  "minecraft:gravel",
  "minecraft:tuff",
  "minecraft:andesite",
  "minecraft:granite",
  "minecraft:diorite",
  "minecraft:netherrack",
  "minecraft:end_stone",
]);

function getOreTier(typeId) {
  for (const tier of ORE_TIERS) {
    for (const suffix of tier.suffixes) {
      if (typeId.endsWith(suffix)) return tier;
    }
  }
  return null;
}

function isStone(typeId) {
  return STONE_IDS.has(typeId);
}

function buildShellOffsets() {
  const offsets = [];
  const rMaxSq  = RADIUS_MAX * RADIUS_MAX;
  const rMinSq  = RADIUS_MIN * RADIUS_MIN;
  for (let x = -RADIUS_MAX; x <= RADIUS_MAX; x++) {
    for (let y = -RADIUS_MAX; y <= RADIUS_MAX; y++) {
      for (let z = -RADIUS_MAX; z <= RADIUS_MAX; z++) {
        const dSq = x * x + y * y + z * z;
        if (dSq >= rMinSq && dSq <= rMaxSq) offsets.push([x, y, z]);
      }
    }
  }
  return offsets;
}
const SHELL_OFFSETS = buildShellOffsets();

function shuffled(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function getActiveVisorStack(player) {
  try {
    const equip = player.getComponent(EntityComponentTypes.Equippable);
    if (!equip) return null;
    const stack = equip.getEquipment(EquipmentSlot.Head);
    if (!stack || stack.typeId !== VISOR_ID) return null;
    if (!isActive(stack)) return null;
    if (getBattery(stack) <= 0) return null;
    return stack;
  } catch {
    return null;
  }
}

function spawnOreMarker(dimension, bx, by, bz, tier) {
  try {
    const loc   = { x: bx + 0.5, y: by + 0.5, z: bz + 0.5 };
    const molang = new MolangVariableMap();
    molang.setColorRGB("variable.color", tier.color);
    dimension.spawnParticle(tier.particle, loc, molang);
  } catch {  }
}

function spawnStoneHaze(dimension, bx, by, bz) {
  try {
    const loc = { x: bx + 0.5, y: by + 0.5, z: bz + 0.5 };
    dimension.spawnParticle("aln:stone_haze", loc);
  } catch {  }
}

function scanForPlayer(player) {
  const loc       = player.location;
  const dimension = player.dimension;
  const bx0 = Math.floor(loc.x);
  const by0 = Math.floor(loc.y);
  const bz0 = Math.floor(loc.z);

  let oreCount   = 0;
  let stoneCount = 0;
  const offsets  = shuffled(SHELL_OFFSETS);

  for (const [ox, oy, oz] of offsets) {
    if (oreCount >= ORE_LIMIT && stoneCount >= STONE_LIMIT) break;

    const bx = bx0 + ox;
    const by = by0 + oy;
    const bz = bz0 + oz;

    let block;
    try {
      block = dimension.getBlock({ x: bx, y: by, z: bz });
    } catch {
      continue;
    }
    if (!block) continue;

    const typeId = block.typeId;
    const tier   = getOreTier(typeId);

    if (tier && oreCount < ORE_LIMIT) {
      spawnOreMarker(dimension, bx, by, bz, tier);
      oreCount++;
    } else if (!tier && stoneCount < STONE_LIMIT && isStone(typeId)) {
      spawnStoneHaze(dimension, bx, by, bz);
      stoneCount++;
    }
  }
}

export function startScannerLoop() {
  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      if (!getActiveVisorStack(player)) continue;
      scanForPlayer(player);
    }
  }, SCAN_INTERVAL);
}
