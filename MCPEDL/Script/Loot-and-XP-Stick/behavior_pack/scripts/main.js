import { world, system, EntityComponentTypes } from "@minecraft/server";
import { ModalFormData, FormCancelationReason } from "@minecraft/server-ui";

const LOOT_LEVELS = [1, 2, 4, 8, 16, 32];
const XP_LEVELS = [1, 2, 4, 8, 16, 32, 64];
const LOOT_KEY = "lxp_loot_idx";
const XP_KEY = "lxp_xp_idx";
const ENABLED_KEY = "lxp_enabled";
const DROP_TAG = "lxp_boosted_drop";
const XP_TAG = "lxp_boosted_xp";

const NON_MOB_TYPES = new Set([
  "minecraft:armor_stand",
  "minecraft:player",
  "minecraft:ender_crystal",
  "minecraft:xp_orb",
  "minecraft:item",
  "minecraft:painting",
  "minecraft:donkey",
  "minecraft:mule",
  "minecraft:llama",
  "minecraft:trader_llama",
  "minecraft:allay",
  "minecraft:fox",
  "minecraft:villager",
  "minecraft:villager_v2",
  "minecraft:wandering_trader"
]);

function getPlayerConfig(player) {
  let enabled = player.getDynamicProperty(ENABLED_KEY);
  if (typeof enabled !== "boolean") enabled = true;
  let lootIdx = player.getDynamicProperty(LOOT_KEY);
  if (typeof lootIdx !== "number" || lootIdx < 0 || lootIdx >= LOOT_LEVELS.length) lootIdx = 1;
  let xpIdx = player.getDynamicProperty(XP_KEY);
  if (typeof xpIdx !== "number" || xpIdx < 0 || xpIdx >= XP_LEVELS.length) xpIdx = 1;
  return {
    enabled,
    lootMultiplier: LOOT_LEVELS[lootIdx],
    xpMultiplier: XP_LEVELS[xpIdx],
    lootIdx,
    xpIdx
  };
}

function openSettings(player, attempt = 0) {
  const cfg = getPlayerConfig(player);
  const form = new ModalFormData();
  form.title("§l§6Loot & XP Stick§r");
  form.toggle("§eEnable Multipliers§r", { defaultValue: cfg.enabled });
  form.slider("§bLoot Multiplier (Index)§r\n1x, 2x, 4x, 8x, 16x, 32x", 0, LOOT_LEVELS.length - 1, {
    valueStep: 1,
    defaultValue: cfg.lootIdx
  });
  form.slider("§aXP Multiplier (Index)§r\n1x, 2x, 4x, 8x, 16x, 32x, 64x", 0, XP_LEVELS.length - 1, {
    valueStep: 1,
    defaultValue: cfg.xpIdx
  });

  form.show(player).then((res) => {
    if (res.canceled) {
      if (res.cancelationReason === FormCancelationReason.UserBusy && attempt < 5) {
        system.runTimeout(() => openSettings(player, attempt + 1), 5);
      }
      return;
    }
    const [enabled, lootIdx, xpIdx] = res.formValues;
    player.setDynamicProperty(ENABLED_KEY, Boolean(enabled));
    player.setDynamicProperty(LOOT_KEY, Number(lootIdx));
    player.setDynamicProperty(XP_KEY, Number(xpIdx));
    player.sendMessage(
      `§a[Loot & XP Stick] Settings updated! Boost: §e${enabled ? "ON" : "OFF"}§a | Loot: §b${LOOT_LEVELS[lootIdx]}x§a | XP: §e${XP_LEVELS[xpIdx]}x`
    );
  }).catch(() => {});
}

world.beforeEvents.itemUse.subscribe((event) => {
  if (event.itemStack?.typeId === "minecraft:stick") {
    const player = event.source;
    system.run(() => openSettings(player));
  }
});

const recentBlockBreaks = [];
const recentMobKills = [];

world.afterEvents.playerBreakBlock.subscribe((event) => {
  const cfg = getPlayerConfig(event.player);
  if (!cfg.enabled || (cfg.lootMultiplier <= 1 && cfg.xpMultiplier <= 1)) return;
  const pos = event.block.location;
  recentBlockBreaks.push({
    pos: { x: pos.x + 0.5, y: pos.y + 0.5, z: pos.z + 0.5 },
    dimension: event.dimension,
    player: event.player,
    lootMult: cfg.lootMultiplier,
    xpMult: cfg.xpMultiplier,
    tick: system.currentTick
  });
});

