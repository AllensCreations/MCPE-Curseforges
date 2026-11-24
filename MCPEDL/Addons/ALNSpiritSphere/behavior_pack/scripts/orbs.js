import { world } from "@minecraft/server";
import { MODES, ORB_ID, FULL_TICKS, OVER_TICKS, MAX_ORB_AGE } from "./elements.js";
import { sound, impactBurst, orbTrail, handPoint, voidSwirl } from "./visuals.js";

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

function detonate(s, at) {
  const d = s.dimension;
  const f = s.f;
  const r = (1.6 + 4.4 * f) * (s.over ? 1.25 : 1);
  const reach = r * 2.2;
  const strength = 0.8 + 2.6 * f;
  const lift = 0.35 + 0.8 * f;
  impactBurst(d, at, r, s.mode.color);
  sound(d, "random.explode", at);
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
  } else {
    explode(d, at, r * 1.1, true, false);
    shoveAll(d, at, reach, strength * 0.6, lift * 0.6);
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
  sound(s.dimension, "mob.warden.sonic_boom", at);
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

export function launchOrb(player, modeIndex, held) {
  const mode = MODES[modeIndex];
  const f = Math.min(1, held / FULL_TICKS);
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
    over: held >= OVER_TICKS,
    owner: player.id,
    age: 0,
    last: start,
    lob: f < 0.35 ? 0.035 * (1 - f / 0.35) : 0,
  });
  sound(dimension, "mob.ghast.fireball", start);
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
