import { ItemStack, system, world } from "@minecraft/server";
import { recentIslandBreaks, islandPending } from "./config.js";
import { spawnScatteredLootInChest, getNearbyIslandPlayers, getDimKey, getPlayerDims } from "./helpers.js";
import { getIslandBlockPool } from "./island-blocks.js";
import { ISLAND_THEMES } from "./island-themes.js";

// Finalizes a fully mined island core (removes the bedrock -> natural floor + reward chest).
// Safe to call repeatedly: retried by ensureIslandOneBlocks if the chunk was unloaded or the world was closed.
const islandRepairCheck = new Map();
const coreCache = new Map();
const doneNext = new Map();
const healChecked = new Set();

function getCoreCoords(id) {
  let core = coreCache.get(id);
  if (core) return core;
  const x = world.getDynamicProperty(`island_ob_x_${id}`);
  const y = world.getDynamicProperty(`island_ob_y_${id}`);
  const z = world.getDynamicProperty(`island_ob_z_${id}`);
  if (x === undefined || y === undefined || z === undefined) return undefined;
  core = { x, y, z };
  coreCache.set(id, core);
  return core;
}

// True when a completed island still has bedrock at its core, directly under it, or in its collar.
function islandNeedsRepair(dimension, x, y, z) {
  try {
    const core = dimension.getBlock({ x, y, z });
    if (!core) return false; // chunk not loaded: check again later
    if (core.typeId === "minecraft:bedrock") return true;
    const under = dimension.getBlock({ x, y: y - 1, z });
    if (under && under.typeId === "minecraft:bedrock") return true;
    for (const off of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const side = dimension.getBlock({ x: x + off[0], y, z: z + off[1] });
      if (side && side.typeId === "minecraft:bedrock") return true;
    }
  } catch (e) {}
  return false;
}

const REPLACEABLE_ABOVE_CORE = /(short_grass|tall_grass|^minecraft:grass$|fern|flower|tulip|orchid|allium|azure_bluet|oxeye|cornflower|lily_of_the_valley|poppy|dandelion|sapling|petals|crimson_roots|warped_roots|hanging_roots|snow_layer|torchflower|pitcher|dead_bush|deadbush|berries|red_mushroom$|brown_mushroom$|fungus|sprouts|carpet)/;

function isAirOrBedrock(block) {
  return block.isAir || block.typeId === "minecraft:air" || block.typeId === "minecraft:bedrock";
}

function isCoreClearable(block, theme) {
  if (isAirOrBedrock(block)) return true;
  const id = block.typeId;
  if (id.includes("water") || id.includes("lava")) return true;
  return id !== theme.floor && getIslandBlockPool(theme).includes(id);
}

function setFloor(block, theme) {
  try { block.setType(theme.floor); } catch (e) { try { block.setType("minecraft:dirt"); } catch (e2) {} }
}

function finalizeIslandCore(dimension, theme, loc, player, mode = "new") {
  try {
    const repair = mode === "repair";
    const doneKey = `island_ob_done_${theme.id}`;
    if (!repair && world.getDynamicProperty(doneKey)) return true;
    const targetBlock = dimension.getBlock(loc);
    if (!targetBlock) return false;
    const chestPos = { x: loc.x, y: loc.y + 1, z: loc.z };
    const chestBlock = dimension.getBlock(chestPos);
    if (!chestBlock) return false;

    if (repair ? isAirOrBedrock(targetBlock) : isCoreClearable(targetBlock, theme)) setFloor(targetBlock, theme);
    const underBlock = dimension.getBlock({ x: loc.x, y: loc.y - 1, z: loc.z });
    if (underBlock && (!repair || underBlock.typeId === "minecraft:bedrock")) {
      try { underBlock.setType(theme.subfloor || theme.floor); } catch (e) { try { underBlock.setType(theme.floor); } catch (e2) {} }
    }
    const besideOffsets = [{ x: 1, z: 0 }, { x: -1, z: 0 }, { x: 0, z: 1 }, { x: 0, z: -1 }];
    for (const off of besideOffsets) {
      const bBlock = dimension.getBlock({ x: loc.x + off.x, y: loc.y, z: loc.z + off.z });
      if (bBlock && bBlock.typeId === "minecraft:bedrock") setFloor(bBlock, theme);
    }

    try {
      const existing = dimension.getEntities({
        type: "minecraft:chest_minecart",
        location: { x: chestPos.x + 0.5, y: chestPos.y + 0.5, z: chestPos.z + 0.5 },
        maxDistance: 2.5
      });
      for (const ent of existing) ent.remove();
    } catch (ee) {}

    const isChest = chestBlock.typeId === "minecraft:chest";
    const chestAlreadyThere = isChest && mode !== "new";
    const dropRewards = () => {
      for (const entry of theme.chest || []) {
        try { dimension.spawnItem(new ItemStack(entry.id, entry.count || 1), { x: chestPos.x + 0.5, y: chestPos.y + 0.5, z: chestPos.z + 0.5 }); } catch (de) {}
      }
    };
    if (!chestAlreadyThere) {
      if (chestBlock.isAir || isChest || REPLACEABLE_ABOVE_CORE.test(chestBlock.typeId)) {
        try {
          if (!isChest) chestBlock.setType("minecraft:chest");
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
        } catch (ce) {
          if (!repair) dropRewards();
        }
      } else if (!repair) {
        dropRewards();
      }
    }

    world.setDynamicProperty(doneKey, true);
    world.setDynamicProperty(`island_ob_final_${theme.id}`, true);
    if (repair) return true;

    try {
      dimension.spawnEntity("minecraft:fireworks_rocket", { x: loc.x + 0.5, y: loc.y + 2.0, z: loc.z + 0.5 });
      dimension.spawnParticle("minecraft:totem_particle", { x: loc.x + 0.5, y: loc.y + 1.5, z: loc.z + 0.5 });
      dimension.playSound("random.levelup", loc, { pitch: 1.2, volume: 1.0 });
      dimension.playSound("random.chestopen", chestPos, { pitch: 1.0, volume: 1.0 });
    } catch (fe) {}

    try {
      const islandsDone = ISLAND_THEMES.filter((t) => world.getDynamicProperty(`island_ob_final_${t.id}`)).length;
      for (const p of getNearbyIslandPlayers(dimension, loc, 48, player)) {
        p.sendMessage(`${theme.color}★ [Island Core Conquered] §fThe island core is complete! The bedrock is gone and a Treasure Chest has appeared above!`);
        p.sendMessage(`§7Islands completed: §f${islandsDone}/${ISLAND_THEMES.length}\n`);
      }
    } catch (me) {}
    return true;
  } catch (err) {
    return false;
  }
}

