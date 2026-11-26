import { world } from "@minecraft/server";
import { MODES, ORB_ID, FULL_TICKS, OVER_TICKS, MAX_ORB_AGE, powerOf } from "./elements.js";
import { sound, impactBurst, orbTrail, handPoint, voidSwirl, basisOf } from "./visuals.js";

const orbs = new Map();
const PLAYER_ID = "minecraft:player";

function nearby(dimension, at, distance) {
  try {
    return dimension.getEntities({ location: at, maxDistance: distance });
  } catch (e) {
    return [];
  }
}

function explode(dimension, at, radius, breaks, fire) {
  try {
    dimension.createExplosion(at, radius, { breaksBlocks: breaks, causesFire: fire, allowUnderwater: true });
  } catch (e) {}
}

function shove(entity, from, strength, lift) {
  try {
    const l = entity.location;
    const dx = l.x - from.x;
    const dz = l.z - from.z;
    const d = Math.hypot(dx, dz) || 1;
    entity.applyKnockback({ x: (dx / d) * strength, z: (dz / d) * strength }, lift);
  } catch (e) {}
}

function shoveAll(dimension, at, reach, strength, lift) {
  for (const e of nearby(dimension, at, reach)) {
    if (e.typeId === ORB_ID) continue;
    try {
      const l = e.location;
      const d = Math.hypot(l.x - at.x, l.y - at.y, l.z - at.z);
      const falloff = Math.max(0.15, 1 - d / reach);
      shove(e, at, strength * falloff, lift * falloff);
    } catch (err) {}
  }
}

function freeze(dimension, at, radius) {
  const R = Math.min(7, Math.ceil(radius));
  const bx = Math.floor(at.x);
  const by = Math.floor(at.y);
  const bz = Math.floor(at.z);
  for (let dx = -R; dx <= R; dx++) {
    for (let dy = -R; dy <= R; dy++) {
      for (let dz = -R; dz <= R; dz++) {
        if (dx * dx + dy * dy + dz * dz > R * R) continue;
        const p = { x: bx + dx, y: by + dy, z: bz + dz };
        try {
          const b = dimension.getBlock(p);
          if (b && (b.typeId === "minecraft:water" || b.typeId === "minecraft:flowing_water")) {
            dimension.setBlockType(p, "minecraft:ice");
          }
        } catch (e) {}
      }
    }
  }
}

function affect(dimension, at, distance, effectId, ticks, amplifier) {
  for (const e of nearby(dimension, at, distance)) {
    try {
      if (e.typeId !== ORB_ID) e.addEffect(effectId, ticks, { amplifier });
    } catch (err) {}
  }
}

function detonate(s, at) {
  const d = s.dimension;
  const f = s.f;
  const r = (1.6 + 4.4 * f) * (s.over ? 1.25 : 1);
  const reach = r * 2.2;
  const strength = 0.8 + 2.6 * f;
  const lift = 0.35 + 0.8 * f;
  impactBurst(d, at, r, s.mode.color);
  sound(d, `${s.mode.sfx}.impact`, at);
  if (s.mode.id === "aero") {
    explode(d, at, r, true, false);
    shoveAll(d, at, reach, strength * 1.6, lift * 1.3);
  } else if (s.mode.id === "blaze") {
    explode(d, at, r * 0.9, true, true);
    for (const e of nearby(d, at, r * 1.5)) {
      try {
        if (e.typeId !== ORB_ID) e.setOnFire(6, true);
      } catch (err) {}
    }
    shoveAll(d, at, reach, strength * 0.8, lift);
  } else if (s.mode.id === "frost") {
    explode(d, at, r * 0.6, false, false);
    freeze(d, at, r * 1.2);
    for (const e of nearby(d, at, r * 1.6)) {
      try {
        if (e.typeId !== ORB_ID) e.addEffect("slowness", 160 + Math.round(160 * f), { amplifier: 3 });
      } catch (err) {}
    }
    shoveAll(d, at, reach, strength * 0.5, lift * 0.5);
  } else if (s.mode.id === "storm") {
    explode(d, at, r * 0.7, true, false);
    try {
      d.spawnEntity("minecraft:lightning_bolt", at);
    } catch (e) {}
    shoveAll(d, at, reach, strength, lift);
  } else if (s.mode.id === "void") {
    explode(d, at, r * 1.1, true, false);
    shoveAll(d, at, reach, strength * 0.6, lift * 0.6);
  } else if (s.mode.id === "terra") {
    explode(d, at, r * 1.2, true, false);
    shoveAll(d, at, reach, strength * 0.4, lift * 2.2);
    affect(d, at, r * 1.8, "slowness", 80, 1);
  } else if (s.mode.id === "toxic") {
    explode(d, at, r * 0.5, false, false);
    affect(d, at, r * 2, "poison", 200 + Math.round(200 * f), 1);
    shoveAll(d, at, reach, strength * 0.3, lift * 0.4);
  } else if (s.mode.id === "gravity") {
    explode(d, at, r * 0.4, false, false);
    affect(d, at, r * 2.2, "levitation", 60 + Math.round(80 * f), 1);
  } else if (s.mode.id === "life") {
    affect(d, at, r * 2, "regeneration", 120 + Math.round(120 * f), 2);
  } else {
    explode(d, at, r * 0.4, false, false);
    affect(d, at, r * 2, "slowness", 80 + Math.round(80 * f), 6);
  }
}

