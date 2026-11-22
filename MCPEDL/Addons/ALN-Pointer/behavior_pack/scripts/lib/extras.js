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

const drawn = new Map();

// While you draw a bow the game zooms in, so the circle is drawn larger to cover the same area.
// Bow zoom is how many percent your field of view shrinks at full draw (20 ticks). 0 turns it off.
function drawZoom(p) {
  const base = tune(p, "aimZoom");
  const cut = tune(p, "bowZoom");
  const start = drawn.get(p.id);
  if (!cut || start === undefined) return base;
  const pull = Math.min(1, (system.currentTick - start) / 20);
  const fov = (tune(p, "screenFov") * Math.PI) / 180;
  return (base * Math.tan(fov / 2)) / Math.tan((fov * (1 - (cut / 100) * pull)) / 2);
}

const hud = new Map();
const hudAt = new Map();
const locks = new Map();
const HUD_REFRESH = 36000;
const LOCK_REFRESH = 30;

function setCircle(p, name) {
  const same = (hud.get(p.id) ?? "") === name;
  if (same && (!name || system.currentTick - (hudAt.get(p.id) ?? 0) < HUD_REFRESH)) return;
  if (name) {
    hud.set(p.id, name);
    hudAt.set(p.id, system.currentTick);
  } else {
    hud.delete(p.id);
    hudAt.delete(p.id);
  }
  p.onScreenDisplay.setTitle(name, { fadeInDuration: 0, stayDuration: 72000, fadeOutDuration: 0 });
}

function mark(p) {
  const held = p.getComponent(EntityComponentTypes.Equippable)?.getEquipmentSlot(EquipmentSlot.Mainhand)?.getItem()?.typeId;
  if (!BOWS.has(held)) {
    locks.delete(p.id);
    setCircle(p, "");
    return;
  }
  const zoom = Math.min(300, Math.max(50, Math.round(drawZoom(p) / 10) * 10));
  setCircle(p, tune(p, "aimCircle") === 1 ? `aln_z${zoom}` : "");

  const target = pickTarget(p);
  if (!target) {
    locks.delete(p.id);
    return;
  }
  const head = target.getHeadLocation();
  p.spawnParticle("allenscreations:aln_target", { x: head.x, y: head.y + 0.8, z: head.z });
  const name = target.typeId === PLAYER_ID ? target.name : target.typeId.replace("minecraft:", "");
  const lock = locks.get(p.id);
  if (lock?.name === name && system.currentTick - lock.tick < LOCK_REFRESH) return;
  locks.set(p.id, { name, tick: system.currentTick });
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
  world.afterEvents.itemStartUse.subscribe(({ source, itemStack }) => {
    if (BOWS.has(itemStack?.typeId)) drawn.set(source.id, system.currentTick);
  });
  world.afterEvents.itemStopUse.subscribe(({ source }) => drawn.delete(source.id));
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
    drawn.delete(playerId);
    hud.delete(playerId);
    hudAt.delete(playerId);
    locks.delete(playerId);
  });
}
