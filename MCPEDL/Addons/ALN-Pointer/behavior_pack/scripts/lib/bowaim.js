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

function candidates(owner) {
  const options = { location: owner.location, maxDistance: tune(owner, "aimRange") };
  const mobs = owner.dimension.getEntities({ ...options, families: ["monster"] });
  const players = owner.dimension.getPlayers({ ...options, excludeGameModes: [GameMode.Creative, GameMode.Spectator] });
  return [...mobs, ...players].filter((e) => e.id !== owner.id && !isFriend(owner, e));
}

function seen(owner, entity) {
  const eye = owner.getHeadLocation();
  const base = entity.location;
  const points = [entity.getHeadLocation(), { x: base.x, y: base.y + 0.6, z: base.z }];
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

// The aim circle is CIRCLE_HEIGHT of the screen height at 100% zoom.
// Keep this equal to the circle size in resource_pack/ui/hud_screen.json (20%).
const CIRCLE_HEIGHT = 0.2;

const dot = (a, b) => a.x * b.x + a.y * b.y + a.z * b.z;

// Circle radius in "screen units" (offset from the crosshair divided by depth).
// Half the screen height equals tan(FOV / 2), so the circle radius is its height fraction times that.
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
    const base = entity.location;
    const points = [entity.getHeadLocation(), { x: base.x, y: base.y + 0.6, z: base.z }];
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
  const head = target.getHeadLocation();
  const motion = target.getVelocity();
  let point = head;
  for (let i = 0; i < 2; i++) {
    const t = length(minus(point, from)) / speed;
    point = {
      x: head.x + motion.x * t,
      y: head.y + motion.y * t + 0.5 * GRAVITY * t * t,
      z: head.z + motion.z * t,
    };
  }
  return point;
}

function steer(arrow) {
  try {
    if (!arrow.isValid) return;
    const projectile = arrow.getComponent(EntityComponentTypes.Projectile);
    const owner = projectile?.owner;
    if (!owner || owner.typeId !== PLAYER_ID || !isOn(owner, "bowAimbot")) return;
    const speed = length(arrow.getVelocity());
    if (speed < MIN_SPEED) return;
    const target = pickTarget(owner);
    if (!target) return;
    const from = arrow.location;
    const direction = minus(aimPoint(from, target, speed), from);
    const size = length(direction);
    if (size < 0.001) return;
    projectile.shoot({ x: (direction.x / size) * speed, y: (direction.y / size) * speed, z: (direction.z / size) * speed });
  } catch (e) {}
}

export function initBowAim() {
  world.afterEvents.entitySpawn.subscribe(({ entity }) => {
    if (entity.typeId !== ARROW) return;
    system.run(() => steer(entity));
  });
}
