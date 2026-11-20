import { world, system, EntityDamageCause, GameMode } from "@minecraft/server";
import { isOn, anyOn } from "./store.js";
import { tune } from "./tuning.js";
import { isFriend } from "./friends.js";

const MIN_FALL = 3;
const WATER_LIFETIME = 40;
const falls = new Map();
const safeSpot = new Map();

const dist = (a, e) => Math.hypot(e.location.x - a.x, e.location.y - a.y, e.location.z - a.z);
const skip = (p) => p.getGameMode() === GameMode.Creative || p.getGameMode() === GameMode.Spectator;

function face(p, t) {
  const from = p.getHeadLocation();
  const to = t.getHeadLocation();
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const dz = to.z - from.z;
  p.setRotation({ x: (-Math.atan2(dy, Math.hypot(dx, dz)) * 180) / Math.PI, y: (Math.atan2(-dx, dz) * 180) / Math.PI });
  p.playSound("game.player.attack.strong");
}

function aura(p) {
  const opts = { location: p.location, maxDistance: tune(p, "auraRange") };
  const found = new Map();
  const mode = tune(p, "auraTarget");
  const mobs = mode === 2 ? [] : p.dimension.getEntities({ ...opts, families: ["monster"] });
  const foes = mode === 1 ? [] : p.dimension.getPlayers({ ...opts, excludeGameModes: [GameMode.Creative, GameMode.Spectator] });
  for (const e of [...mobs, ...foes]) if (e.id !== p.id && !isFriend(p, e)) found.set(e.id, e);
  [...found.values()]
    .sort((a, b) => dist(p.location, a) - dist(p.location, b))
    .slice(0, tune(p, "auraTargets"))
    .forEach((t, i) => {
      if (i === 0 && tune(p, "auraFace") === 1) face(p, t);
      t.applyDamage(tune(p, "auraDamage"), { cause: EntityDamageCause.entityAttack, damagingEntity: p });
    });
}

const WATERS = new Set(["minecraft:water", "minecraft:flowing_water"]);

function drop(p, spot) {
  const dim = p.dimension;
  const owned = [];
  for (let dx = -1; dx <= 1; dx++) {
    for (let dy = -1; dy <= 1; dy++) {
      for (let dz = -1; dz <= 1; dz++) {
        const b = dim.getBlock({ x: spot.x + dx, y: spot.y + dy, z: spot.z + dz });
        if (b?.isAir) owned.push(b.location);
      }
    }
  }
  spot.setType("minecraft:water");
  let age = 0;
  const id = system.runInterval(() => {
    age += 2;
    let done = age >= WATER_LIFETIME;
    try {
      if (!done) done = !p.isValid || (age >= 6 && (p.isOnGround || p.getVelocity().y > -0.1));
    } catch (e) {
      done = true;
    }
    if (!done) return;
    system.clearRun(id);
    for (const at of owned) {
      const b = dim.getBlock(at);
      if (b && WATERS.has(b.typeId)) b.setType("minecraft:air");
    }
  }, 2);
}

function clutch(p) {
  if (skip(p) || p.isOnGround || !p.isFalling || p.isGliding || p.isFlying || p.isInWater) {
    falls.delete(p.id);
    return;
  }
  const y = p.location.y;
  const peak = Math.max(falls.get(p.id) ?? y, y);
  falls.set(p.id, peak);
  const vy = p.getVelocity().y;
  if (peak - y < MIN_FALL || vy > -0.2) return;
  const hit = p.dimension.getBlockFromRay(p.location, { x: 0, y: -1, z: 0 }, {
    maxDistance: Math.max(4, -vy * 3),
    includeLiquidBlocks: false,
    includePassableBlocks: false,
  });
  const spot = hit?.block.above();
  if (!spot?.isAir) return;
  falls.delete(p.id);
  drop(p, spot);
}

function immortal(p) {
  const dim = p.dimension;
  const at = p.location;
  const bottom = dim.heightRange.min;
  if (p.isOnGround && at.y > bottom + 4) {
    safeSpot.set(p.id, { x: at.x, y: at.y, z: at.z, dim });
    return;
  }
  const last = safeSpot.get(p.id);
  if (at.y < bottom - 4 && last && last.dim.id === dim.id) p.teleport({ x: last.x, y: last.y, z: last.z }, { dimension: dim });
}

function each(id, fn) {
  if (!anyOn(id)) return;
  for (const p of world.getAllPlayers()) {
    if (!p.isValid || !isOn(p, id)) continue;
    try {
      fn(p);
    } catch (e) {}
  }
}

export function initLoops() {
  system.runInterval(() => each("aura", (p) => p.getGameMode() !== GameMode.Spectator && aura(p)), 10);
  system.runInterval(() => each("waterClutch", clutch), 2);
  system.runInterval(() => each("immortal", immortal), 4);
  world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    falls.delete(playerId);
    safeSpot.delete(playerId);
  });
}
