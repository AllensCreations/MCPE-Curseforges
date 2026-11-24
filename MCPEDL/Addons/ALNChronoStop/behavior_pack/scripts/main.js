import { world, system, MolangVariableMap } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";

const CLOCK_ID = "minecraft:clock";
const WATCH_ID = "aln:chrono_watch";
const CONFIG_KEY = "aln_chrono:config";
const RADIUS = 48;
const RAMP_TICKS = 30;
const DOME_RADIUS = 18;
const GRACE_TICKS = 4;
const GRACE_RANGE = 8;
const HEARTBEAT_TICKS = 32;
const PULSE_TICKS = 10;
const FREEZE_OPTIONS = [5, 8, 12, 15];
const COOLDOWN_OPTIONS = [15, 30, 60];
const DEFAULTS = { freeze: 8, cooldown: 30, particles: true };
const PROJECTILES = new Set([
  "minecraft:arrow",
  "minecraft:snowball",
  "minecraft:egg",
  "minecraft:ender_pearl",
  "minecraft:fireball",
  "minecraft:small_fireball",
  "minecraft:thrown_trident",
  "minecraft:splash_potion",
  "minecraft:lingering_potion",
  "minecraft:xp_bottle",
  "minecraft:wither_skull",
  "minecraft:wither_skull_dangerous",
  "minecraft:wind_charge_projectile",
]);

let tickNow = 0;
let session = null;
let pulse = null;
const cooldowns = new Map();

const add = (a, b) => ({ x: a.x + b.x, y: a.y + b.y, z: a.z + b.z });
const sub = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const mul = (a, k) => ({ x: a.x * k, y: a.y * k, z: a.z * k });
const len = (a) => Math.hypot(a.x, a.y, a.z);
const copy = (a) => ({ x: a.x, y: a.y, z: a.z });
const smooth = (p) => p * p * (3 - 2 * p);

function loadConfig() {
  try {
    const raw = world.getDynamicProperty(CONFIG_KEY);
    if (typeof raw !== "string") return { ...DEFAULTS };
    const c = JSON.parse(raw);
    return {
      freeze: FREEZE_OPTIONS.includes(c.freeze) ? c.freeze : DEFAULTS.freeze,
      cooldown: COOLDOWN_OPTIONS.includes(c.cooldown) ? c.cooldown : DEFAULTS.cooldown,
      particles: typeof c.particles === "boolean" ? c.particles : DEFAULTS.particles,
    };
  } catch (e) {
    return { ...DEFAULTS };
  }
}

function saveConfig(cfg) {
  try {
    world.setDynamicProperty(CONFIG_KEY, JSON.stringify(cfg));
  } catch (e) {}
}

function bar(player, text) {
  try {
    player.onScreenDisplay.setActionBar(text);
  } catch (e) {}
}

function gauge(fraction, on, off) {
  const n = Math.max(0, Math.min(20, Math.round(fraction * 20)));
  return `${on}${"|".repeat(n)}${off}${"|".repeat(20 - n)}`;
}

function velocityOf(entity) {
  try {
    return copy(entity.getVelocity());
  } catch (e) {
    return { x: 0, y: 0, z: 0 };
  }
}

function playersNear(dim, center) {
  const out = [];
  for (const p of world.getAllPlayers()) {
    try {
      if (p.dimension.id === dim.id && len(sub(p.location, center)) <= RADIUS) out.push(p);
    } catch (e) {}
  }
  return out;
}

function playFor(players, sound) {
  for (const p of players) {
    try {
      p.playSound(sound);
    } catch (e) {}
  }
}

const cyanMap = new MolangVariableMap();
cyanMap.setColorRGB("variable.color", { red: 0.2, green: 0.9, blue: 1.0 });
const goldMap = new MolangVariableMap();
goldMap.setColorRGB("variable.color", { red: 1.0, green: 0.78, blue: 0.2 });

function spawn(dim, loc, gold) {
  try {
    dim.spawnParticle("minecraft:colored_flame_particle", loc, gold ? goldMap : cyanMap);
  } catch (e) {}
}

