import { KEYS, BOUNTY_POOL } from "./config.js";
import { getBalance, setBalance } from "./vault.js";

const DAY_MS = 86400000;
export const today = () => Math.floor(Date.now() / DAY_MS);
export const msLeft = () => (today() + 1) * DAY_MS - Date.now();

function fresh(day) {
  const list = [];
  for (let k = 0; k < 3; k++) list.push({ i: ((day + k) * 3) % BOUNTY_POOL.length, p: 0, c: false });
  return { d: day, b: list };
}

export function getBounties(player) {
  const day = today();
  let state = null;
  try {
    const raw = player.getDynamicProperty(KEYS.bounties);
    if (typeof raw === "string") state = JSON.parse(raw);
  } catch (e) {
    state = null;
  }
  if (!state || state.d !== day || !Array.isArray(state.b)) {
    state = fresh(day);
    player.setDynamicProperty(KEYS.bounties, JSON.stringify(state));
  }
  return state;
}

function save(player, state) {
  player.setDynamicProperty(KEYS.bounties, JSON.stringify(state));
}

export function addProgress(player, kind, typeId) {
  const state = getBounties(player);
  let changed = false;
  for (const entry of state.b) {
    const def = BOUNTY_POOL[entry.i];
    if (entry.c || entry.p >= def.goal || def.kind !== kind) continue;
    if (kind === "kill" && !def.targets.includes(typeId)) continue;
    entry.p += 1;
    changed = true;
    if (entry.p >= def.goal) {
      try {
        player.onScreenDisplay.setActionBar(`§a§lBounty complete: §e${def.title}§r §f- claim it in the Captain's Ledger`);
        player.playSound("random.levelup");
      } catch (e) {}
    }
  }
  if (changed) save(player, state);
}

export function claim(player, index) {
  const state = getBounties(player);
  const entry = state.b[index];
  if (!entry) return 0;
  const def = BOUNTY_POOL[entry.i];
  if (entry.c || entry.p < def.goal) return 0;
  entry.c = true;
  save(player, state);
  setBalance(player, getBalance(player) + def.reward * 10);
  return def.reward;
}
