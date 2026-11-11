import { EquipmentSlot, system, world } from "@minecraft/server";

const MAX_DISTANCE = 16;
const UPDATE_INTERVAL_TICKS = 2;
const BAR_SEGMENTS = 10;
const ANGER_TICKS = 1200;
const PRUNE_INTERVAL_TICKS = 200;
const BLANK_BAR = " ";

const HOSTILE_MOBS = new Set([
  "zombie", "zombie_villager", "husk", "drowned", "skeleton", "stray", "bogged",
  "wither_skeleton", "creeper", "spider", "cave_spider", "blaze", "ghast", "slime",
  "magma_cube", "witch", "phantom", "pillager", "vindicator", "evoker", "ravager",
  "vex", "guardian", "elder_guardian", "warden", "wither", "ender_dragon", "shulker",
  "silverfish", "endermite", "hoglin", "zoglin", "piglin_brute", "creaking", "breeze"
]);

const PASSIVE_MOBS = new Set([
  "cow", "mooshroom", "pig", "sheep", "chicken", "horse", "donkey", "mule",
  "skeleton_horse", "zombie_horse", "rabbit", "cat", "ocelot", "villager",
  "wandering_trader", "squid", "glow_squid", "cod", "salmon", "pufferfish",
  "tropical_fish", "turtle", "axolotl", "bat", "parrot", "fox", "camel", "sniffer",
  "frog", "tadpole", "allay", "strider", "armadillo", "snow_golem"
]);

const TYPE_COLORS = {
  Player: "§b",
  Hostile: "§c",
  Aggressive: "§c",
  Passive: "§a",
  Neutral: "§e",
  Tamed: "§d"
};

const TAMEABLE_PETS = new Set(["wolf", "cat"]);

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

const lastShown = new Map();
const angryUntil = new Map();

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
  if (family && family.hasTypeFamily("monster")) {
    return "Hostile";
  }
  return "Neutral";
}

function isOwnTamedPet(entity, viewer) {
  if (!TAMEABLE_PETS.has(stripNamespace(entity.typeId))) {
    return false;
  }
  const tameable = entity.getComponent("minecraft:tameable");
  return Boolean(tameable) && tameable.isTamed && tameable.tamedToPlayerId === viewer.id;
}

function getArmorPoints(player) {
  const equippable = player.getComponent("minecraft:equippable");
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
}

function getClassification(entity, viewer) {
  if (isOwnTamedPet(entity, viewer)) {
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

function buildHealthBar(current, max) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, current / max)) : 0;
  let filled = Math.round(ratio * BAR_SEGMENTS);
  if (current > 0 && filled === 0) {
    filled = 1;
  }
  return `§c${"|".repeat(filled)}§8${".".repeat(BAR_SEGMENTS - filled)}`;
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
    return { entity, distance: hit.distance };
  }
  return undefined;
}

function buildActionBar(entity, viewer, distance) {
  const health = entity.getComponent("minecraft:health");
  const current = Math.ceil(health.currentValue);
  const max = Math.ceil(health.effectiveMax);
  const name = getDisplayName(entity);
  const type = getClassification(entity, viewer);
  const color = TYPE_COLORS[type] ?? "§f";
  let line = `§f${name} §8| ${buildHealthBar(current, max)} §f${current}/${max}`;
  if (entity.typeId === "minecraft:player") {
    line += ` §8| §7Armor §f${getArmorPoints(entity)}`;
  }
  return `${line} §8| ${color}${type} §8| §7${Math.round(distance)}m`;
}

function updatePlayer(player) {
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
    player.onScreenDisplay.setActionBar(text);
    lastShown.set(player.id, true);
  } else if (lastShown.get(player.id)) {
    player.onScreenDisplay.setActionBar(BLANK_BAR);
    lastShown.delete(player.id);
  }
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
    for (const player of world.getAllPlayers()) {
      if (!player.isValid) {
        continue;
      }
      updatePlayer(player);
    }
  }, UPDATE_INTERVAL_TICKS);

  system.runInterval(pruneAnger, PRUNE_INTERVAL_TICKS);

  world.afterEvents.entityHurt.subscribe((event) => {
    const attacker = event.damageSource.damagingEntity;
    if (!attacker || attacker.typeId !== "minecraft:player") {
      return;
    }
    const victim = event.hurtEntity;
    if (!victim.isValid || victim.typeId === "minecraft:player") {
      return;
    }
    angryUntil.set(victim.id, system.currentTick + ANGER_TICKS);
  });

  world.afterEvents.entityDie.subscribe((event) => {
    angryUntil.delete(event.deadEntity.id);
  });

  world.afterEvents.playerLeave.subscribe((event) => {
    lastShown.delete(event.playerId);
  });
}
