import { world, system, ItemStack, EntityComponentTypes } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const CONTROLLER_ID = "allenscreations:controller";
const STATE_KEY = "game_state";
const BLOCK_KEY = "block_damage";
const INTERVAL_KEY = "shuffle_seconds";
const HOSTILE_KEY = "hostile_only";
const MUTE_KEY = "mute_glitch";

const LOOP_TICKS = 10;
const SHUFFLE_OPTIONS = [15, 30, 60];
const WARNING_DELAY_TICKS = 40;
const SEARCH_RADIUS = 48;
const WARN_RADIUS = 32;
const MAX_NEW_PER_SHUFFLE = 6;
const MAX_ACTIVE = 24;
const WARN_COOLDOWN_TICKS = 30;

const SKIP_TYPES = [
  "minecraft:player", "minecraft:ender_dragon", "minecraft:wither", "minecraft:warden",
  "minecraft:armor_stand", "minecraft:npc", "minecraft:agent", "minecraft:ender_crystal",
  "minecraft:item", "minecraft:xp_orb", "minecraft:lightning_bolt", "minecraft:tripod_camera",
  "minecraft:minecart", "minecraft:chest_minecart", "minecraft:boat", "minecraft:chest_boat",
  "minecraft:villager", "minecraft:villager_v2", "minecraft:wandering_trader",
  "minecraft:iron_golem", "minecraft:snow_golem",
];

const LOOT = {
  "minecraft:cow": "minecraft:beef", "minecraft:mooshroom": "minecraft:beef",
  "minecraft:pig": "minecraft:porkchop", "minecraft:chicken": "minecraft:chicken",
  "minecraft:sheep": "minecraft:mutton", "minecraft:rabbit": "minecraft:rabbit",
  "minecraft:cod": "minecraft:cod", "minecraft:salmon": "minecraft:salmon",
  "minecraft:zombie": "minecraft:rotten_flesh", "minecraft:skeleton": "minecraft:bone",
  "minecraft:spider": "minecraft:string", "minecraft:creeper": "minecraft:gunpowder",
};
const FALLBACK_LOOT = ["minecraft:bone", "minecraft:feather", "minecraft:leather", "minecraft:string"];

const SOUNDS = [
  "mob.cow.say", "mob.creeper.say", "mob.ghast.moan", "mob.zombie.say", "mob.cat.meow",
  "mob.wolf.growl", "mob.endermen.scream", "mob.pig.say", "mob.sheep.say", "mob.chicken.say",
];

const GENERIC_WARNINGS = [
  "[ANOMALY DETECTED] The biological code is rewriting...",
  "[SYSTEM WARNING] A creature has traded its soul with the void...",
  "[REALITY GLITCH] Something here no longer obeys its nature...",
  "[ERROR 0x00MOB] Instinct table corrupted. Reassigning...",
  "[ANOMALY DETECTED] Do not trust what you see...",
];

const getState = () => {
  const v = world.getDynamicProperty(STATE_KEY);
  return typeof v === "string" ? v : "idle";
};
const setState = (s) => world.setDynamicProperty(STATE_KEY, s);

const getFlag = (key) => world.getDynamicProperty(key) === true;
const blockDamage = () => getFlag(BLOCK_KEY);
const hostileOnly = () => getFlag(HOSTILE_KEY);
const shuffleSeconds = () => {
  const v = world.getDynamicProperty(INTERVAL_KEY);
  return SHUFFLE_OPTIONS.includes(v) ? v : 30;
};
const shuffleTicks = () => shuffleSeconds() * 20;
const isMuted = (p) => {
  try {
    return p.getDynamicProperty(MUTE_KEY) === true;
  } catch (err) {
    return false;
  }
};

const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const niceName = (typeId) => typeId.replace("minecraft:", "").split("_").join(" ");

function glitch(text) {
  let out = "";
  for (const ch of text) {
    out += ch !== " " && Math.random() < 0.07 ? "§k" + ch + "§r§c" : ch;
  }
  return "§c" + out;
}

function valid(e) {
  try {
    return !!e && e.isValid;
  } catch (err) {
    return false;
  }
}

const lastWarn = new Map();

function warn(dimension, location, text, bigChance = 0) {
  let players = [];
  try {
    players = dimension.getPlayers({ location, maxDistance: WARN_RADIUS });
  } catch (err) {
    return;
  }
  const now = system.currentTick;
  for (const p of players) {
    if (isMuted(p)) continue;
    if (now - (lastWarn.get(p.id) ?? -999) < WARN_COOLDOWN_TICKS) continue;
    lastWarn.set(p.id, now);
    try {
      p.onScreenDisplay.setActionBar(glitch(text));
      if (Math.random() < bigChance) {
        p.onScreenDisplay.setTitle("§4§k||", {
          subtitle: glitch(text),
          fadeInDuration: 4,
          stayDuration: 30,
          fadeOutDuration: 10,
        });
      }
    } catch (err) {
      // Player left or screen unavailable; ignore.
    }
  }
}