function drawDome(dim, center, radius, shellCount, spin) {
  for (let i = 0; i < shellCount; i++) {
    const u = Math.random() * 2 - 1;
    const th = Math.random() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    spawn(
      dim,
      { x: center.x + radius * r * Math.cos(th), y: center.y + 1 + radius * u * 0.9, z: center.z + radius * r * Math.sin(th) },
      i % 2 === 0
    );
  }
  for (let k = 0; k < 24; k++) {
    const a = (k / 24) * Math.PI * 2 + spin;
    spawn(dim, { x: center.x + radius * Math.cos(a), y: center.y + 0.15, z: center.z + radius * Math.sin(a) }, true);
  }
  for (let k = 0; k < 12; k++) {
    const a = (k / 12) * Math.PI * 2 - spin * 1.6;
    spawn(dim, { x: center.x + radius * 0.6 * Math.cos(a), y: center.y + 0.15, z: center.z + radius * 0.6 * Math.sin(a) }, false);
  }
}

function makeRecord(entity) {
  const loc = entity.location;
  return {
    entity,
    pos: copy(loc),
    vel: velocityOf(entity),
    proj: PROJECTILES.has(entity.typeId),
    free: false,
    until: 0,
    skip: entity.typeId === "minecraft:player",
  };
}

function collect(s, center, elapsed, allowGrace) {
  let found;
  try {
    found = s.dim.getEntities({ location: center, maxDistance: RADIUS });
  } catch (e) {
    return;
  }
  for (const entity of found) {
    try {
      if (entity.id === s.casterId || s.records.has(entity.id)) continue;
      const rec = makeRecord(entity);
      if (allowGrace && rec.proj && len(sub(entity.location, center)) <= GRACE_RANGE) {
        rec.free = true;
        rec.until = elapsed + GRACE_TICKS;
      }
      s.records.set(entity.id, rec);
    } catch (e) {}
  }
}

function rampStep(rec, slow) {
  const e = rec.entity;
  if (rec.proj) {
    rec.pos = add(rec.pos, mul(rec.vel, slow));
    e.teleport(rec.pos, { keepVelocity: false });
    e.clearVelocity();
    return;
  }
  const cur = e.location;
  const next = add(rec.pos, mul(sub(cur, rec.pos), slow));
  if (len(sub(next, cur)) > 0.001) e.teleport(next, { keepVelocity: true });
  rec.pos = next;
  rec.vel = velocityOf(e);
}

function lockStep(rec) {
  const e = rec.entity;
  const cur = e.location;
  if (len(sub(cur, rec.pos)) > 0.01) e.teleport(rec.pos, { keepVelocity: false });
  e.clearVelocity();
}

function forEachRecord(s, fn) {
  for (const [id, rec] of s.records) {
    try {
      fn(rec);
    } catch (e) {
      s.records.delete(id);
    }
  }
}

function finish() {
  const s = session;
  session = null;
  let center = null;
  try {
    center = copy(s.caster.location);
  } catch (e) {}
  forEachRecord(s, (rec) => {
    if (rec.skip) return;
    rec.entity.clearVelocity();
    if (len(rec.vel) > 0.001) rec.entity.applyImpulse(rec.vel);
  });
  playFor(playersNear(s.dim, center ?? s.origin), "aln.chrono.resume");
  pulse = { dim: s.dim, center: center ?? s.origin, start: tickNow, particles: s.cfg.particles };
  cooldowns.set(s.casterId, { until: tickNow + s.cfg.cooldown * 20, total: s.cfg.cooldown * 20 });
}

function stepSession() {
  const s = session;
  let center;
  try {
    center = copy(s.caster.location);
    if (s.caster.dimension.id !== s.dim.id) throw new Error("dimension");
  } catch (e) {
    finish();
    return;
  }
  const elapsed = tickNow - s.start - 1;

  if (elapsed < RAMP_TICKS) {
    const p = (elapsed + 1) / RAMP_TICKS;
    const slow = 1 - smooth(p);
    collect(s, center, elapsed, false);
    forEachRecord(s, (rec) => rampStep(rec, slow));
    if (s.cfg.particles) drawDome(s.dim, center, DOME_RADIUS * smooth(p), 70, elapsed * 0.12);
    if (elapsed % 2 === 0) bar(s.caster, `§l§bALN §6Chrono §r§7| §fTime slowing §b${Math.round(p * 100)}%`);
    return;
  }

  const held = elapsed - RAMP_TICKS;
  if (held >= s.hold) {
    finish();
    return;
  }

  collect(s, center, elapsed, true);
  forEachRecord(s, (rec) => {
    if (rec.free) {
      if (elapsed >= rec.until) rec.free = false;
      rec.pos = copy(rec.entity.location);
      rec.vel = velocityOf(rec.entity);
      return;
    }
    lockStep(rec);
  });

  if (held % HEARTBEAT_TICKS === 0) playFor(playersNear(s.dim, center), "aln.chrono.heartbeat");
  if (s.cfg.particles) drawDome(s.dim, center, DOME_RADIUS, 22, elapsed * 0.05);
  if (held % 2 === 0) {
    const left = (s.hold - held) / 20;
    bar(s.caster, `§l§bALN §6Chrono §r§7| §bTime stopped §f${left.toFixed(1)}s §8${gauge(1 - held / s.hold, "§b", "§8")}`);
  }
}

