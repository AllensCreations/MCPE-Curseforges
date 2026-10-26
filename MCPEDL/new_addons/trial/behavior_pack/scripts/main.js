import { world, system, ItemStack, EntityDamageCause } from "@minecraft/server";

// ---------- constants ----------
const S = "\u00a7";
const SCAN_TICKS = 20;
const FAST_TICKS = 4;
const RADIUS = 48;
const WARN_RADIUS = 32;
const WARN_DELAY = 30;
const MAX_MUTATIONS_PER_SCAN = 8;
const OVERWORLD = "minecraft:overworld";
const GLITCH_CHARS = "#%&@$?*!/|";

const cfg = { warnings: true, blocks: true, interval: 120 };

const EXCLUDED = new Set([
  "minecraft:player", "minecraft:armor_stand", "minecraft:npc", "minecraft:agent",
  "minecraft:ender_dragon", "minecraft:wither", "minecraft:tripod_camera",
]);

const EFFECTS = ["health_boost", "resistance", "strength", "speed", "invisibility", "jump_boost", "slow_falling"];

// Each trait is a "donor" behavior stolen from another creature.
const TRAITS = [
  { id: "parrot_flight", flags: ["flight"], effects: [["slow_falling", 0]], chase: 0, melee: 0,
    sounds: ["mob.parrot.idle", "mob.bat.idle"], warn: "flight" },
  { id: "zombie_hunger", flags: ["burn"], effects: [], chase: 0.1, melee: 3,
    sounds: ["mob.zombie.say", "mob.zombie.hurt"], warn: "hunt" },
  { id: "creeper_fuse", flags: ["fuse"], effects: [], chase: 0, melee: 0,
    sounds: ["mob.creeper.say"], warn: "fuse" },
  { id: "enderman_blink", flags: ["teleport"], effects: [], chase: 0, melee: 0,
    sounds: ["mob.endermen.idle", "mob.endermen.scream"], warn: "teleport" },
  { id: "ravager_bulk", flags: [], effects: [["health_boost", 24], ["resistance", 1], ["strength", 1]], chase: 0.09, melee: 9,
    sounds: ["mob.ravager.roar"], warn: "bulk" },
  { id: "rabbit_leap", flags: ["hop"], effects: [["jump_boost", 2]], chase: 0, melee: 0,
    sounds: ["mob.rabbit.idle"], warn: "leap" },
  { id: "cheetah_sprint", flags: [], effects: [["speed", 3]], chase: 0.14, melee: 2,
    sounds: ["mob.ocelot.idle", "mob.wolf.growl"], warn: "hunt" },
  { id: "skeleton_volley", flags: ["volley"], effects: [], chase: 0, melee: 0,
    sounds: ["mob.skeleton.say", "random.bow"], warn: "volley" },
  { id: "phantom_vanish", flags: [], effects: [["invisibility", 0]], chase: 0.08, melee: 2,
    sounds: ["mob.phantom.idle"], warn: "vanish" },
];

const LINES = {
  mutate: [
    "[ANOMALY DETECTED] The biological code is rewriting...",
    "[SYSTEM WARNING] A creature has traded its soul with the void...",
    "[REALITY FAULT] Something nearby is no longer what it was...",
    "[SYNTAX ERROR] Instinct has been replaced. Trust nothing.",
    "[CODE BREACH] A heartbeat has been reassigned...",
  ],
  flight: ["[ANOMALY DETECTED] Gravity has been revoked for a living thing..."],
  hunt: ["[THREAT] Hunger has been installed in something innocent..."],
  fuse: ["[SYSTEM WARNING] Fuse protocol detected in an unexpected host..."],
  teleport: ["[REALITY FAULT] Spatial coordinates are being rewritten behind you..."],
  bulk: ["[CRITICAL] Vitality overflow. Something here is far too strong..."],
  leap: ["[ANOMALY DETECTED] Legs are being overwritten with springs..."],
  volley: ["[SYSTEM WARNING] A projectile subroutine has been loaded..."],
  vanish: ["[REALITY FAULT] Something is fading from the render..."],
};

