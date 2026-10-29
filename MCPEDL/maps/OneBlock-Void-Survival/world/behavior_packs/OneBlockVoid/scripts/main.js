import { world, system, ItemStack, BlockPermutation } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { OVERWORLD_PHASES, NETHER_PHASES, END_PHASES } from "./phases.js";
import { RARITY_TIERS, DIMENSION_TRADE_POOLS } from "./rarities.js";
import { ISLAND_THEMES, OVERWORLD_ISLAND_ORDER, getIslandLocation, buildThemedIsland, isIslandPhysicallyBuilt, getIslandBlockPool } from "./islands.js";
// Admin Build Configuration
// In Survival: false (pure vanilla experience: no Actionbar HUD, no !run or admin command intercepts)
// In Admin World: true (enables !run auto-break testing runner, !hud toggle, !admin GUI, and inspector tools)
const IS_ADMIN_BUILD = false;

function isAdmin(player) {
  return IS_ADMIN_BUILD === true;
}

// Progressive Phase Length Scaling:
// Early Biomes (Phases 0-4): 50 blocks (fast progression through starter woods/caves)
// Mid Biomes (Phases 5-9): 100 blocks (steady exploration)
// Late & Dimension Biomes (Phases 10+): 150 blocks (deep progression through Trials, Deepslate, End)
function getPhaseLength(phaseIndex) {
  if (phaseIndex <= 4) return 50;
  if (phaseIndex <= 9) return 100;
  return 150;
}

const ONEBLOCK_POS = { x: 0, y: 64, z: 0 };
const CHEST_CHANCE = 0.02; // 2%
const MOB_CHANCE = 0.03;   // 3%

const LUCKY_RUSH_CHANCE = 0.005; // 0.5% (1 in 200 blocks)
const VOID_SURGE_CHANCE = 0.005; // 0.5% (1 in 200 blocks)
const JACKPOT_CHANCE = 0.001;    // 0.1% (1 in 1000 blocks)

const activeCountdowns = new Map();
const activeLuckyRush = new Map(); // dimensionKey -> secondsLeft
const recentIslandBreaks = new Map();
const mainPending = new Map();
const lastProgressTick = new Map();
const islandPending = new Map();

// 8 perimeter positions around (0, 64, 0)
const SURROUNDING_OFFSETS = [
  { x: -1, z: -1 }, { x: 0, z: -1 }, { x: 1, z: -1 },
  { x: -1, z: 0 },                    { x: 1, z: 0 },
  { x: -1, z: 1 },  { x: 0, z: 1 },  { x: 1, z: 1 }
];

// 15 Total Curated Tutorial Blocks that perfectly build up the player's starter setup:
// Steps 0-7: 8 Dirts (each auto-places at one side to build safe 3x3 platform)
// Steps 8-10: 3 Oak Logs (1 for Crafting Table, 1 for Sticks, 1 for Pickaxe)
// Steps 11-13: 3 Stones (mine Cobblestone for a Stone Pickaxe)
// Step 14: 1 Coal Ore (for torches & smelting)
const TUTORIAL_BLOCKS = [
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



function rollRarityTier() {
  const total = 100.0;
  let rand = Math.random() * total;
  for (let i = 0; i < RARITY_TIERS.length; i++) {
    if (rand < RARITY_TIERS[i].weight) {
      return i;
    }
    rand -= RARITY_TIERS[i].weight;
  }
  return 0;
}

function pickWeighted(items) {
  const total = items.reduce((sum, item) => sum + (item.weight || 1), 0);
  let random = Math.random() * total;
  for (const item of items) {
    if (random < item.weight) return item;
    random -= item.weight;
  }
  return items[0];
}

function getDimKey(dimensionId) {
  if (dimensionId.includes("nether")) return "nether";
  if (dimensionId.includes("the_end") || dimensionId.includes("end")) return "end";
  return "overworld";
}

function getPhasesForDim(dimKey) {
  switch (dimKey) {
    case "nether": return NETHER_PHASES;
    case "end": return END_PHASES;
    default: return OVERWORLD_PHASES;
  }
}

// Computes progressive phase index and progress from block count
function getDimensionState(dimKey) {
  const countProp = `ob_${dimKey}_count`;
  const count = world.getDynamicProperty(countProp) ?? 0;
  const phases = getPhasesForDim(dimKey);

  let accumulated = 0;
  let phaseIndex = 0;
  let progressInPhase = 0;
  let currentPhaseLength = getPhaseLength(0);

  for (let i = 0; i < phases.length; i++) {
    const len = getPhaseLength(i);
    if (accumulated + len > count || i === phases.length - 1) {
      phaseIndex = i;
      progressInPhase = Math.max(0, count - accumulated);
      currentPhaseLength = len;
      break;
    }
    accumulated += len;
  }

  return {
    count,
    phaseIndex,
    phase: phases[phaseIndex],
    progressInPhase,
    currentPhaseLength
  };
}

function getCardinalFromCoords(dx, dz) {
  try {
    const deg = ((Math.atan2(dz, dx) * 180) / Math.PI + 360) % 360;
    const directions = ["East", "South-East", "South", "South-West", "West", "North-West", "North", "North-East"];
    const cardinalIdx = Math.round(deg / 45) % 8;
    return directions[cardinalIdx];
  } catch (e) {
    return "North";
  }
}

// Drops item precisely hovering above OneBlock at (0.5, 65.2, 0.5) with zero velocity
function hoverDropAboveOneBlock(dimension, itemStack) {
  try {
    const itemEntity = dimension.spawnItem(itemStack, { x: 0.5, y: 65.2, z: 0.5 });
    itemEntity.clearVelocity();
  } catch (err) {}
}

// Spawns a real Minecraft Chest block ABOVE ONEBLOCK_POS at (0, 65, 0) and populates it with items
function spawnOneBlockChest(dimension, items = []) {
  try {
    const chestPos = { x: ONEBLOCK_POS.x, y: ONEBLOCK_POS.y + 1, z: ONEBLOCK_POS.z };

    // Remove any lingering chest_minecart entities around OneBlock
    try {
      const existing = dimension.getEntities({
        type: "minecraft:chest_minecart",
        location: { x: chestPos.x + 0.5, y: chestPos.y + 0.5, z: chestPos.z + 0.5 },
        maxDistance: 2.5
      });
      for (const ent of existing) ent.remove();
    } catch (ee) {}

    const block = dimension.getBlock(chestPos);
    if (block) {
      if (block.typeId !== "minecraft:chest") {
        if (!block.isAir) {
          // Never destroy a player-built block: drop the loot instead
          for (const it of items) {
            try { if (it instanceof ItemStack) dimension.spawnItem(it, { x: chestPos.x + 0.5, y: chestPos.y + 0.2, z: chestPos.z + 0.5 }); } catch (se) {}
          }
          return;
        }
        block.setType("minecraft:chest");
      }

      // Populate chest inventory container on next tick once block entity is instantiated
      system.runTimeout(() => {
        try {
          const cb = dimension.getBlock(chestPos);
          if (cb && cb.typeId === "minecraft:chest") {
            const chestComp = cb.getComponent("minecraft:inventory");
            if (chestComp && chestComp.container) {
              spawnScatteredLootInChest(chestComp.container, items);
            }
          }
        } catch (ie) {}
      }, 1);

      dimension.spawnParticle("minecraft:totem_particle", { x: chestPos.x + 0.5, y: chestPos.y + 0.5, z: chestPos.z + 0.5 });
      dimension.playSound("random.chestopen", chestPos, { volume: 1.0, pitch: 1.0 });
    }
  } catch (e) {}
}

// Scatters loot across random single-chest slots (0-26) with realistic splitting, like vanilla structure loot chests
function spawnScatteredLootInChest(container, chestItems = []) {
  try {
    if (!container || !chestItems || chestItems.length === 0) return;

    // Available slot indices [0..container.size - 1] (single chest: 0..26)
    const availableSlots = [];
    for (let s = 0; s < container.size; s++) {
      availableSlots.push(s);
    }
    // Fisher-Yates shuffle
    for (let i = availableSlots.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableSlots[i], availableSlots[j]] = [availableSlots[j], availableSlots[i]];
    }

    // Deconstruct chest items into smaller stacks if count > 4 for authentic structure chest distribution
    const itemsToPlace = [];
    for (const entry of chestItems) {
      if (!entry) continue;
      if (entry instanceof ItemStack) {
        itemsToPlace.push(entry);
        continue;
      }
      let itemId = typeof entry === "string" ? entry : (entry.id || entry.typeId);
      let count = entry.count || entry.amount || 1;
      if (!itemId) continue;

      if (count > 4 && Math.random() < 0.75) {
        const half = Math.floor(count / 2);
        const rem = count - half;
        try { itemsToPlace.push(new ItemStack(itemId, half)); } catch (e) {}
        try { itemsToPlace.push(new ItemStack(itemId, rem)); } catch (e) {}
      } else {
        try {
          itemsToPlace.push(new ItemStack(itemId, count));
        } catch (e) {}
      }
    }

    // Place into randomized slots
    for (const stack of itemsToPlace) {
      if (availableSlots.length === 0) break;
      const slot = availableSlots.pop();
      try {
        if (container.getItem(slot)) container.addItem(stack); else container.setItem(slot, stack);
      } catch (e) {
        try { container.addItem(stack); } catch (e2) {}
      }
    }
  } catch (err) {}
}

// Finds players who broke the block or are near the island (radius 48 blocks) for clean multiplayer notifications
function getNearbyIslandPlayers(dimension, loc, maxDistance = 48, breakerPlayer = null) {
  const nearby = new Set();
  if (breakerPlayer) nearby.add(breakerPlayer);
  try {
    for (const p of world.getAllPlayers()) {
      if (p.dimension.id === dimension.id) {
        const dx = p.location.x - loc.x;
        const dy = p.location.y - loc.y;
        const dz = p.location.z - loc.z;
        const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist <= maxDistance) {
          nearby.add(p);
        }
      }
    }
  } catch (e) {}
  return Array.from(nearby);
}

// Finalizes a fully mined island core (bedrock -> natural floor + reward chest).
// Safe to call repeatedly: retried by ensureIslandOneBlocks if the chunk was unloaded or the world was closed.
function finalizeIslandCore(dimension, theme, loc, player) {
  try {
    if (world.getDynamicProperty(`island_ob_final_${theme.id}`)) return;
    const targetBlock = dimension.getBlock(loc);
    if (!targetBlock) return; // chunk unloaded, retry later
    world.setDynamicProperty(`island_ob_final_${theme.id}`, true);
    if (targetBlock.typeId !== "minecraft:bedrock") return;

    try { targetBlock.setType(theme.floor); } catch (e) { try { targetBlock.setType("minecraft:dirt"); } catch (e2) {} }
    const underBlock = dimension.getBlock({ x: loc.x, y: loc.y - 1, z: loc.z });
    if (underBlock) {
      try { underBlock.setType(theme.subfloor || theme.floor); } catch (e) { try { underBlock.setType(theme.floor); } catch (e2) {} }
    }
    const besideOffsets = [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }];
    for (const off of besideOffsets) {
      const bBlock = dimension.getBlock({ x: loc.x + off.x, y: loc.y, z: loc.z + off.z });
      if (bBlock && bBlock.typeId === "minecraft:bedrock") {
        try { bBlock.setType(theme.floor); } catch (e) { try { bBlock.setType("minecraft:dirt"); } catch (e2) {} }
      }
    }

    const chestPos = { x: loc.x, y: loc.y + 1, z: loc.z };
    try {
      const existing = dimension.getEntities({
        type: "minecraft:chest_minecart",
        location: { x: chestPos.x + 0.5, y: chestPos.y + 0.5, z: chestPos.z + 0.5 },
        maxDistance: 2.5
      });
      for (const ent of existing) ent.remove();
    } catch (ee) {}

    const chestBlock = dimension.getBlock(chestPos);
    if (chestBlock) {
      if (chestBlock.isAir || chestBlock.typeId === "minecraft:chest") {
        if (chestBlock.isAir) chestBlock.setType("minecraft:chest");
        system.runTimeout(() => {
          try {
            const cb = dimension.getBlock(chestPos);
            if (cb && cb.typeId === "minecraft:chest") {
              const chestComp = cb.getComponent("minecraft:inventory");
              if (chestComp && chestComp.container) {
                spawnScatteredLootInChest(chestComp.container, theme.chest);
              }
            }
          } catch (ie) {}
        }, 1);
      } else {
        // Never destroy a player-built block: drop the reward instead
        for (const entry of theme.chest || []) {
          try { dimension.spawnItem(new ItemStack(entry.id, entry.count || 1), { x: chestPos.x + 0.5, y: chestPos.y + 0.5, z: chestPos.z + 0.5 }); } catch (de) {}
        }
      }
    }

    try {
      dimension.spawnEntity("minecraft:fireworks_rocket", { x: loc.x + 0.5, y: loc.y + 2.0, z: loc.z + 0.5 });
      dimension.spawnParticle("minecraft:totem_particle", { x: loc.x + 0.5, y: loc.y + 1.5, z: loc.z + 0.5 });
      dimension.playSound("random.levelup", loc, { pitch: 1.2, volume: 1.0 });
      dimension.playSound("random.chestopen", chestPos, { pitch: 1.0, volume: 1.0 });
    } catch (fe) {}

    for (const p of getNearbyIslandPlayers(dimension, loc, 48, player)) {
      p.sendMessage(`${theme.color}★ [Island Core Conquered] §fThe Bedrock core has stabilized into the island's natural floor! The Sacred Treasure Chest has manifested above!\n`);
    }
  } catch (err) {}
}

