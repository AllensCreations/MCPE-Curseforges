import { world, system, SignSide } from "@minecraft/server";

const STORE_KEY = "alnqol2:vacuum_hoppers";
const DIMENSION_IDS = ["minecraft:overworld", "minecraft:nether", "minecraft:the_end"];
const MAX_ENTRIES = 150;
const SWEEP_TICKS = 10;
const REFRESH_SWEEPS = 4;
const SAVE_TICKS = 200;
const BOX = 5;
const REACH = 2;
const MAX_PER_SWEEP = 32;
const SIDES = [
  { x: 0, y: 0, z: -1 },
  { x: 1, y: 0, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: -1, y: 0, z: 0 },
];

const entries = [];
const known = new Set();
let sweepCount = 0;
let dirty = false;

function keyOf(dimId, x, y, z) {
  return dimId + "|" + x + "|" + y + "|" + z;
}

function add(dimId, x, y, z) {
  const key = keyOf(dimId, x, y, z);
  if (known.has(key) || entries.length >= MAX_ENTRIES) return;
  known.add(key);
  entries.push({ dim: dimId, x, y, z, key, active: false, refreshAt: 0 });
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

function isVacuumText(text) {
  const lines = text.replace(/§./g, "").split("\n");
  for (const line of lines) {
    if (line.trim().toLowerCase() === "vacuum hopper") return true;
  }
  return false;
}

function readSign(block) {
  const sign = block.getComponent("minecraft:sign");
  if (!sign) return undefined;
  const text = sign.getText(SignSide.Front);
  return typeof text === "string" ? text : "";
}

function scanSigns(block) {
  const info = { hasSign: false, unknown: false, vacuum: false };
  for (const side of SIDES) {
    const neighbour = block.offset(side);
    if (!neighbour) {
      info.unknown = true;
      continue;
    }
    const text = readSign(neighbour);
    if (text === undefined) continue;
    info.hasSign = true;
    if (isVacuumText(text)) info.vacuum = true;
  }
  return info;
}

function collect(dimension, block, container) {
  const origin = { x: block.x - REACH, y: block.y - REACH, z: block.z - REACH };
  const found = dimension.getEntities({
    type: "minecraft:item",
    location: origin,
    volume: { x: BOX, y: BOX, z: BOX },
  });
  let moved = 0;
  for (const entity of found) {
    if (moved >= MAX_PER_SWEEP) break;
    if (!entity.isValid) continue;
    const at = entity.location;
    if (at.x < origin.x || at.x >= origin.x + BOX) continue;
    if (at.y < origin.y || at.y >= origin.y + BOX) continue;
    if (at.z < origin.z || at.z >= origin.z + BOX) continue;
    let stack;
    try {
      const component = entity.getComponent("minecraft:item");
      stack = component ? component.itemStack : undefined;
    } catch (e) {
      continue;
    }
    if (!stack) continue;
    const rest = container.addItem(stack);
    if (rest && rest.amount >= stack.amount) continue;
    entity.remove();
    if (rest) dimension.spawnItem(rest, at);
    moved++;
  }
}

function process(entry) {
  const dimension = world.getDimension(entry.dim);
  const block = dimension.getBlock({ x: entry.x, y: entry.y, z: entry.z });
  if (!block || !block.isValid) return true;
  if (block.typeId !== "minecraft:hopper") return false;
  if (sweepCount >= entry.refreshAt) {
    const info = scanSigns(block);
    if (!info.hasSign && !info.unknown) return false;
    entry.active = info.vacuum;
    entry.refreshAt = sweepCount + REFRESH_SWEEPS;
  }
  if (!entry.active) return true;
  const inventory = block.getComponent("minecraft:inventory");
  const container = inventory ? inventory.container : undefined;
  if (!container) return true;
  collect(dimension, block, container);
  return true;
}

function sweep() {
  sweepCount++;
  for (let i = entries.length - 1; i >= 0; i--) {
    let keep = true;
    try {
      keep = process(entries[i]);
    } catch (e) {
      keep = true;
    }
    if (!keep) removeAt(i);
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
  system.runInterval(sweep, SWEEP_TICKS);
  system.runInterval(save, SAVE_TICKS);
});
