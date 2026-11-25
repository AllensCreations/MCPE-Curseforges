import { world, system, ItemComponentTypes, EntityInventoryComponent } from "@minecraft/server";
import { GATE_ID, SCROLL_ID, WARP_TICKS, PARTICLE_STEP, SOUND } from "./config.js";
import { removeGateAt } from "./registry.js";

const active = new Set();

export function isWarping(player) {
  return active.has(player.id);
}

export function gateStillStands(gate) {
  try {
    const block = world.getDimension(gate.d).getBlock({ x: gate.x, y: gate.y, z: gate.z });
    if (block && block.typeId !== GATE_ID) {
      removeGateAt(gate.d, gate.x, gate.y, gate.z);
      return false;
    }
  } catch {
    return true;
  }
  return true;
}

function tell(player, text) {
  try {
    player.sendMessage(text);
  } catch {
    return;
  }
}

function findScroll(player) {
  const inventory = player.getComponent(EntityInventoryComponent.componentId);
  if (!inventory) return { slot: -1 };
  const container = inventory.container;
  const selected = player.selectedSlotIndex;
  const order = [selected];
  for (let i = 0; i < 36; i++) if (i !== selected) order.push(i);
  for (const i of order) {
    try {
      const item = container.getItem(i);
      if (item && item.typeId === SCROLL_ID) return { slot: i, container };
    } catch {
      if (i !== selected) break;
    }
  }
  return { slot: -1 };
}

function landingSpot(dimension, gate) {
  const fallback = { x: gate.x + 0.5, y: gate.y + 1, z: gate.z + 0.5 };
  for (let dy = 1; dy <= 4; dy++) {
    try {
      const feet = dimension.getBlock({ x: gate.x, y: gate.y + dy, z: gate.z });
      const head = dimension.getBlock({ x: gate.x, y: gate.y + dy + 1, z: gate.z });
      if ((!feet || feet.isAir) && (!head || head.isAir)) {
        return { x: gate.x + 0.5, y: gate.y + dy, z: gate.z + 0.5 };
      }
    } catch {
      return fallback;
    }
  }
  return fallback;
}

function spawn(dimension, id, location) {
  try {
    dimension.spawnParticle(id, location);
  } catch {
    return;
  }
}

function chargeParticles(player, tick) {
  const dimension = player.dimension;
  const base = player.location;
  const progress = tick / WARP_TICKS;
  const radius = 1.5 - progress * 0.9;
  for (let k = 0; k < 3; k++) {
    const angle = tick * 0.4 + (k * Math.PI * 2) / 3;
    spawn(dimension, "minecraft:basic_portal_particle", {
      x: base.x + Math.cos(angle) * radius,
      y: base.y + 0.2 + progress * 1.7,
      z: base.z + Math.sin(angle) * radius,
    });
  }
  spawn(dimension, "minecraft:endrod", { x: base.x, y: base.y + 0.3 + progress * 1.6, z: base.z });
}

export function arrivalBurst(dimension, at) {
  for (let i = 0; i < 30; i++) {
    const angle = (i / 30) * Math.PI * 2;
    const radius = 0.4 + (i % 4) * 0.25;
    const point = {
      x: at.x + Math.cos(angle) * radius,
      y: at.y + 0.2 + (i % 7) * 0.28,
      z: at.z + Math.sin(angle) * radius,
    };
    spawn(dimension, "minecraft:basic_portal_particle", point);
    if (i % 3 === 0) spawn(dimension, "minecraft:endrod", point);
    if (i % 5 === 0) spawn(dimension, "minecraft:totem_particle", point);
  }
}

function breakEffects(player) {
  try {
    const at = player.location;
    player.playSound(SOUND.tear, { volume: 1, pitch: 1 });
    for (let i = 0; i < 12; i++) {
      spawn(player.dimension, "minecraft:totem_particle", {
        x: at.x + (Math.random() - 0.5) * 0.8,
        y: at.y + 0.8 + Math.random() * 0.8,
        z: at.z + (Math.random() - 0.5) * 0.8,
      });
    }
  } catch {
    return;
  }
}

function complete(player, gate) {
  if (!player.isValid) return;
  const found = findScroll(player);
  if (found.slot === -1) {
    tell(player, "§cThe Warp Scroll fizzled out because it left your inventory.");
    return;
  }
  let dimension;
  let spot;
  try {
    dimension = world.getDimension(gate.d);
    spot = landingSpot(dimension, gate);
    player.teleport(spot, { dimension });
  } catch {
    tell(player, "§cThe Warp Scroll could not reach that Beacon Gate. It was not used up.");
    return;
  }
  try {
    found.container.setItem(found.slot, undefined);
  } catch {
    tell(player, "§cThe Warp Scroll could not be consumed.");
  }
  player.playSound(SOUND.arrive, { volume: 1, pitch: 1 });
  arrivalBurst(dimension, spot);
  system.runTimeout(() => {
    if (player.isValid) breakEffects(player);
  }, 6);
  tell(player, "§bWarped to §f" + gate.n + "§b.");
}

export function beginWarp(player, item, gate) {
  if (active.has(player.id)) return;
  active.add(player.id);
  try {
    const cooldown = item.getComponent(ItemComponentTypes.Cooldown);
    if (cooldown) cooldown.startCooldown(player);
  } catch {
    tell(player, "§7The cooldown overlay could not start.");
  }
  try {
    player.addEffect("nausea", WARP_TICKS, { amplifier: 0, showParticles: false });
  } catch {
    tell(player, "§7The nausea effect could not start.");
  }
  player.playSound(SOUND.charge, { volume: 1, pitch: 1 });
  let tick = 0;
  const handle = system.runInterval(() => {
    if (!player.isValid) {
      system.clearRun(handle);
      active.delete(player.id);
      return;
    }
    tick += PARTICLE_STEP;
    if (tick < WARP_TICKS) {
      chargeParticles(player, tick);
      return;
    }
    system.clearRun(handle);
    try {
      complete(player, gate);
    } finally {
      active.delete(player.id);
    }
  }, PARTICLE_STEP);
}