// ---------- helpers ----------
const rnd = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function valid(e) {
  try {
    const v = e.isValid;
    return typeof v === "function" ? e.isValid() : !!v;
  } catch (err) {
    return false;
  }
}

function isAir(dim, loc) {
  try {
    const b = dim.getBlock(loc);
    if (!b) return false;
    const v = b.isAir;
    return typeof v === "function" ? b.isAir() : !!v;
  } catch (err) {
    return false;
  }
}

function glitch(text) {
  let out = "";
  for (const ch of text) {
    out += ch !== " " && Math.random() < 0.07 ? GLITCH_CHARS[Math.floor(Math.random() * GLITCH_CHARS.length)] : ch;
  }
  return out;
}

function playSnd(e, id, vol = 1, pitch = 1) {
  try {
    const l = e.location;
    e.dimension.runCommand(
      `playsound ${id} @a ${l.x.toFixed(1)} ${l.y.toFixed(1)} ${l.z.toFixed(1)} ${vol} ${pitch.toFixed(2)}`
    );
  } catch (err) {
    // unknown sound or unloaded area: ignore
  }
}

// ---------- settings (kept in world dynamic properties) ----------
function loadSettings() {
  try {
    const w = world.getDynamicProperty("mobchaos:warnings");
    if (typeof w === "boolean") cfg.warnings = w;
    const b = world.getDynamicProperty("mobchaos:blocks");
    if (typeof b === "boolean") cfg.blocks = b;
    const i = world.getDynamicProperty("mobchaos:interval");
    if (typeof i === "number" && i >= 20 && i <= 3600) cfg.interval = i;
  } catch (err) {
    // keep defaults
  }
}

function saveSetting(key, value) {
  try {
    world.setDynamicProperty("mobchaos:" + key, value);
  } catch (err) {
    // ignore
  }
}

// ---------- warnings (Grim Subtext & Reality Glitch Engine) ----------
const lastWarn = new Map();

function warnNear(e, key, loud) {
  if (!cfg.warnings) return;
  const now = system.currentTick;
  let players;
  try {
    players = e.dimension.getPlayers({ location: e.location, maxDistance: WARN_RADIUS });
  } catch (err) {
    return;
  }
  const line = glitch(pick(LINES[key] || LINES.mutate));
  for (const p of players) {
    if (now < (lastWarn.get(p.id) || 0)) continue;
    lastWarn.set(p.id, now + (loud ? 40 : 100));
    try {
      p.onScreenDisplay.setActionBar(`${S}4${S}l${line}`);
      if (loud) {
        p.onScreenDisplay.setTitle(`${S}4${S}k||${S}r ${S}4${S}l${glitch("ANOMALY")} ${S}r${S}4${S}k||`, {
          subtitle: `${S}c${line}`,
          fadeInDuration: 4,
          stayDuration: 30,
          fadeOutDuration: 12,
        });
        p.playSound("ambient.cave", { volume: 0.6, pitch: 0.7 });
      }
    } catch (err) {
      // player left or UI unavailable
    }
  }
}

// ---------- mob state ----------
const states = new Map();

function newState(e) {
  return {
    entity: e, near: true, seen: 0, pending: false, nextShuffle: 0,
    traits: null, flags: {}, sounds: [], chase: 0, melee: 0, hoverY: 0,
    hitAt: 0, armAt: 0, fuseAt: 0, dropAt: 0, burnAt: 0, hopAt: 0, sndAt: 0, tpAt: 0, volleyAt: 0,
    busy: {},
  };
}

function eligible(e) {
  if (!valid(e) || EXCLUDED.has(e.typeId)) return false;
  try {
    return !!e.getComponent("minecraft:health");
  } catch (err) {
    return false;
  }
}