// Handles breaking of an Island Mini-OneBlock Core (30-50 blocks capacity)
function handleIslandOneBlockBreak(dimension, loc, player) {
  try {
    const dimKey = getDimKey(dimension.id);
    const targetDim = (dimKey === "nether") ? "nether" : ((dimKey === "end") ? "the_end" : "overworld");
    let matchedTheme = null;
    for (const theme of ISLAND_THEMES) {
      if ((theme.dimension || "overworld") !== targetDim) continue;
      const completed = world.getDynamicProperty(`island_ob_completed_${theme.id}`);
      if (completed) continue;
      const obX = world.getDynamicProperty(`island_ob_x_${theme.id}`);
      if (obX === undefined) continue;
      const obY = world.getDynamicProperty(`island_ob_y_${theme.id}`);
      const obZ = world.getDynamicProperty(`island_ob_z_${theme.id}`);
      if (loc.x === obX && loc.y === obY && loc.z === obZ) {
        matchedTheme = theme;
        break;
      }
    }
    if (!matchedTheme) return;
    recentIslandBreaks.set(matchedTheme.id, system.currentTick);

    const maxBlocks = world.getDynamicProperty(`island_ob_max_${matchedTheme.id}`) ?? 40;
    const currentMined = (world.getDynamicProperty(`island_ob_mined_${matchedTheme.id}`) ?? 0) + 1;
    world.setDynamicProperty(`island_ob_mined_${matchedTheme.id}`, currentMined);

    const progress = currentMined / maxBlocks;

    // Visual feedback ONLY via particle progression (no action bar counter text)
    if (progress < 0.5) {
      // Early Stage (<50%): Happy villager green sparkles
      dimension.spawnParticle("minecraft:villager_happy", { x: loc.x + 0.5, y: loc.y + 1.2, z: loc.z + 0.5 });
      dimension.playSound("random.orb", loc, { pitch: 1.0, volume: 0.6 });
    } else if (progress < 0.85) {
      // Mid Stage (50-85%): Golden sparks
      dimension.spawnParticle("minecraft:wax_particle", { x: loc.x + 0.5, y: loc.y + 1.2, z: loc.z + 0.5 });
      dimension.playSound("random.orb", loc, { pitch: 1.3, volume: 0.7 });
    } else {
      // Final Stage (>85%): Mystical Purple Amethyst & Void sparkles
      dimension.spawnParticle("minecraft:portal_particle", { x: loc.x + 0.5, y: loc.y + 1.2, z: loc.z + 0.5 });
      dimension.spawnParticle("minecraft:dragon_breath_fire", { x: loc.x + 0.5, y: loc.y + 1.2, z: loc.z + 0.5 });
      dimension.playSound("block.amethyst_block.chime", loc, { pitch: 1.4, volume: 0.9 });
    }

    if (currentMined < maxBlocks) {
      // Respawn next thematic block from the island's unique pool
      const pool = getIslandBlockPool(matchedTheme);
      const nextBlockId = pool[Math.floor(Math.random() * pool.length)];

      system.run(() => {
        try {
          const targetBlock = dimension.getBlock(loc);
          if (targetBlock) {
            let placed = false;
            try {
              targetBlock.setType(nextBlockId);
              if (!targetBlock.isAir && targetBlock.typeId !== "minecraft:air") placed = true;
            } catch (e1) {}
            if (!placed) {
              try {
                targetBlock.setType(matchedTheme.floor);
                if (!targetBlock.isAir && targetBlock.typeId !== "minecraft:air") placed = true;
              } catch (e2) {}
            }
            if (!placed) {
              try { targetBlock.setType("minecraft:dirt"); } catch (e3) {}
            }
          }
          const underBlock = dimension.getBlock({ x: loc.x, y: loc.y - 1, z: loc.z });
          if (underBlock) {
            try { underBlock.setType("minecraft:bedrock"); } catch (ue) {}
          }

          const besideOffsets = [
            { x: 1, z: 0 },
            { x: -1, z: 0 },
            { x: 0, z: 1 },
            { x: 0, z: -1 }
          ];
          for (const off of besideOffsets) {
            const bBlock = dimension.getBlock({ x: loc.x + off.x, y: loc.y, z: loc.z + off.z });
            if (bBlock) {
              try { bBlock.setType("minecraft:bedrock"); } catch (se) {}
            }
          }
        } catch (e) {}
      });

      // Keep drops floating safely above altar
      system.runTimeout(() => {
        try {
          const nearbyItems = dimension.getEntities({
            type: "minecraft:item",
            location: { x: loc.x + 0.5, y: loc.y + 0.5, z: loc.z + 0.5 },
            maxDistance: 2.5
          });
          for (const itemEnt of nearbyItems) {
            itemEnt.teleport({ x: loc.x + 0.5, y: loc.y + 1.2, z: loc.z + 0.5 });
            itemEnt.clearVelocity();
          }
        } catch (e) {}
      }, 1);
    } else {
      // Fully mined! The core first reveals solid Bedrock for 3 seconds, then stabilizes into the normal floor block!
      world.setDynamicProperty(`island_ob_completed_${matchedTheme.id}`, true);

      // 1. Instantly place Bedrock at the core location and reinforce surrounding bedrock collar
      system.run(() => {
        try {
          const targetBlock = dimension.getBlock(loc);
          if (targetBlock) {
            targetBlock.setType("minecraft:bedrock");
          }
          const underBlock = dimension.getBlock({ x: loc.x, y: loc.y - 1, z: loc.z });
          if (underBlock) underBlock.setType("minecraft:bedrock");

          const besideOffsets = [
            { x: 1, z: 0 },
            { x: -1, z: 0 },
            { x: 0, z: 1 },
            { x: 0, z: -1 }
          ];
          for (const off of besideOffsets) {
            const bBlock = dimension.getBlock({ x: loc.x + off.x, y: loc.y, z: loc.z + off.z });
            if (bBlock) bBlock.setType("minecraft:bedrock");
          }
        } catch (e) {}
      });

      // Bedrock manifestation FX: deep resonance & void energy
      try {
        dimension.playSound("block.anvil.land", loc, { pitch: 0.7, volume: 1.0 });
        dimension.playSound("block.amethyst_block.resonate", loc, { pitch: 0.9, volume: 1.0 });
        dimension.spawnParticle("minecraft:portal_particle", { x: loc.x + 0.5, y: loc.y + 1.2, z: loc.z + 0.5 });
        dimension.spawnParticle("minecraft:dragon_breath_fire", { x: loc.x + 0.5, y: loc.y + 1.2, z: loc.z + 0.5 });
      } catch (e) {}

      const targetAudience = getNearbyIslandPlayers(dimension, loc, 48, player);
      for (const p of targetAudience) {
        p.onScreenDisplay.setActionBar(`§5✦ Bedrock Core Exposed! Stabilizing terrain... (3s) ✦`);
        p.sendMessage(`\n${matchedTheme.color}✦ [Core Reached] §fThe Island Core has struck Bedrock! Stabilizing into natural terrain in 3 seconds...`);
      }

      // Pulsing stabilization particles during the 3-second countdown
      for (let s = 1; s <= 2; s++) {
        system.runTimeout(() => {
          try {
            dimension.spawnParticle("minecraft:wax_particle", { x: loc.x + 0.5, y: loc.y + 1.2, z: loc.z + 0.5 });
            dimension.playSound("random.orb", loc, { pitch: 1.0 + s * 0.3, volume: 0.8 });
          } catch (e) {}
        }, s * 20);
      }

      // 2. 3 seconds later: finalize (retried by ensureIslandOneBlocks if the chunk unloads or the world closes)
      world.setDynamicProperty(`island_ob_done_tick_${matchedTheme.id}`, system.currentTick);
      system.runTimeout(() => {
        finalizeIslandCore(dimension, matchedTheme, loc, player);
      }, 60);
    }
  } catch (err) {}
}

function spawnCelebrationFireworks(dimension) {
  try {
    for (let i = 0; i < 5; i++) {
      system.runTimeout(() => {
        try {
          const offsetX = (Math.random() - 0.5) * 4;
          const offsetZ = (Math.random() - 0.5) * 4;
          dimension.spawnEntity("minecraft:fireworks_rocket", {
            x: 0.5 + offsetX,
            y: 66.0,
            z: 0.5 + offsetZ
          });
        } catch (e) {}
      }, i * 15);
    }
  } catch (e) {}
}

// Spawn Phase Climax Mini-Boss strictly in Late-Game (Phase 10+ in Overworld, or Nether/End)
function spawnPhaseMiniBoss(dimKey, dimension, phaseIndex) {
  try {
    // Completely skip mini-bosses for the first 10 phases of Overworld (Phases 0 to 9 are peaceful / exploration focused!)
    if (dimKey === "overworld" && phaseIndex < 10) {
      return;
    }

    let bossType = "minecraft:zombie";
    let bossName = "§c§lZombie King§r";

    if (dimKey === "nether") {
      bossType = "minecraft:wither_skeleton";
      bossName = "§4§lWither Skeleton Warlord§r";
    } else if (dimKey === "end") {
      bossType = "minecraft:enderman";
      bossName = "§5§lVoid Assassin§r";
    } else {
      // Alternate Zombie King, Skeleton Captain, or Breeze in Late Overworld
      if (Math.random() < 0.5) {
        bossType = "minecraft:skeleton";
        bossName = "§c§lSkeleton Captain§r";
      }
    }

    const boss = dimension.spawnEntity(bossType, { x: 0.5, y: 65.0, z: 0.5 });
    boss.nameTag = bossName;
    boss.clearVelocity();

    dimension.spawnParticle("minecraft:huge_explosion_emitter", { x: 0.5, y: 65.0, z: 0.5 });
    dimension.playSound("mob.enderdragon.growl", { x: 0.5, y: 65.0, z: 0.5 }, { volume: 1.0, pitch: 0.8 });

    for (const p of world.getAllPlayers()) {
      p.sendMessage(`§c§l[PHASE CLIMAX] §4A ${bossName} §4burst from the OneBlock! Defeat it!`);
    }
  } catch (err) {}
}

// Start Lucky Rush event (10 seconds)
function triggerLuckyRush(dimKey, dimension) {
  if (activeLuckyRush.get(dimKey)) return;
  activeLuckyRush.set(dimKey, 10);

  for (const p of world.getAllPlayers()) {
    p.onScreenDisplay.setTitle("§6§l★ LUCKY RUSH! ★", {
      stayDuration: 60,
      fadeInDuration: 5,
      fadeOutDuration: 10,
      subtitle: "§e10s of Golden Mineral Spawns!"
    });
    p.playSound("random.levelup", { pitch: 1.5, volume: 1.0 });
  }

  let timer = 10;
  const loop = system.runInterval(() => {
    timer--;
    activeLuckyRush.set(dimKey, timer);

    try {
      dimension.spawnParticle("minecraft:villager_happy", { x: 0.5, y: 65.5, z: 0.5 });
    } catch (e) {}

    if (timer <= 0) {
      system.clearRun(loop);
      activeLuckyRush.delete(dimKey);
      for (const p of world.getAllPlayers()) {
        p.sendMessage("§6[Lucky Rush] §eThe Lucky Rush event has concluded!");
      }
    }
  }, 20);
}

// Start Void Surge event (10 seconds dark particles + lightning sound + hostile waves)
function triggerVoidSurge(dimKey, dimension) {
  for (const p of world.getAllPlayers()) {
    p.onScreenDisplay.setTitle("§5§l⚡ VOID SURGE! ⚡", {
      stayDuration: 60,
      fadeInDuration: 5,
      fadeOutDuration: 10,
      subtitle: "§cSurvive the dark rift!"
    });
    p.playSound("ambient.weather.thunder", { pitch: 0.9, volume: 1.0 });
  }

  let surgeTimer = 10;
  const surgeLoop = system.runInterval(() => {
    surgeTimer -= 2;

    try {
      dimension.spawnParticle("minecraft:portal_reverse_particle", { x: 0.5, y: 65.5, z: 0.5 });
      dimension.playSound("ambient.weather.lightning.impact", { x: 0.5, y: 65.0, z: 0.5 }, { volume: 0.8, pitch: 1.0 });

      // Spawn surge hostile mob
      const mobPool = dimKey === "nether" ? ["minecraft:piglin_brute", "minecraft:magma_cube"] : ["minecraft:spider", "minecraft:zombie", "minecraft:skeleton"];
      const chosenMob = mobPool[Math.floor(Math.random() * mobPool.length)];
      const mob = dimension.spawnEntity(chosenMob, { x: 0.5, y: 65.0, z: 0.5 });
      mob.clearVelocity();
    } catch (e) {}

    if (surgeTimer <= 0) {
      system.clearRun(surgeLoop);
      for (const p of world.getAllPlayers()) {
        p.sendMessage("§5[Void Surge] §aThe dark rift has sealed! Island is safe again.");
      }
    }
  }, 40);
}

// Trigger Jackpot Geode Chest
function triggerJackpot(dimension) {
  try {
    const jackpotMinerals = ["minecraft:diamond_block", "minecraft:emerald_block", "minecraft:iron_block", "minecraft:gold_block"];
    const count = Math.floor(Math.random() * 3) + 3; // 3 to 5 mineral blocks
    const items = [];
    for (let i = 0; i < count; i++) {
      const mineralId = jackpotMinerals[Math.floor(Math.random() * jackpotMinerals.length)];
      items.push(new ItemStack(mineralId, 1));
    }
    spawnOneBlockChest(dimension, items);
    dimension.spawnParticle("minecraft:totem_particle", { x: 0.5, y: 65.5, z: 0.5 });
    dimension.playSound("ui.toast.challenge_complete", { x: 0.5, y: 65.0, z: 0.5 }, { volume: 1.0, pitch: 1.2 });

    for (const p of world.getAllPlayers()) {
      p.onScreenDisplay.setTitle("§e§lJACKPOT CHEST!§r", {
        stayDuration: 60,
        fadeInDuration: 5,
        fadeOutDuration: 10,
        subtitle: `§aUncovered ${count}x Precious Mineral Blocks in a Chest!`
      });
    }
  } catch (err) {}
}

function startPhaseTransition(dimKey, dimension, newPhaseIdx, isGameComplete) {
  const phases = getPhasesForDim(dimKey);
  const nextPhase = phases[newPhaseIdx];

  activeCountdowns.set(dimKey, true);

  try {
    const ob = dimension.getBlock(ONEBLOCK_POS);
    if (ob) ob.setType("minecraft:bedrock");
  } catch (e) {}

  let secondsLeft = 5;

  const timerId = system.runInterval(() => {
    // Keep bedrock locked firmly at (0,64,0) throughout the entire countdown
    try {
      const ob = dimension.getBlock(ONEBLOCK_POS);
      if (ob && ob.typeId !== "minecraft:bedrock") {
        ob.setType("minecraft:bedrock");
      }
    } catch (be) {}

    if (secondsLeft > 0) {
      for (const p of world.getAllPlayers()) {
        try {
          p.onScreenDisplay.setTitle(`§c§l${secondsLeft}`, {
            stayDuration: 20,
            fadeInDuration: 0,
            fadeOutDuration: 10,
            subtitle: `§ePhase Advancing in...`
          });
          p.playSound("note.pling", { pitch: 1.0 + (5 - secondsLeft) * 0.2, volume: 1.0 });
        } catch (e) {}
      }
      secondsLeft--;
    } else {
      system.clearRun(timerId);
      activeCountdowns.delete(dimKey);

      try {
        const ob = dimension.getBlock(ONEBLOCK_POS);
        if (ob) {
          const chosen = pickWeighted(nextPhase.blocks);
          ob.setType(chosen.id);
        }
      } catch (e) {}

      spawnCelebrationFireworks(dimension);

      if (isGameComplete) {
        for (const p of world.getAllPlayers()) {
          try {
            p.addTag("void_champion");
            p.nameTag = `§6[Void Champion] §f${p.name}`;
            p.onScreenDisplay.setTitle("§6§lCONGRATULATIONS!", {
              stayDuration: 140,
              fadeInDuration: 10,
              fadeOutDuration: 20,
              subtitle: "§a§lPRESTIGE TITLE UNLOCKED: VOID CHAMPION!§r"
            });
            p.sendMessage("\n§6==================================================");
            p.sendMessage("§e★ §6§lCONGRATULATIONS! YOU HAVE CONQUERED ALL PHASES! §e★");
            p.sendMessage("§fThank you so much for playing this map!");
            p.sendMessage("§aYou have earned the permanent prestige title: §6[Void Champion]§a!");
            p.sendMessage("§bCreator: §eAllensCreations");
            p.sendMessage("§aPlease support the game by downloading & rating on §6MCPEDL.COM§a!");
            p.sendMessage("§6==================================================\n");
            p.playSound("ui.toast.challenge_complete", { pitch: 1.0, volume: 1.0 });
          } catch (e) {}
        }
      } else {
        for (const p of world.getAllPlayers()) {
          try {
            p.onScreenDisplay.setTitle(`§a§lPHASE ${newPhaseIdx + 1}!`, {
              stayDuration: 80,
              fadeInDuration: 10,
              fadeOutDuration: 15,
              subtitle: `§6${nextPhase.name}`
            });
            p.sendMessage(`§d§l[OneBlocked] §eCongratulations! Reached §aPhase ${newPhaseIdx + 1}: ${nextPhase.name}§e! §7(by §bAllensCreations§7)`);
            p.playSound("random.levelup", { pitch: 1.0, volume: 1.0 });
          } catch (e) {}
        }
      }
    }
  }, 20);
}

