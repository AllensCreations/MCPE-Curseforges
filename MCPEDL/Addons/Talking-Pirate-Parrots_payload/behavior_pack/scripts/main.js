import { world, system, BlockVolume } from "@minecraft/server";

const TAG = "talking_parrot_cooldown";
const PREFIX = "mob.parrot.talk.";
const CONFIG = {
  pollTicks: 40,
  searchRadius: 16,
  listenRadius: 8,
  mobRadius: 8,
  lavaRadius: 5,
  cooldownMin: 100,
  cooldownMax: 200,
  actionChance: 0.35,
  idleChance: 0.06,
  idleGap: 1200,
  repeatGap: 1200,
  lowHealth: 6,
  nearDeath: 2,
  deepY: 0,
  highY: 120,
};

const MOB_EVENTS = {
  "minecraft:creeper": "creeper",
  "minecraft:skeleton": "skeleton",
  "minecraft:zombie": "zombie",
  "minecraft:phantom": "phantom",
  "minecraft:spider": "spider",
  "minecraft:enderman": "enderman",
  "minecraft:drowned": "drowned",
  "minecraft:witch": "witch",
  "minecraft:warden": "warden",
};

const DAMAGE_EVENTS = {
  fall: "fall",
  fire: "fire",
  fireTick: "fire",
  lava: "fire",
  magic: "poison",
  poison: "poison",
};

const BREAK_EVENTS = {
  "minecraft:diamond_ore": "diamond",
  "minecraft:deepslate_diamond_ore": "diamond",
  "minecraft:gold_ore": "gold",
  "minecraft:deepslate_gold_ore": "gold",
  "minecraft:dirt": "dirt",
};

const HELD_EVENTS = {
  "minecraft:diamond": "diamond",
  "minecraft:gold_ingot": "gold",
  "minecraft:cookie": "cookie",
};

const FOOD_EVENTS = {
  "minecraft:cookie": "cookie",
};

const expiries = new Map();
const lastSpoken = new Map();

function chance(p) {
  return Math.random() < p;
}

function randomInt(min, max) {
  return min + Math.floor(Math.random() * (max - min + 1));
}

function isTamedParrot(entity) {
  try {
    return (
      entity.typeId === "minecraft:parrot" &&
      entity.getComponent("minecraft:is_tamed") !== undefined
    );
  } catch {
    return false;
  }
}

function tamedParrotsNear(player, radius) {
  return player.dimension
    .getEntities({ type: "minecraft:parrot", location: player.location, maxDistance: radius })
    .filter(isTamedParrot);
}

function isOnShoulder(parrot) {
  try {
    return parrot.getComponent("minecraft:riding")?.entityRidingOn?.typeId === "minecraft:player";
  } catch {
    return false;
  }
}

function repeatBlocked(player, key, gap) {
  const last = lastSpoken.get(`${player.id}:${key}`);
  return last !== undefined && system.currentTick - last < gap;
}

function speak(parrot, key, player) {
  if (!isTamedParrot(parrot)) return false;
  const listeners = parrot.dimension.getPlayers({
    location: parrot.location,
    maxDistance: CONFIG.listenRadius,
  });
  if (listeners.length === 0) return false;
  if (listeners.some((p) => p.hasTag(TAG))) return false;
  const until = system.currentTick + randomInt(CONFIG.cooldownMin, CONFIG.cooldownMax);
  for (const p of listeners) {
    p.addTag(TAG);
    expiries.set(p.id, until);
  }
  if (player) lastSpoken.set(`${player.id}:${key}`, system.currentTick);
  parrot.dimension.playSound(PREFIX + key, parrot.location, { volume: 1, pitch: 1 });
  return true;
}

function reactNear(player, key, p) {
  if (!chance(p)) return;
  const parrots = tamedParrotsNear(player, CONFIG.searchRadius);
  if (parrots.length === 0) return;
  speak(parrots[randomInt(0, parrots.length - 1)], key, player);
}

function hasLavaNear(player) {
  try {
    const r = CONFIG.lavaRadius;
    const l = player.location;
    const volume = new BlockVolume(
      { x: Math.floor(l.x) - r, y: Math.floor(l.y) - r, z: Math.floor(l.z) - r },
      { x: Math.floor(l.x) + r, y: Math.floor(l.y) + r, z: Math.floor(l.z) + r },
    );
    return player.dimension.containsBlock(volume, {
      includeTypes: ["minecraft:lava", "minecraft:flowing_lava"],
    });
  } catch {
    return false;
  }
}

