import { world } from "@minecraft/server";

export const FEATURES = [
  { id: "autoTotem", name: "Auto Totem", info: "Moves a Totem of Undying into your hand before a deadly hit." },
  { id: "infiniteTotem", name: "Infinite Totem", info: "Gives you a new Totem of Undying whenever you hold none." },
  { id: "aura", name: "Aura Mode", info: "Hits hostile mobs and players within 4 blocks." },
  { id: "alwaysCritical", name: "Always Critical", info: "Every melee hit deals 1.5 times damage." },
  { id: "bowAimbot", name: "Bow Aimbot", info: "Arrows you shoot steer toward the target you aim at." },
  { id: "waterClutch", name: "Always Water Clutch", info: "Places temporary water under you before a long fall lands." },
  { id: "shield", name: "Shield Always Active", info: "Blocks hits from the front while you carry a shield." },
  { id: "autoGapple", name: "Auto Golden Apple", info: "Eats a golden apple for you when your health is 4 hearts or less." },
  { id: "damageDisplay", name: "Damage Display", info: "Shows the damage of each hit you land on the action bar." },
  { id: "neverDie", name: "Never Die", info: "Keeps you at half a heart instead of dying, except in the void or from the kill command." },
  { id: "keepGear", name: "Keep Gear On Death", info: "Keeps your items and armor when you die, for you only." },
  { id: "noKnockback", name: "No Knockback", info: "Cancels the push you get from melee hits." },
  { id: "targetHighlight", name: "Target Highlight", info: "Marks who Bow Aimbot picks while you hold a bow." },
];

const KEY = "aln_pointer_toggles";
const cache = new Map();

function load(player) {
  const raw = player.getDynamicProperty(KEY);
  let data = {};
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") data = parsed;
    } catch (e) {}
  }
  cache.set(player.id, data);
  return data;
}

const read = (player) => cache.get(player.id) ?? load(player);

export function isOn(player, id) {
  return read(player)[id] === true;
}

export function activeNames(player) {
  return FEATURES.filter((f) => isOn(player, f.id)).map((f) => f.name);
}

export function quickSwitch(player) {
  const old = read(player);
  const on = FEATURES.filter((f) => old[f.id] === true).map((f) => f.id);
  const last = Array.isArray(old._last) ? old._last : [];
  if (!on.length && !last.length) return "Nothing to bring back. Turn some toggles on first.";
  const data = { _last: on.length ? on : last };
  FEATURES.forEach((f) => {
    data[f.id] = on.length ? false : last.includes(f.id);
  });
  cache.set(player.id, data);
  player.setDynamicProperty(KEY, JSON.stringify(data));
  return on.length ? "All toggles off. Sneak and use again to bring them back." : `${last.length} toggles back on.`;
}

export function applyValues(player, values) {
  const data = { _last: read(player)._last };
  FEATURES.forEach((f, i) => {
    data[f.id] = values[i] === true;
  });
  cache.set(player.id, data);
  player.setDynamicProperty(KEY, JSON.stringify(data));
}

export function anyOn(id) {
  for (const player of world.getAllPlayers()) {
    if (isOn(player, id)) return true;
  }
  return false;
}

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  cache.delete(playerId);
});
