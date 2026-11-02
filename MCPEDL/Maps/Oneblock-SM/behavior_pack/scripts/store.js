import { world } from "@minecraft/server";
import { MAX_BALANCE, HISTORY_MAX, MARKET, MARKET_CFG as C, CATS, ISLAND_LEVELS, LICENSES } from "./config.js";

const PKEY = "osm:player";
const WKEY = "osm:world";
const freshPlayer = () => ({ v: 1, coins: 0, lic: ["t1"], con: [], hist: [], mined: 0, tx: 0, up: {}, ach: [], sold: 0 });
const freshWorld = () => ({ v: 1, lvl: 0, market: {}, chests: [], autoMine: null });

function read(holder, key, fresh) {
  const raw = holder.getDynamicProperty(key);
  if (typeof raw !== "string") return fresh();
  try {
    const d = Object.assign(fresh(), JSON.parse(raw));
    if (!Number.isSafeInteger(d.coins) || d.coins < 0) d.coins = 0;
    return d;
  } catch (e) {
    // Keep the unreadable record so nothing is silently destroyed.
    try { holder.setDynamicProperty(key + "_corrupt", raw); } catch (e2) { /* ignore */ }
    console.warn("[SovereignMarket] unreadable " + key + ", starting fresh copy");
    return fresh();
  }
}

export const loadPlayer = (p) => read(p, PKEY, freshPlayer);
export const savePlayer = (p, d) => p.setDynamicProperty(PKEY, JSON.stringify(d));
let levelCache = -1; // island level kept in memory so block events do not reread the saved world data
export const loadWorld = () => read(world, WKEY, freshWorld);
export const saveWorld = (w) => {
  world.setDynamicProperty(WKEY, JSON.stringify(w));
  levelCache = Math.min(Math.max(0, w.lvl | 0), ISLAND_LEVELS.length - 1);
};

export const hasLic = (d, id) => d.lic.includes(id);
export const canAfford = (d, n) => Number.isSafeInteger(n) && n >= 0 && d.coins >= n;
export function addCoins(d, n) { d.coins = Math.min(MAX_BALANCE, d.coins + Math.max(0, Math.floor(n))); }
export function spend(d, n) { if (!canAfford(d, n)) return false; d.coins -= n; return true; }
export function log(d, text) {
  d.tx += 1;
  d.hist.unshift(text);
  if (d.hist.length > HISTORY_MAX) d.hist.length = HISTORY_MAX;
}
export const islandLevel = () => {
  if (levelCache < 0) levelCache = Math.min(Math.max(0, loadWorld().lvl | 0), ISLAND_LEVELS.length - 1);
  return levelCache;
};
export const inBounds = (x, z) => {
  const L = ISLAND_LEVELS[islandLevel()];
  return x >= L.min && x <= L.max && z >= L.min && z <= L.max;
};
export const highestTier = (d) => LICENSES.filter((l) => /^t\d+$/.test(l.id) && d.lic.includes(l.id)).length;

// ---- Market pricing ----
export const ITEMS = new Map(MARKET.map(([id, base, min, max, lic, cat]) => ["minecraft:" + id, { id: "minecraft:" + id, base, min, max, lic, cat }]));

const decayed = (rec, now) => (rec ? rec.s * Math.pow(0.5, Math.max(0, (now - rec.t) / (C.halfLifeMin * 60000))) : 0);

export function demandState(cat, now = Date.now()) {
  const b = Math.floor(now / C.rotateMs);
  const hot = CATS[(b * 5 + 3) % CATS.length];
  let cold = CATS[(b * 7 + 1) % CATS.length];
  if (cold === hot) cold = CATS[(b * 7 + 2) % CATS.length];
  if (cat === hot) return { m: C.hot, label: "High" };
  if (cat === cold) return { m: C.cold, label: "Low" };
  return { m: 1, label: "Normal" };
}

const unit = (it, S, dm) => Math.min(it.max, Math.max(it.min, (it.base * dm) / (1 + S / C.depth)));

// Marginal pricing: each extra unit is priced at higher supply, so splitting a sale never beats one big sale.
export function quote(w, itemId, qty, now = Date.now()) {
  const it = ITEMS.get(itemId);
  if (!it || !Number.isSafeInteger(qty) || qty < 1) return null;
  const S = decayed(w.market[itemId], now);
  const dm = demandState(it.cat, now).m;
  let sum = 0;
  for (let i = 0; i < qty; i++) sum += unit(it, S + i, dm);
  return { total: Math.max(1, Math.floor(sum)), unit: unit(it, S, dm) };
}

export function recordSale(w, itemId, qty, now = Date.now()) {
  const it = ITEMS.get(itemId);
  const S = Math.min(C.maxSupply, decayed(w.market[itemId], now) + qty);
  w.market[itemId] = { s: Math.round(S * 100) / 100, t: now, p: Math.round(unit(it, S, demandState(it.cat, now).m) * 100) / 100 };
}

export function snapshot(w, itemId, now = Date.now()) {
  const it = ITEMS.get(itemId);
  const rec = w.market[itemId];
  const S = decayed(rec, now);
  const dem = demandState(it.cat, now);
  const price = unit(it, S, dem.m);
  const supply = S < 15 ? "Low" : S < C.depth ? "Moderate" : "High";
  let dir = "Stable";
  if (rec && price > rec.p * 1.02) dir = "Rising";
  else if (rec && price < rec.p * 0.98) dir = "Falling";
  const drop = Math.round((1 - 1 / (1 + S / C.depth)) * 100);
  const why = (S < 1 ? "No recent sales." : "Recent sales cut the price by " + drop + " percent, easing as supply clears.") +
    (dem.label === "High" ? " Demand is high (+25 percent)." : dem.label === "Low" ? " Demand is low (-15 percent)." : "");
  return { price, supply, demand: dem.label, dir, why };
}