const VOID_PULL_RADIUS = 10;
const VOID_HOLD_TICKS = 100;
const anchors = new Map();

function pull(a) {
  let found;
  try {
    found = a.dimension.getEntities({ location: a.at, maxDistance: VOID_PULL_RADIUS, families: ["mob"] });
  } catch (e) {
    return;
  }
  for (const e of found) {
    if (e.id === a.owner || e.typeId === PLAYER_ID || e.typeId === ORB_ID) continue;
    try {
      const l = e.location;
      const dx = a.at.x - l.x;
      const dy = a.at.y - l.y;
      const dz = a.at.z - l.z;
      const d = Math.hypot(dx, dy, dz) || 1;
      const k = (0.16 + 0.1 * a.f) * Math.min(1, d / 2.5);
      e.applyImpulse({ x: (dx / d) * k, y: (dy / d) * k + 0.03, z: (dz / d) * k });
    } catch (err) {}
  }
}

function anchorOrb(id, s, at) {
  anchors.set(id, {
    dimension: s.dimension,
    mode: s.mode,
    f: s.f,
    over: s.over,
    owner: s.owner,
    at: { x: at.x, y: at.y + 0.5, z: at.z },
    age: 0,
  });
  sound(s.dimension, `${s.mode.sfx}.burst`, at);
}

function tickAnchors() {
  for (const [id, a] of anchors) {
    a.age++;
    try {
      voidSwirl(a.dimension, a.at, VOID_PULL_RADIUS, a.mode.color, a.age);
      pull(a);
      if (a.age >= VOID_HOLD_TICKS) {
        anchors.delete(id);
        detonate(a, a.at);
      }
    } catch (e) {
      anchors.delete(id);
    }
  }
}

const PATHS = {
  aero: { kind: "spiral", w: 0.8, k: 0.384 },
  blaze: { kind: "arc", g: 0.012, up: 0 },
  frost: { kind: "arc", g: 0.045, up: 0.3 },
  storm: { kind: "zigzag", w: 0.9, k: 0.7 },
  void: { kind: "home", k: 0.1, range: 16 },
  terra: { kind: "arc", g: 0.06, up: 0.35 },
  toxic: { kind: "wobble", k: 0.06 },
  gravity: { kind: "curve", k: 0.025 },
  life: { kind: "seek", k: 0.12, range: 24 },
  chrono: { kind: "accel", k: 0.03, ticks: 40 },
};

function startPath(orb, id, view, f) {
  const cfg = PATHS[id];
  if (!cfg) return null;
  const { right, up } = basisOf(view);
  const p = { ...cfg, view, right, up, t: 0, side: Math.random() < 0.5 ? -1 : 1 };
  try {
    if (cfg.kind === "spiral") {
      const ur = cfg.k / 2;
      const uu = -cfg.k / 2 / Math.tan(cfg.w / 2);
      orb.applyImpulse({ x: right.x * ur + up.x * uu, y: right.y * ur + up.y * uu, z: right.z * ur + up.z * uu });
    } else if (cfg.kind === "zigzag") {
      orb.applyImpulse({ x: right.x * (cfg.k / 2), y: 0, z: right.z * (cfg.k / 2) });
    } else if (cfg.kind === "arc" && cfg.up > 0) {
      orb.applyImpulse({ x: 0, y: cfg.up, z: 0 });
    }
  } catch (e) {}
  if (cfg.kind === "accel") p.k = cfg.k + 0.03 * f;
  return p;
}

