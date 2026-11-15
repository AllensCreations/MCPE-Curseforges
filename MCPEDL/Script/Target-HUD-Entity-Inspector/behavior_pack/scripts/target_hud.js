import { EquipmentSlot, system, world } from "@minecraft/server";

const MAX_DISTANCE = 16;
const COMBAT_INTERVAL_TICKS = 1;
const TRACK_INTERVAL_TICKS = 2;
const IDLE_INTERVAL_TICKS = 5;
const COMBAT_TICKS = 60;
const REFRESH_TICKS = 20;
const FLASH_TICKS = 30;
const BAR_SEGMENTS = 20;
const COMPACT_BAR_SEGMENTS = 10;
const MAX_LINE_WIDTH = 66;
const EFFECT_LIMITS = [3, 2, 1, 0, 0];
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

const KEY_EFFECTS = [
  ["wither", true],
  ["poison", true],
  ["slowness", true],
  ["weakness", true],
  ["regeneration", false],
  ["strength", false],
  ["speed", false],
  ["resistance", false],
  ["fire_resistance", false]
];

const ROMAN = ["", "", "II", "III", "IV", "V"];

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
    state = { nextRun: 0, lastText: undefined, lastSent: 0, combatUntil: 0, flashUntil: 0, flashText: "" };
    playerStates.set(playerId, state);
  }
  return state;
}

function markCombat(playerId, now) {
  const state = getState(playerId);
  state.combatUntil = now + COMBAT_TICKS;
  state.nextRun = Math.min(state.nextRun, now);
}

function startFlash(playerId, label, now) {
  const state = getState(playerId);
  state.flashText = `§aDefeated §f${cleanText(label)}`;
  state.flashUntil = now + FLASH_TICKS;
  state.nextRun = Math.min(state.nextRun, now);
}

function cleanText(text) {
  return String(text).replace(/§.?/g, "");
}

function shorten(text, limit) {
  return text.length > limit ? `${text.slice(0, limit - 1)}.` : text;
}

function measureWidth(text) {
  let width = 0;
  for (const ch of cleanText(text)) {
    if (ch === "|" || ch === ".") {
      width += 0.4;
    } else if (ch === " ") {
      width += 0.7;
    } else {
      width += 1;
    }
  }
  return width;
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
    return cleanText(entity.name);
  }
  if (typeof entity.nameTag === "string" && entity.nameTag.length > 0) {
    return cleanText(entity.nameTag);
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
        ownerName = cleanText(candidate.name);
        break;
      }
    }
  }
  return { own: false, ownerName };
}

function getEquippable(entity) {
  try {
    return entity.getComponent("minecraft:equippable");
  } catch (error) {
    return undefined;
  }
}

function getArmorPoints(entity) {
  const equippable = getEquippable(entity);
  if (!equippable) {
    return 0;
  }
  let total = 0;
  for (const slot of ARMOR_SLOTS) {
    try {
      const item = equippable.getEquipment(slot);
      if (item) {
        total += ARMOR_POINTS[stripNamespace(item.typeId)] ?? 0;
      }
    } catch (error) {
      continue;
    }
  }
  return total;
}

function getHeldItem(entity) {
  const equippable = getEquippable(entity);
  if (!equippable) {
    return undefined;
  }
  try {
    const item = equippable.getEquipment(EquipmentSlot.Mainhand);
    if (!item) {
      return undefined;
    }
    const label = typeof item.nameTag === "string" && item.nameTag.length > 0
      ? cleanText(item.nameTag)
      : titleCase(stripNamespace(item.typeId));
    return item.amount > 1 ? `${label} x${item.amount}` : label;
  } catch (error) {
    return undefined;
  }
}

function getEffectId(effect) {
  if (typeof effect.typeId === "string") {
    return stripNamespace(effect.typeId);
  }
  if (typeof effect.displayName === "string") {
    return effect.displayName.toLowerCase().trim().replace(/\s+(i|ii|iii|iv|v)$/, "").replace(/\s+/g, "_");
  }
  return "";
}

function formatDuration(ticks) {
  const seconds = Math.ceil(ticks / 20);
  if (seconds >= 60) {
    const rest = seconds % 60;
    return `${Math.floor(seconds / 60)}:${rest < 10 ? "0" : ""}${rest}`;
  }
  return `${seconds}s`;
}

