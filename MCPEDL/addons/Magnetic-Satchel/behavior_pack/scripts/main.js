import { world, system, EquipmentSlot } from "@minecraft/server";

const SATCHEL_ID = "custom:magnetic_satchel";

const CONFIG = {
  interval: 2,
  radius: 8,
  chestOffset: 0.5,
  minDistance: 1.0,
  baseStrength: 0.04,
  distanceStrength: 0.01,
  maxStrength: 0.12,
  maxItemsPerPlayer: 48,
  particleEvery: 3,
  maxParticlesPerPlayer: 4
};

let cycle = 0;

function hasSatchelEquipped(player) {
  try {
    const equippable = player.getComponent("minecraft:equippable");
    if (!equippable) return false;

    const mainhand = equippable.getEquipment(EquipmentSlot.Mainhand);
    const offhand = equippable.getEquipment(EquipmentSlot.Offhand);

    return (
      mainhand?.typeId === SATCHEL_ID ||
      offhand?.typeId === SATCHEL_ID
    );
  } catch {
    return false;
  }
}

function pullItems(player, withParticles) {
  let dimension;
  let origin;

  try {
    dimension = player.dimension;
    origin = player.location;
  } catch {
    return;
  }

  const target = {
    x: origin.x,
    y: origin.y + CONFIG.chestOffset,
    z: origin.z
  };

  let items;

  try {
    items = dimension.getEntities({
      location: origin,
      maxDistance: CONFIG.radius,
      type: "minecraft:item"
    });
  } catch {
    return;
  }

  let pulled = 0;
  let particles = 0;

  for (const item of items) {
    if (pulled >= CONFIG.maxItemsPerPlayer) break;

    try {
      const loc = item.location;

      const dx = target.x - loc.x;
      const dy = target.y - loc.y;
      const dz = target.z - loc.z;

      const distanceSquared =
        dx * dx +
        dy * dy +
        dz * dz;

      if (
        distanceSquared <
        CONFIG.minDistance * CONFIG.minDistance
      ) {
        continue;
      }

      const distance = Math.sqrt(distanceSquared);

      if (distance === 0) continue;

      const strength = Math.min(
        CONFIG.maxStrength,
        CONFIG.baseStrength +
          distance * CONFIG.distanceStrength
      );

      item.applyImpulse({
        x: (dx / distance) * strength,
        y: (dy / distance) * strength,
        z: (dz / distance) * strength
      });

      pulled++;

      if (
        withParticles &&
        particles < CONFIG.maxParticlesPerPlayer
      ) {
        try {
          dimension.spawnParticle(
            "minecraft:basic_smoke_particle",
            loc
          );

          particles++;
        } catch {
          // Particle effects are optional.
        }
      }
    } catch {
      // Skip invalid or despawned items.
      continue;
    }
  }
}

system.runInterval(() => {
  cycle++;

  const withParticles =
    cycle % CONFIG.particleEvery === 0;

  for (const player of world.getAllPlayers()) {
    try {
      if (!hasSatchelEquipped(player)) continue;

      pullItems(player, withParticles);
    } catch {
      // Skip players that are temporarily unavailable.
    }
  }
}, CONFIG.interval);
