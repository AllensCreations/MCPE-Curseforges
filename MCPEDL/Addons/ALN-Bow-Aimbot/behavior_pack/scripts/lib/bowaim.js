import { world, system, EntityComponentTypes, GameMode } from "@minecraft/server";
import { PLAYER_ID } from "./info.js";
import { isOn } from "./store.js";
import { tune } from "./tuning.js";
import { isFriend } from "./friends.js";

const ARROW = "minecraft:arrow";

const GRAVITY = 0.05;
const MIN_SPEED = 0.8;

const minus = (a, b) => ({ x: a.x - b.x, y: a.y - b.y, z: a.z - b.z });
const length = (v) => Math.hypot(v.x, v.y, v.z);

const NEUTRAL = new Set([
  "minecraft:wolf",
  "minecraft:enderman",
  "minecraft:zombie_pigman",
  "minecraft:piglin",
  "minecraft:iron_golem",
  "minecraft:bee",
  "minecraft:llama",
  "minecraft:trader_llama",
  "minecraft:polar_bear",
  "minecraft:dolphin",
  "minecraft:panda",
  "minecraft:goat",
]);
const IGNORED = new Set(["minecraft:armor_stand"]);

function kindOf(entity) {
  if (NEUTRAL.has(entity.typeId)) return "aimNeutral";
  return entity.matches({ families: ["monster"] }) ? "aimHostile" : "aimPassive";
}

function candidates(owner) {
  const options = { location: owner.location, maxDistance: tune(owner, "aimRange") };
  const found = [];
  if (tune(owner, "aimPlayers") === 1) {
    found.push(...owner.dimension.getPlayers({ ...options, excludeGameModes: [GameMode.Creative, GameMode.Spectator] }));
  }
  for (const entity of owner.dimension.getEntities(options)) {
    if (entity.id === owner.id || entity.typeId === PLAYER_ID || IGNORED.has(entity.typeId)) continue;
    if (!entity.getComponent(EntityComponentTypes.Health)) continue;
    const kind = kindOf(entity);
    if (tune(owner, kind) !== 1) continue;
    if (kind !== "aimHostile" && entity.getComponent(EntityComponentTypes.IsTamed)) continue;
    found.push(entity);
  }
  return found.filter((e) => e.id !== owner.id && !isFriend(owner, e));
}

function bodyPoint(entity) {
  const base = entity.location;
  const head = entity.getHeadLocation();
  return { x: base.x, y: (base.y + head.y) / 2, z: base.z };
}

function seen(owner, entity) {
  const eye = owner.getHeadLocation();
  const points = [entity.getHeadLocation(), bodyPoint(entity)];
  for (const point of points) {
    const offset = minus(point, eye);
    const distance = length(offset);
    if (distance < 0.5) return true;
    const direction = { x: offset.x / distance, y: offset.y / distance, z: offset.z / distance };
    const hit = owner.dimension.getBlockFromRay(eye, direction, {
      maxDistance: distance - 0.3,
      includeLiquidBlocks: false,
      includePassableBlocks: false,
    });
    if (!hit) return true;
  }
  return false;
}

const CIRCLE_HEIGHT = 0.2;

const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;

function circleRadius(owner) {
  const diameter = CIRCLE_HEIGHT * (tune(owner, "aimZoom") / 100);
  return diameter * Math.tan((tune(owner, "screenFov") * Math.PI) / 360);
}

export function pickTarget(owner) {
  const eye = owner.getHeadLocation();
  const view = owner.getViewDirection();
  const flat = Math.hypot(view.x, view.z);
  const right = flat < 1e-6 ? { x: 1, y: 0, z: 0 } : { x: -view.z / flat, y: 0, z: view.x / flat };
  const up = {
    x: right.y * view.z - right.z * view.y,
    y: right.z * view.x - right.x * view.z,
    z: right.x * view.y - right.y * view.x,
  };
  const radius = circleRadius(owner);
  let best;
  let bestDist = radius;
  for (const entity of candidates(owner)) {
    const points = [entity.getHeadLocation(), bodyPoint(entity)];
    let dist = Infinity;
    for (const point of points) {
      const offset = minus(point, eye);
      const depth = dot(offset, view);
      if (depth < 1) continue;
      dist = Math.min(dist, Math.hypot(dot(offset, right) / depth, dot(offset, up) / depth));
    }
    if (dist <= bestDist && seen(owner, entity)) {
      bestDist = dist;
      best = entity;
    }
  }
  return best;
}

function aimPoint(from, target, speed) {
  const body = bodyPoint(target);
  const motion = target.getVelocity();
  let wet = false;
  try {
    wet = target.isInWater;
  } catch (e) {}
  const drop = wet ? 0 : 0.5 * GRAVITY;
  let point = body;
  for (let i = 0; i < 2; i++) {
    const t = length(minus(point, from)) / speed;
    point = {
      x: body.x + motion.x * t,
      y: body.y + motion.y * t + drop * t * t,
      z: body.z + motion.z * t,
    };
  }
  return point;
}

function aim(arrow, projectile, target) {
  const speed = length(arrow.getVelocity());
  if (speed < MIN_SPEED) return false;
  const from = arrow.location;
  const direction = minus(aimPoint(from, target, speed), from);
  const size = length(direction);
  if (size < 0.001) return false;
  projectile.shoot({ x: (direction.x / size) * speed, y: (direction.y / size) * speed, z: (direction.z / size) * speed });
  return true;
}

const FOLLOW_TICKS = 80;

function steer(arrow) {
  try {
    if (!arrow.isValid) return;
    const projectile = arrow.getComponent(EntityComponentTypes.Projectile);
    const owner = projectile?.owner;
    if (!owner || owner.typeId !== PLAYER_ID || !isOn(owner, "bowAimbot")) return;
    const target = pickTarget(owner);
    if (!target || !aim(arrow, projectile, target)) return;
    let age = 0;
    const id = system.runInterval(() => {
      age += 2;
      try {
        if (age > FOLLOW_TICKS || !arrow.isValid || !target.isValid || !aim(arrow, projectile, target)) system.clearRun(id);
      } catch (e) {
        system.clearRun(id);
      }
    }, 2);
  } catch (e) {}
}

export function initBowAim() {
  world.afterEvents.entitySpawn.subscribe(({ entity }) => {
    if (entity.typeId !== ARROW) return;
    system.run(() => steer(entity));
  });
}