function beginMutation(s, e) {
  s.pending = true;
  warnNear(e, "mutate", false);
  system.runTimeout(() => {
    s.pending = false;
    if (valid(e)) applyMutation(s, e);
  }, WARN_DELAY);
}

function applyMutation(s, e) {
  const now = system.currentTick;
  for (const f of EFFECTS) {
    try { e.removeEffect(f); } catch (err) { /* none active */ }
  }
  const chosen = [pick(TRAITS)];
  if (Math.random() < 0.4) {
    let t;
    do { t = pick(TRAITS); } while (chosen.includes(t));
    chosen.push(t);
  }
  s.traits = chosen.map((t) => t.id);
  s.flags = {};
  s.sounds = [];
  s.chase = 0;
  s.melee = 0;
  for (const t of chosen) {
    for (const f of t.flags) s.flags[f] = true;
    s.sounds.push(...t.sounds);
    s.chase = Math.max(s.chase, t.chase);
    s.melee = Math.max(s.melee, t.melee);
  }
  s.nextShuffle = now + Math.floor(cfg.interval * 20 * (0.75 + Math.random() * 0.5));
  const duration = s.nextShuffle - now + 200;
  for (const t of chosen) {
    for (const [name, amp] of t.effects) {
      try { e.addEffect(name, duration, { amplifier: amp, showParticles: false }); } catch (err) { /* unsupported mob */ }
    }
  }
  try { e.getComponent("minecraft:health")?.resetToMaxValue(); } catch (err) { /* ignore */ }
  s.hoverY = e.location.y + 5;
  s.fuseAt = 0;
  s.armAt = now + 100;
  s.busy = {};
  s.sndAt = now + rnd(60, 200);
  s.dropAt = now + rnd(100, 300);
  // Announce the scrambled ability a moment after the mutation lands.
  const lead = chosen.find((t) => t.warn !== "hunt" || chosen.length === 1);
  if (lead && Math.random() < 0.5) warnNear(e, lead.warn, false);
}

// ---------- scan: find mobs near players, queue mutations ----------
function scan() {
  const now = system.currentTick;
  const seen = new Set();
  let budget = MAX_MUTATIONS_PER_SCAN;
  for (const p of world.getAllPlayers()) {
    let list;
    try {
      list = p.dimension.getEntities({ location: p.location, maxDistance: RADIUS });
    } catch (err) {
      continue;
    }
    for (const e of list) {
      if (seen.has(e.id)) continue;
      seen.add(e.id);
      if (!eligible(e)) continue;
      let s = states.get(e.id);
      if (!s) {
        s = newState(e);
        states.set(e.id, s);
      }
      s.entity = e;
      s.near = true;
      s.seen = now;
      if (!s.pending && now >= s.nextShuffle && budget > 0) {
        budget--;
        beginMutation(s, e);
      }
    }
  }
  for (const [id, s] of states) {
    if (s.seen !== now) s.near = false;
    if (now - s.seen > 1200) states.delete(id);
  }
}

// ---------- fast loop: scrambled abilities for nearby mutated mobs ----------
function targetable(p) {
  try {
    return p.getGameMode() !== "spectator";
  } catch (err) {
    return true;
  }
}

function fast() {
  const players = world.getAllPlayers().filter(targetable);
  if (!players.length) return;
  const now = system.currentTick;
  for (const [id, s] of states) {
    if (!s.near || !s.traits) continue;
    const e = s.entity;
    if (!valid(e)) {
      states.delete(id);
      continue;
    }
    let np = null;
    let nd = Infinity;
    const el = e.location;
    for (const p of players) {
      if (p.dimension.id !== e.dimension.id) continue;
      const d = Math.hypot(p.location.x - el.x, p.location.y - el.y, p.location.z - el.z);
      if (d < nd) { nd = d; np = p; }
    }
    try {
      tickMob(s, e, np, nd, now);
    } catch (err) {
      // never let one mob break the loop
    }
  }
}