function nearestPlayer(entity, radius) {
  try {
    return entity.dimension.getPlayers({ location: entity.location, maxDistance: radius, closest: 1 })[0];
  } catch (err) {
    return undefined;
  }
}

function targetable(p) {
  try {
    const mode = String(p.getGameMode()).toLowerCase();
    return mode !== "creative" && mode !== "spectator";
  } catch (err) {
    return true;
  }
}

function wallBetween(a, b) {
  try {
    const from = { x: a.location.x, y: a.location.y + 1, z: a.location.z };
    const dx = b.location.x - from.x;
    const dy = b.location.y + 1 - from.y;
    const dz = b.location.z - from.z;
    const len = Math.hypot(dx, dy, dz);
    if (len < 0.5) return false;
    const hit = a.dimension.getBlockFromRay(from, { x: dx / len, y: dy / len, z: dz / len }, { maxDistance: len });
    return !!hit;
  } catch (err) {
    return false;
  }
}

function addFx(en, name, ticks, amp) {
  try {
    en.entity.addEffect(name, Math.max(ticks, 20), { amplifier: amp, showParticles: false });
    if (!en.fx.includes(name)) en.fx.push(name);
  } catch (err) {
    // Effect not applicable to this mob; ignore.
  }
}

function lunge(en, power, lift = 0.2) {
  const p = nearestPlayer(en.entity, 24);
  if (!p) return;
  const l = en.entity.location;
  const dx = p.location.x - l.x;
  const dz = p.location.z - l.z;
  const len = Math.hypot(dx, dz) || 1;
  try {
    en.entity.applyImpulse({ x: (dx / len) * power, y: lift, z: (dz / len) * power });
  } catch (err) {
    // Mob cannot be pushed; ignore.
  }
}

function strike(en, radius, damage) {
  const p = nearestPlayer(en.entity, radius);
  if (!p || !targetable(p) || wallBetween(en.entity, p)) return;
  try {
    p.applyDamage(damage, { cause: "entityAttack" });
  } catch (err) {
    // Player not damageable right now; ignore.
  }
}

function sound(entity, id, pitch = 1) {
  try {
    entity.dimension.playSound(id, entity.location, { volume: 1.5, pitch });
  } catch (err) {
    // Sound unavailable; ignore.
  }
}

