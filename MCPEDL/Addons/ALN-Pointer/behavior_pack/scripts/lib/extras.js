import { world, system, EntityComponentTypes, GameMode } from "@minecraft/server";
import { PLAYER_ID } from "./info.js";
import { isOn, anyOn } from "./store.js";

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
  world.afterEvents.playerLeave.subscribe(({ playerId }) => last.delete(playerId));
}
