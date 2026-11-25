import { world, system, SignSide } from "@minecraft/server";

const STORE_KEY = "alnqol2:filter_hoppers";
const DIMENSION_IDS = ["minecraft:overworld", "minecraft:nether", "minecraft:the_end"];
const MAX_ENTRIES = 150;
const BUDGET = 30;
const REFRESH_TICKS = 20;
const SAVE_TICKS = 200;
const SIDES = [
  { x: 0, y: 0, z: -1 },
  { x: 1, y: 0, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: -1, y: 0, z: 0 },
];

const entries = [];
const known = new Set();
let cursor = 0;
let dirty = false;

function keyOf(dimId, x, y, z) {
  return dimId + "|" + x + "|" + y + "|" + z;
}

function add(dimId, x, y, z) {
  const key = keyOf(dimId, x, y, z);
  if (known.has(key) || entries.length >= MAX_ENTRIES) return;
  known.add(key);
  entries.push({ dim: dimId, x, y, z, key, filter: null, refreshAt: 0 });
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

function parseFilter(text) {
  const joined = text.replace(/§./g, "").split("\n").join(",");
  const match = /^\s*filter\s*:(.*)$/i.exec(joined);
  if (!match) return null;
  const ids = new Set();
  for (const part of match[1].split(",")) {
    const id = part.trim().toLowerCase().replace(/\s+/g, "");
    if (!id) continue;
    ids.add(id.includes(":") ? id : "minecraft:" + id);
  }
  return ids.size > 0 ? ids : null;
}

function readSign(block) {
  const sign = block.getComponent("minecraft:sign");
  if (!sign) return undefined;
  const text = sign.getText(SignSide.Front);
  return typeof text === "string" ? text : "";
}

function scanSigns(block) {
  const info = { hasSign: false, unknown: false, filter: null };
  for (const side of SIDES) {
    const neighbour = block.offset(side);
    if (!neighbour) {
      info.unknown = true;
      continue;
    }
    const text = readSign(neighbour);
    if (text === undefined) continue;
    info.hasSign = true;
    if (!info.filter) info.filter = parseFilter(text);
  }
  return info;
}

function findDropSpot(block) {
  for (const side of SIDES) {
    const neighbour = block.offset(side);
    if (neighbour && neighbour.isAir) return neighbour.center();
  }
  return undefined;
}

function process(entry, tick) {
  const dimension = world.getDimension(entry.dim);
  const block = dimension.getBlock({ x: entry.x, y: entry.y, z: entry.z });
  if (!block || !block.isValid) return true;
  if (block.typeId !== "minecraft:hopper") return false;
  if (tick >= entry.refreshAt) {
    const info = scanSigns(block);
    if (!info.hasSign && !info.unknown) return false;
    entry.filter = info.filter;
    entry.refreshAt = tick + REFRESH_TICKS;
  }
  if (!entry.filter) return true;
  const inventory = block.getComponent("minecraft:inventory");
  const container = inventory ? inventory.container : undefined;
  if (!container) return true;
  for (let slot = 0; slot < container.size; slot++) {
    const item = container.getItem(slot);
    if (!item || entry.filter.has(item.typeId)) continue;
    const spot = findDropSpot(block);
    if (!spot) return true;
    container.setItem(slot);
    dimension.spawnItem(item, spot);
  }
  return true;
}

function step() {
  if (entries.length === 0) return;
  const tick = system.currentTick;
  let budget = Math.min(BUDGET, entries.length);
  while (budget-- > 0 && entries.length > 0) {
    if (cursor >= entries.length) cursor = 0;
    let keep = true;
    try {
      keep = process(entries[cursor], tick);
    } catch (e) {
      keep = true;
    }
    if (keep) cursor++;
    else removeAt(cursor);
  }
}

function onPlace(event) {
  try {
    const block = event.block;
    if (block.typeId === "minecraft:hopper") {
      if (scanSigns(block).hasSign) add(event.dimension.id, block.x, block.y, block.z);
      return;
    }
    if (!block.getComponent("minecraft:sign")) return;
    for (const side of SIDES) {
      const hopper = block.offset(side);
      if (hopper && hopper.typeId === "minecraft:hopper") add(event.dimension.id, hopper.x, hopper.y, hopper.z);
    }
  } catch (e) {}
}

world.afterEvents.worldLoad.subscribe(() => {
  load();
  world.afterEvents.playerPlaceBlock.subscribe(onPlace);
  system.runInterval(step, 1);
  system.runInterval(save, SAVE_TICKS);
});
