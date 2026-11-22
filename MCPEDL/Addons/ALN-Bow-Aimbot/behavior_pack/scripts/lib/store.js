import { world } from "@minecraft/server";

export const FEATURES = [
  { id: "bowAimbot", name: "Bow Aimbot", info: "Arrows you shoot steer toward the target inside the aim circle." },
  { id: "targetHighlight", name: "Target Highlight", info: "Shows a target image over who Bow Aimbot picks and the aim circle." },
];

const KEY = "alnb_toggles";
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