const MUTATIONS = {
  flight: {
    every: 30, dur: [300, 500],
    warn: (n) => `[ANOMALY DETECTED] A ${n} has stolen the wings of the sky...`,
    start: (en) => { en.cap = en.entity.location.y + 14; },
    act: (en) => {
      const e = en.entity;
      if (e.location.y < en.cap - 3) {
        addFx(en, "levitation", 24, 0);
      } else {
        try { e.removeEffect("levitation"); } catch (err) { }
      }
      addFx(en, "slow_falling", 60, 0);
      if (en.n % 4 === 0) {
        const item = LOOT[e.typeId] ?? pick(FALLBACK_LOOT);
        try {
          e.dimension.spawnItem(new ItemStack(item, 1), e.location);
        } catch (err) { }
      }
    },
  },
  burning: {
    every: 20, dur: [300, 500],
    warn: (n) => `[SYSTEM WARNING] A ${n} burns with a hunger for flesh...`,
    start: (en) => addFx(en, "speed", en.endAt - system.currentTick, 2),
    act: (en) => {
      try { en.entity.setOnFire(5, false); } catch (err) { }
      lunge(en, 0.7);
      strike(en, 2.5, 3);
    },
  },
  leaper: {
    every: 25, dur: [300, 450],
    warn: (n) => `[REALITY GLITCH] A ${n} has forgotten gravity...`,
    start: (en) => addFx(en, "jump_boost", en.endAt - system.currentTick, 5),
    act: (en) => { lunge(en, 0.5, 0.9); },
  },
  teleporter: {
    every: 60, dur: [400, 600],
    warn: (n) => `[SYSTEM WARNING] A ${n} is learning to blink through space...`,
    act: (en) => {
      const p = nearestPlayer(en.entity, 24);
      if (!p) return;
      const d = Math.hypot(p.location.x - en.entity.location.x, p.location.z - en.entity.location.z);
      if (d < 4) return;
      const v = p.getViewDirection();
      const hl = Math.hypot(v.x, v.z) || 1;
      const target = { x: p.location.x - (v.x / hl) * 2, y: p.location.y, z: p.location.z - (v.z / hl) * 2 };
      try {
        const bx = Math.floor(target.x);
        const by = Math.floor(target.y);
        const bz = Math.floor(target.z);
        const feet = p.dimension.getBlock({ x: bx, y: by, z: bz });
        const head = p.dimension.getBlock({ x: bx, y: by + 1, z: bz });
        if (!feet?.isAir || !head?.isAir) return;
        en.entity.teleport(target, { dimension: p.dimension, facingLocation: p.location });
        sound(en.entity, "mob.endermen.portal");
      } catch (err) {
        return;
      }
      warn(p.dimension, p.location, "[ANOMALY DETECTED] Something is standing right behind you...", 0.4);
    },
  },
  ravager: {
    every: 20, dur: [400, 600],
    warn: (n) => `[ANOMALY DETECTED] A ${n} now carries the ferocity of a Ravager...`,
    start: (en) => {
      const t = en.endAt - system.currentTick;
      addFx(en, "health_boost", t, 9);
      addFx(en, "resistance", t, 3);
      addFx(en, "strength", t, 4);
      addFx(en, "speed", t, 1);
      try { en.entity.addEffect("instant_health", 1, { amplifier: 4, showParticles: false }); } catch (err) { }
    },
    act: (en) => {
      lunge(en, 0.8);
      strike(en, 3.5, 4);
    },
  },
  fuse: {
    every: 10, dur: [120, 120],
    warn: (n) => `[SYSTEM WARNING] A ${n} has inherited a creeper's fuse...`,
    act: (en) => {
      const e = en.entity;
      if (en.n === 1) {
        sound(e, "random.fuse");
        addFx(en, "slowness", 60, 2);
      }
      if (en.n === 6) {
        const loc = e.location;
        const dim = e.dimension;
        try {
          dim.createExplosion(loc, 3, { breaksBlocks: blockDamage(), causesFire: false });
        } catch (err) { }
        try { e.kill(); } catch (err) { }
        en.done = true;
      }
    },
  },
  ghost: {
    every: 40, dur: [300, 500],
    warn: (n) => `[ERROR 0x00MOB] A ${n} slips out of sight...`,
    start: (en) => {
      const t = en.endAt - system.currentTick;
      addFx(en, "invisibility", t, 0);
      addFx(en, "speed", t, 2);
    },
    act: (en) => { sound(en.entity, "mob.ghast.moan", 0.7); },
  },
  audio: {
    every: 30, dur: [300, 450],
    warn: (n) => `[REALITY GLITCH] The voice of a ${n} no longer belongs to it...`,
    act: (en) => { sound(en.entity, pick(SOUNDS), 0.6 + Math.random() * 0.9); },
  },
};
const WHEEL = [
  "flight", "flight", "burning", "burning", "leaper", "teleporter", "teleporter",
  "ravager", "fuse", "ghost", "audio", "audio",
];

const entries = new Map();
let nextShuffle = 0;

function eligible(e) {
  try {
    if (!valid(e) || !e.typeId.startsWith("minecraft:") || SKIP_TYPES.includes(e.typeId)) return false;
    if (entries.has(e.id)) return false;
    if (e.getComponent("minecraft:is_tamed")) return false;
    if (hostileOnly() && !e.matches({ families: ["monster"] })) return false;
    const h = e.getComponent("minecraft:health");
    return !!h && h.currentValue > 0;
  } catch (err) {
    return false;
  }
}

function queueMutation(e) {
  const key = pick(WHEEL);
  const mut = MUTATIONS[key];
  const now = system.currentTick;
  const dur = rand(mut.dur[0], mut.dur[1]);
  const en = {
    entity: e, id: e.id, mut, name: niceName(e.typeId), started: false, done: false,
    n: 0, fx: [], startAt: now + WARNING_DELAY_TICKS, endAt: now + WARNING_DELAY_TICKS + dur, nextAct: 0,
  };
  entries.set(e.id, en);
  const text = Math.random() < 0.5 ? pick(GENERIC_WARNINGS) : mut.warn(en.name);
  warn(e.dimension, e.location, text, 0.35);
}

function spin() {
  let created = 0;
  for (const player of world.getAllPlayers()) {
    if (created >= MAX_NEW_PER_SHUFFLE || entries.size >= MAX_ACTIVE) break;
    let near = [];
    try {
      near = player.dimension.getEntities({
        location: player.location, maxDistance: SEARCH_RADIUS, excludeTypes: SKIP_TYPES,
      });
    } catch (err) {
      continue;
    }
    for (let i = near.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [near[i], near[j]] = [near[j], near[i]];
    }
    for (const e of near) {
      if (created >= MAX_NEW_PER_SHUFFLE || entries.size >= MAX_ACTIVE) break;
      if (!eligible(e)) continue;
      queueMutation(e);
      created++;
    }
  }
}

function finish(en) {
  const e = en.entity;
  if (!valid(e)) return;
  for (const name of en.fx) {
    try { e.removeEffect(name); } catch (err) { }
  }
  try { e.extinguishFire(); } catch (err) { }
  if (en.started) sound(e, "random.pop", 0.8);
}

