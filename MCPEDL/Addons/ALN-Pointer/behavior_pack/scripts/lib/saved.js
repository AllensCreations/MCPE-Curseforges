import { world } from "@minecraft/server";

const cache = new Map();

export function readSaved(player, key) {
  const id = `${key}|${player.id}`;
  if (cache.has(id)) return cache.get(id);
  let data = {};
  const raw = player.getDynamicProperty(key);
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") data = parsed;
    } catch (e) {}
  }
  cache.set(id, data);
  return data;
}

export function writeSaved(player, key, data) {
  cache.set(`${key}|${player.id}`, data);
  player.setDynamicProperty(key, JSON.stringify(data));
}

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  for (const id of [...cache.keys()]) if (id.endsWith(`|${playerId}`)) cache.delete(id);
});
