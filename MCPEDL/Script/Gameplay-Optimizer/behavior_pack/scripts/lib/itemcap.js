import { world } from "@minecraft/server";
import { getSettings } from "./settings.js";

const ITEM_TYPE = "minecraft:item";
const tracked = new Map();

function isLive(entity) {
  try {
    const flag = entity.isValid;
    return typeof flag === "function" ? flag.call(entity) : flag === true;
  } catch (e) {
    return false;
  }
}

export function resetItemTracking() {
  tracked.clear();
}

export function startItemCap() {
  world.afterEvents.entitySpawn.subscribe(({ entity }) => {
    const settings = getSettings();
    if (!settings.itemCap) return;
    if (!isLive(entity) || entity.typeId !== ITEM_TYPE) return;
    const key = entity.dimension.id;
    const live = (tracked.get(key) ?? []).filter(isLive);
    live.push(entity);
    while (live.length > settings.itemLimit) {
      const oldest = live.shift();
      try {
        oldest.remove();
      } catch (e) {
        continue;
      }
    }
    tracked.set(key, live);
  });
}
