import { world, system, EntityComponentTypes, EntityDamageCause, EquipmentSlot, GameMode } from "@minecraft/server";
import { PLAYER_ID } from "./info.js";
import { isOn, anyOn } from "./store.js";
import { tune } from "./tuning.js";
import { pickTarget } from "./bowaim.js";

const APPLE = "minecraft:golden_apple";
const LOW_HEALTH = 8;
const COOLDOWN = 400;
const last = new Map();

function feed(p) {
  if (p.getGameMode() === GameMode.Creative || p.getGameMode() === GameMode.Spectator) return;
  const health = p.getComponent(EntityComponentTypes.Health);
  if (!health || health.currentValue <= 0 || health.currentValue > LOW_HEALTH) return;
  if (system.currentTick - (last.get(p.id) ?? -COOLDOWN) < COOLDOWN) return;
  const box = p.getComponent(EntityComponentTypes.Inventory)?.container;
  if (!box) return;
  for (let i = 0; i < box.size; i++) {
    const item = box.getItem(i);
    if (item?.typeId !== APPLE) continue;
    if (item.amount > 1) {
      item.amount -= 1;
      box.setItem(i, item);
    } else {
      box.setItem(i, undefined);
    }
    p.addEffect("regeneration", 100, { amplifier: 1 });
    p.addEffect("absorption", 2400);
    p.playSound("random.burp");
    last.set(p.id, system.currentTick);
    return;
  }
}

function show(event) {
  const by = event.damageSource.damagingEntity;
  if (by?.typeId !== PLAYER_ID || !isOn(by, "damageDisplay")) return;
  const points = Math.round(event.damage * 10) / 10;
  const hearts = Math.round(event.damage * 5) / 10;
  try {
    by.onScreenDisplay.setActionBar(`§c-${points} §7(${hearts} hearts)`);
  } catch (e) {}
}

const KNOCK = 0.4;
const BOWS = new Set(["minecraft:bow", "minecraft:crossbow"]);
const dummies = new Map();

function knock(event) {
  const src = event.damageSource;
  const by = src.damagingEntity;
  const victim = event.hurtEntity;
  if (src.cause !== EntityDamageCause.entityAttack || !by?.isValid || !victim.isValid) return;
  let dx = victim.location.x - by.location.x;
  let dz = victim.location.z - by.location.z;
  const size = Math.hypot(dx, dz);
  if (size < 0.001) return;
  dx /= size;
  dz /= size;
  let push = 0;
  if (by.typeId === PLAYER_ID && tune(by, "knockback") !== 100) push = ((tune(by, "knockback") - 100) / 100) * KNOCK;
  if (victim.typeId === PLAYER_ID && isOn(victim, "noKnockback")) push = -KNOCK;
  if (!push) return;
  system.run(() => {
    try {
      if (victim.isValid) victim.applyKnockback({ x: dx * push, z: dz * push }, push * 0.5);
    } catch (e) {}
  });
}

const hud = new Map();

function setCircle(p, name) {
  if ((hud.get(p.id) ?? "") === name) return;
  if (name) hud.set(p.id, name);
  else hud.delete(p.id);
  p.onScreenDisplay.setTitle(name, { fadeInDuration: 0, stayDuration: 72000, fadeOutDuration: 0 });
}

function mark(p) {
  const held = p.getComponent(EntityComponentTypes.Equippable)?.getEquipmentSlot(EquipmentSlot.Mainhand)?.getItem()?.typeId;
  if (!BOWS.has(held)) {
    setCircle(p, "");
    return;
  }
  setCircle(p, tune(p, "aimCircle") === 1 ? `aln_c${Math.min(13, Math.max(4, Math.round(tune(p, "aimCone") / 5) + 3))}` : "");

  const target = pickTarget(p);
  if (!target) return;
  const head = target.getHeadLocation();
  p.spawnParticle("allenscreations:aln_target", { x: head.x, y: head.y + 0.8, z: head.z });
  const name = target.typeId === PLAYER_ID ? target.name : target.typeId.replace("minecraft:", "");
  p.onScreenDisplay.setActionBar(`§cLocked on: ${name}`);
}

export function spawnDummy(p) {
  try {
    const old = dummies.get(p.id);
    if (old?.isValid) old.remove();
    const view = p.getViewDirection();
    const size = Math.hypot(view.x, view.z) || 1;
    const at = { x: p.location.x + (view.x / size) * 3, y: p.location.y, z: p.location.z + (view.z / size) * 3 };
    const dummy = p.dimension.spawnEntity("minecraft:zombie", at);
    dummy.nameTag = "Practice Dummy";
    const quiet = { showParticles: false };
    dummy.addEffect("slowness", 2400, { amplifier: 255, ...quiet });
    dummy.addEffect("weakness", 2400, { amplifier: 255, ...quiet });
    dummy.addEffect("regeneration", 2400, { amplifier: 4, ...quiet });
    dummy.addEffect("fire_resistance", 2400, quiet);
    dummies.set(p.id, dummy);
    system.runTimeout(() => dummy.isValid && dummy.remove(), 2400);
    return true;
  } catch (e) {
    return false;
  }
}

export function initExtras() {
  system.runInterval(() => {
    if (!anyOn("autoGapple")) return;
    for (const p of world.getAllPlayers()) {
      if (!p.isValid || !isOn(p, "autoGapple")) continue;
      try {
        feed(p);
      } catch (e) {}
    }
  }, 10);
  world.afterEvents.entityHurt.subscribe(show);
  world.afterEvents.entityHurt.subscribe(knock);
  system.runInterval(() => {
    if (!anyOn("targetHighlight") && !hud.size) return;
    for (const p of world.getAllPlayers()) {
      if (!p.isValid) continue;
      try {
        if (isOn(p, "targetHighlight") && isOn(p, "bowAimbot")) mark(p);
        else if (hud.has(p.id)) setCircle(p, "");
      } catch (e) {}
    }
  }, 1);
  world.afterEvents.playerLeave.subscribe(({ playerId }) => {
    last.delete(playerId);
    hud.delete(playerId);
  });
}
