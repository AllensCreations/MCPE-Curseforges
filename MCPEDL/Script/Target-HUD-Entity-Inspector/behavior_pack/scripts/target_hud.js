import { EquipmentSlot, system, world } from "@minecraft/server";

const MAX_DISTANCE = 16;
const COMBAT_INTERVAL_TICKS = 1;
const TRACK_INTERVAL_TICKS = 2;
const IDLE_INTERVAL_TICKS = 5;
const COMBAT_TICKS = 60;
const REFRESH_TICKS = 20;
const BAR_SEGMENTS = 20;
const ANGER_TICKS = 1200;
const PRUNE_INTERVAL_TICKS = 200;
const BLANK_BAR = " ";

const HOSTILE_MOBS = new Set([
  "zombie", "zombie_villager", "husk", "drowned", "skeleton", "stray", "bogged",
  "wither_skeleton", "creeper", "spider", "cave_spider", "blaze", "ghast", "slime",
  "magma_cube", "witch", "phantom", "pillager", "vindicator", "evoker", "ravager",
  "vex", "guardian", "elder_guardian", "warden", "wither", "ender_dragon", "shulker",
  "silverfish", "endermite", "hoglin", "zoglin", "piglin_brute", "creaking", "breeze",
  "parched", "camel_husk", "zombie_nautilus"
]);

const PASSIVE_MOBS = new Set([
  "cow", "mooshroom", "pig", "sheep", "chicken", "horse", "donkey", "mule",
  "skeleton_horse", "zombie_horse", "rabbit", "cat", "ocelot", "villager",
  "wandering_trader", "squid", "glow_squid", "cod", "salmon", "pufferfish",
  "tropical_fish", "turtle", "axolotl", "bat", "parrot", "fox", "camel", "sniffer",
  "frog", "tadpole", "allay", "strider", "armadillo", "snow_golem", "happy_ghast",
  "nautilus", "copper_golem"
]);

const PASSIVE_FAMILIES = ["animal", "fish", "villager", "npc"];

const TYPE_COLORS = {
  Player: "§b",
  Hostile: "§c",
  Aggressive: "§c",
  Passive: "§a",
  Neutral: "§e",
  Tamed: "§d"
};

const ARMOR_SLOTS = [
  EquipmentSlot.Head,
  EquipmentSlot.Chest,
  EquipmentSlot.Legs,
  EquipmentSlot.Feet
];

const ARMOR_POINTS = {
  leather_helmet: 1, leather_chestplate: 3, leather_leggings: 2, leather_boots: 1,
  copper_helmet: 2, copper_chestplate: 4, copper_leggings: 3, copper_boots: 1,
  golden_helmet: 2, golden_chestplate: 5, golden_leggings: 3, golden_boots: 1,
  chainmail_helmet: 2, chainmail_chestplate: 5, chainmail_leggings: 4, chainmail_boots: 1,
  iron_helmet: 2, iron_chestplate: 6, iron_leggings: 5, iron_boots: 2,
  diamond_helmet: 3, diamond_chestplate: 8, diamond_leggings: 6, diamond_boots: 3,
  netherite_helmet: 3, netherite_chestplate: 8, netherite_leggings: 6, netherite_boots: 3,
  turtle_helmet: 2
};

const angryUntil = new Map();
const playerStates = new Map();

function getState(playerId) {
  let state = playerStates.get(playerId);
  if (!state) {
    state = { nextRun: 0, lastText: undefined, lastSent: 0, combatUntil: 0 };
    playerStates.set(playerId, state);
  }
  return state;
}

function markCombat(playerId, now) {
  const state = getState(playerId);
  state.combatUntil = now + COMBAT_TICKS;
  state.nextRun = Math.min(state.nextRun, now);
}

function stripNamespace(typeId) {
  const index = typeId.indexOf(":");
  return index === -1 ? typeId : typeId.slice(index + 1);
}