function tickMob(s, e, np, nd, now) {
  const f = s.flags;
  const el = e.location;

  // Scrambled audio: cries stolen from other creatures.
  if (now >= s.sndAt && s.sounds.length) {
    s.sndAt = now + rnd(140, 420);
    playSnd(e, pick(s.sounds), 1, 0.8 + Math.random() * 0.4);
  }

  // Chase and melee.
  if (np && s.chase > 0 && nd < 24 && nd > 1.8) {
    const dx = np.location.x - el.x;
    const dz = np.location.z - el.z;
    const l = Math.hypot(dx, dz) || 1;
    e.applyImpulse({ x: (dx / l) * s.chase, y: 0, z: (dz / l) * s.chase });
  }
  if (np && s.melee > 0 && nd < 2.4 && now >= s.hitAt) {
    s.hitAt = now + 20;
    np.applyDamage(s.melee, { cause: EntityDamageCause.entityAttack, damagingEntity: e });
  }

  // Parrot flight: hold altitude, drift, drop loot from above.
  if (f.flight) {
    if (el.y < s.hoverY) {
      e.applyImpulse({ x: 0, y: Math.min(0.5, (s.hoverY - el.y) * 0.15 + 0.1), z: 0 });
    }
    if (now % 40 < FAST_TICKS) {
      e.applyImpulse({ x: (Math.random() - 0.5) * 0.3, y: 0, z: (Math.random() - 0.5) * 0.3 });
    }
    if (now >= s.dropAt) {
      s.dropAt = now + rnd(120, 320);
      const drops = { "minecraft:cow": "minecraft:beef", "minecraft:sheep": "minecraft:mutton",
        "minecraft:pig": "minecraft:porkchop", "minecraft:chicken": "minecraft:chicken" };
      const item = drops[e.typeId] || "minecraft:feather";
      e.dimension.spawnItem(new ItemStack(item, 1), el);
    }
  }

  // Zombie hunger: burns in daylight.
  if (f.burn && now >= s.burnAt) {
    s.burnAt = now + 40;
    if (e.dimension.id === OVERWORLD && world.getTimeOfDay() < 12000 && !e.isInWater) {
      e.setOnFire(6);
    }
  }

  // Rabbit leap.
  if (f.hop && now >= s.hopAt && e.isOnGround) {
    s.hopAt = now + rnd(15, 40);
    const a = Math.random() * Math.PI * 2;
    e.applyImpulse({ x: Math.cos(a) * 0.35, y: 0.6, z: Math.sin(a) * 0.35 });
  }

  // Creeper fuse: arms when a player gets close, cancels if they escape.
  if (f.fuse) {
    if (s.fuseAt) {
      if (!np || nd > 7) {
        s.fuseAt = 0;
        s.armAt = now + 60;
      } else if (now >= s.fuseAt) {
        detonate(e);
        return;
      }
    } else if (np && nd < 3.2 && now >= s.armAt) {
      s.fuseAt = now + 30;
      warnNear(e, "fuse", true);
      playSnd(e, "creeper.primed", 1, 1);
    }
  }

  // Enderman blink: appears behind the nearest player.
  if (f.teleport && np && !s.busy.tp && now >= s.tpAt && nd > 5 && nd < 24) {
    s.busy.tp = true;
    warnNear(e, "teleport", true);
    system.runTimeout(() => {
      s.busy.tp = false;
      s.tpAt = system.currentTick + rnd(100, 240);
      try { blink(e, np); } catch (err) { /* ignore */ }
    }, 16);
  }

  // Skeleton volley: fires arrows at the player.
  if (f.volley && np && !s.busy.vol && now >= s.volleyAt && nd > 4 && nd < 20) {
    s.busy.vol = true;
    warnNear(e, "volley", false);
    system.runTimeout(() => {
      s.busy.vol = false;
      s.volleyAt = system.currentTick + rnd(60, 120);
      try { shoot(e, np); } catch (err) { /* ignore */ }
    }, 12);
  }
}