function migrateLegacyIsland(dimension, theme, loc) {
  try {
    const core = dimension.getBlock(loc);
    if (!core) return;
    const stuck = islandNeedsRepair(dimension, loc.x, loc.y, loc.z) ||
      (core.typeId !== theme.floor && getIslandBlockPool(theme).includes(core.typeId));
    if (stuck) finalizeIslandCore(dimension, theme, loc, null, "legacy");
    else world.setDynamicProperty(`island_ob_done_${theme.id}`, true);
  } catch (e) {}
}

// Handles breaking of an Island Mini-OneBlock Core (30-50 blocks capacity)
export function handleIslandOneBlockBreak(dimension, loc, player) {
  try {
    const dimKey = getDimKey(dimension.id);
    const targetDim = (dimKey === "nether") ? "nether" : ((dimKey === "end") ? "the_end" : "overworld");
    let matchedTheme = null;
    for (const theme of ISLAND_THEMES) {
      if ((theme.dimension || "overworld") !== targetDim) continue;
      const core = getCoreCoords(theme.id);
      if (!core || loc.x !== core.x || loc.y !== core.y || loc.z !== core.z) continue;
      if (world.getDynamicProperty(`island_ob_completed_${theme.id}`)) continue;
      matchedTheme = theme;
      break;
    }
    if (!matchedTheme) return;
    recentIslandBreaks.set(matchedTheme.id, system.currentTick);

    const maxBlocks = world.getDynamicProperty(`island_ob_max_${matchedTheme.id}`) ?? 40;
    const currentMined = (world.getDynamicProperty(`island_ob_mined_${matchedTheme.id}`) ?? 0) + 1;
    world.setDynamicProperty(`island_ob_mined_${matchedTheme.id}`, currentMined);

    const progress = currentMined / maxBlocks;

    const halfwayBonus = currentMined === Math.floor(maxBlocks / 2) && matchedTheme.chest && matchedTheme.chest.length > 0; // HALFWAY_BONUS
    for (const rp of getNearbyIslandPlayers(dimension, loc, 48, player)) {
      try { rp.onScreenDisplay.setActionBar(`${matchedTheme.color}${currentMined}/${maxBlocks} mined${halfwayBonus ? " - halfway bonus!" : ""}`); } catch (ae) {}
    }
    if (halfwayBonus) {
      const bonus = matchedTheme.chest[Math.floor(Math.random() * matchedTheme.chest.length)];
      system.run(() => {
        try {
          dimension.spawnItem(new ItemStack(bonus.id, 1), { x: loc.x + 0.5, y: loc.y + 1.2, z: loc.z + 0.5 });
          dimension.playSound("random.levelup", loc, { pitch: 1.4, volume: 0.8 });
        } catch (be) {}
      });
    }

    try {
    // Visual feedback ONLY via particle progression (no action bar counter text)
    if (progress < 0.5) {
      // Early Stage (<50%): Happy villager green sparkles
      dimension.spawnParticle("minecraft:villager_happy", { x: loc.x + 0.5, y: loc.y + 1.2, z: loc.z + 0.5 });
      dimension.playSound("random.orb", loc, { pitch: 1.0, volume: 0.6 });
    } else if (progress < 0.85) {
      // Mid Stage (50-85%): Golden sparks
      dimension.spawnParticle("minecraft:villager_happy", { x: loc.x + 0.5, y: loc.y + 1.2, z: loc.z + 0.5 });
      dimension.playSound("random.orb", loc, { pitch: 1.3, volume: 0.7 });
    } else {
      // Final Stage (>85%): Mystical Purple Amethyst & Void sparkles
      dimension.spawnParticle("minecraft:portal_particle", { x: loc.x + 0.5, y: loc.y + 1.2, z: loc.z + 0.5 });
      dimension.spawnParticle("minecraft:endrod", { x: loc.x + 0.5, y: loc.y + 1.2, z: loc.z + 0.5 });
      dimension.playSound("block.amethyst_block.chime", loc, { pitch: 1.4, volume: 0.9 });
    }

    } catch (fxErr) {}

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
      // Fully mined! IMMEDIATE_ISLAND_COMPLETE: the core is marked complete, bedrock is removed and the reward chest appears right away.
      world.setDynamicProperty(`island_ob_completed_${matchedTheme.id}`, true);
      world.setDynamicProperty(`island_ob_done_tick_${matchedTheme.id}`, system.currentTick);
      system.run(() => {
        finalizeIslandCore(dimension, matchedTheme, loc, player);
      });
    }
  } catch (err) {}
}

