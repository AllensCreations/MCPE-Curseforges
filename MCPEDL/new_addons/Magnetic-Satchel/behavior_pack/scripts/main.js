import { world, system, EquipmentSlot } from "@minecraft/server";

const SATCHEL_ID = "custom:magnetic_satchel";
const PROP_KEY = "magnetic_satchel:enabled";

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
  maxParticlesPerPlayer: 4,
  toggleCooldown: 10
};

const states = new Map();
const lastToggle = new Map();
let cycle = 0;

function isEnabled(player) {
  if (states.has(player.id)) return states.get(player.id);
  let enabled = true;
  try {
    enabled = player.getDynamicProperty(PROP_KEY) !== false;
  } catch (e) {}
  states.set(player.id, enabled);
  return enabled;
}

function setEnabled(player, enabled) {
  states.set(player.id, enabled);
  try {
    player.setDynamicProperty(PROP_KEY, enabled);
  } catch (e) {}
}

function slotItemId(player, slot) {
  const equippable = player.getComponent("minecraft:equippable");
  if (!equippable) return undefined;
  const item = equippable.getEquipment(slot);
  return item ? item.typeId : undefined;
}

function pullItems(player, withParticles) {
  const dimension = player.dimension;
  const origin = player.location;
  const target = { x: origin.x, y: origin.y + CONFIG.chestOffset, z: origin.z };
  let items;
  try {
    items = dimension.getEntities({
      location: origin,
      maxDistance: CONFIG.radius,
      type: "minecraft:item"
    });
  } catch (e) {
    return;
  }
  let pulled = 0;
  let particles = 0;
  for (const item of items) {
    if (pulled >= CONFIG.maxItemsPerPlayer) break;
    let loc;
    try {
      loc = item.location;
    } catch (e) {
      continue;
    }
    const dx = target.x - loc.x;
    const dy = target.y - loc.y;
    const dz = target.z - loc.z;
    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
    if (dist < CONFIG.minDistance) continue;
    const strength = Math.min(CONFIG.maxStrength, CONFIG.baseStrength + dist * CONFIG.distanceStrength);
    try {
      item.applyImpulse({
        x: (dx / dist) * strength,
        y: (dy / dist) * strength,
        z: (dz / dist) * strength
      });
    } catch (e) {
      continue;
    }
    pulled++;
    if (withParticles && particles < CONFIG.maxParticlesPerPlayer) {
      particles++;
      try {
        dimension.spawnParticle("minecraft:basic_smoke_particle", loc);
      } catch (e) {}
    }
  }
}

system.runInterval(() => {
  cycle++;
  const withParticles = cycle % CONFIG.particleEvery === 0;
  for (const player of world.getAllPlayers()) {
    try {
      if (slotItemId(player, EquipmentSlot.Offhand) !== SATCHEL_ID) continue;
      if (!isEnabled(player)) continue;
      pullItems(player, withParticles);
    } catch (e) {}
  }
}, CONFIG.interval);

world.afterEvents.itemUse.subscribe((event) => {
  const player = event.source;
  const stack = event.itemStack;
  if (!stack || stack.typeId !== SATCHEL_ID) return;
  if (!player.isSneaking) return;
  try {
    if (slotItemId(player, EquipmentSlot.Mainhand) !== SATCHEL_ID) return;
    const now = system.currentTick;
    const last = lastToggle.get(player.id);
    if (last !== undefined && now - last < CONFIG.toggleCooldown) return;
    lastToggle.set(player.id, now);
    const next = !isEnabled(player);
    setEnabled(player, next);
    player.onScreenDisplay.setActionBar(
      next ? "§6[SATCHEL] §aMagnetism: ACTIVE" : "§6[SATCHEL] §cMagnetism: DISABLED"
    );
  } catch (e) {}
});

world.afterEvents.playerLeave.subscribe((event) => {
  states.delete(event.playerId);
  lastToggle.delete(event.playerId);
});