function getEffectTags(entity) {
  const tags = [];
  if (entity.isOnFire === true) {
    tags.push("§6Burning");
  }
  let effects;
  try {
    effects = entity.getEffects();
  } catch (error) {
    return tags;
  }
  const byId = new Map();
  for (const effect of effects) {
    byId.set(getEffectId(effect), effect);
  }
  for (const [id, bad] of KEY_EFFECTS) {
    const effect = byId.get(id);
    if (!effect) {
      continue;
    }
    let text = titleCase(id);
    const level = effect.amplifier + 1;
    if (level >= 2) {
      text += ` ${ROMAN[level] ?? level}`;
    }
    if (typeof effect.duration === "number" && effect.duration > 0 && effect.duration < 72000) {
      text += ` ${formatDuration(effect.duration)}`;
    }
    tags.push(`${bad ? "§c" : "§a"}${text}`);
  }
  return tags;
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

function buildHealthBar(current, max, segments) {
  const ratio = max > 0 ? Math.min(1, Math.max(0, current / max)) : 0;
  let filled = Math.round(ratio * segments);
  if (current > 0 && filled === 0) {
    filled = 1;
  }
  return `${getBarColor(ratio)}${"|".repeat(filled)}§8${"|".repeat(segments - filled)}`;
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
    const health = entity.getComponent("minecraft:health");
    if (!health || health.currentValue <= 0) {
      continue;
    }
    if (isHidden(entity)) {
      continue;
    }
    return { entity, distance: hit.distance };
  }
  return undefined;
}

function collectInfo(entity, viewer, distance) {
  const health = entity.getComponent("minecraft:health");
  const isPlayer = entity.typeId === "minecraft:player";
  const tameInfo = getTameInfo(entity, viewer);
  const type = getClassification(entity, tameInfo);
  const armor = getArmorPoints(entity);
  return {
    name: getDisplayName(entity),
    current: Math.ceil(health.currentValue),
    max: Math.ceil(health.effectiveMax),
    absorbed: hasEffect(entity, "absorption") ? " §6+" : "",
    showArmor: isPlayer || armor > 0,
    armor,
    held: getHeldItem(entity),
    effects: getEffectTags(entity),
    type,
    color: TYPE_COLORS[type] ?? "§f",
    owner: tameInfo && !tameInfo.own ? tameInfo.ownerName : undefined,
    distance: Math.round(distance)
  };
}

function formatLine(info, level) {
  const compact = level >= 1;
  const segments = compact ? COMPACT_BAR_SEGMENTS : BAR_SEGMENTS;
  const name = compact ? shorten(info.name, 14) : info.name;
  let line = `§f${name} §8| ${buildHealthBar(info.current, info.max, segments)} §f${info.current}/${info.max}${info.absorbed}`;
  if (info.showArmor) {
    line += compact ? ` §8| §7A §f${info.armor}` : ` §8| §7Armor §f${info.armor}`;
  }
  if (info.held && level < 4) {
    line += compact ? ` §8| §f${shorten(info.held, 12)}` : ` §8| §7Held §f${info.held}`;
  }
  const effects = info.effects.slice(0, EFFECT_LIMITS[level]);
  for (const tag of effects) {
    line += ` §8| ${tag}`;
  }
  let typeLabel = `${info.color}${info.type}`;
  if (!compact && info.owner) {
    typeLabel += ` §7of ${info.owner}`;
  }
  return `${line} §8| ${typeLabel} §8| §7${info.distance}m`;
}

function buildActionBar(entity, viewer, distance) {
  const info = collectInfo(entity, viewer, distance);
  let line = "";
  for (let level = 0; level < EFFECT_LIMITS.length; level++) {
    line = formatLine(info, level);
    if (measureWidth(line) <= MAX_LINE_WIDTH) {
      return line;
    }
  }
  return line;
}

function updatePlayer(player, now) {
  const state = getState(player.id);
  if (now < state.nextRun) {
    return;
  }

  let text;
  if (now < state.flashUntil) {
    text = state.flashText;
  } else {
    try {
      const target = findTarget(player);
      if (target) {
        text = buildActionBar(target.entity, player, target.distance);
      }
    } catch (error) {
      text = undefined;
    }
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
    const dead = event.deadEntity;
    let label = "Target";
    let deadId;
    try {
      deadId = dead.id;
      label = getDisplayName(dead);
    } catch (error) {
      label = "Target";
    }
    if (deadId !== undefined) {
      angryUntil.delete(deadId);
    }
    try {
      const attacker = event.damageSource.damagingEntity;
      if (attacker && attacker.isValid && attacker.typeId === "minecraft:player" && attacker.id !== deadId) {
        startFlash(attacker.id, label, system.currentTick);
      }
    } catch (error) {
      return;
    }
  });

  world.afterEvents.playerLeave.subscribe((event) => {
    playerStates.delete(event.playerId);
  });
}
