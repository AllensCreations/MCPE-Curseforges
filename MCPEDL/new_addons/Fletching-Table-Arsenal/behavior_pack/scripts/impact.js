import { world, system } from "@minecraft/server";
import { RECIPES, ARROW_ID } from "./fletcher.js";

const BOW_ID = "minecraft:bow";
const PENDING_TTL = 1200;
const MAX_TRACKED = 48;
const EXPLOSION_RADIUS = 2.5;
const EXPLOSION_BREAKS_BLOCKS = false;

const FACE_NORMALS = {
  Up: { x: 0, y: 1, z: 0 },
  Down: { x: 0, y: -1, z: 0 },
  North: { x: 0, y: 0, z: -1 },
  South: { x: 0, y: 0, z: 1 },
  East: { x: 1, y: 0, z: 0 },
  West: { x: -1, y: 0, z: 0 }
};

const pending = new Map();
const tracked = new Set();

function detectLoadedArrow(player) {
  const candidates = [];
  try {
    const offhand = player.getComponent("minecraft:equippable").getEquipment("Offhand");
    if (offhand) candidates.push(offhand);
  } catch {
    candidates.length = 0;
  }
  const container = player.getComponent("minecraft:inventory").container;
  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (item) candidates.push(item);
  }
  const arrow = candidates.find((item) => item.typeId === ARROW_ID);
  if (!arrow) return undefined;
  return RECIPES.find((recipe) => recipe.itemName === arrow.nameTag);
}

function soundAt(dimension, location, id, volume = 1, pitch = 1) {
  for (const player of dimension.getPlayers({ location, maxDistance: 32 })) {
    player.playSound(id, { location, volume, pitch });
  }
}

function particlesAt(dimension, location, names, count) {
  for (let i = 0; i < count; i++) {
    const point = {
      x: location.x + (Math.random() - 0.5) * 1.2,
      y: location.y + Math.random() * 1.2,
      z: location.z + (Math.random() - 0.5) * 1.2
    };
    for (const name of names) {
      try {
        dimension.spawnParticle(name, point);
      } catch {
        continue;
      }
    }
  }
}

function offsetByFace(location, face, scale) {
  const normal = FACE_NORMALS[face] ?? FACE_NORMALS.Up;
  return { x: location.x + normal.x * scale, y: location.y + normal.y * scale, z: location.z + normal.z * scale };
}

const effects = {
  explosive({ dimension, location, source, projectile }) {
    const options = { breaksBlocks: EXPLOSION_BREAKS_BLOCKS, causesFire: false };
    if (source) options.source = source;
    dimension.createExplosion(location, EXPLOSION_RADIUS, options);
    projectile.remove();
  },

  teleport({ dimension, location, source, projectile, hitEntity, face }) {
    if (!source || source.typeId !== "minecraft:player") return;
    const origin = source.location;
    const originDimension = source.dimension;
    let destination = hitEntity ? hitEntity.location : offsetByFace(location, face, face === "Down" ? 1.9 : 0.6);
    source.teleport(destination, { dimension });
    particlesAt(originDimension, origin, ["minecraft:endrod", "minecraft:villager_happy"], 14);
    particlesAt(dimension, destination, ["minecraft:endrod", "minecraft:villager_happy"], 14);
    soundAt(originDimension, origin, "mob.endermen.portal", 0.8, 1);
    soundAt(dimension, destination, "mob.endermen.portal", 0.8, 1.2);
    projectile.remove();
  },

  frost({ dimension, location, hitEntity }) {
    if (hitEntity) {
      hitEntity.addEffect("slowness", 160, { amplifier: 3 });
      hitEntity.addEffect("weakness", 160, { amplifier: 0 });
      hitEntity.extinguishFire();
    }
    particlesAt(dimension, location, ["minecraft:ice_evaporation_emitter", "minecraft:critical_hit_emitter"], 12);
    soundAt(dimension, location, "random.glass", 0.8, 1.4);
  },

  incendiary({ dimension, location, hitEntity, block, face }) {
    if (hitEntity) {
      hitEntity.setOnFire(8, true);
    } else if (block) {
      const normal = FACE_NORMALS[face] ?? FACE_NORMALS.Up;
      const target = block.offset(normal);
      if (target && target.typeId === "minecraft:air") target.setType("minecraft:fire");
    }
    particlesAt(dimension, location, ["minecraft:basic_flame_particle", "minecraft:lava_particle"], 12);
    soundAt(dimension, location, "fire.ignite", 1, 1);
  }
};

function handleHit(event, hitEntity, blockHit) {
  const projectile = event.projectile;
  const recipe = RECIPES.find((entry) => projectile.hasTag(entry.tag));
  if (!recipe) return;
  projectile.removeTag(recipe.tag);
  tracked.delete(projectile);
  effects[recipe.key]({
    dimension: event.dimension,
    location: event.location,
    source: event.source,
    projectile,
    hitEntity,
    block: blockHit?.block,
    face: blockHit?.face
  });
}

export function registerImpactSystem() {
  world.afterEvents.itemStartUse.subscribe((event) => {
    const player = event.source;
    if (player.typeId !== "minecraft:player" || event.itemStack?.typeId !== BOW_ID) return;
    const recipe = detectLoadedArrow(player);
    if (recipe) pending.set(player.id, { recipe, tick: system.currentTick });
    else pending.delete(player.id);
  });

  world.afterEvents.entitySpawn.subscribe((event) => {
    const arrow = event.entity;
    if (arrow.typeId !== ARROW_ID || pending.size === 0) return;
    let best;
    let bestDistance = 5;
    for (const player of arrow.dimension.getPlayers({ location: arrow.location, maxDistance: 5 })) {
      const entry = pending.get(player.id);
      if (!entry || system.currentTick - entry.tick > PENDING_TTL) continue;
      const dx = player.location.x - arrow.location.x;
      const dy = player.location.y - arrow.location.y;
      const dz = player.location.z - arrow.location.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
      if (distance < bestDistance) {
        bestDistance = distance;
        best = { id: player.id, recipe: entry.recipe };
      }
    }
    if (!best) return;
    pending.delete(best.id);
    arrow.addTag(best.recipe.tag);
    if (tracked.size < MAX_TRACKED) tracked.add(arrow);
  });

  world.afterEvents.projectileHitEntity.subscribe((event) => {
    try {
      handleHit(event, event.getEntityHit()?.entity, undefined);
    } catch (error) {
      console.warn(`[Fletching Table Arsenal] ${error}`);
    }
  });

  world.afterEvents.projectileHitBlock.subscribe((event) => {
    try {
      handleHit(event, undefined, event.getBlockHit());
    } catch (error) {
      console.warn(`[Fletching Table Arsenal] ${error}`);
    }
  });

  system.runInterval(() => {
    for (const arrow of tracked) {
      try {
        const recipe = RECIPES.find((entry) => arrow.hasTag(entry.tag));
        if (!recipe) {
          tracked.delete(arrow);
          continue;
        }
        arrow.dimension.spawnParticle(recipe.particles[0], arrow.location);
      } catch {
        tracked.delete(arrow);
      }
    }
  }, 2);

  world.afterEvents.playerLeave.subscribe((event) => pending.delete(event.playerId));
}
