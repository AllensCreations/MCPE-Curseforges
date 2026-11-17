import { world } from "@minecraft/server";

export const FEATURES = [
  { id: "autoTotem", name: "Auto Totem", info: "Moves a Totem of Undying into your hand before a deadly hit." },
  { id: "infiniteTotem", name: "Infinite Totem", info: "Gives you a new Totem of Undying whenever you hold none." },
  { id: "aura", name: "Aura Mode", info: "Hits hostile mobs and players within 4 blocks." },
  { id: "alwaysCritical", name: "Always Critical", info: "Every melee hit deals 1.5 times damage." },
  { id: "bowAimbot", name: "Bow Aimbot", info: "Arrows you shoot steer toward the target you aim at." },
  { id: "waterClutch", name: "Always Water Clutch", info: "Places temporary water under you before a long fall lands." },
  { id: "shield", name: "Shield Always Active", info: "Blocks hits from the front while you carry a shield." },
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

export function applyValues(player, values) {
  const data = {};
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