function stepPulse() {
  const t = tickNow - pulse.start;
  if (t >= PULSE_TICKS) {
    pulse = null;
    return;
  }
  if (!pulse.particles) return;
  drawDome(pulse.dim, pulse.center, 2 + (DOME_RADIUS * 1.3 - 2) * smooth(t / PULSE_TICKS), 60, t * 0.3);
}

function findPlayer(id) {
  for (const p of world.getAllPlayers()) {
    try {
      if (p.id === id) return p;
    } catch (e) {}
  }
  return null;
}

function stepCooldowns() {
  for (const [id, cd] of cooldowns) {
    if (session && session.casterId === id) continue;
    const player = findPlayer(id);
    if (!player) {
      cooldowns.delete(id);
      continue;
    }
    const left = cd.until - tickNow;
    if (left <= 0) {
      cooldowns.delete(id);
      bar(player, "§l§bALN §6Chrono §r§7| §aReady");
      continue;
    }
    if (left % 2 === 0) {
      bar(player, `§l§bALN §6Chrono §r§7| §eRecharging §f${(left / 20).toFixed(1)}s §8${gauge(1 - left / cd.total, "§6", "§8")}`);
    }
  }
}

function activate(player) {
  if (session) {
    bar(player, "§l§bALN §6Chrono §r§7| §cTime is already stopped");
    return;
  }
  const cd = cooldowns.get(player.id);
  if (cd && cd.until > tickNow) {
    bar(player, `§l§bALN §6Chrono §r§7| §eRecharging §f${((cd.until - tickNow) / 20).toFixed(1)}s`);
    return;
  }
  const cfg = loadConfig();
  session = {
    caster: player,
    casterId: player.id,
    dim: player.dimension,
    origin: copy(player.location),
    start: tickNow,
    hold: cfg.freeze * 20,
    cfg,
    records: new Map(),
  };
  playFor(playersNear(player.dimension, player.location), "aln.chrono.submerge");
}

function ordered(options, current) {
  return [current, ...options.filter((v) => v !== current)];
}

function openSettings(player) {
  const cfg = loadConfig();
  const freezeList = ordered(FREEZE_OPTIONS, cfg.freeze);
  const coolList = ordered(COOLDOWN_OPTIONS, cfg.cooldown);
  const domeList = cfg.particles ? ["On", "Off"] : ["Off", "On"];
  const form = new ModalFormData();
  form.title("§l§6ALN §bChronoStop §r§7Settings");
  form.dropdown("Freeze Duration", freezeList.map((v, i) => (i === 0 ? `${v}s (current)` : `${v}s`)));
  form.dropdown("Cooldown Timer", coolList.map((v, i) => (i === 0 ? `${v}s (current)` : `${v}s`)));
  form.dropdown("Visual Dome Particles", domeList.map((v, i) => (i === 0 ? `${v} (current)` : v)));
  form.show(player).then((r) => {
    if (r.canceled) return;
    const [f, c, d] = r.formValues;
    const next = {
      freeze: freezeList[f] ?? cfg.freeze,
      cooldown: coolList[c] ?? cfg.cooldown,
      particles: (domeList[d] ?? domeList[0]) === "On",
    };
    saveConfig(next);
    bar(player, `§l§bALN §6Chrono §r§7| §aSaved §f${next.freeze}s §7/ §f${next.cooldown}s §7/ §f${next.particles ? "dome on" : "dome off"}`);
  }).catch(() => {});
}

world.afterEvents.itemUse.subscribe(({ source, itemStack }) => {
  const id = itemStack?.typeId;
  if (id !== CLOCK_ID && id !== WATCH_ID) return;
  if (source.isSneaking) openSettings(source);
  else activate(source);
});

system.runInterval(() => {
  tickNow++;
  if (session) stepSession();
  if (pulse) stepPulse();
  if (cooldowns.size > 0) stepCooldowns();
}, 1);
