import { world, system, EntityDamageCause, GameMode } from "@minecraft/server";
import { isOn, anyOn } from "./store.js";
import { tune } from "./tuning.js";
import { isFriend } from "./friends.js";

const MIN_FALL = 3;
const WATER_LIFETIME = 40;
const falls = new Map();

const dist = (a, e) => Math.hypot(e.location.x - a.x, e.location.y - a.y, e.location.z - a.z);
const skip = (p) => p.getGameMode() === GameMode.Creative || p.getGameMode() === GameMode.Spectator;

function aura(p) {
  const opts = { location: p.location, maxDistance: tune(p, "auraRange") };
  const found = new Map();
  const mobs = p.dimension.getEntities({ ...opts, families: ["monster"] });
  const foes = p.dimension.getPlayers({ ...opts, excludeGameModes: [GameMode.Creative, GameMode.Spectator] });
  for (const e of [...mobs, ...foes]) if (e.id !== p.id && !isFriend(p, e)) found.set(e.id, e);
  [...found.values()]
    .sort((a, b) => dist(p.location, a) - dist(p.location, b))
    .slice(0, tune(p, "auraTargets"))
    .forEach((t) => t.applyDamage(tune(p, "auraDamage"), { cause: EntityDamageCause.entityAttack, damagingEntity: p }));
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
  spot.setType("minecraft:water");
  falls.delete(p.id);
  const dim = p.dimension;
  const at = spot.location;
  system.runTimeout(() => {
    const b = dim.getBlock(at);
    if (b?.typeId === "minecraft:water") b.setType("minecraft:air");
  }, WATER_LIFETIME);
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
  world.afterEvents.playerLeave.subscribe(({ playerId }) => falls.delete(playerId));
}
