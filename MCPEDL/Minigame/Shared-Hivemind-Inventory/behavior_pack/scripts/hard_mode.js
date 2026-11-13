import { system, EntityComponentTypes } from "@minecraft/server";

const lastHealth = new Map();
const lastHunger = new Map();
let sharedHealth = null;
let sharedHunger = null;
let killing = false;

function safe(fn, fallback = undefined) { try { return fn(); } catch { return fallback; } }
const healthOf = (p) => safe(() => p.getComponent(EntityComponentTypes.Health));
const hungerOf = (p) => safe(() => p.getComponent(EntityComponentTypes.Hunger));
const readValue = (comp, fallback) => safe(() => comp.currentValue, fallback);

function mergeValue(entries, last, shared, addLosses) {
  if (shared === null) return Math.min(...entries.map(e => readValue(e.comp, 0)));
  let maxGain = 0;
  let minLoss = 0;
  let sumLoss = 0;
  for (const { player, comp } of entries) {
    const prev = last.get(player.id);
    if (prev === undefined) continue;
    const d = readValue(comp, prev) - prev;
    if (d > maxGain) maxGain = d;
    if (d < minLoss) minLoss = d;
    if (d < 0) sumLoss += d;
  }
  return shared + maxGain + (addLosses ? sumLoss : minLoss);
}

function writeValue(entries, last, value) {
  for (const { player, comp } of entries) {
    const cur = readValue(comp, value);
    if (Math.abs(cur - value) > 1e-6) safe(() => comp.setCurrentValue(value));
    last.set(player.id, readValue(comp, value));
  }
}

function prune(last, ids) {
  for (const id of [...last.keys()]) if (!ids.has(id)) last.delete(id);
}

export function hardReset() {
  lastHealth.clear();
  lastHunger.clear();
  sharedHealth = null;
  sharedHunger = null;
}

export function hardKillAll(players) {
  if (killing) return;
  killing = true;
  for (const p of players) safe(() => p.kill());
  hardReset();
  system.runTimeout(() => { killing = false; }, 10);
}

export function hardTick(players, options = {}) {
  const shareHealth = options.health !== false;
  const shareHunger = options.hunger !== false;
  if (!shareHealth) {
    lastHealth.clear();
    sharedHealth = null;
  }
  if (!shareHunger) {
    lastHunger.clear();
    sharedHunger = null;
  }
  const hp = [];
  const fd = [];
  for (const p of players) {
    const h = healthOf(p);
    const f = hungerOf(p);
    if (h) hp.push({ player: p, comp: h });
    if (f) fd.push({ player: p, comp: f });
  }
  if (shareHealth) {
    if (!hp.length) {
      hardReset();
      return;
    }
    prune(lastHealth, new Set(hp.map(e => e.player.id)));
    const maxHp = Math.min(...hp.map(e => safe(() => e.comp.effectiveMax, 20)));
    const nextHp = Math.min(Math.max(mergeValue(hp, lastHealth, sharedHealth, true), 0), maxHp);
    if (nextHp <= 0) {
      hardKillAll(players);
      return;
    }
    sharedHealth = nextHp;
    writeValue(hp, lastHealth, nextHp);
  }
  if (shareHunger && fd.length) {
    prune(lastHunger, new Set(fd.map(e => e.player.id)));
    const maxFood = Math.min(...fd.map(e => safe(() => e.comp.effectiveMax, 20)));
    const nextFood = Math.min(Math.max(mergeValue(fd, lastHunger, sharedHunger, false), 0), maxFood);
    sharedHunger = nextFood;
    writeValue(fd, lastHunger, nextFood);
  }
}
