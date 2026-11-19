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

function pickTarget(owner) {
  const eye = owner.getHeadLocation();
  const view = owner.getViewDirection();
  let best;
  let bestCos = Math.cos((tune(owner, "aimCone") * Math.PI) / 180);
  for (const entity of candidates(owner)) {
    const offset = minus(entity.getHeadLocation(), eye);
    const distance = length(offset);
    if (distance < 1) continue;
    const cos = (view.x * offset.x + view.y * offset.y + view.z * offset.z) / distance;
    if (cos > bestCos) {
      bestCos = cos;
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