function clearAll() {
  for (const en of entries.values()) finish(en);
  entries.clear();
}

function step(en, now) {
  if (!valid(en.entity)) {
    entries.delete(en.id);
    return;
  }
  if (!en.started) {
    if (now < en.startAt) return;
    en.started = true;
    en.mut.start?.(en);
    en.nextAct = now;
  }
  if (en.done || now >= en.endAt) {
    finish(en);
    entries.delete(en.id);
    return;
  }
  if (now >= en.nextAct) {
    en.nextAct = now + en.mut.every;
    en.n++;
    en.mut.act?.(en, now);
  }
}

system.runInterval(() => {
  if (getState() !== "running") return;
  const now = system.currentTick;
  if (nextShuffle === 0) nextShuffle = now + 100;
  if (now >= nextShuffle) {
    nextShuffle = now + shuffleTicks();
    spin();
  }
  for (const en of [...entries.values()]) {
    try {
      step(en, now);
    } catch (err) {
      entries.delete(en.id);
    }
  }
}, LOOP_TICKS);

function startGame() {
  setState("running");
  world.sendMessage("§4Mob Chaos: the roulette is spinning. Nothing here is what it seems.");
  nextShuffle = system.currentTick + 20;
}

function endGame() {
  setState("ended");
  clearAll();
  nextShuffle = 0;
  world.sendMessage("§7Mob Chaos ended. Nature settles back into its old habits.");
}

function restartGame() {
  clearAll();
  lastWarn.clear();
  startGame();
}

function canControl(player) {
  try {
    if (world.getAllPlayers().length <= 1) return true;
    return player.isOp();
  } catch (err) {
    return true;
  }
}

const STATE_LABELS = { running: "Running", ended: "Ended", idle: "Not started" };

async function openController(player, attempt = 0) {
  if (!canControl(player)) {
    player.sendMessage("§cOnly operators can use the Controller.");
    return;
  }
  const state = getState();
  const seconds = shuffleSeconds();
  const form = new ActionFormData()
    .title("Controller")
    .body(`State: ${STATE_LABELS[state] ?? "Not started"}`)
    .button("Start")
    .button("Restart")
    .button("End")
    .button(`Block damage: ${blockDamage() ? "On" : "Off"}`)
    .button(`Shuffle every ${seconds} seconds`)
    .button(`Mobs: ${hostileOnly() ? "Hostile only" : "All"}`)
    .button(`Glitch text: ${isMuted(player) ? "Off" : "On"}`);
  let res;
  try {
    res = await form.show(player);
  } catch (e) {
    return;
  }
  if (res.canceled) {
    if (String(res.cancelationReason) === "UserBusy" && attempt < 5) {
      system.runTimeout(() => openController(player, attempt + 1), 10);
    }
    return;
  }
  if (res.selection === 0) {
    state === "running" ? player.sendMessage("Already running.") : startGame();
  } else if (res.selection === 1) {
    restartGame();
  } else if (res.selection === 2) {
    state === "running" ? endGame() : player.sendMessage("Nothing to end.");
  } else if (res.selection === 3) {
    world.setDynamicProperty(BLOCK_KEY, !blockDamage());
    system.runTimeout(() => openController(player), 2);
  } else if (res.selection === 4) {
    const next = SHUFFLE_OPTIONS[(SHUFFLE_OPTIONS.indexOf(seconds) + 1) % SHUFFLE_OPTIONS.length];
    world.setDynamicProperty(INTERVAL_KEY, next);
    nextShuffle = 0;
    system.runTimeout(() => openController(player), 2);
  } else if (res.selection === 5) {
    world.setDynamicProperty(HOSTILE_KEY, !hostileOnly());
    system.runTimeout(() => openController(player), 2);
  } else if (res.selection === 6) {
    player.setDynamicProperty(MUTE_KEY, !isMuted(player));
    system.runTimeout(() => openController(player), 2);
  }
}

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  if (itemStack?.typeId === CONTROLLER_ID) openController(source);
});

system.afterEvents.scriptEventReceive.subscribe(({ id }) => {
  if (id === "allenscreations:start") {
    if (getState() !== "running") startGame();
  } else if (id === "allenscreations:restart") {
    restartGame();
  } else if (id === "allenscreations:end") {
    if (getState() === "running") endGame();
  }
});

function giveController(player) {
  const inv = player.getComponent(EntityComponentTypes.Inventory)?.container;
  if (!inv) return;
  for (let i = 0; i < inv.size; i++) {
    if (inv.getItem(i)?.typeId === CONTROLLER_ID) return;
  }
  inv.addItem(new ItemStack(CONTROLLER_ID, 1));
}
world.afterEvents.playerSpawn.subscribe(({ player }) => {
  giveController(player);
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  lastWarn.delete(playerId);
});
