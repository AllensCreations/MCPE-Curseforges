import { world, system, EntityComponentTypes, EquipmentSlot } from "@minecraft/server";
import { PLAYER_ID } from "./info.js";
import { isOn, anyOn } from "./store.js";
import { tune } from "./tuning.js";
import { pickTarget } from "./bowaim.js";

const BOWS = new Set(["minecraft:bow", "minecraft:crossbow"]);
const drawn = new Map();
const hud = new Map();
const hudAt = new Map();
const locks = new Map();
const HUD_REFRESH = 36000;
const LOCK_REFRESH = 30;

function drawZoom(p) {
  const base = tune(p, "aimZoom");
  const cut = tune(p, "bowZoom");
  const start = drawn.get(p.id);
  if (!cut || start === undefined) return base;
  const pull = Math.min(1, (system.currentTick - start) / 20);
  const fov = (tune(p, "screenFov") * Math.PI) / 180;
  return (base * Math.tan(fov / 2)) / Math.tan((fov * (1 - (cut / 100) * pull)) / 2);
}

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
  setCircle(p, tune(p, "aimCircle") === 1 ? `alnb_z${zoom}` : "");

  const target = pickTarget(p);
  if (!target) {
    locks.delete(p.id);
    return;
  }
  const head = target.getHeadLocation();
  p.spawnParticle("allenscreations:aln_bow_target", { x: head.x, y: head.y + 0.8, z: head.z });
  const name = target.typeId === PLAYER_ID ? target.name : target.typeId.replace("minecraft:", "");
  const lock = locks.get(p.id);
  if (lock?.name === name && system.currentTick - lock.tick < LOCK_REFRESH) return;
  locks.set(p.id, { name, tick: system.currentTick });
  p.onScreenDisplay.setActionBar(`§cLocked on: ${name}`);
}

export function initHud() {
  world.afterEvents.itemStartUse.subscribe(({ source, itemStack }) => {
    if (BOWS.has(itemStack?.typeId)) drawn.set(source.id, system.currentTick);
  });
  world.afterEvents.itemStopUse.subscribe(({ source }) => drawn.delete(source.id));
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
    drawn.delete(playerId);
    hud.delete(playerId);
    hudAt.delete(playerId);
    locks.delete(playerId);
  });
}