function isNight() {
  const t = world.getTimeOfDay();
  return t >= 13000 && t <= 23000;
}

function pollEvent(player, parrot) {
  const near = player.dimension.getEntities({
    location: parrot.location,
    maxDistance: CONFIG.mobRadius,
  });
  for (const e of near) {
    const key = MOB_EVENTS[e.typeId];
    if (key && !repeatBlocked(player, key, CONFIG.repeatGap)) return key;
  }

  const hp = player.getComponent("minecraft:health")?.currentValue ?? 20;
  if (hp < CONFIG.nearDeath && !repeatBlocked(player, "near_death", CONFIG.repeatGap)) return "near_death";
  if (hp < CONFIG.lowHealth && !repeatBlocked(player, "low_hp", CONFIG.repeatGap)) return "low_hp";

  const env = [];
  if (hasLavaNear(player)) env.push("lava");
  if (player.dimension.id === "minecraft:nether") env.push("nether");
  if (player.location.y < CONFIG.deepY) env.push("deep_cave");
  if (player.location.y > CONFIG.highY) env.push("height");
  if (player.isInWater) env.push("underwater");
  if (player.dimension.id === "minecraft:overworld" && isNight()) env.push("darkness");
  const fresh = env.filter((k) => !repeatBlocked(player, k, CONFIG.repeatGap));
  if (fresh.length > 0 && chance(0.5)) return fresh[randomInt(0, fresh.length - 1)];

  const held = player.getComponent("minecraft:inventory")?.container?.getItem(player.selectedSlotIndex);
  const heldKey = held ? HELD_EVENTS[held.typeId] : undefined;
  if (heldKey && chance(0.2) && !repeatBlocked(player, heldKey, CONFIG.repeatGap)) return heldKey;

  const shoulder = isOnShoulder(parrot);
  if (!repeatBlocked(player, "idle", CONFIG.idleGap) && chance(CONFIG.idleChance)) {
    lastSpoken.set(`${player.id}:idle`, system.currentTick);
    return shoulder ? "shoulder" : "humor";
  }
  return undefined;
}

system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    try {
      if (player.hasTag(TAG)) continue;
      const parrots = tamedParrotsNear(player, CONFIG.searchRadius);
      if (parrots.length === 0) continue;
      const parrot = parrots[randomInt(0, parrots.length - 1)];
      const key = pollEvent(player, parrot);
      if (key) speak(parrot, key, player);
    } catch {}
  }
}, CONFIG.pollTicks);

system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    try {
      if (!player.hasTag(TAG)) continue;
      const until = expiries.get(player.id);
      if (until === undefined || system.currentTick >= until) {
        player.removeTag(TAG);
        expiries.delete(player.id);
      }
    } catch {}
  }
}, 10);

world.afterEvents.playerSpawn.subscribe(({ player, initialSpawn }) => {
  if (initialSpawn && player.hasTag(TAG)) player.removeTag(TAG);
});

world.afterEvents.entityHurt.subscribe(({ hurtEntity, damageSource }) => {
  try {
    if (hurtEntity.typeId === "minecraft:player") {
      reactNear(hurtEntity, DAMAGE_EVENTS[damageSource.cause] ?? "hit", 0.6);
    } else if (isTamedParrot(hurtEntity)) {
      const player = hurtEntity.dimension
        .getPlayers({ location: hurtEntity.location, maxDistance: CONFIG.listenRadius, closest: 1 })[0];
      if (player) speak(hurtEntity, "hit", player);
    }
  } catch {}
});

world.afterEvents.playerBreakBlock.subscribe(({ player, brokenBlockPermutation }) => {
  try {
    const key = BREAK_EVENTS[brokenBlockPermutation.type.id];
    if (key) reactNear(player, key, CONFIG.actionChance);
  } catch {}
});

world.afterEvents.playerInteractWithBlock.subscribe(({ player, block }) => {
  try {
    const id = block.typeId;
    if (id === "minecraft:chest" || id === "minecraft:trapped_chest" || id === "minecraft:barrel") {
      reactNear(player, "chest", CONFIG.actionChance);
    } else if (id.endsWith("_bed")) {
      reactNear(player, "sleep", CONFIG.actionChance);
    }
  } catch {}
});

world.afterEvents.itemCompleteUse.subscribe(({ source, itemStack }) => {
  try {
    if (source.typeId !== "minecraft:player") return;
    reactNear(source, FOOD_EVENTS[itemStack.typeId] ?? "eating", CONFIG.actionChance);
  } catch {}
});