function materializeIsland(dimension, theme, phaseIndex, totalCount) {
  try {
    const dimKey = getDimKey(dimension.id);
    const lastX = world.getDynamicProperty(`last_island_x_${dimKey}`) ?? world.getDynamicProperty("last_island_x");
    const lastZ = world.getDynamicProperty(`last_island_z_${dimKey}`) ?? world.getDynamicProperty("last_island_z");
    const lastPos = (lastX !== undefined && lastZ !== undefined) ? { x: lastX, z: lastZ } : null;

    const islandLoc = getIslandLocation(phaseIndex + Math.floor(totalCount / 100), 42, theme, lastPos);

    // Record this island as the last materialized island in dimension & globally
    world.setDynamicProperty(`last_island_x_${dimKey}`, islandLoc.center.x);
    world.setDynamicProperty(`last_island_z_${dimKey}`, islandLoc.center.z);
    world.setDynamicProperty("last_island_x", islandLoc.center.x);
    world.setDynamicProperty("last_island_z", islandLoc.center.z);

    // Store active island target in world dynamic properties for navigation/arrival
    world.setDynamicProperty(`island_spawned_${theme.id}`, true);
    world.setDynamicProperty(`island_target_x_${theme.id}`, islandLoc.center.x);
    world.setDynamicProperty(`island_target_y_${theme.id}`, islandLoc.center.y);
    world.setDynamicProperty(`island_target_z_${theme.id}`, islandLoc.center.z);

    const cardinal = getCardinalFromCoords(islandLoc.center.x, islandLoc.center.z);

    // 1. GUARANTEED IMMEDIATE ANNOUNCEMENT & CELESTIAL AMETHYST CHIME (COMPASS COMPLETELY REMOVED)
    const dimPlayers = world.getAllPlayers().filter(p => p.dimension.id === dimension.id);
    for (const p of dimPlayers) {
      try {
        // Celestial Rift Sound FX & Amethyst Chime
        p.playSound("block.amethyst_block.chime", { pitch: 1.0, volume: 1.0 });
        p.playSound("block.amethyst_block.resonate", { pitch: 1.1, volume: 0.8 });
        p.playSound("ambient.weather.wind", { pitch: 0.9, volume: 0.5 });

        // Dramatic Title & Subtitle announcement
        p.onScreenDisplay.setTitle("§5§l✦ RIFT MANIFESTED ✦§r", {
          subtitle: `§dSomewhere in the distant §b${cardinal}§d... a new island has materialized!`,
          fadeInDuration: 10,
          stayDuration: 70,
          fadeOutDuration: 20
        });

        // Action bar toast
        p.onScreenDisplay.setActionBar(`§e⚡ A distant island has materialized in the §b${cardinal}§e! Follow the starlight trail.`);

        // Clean atmospheric chat announcement
        p.sendMessage(`\n§d✦ §lSomewhere in the Void...§r §da new island has materialized!`);
        p.sendMessage(`§e★ A distant island has materialized in the void! Look for the starlight trail in the §b§l${cardinal}§r§e.\n`);
      } catch (pe) {}
    }

    // 2. Shooting Starlight Trail: Particle stream shooting 30 blocks from OneBlock towards the new island
    try {
      const dx = islandLoc.center.x;
      const dz = islandLoc.center.z;
      const dist = Math.sqrt(dx * dx + dz * dz) || 1;
      const normX = dx / dist;
      const normZ = dz / dist;
      for (let step = 1; step <= 30; step++) {
        system.runTimeout(() => {
          try {
            const px = 0.5 + normX * step;
            const py = 65.5 + Math.sin((step / 30) * Math.PI) * 4;
            const pz = 0.5 + normZ * step;
            dimension.spawnParticle("minecraft:endrod", { x: px, y: py, z: pz });
            dimension.spawnParticle("minecraft:portal_particle", { x: px, y: py, z: pz });
          } catch (e) {}
        }, Math.floor(step * 1.5));
      }
    } catch (pe) {}

    // 3. PHYSICAL MATERIALIZATION & CHUNK PRELOAD:
    // First, try immediate build if chunk is already loaded (e.g. inner 42m ring)
    try {
      const placed = buildThemedIsland(dimension, theme, islandLoc.center);
      if (placed > 0) {
        world.setDynamicProperty(`island_built_${theme.id}`, true);
      }
    } catch (ie1) {}

    // Also attempt temporary ticking area to preload chunk and guarantee immediate materialization:
    const areaName = `temp_isl_${theme.id.slice(0, 8)}`;
    try { dimension.runCommand(`tickingarea remove ${areaName}`); } catch (e) {}
    try { dimension.runCommand(`tickingarea add circle ${islandLoc.center.x} ${islandLoc.center.y} ${islandLoc.center.z} 3 ${areaName} true`); } catch (e) {}

    system.runTimeout(() => {
      try {
        if (!isIslandPhysicallyBuilt(dimension, islandLoc.center)) {
          const placed = buildThemedIsland(dimension, theme, islandLoc.center);
          if (placed > 0) {
            world.setDynamicProperty(`island_built_${theme.id}`, true);
          }
        }
      } catch (ie2) {}
      try { dimension.runCommand(`tickingarea remove ${areaName}`); } catch (e) {}
    }, 20);
  } catch (err) {}
}

function checkRandomIslandSpawn(dimension, phaseIndex, totalCount) {
  try {
    const dimKey = getDimKey(dimension.id);
    const targetDim = (dimKey === "nether") ? "nether" : ((dimKey === "end") ? "the_end" : "overworld");

    // Avoid triggering island rifts during tutorial and early starter phases (up to Phase 3) in overworld
    if (dimKey === "overworld" && (totalCount < TUTORIAL_BLOCKS.length || phaseIndex <= 3)) return;

    // 1. Track blocks mined since last island spawn in this dimension:
    const lastMineProp = `last_island_mine_count_${dimKey}`;
    const lastMineCount = world.getDynamicProperty(lastMineProp) ?? 0;
    const blocksSinceLast = totalCount - lastMineCount;

    // 2. Dynamic Pity timer: roughly 1 island per 120 blocks mined (~0.8% chance per block)
    const isPity = (blocksSinceLast >= 120);
    const isRandom = (Math.random() < 0.008);

    if (!isPity && !isRandom) return;

    let selectedTheme = null;

    if (targetDim === "overworld") {
      // STRICT SEQUENTIAL CIRCLE PROGRESSION:
      // Focus on Circle 1 first (Ring 1, 6 islands, r=72m).
      // Only when ALL 6 islands of Circle 1 are materialized, advance to Circle 2 (Ring 2, 8 islands, r=125m)!
      // Only when ALL 8 islands of Circle 2 are materialized, advance to Circle 3 (Ring 3, 10 islands, r=180m)!
      // Only when ALL 10 islands of Circle 3 are materialized, advance to Circle 4 (Ring 4, 9 islands, r=240m) until the end!
      const circles = [
        OVERWORLD_ISLAND_ORDER.slice(0, 6),   // Circle 1 (r=72m): sky_oasis, cherry, mushroom, desert_well, bamboo, bee
        OVERWORLD_ISLAND_ORDER.slice(6, 14),  // Circle 2 (r=125m): pumpkin, melon, bakery, aquarium, crypt, badlands, ice, jungle
        OVERWORLD_ISLAND_ORDER.slice(14, 24), // Circle 3 (r=180m): deepslate, fossil, blacksmith, armory, spider, creeper, slime, geode, witch, watchtower
        OVERWORLD_ISLAND_ORDER.slice(24, 33)  // Circle 4 (r=240m): monument, library, alchemist, trial, pale, sculk, tuff, pantheon, stronghold
      ];

      for (const circleIds of circles) {
        for (const id of circleIds) {
          if (!world.getDynamicProperty(`island_spawned_${id}`)) {
            selectedTheme = ISLAND_THEMES.find(t => t.id === id);
            break;
          }
        }
        if (selectedTheme) break; // Found next unspawned island in current active circle!
      }
    } else if (targetDim === "nether") {
      const netherThemes = ISLAND_THEMES.filter(t => t.dimension === "nether");
      for (const t of netherThemes) {
        if (!world.getDynamicProperty(`island_spawned_${t.id}`)) {
          selectedTheme = t;
          break;
        }
      }
    } else {
      const endThemes = ISLAND_THEMES.filter(t => t.dimension === "the_end");
      for (const t of endThemes) {
        if (!world.getDynamicProperty(`island_spawned_${t.id}`)) {
          selectedTheme = t;
          break;
        }
      }
    }

    if (!selectedTheme) return;

    // Mark spawned and record mine count for this dimension
    world.setDynamicProperty(`island_spawned_${selectedTheme.id}`, true);
    world.setDynamicProperty(lastMineProp, totalCount);

    materializeIsland(dimension, selectedTheme, phaseIndex, totalCount);
  } catch (err) {}
}

function incrementDimensionCount(dimKey, dimension) {
  const countProp = `ob_${dimKey}_count`;
  const prevState = getDimensionState(dimKey);
  const prevCount = prevState.count;
  const newCount = prevCount + 1;
  world.setDynamicProperty(countProp, newCount);
  lastProgressTick.set(dimKey, system.currentTick);

  const newState = getDimensionState(dimKey);
  const phases = getPhasesForDim(dimKey);

  // 1. Tutorial Step 15 Completion & Normal Starter Island Introduction:
  if (dimKey === "overworld" && prevCount === TUTORIAL_BLOCKS.length - 1 && newCount === TUTORIAL_BLOCKS.length) {
    // Solidify and lock bedrock anchor directly below OneBlock at (0, 63, 0)
    try {
      const bBedrock = dimension.getBlock({ x: ONEBLOCK_POS.x, y: ONEBLOCK_POS.y - 1, z: ONEBLOCK_POS.z });
      if (bBedrock) bBedrock.setType("minecraft:bedrock");
    } catch (be) {}

    // Celebrate tutorial completion with celestial title and audio cues
    for (const p of world.getAllPlayers()) {
      try {
        p.onScreenDisplay.setTitle("§a§l★ TUTORIAL COMPLETE ★§r", {
          subtitle: "§eWelcome to OneBlock Void! Your journey begins now.",
          fadeInDuration: 10,
          stayDuration: 85,
          fadeOutDuration: 20
        });
        p.sendMessage("\n§a§l[OneBlock] ★ TUTORIAL COMPLETED! ★§r");
        p.sendMessage("§eBedrock anchor permanently solidified beneath your feet at §6(0, 63, 0)§e.");
        p.sendMessage("§bAn introductory floating island §a§lLush Floral Oasis§r §bhas materialized in the distance!\n");
        p.playSound("ui.toast.challenge_complete", { pitch: 1.0, volume: 1.0 });
      } catch (pe) {}
    }

    // Materialize Theme 0 ("sky_oasis" Lush Floral Oasis) as introductory normal island after tutorial celebration
    if (!world.getDynamicProperty("island_spawned_sky_oasis")) {
      world.setDynamicProperty("island_spawned_sky_oasis", true);
      system.runTimeout(() => {
        try {
          materializeIsland(dimension, ISLAND_THEMES[0], 0, newCount);
        } catch (me) {}
      }, 70);
    }
  }

  // 2. Stronghold End Chamber Milestone (Overworld Ring 4):
  // Automatically manifests when reaching Phase 11+ or Nether mined blocks >= 250
  const netherMined = world.getDynamicProperty("ob_nether_count") ?? 0;
  if (dimKey === "overworld" && (newState.phaseIndex >= 11 || netherMined >= 250)) {
    if (!world.getDynamicProperty("island_spawned_stronghold_portal")) {
      const strongholdTheme = ISLAND_THEMES.find(t => t.id === "stronghold_portal");
      if (strongholdTheme) {
        world.setDynamicProperty("island_spawned_stronghold_portal", true);
        materializeIsland(dimension, strongholdTheme, newState.phaseIndex, newCount);
        for (const p of world.getAllPlayers()) {
          try {
            p.onScreenDisplay.setTitle("§5§l✦ END PORTAL DUNGEON ✦§r", {
              subtitle: "§dThe Stronghold End Chamber has materialized in Ring 4!",
              fadeInDuration: 10,
              stayDuration: 90,
              fadeOutDuration: 20
            });
            p.sendMessage("\n§5§l★ LEGENDARY DUNGEON DISCOVERED ★§r");
            p.sendMessage("§dThe §5§lStronghold End Chamber§r §dhas materialized in the deep void!");
            p.sendMessage("§eFollow the starlight trail in Ring 4 to locate the 12-frame End Portal!\n");
            p.playSound("ui.toast.challenge_complete", { pitch: 0.9, volume: 1.0 });
          } catch (pe) {}
        }
      }
    }
  }

  // Random Chance Island Materialization with Pity Timer in current dimension
  checkRandomIslandSpawn(dimension, newState.phaseIndex, newCount);

  // Check if phase climax was just reached
  if (newState.phaseIndex > prevState.phaseIndex) {
    spawnPhaseMiniBoss(dimKey, dimension, newState.phaseIndex);
    startPhaseTransition(dimKey, dimension, newState.phaseIndex, false);
  } else if (dimKey === "end" && newState.phaseIndex === phases.length - 1 &&
             newState.progressInPhase === newState.currentPhaseLength &&
             !world.getDynamicProperty("game_complete")) {
    // Victory only when the final End phase is actually completed
    world.setDynamicProperty("game_complete", true);
    startPhaseTransition(dimKey, dimension, newState.phaseIndex, true);
  }

  // Check global island milestones
  const milestones = [
    { target: 500, title: "500 BLOCKS MINED!" },
    { target: 1000, title: "1,000 BLOCKS MINED!" },
    { target: 2000, title: "2,000 BLOCKS MINED!" },
    { target: 5000, title: "5,000 BLOCKS MINED!" }
  ];
  for (const m of milestones) {
    if (newCount === m.target) {
      for (const p of world.getAllPlayers()) {
        p.onScreenDisplay.setTitle(`§e★ ${m.title} ★`, {
          stayDuration: 80,
          fadeInDuration: 10,
          fadeOutDuration: 10,
          subtitle: `§6Global Island Milestone Reached!`
        });
        p.playSound("ui.toast.challenge_complete", { pitch: 1.0, volume: 1.0 });
      }
      break;
    }
  }

  return { newCount, newPhaseIdx: newState.phaseIndex };
}

const lastKnownOneBlockType = {};

// Handles automated block destruction/removal by Pistons, TNT, Creepers, or Environmental causes
function handleAutomatedBlockDestruction(dimension) {
  try {
    const dimKey = getDimKey(dimension.id);
    if (activeCountdowns.get(dimKey)) return;

    const block = dimension.getBlock(ONEBLOCK_POS);
    const isLiquid = block && (block.typeId === "minecraft:water" || block.typeId === "minecraft:flowing_water" || block.typeId === "minecraft:lava" || block.typeId === "minecraft:flowing_lava");
    const isMissing = !block || block.isAir || block.typeId === "minecraft:air" || isLiquid;
    if (!isMissing) return;

    const state = getDimensionState(dimKey);
    const phase = state.phase;

    // Roll lucky chest spawn (5% chance) - only after Phase 3 in Overworld
    const isEarlyGame = (dimKey === "overworld" && (state.count < TUTORIAL_BLOCKS.length || state.phaseIndex <= 3));
    const rollChest = Math.random();
    if (!isEarlyGame && rollChest < 0.05 && phase && phase.chests && phase.chests.length > 0) {
      const items = [];
      const numItems = 2 + Math.floor(Math.random() * 3);
      for (let i = 0; i < numItems; i++) {
        const entry = pickWeighted(phase.chests);
        const count = Math.floor(Math.random() * (entry.max - entry.min + 1)) + entry.min;
        try {
          items.push(new ItemStack(entry.id, count));
        } catch (ie) {}
      }
      spawnOneBlockChest(dimension, items);
      dimension.playSound("random.chestopen", ONEBLOCK_POS, { pitch: 1.0, volume: 1.0 });
    }

    // Determine next block to regenerate
    let nextBlockType;
    if (dimKey === "overworld" && state.count < TUTORIAL_BLOCKS.length) {
      // Automated platform placement for the first 8 Dirts (steps 0 to 7)
      if (state.count < SURROUNDING_OFFSETS.length) {
        const offset = SURROUNDING_OFFSETS[state.count];
        try {
          const sideBlock = dimension.getBlock({ x: offset.x, y: 64, z: offset.z });
          if (sideBlock && sideBlock.isAir) {
            sideBlock.setType("minecraft:dirt");
            dimension.spawnParticle("minecraft:villager_happy", { x: offset.x + 0.5, y: 64.5, z: offset.z + 0.5 });
          }
        } catch (err) {}
      }

      if (state.count + 1 < TUTORIAL_BLOCKS.length) {
        nextBlockType = TUTORIAL_BLOCKS[state.count + 1].block;
      } else {
        nextBlockType = pickWeighted(phase.blocks).id;
      }
    } else {
      nextBlockType = pickWeighted(phase.blocks).id;
    }

    try {
      const b = dimension.getBlock(ONEBLOCK_POS);
      if (b) {
        b.setType(nextBlockType);
        lastKnownOneBlockType[dimKey] = nextBlockType;
      }
    } catch (pe) {}

    try {
      const cb = dimension.getBlock(ONEBLOCK_POS);
      if (cb && cb.isAir) cb.setType(dimKey === "nether" ? "minecraft:netherrack" : (dimKey === "end" ? "minecraft:end_stone" : "minecraft:dirt"));
    } catch (fb) {}

    // Advance progression for automated destruction (TNT, Piston, etc.)
    incrementDimensionCount(dimKey, dimension);
  } catch (err) {}
}