function titleCase(id) {
  return id
    .split("_")
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function hasEffect(entity, effectId) {
  try {
    return Boolean(entity.getEffect(effectId));
  } catch (error) {
    return false;
  }
}

function isSpectator(entity) {
  if (entity.typeId !== "minecraft:player" || typeof entity.getGameMode !== "function") {
    return false;
  }
  try {
    return String(entity.getGameMode()).toLowerCase() === "spectator";
  } catch (error) {
    return false;
  }
}

function isHidden(entity) {
  return hasEffect(entity, "invisibility") || isSpectator(entity);
}

function getDisplayName(entity) {
  if (entity.typeId === "minecraft:player") {
    return entity.name;
  }
  if (typeof entity.nameTag === "string" && entity.nameTag.length > 0) {
    return entity.nameTag;
  }
  return titleCase(stripNamespace(entity.typeId));
}

function getBaseClassification(entity) {
  if (entity.typeId === "minecraft:player") {
    return "Player";
  }
  const shortId = stripNamespace(entity.typeId);
  if (HOSTILE_MOBS.has(shortId)) {
    return "Hostile";
  }
  if (PASSIVE_MOBS.has(shortId)) {
    return "Passive";
  }
  const family = entity.getComponent("minecraft:type_family");
  if (family) {
    if (family.hasTypeFamily("monster")) {
      return "Hostile";
    }
    for (const name of PASSIVE_FAMILIES) {
      if (family.hasTypeFamily(name)) {
        return "Passive";
      }
    }
  }
  return "Neutral";
}

function getTameInfo(entity, viewer) {
  const tameable = entity.getComponent("minecraft:tameable");
  if (!tameable || !tameable.isTamed) {
    return undefined;
  }
  const ownerId = tameable.tamedToPlayerId;
  if (ownerId !== undefined && ownerId === viewer.id) {
    return { own: true, ownerName: undefined };
  }
  let ownerName;
  if (ownerId !== undefined) {
    for (const candidate of world.getAllPlayers()) {
      if (candidate.id === ownerId) {
        ownerName = candidate.name;
        break;
      }
    }
  }
  return { own: false, ownerName };
}

function getArmorPoints(entity) {
  try {
    const equippable = entity.getComponent("minecraft:equippable");
    if (!equippable) {
      return 0;
    }
    let total = 0;
    for (const slot of ARMOR_SLOTS) {
      const item = equippable.getEquipment(slot);
      if (item) {
        total += ARMOR_POINTS[stripNamespace(item.typeId)] ?? 0;
      }
    }
    return total;
  } catch (error) {
    return 0;
  }
}

function getHeldItem(entity) {
  try {
    const equippable = entity.getComponent("minecraft:equippable");
    if (!equippable) {
      return undefined;
    }
    const item = equippable.getEquipment(EquipmentSlot.Mainhand);
    if (!item) {
      return undefined;
    }
    const label = typeof item.nameTag === "string" && item.nameTag.length > 0
      ? item.nameTag
      : titleCase(stripNamespace(item.typeId));
    return item.amount > 1 ? `${label} x${item.amount}` : label;
  } catch (error) {
    return undefined;
  }
}

function getClassification(entity, tameInfo) {
  if (tameInfo) {
    return "Tamed";
  }
  const base = getBaseClassification(entity);
  if (base !== "Neutral") {
    return base;
  }
  const until = angryUntil.get(entity.id);
  if (until !== undefined && until > system.currentTick) {
    return "Aggressive";
  }
  return base;
}

function getBarColor(ratio) {
  if (ratio > 0.6) {
    return "§a";
  }
  if (ratio > 0.3) {
    return "§e";
  }
  return "§c";
}

function buildHealthBar(current, max) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, current / max)) : 0;
  let filled = Math.round(ratio * BAR_SEGMENTS);
  if (current > 0 && filled === 0) {
    filled = 1;
  }
  return `${getBarColor(ratio)}${"|".repeat(filled)}§8${"|".repeat(BAR_SEGMENTS - filled)}`;
}

