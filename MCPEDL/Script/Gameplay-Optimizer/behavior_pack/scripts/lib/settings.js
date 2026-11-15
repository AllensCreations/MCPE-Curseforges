import { world } from "@minecraft/server";

const KEY = "aln_gameplay_optimizer_settings";

export const ITEM_LIMIT_MIN = 50;
export const ITEM_LIMIT_MAX = 500;
export const ITEM_LIMIT_STEP = 50;

const DEFAULTS = {
  itemCap: false,
  itemLimit: 200,
  hideParticles: true,
  portalPreload: true,
};

let cache = null;

function sanitize(raw) {
  const out = { ...DEFAULTS };
  if (raw && typeof raw === "object") {
    if (typeof raw.itemCap === "boolean") out.itemCap = raw.itemCap;
    if (typeof raw.hideParticles === "boolean") out.hideParticles = raw.hideParticles;
    if (typeof raw.portalPreload === "boolean") out.portalPreload = raw.portalPreload;
    if (typeof raw.itemLimit === "number" && Number.isFinite(raw.itemLimit)) {
      const stepped = Math.round(raw.itemLimit / ITEM_LIMIT_STEP) * ITEM_LIMIT_STEP;
      out.itemLimit = Math.min(ITEM_LIMIT_MAX, Math.max(ITEM_LIMIT_MIN, stepped));
    }
  }
  return out;
}

export function getSettings() {
  if (cache) return cache;
  let saved = null;
  try {
    const raw = world.getDynamicProperty(KEY);
    if (typeof raw === "string") saved = JSON.parse(raw);
  } catch (e) {
    saved = null;
  }
  cache = sanitize(saved);
  return cache;
}

export function saveSettings(next) {
  cache = sanitize(next);
  try {
    world.setDynamicProperty(KEY, JSON.stringify(cache));
  } catch (e) {
    return false;
  }
  return true;
}