// Auto-renews the OneBlock immediately whenever it is detected as air or missing
export function renewOneBlock(dimension) {
  try {
    const dimKey = getDimKey(dimension.id);
    if (activeCountdowns.get(dimKey)) return false;

    // 1. Bedrock foundation at (0, 63, 0) directly below the OneBlock:
    // Guarantees gravity blocks (sand, gravel, concrete powder) never fall into the void!
    try {
      const bFloor = dimension.getBlock({ x: ONEBLOCK_POS.x, y: ONEBLOCK_POS.y - 1, z: ONEBLOCK_POS.z });
      if (bFloor && bFloor.typeId !== "minecraft:bedrock") {
        bFloor.setType("minecraft:bedrock");
      }
    } catch (bfe) {}

    const block = dimension.getBlock(ONEBLOCK_POS);
    if (!block) return false;

    const bType = block.typeId;
    const isLiquid = bType === "minecraft:water" || bType === "minecraft:flowing_water" ||
                     bType === "minecraft:lava" || bType === "minecraft:flowing_lava";
    const isAir = block.isAir || bType === "minecraft:air" || isLiquid || bType === "minecraft:bedrock";

    if (!isAir) {
      lastKnownOneBlockType[dimKey] = bType;
      return false; // Block is already present and solid
    }

    // 2. Clear liquid if fluid flowed into the OneBlock slot
    if (isLiquid) {
      try { block.setType("minecraft:air"); } catch (ce) {}
    }

    // 3. Determine target block to renew based on active dimension & phase progression
    const state = getDimensionState(dimKey);
    const phase = state.phase;
    let nextBlockType;

    if (dimKey === "overworld" && state.count < TUTORIAL_BLOCKS.length) {
      nextBlockType = TUTORIAL_BLOCKS[state.count].block;
    } else if (activeLuckyRush.get(dimKey)) {
      const luckyBlocks = ["minecraft:gold_ore", "minecraft:iron_ore", "minecraft:diamond_ore", "minecraft:emerald_ore", "minecraft:lapis_ore"];
      nextBlockType = luckyBlocks[Math.floor(Math.random() * luckyBlocks.length)];
    } else if (phase && phase.blocks && phase.blocks.length > 0) {
      nextBlockType = pickWeighted(phase.blocks).id;
    } else {
      nextBlockType = dimKey === "nether" ? "minecraft:netherrack" : (dimKey === "end" ? "minecraft:end_stone" : "minecraft:dirt");
    }

    // 4. Place renewed block with fail-proof multi-tier fallbacks
    let renewed = false;
    try {
      block.setType(nextBlockType);
      if (!block.isAir && block.typeId !== "minecraft:air") {
        renewed = true;
        lastKnownOneBlockType[dimKey] = nextBlockType;
      }
    } catch (e1) {}

    if (!renewed) {
      try {
        block.setPermutation(BlockPermutation.resolve(nextBlockType));
        if (!block.isAir && block.typeId !== "minecraft:air") {
          renewed = true;
          lastKnownOneBlockType[dimKey] = nextBlockType;
        }
      } catch (e1b) {}
    }

    if (!renewed) {
      try {
        dimension.runCommand(`setblock ${ONEBLOCK_POS.x} ${ONEBLOCK_POS.y} ${ONEBLOCK_POS.z} ${nextBlockType}`);
        const checkB = dimension.getBlock(ONEBLOCK_POS);
        if (checkB && !checkB.isAir && checkB.typeId !== "minecraft:air") {
          renewed = true;
          lastKnownOneBlockType[dimKey] = nextBlockType;
        }
      } catch (e1c) {}
    }

    // Fallback 1: Dimension default block
    if (!renewed) {
      const dimDefault = dimKey === "nether" ? "minecraft:netherrack" : (dimKey === "end" ? "minecraft:end_stone" : "minecraft:dirt");
      try {
        block.setType(dimDefault);
        if (!block.isAir && block.typeId !== "minecraft:air") {
          renewed = true;
          lastKnownOneBlockType[dimKey] = dimDefault;
        }
      } catch (e2) {}

      if (!renewed) {
        try {
          block.setPermutation(BlockPermutation.resolve(dimDefault));
          if (!block.isAir && block.typeId !== "minecraft:air") {
            renewed = true;
            lastKnownOneBlockType[dimKey] = dimDefault;
          }
        } catch (e2b) {}
      }

      if (!renewed) {
        try {
          dimension.runCommand(`setblock ${ONEBLOCK_POS.x} ${ONEBLOCK_POS.y} ${ONEBLOCK_POS.z} ${dimDefault}`);
          renewed = true;
          lastKnownOneBlockType[dimKey] = dimDefault;
        } catch (e2c) {}
      }
    }

    // Fallback 2: Universal dirt
    if (!renewed) {
      try {
        block.setType("minecraft:dirt");
        lastKnownOneBlockType[dimKey] = "minecraft:dirt";
        renewed = true;
      } catch (e3) {
        try {
          dimension.runCommand(`setblock ${ONEBLOCK_POS.x} ${ONEBLOCK_POS.y} ${ONEBLOCK_POS.z} dirt`);
          lastKnownOneBlockType[dimKey] = "minecraft:dirt";
          renewed = true;
        } catch (e3b) {}
      }
    }

    // 5. Visual/Audio auto-renew feedback
    if (renewed) {
      try {
        dimension.spawnParticle("minecraft:villager_happy", { x: ONEBLOCK_POS.x + 0.5, y: ONEBLOCK_POS.y + 1.2, z: ONEBLOCK_POS.z + 0.5 });
        dimension.playSound("dig.stone", ONEBLOCK_POS, { pitch: 1.2, volume: 0.5 });
      } catch (pe) {}
    }

    return renewed;
  } catch (err) {
    return false;
  }
}

function ensureOneBlock(dimension) {
  try {
    const dimKey = getDimKey(dimension.id);
    if (activeCountdowns.get(dimKey)) return;

    // Bedrock foundation guarantee at (0, 63, 0)
    const bedrockPos = { x: ONEBLOCK_POS.x, y: ONEBLOCK_POS.y - 1, z: ONEBLOCK_POS.z };
    try {
      const bFloor = dimension.getBlock(bedrockPos);
      if (bFloor && bFloor.typeId !== "minecraft:bedrock") {
        bFloor.setType("minecraft:bedrock");
      }
    } catch (bfe) {}

    const block = dimension.getBlock(ONEBLOCK_POS);
    const isLiquid = block && (block.typeId === "minecraft:water" || block.typeId === "minecraft:flowing_water" || block.typeId === "minecraft:lava" || block.typeId === "minecraft:flowing_lava");
    const stuckBedrock = !!block && block.typeId === "minecraft:bedrock";
    const isMissing = !block || block.isAir || block.typeId === "minecraft:air" || isLiquid || stuckBedrock;

    // A block that vanished without any break/explosion handler counting it within 3 ticks
    // (piston, plant pop, decay) counts as progress once. Player breaks are never double counted.
    const pend = mainPending.get(dimKey);
    if (pend !== undefined && system.currentTick - pend >= 3) {
      mainPending.delete(dimKey);
      if ((lastProgressTick.get(dimKey) ?? -99) < pend) incrementDimensionCount(dimKey, dimension);
    }

    if (isMissing) {
      if (block && !stuckBedrock && lastKnownOneBlockType[dimKey] && !mainPending.has(dimKey)) {
        mainPending.set(dimKey, system.currentTick);
      }
      renewOneBlock(dimension);
    } else if (block) {
      lastKnownOneBlockType[dimKey] = block.typeId;
    }
  } catch (err) {}
}

// Cleanly removes any lingering scoreboard sidebar from the game
function clearScoreboardObjective() {
  try { world.scoreboard.removeObjective("oneblock_stats"); } catch (e) {}
  try {
    const ow = world.getDimension("overworld");
    if (ow) {
      ow.runCommand("scoreboard objectives remove oneblock_stats");
    }
  } catch (ce) {}
}

// =========================================================================
// ADMIN AUTO-BREAK TESTING RUNNER & ISLAND INSPECTOR
// =========================================================================

let isAutoBreakRunning = false;

export function toggleAdminAutoBreak(player) {
  try {
    if (!isAdmin(player)) {
      return;
    }

    isAutoBreakRunning = !isAutoBreakRunning;

    if (isAutoBreakRunning) {
      player.sendMessage("\n§a⚡ [Admin Auto-Break] Started fast auto-mining runner! (10 blocks/sec)");
      player.sendMessage("§eRapidly breaking OneBlock, progressing through phases, and summoning secret islands!");
      player.sendMessage("§7Type §b!run§7 or §brun§7 again anytime to stop.\n");
      player.playSound("random.levelup", { pitch: 1.5, volume: 1.0 });
    } else {
      player.sendMessage("\n§c⏹ [Admin Auto-Break] Stopped auto-break simulation.");
      player.sendMessage("§7Auto-mining runner halted.\n");
      player.playSound("random.fizz", { pitch: 1.0, volume: 1.0 });
      try {
        player.onScreenDisplay.setActionBar("§c[Auto-Break Stopped]");
      } catch (e) {}
    }
  } catch (err) {}
}

// Fast Auto-Break Runner Tick Loop (runs every 2 ticks / 0.1s -> 10 blocks/sec)
system.runInterval(() => {
  if (IS_ADMIN_BUILD) {
    try { checkAdminDoubleSneak(); } catch (se) {}
  }
  if (!isAutoBreakRunning) return;
  try {
    for (const player of world.getAllPlayers()) {
      const dimension = player.dimension;
      if (!dimension) continue;
      const dimKey = getDimKey(dimension.id);

      // Clear block at ONEBLOCK_POS to simulate rapid mining
      const b = dimension.getBlock(ONEBLOCK_POS);
      if (b && !b.isAir && b.typeId !== "minecraft:air") {
        try {
          b.setType("minecraft:air");
        } catch (e1) {}
      }

      // Execute automated block destruction & advance progression
      handleAutomatedBlockDestruction(dimension);

      // Audio & Particle feedback
      try {
        dimension.spawnParticle("minecraft:wax_particle", { x: ONEBLOCK_POS.x + 0.5, y: ONEBLOCK_POS.y + 1.2, z: ONEBLOCK_POS.z + 0.5 });
      } catch (pe) {}

      // Live HUD Actionbar status
      const state = getDimensionState(dimKey);
      const targetDim = (dimKey === "nether") ? "nether" : ((dimKey === "end") ? "the_end" : "overworld");
      const spawnedCount = ISLAND_THEMES.filter(t => (t.dimension || "overworld") === targetDim && world.getDynamicProperty(`island_spawned_${t.id}`)).length;
      const totalDimIslands = ISLAND_THEMES.filter(t => (t.dimension || "overworld") === targetDim).length;

      player.onScreenDisplay.setActionBar(
        `§6[Auto-Break Active] §eMined: §b${state.count} §7| §ePhase: §a${state.phaseIndex + 1} §7| §eIslands: §d${spawnedCount}/${totalDimIslands} §7(Type !run to stop)`
      );
      break; // Run once per tick interval
    }
  } catch (err) {}
}, 2);

export function summonNextIslandAdmin(player) {
  try {
    const dimKey = getDimKey(player.dimension.id);
    const targetDim = (dimKey === "nether") ? "nether" : ((dimKey === "end") ? "the_end" : "overworld");
    let nextTheme = null;
    if (targetDim === "overworld") {
      for (const id of OVERWORLD_ISLAND_ORDER) {
        if (!world.getDynamicProperty(`island_spawned_${id}`)) {
          nextTheme = ISLAND_THEMES.find(t => t.id === id);
          break;
        }
      }
    } else {
      nextTheme = ISLAND_THEMES.find(t => (t.dimension || "overworld") === targetDim && !world.getDynamicProperty(`island_spawned_${t.id}`));
    }
    if (!nextTheme) {
      nextTheme = ISLAND_THEMES.find(t => !world.getDynamicProperty(`island_spawned_${t.id}`));
    }
    if (!nextTheme) {
      player.sendMessage("§e[Admin] All islands have already been summoned!");
      return;
    }
    const state = getDimensionState(dimKey);
    materializeIsland(player.dimension, nextTheme, state.phaseIndex, state.count);
    player.sendMessage(`§a[Admin] ★ Summoned Island: §l${nextTheme.name}§r§a!`);
  } catch (e) {}
}

// Photography Camera Angle Calculation for scenic 3/4 isometric panoramic framing
export function getIslandPhotoViewpoint(theme, center) {
  const { x: cx, y: cy, z: cz } = center;
  const distFromSpawn = Math.hypot(cx, cz);
  let camX, camY, camZ;

  if (distFromSpawn < 10) {
    // Center island
    camX = cx + 14;
    camY = cy + 9;
    camZ = cz + 14;
  } else {
    // Frame from radial vector shifted 25 degrees for optimal 3/4 elevation angle
    const angle = Math.atan2(cz, cx);
    const camAngle = angle + (25 * Math.PI / 180);
    const camDist = theme.size === "huge" ? 22 : (theme.size === "big" ? 18 : 15);
    camX = Math.round(cx + camDist * Math.cos(camAngle));
    camY = cy + (theme.size === "huge" ? 10 : 8);
    camZ = Math.round(cz + camDist * Math.sin(camAngle));
  }

  return {
    cameraPos: { x: camX, y: camY, z: camZ },
    lookAt: { x: cx, y: cy + 1, z: cz }
  };
}

export function summonAllIslandsAdmin(player) {
  try {
    if (player) {
      player.sendMessage("\n§6=== [ADMIN SHOWCASE] MANIFESTING ALL 43 ISLANDS FOR PHOTOGRAPHY ===");
      player.sendMessage("§ePreloading chunks and generating all 43 themed islands across Overworld, Nether, and The End...");
    }

    const total = ISLAND_THEMES.length;

    // Process each island sequentially with ticking area preloading
    for (let i = 0; i < total; i++) {
      const theme = ISLAND_THEMES[i];
      const loc = getIslandLocation(i, total, theme);
      const targetDimName = theme.dimension || "overworld";

      world.setDynamicProperty(`island_spawned_${theme.id}`, true);
      world.setDynamicProperty(`island_target_x_${theme.id}`, loc.center.x);
      world.setDynamicProperty(`island_target_y_${theme.id}`, loc.center.y);
      world.setDynamicProperty(`island_target_z_${theme.id}`, loc.center.z);

      const delay = i * 16;
      system.runTimeout(() => {
        try {
          const dim = world.getDimension(targetDimName);
          if (!dim) return;

          const areaSlot = i % 6;
          const areaName = `isl_photo_${areaSlot}`;
          try { dim.runCommand(`tickingarea remove ${areaName}`); } catch (e1) {}
          try { dim.runCommand(`tickingarea add circle ${loc.center.x} ${loc.center.y} ${loc.center.z} 3 ${areaName} true`); } catch (e2) {}

          system.runTimeout(() => {
            try {
              if (!isIslandPhysicallyBuilt(dim, loc.center)) {
                const placed = buildThemedIsland(dim, theme, loc.center);
                if (placed > 0) world.setDynamicProperty(`island_built_${theme.id}`, true);
              }
            } catch (be) {}
            try { dim.runCommand(`tickingarea remove ${areaName}`); } catch (e3) {}
          }, 14);
        } catch (e) {}
      }, delay);
    }

    world.setDynamicProperty("admin_islands_manifested", true);

    system.runTimeout(() => {
      for (const p of world.getAllPlayers()) {
        p.sendMessage(`\n§a[Admin Showcase] ★ All ${total} Secret Islands successfully manifested and ready for photography!`);
        p.sendMessage("§eDouble-crouch or chat 'photo' to open the Photography Studio teleporter.");
        p.playSound("random.levelup", { pitch: 1.2, volume: 1.0 });
      }
    }, total * 16 + 25);
  } catch (e) {}
}