function homeIn(s, p, loc) {
  let found;
  try {
    found = s.dimension.getEntities(
      p.kind === "seek"
        ? { location: loc, maxDistance: p.range, type: PLAYER_ID }
        : { location: loc, maxDistance: p.range, families: ["mob"] }
    );
  } catch (e) {
    return;
  }
  let best = null;
  let bestD = Infinity;
  for (const e of found) {
    if (e.id === s.owner || e.typeId === ORB_ID) continue;
    if (p.kind === "home" && e.typeId === PLAYER_ID) continue;
    try {
      const l = e.location;
      const d = Math.hypot(l.x - loc.x, l.y + 1 - loc.y, l.z - loc.z);
      if (d < bestD) {
        best = l;
        bestD = d;
      }
    } catch (err) {}
  }
  if (!best || bestD < 0.01) return;
  s.orb.applyImpulse({
    x: ((best.x - loc.x) / bestD) * p.k,
    y: ((best.y + 1 - loc.y) / bestD) * p.k,
    z: ((best.z - loc.z) / bestD) * p.k,
  });
}

function steerOrb(s, loc) {
  const p = s.path;
  if (!p) return;
  p.t++;
  const o = s.orb;
  if (p.kind === "spiral") {
    const c = Math.cos(p.w * p.t) * p.k;
    const n = Math.sin(p.w * p.t) * p.k;
    o.applyImpulse({ x: p.right.x * c + p.up.x * n, y: p.right.y * c + p.up.y * n, z: p.right.z * c + p.up.z * n });
  } else if (p.kind === "zigzag") {
    const c = Math.cos(p.w * p.t) * p.k;
    o.applyImpulse({ x: p.right.x * c, y: 0, z: p.right.z * c });
  } else if (p.kind === "arc") {
    o.applyImpulse({ x: 0, y: -p.g, z: 0 });
  } else if (p.kind === "wobble") {
    const a = (Math.random() * 2 - 1) * p.k;
    const b = (Math.random() * 2 - 1) * p.k;
    o.applyImpulse({ x: p.right.x * a + p.up.x * b, y: p.right.y * a + p.up.y * b, z: p.right.z * a + p.up.z * b });
  } else if (p.kind === "curve") {
    const c = p.k * p.side;
    o.applyImpulse({ x: p.right.x * c, y: 0, z: p.right.z * c });
  } else if (p.kind === "accel") {
    if (p.t <= p.ticks) o.applyImpulse({ x: p.view.x * p.k, y: p.view.y * p.k, z: p.view.z * p.k });
  } else {
    homeIn(s, p, loc);
  }
}

export function launchOrb(player, modeIndex, held) {
  const mode = MODES[modeIndex];
  const f = powerOf(held);
  const dimension = player.dimension;
  const view = player.getViewDirection();
  const start = handPoint(player, view);
  const orb = dimension.spawnEntity(ORB_ID, start);
  const speed = (0.55 + 2.45 * f) * mode.speed;
  orb.applyImpulse({ x: view.x * speed, y: view.y * speed, z: view.z * speed });
  orbs.set(orb.id, {
    orb,
    dimension,
    mode,
    f,
    over: held >= FULL_TICKS && held <= OVER_TICKS,
    owner: player.id,
    age: 0,
    last: start,
    lob: f < 0.35 ? 0.035 * (1 - f / 0.35) : 0,
    path: startPath(orb, mode.id, view, f),
  });
  sound(dimension, `${mode.sfx}.launch`, start);
}

export function tickOrbs() {
  tickAnchors();
  for (const [id, s] of orbs) {
    try {
      const loc = s.orb.location;
      s.last = loc;
      s.age++;
      orbTrail(s.dimension, loc, s.mode.color, s.age);
      if (s.lob > 0) s.orb.applyImpulse({ x: 0, y: -s.lob, z: 0 });
      steerOrb(s, loc);
      if (s.age > MAX_ORB_AGE) {
        orbs.delete(id);
        if (s.mode.id === "void") anchorOrb(id, s, loc);
        else detonate(s, loc);
        s.orb.kill();
      }
    } catch (e) {
      orbs.delete(id);
    }
  }
}

function onHit(projectile, location) {
  let id;
  try {
    id = projectile.id;
  } catch (e) {
    return;
  }
  const s = orbs.get(id);
  if (!s) return;
  orbs.delete(id);
  const at = location ?? s.last;
  if (s.mode.id === "void") anchorOrb(id, s, at);
  else detonate(s, at);
  try {
    projectile.kill();
  } catch (e) {}
}

export function registerHits() {
  world.afterEvents.projectileHitBlock.subscribe((ev) => onHit(ev.projectile, ev.location));
  world.afterEvents.projectileHitEntity.subscribe((ev) => onHit(ev.projectile, ev.location));
}