function detonate(e) {
  const id = e.id;
  const loc = e.location;
  try {
    e.dimension.createExplosion(loc, 3.2, { breaksBlocks: cfg.blocks, causesFire: false, source: e });
  } catch (err) {
    // ignore
  }
  states.delete(id);
  try { e.kill(); } catch (err) { /* already gone */ }
}

function blink(e, p) {
  if (!valid(e) || !valid(p)) return;
  const v = p.getViewDirection();
  const l = Math.hypot(v.x, v.z) || 1;
  const pl = p.location;
  const tgt = { x: pl.x - (v.x / l) * 2, y: pl.y, z: pl.z - (v.z / l) * 2 };
  const dim = p.dimension;
  if (!isAir(dim, tgt) || !isAir(dim, { x: tgt.x, y: tgt.y + 1, z: tgt.z })) return;
  e.teleport(tgt, { dimension: dim, facingLocation: pl });
  playSnd(e, "mob.endermen.portal", 1, 1);
}

function shoot(e, p) {
  if (!valid(e) || !valid(p)) return;
  const el = e.location;
  const pl = p.location;
  const o = { x: el.x, y: el.y + 1.2, z: el.z };
  const dx = pl.x - o.x;
  const dy = pl.y + 1 - o.y;
  const dz = pl.z - o.z;
  const l = Math.hypot(dx, dy, dz) || 1;
  const d = { x: dx / l, y: dy / l, z: dz / l };
  const arrow = e.dimension.spawnEntity("minecraft:arrow", { x: o.x + d.x * 0.8, y: o.y + d.y * 0.8, z: o.z + d.z * 0.8 });
  arrow.applyImpulse({ x: d.x * 2.2, y: d.y * 2.2, z: d.z * 2.2 });
  playSnd(e, "random.bow", 1, 1);
}

// ---------- /scriptevent controls ----------
system.afterEvents.scriptEventReceive.subscribe((ev) => {
  if (!ev.id.startsWith("mobchaos:")) return;
  const cmd = ev.id.slice(9);
  const arg = (ev.message || "").trim().toLowerCase();
  const say = (m) => {
    const src = ev.sourceEntity;
    if (src && src.typeId === "minecraft:player") src.sendMessage(m);
    else world.sendMessage(m);
  };
  if (cmd === "reshuffle") {
    for (const s of states.values()) s.nextShuffle = 0;
    say("[Mob Chaos] Reshuffling every nearby mob.");
  } else if (cmd === "warnings") {
    cfg.warnings = arg !== "off";
    saveSetting("warnings", cfg.warnings);
    say(`[Mob Chaos] Warnings ${cfg.warnings ? "on" : "off"}.`);
  } else if (cmd === "blocks") {
    cfg.blocks = arg !== "off";
    saveSetting("blocks", cfg.blocks);
    say(`[Mob Chaos] Explosions ${cfg.blocks ? "break" : "do not break"} blocks.`);
  } else if (cmd === "interval") {
    const n = Number(arg);
    if (Number.isFinite(n) && n >= 20 && n <= 3600) {
      cfg.interval = Math.floor(n);
      saveSetting("interval", cfg.interval);
      say(`[Mob Chaos] Shuffle interval: ${cfg.interval} seconds.`);
    } else {
      say("[Mob Chaos] Use a number of seconds from 20 to 3600.");
    }
  } else if (cmd === "status") {
    say(`[Mob Chaos] Interval ${cfg.interval}s, warnings ${cfg.warnings ? "on" : "off"}, block damage ${cfg.blocks ? "on" : "off"}, tracked mobs ${states.size}.`);
  }
});

// ---------- start ----------
system.run(loadSettings);
system.runInterval(scan, SCAN_TICKS);
system.runInterval(fast, FAST_TICKS);