export function setupAdminStation(dimension) {
  if (!IS_ADMIN_BUILD) return;
  try {
    for (let z = -2; z <= 2; z++) {
      // Bedrock foundation underneath walkway and podium
      const bUnderWalk = dimension.getBlock({ x: 2, y: 63, z });
      if (bUnderWalk && bUnderWalk.typeId !== "minecraft:bedrock") bUnderWalk.setType("minecraft:bedrock");
      const bUnderPod = dimension.getBlock({ x: 3, y: 63, z });
      if (bUnderPod && bUnderPod.typeId !== "minecraft:bedrock") bUnderPod.setType("minecraft:bedrock");

      // Polished Blackstone Bricks Walkway
      const bWalk = dimension.getBlock({ x: 2, y: 64, z });
      if (bWalk && bWalk.typeId !== "minecraft:polished_blackstone_bricks") bWalk.setType("minecraft:polished_blackstone_bricks");

      // Polished Blackstone Console Base
      const bPod = dimension.getBlock({ x: 3, y: 64, z });
      if (bPod && bPod.typeId !== "minecraft:polished_blackstone") bPod.setType("minecraft:polished_blackstone");

      // Interactive Buttons on top of console
      const bBtn = dimension.getBlock({ x: 3, y: 65, z });
      if (bBtn && (bBtn.isAir || bBtn.typeId === "minecraft:air")) {
        bBtn.setType("minecraft:stone_button");
      }
    }
  } catch (e) {}
}

const playerSneakHistory = new Map();

export function checkAdminDoubleSneak() {
  if (!IS_ADMIN_BUILD) return;
  for (const player of world.getAllPlayers()) {
    try {
      const isSneaking = player.isSneaking;
      const hist = playerSneakHistory.get(player.id) || { wasSneaking: false, lastTapTick: 0 };

      if (isSneaking && !hist.wasSneaking) {
        const now = tickCounter;
        if (now - hist.lastTapTick <= 24 && now - hist.lastTapTick >= 2) {
          hist.lastTapTick = 0;
          openAdminIslandMenu(player);
          player.playSound("random.orb", { pitch: 1.2, volume: 1.0 });
        } else {
          hist.lastTapTick = now;
        }
      }
      hist.wasSneaking = isSneaking;
      playerSneakHistory.set(player.id, hist);
    } catch (e) {}
  }
}

export function openAdminIslandMenu(player) {
  try {
    if (!isAdmin(player)) return;
    const form = new ActionFormData();
    form.title("§6§lISLAND PHOTO STUDIO & INSPECTOR§r");
    form.body("§eChoose studio lighting or select an island to take panoramic screenshots in Creative Mode.\n§7Tip: Double-tap Sneak or chat 'photo' anytime to open this studio!");

    form.button("§6§l🌟 MANIFEST ALL 43 ISLANDS§r\n§8(Preload & build all islands into the void)", "textures/ui/refresh_light");
    form.button("§e§l☀️ PHOTO LIGHTING: HIGH NOON§r\n§8(Clear sky & bright overhead sunlight)", "textures/ui/weather_clear");
    form.button("§6§l🌅 PHOTO LIGHTING: GOLDEN HOUR§r\n§8(Dramatic sunset & warm horizon glow)", "textures/ui/icon_recipe_nature");
    form.button("§9§l🌌 PHOTO LIGHTING: STARRY NIGHT§r\n§8(Clear starry night & glowing lanterns)", "textures/ui/portal_icon");
    form.button("§b§l👁️ TOGGLE NIGHT VISION & FLIGHT§r\n§8(Crystal-clear void visibility)", "textures/ui/accessibility_glyph_color");
    form.button("§c§l▶ TOGGLE AUTO-BREAK RUNNER§r\n§8(Rapidly mine & test progression)", "textures/ui/speed_effect");

    for (let i = 0; i < ISLAND_THEMES.length; i++) {
      const theme = ISLAND_THEMES[i];
      const dimPrefix = theme.dimension === "nether" ? "§c[Nether]" : (theme.dimension === "the_end" ? "§d[End]" : "§a[Overworld]");
      let ringLabel = "";
      if (theme.dimension === "overworld") {
        const orderIdx = OVERWORLD_ISLAND_ORDER.indexOf(theme.id);
        if (orderIdx < 6) ringLabel = "Ring 1 (72m)";
        else if (orderIdx < 14) ringLabel = "Ring 2 (125m)";
        else if (orderIdx < 24) ringLabel = "Ring 3 (180m)";
        else ringLabel = "Ring 4 (240m)";
      } else {
        ringLabel = theme.dimension === "nether" ? "Nether (75m)" : "End (85m)";
      }
      const sizeLabel = theme.size ? theme.size.toUpperCase() : "MED";
      form.button(`${theme.color}§l${theme.name}§r\n§8${dimPrefix} ${ringLabel} • ${sizeLabel}`);
    }

    form.show(player).then((response) => {
      if (response.canceled || response.selection === undefined) return;

      if (response.selection === 0) {
        summonAllIslandsAdmin(player);
        return;
      }
      if (response.selection === 1) {
        try {
          player.dimension.runCommand("time set noon");
          player.dimension.runCommand("weather clear");
          player.sendMessage("§a[Photo Studio] Studio lighting set to High Noon (Bright Sunlight)!");
          player.playSound("random.orb", { pitch: 1.2, volume: 0.8 });
        } catch (e) {}
        return;
      }
      if (response.selection === 2) {
        try {
          player.dimension.runCommand("time set 12000");
          player.dimension.runCommand("weather clear");
          player.sendMessage("§6[Photo Studio] Studio lighting set to Golden Hour Sunset!");
          player.playSound("random.orb", { pitch: 1.2, volume: 0.8 });
        } catch (e) {}
        return;
      }
      if (response.selection === 3) {
        try {
          player.dimension.runCommand("time set 18000");
          player.dimension.runCommand("weather clear");
          player.sendMessage("§9[Photo Studio] Studio lighting set to Starry Midnight!");
          player.playSound("random.orb", { pitch: 1.2, volume: 0.8 });
        } catch (e) {}
        return;
      }
      if (response.selection === 4) {
        try {
          player.addEffect("night_vision", 999999, { showParticles: false });
          player.setGameMode("creative");
          player.sendMessage("§b[Photo Studio] Night Vision & Creative Flight refreshed!");
          player.playSound("random.orb", { pitch: 1.2, volume: 0.8 });
        } catch (e) {}
        return;
      }
      if (response.selection === 5) {
        toggleAdminAutoBreak(player);
        return;
      }

      // Island Selected: Open Sub-Form with Photography Angles
      const themeIndex = response.selection - 6;
      const theme = ISLAND_THEMES[themeIndex];
      if (!theme) return;

      openIslandPhotoSubMenu(player, theme, themeIndex);
    });
  } catch (err) {}
}

function openIslandPhotoSubMenu(player, theme, themeIndex) {
  try {
    const loc = getIslandLocation(themeIndex, ISLAND_THEMES.length, theme);
    const photoView = getIslandPhotoViewpoint(theme, loc.center);
    const targetDimName = theme.dimension || "overworld";

    const subForm = new ActionFormData();
    subForm.title(`${theme.color}§l${theme.name}§r`);
    subForm.body(
      `§eDimension: §f${targetDimName.toUpperCase()}\n` +
      `§eBiome: §f${theme.biome}\n` +
      `§eCenter Location: §b(${loc.center.x}, ${loc.center.y}, ${loc.center.z})\n` +
      `§eDistance from Spawn: §a${loc.distance}m\n\n` +
      `§7Select how you would like to view this island for photography:`
    );

    subForm.button("§6§l📸 SCENIC PHOTO VIEWPOINT§r\n§8(Elevated 3/4 panoramic isometric camera angle)", "textures/ui/camera");
    subForm.button("§a§l📍 LAND ON ISLAND CORE§r\n§8(Teleport directly onto OneBlock surface)", "textures/ui/portal_icon");
    subForm.button("§d§l🔨 RE-GENERATE ISLAND§r\n§8(Force procedural build of this island)", "textures/ui/icon_recipe_nature");
    subForm.button("§7🔙 Back to Studio List", "textures/ui/undo");

    subForm.show(player).then((subResp) => {
      if (subResp.canceled || subResp.selection === undefined) return;

      if (subResp.selection === 3) {
        openAdminIslandMenu(player);
        return;
      }

      const targetDim = world.getDimension(targetDimName) || player.dimension;
      const isPhotoAngle = subResp.selection === 0;
      const destPos = isPhotoAngle ? photoView.cameraPos : { x: loc.center.x, y: loc.center.y + 2, z: loc.center.z };

      // Teleport player & setup creative mode + night vision
      try {
        player.teleport(destPos, { dimension: targetDim, checkForBlocks: false });
        player.setGameMode("creative");
        player.addEffect("night_vision", 999999, { showParticles: false });
      } catch (tpe) {}

      // Preload chunk and ensure physically built
      const areaName = `temp_view_${theme.id.slice(0, 6)}`;
      try { targetDim.runCommand(`tickingarea remove ${areaName}`); } catch (e) {}
      try { targetDim.runCommand(`tickingarea add circle ${loc.center.x} ${loc.center.y} ${loc.center.z} 3 ${areaName} true`); } catch (e) {}

      system.runTimeout(() => {
        try {
          if (subResp.selection === 2 || !isIslandPhysicallyBuilt(targetDim, loc.center)) {
            const placed = buildThemedIsland(targetDim, theme, loc.center);
            if (placed > 0) world.setDynamicProperty(`island_built_${theme.id}`, true);
          }
        } catch (be) {}
        try { targetDim.runCommand(`tickingarea remove ${areaName}`); } catch (e) {}
      }, 10);

      if (isPhotoAngle) {
        player.sendMessage(`\n${theme.color}📸 [Photo Studio] Teleported to §l${theme.name}§r${theme.color} Scenic Viewpoint!`);
        player.sendMessage(`§eCamera: §b(${destPos.x}, ${destPos.y}, ${destPos.z}) §7looking towards center §b(${loc.center.x}, ${loc.center.y}, ${loc.center.z})`);
        player.sendMessage(`§aTip: Hide HUD (F1 or Settings) and adjust FOV to 70° for magazine-quality screenshots!\n`);
      } else if (subResp.selection === 1) {
        player.sendMessage(`\n${theme.color}📍 [Island Inspector] Landed on §l${theme.name}§r${theme.color} core at (${destPos.x}, ${destPos.y}, ${destPos.z})!\n`);
      } else {
        player.sendMessage(`\n${theme.color}🔨 [Island Inspector] Re-generated §l${theme.name}§r${theme.color}!\n`);
      }
      player.playSound("mob.endermen.portal", { pitch: 1.2, volume: 1.0 });
    });
  } catch (e) {}
}

export function giveAdminInspectorTool(player) {
  try {
    const inv = player.getComponent("minecraft:inventory")?.container;
    if (!inv) return;

    let hasCompass = false;
    let hasRunner = false;

    for (let i = 0; i < inv.size; i++) {
      const it = inv.getItem(i);
      if (it && it.nameTag) {
        if (it.nameTag.includes("Island Inspector")) hasCompass = true;
        if (it.nameTag.includes("Auto-Break Runner")) hasRunner = true;
      }
    }

    if (!hasCompass) {
      const compass = new ItemStack("minecraft:compass", 1);
      compass.nameTag = "§6§lIsland Inspector Compass§r";
      compass.setLore([
        "§e[Admin Inspection Tool]",
        "§aRight-click to open Island Inspector GUI!",
        "§bTeleport to any of the 43 secret void islands",
        "§dor pre-generate all of them with 1 click."
      ]);
      inv.addItem(compass);
    }

    if (!hasRunner) {
      const runner = new ItemStack("minecraft:nether_star", 1);
      runner.nameTag = "§e⚡ §6§lAuto-Break Runner§r";
      runner.setLore([
        "§e[Admin Testing Tool]",
        "§aRight-click or Tap Screen to Start/Stop!",
        "§bRapidly mines OneBlock at 10 blocks/sec",
        "§dSummons islands with starlight trails & advances phases."
      ]);
      inv.addItem(runner);
    }
  } catch (e) {}
}

// -------------------------------------------------------------
// Dimension Shifter Engine
// -------------------------------------------------------------
const dimensionShifterState = {
  overworld: { nextVisitIn: getRandomInterval(), isPresent: false, secondsLeft: 0, trades: [] },
  nether: { nextVisitIn: getRandomInterval(), isPresent: false, secondsLeft: 0, trades: [] },
  end: { nextVisitIn: getRandomInterval(), isPresent: false, secondsLeft: 0, trades: [] }
};

function getRandomInterval() {
  return Math.floor(Math.random() * (1200 - 480 + 1)) + 480;
}

function generateRandomTrades(dimKey) {
  const pool = DIMENSION_TRADE_POOLS[dimKey] || DIMENSION_TRADE_POOLS.overworld;
  const trades = [];
  let hasMythicOrFabled = false;

  for (let slot = 0; slot < 5; slot++) {
    const tierIdx = rollRarityTier();
    const tier = RARITY_TIERS[tierIdx];
    const itemData = pool[tierIdx];

    const cost = Math.floor(Math.random() * (tier.costMax - tier.costMin + 1)) + tier.costMin;
    const stock = tierIdx >= 16 ? 1 : Math.floor(Math.random() * 2) + 2;

    if (tierIdx >= 18) {
      hasMythicOrFabled = true;
    }

    trades.push({
      tierIdx,
      tierName: tier.name,
      tierColor: tier.color,
      currency: tier.currency,
      cost,
      itemId: itemData.id,
      itemCount: itemData.count,
      stock
    });
  }

  return { trades, hasMythicOrFabled };
}

function clearShifterStall(dimKey) {
  try {
    const state = dimensionShifterState[dimKey];
    const dim = world.getDimension(dimKey === "end" ? "the_end" : dimKey);
    for (const sp of state.stall || []) {
      const sb = dim.getBlock(sp);
      if (sb && sb.typeId === state.stallMat) sb.setType("minecraft:air");
    }
    state.stall = [];
  } catch (e) {}
}