function findTarget(player) {
  const hits = player.getEntitiesFromViewDirection({ maxDistance: MAX_DISTANCE });
  if (hits.length === 0) {
    return undefined;
  }

  let blockDistance = Infinity;
  const blockHit = player.getBlockFromViewDirection({
    maxDistance: MAX_DISTANCE,
    includeLiquidBlocks: false,
    includePassableBlocks: false
  });
  if (blockHit) {
    const head = player.getHeadLocation();
    const face = blockHit.faceLocation;
    const dx = face.x - head.x;
    const dy = face.y - head.y;
    const dz = face.z - head.z;
    blockDistance = Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  for (const hit of hits) {
    const entity = hit.entity;
    if (!entity.isValid || entity.id === player.id) {
      continue;
    }
    if (hit.distance > blockDistance) {
      continue;
    }
    if (!entity.getComponent("minecraft:health")) {
      continue;
    }
    if (isHidden(entity)) {
      continue;
    }
    return { entity, distance: hit.distance };
  }
  return undefined;
}

function buildActionBar(entity, viewer, distance) {
  const health = entity.getComponent("minecraft:health");
  const current = Math.ceil(health.currentValue);
  const max = Math.ceil(health.effectiveMax);
  const name = getDisplayName(entity);
  const isPlayer = entity.typeId === "minecraft:player";
  const tameInfo = getTameInfo(entity, viewer);
  const type = getClassification(entity, tameInfo);
  const color = TYPE_COLORS[type] ?? "§f";
  const absorbed = hasEffect(entity, "absorption") ? " §6+" : "";
  let line = `§f${name} §8| ${buildHealthBar(current, max)} §f${current}/${max}${absorbed}`;
  const armor = getArmorPoints(entity);
  if (isPlayer || armor > 0) {
    line += ` §8| §7Armor §f${armor}`;
  }
  const held = getHeldItem(entity);
  if (held) {
    line += ` §8| §7Held §f${held}`;
  }
  let typeLabel = `${color}${type}`;
  if (tameInfo && !tameInfo.own && tameInfo.ownerName) {
    typeLabel += ` §7of ${tameInfo.ownerName}`;
  }
  return `${line} §8| ${typeLabel} §8| §7${Math.round(distance)}m`;
}

function updatePlayer(player, now) {
  const state = getState(player.id);
  if (now < state.nextRun) {
    return;
  }

  let text;
  try {
    const target = findTarget(player);
    if (target) {
      text = buildActionBar(target.entity, player, target.distance);
    }
  } catch (error) {
    text = undefined;
  }

  if (text !== undefined) {
    if (text !== state.lastText || now - state.lastSent >= REFRESH_TICKS) {
      player.onScreenDisplay.setActionBar(text);
      state.lastText = text;
      state.lastSent = now;
    }
    state.nextRun = now + (now < state.combatUntil ? COMBAT_INTERVAL_TICKS : TRACK_INTERVAL_TICKS);
    return;
  }

  if (state.lastText !== undefined) {
    player.onScreenDisplay.setActionBar(BLANK_BAR);
    state.lastText = undefined;
  }
  state.nextRun = now + (now < state.combatUntil ? COMBAT_INTERVAL_TICKS : IDLE_INTERVAL_TICKS);
}

function pruneAnger() {
  const now = system.currentTick;
  for (const [id, until] of angryUntil) {
    if (until <= now) {
      angryUntil.delete(id);
    }
  }
}

export function startTargetHud() {
  system.runInterval(() => {
    const now = system.currentTick;
    for (const player of world.getAllPlayers()) {
      if (!player.isValid) {
        continue;
      }
      updatePlayer(player, now);
    }
  }, 1);

  system.runInterval(pruneAnger, PRUNE_INTERVAL_TICKS);

  world.afterEvents.entityHurt.subscribe((event) => {
    const victim = event.hurtEntity;
    if (!victim.isValid) {
      return;
    }
    const now = system.currentTick;
    const victimIsPlayer = victim.typeId === "minecraft:player";
    if (victimIsPlayer) {
      markCombat(victim.id, now);
    }
    const attacker = event.damageSource.damagingEntity;
    if (!attacker || !attacker.isValid || attacker.typeId !== "minecraft:player") {
      return;
    }
    markCombat(attacker.id, now);
    if (!victimIsPlayer) {
      angryUntil.set(victim.id, now + ANGER_TICKS);
    }
  });

  world.afterEvents.entityDie.subscribe((event) => {
    angryUntil.delete(event.deadEntity.id);
  });

  world.afterEvents.playerLeave.subscribe((event) => {
    playerStates.delete(event.playerId);
  });
}