world.afterEvents.entityDie.subscribe((event) => {
  const dead = event.deadEntity;
  if (!dead || !dead.location) return;
  if (NON_MOB_TYPES.has(dead.typeId)) return;
  const damager = event.damageSource?.damagingEntity;
  if (!damager || damager.typeId !== "minecraft:player") return;
  const cfg = getPlayerConfig(damager);
  if (!cfg.enabled || (cfg.lootMultiplier <= 1 && cfg.xpMultiplier <= 1)) return;
  const pos = dead.location;
  recentMobKills.push({
    pos: { x: pos.x, y: pos.y + 0.5, z: pos.z },
    dimension: dead.dimension,
    player: damager,
    lootMult: cfg.lootMultiplier,
    xpMult: cfg.xpMultiplier,
    tick: system.currentTick
  });
});

world.afterEvents.entitySpawn.subscribe((event) => {
  const ent = event.entity;
  if (!ent || !ent.isValid) return;

  if (ent.typeId === "minecraft:item") {
    if (ent.hasTag(DROP_TAG)) return;
    const pos = ent.location;
    const dim = ent.dimension;
    const curTick = system.currentTick;

    let matchedMult = 1;
    for (let i = recentBlockBreaks.length - 1; i >= 0; i--) {
      const b = recentBlockBreaks[i];
      if (curTick - b.tick > 8) continue;
      if (b.dimension.id !== dim.id) continue;
      const dx = pos.x - b.pos.x;
      const dy = pos.y - b.pos.y;
      const dz = pos.z - b.pos.z;
      if (dx * dx + dy * dy + dz * dz <= 4) {
        matchedMult = Math.max(matchedMult, b.lootMult);
      }
    }

    for (let i = recentMobKills.length - 1; i >= 0; i--) {
      const k = recentMobKills[i];
      if (curTick - k.tick > 8) continue;
      if (k.dimension.id !== dim.id) continue;
      const dx = pos.x - k.pos.x;
      const dy = pos.y - k.pos.y;
      const dz = pos.z - k.pos.z;
      if (dx * dx + dy * dy + dz * dz <= 6.25) {
        matchedMult = Math.max(matchedMult, k.lootMult);
      }
    }

    if (matchedMult > 1) {
      ent.addTag(DROP_TAG);
      const itemComp = ent.getComponent(EntityComponentTypes.Item);
      if (itemComp && itemComp.itemStack) {
        const stack = itemComp.itemStack;
        const extraCount = stack.amount * (matchedMult - 1);
        system.run(() => {
          let remaining = extraCount;
          while (remaining > 0) {
            const batch = Math.min(remaining, stack.maxAmount);
            remaining -= batch;
            const extra = stack.clone();
            extra.amount = batch;
            const spawned = dim.spawnItem(extra, pos);
            spawned.addTag(DROP_TAG);
          }
        });
      }
    }
    return;
  }

  if (ent.typeId === "minecraft:xp_orb") {
    if (ent.hasTag(XP_TAG)) return;
    const pos = ent.location;
    const dim = ent.dimension;
    const curTick = system.currentTick;

    let matchedMult = 1;
    for (let i = recentBlockBreaks.length - 1; i >= 0; i--) {
      const b = recentBlockBreaks[i];
      if (curTick - b.tick > 8) continue;
      if (b.dimension.id !== dim.id) continue;
      const dx = pos.x - b.pos.x;
      const dy = pos.y - b.pos.y;
      const dz = pos.z - b.pos.z;
      if (dx * dx + dy * dy + dz * dz <= 4) {
        matchedMult = Math.max(matchedMult, b.xpMult);
      }
    }

    for (let i = recentMobKills.length - 1; i >= 0; i--) {
      const k = recentMobKills[i];
      if (curTick - k.tick > 8) continue;
      if (k.dimension.id !== dim.id) continue;
      const dx = pos.x - k.pos.x;
      const dy = pos.y - k.pos.y;
      const dz = pos.z - k.pos.z;
      if (dx * dx + dy * dy + dz * dz <= 6.25) {
        matchedMult = Math.max(matchedMult, k.xpMult);
      }
    }

    if (matchedMult > 1) {
      ent.addTag(XP_TAG);
      const extraCount = matchedMult - 1;
      system.run(() => {
        for (let i = 0; i < extraCount; i++) {
          const orb = dim.spawnEntity("minecraft:xp_orb", pos);
          orb.addTag(XP_TAG);
        }
      });
    }
  }
});

system.runInterval(() => {
  const curTick = system.currentTick;
  while (recentBlockBreaks.length > 0 && curTick - recentBlockBreaks[0].tick > 10) {
    recentBlockBreaks.shift();
  }
  while (recentMobKills.length > 0 && curTick - recentMobKills[0].tick > 10) {
    recentMobKills.shift();
  }
}, 5);
