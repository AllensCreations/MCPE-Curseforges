import { world, system } from "@minecraft/server";

const STORE_KEY = "alnqol2:troughs";
const DIMENSION_IDS = ["minecraft:overworld", "minecraft:nether", "minecraft:the_end"];
const MAX_ENTRIES = 100;
const RUN_TICKS = 20;
const BREED_TICKS = 120;
const SAVE_TICKS = 200;
const RADIUS = 8;
const HERD_CAP = 24;
const COOLDOWN_KEY = "alnqol2:breed_until";
const COOLDOWN_TIME = 6000;
const TROUGHS = new Set(["minecraft:chest", "minecraft:barrel"]);
const BREEDS = [
  { type: "minecraft:cow", foods: ["minecraft:wheat"] },
  { type: "minecraft:sheep", foods: ["minecraft:wheat"] },
  { type: "minecraft:pig", foods: ["minecraft:carrot"] },
  { type: "minecraft:rabbit", foods: ["minecraft:carrot"] },
  {
    type: "minecraft:chicken",
    foods: [
      "minecraft:wheat_seeds",
      "minecraft:beetroot_seeds",
      "minecraft:melon_seeds",
      "minecraft:pumpkin_seeds",
      "minecraft:pitcher_pod",
      "minecraft:torchflower_seeds",
    ],
  },
];

const entries = [];
const known = new Set();
let dirty = false;

function keyOf(dimId, x, y, z) {
  return dimId + "|" + x + "|" + y + "|" + z;
}

function add(dimId, x, y, z) {
  const key = keyOf(dimId, x, y, z);
  if (known.has(key) || entries.length >= MAX_ENTRIES) return;
  known.add(key);
  entries.push({ dim: dimId, x, y, z, key, nextAt: system.currentTick + BREED_TICKS });
  dirty = true;
}

function removeAt(index) {
  known.delete(entries[index].key);
  entries.splice(index, 1);
  dirty = true;
}

function load() {
  try {
    const raw = world.getDynamicProperty(STORE_KEY);
    if (typeof raw !== "string") return;
    const list = JSON.parse(raw);
    if (!Array.isArray(list)) return;
    for (const item of list) {
      if (!Array.isArray(item) || item.length !== 4) continue;
      const dimId = DIMENSION_IDS[item[0]];
      if (dimId) add(dimId, item[1], item[2], item[3]);
    }
    dirty = false;
  } catch (e) {
    entries.length = 0;
    known.clear();
  }
}

function save() {
  if (!dirty) return;
  try {
    const payload = entries
      .map((e) => [DIMENSION_IDS.indexOf(e.dim), e.x, e.y, e.z])
      .filter((p) => p[0] >= 0);
    world.setDynamicProperty(STORE_KEY, JSON.stringify(payload));
    dirty = false;
  } catch (e) {}
}

function countFood(container, foods) {
  let total = 0;
  for (let slot = 0; slot < container.size; slot++) {
    const item = container.getItem(slot);
    if (item && foods.includes(item.typeId)) total += item.amount;
  }
  return total;
}

function takeFood(container, foods, amount) {
  let need = amount;
  for (let slot = 0; slot < container.size && need > 0; slot++) {
    const item = container.getItem(slot);
    if (!item || !foods.includes(item.typeId)) continue;
    const used = Math.min(item.amount, need);
    need -= used;
    if (used >= item.amount) {
      container.setItem(slot);
    } else {
      item.amount -= used;
      container.setItem(slot, item);
    }
  }
}

function isReady(animal, now) {
  if (!animal.isValid || animal.hasComponent("minecraft:is_baby")) return false;
  const health = animal.getComponent("minecraft:health");
  if (!health || health.currentValue < health.effectiveMax) return false;
  const until = animal.getDynamicProperty(COOLDOWN_KEY);
  return !(typeof until === "number" && until > now);
}

function hearts(dimension, animal) {
  try {
    const at = animal.location;
    dimension.spawnParticle("minecraft:heart_particle", { x: at.x, y: at.y + 1, z: at.z });
  } catch (e) {}
}

function breed(dimension, center, container, rule) {
  if (countFood(container, rule.foods) < 2) return;
  const herd = dimension.getEntities({ type: rule.type, location: center, maxDistance: RADIUS });
  if (herd.length >= HERD_CAP) return;
  const now = world.getAbsoluteTime();
  const ready = herd.filter((animal) => isReady(animal, now));
  if (ready.length < 2) return;
  const first = ready[0];
  const second = ready[1];
  const a = first.location;
  const b = second.location;
  const middle = { x: (a.x + b.x) / 2, y: Math.max(a.y, b.y), z: (a.z + b.z) / 2 };
  try {
    dimension.spawnEntity(rule.type, middle, { spawnEvent: "minecraft:entity_born" });
  } catch (e) {
    return;
  }
  takeFood(container, rule.foods, 2);
  first.setDynamicProperty(COOLDOWN_KEY, now + COOLDOWN_TIME);
  second.setDynamicProperty(COOLDOWN_KEY, now + COOLDOWN_TIME);
  hearts(dimension, first);
  hearts(dimension, second);
}

function process(entry, tick) {
  const dimension = world.getDimension(entry.dim);
  const block = dimension.getBlock({ x: entry.x, y: entry.y, z: entry.z });
  if (!block || !block.isValid) return true;
  if (!TROUGHS.has(block.typeId)) return false;
  if (tick < entry.nextAt) return true;
  entry.nextAt = tick + BREED_TICKS;
  const inventory = block.getComponent("minecraft:inventory");
  const container = inventory ? inventory.container : undefined;
  if (!container) return true;
  const center = block.center();
  for (const rule of BREEDS) breed(dimension, center, container, rule);
  return true;
}

function run() {
  const tick = system.currentTick;
  for (let i = entries.length - 1; i >= 0; i--) {
    let keep = true;
    try {
      keep = process(entries[i], tick);
    } catch (e) {
      keep = true;
    }
    if (!keep) removeAt(i);
  }
}

function onPlace(event) {
  try {
    const block = event.block;
    if (TROUGHS.has(block.typeId)) add(event.dimension.id, block.x, block.y, block.z);
  } catch (e) {}
}

world.afterEvents.worldLoad.subscribe(() => {
  load();
  world.afterEvents.playerPlaceBlock.subscribe(onPlace);
  system.runInterval(run, RUN_TICKS);
  system.runInterval(save, SAVE_TICKS);
});
