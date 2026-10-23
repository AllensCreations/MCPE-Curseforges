// contracts.js - three delivery contracts per player per day, based on what the core can yield now.
import { addCoins, countOf, removeItems, unlockedItems, BASE_PRICES, getPhaseInfo } from "./economy.js";
import { bumpStat } from "./stats.js";

const QTY = [2, 4, 8, 16, 32, 64];
const today = () => Math.floor(Date.now() / 86400000);

function generate() {
  const phase = getPhaseInfo().index;
  const pool = unlockedItems().slice();
  const out = [];
  while (out.length < 3 && pool.length > 0) {
    const item = pool.splice(Math.floor(Math.random() * pool.length), 1)[0];
    const target = (60 * (1 + 0.5 * phase)) / BASE_PRICES[item];
    const qty = QTY.reduce((best, q) => (Math.abs(q - target) < Math.abs(best - target) ? q : best), QTY[0]);
    out.push({ item, qty, reward: Math.round(qty * BASE_PRICES[item] * 1.6) + 10, done: false });
  }
  return out;
}

/** Today's contracts for this player (created on first call each day). */
export function getContracts(player) {
  let state = null;
  try { state = JSON.parse(player.getDynamicProperty("sv_ct") ?? "null"); } catch { state = null; }
  if (!state || state.d !== today()) {
    state = { d: today(), list: generate() };
    player.setDynamicProperty("sv_ct", JSON.stringify(state));
  }
  return state.list;
}
export function claimContract(player, index) {
  const list = getContracts(player);
  const c = list[index];
  if (!c) return { ok: false, msg: "No such contract." };
  if (c.done) return { ok: false, msg: "Already completed today." };
  if (countOf(player, c.item) < c.qty) return { ok: false, msg: `You need ${c.qty} of that item.` };
  if (!removeItems(player, c.item, c.qty)) return { ok: false, msg: "Could not take the items." };
  c.done = true;
  player.setDynamicProperty("sv_ct", JSON.stringify({ d: today(), list }));
  addCoins(player, c.reward);
  bumpStat(player, "contracts");
  return { ok: true, msg: `Contract complete! +${c.reward} coins.` };
}