// Fast Health-Check & Auto-Repair for all Island OneBlocks across loaded chunks
function ensureIslandOneBlocks(dimension) {
  const dimKey = getDimKey(dimension.id);
  const targetDim = (dimKey === "nether") ? "nether" : ((dimKey === "end") ? "the_end" : "overworld");
  for (const theme of ISLAND_THEMES) {
    if ((theme.dimension || "overworld") !== targetDim) continue;
    try {
      const nextRepair = doneNext.get(theme.id);
      if (nextRepair !== undefined && system.currentTick < nextRepair) continue;
      let completed = world.getDynamicProperty(`island_ob_completed_${theme.id}`);
      if (!completed && !healChecked.has(theme.id)) {
        healChecked.add(theme.id);
        // Self-heal: every block was mined but the completion step never ran
        const minedAll = world.getDynamicProperty(`island_ob_mined_${theme.id}`);
        const maxAll = world.getDynamicProperty(`island_ob_max_${theme.id}`);
        if (minedAll !== undefined && maxAll !== undefined && minedAll >= maxAll) {
          world.setDynamicProperty(`island_ob_completed_${theme.id}`, true);
          world.setDynamicProperty(`island_ob_done_tick_${theme.id}`, system.currentTick - 200);
          completed = true;
        }
      }
      if (completed) {
        const fcore = getCoreCoords(theme.id);
        if (fcore) {
          const { x: fx, y: fy, z: fz } = fcore;
          if (!world.getDynamicProperty(`island_ob_done_${theme.id}`)) {
            if (world.getDynamicProperty(`island_ob_final_${theme.id}`)) {
              migrateLegacyIsland(dimension, theme, { x: fx, y: fy, z: fz });
            } else {
              const dt = world.getDynamicProperty(`island_ob_done_tick_${theme.id}`);
              const stale = dt === undefined || system.currentTick < dt || system.currentTick - dt > 100;
              if (stale) finalizeIslandCore(dimension, theme, { x: fx, y: fy, z: fz }, null);
            }
          } else {
            // Self-heal: finished islands must not keep bedrock (checked every 5 seconds while loaded)
            const lastCheck = islandRepairCheck.get(theme.id) ?? -999;
            if (system.currentTick < lastCheck || system.currentTick - lastCheck >= 100) {
              islandRepairCheck.set(theme.id, system.currentTick);
              doneNext.set(theme.id, system.currentTick + 100);
              if (islandNeedsRepair(dimension, fx, fy, fz)) finalizeIslandCore(dimension, theme, { x: fx, y: fy, z: fz }, null, "repair");
            }
          }
        }
        continue;
      }
      const ocore = getCoreCoords(theme.id);
      let obX = ocore ? ocore.x : undefined;
      let obY = ocore ? ocore.y : undefined;
      let obZ = ocore ? ocore.z : undefined;

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

// Island OneBlocks Health-Check (runs every 5 ticks / 0.25s)
export function islandHealthTick() {
  const active = getPlayerDims();
  for (const [key, dimId] of [["overworld", "overworld"], ["nether", "nether"], ["end", "the_end"]]) {
    if (!active[key]) continue;
    try {
      const dimension = world.getDimension(dimId);
      if (dimension) ensureIslandOneBlocks(dimension);
    } catch (e) {}
  }
}