function tickDimensionShifters() {
  const dims = [
    { key: "overworld", dim: world.getDimension("overworld") },
    { key: "nether", dim: world.getDimension("nether") },
    { key: "end", dim: world.getDimension("the_end") }
  ];

  for (const { key, dim } of dims) {
    // Postpone Dimension Shifter visits in Overworld until player reaches Phase 4+
    if (key === "overworld") {
      const owState = getDimensionState("overworld");
      if (owState.phaseIndex <= 3) {
        continue;
      }
    }
    const state = dimensionShifterState[key];

    if (!state.isPresent) {
      // Remove orphaned shifters left over from a previous session
      try { for (const oe of dim.getEntities({ tags: ["dimension_shifter"] })) oe.remove(); } catch (oe2) {}
      state.nextVisitIn--;
      if (state.nextVisitIn <= 0) {
        state.isPresent = true;
        state.visitId = (state.visitId || 0) + 1;
        state.secondsLeft = 180;

        const { trades, hasMythicOrFabled } = generateRandomTrades(key);
        state.trades = trades;

        try {
          const stallMaterial = key === "nether" ? "minecraft:nether_brick" : key === "end" ? "minecraft:end_bricks" : "minecraft:oak_planks";
          state.stall = [];
          state.stallMat = stallMaterial;
          for (let x = 2; x <= 4; x++) {
            for (let z = -1; z <= 1; z++) {
              const b = dim.getBlock({ x, y: 63, z });
              if (b && b.isAir) { b.setType(stallMaterial); state.stall.push({ x, y: 63, z }); }
            }
          }

          const entity = dim.spawnEntity("minecraft:wandering_trader", { x: 3.5, y: 64.0, z: 0.5 });
          entity.addTag("dimension_shifter");
          entity.addTag(`shifter_${key}`);
          entity.nameTag = `§d✦ Dimension Shifter ✦\n§e[Leaves in 3m 00s]`;

          dim.playSound("mob.endermen.portal", { x: 3.5, y: 64.0, z: 0.5 }, { volume: 1.0, pitch: 1.0 });

          for (const p of world.getAllPlayers()) {
            p.sendMessage(`§d[Dimension Shifter] §eA Dimension Shifter emerged in the §a${key.toUpperCase()}§e! §7(Leaves in 3 mins)`);
            p.playSound("random.levelup", { pitch: 1.2, volume: 1.0 });
          }

          if (hasMythicOrFabled) {
            for (const p of world.getAllPlayers()) {
              p.sendMessage("§e★ §6§l[MYTHIC ROLL!] §eThe Dimension Shifter is carrying a §b§lFABLED§e/§e§lMYTHIC§e item this visit! §e★");
              p.playSound("ui.toast.challenge_complete", { pitch: 1.2, volume: 1.0 });
            }
          }
        } catch (e) {}
      }
    } else {
      state.secondsLeft--;

      const mins = Math.floor(state.secondsLeft / 60);
      const secs = state.secondsLeft % 60;
      const timeStr = `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;

      try {
        for (const entity of dim.getEntities({ tags: ["dimension_shifter"] })) {
          entity.nameTag = `§d✦ Dimension Shifter ✦\n§e[Leaves in ${timeStr}]`;
        }
      } catch (e) {}

      if (state.secondsLeft <= 0) {
        state.isPresent = false;
        state.nextVisitIn = getRandomInterval();
        clearShifterStall(key);

        try {
          for (const entity of dim.getEntities({ tags: ["dimension_shifter"] })) {
            dim.playSound("mob.endermen.portal", entity.location, { volume: 1.0, pitch: 0.8 });
            entity.remove();
          }
          for (const p of world.getAllPlayers()) {
            p.sendMessage(`§d[Dimension Shifter] §7The Dimension Shifter in ${key.toUpperCase()} slipped through the rift. He will return later!`);
          }
        } catch (e) {}
      }
    }
  }
}

function openShifterTradeModal(player, dimKey) {
  const state = dimensionShifterState[dimKey];
  const visit = state ? state.visitId : undefined;
  if (!state || !state.isPresent || state.trades.length === 0) {
    player.sendMessage("§cThe Dimension Shifter is not available right now.");
    return;
  }

  const form = new ActionFormData();
  form.title("§d✦ Dimension Shifter Trades ✦");
  form.body("§7Choose a trade to purchase using your gathered materials.\nStock is shared across all players on the island!");

  for (const trade of state.trades) {
    const currName = trade.currency.replace("minecraft:", "").replace(/_/g, " ");
    const itemName = trade.itemId.replace("minecraft:", "").replace(/_/g, " ");
    const stockStr = trade.stock > 0 ? `§a[Stock: ${trade.stock}]` : "§c[SOLD OUT]";

    form.button(
      `${trade.tierColor}[${trade.tierName}] §f${trade.itemCount}x ${itemName}\n§ePrice: ${trade.cost}x ${currName} ${stockStr}`
    );
  }

  form.show(player).then((response) => {
    if (response.canceled || response.selection === undefined) return;

    if (!state.isPresent || state.visitId !== visit) {
      player.sendMessage("§c[Dimension Shifter] The Dimension Shifter has already left!");
      return;
    }
    const selectedTrade = state.trades[response.selection];
    if (!selectedTrade) return;

    if (selectedTrade.stock <= 0) {
      player.sendMessage("§c[Dimension Shifter] That item is completely sold out for this visit!");
      player.playSound("note.bass", { pitch: 0.8, volume: 1.0 });
      return;
    }

    const inv = player.getComponent("minecraft:inventory")?.container;
    if (!inv) return;

    let availableCurrency = 0;
    for (let slot = 0; slot < inv.size; slot++) {
      const item = inv.getItem(slot);
      if (item && item.typeId === selectedTrade.currency) {
        availableCurrency += item.amount;
      }
    }

    if (availableCurrency < selectedTrade.cost) {
      const currName = selectedTrade.currency.replace("minecraft:", "").replace(/_/g, " ");
      player.sendMessage(`§c[Dimension Shifter] You need §e${selectedTrade.cost}x ${currName}§c, but you only have §e${availableCurrency}§c!`);
      player.playSound("note.bass", { pitch: 0.8, volume: 1.0 });
      return;
    }

    let remainingToDeduct = selectedTrade.cost;
    for (let slot = 0; slot < inv.size; slot++) {
      if (remainingToDeduct <= 0) break;
      const item = inv.getItem(slot);
      if (item && item.typeId === selectedTrade.currency) {
        if (item.amount <= remainingToDeduct) {
          remainingToDeduct -= item.amount;
          inv.setItem(slot, undefined);
        } else {
          item.amount -= remainingToDeduct;
          remainingToDeduct = 0;
          inv.setItem(slot, item);
        }
      }
    }

    selectedTrade.stock--;
    const purchasedItem = new ItemStack(selectedTrade.itemId, selectedTrade.itemCount);
    hoverDropAboveOneBlock(player.dimension, purchasedItem);

    const itemName = selectedTrade.itemId.replace("minecraft:", "").replace(/_/g, " ");
    player.sendMessage(`§a[Dimension Shifter] Trade complete! Purchased §e${selectedTrade.itemCount}x ${itemName}§a!`);
    player.playSound("random.orb", { pitch: 1.2, volume: 1.0 });
    player.dimension.spawnParticle("minecraft:totem_particle", player.location);
  });
}

// Player interaction with entities
try {
  if (world.beforeEvents && world.beforeEvents.playerInteractWithEntity && typeof world.beforeEvents.playerInteractWithEntity.subscribe === "function") {
    world.beforeEvents.playerInteractWithEntity.subscribe((event) => {
  const { player, target } = event;

  if (target.hasTag("dimension_shifter")) {
    event.cancel = true;
    system.run(() => {
      const dimKey = getDimKey(player.dimension.id);
      openShifterTradeModal(player, dimKey);
    });
    return;
  }
});

  }
} catch (e) {}
// Entity hurt event: if Dimension Shifter is attacked or damaged, vanish instantly
world.afterEvents.entityHurt.subscribe((event) => {
  const { hurtEntity } = event;
  if (hurtEntity.hasTag("dimension_shifter")) {
    system.run(() => {
      try {
        const dimKey = getDimKey(hurtEntity.dimension.id);
        const state = dimensionShifterState[dimKey];
        if (state) {
          state.isPresent = false;
          state.nextVisitIn = getRandomInterval();
          clearShifterStall(dimKey);
        }
        hurtEntity.dimension.playSound("mob.endermen.portal", hurtEntity.location, { volume: 1.0, pitch: 0.8 });
        hurtEntity.remove();

        for (const p of world.getAllPlayers()) {
          p.sendMessage(`§c[Dimension Shifter] The Dimension Shifter was harmed and fled into the rift!`);
        }
      } catch (e) {}
    });
  }
});

// Liquid Protection: Prevent placing water, lava, or powder snow directly into the OneBlock space at (0, 64, 0)
try {
  if (world.beforeEvents && world.beforeEvents.itemUseOn && typeof world.beforeEvents.itemUseOn.subscribe === "function") {
    world.beforeEvents.itemUseOn.subscribe((event) => {
  try {
    const { itemStack, block, source: player } = event;
    if (!itemStack || !block) return;

    const loc = block.location;
    const isBucket = itemStack.typeId === "minecraft:water_bucket" || itemStack.typeId === "minecraft:lava_bucket" || itemStack.typeId === "minecraft:powder_snow_bucket";
    if (isBucket && loc.x === ONEBLOCK_POS.x && loc.y === ONEBLOCK_POS.y && loc.z === ONEBLOCK_POS.z) {
      event.cancel = true;
      if (player) {
        player.sendMessage("§c[Liquid Protection] Liquids cannot be poured directly into the Sacred OneBlock Core!");
        player.playSound("note.bass", player.location, { volume: 0.8, pitch: 0.8 });
      }
    }
  } catch (e) {}
});

  }
} catch (e) {}
// Explosion Hook: When explosions destroy the OneBlock, advance progression and renew
try {
  if (world.afterEvents && world.afterEvents.blockExplode) {
    world.afterEvents.blockExplode.subscribe((event) => {
      try {
        const { block, dimension } = event;
        if (block && block.location.x === ONEBLOCK_POS.x && block.location.y === ONEBLOCK_POS.y && block.location.z === ONEBLOCK_POS.z) {
          system.run(() => {
            handleAutomatedBlockDestruction(dimension);
          });
        }
      } catch (e) {}
    });
  }
} catch (e) {}

// Handle block destruction via playerBreakBlock afterEvent
world.afterEvents.playerBreakBlock.subscribe((event) => {
  const { block, player, dimension } = event;
  const { x, y, z } = block.location;

  if (x !== ONEBLOCK_POS.x || y !== ONEBLOCK_POS.y || z !== ONEBLOCK_POS.z) {
    handleIslandOneBlockBreak(dimension, block.location, player);
    return;
  }

  const dimKey = getDimKey(dimension.id);
  if (activeCountdowns.get(dimKey)) return;

  const state = getDimensionState(dimKey);
  const phase = state.phase;

  // Auto-elevation teleport strictly during the first 8 Dirts (steps 0 to 7) to ensure player never clips through while the perimeter auto-builds
  if (player && dimKey === "overworld" && state.count < SURROUNDING_OFFSETS.length) {
    const pLoc = player.location;
    if (Math.abs(pLoc.x - 0.5) < 0.9 && Math.abs(pLoc.z - 0.5) < 0.9 && pLoc.y < 65.1 && pLoc.y >= 63.8) {
      system.run(() => {
        try {
          player.teleport(
            { x: pLoc.x, y: 65.0, z: pLoc.z },
            { dimension: dimension, checkForBlocks: false }
          );
          player.clearVelocity();
        } catch (err) {}
      });
    }
  }

  // Determine next block to regenerate:
  let nextBlockType;
  if (dimKey === "overworld" && state.count < TUTORIAL_BLOCKS.length) {
    const tutorialStep = TUTORIAL_BLOCKS[state.count];

    // Automated platform placement for the first 8 Dirts (steps 0 to 7)
    if (state.count < SURROUNDING_OFFSETS.length) {
      const offset = SURROUNDING_OFFSETS[state.count];
      system.run(() => {
        try {
          const sideBlock = dimension.getBlock({ x: offset.x, y: 64, z: offset.z });
          if (sideBlock && sideBlock.isAir) {
            sideBlock.setType("minecraft:dirt");
            dimension.spawnParticle("minecraft:villager_happy", { x: offset.x + 0.5, y: 64.5, z: offset.z + 0.5 });
            dimension.playSound("dig.gravel", { x: offset.x, y: 64, z: offset.z }, { volume: 0.8, pitch: 1.2 });
          }
        } catch (err) {}
      });
    }

    // Clean, small on-screen guidance
    for (const p of world.getAllPlayers()) {
      p.onScreenDisplay.setActionBar(`§e${tutorialStep.msg}`);
      p.sendMessage(tutorialStep.msg);
      p.playSound("random.orb", { pitch: 1.2, volume: 0.8 });
    }

    // At final step (completion), spawn a Starter Reward Chest with 2 Ice blocks and 1 Lava Bucket
    if (state.count === TUTORIAL_BLOCKS.length - 1) {
      try {
        const iceGift = new ItemStack("minecraft:ice", 2);
        const lavaGift = new ItemStack("minecraft:lava_bucket", 1);
        spawnOneBlockChest(dimension, [iceGift, lavaGift], "§b§l★ Starter Gift Chest ★§r");
        for (const p of world.getAllPlayers()) {
          p.sendMessage("§b[Starter Gift] §aA Starter Gift Chest appeared with 2x Ice Blocks & 1x Lava Bucket! Create infinite water & cobblestone generators!");
        }
        if (player) {
          system.run(() => {
            try {
              const pLoc = player.location;
              if (Math.abs(pLoc.x - 0.5) < 0.8 && Math.abs(pLoc.z - 0.5) < 0.8) {
                player.teleport({ x: 0.5, y: 65.0, z: -1.0 }, { dimension: dimension, checkForBlocks: false });
              }
            } catch (err) {}
          });
        }
      } catch (err) {}
    }

    if (state.count + 1 < TUTORIAL_BLOCKS.length) {
      nextBlockType = TUTORIAL_BLOCKS[state.count + 1].block;
    } else {
      nextBlockType = pickWeighted(phase.blocks).id;
    }
  } else if (activeLuckyRush.get(dimKey)) {
    const luckyBlocks = ["minecraft:gold_ore", "minecraft:iron_ore", "minecraft:diamond_ore", "minecraft:emerald_ore", "minecraft:lapis_ore"];
    nextBlockType = luckyBlocks[Math.floor(Math.random() * luckyBlocks.length)];
  } else {
    nextBlockType = pickWeighted(phase.blocks).id;
  }

  try {
    const targetBlock = dimension.getBlock(ONEBLOCK_POS);
    if (targetBlock && !activeCountdowns.get(dimKey)) {
      targetBlock.setType(nextBlockType);
      lastKnownOneBlockType[dimKey] = nextBlockType;
      if (targetBlock.isAir || targetBlock.typeId === "minecraft:air") {
        targetBlock.setType(dimKey === "nether" ? "minecraft:netherrack" : (dimKey === "end" ? "minecraft:end_stone" : "minecraft:dirt"));
      }
    }
  } catch (e) {}

  system.run(() => {
    try {
      // Ensure bedrock foundation directly below OneBlock
      const bFloor = dimension.getBlock({ x: ONEBLOCK_POS.x, y: ONEBLOCK_POS.y - 1, z: ONEBLOCK_POS.z });
      if (bFloor && bFloor.typeId !== "minecraft:bedrock") {
        bFloor.setType("minecraft:bedrock");
      }

      const targetBlock = dimension.getBlock(ONEBLOCK_POS);
      if (targetBlock && !activeCountdowns.get(dimKey)) {
        targetBlock.setType(nextBlockType);
        lastKnownOneBlockType[dimKey] = nextBlockType;
      }
    } catch (e) {}
  });

  // Ensure drops never fall: teleport all item entities around (0, 64, 0) to hover safely atop the block
  system.runTimeout(() => {
    try {
      const nearbyItems = dimension.getEntities({
        type: "minecraft:item",
        location: { x: 0.5, y: 64.5, z: 0.5 },
        maxDistance: 2.5
      });
      for (const itemEnt of nearbyItems) {
        // For the first 8 dirts (steps 0 to 7), the dirt went into building the platform, so remove the dropped dirt item
        if (dimKey === "overworld" && state.count < SURROUNDING_OFFSETS.length) {
          try {
            const itemStack = itemEnt.getComponent("minecraft:item")?.itemStack;
            if (itemStack && itemStack.typeId === "minecraft:dirt") {
              itemEnt.remove();
              continue;
            }
          } catch (ie) {}
        }
        itemEnt.teleport({ x: 0.5, y: 65.2, z: 0.5 });
        itemEnt.clearVelocity();
      }

      // Also ensure player didn't pick up the dirt instantly on break
      if (dimKey === "overworld" && state.count < SURROUNDING_OFFSETS.length && player) {
        try {
          const inv = player.getComponent("minecraft:inventory")?.container;
          if (inv) {
            for (let s = 0; s < inv.size; s++) {
              const it = inv.getItem(s);
              if (it && it.typeId === "minecraft:dirt") {
                if (it.amount > 1) {
                  it.amount -= 1;
                  inv.setItem(s, it);
                } else {
                  inv.setItem(s, undefined);
                }
                break;
              }
            }
          }
        } catch (pe) {}
      }
    } catch (err) {}
  }, 1);

  // Pure Vanilla Block Drops: do not spawn an artificial duplicate item!
  // The block broken naturally drops its vanilla items (dirt drops dirt, stone drops cobblestone, coal ore drops coal with fortune/silk-touch).

  // Mid-Phase Events: strictly trigger in the middle window (30% to 70% of the phase)
  // Suppress all random events during Tutorial and early starter phases (Phases 0 to 3) in Overworld
  const isEarlyGame = (dimKey === "overworld" && (state.count < TUTORIAL_BLOCKS.length || state.phaseIndex <= 3));
  const minMid = Math.floor(state.currentPhaseLength * 0.3);
  const maxMid = Math.floor(state.currentPhaseLength * 0.7);
  if (!isEarlyGame && state.progressInPhase >= minMid && state.progressInPhase <= maxMid) {
    const roll = Math.random();

    if (roll < CHEST_CHANCE) {
      // Spawn a real mystery loot chest on the OneBlock!
      const itemsToPut = [];
      const numItems = Math.floor(Math.random() * 3) + 2; // 2 to 4 unique items
      for (let i = 0; i < numItems; i++) {
        const reward = pickWeighted(phase.chests);
        const count = Math.floor(Math.random() * (reward.max - reward.min + 1)) + reward.min;
        try {
          itemsToPut.push(new ItemStack(reward.id, count));
        } catch (ie) {}
      }
      spawnOneBlockChest(dimension, itemsToPut, "§6§l★ Mystery Chest ★§r");
      player.sendMessage("§6[OneBlock] §e★ A Mystery Entity Chest has appeared! Open it for phase loot! ★");
      player.playSound("random.chestopen", { pitch: 1.0, volume: 1.0 });
    } else if (roll < CHEST_CHANCE + MOB_CHANCE && phase.mobs && phase.mobs.length > 0) {
      const mobId = phase.mobs[Math.floor(Math.random() * phase.mobs.length)];
      try {
        const mob = dimension.spawnEntity(mobId, { x: 0.5, y: 65.0, z: 0.5 });
        mob.clearVelocity();
        player.playSound("random.orb", { pitch: 1.0, volume: 1.0 });
      } catch (err) {}
    } else if (roll < CHEST_CHANCE + MOB_CHANCE + LUCKY_RUSH_CHANCE) {
      triggerLuckyRush(dimKey, dimension);
    } else if (roll < CHEST_CHANCE + MOB_CHANCE + LUCKY_RUSH_CHANCE + VOID_SURGE_CHANCE) {
      triggerVoidSurge(dimKey, dimension);
    } else if (roll < CHEST_CHANCE + MOB_CHANCE + LUCKY_RUSH_CHANCE + VOID_SURGE_CHANCE + JACKPOT_CHANCE) {
      triggerJackpot(dimension);
    } else if (Math.random() < 0.001) {
      // 0.1% chance: Ancient Enchantment Relic inside a treasure chest
      try {
        const book = new ItemStack("minecraft:enchanted_book", 1);
        book.nameTag = "§6§lAncient Enchantment Relic§r";
        spawnOneBlockChest(dimension, [book], "§6§l★ Ancient Relic Chest ★§r");
        player.sendMessage("§6[OneBlock] §e★ A RELIC ENTITY CHEST APPEARED WITH AN ANCIENT ENCHANTED BOOK! ★");
        player.playSound("ui.toast.challenge_complete", { pitch: 1.2, volume: 1.0 });
      } catch (e) {}
    } else if (Math.random() < 0.001) {
      // 0.1% chance: Ancient Totem of Undying inside a chest
      try {
        const totem = new ItemStack("minecraft:totem_of_undying", 1);
        spawnOneBlockChest(dimension, [totem], "§e§l★ Sacred Totem Chest ★§r");
        player.sendMessage("§e[OneBlock] §a★ A Sacred Entity Chest appeared with an Ancient Totem of Undying! ★");
        player.playSound("random.totem", { pitch: 1.0, volume: 1.0 });
      } catch (e) {}
    } else if (dimKey === "end" && Math.random() < 0.001) {
      // 0.1% chance in The End: Dragon Egg trophy inside a chest
      try {
        const egg = new ItemStack("minecraft:dragon_egg", 1);
        spawnOneBlockChest(dimension, [egg], "§5§l★ Dragon Egg Trophy Chest ★§r");
        player.sendMessage("§5[OneBlock] §d★ AN ENDER DRAGON EGG TROPHY ENTITY CHEST HAS APPEARED! ★");
        player.playSound("ui.toast.challenge_complete", { pitch: 1.2, volume: 1.0 });
      } catch (e) {}
    }
  }

  incrementDimensionCount(dimKey, dimension);
});

// Portal Arrival Platform & Ender Dragon Bedrock Altar at (0,64,0) in The End
world.afterEvents.playerDimensionChange.subscribe((event) => {
  const { player, toDimension } = event;
  const dimKey = getDimKey(toDimension.id);

  if (dimKey === "nether" || dimKey === "end") {
    system.run(() => {
      try {
        const padMaterial = dimKey === "nether" ? "minecraft:nether_brick" : "minecraft:end_bricks";
        for (let dx = -1; dx <= 1; dx++) {
          for (let dz = -1; dz <= 1; dz++) {
            const loc = { x: dx, y: 63, z: dz };
            const b = toDimension.getBlock(loc);
            if (b && b.isAir) {
              b.setType(padMaterial);
            }
          }
        }
        ensureOneBlock(toDimension);

        // Dragon Altar structure in The End (Bedrock frame anchor at 0,60,0)
        if (dimKey === "end") {
          for (let dx = -2; dx <= 2; dx++) {
            for (let dz = -2; dz <= 2; dz++) {
              if (Math.abs(dx) === 2 || Math.abs(dz) === 2) {
                const b = toDimension.getBlock({ x: dx, y: 63, z: dz });
                if (b && b.isAir) b.setType("minecraft:obsidian");
              }
            }
          }
        }

        const pLoc = player.location;
        const dist = Math.hypot(pLoc.x, pLoc.z);
        if (dist > 5) {
          player.sendMessage(`§e§l[OneBlock Guide] §aWelcome to the ${dimKey === "nether" ? "Nether" : "The End"}!`);
          player.sendMessage(`§6➤ Your Dimension OneBlock is waiting at coordinates: §bX: 0, Y: 64, Z: 0`);
          player.sendMessage(`§7Bridge toward (0, 64, 0) to find your infinite block!`);
        }
      } catch (err) {}
    });
  } else if (dimKey === "overworld") {
    system.run(() => {
      try {
        const netherMined = world.getDynamicProperty("ob_nether_count") ?? 0;
        if (netherMined >= 250 && !world.getDynamicProperty("island_spawned_stronghold_portal")) {
          const strongholdTheme = ISLAND_THEMES.find(t => t.id === "stronghold_portal");
          if (strongholdTheme) {
            world.setDynamicProperty("island_spawned_stronghold_portal", true);
            const owState = getDimensionState("overworld");
            materializeIsland(toDimension, strongholdTheme, owState.phaseIndex, owState.count);
            player.sendMessage("\n§5§l★ LEGENDARY DUNGEON DISCOVERED ★§r");
            player.sendMessage("§dReturning from the Nether has awakened the §5§lStronghold End Chamber§r §din the Overworld void!");
            player.sendMessage("§eFollow the starlight trail in Ring 4 to locate the 12-frame End Portal!\n");
          }
        }
      } catch (err) {}
    });
  }
});

// Hardcore Mode Death & Spectator Enforcement
world.afterEvents.entityDie.subscribe((event) => {
  try {
    const dead = event.deadEntity;
    if (dead && dead.typeId === "minecraft:player") {
      const player = dead;
      if (!isAdmin(player)) {
        player.addTag("hardcore_fallen");
        for (const p of world.getAllPlayers()) {
          p.sendMessage(`\n§4§l☠ [HARDCORE ELIMINATION] §c${player.name} §4has fallen!§r`);
          p.sendMessage(`§7${player.name} is now permanently in Spectator Mode.\n`);
          p.playSound("ambient.weather.thunder", { pitch: 0.8, volume: 1.0 });
        }
        system.run(() => {
          try {
            player.setGameMode("spectator");
          } catch (e) {
            try { player.runCommand("gamemode spectator @s"); } catch (e2) {}
          }
        });
      }
    }
  } catch (e) {}
});

// Wandering Trader Arrival Notification
world.afterEvents.entitySpawn.subscribe((event) => {
  try {
    const entity = event.entity;
    if (entity && entity.typeId === "minecraft:wandering_trader" && !entity.hasTag("dimension_shifter")) {
      for (const player of world.getAllPlayers()) {
        player.sendMessage("§e★ A Wandering Trader has arrived with mystery survival goods! §7(Accepts Emeralds, Gold, & Diamonds)");
        player.playSound("mob.villager.idle", { pitch: 1.1, volume: 1.0 });
      }
    }
  } catch (e) {}
});

// Player initial spawn & Welcome Introduction
world.afterEvents.playerSpawn.subscribe((event) => {
  const { player, initialSpawn } = event;
  system.run(() => {
    try {
      // Ensure OneBlock is immediately active and renewed if air
      try {
        renewOneBlock(player.dimension);
      } catch (e) {}

      if (initialSpawn) {
        const loc = player.location;
        if (Math.abs(loc.x) < 5 && Math.abs(loc.z) < 5) {
          player.teleport({ x: 0.5, y: 65.0, z: 0.5 });
          player.clearVelocity();
        }
      }

      // Enforce Hardcore Survival or Spectator on spawning player in official survival world
      if (!isAdmin(player)) {
        if (player.hasTag("hardcore_fallen")) {
          try {
            player.setGameMode("spectator");
          } catch (gme) {
            try { player.runCommand("gamemode spectator @s"); } catch (e2) {}
          }
          player.sendMessage("§4[Hardcore Mode] §cYou have fallen! You are in Spectator Mode.");
        } else {
          try {
            if (player.getGameMode && player.getGameMode() !== "survival") {
              player.setGameMode("survival");
            }
          } catch (gme) {
            try { player.runCommand("gamemode survival @s"); } catch (e2) {}
          }
        }
      } else {
        try { player.addTag("admin"); } catch (e) {}
        try { world.setDynamicProperty("is_admin_world", true); } catch (e) {}
      }

      // Cleanly wipe any lingering scoreboard sidebar
      clearScoreboardObjective();

      // Check if admin map or admin player: setup physical station & display zero-item control guide
      if (isAdmin(player)) {
        if (IS_ADMIN_BUILD) {
          try {
            setupAdminStation(player.dimension);
            player.setGameMode("creative");
            player.addEffect("night_vision", 999999, { showParticles: false });
            player.dimension.runCommand("weather clear");
            player.dimension.runCommand("time set noon");
          } catch (se) {}

          // Auto-manifest all 43 islands for photography on first world join
          if (!world.getDynamicProperty("admin_islands_manifested")) {
            system.runTimeout(() => {
              try {
                summonAllIslandsAdmin(player);
              } catch (me) {}
            }, 25);
          }
        }
        player.sendMessage("\n§6=== ONEBLOCK PHOTOGRAPHY & ADMIN STUDIO (ZERO ITEMS NEEDED) ===");
        player.sendMessage("§e1. Physical Buttons: §7Console at (3, 65, -2..2) right beside spawn");
        player.sendMessage("§e2. Double-Crouch: §7Double-tap Sneak anywhere to open Photo Studio & Inspector");
        player.sendMessage("§e3. Chat Commands: §7Type §bphoto§7, §bday§7, §bsunset§7, §bnight§7, §ball§7, or §bmenu§7 (no slash!)");
        player.sendMessage("§e4. Bedrock Command: §7Type §b/scriptevent ob:menu§7 or §b/scriptevent ob:all§r\n");
      }

        // Welcome introduction & creator thank you
        player.sendMessage("\n§6==================================================");
        player.sendMessage("§e★ §6§lWELCOME TO ONEBLOCK VOID SURVIVAL! §e★");
        player.sendMessage("§fThank you so much for playing my game!");
        player.sendMessage("§bCreated by: §eAllensCreations");
        player.sendMessage("§aMore features & biomes to be updated soon!");
        player.sendMessage("§eLook at the floating holographic guide above the block to start!");
        player.sendMessage("§6==================================================\n");
        player.playSound("random.levelup", { pitch: 1.0, volume: 1.0 });
      } catch (e) {}
    });
});

// Chat command helpers (zero-item friendly, no slash required!)
try {
  if (world.beforeEvents && world.beforeEvents.chatSend && typeof world.beforeEvents.chatSend.subscribe === "function") {
    world.beforeEvents.chatSend.subscribe((event) => {
  const { message, sender } = event;
  const raw = message.trim();
  const msg = raw.toLowerCase();

  // Admin World Chat Intercepts (No slash needed!)
  if (IS_ADMIN_BUILD || isAdmin(sender)) {
    if (msg === "run" || msg === "!run" || msg === "/run" || msg === "start" || msg === "break") {
      event.cancel = true;
      system.run(() => {
        toggleAdminAutoBreak(sender);
      });
      return;
    }

    if (msg === "run all" || msg === "!run all" || msg === "runall" || msg === "!runall") {
      event.cancel = true;
      system.run(() => {
        summonAllIslandsAdmin(sender);
        if (!isAutoBreakRunning) {
          toggleAdminAutoBreak(sender);
        }
      });
      return;
    }

    if (msg === "all" || msg === "!all" || msg === "summon all" || msg === "!summon all" || msg === "islands" || msg === "!islands") {
      event.cancel = true;
      system.run(() => {
        summonAllIslandsAdmin(sender);
      });
      return;
    }

    if (msg === "island" || msg === "!island" || msg === "next" || msg === "!next") {
      event.cancel = true;
      system.run(() => {
        summonNextIslandAdmin(sender);
      });
      return;
    }

    if (msg === "menu" || msg === "!menu" || msg === "admin" || msg === "!admin" || msg === "gui" || msg === "!gui") {
      event.cancel = true;
      system.run(() => {
        openAdminIslandMenu(sender);
      });
      return;
    }

    if (msg === "stop" || msg === "!stop" || msg === "halt") {
      event.cancel = true;
      system.run(() => {
        if (isAutoBreakRunning) {
          toggleAdminAutoBreak(sender);
        } else {
          sender.sendMessage("§e[Admin] Auto-Break is not currently running.");
        }
      });
      return;
    }

    if (msg === "photo" || msg === "!photo" || msg === "camera" || msg === "!camera" || msg === "studio" || msg === "!studio") {
      event.cancel = true;
      system.run(() => {
        openAdminIslandMenu(sender);
      });
      return;
    }

    if (msg === "day" || msg === "noon" || msg === "!day" || msg === "!noon") {
      event.cancel = true;
      system.run(() => {
        sender.dimension.runCommand("time set noon");
        sender.dimension.runCommand("weather clear");
        sender.sendMessage("§a[Photo Studio] Studio lighting set to High Noon!");
      });
      return;
    }

    if (msg === "sunset" || msg === "golden" || msg === "!sunset" || msg === "!golden") {
      event.cancel = true;
      system.run(() => {
        sender.dimension.runCommand("time set 12000");
        sender.dimension.runCommand("weather clear");
        sender.sendMessage("§6[Photo Studio] Studio lighting set to Golden Hour Sunset!");
      });
      return;
    }

    if (msg === "night" || msg === "!night" || msg === "midnight") {
      event.cancel = true;
      system.run(() => {
        sender.dimension.runCommand("time set 18000");
        sender.dimension.runCommand("weather clear");
        sender.sendMessage("§9[Photo Studio] Studio lighting set to Starry Midnight!");
      });
      return;
    }

    if (msg === "help" || msg === "!help" || msg === "commands") {
      event.cancel = true;
      system.run(() => {
        sender.sendMessage("\n§6=== ADMIN & PHOTO STUDIO COMMANDS ===");
        sender.sendMessage("§b• photo / menu §7- Open Island Photography & Inspector Studio");
        sender.sendMessage("§b• day / noon §7- Set bright High Noon studio lighting");
        sender.sendMessage("§b• sunset / golden §7- Set dramatic Golden Hour lighting");
        sender.sendMessage("§b• night §7- Set Starry Midnight lighting");
        sender.sendMessage("§b• all §7- Manifest all 43 secret islands into the void");
        sender.sendMessage("§b• run §7- Start / Stop fast Auto-Break runner");
        sender.sendMessage("§b• Double-Crouch §7- Double-tap sneak anywhere to open Studio\n");
      });
      return;
    }
  }

  // HUD command for Survival or Admin
  if (msg === "!hud") {
    if (!isAdmin(sender)) return;
    event.cancel = true;
    system.run(() => {
      if (sender.hasTag("hide_hud")) {
        sender.removeTag("hide_hud");
        sender.sendMessage("§a[HUD] Actionbar HUD enabled!");
      } else {
        sender.addTag("hide_hud");
        sender.sendMessage("§e[HUD] Actionbar HUD hidden!");
      }
    });
  }
});

  }
} catch (e) {}
// Physical Button Push Listener for Admin Station
try {
  if (world.afterEvents && world.afterEvents.buttonPush && typeof world.afterEvents.buttonPush.subscribe === "function") {
    world.afterEvents.buttonPush.subscribe((event) => {
  if (!IS_ADMIN_BUILD) return;
  try {
    const { block, source } = event;
    if (!source || source.typeId !== "minecraft:player") return;
    const loc = block.location;

    // Detect push on podium buttons at x: 3, y: 65 (or x: 3, y: 64)
    if (loc.x === 3 && (loc.y === 65 || loc.y === 64)) {
      if (loc.z === -2) {
        toggleAdminAutoBreak(source);
      } else if (loc.z === -1) {
        summonNextIslandAdmin(source);
      } else if (loc.z === 0) {
        summonAllIslandsAdmin(source);
      } else if (loc.z === 1) {
        openAdminIslandMenu(source);
      } else if (loc.z === 2) {
        // Photo lighting quick toggle: High Noon
        try {
          source.dimension.runCommand("time set noon");
          source.dimension.runCommand("weather clear");
          source.addEffect("night_vision", 999999, { showParticles: false });
          source.sendMessage("§a[Photo Studio] Studio lighting set to High Noon with Night Vision!");
          source.playSound("random.orb", { pitch: 1.2, volume: 0.8 });
        } catch (le) {}
      }
    }
  } catch (e) {}
});

  }
} catch (e) {}
// Item use hook preserved for backward compatibility
try {
  if (world.beforeEvents && world.beforeEvents.itemUse && typeof world.beforeEvents.itemUse.subscribe === "function") {
    world.beforeEvents.itemUse.subscribe((event) => {
  try {
    const { itemStack, source } = event;
    if (!itemStack || !itemStack.nameTag) return;

    if (itemStack.nameTag.includes("Island Inspector")) {
      if (!isAdmin(source)) return;
      event.cancel = true;
      system.run(() => {
        openAdminIslandMenu(source);
      });
    } else if (itemStack.nameTag.includes("Auto-Break Runner")) {
      if (!isAdmin(source)) return;
      event.cancel = true;
      system.run(() => {
        toggleAdminAutoBreak(source);
      });
    }
  } catch (e) {}
});

  }
} catch (e) {}
// Native Bedrock ScriptEvent hook (/scriptevent run or /scriptevent ob:run)
system.afterEvents.scriptEventReceive.subscribe((event) => {
  try {
    const { id, sourceEntity } = event;
    const player = sourceEntity && sourceEntity.typeId === "minecraft:player" ? sourceEntity : null;
    if (!player || !isAdmin(player)) return;

    if (id === "run" || id === "ob:run" || id === "test:run") {
      toggleAdminAutoBreak(player);
    } else if (id === "all" || id === "ob:all" || id === "ob:summon_all") {
      summonAllIslandsAdmin(player);
    } else if (id === "menu" || id === "ob:menu" || id === "admin" || id === "ob:admin") {
      openAdminIslandMenu(player);
    } else if (id === "island" || id === "ob:island" || id === "next") {
      summonNextIslandAdmin(player);
    }
  } catch (e) {}
});

// Fast Health-Check & Auto-Repair for all Island OneBlocks across loaded chunks
function ensureIslandOneBlocks(dimension) {
  const dimKey = getDimKey(dimension.id);
  const targetDim = (dimKey === "nether") ? "nether" : ((dimKey === "end") ? "the_end" : "overworld");
  for (const theme of ISLAND_THEMES) {
    if ((theme.dimension || "overworld") !== targetDim) continue;
    try {
      const completed = world.getDynamicProperty(`island_ob_completed_${theme.id}`);
      if (completed) {
        if (!world.getDynamicProperty(`island_ob_final_${theme.id}`)) {
          const fx = world.getDynamicProperty(`island_ob_x_${theme.id}`);
          const fy = world.getDynamicProperty(`island_ob_y_${theme.id}`);
          const fz = world.getDynamicProperty(`island_ob_z_${theme.id}`);
          const dt = world.getDynamicProperty(`island_ob_done_tick_${theme.id}`);
          if (fx !== undefined && fy !== undefined && fz !== undefined) {
            const stale = dt === undefined || system.currentTick < dt || system.currentTick - dt > 100;
            if (stale) finalizeIslandCore(dimension, theme, { x: fx, y: fy, z: fz }, null);
          }
        }
        continue;
      }
      let obX = world.getDynamicProperty(`island_ob_x_${theme.id}`);
      let obY = world.getDynamicProperty(`island_ob_y_${theme.id}`);
      let obZ = world.getDynamicProperty(`island_ob_z_${theme.id}`);

      const hadCore = obX !== undefined;
      if (obX === undefined) {
        // Never plant a core before the island itself is built (the builder places it)
        if (!world.getDynamicProperty(`island_built_${theme.id}`)) continue;
        obX = world.getDynamicProperty(`island_target_x_${theme.id}`);
        obY = world.getDynamicProperty(`island_target_y_${theme.id}`) ?? theme.y;
        obZ = world.getDynamicProperty(`island_target_z_${theme.id}`);
      }
      if (obX === undefined || obZ === undefined) continue;

      const ip = islandPending.get(theme.id);
      if (ip !== undefined && system.currentTick - ip >= 3) {
        islandPending.delete(theme.id);
        if ((recentIslandBreaks.get(theme.id) ?? -99) < ip) handleIslandOneBlockBreak(dimension, { x: obX, y: obY, z: obZ }, null);
      }
      const b = dimension.getBlock({ x: obX, y: obY, z: obZ });
      const isMissing = !b || b.isAir || b.typeId === "minecraft:air" ||
                        b.typeId === "minecraft:water" || b.typeId === "minecraft:flowing_water" ||
                        b.typeId === "minecraft:lava" || b.typeId === "minecraft:flowing_lava";
      if (b && isMissing) {
        // Core removed by non-player means (piston, explosion...): count it as mined, no free blocks
        if (hadCore && (b.isAir || b.typeId === "minecraft:air") && !islandPending.has(theme.id)) {
          islandPending.set(theme.id, system.currentTick);
        }
        if (b.typeId.includes("water") || b.typeId.includes("lava")) {
          try { b.setType("minecraft:air"); } catch (e) {}
        }
        const pool = getIslandBlockPool(theme);
        let placed = false;
        if (pool && pool.length > 0) {
          const nextBlock = pool[Math.floor(Math.random() * pool.length)];
          try {
            b.setType(nextBlock);
            if (!b.isAir && b.typeId !== "minecraft:air") placed = true;
          } catch (e1) {}
        }
        if (!placed) {
          try {
            b.setType(theme.floor || "minecraft:dirt");
            if (!b.isAir && b.typeId !== "minecraft:air") placed = true;
          } catch (e2) {}
        }
        if (!placed) {
          try { b.setType("minecraft:dirt"); } catch (e3) {}
        }

        // Bedrock foundation under Island OneBlock
        const under = dimension.getBlock({ x: obX, y: obY - 1, z: obZ });
        if (under) {
          try { under.setType("minecraft:bedrock"); } catch (ue) {}
        }

        // Surrounding bedrock collar
        const besideOffsets = [
          { x: 1, z: 0 },
          { x: -1, z: 0 },
          { x: 0, z: 1 },
          { x: 0, z: -1 }
        ];
        for (const off of besideOffsets) {
          const side = dimension.getBlock({ x: obX + off.x, y: obY, z: obZ + off.z });
          if (side) {
            try { side.setType("minecraft:bedrock"); } catch (se) {}
          }
        }

        world.setDynamicProperty(`island_ob_x_${theme.id}`, obX);
        world.setDynamicProperty(`island_ob_y_${theme.id}`, obY);
        world.setDynamicProperty(`island_ob_z_${theme.id}`, obZ);
        if (world.getDynamicProperty(`island_ob_max_${theme.id}`) === undefined) {
          world.setDynamicProperty(`island_ob_max_${theme.id}`, 35);
        }
        if (world.getDynamicProperty(`island_ob_mined_${theme.id}`) === undefined) {
          world.setDynamicProperty(`island_ob_mined_${theme.id}`, 0);
        }
      }
    } catch (e) {}
  }
}

// Ultra-Fast Auto-Renewal Loop (runs every 1 tick / 0.05s) to guarantee OneBlock NEVER stays air!
system.runInterval(() => {
  try {
    const ow = world.getDimension("overworld");
    if (ow) ensureOneBlock(ow);
  } catch (e) {}

  try {
    const nether = world.getDimension("nether");
    if (nether) ensureOneBlock(nether);
  } catch (e) {}

  try {
    const end = world.getDimension("the_end");
    if (end) ensureOneBlock(end);
  } catch (e) {}
}, 1);

// Island OneBlocks Health-Check (runs every 5 ticks / 0.25s)
system.runInterval(() => {
  try {
    const ow = world.getDimension("overworld");
    if (ow) ensureIslandOneBlocks(ow);
  } catch (e) {}

  try {
    const nether = world.getDimension("nether");
    if (nether) ensureIslandOneBlocks(nether);
  } catch (e) {}

  try {
    const end = world.getDimension("the_end");
    if (end) ensureIslandOneBlocks(end);
  } catch (e) {}
}, 5);

// Periodic maintenance & loop (1 second)
let tickCounter = 0;
system.runInterval(() => {
  try {
    tickCounter++;

    try { tickDimensionShifters(); } catch (e) {}

    // Permanently Lock World Difficulty to Hard in survival world
    if (!IS_ADMIN_BUILD && tickCounter % 10 === 0) {
      try {
        const ow = world.getDimension("overworld");
        if (ow) {
          ow.runCommand("difficulty hard");
          ow.runCommand("defaultgamemode survival");
        }
      } catch (de) {}
    }

    // Actionbar HUD & Gamemode Enforcement
    for (const player of world.getAllPlayers()) {
      try {
        // Permanently Lock Player GameMode in official survival world
        if (!isAdmin(player)) {
          try {
            if (player.hasTag("hardcore_fallen")) {
              if (player.getGameMode && player.getGameMode() !== "spectator") {
                player.setGameMode("spectator");
              }
            } else {
              if (player.getGameMode && player.getGameMode() !== "survival") {
                player.setGameMode("survival");
                player.sendMessage("§c[World Settings Locked] This world is permanently locked to Hardcore Survival on Hard difficulty!");
              }
            }
          } catch (ge) {
            try {
              if (player.hasTag("hardcore_fallen")) {
                player.runCommand("gamemode spectator @s[m=!spectator]");
              } else {
                player.runCommand("gamemode survival @s[m=!survival]");
              }
            } catch (e2) {}
          }
        }

        // Actionbar HUD: Exclusively for Admin testing / when enabled
        if (isAdmin(player) && !player.hasTag("hide_hud") && !isAutoBreakRunning) {
          const dimKey = getDimKey(player.dimension.id);
          const state = getDimensionState(dimKey);
          const progressInPhase = state.progressInPhase;
          const phaseName = state.phase ? state.phase.name : "Starting";
          const dimPrefix = dimKey === "nether" ? "§c[Nether]" : (dimKey === "end" ? "§d[End]" : "§a[Overworld]");

          player.onScreenDisplay.setActionBar(
            `${dimPrefix} §ePhase ${state.phaseIndex + 1}: §f${phaseName} §7[§b${progressInPhase}§7/§b${state.currentPhaseLength}§7] §eTotal: §6${state.count}`
          );
        }
      } catch (e) {}
    }

    if (tickCounter % 2 === 0) {
      try {
        const nether = world.getDimension("nether");
        if (nether) nether.spawnParticle("minecraft:endrod", { x: 0.5, y: 65.5, z: 0.5 });
      } catch (e) {}
      try {
        const end = world.getDimension("the_end");
        if (end) end.spawnParticle("minecraft:endrod", { x: 0.5, y: 65.5, z: 0.5 });
      } catch (e) {}
    }
  } catch (err) {}
}, 20);

// =========================================================================
// ISLAND DISCOVERY & ARRIVAL REGISTRATION SYSTEM
// =========================================================================

function triggerIslandRegistration(player, matchedTheme, blockPos) {
  try {
    const dimension = player.dimension;
    const loc = blockPos || {
      x: world.getDynamicProperty(`island_target_x_${matchedTheme.id}`) ?? player.location.x,
      y: (world.getDynamicProperty(`island_target_y_${matchedTheme.id}`) ?? 65),
      z: world.getDynamicProperty(`island_target_z_${matchedTheme.id}`) ?? player.location.z
    };

    const regKey = `island_registered_${matchedTheme.id}`;
    if (world.getDynamicProperty(regKey)) return; // Already registered
    world.setDynamicProperty(regKey, true);

    // Launch celebration fireworks
    try {
      for (let i = 0; i < 5; i++) {
        system.runTimeout(() => {
          try {
            dimension.spawnEntity("minecraft:fireworks_rocket", {
              x: loc.x + 0.5 + (Math.random() - 0.5) * 3,
              y: loc.y + 1.5,
              z: loc.z + 0.5 + (Math.random() - 0.5) * 3
            });
          } catch (fe) {}
        }, i * 8);
      }
    } catch (fwe) {}

    // Totem dissolving particles on player
    try {
      dimension.spawnParticle("minecraft:totem_particle", {
        x: player.location.x,
        y: player.location.y + 1,
        z: player.location.z
      });
    } catch (pe) {}

    // Audio & Visual Discovery Alert
    player.playSound("ui.toast.challenge_complete", { pitch: 1.2, volume: 1.0 });
    player.playSound("random.levelup", { pitch: 1.5, volume: 1.0 });

    const sizeStr = matchedTheme.size ? matchedTheme.size.toUpperCase() : "MEDIUM";
    player.onScreenDisplay.setTitle("§6§lISLAND DISCOVERED!§r", {
      stayDuration: 100,
      fadeInDuration: 5,
      fadeOutDuration: 15,
      subtitle: `§a${matchedTheme.name} §7(${sizeStr})`
    });
    player.sendMessage(`\n§6★ [Island Discovered] §aYou arrived at §e§l${matchedTheme.name}§r§a!`);
    player.sendMessage(`§7The island monument is now unlocked! Enjoy your rewards in the treasure chest!\n`);
  } catch (err) {}
}

// Proactive Auto-Discovery & Chunk Preloading on Arrival
const activeIslandTargetCache = new Map();
let lastCacheRefresh = 0;

function getActiveSpawnedIslands() {
  if (tickCounter - lastCacheRefresh > 5 || activeIslandTargetCache.size === 0) {
    lastCacheRefresh = tickCounter;
    activeIslandTargetCache.clear();
    for (const t of ISLAND_THEMES) {
      const tx = world.getDynamicProperty(`island_target_x_${t.id}`);
      const tz = world.getDynamicProperty(`island_target_z_${t.id}`);
      if (tx !== undefined && tz !== undefined) {
        const ty = world.getDynamicProperty(`island_target_y_${t.id}`) ?? 64;
        let arrivalDist = 8.5;
        if (t.size === "huge") arrivalDist = 14.0;
        else if (t.size === "big") arrivalDist = 11.0;
        else if (t.size === "medium") arrivalDist = 8.5;
        else if (t.size === "compact") arrivalDist = 6.5;
        const isRegistered = world.getDynamicProperty(`island_registered_${t.id}`) === true;
        activeIslandTargetCache.set(t.id, { theme: t, tx, ty, tz, arrivalDist, isRegistered });
      }
    }
  }
  return activeIslandTargetCache;
}

system.runInterval(() => {
  try {
    const activeIslands = getActiveSpawnedIslands();
    if (activeIslands.size === 0) return;

    for (const player of world.getAllPlayers()) {
      const pLoc = player.location;
      const dimKey = getDimKey(player.dimension.id);
      const targetDim = (dimKey === "nether") ? "nether" : ((dimKey === "end") ? "the_end" : "overworld");

      for (const [themeId, data] of activeIslands) {
        if ((data.theme.dimension || "overworld") !== targetDim) continue;
        const dist = Math.hypot(pLoc.x - data.tx, pLoc.z - data.tz);

        // Proactive building: If player is within 100 blocks of island target (8-chunk sim distance = 128 blocks)
        if (dist <= 100) {
          const center = { x: data.tx, y: data.ty, z: data.tz };
          if (!isIslandPhysicallyBuilt(player.dimension, center)) {
            const placed = buildThemedIsland(player.dimension, data.theme, center);
            if (placed > 0) {
              world.setDynamicProperty(`island_built_${data.theme.id}`, true);
            }
          }
        }

        if (!data.isRegistered && dist <= data.arrivalDist) {
          triggerIslandRegistration(player, data.theme, { x: data.tx, y: data.ty, z: data.tz });
          data.isRegistered = true;
          break;
        }
      }
    }
  } catch (e) {}
}, 10);

