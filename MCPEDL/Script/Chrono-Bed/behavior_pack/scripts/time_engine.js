import { world, system, BlockVolume } from "@minecraft/server";

const OVERWORLD = "minecraft:overworld";
const MORNING = 1000;
const DAY_LENGTH = 24000;
const NIGHT_START = 12542;
const NIGHT_END = 23459;
const MIN_STEP = 200;
const MAX_STEP = 500;
const RAMP_PER_TICK = 5;
const WAKE_GRACE = 20;
const SCAN_RADIUS = 32;
const SCAN_HEIGHT = 16;
const MIN_Y = -64;
const MAX_Y = 319;
const TICKS_PER_STAGE = 1500;
const BATCH = 200;

const CROPS = {
  "minecraft:wheat": ["growth", 7],
  "minecraft:carrots": ["growth", 7],
  "minecraft:potatoes": ["growth", 7],
  "minecraft:beetroot": ["growth", 7],
  "minecraft:melon_stem": ["growth", 7],
  "minecraft:pumpkin_stem": ["growth", 7],
  "minecraft:nether_wart": ["age", 3],
};

const SAPLINGS = [
  "minecraft:oak_sapling",
  "minecraft:spruce_sapling",
  "minecraft:birch_sapling",
  "minecraft:jungle_sapling",
  "minecraft:acacia_sapling",
  "minecraft:dark_oak_sapling",
  "minecraft:cherry_sapling",
  "minecraft:pale_oak_sapling",
];

const GROWTH_TYPES = [...Object.keys(CROPS), ...SAPLINGS];

let handle;
let elapsed = 0;
let waiting = 0;
let skipped = 0;
let targetTime = 0;
const sleepers = new Map();

const isNight = (t) => t >= NIGHT_START && t <= NIGHT_END;

function formatClock(t) {
  const hour = (Math.floor(t / 1000) + 6) % 24;
  const minute = Math.floor(((t % 1000) * 60) / 1000);
  return String(hour).padStart(2, "0") + String(minute).padStart(2, "0");
}

function safe(fn) {
  try {
    fn();
  } catch (e) {
    return;
  }
}

function boostBlock(block, stages) {
  if (!block) return 0;
  const id = block.typeId;
  const perm = block.permutation;
  if (SAPLINGS.includes(id)) {
    if (perm.getState("age_bit") === false) block.setPermutation(perm.withState("age_bit", true));
    return 0;
  }
  const spec = CROPS[id];
  if (!spec) return 0;
  const current = perm.getState(spec[0]);
  if (typeof current !== "number" || current >= spec[1]) return 0;
  block.setPermutation(perm.withState(spec[0], Math.min(spec[1], current + stages)));
  return 1;
}

function* growJob(players, stages, completed) {
  let grown = 0;
  const seen = new Set();
  for (const p of players) {
    try {
      const dim = p.dimension;
      const x = Math.floor(p.location.x);
      const y = Math.floor(p.location.y);
      const z = Math.floor(p.location.z);
      const volume = new BlockVolume(
        { x: x - SCAN_RADIUS, y: Math.max(MIN_Y, y - SCAN_HEIGHT), z: z - SCAN_RADIUS },
        { x: x + SCAN_RADIUS, y: Math.min(MAX_Y, y + SCAN_HEIGHT), z: z + SCAN_RADIUS }
      );
      let n = 0;
      const found = dim.getBlocks(volume, { includeTypes: GROWTH_TYPES }, true);
      for (const pos of found.getBlockLocationIterator()) {
        const key = pos.x + "," + pos.y + "," + pos.z;
        if (seen.has(key)) continue;
        seen.add(key);
        grown += boostBlock(dim.getBlock(pos), stages);
        n += 1;
        if (n % BATCH === 0) yield;
      }
    } catch (e) {
      continue;
    }
    yield;
  }
  if (!completed) return;
  const text = grown > 0
    ? "§a[ GOOD MORNING ] §fCrops grew while you rested!"
    : "§a[ GOOD MORNING ] §fThe night is over.";
  for (const p of players) safe(() => p.onScreenDisplay.setActionBar(text));
}

function finish(completed) {
  if (handle !== undefined) system.clearRun(handle);
  handle = undefined;
  const players = [...sleepers.values()];
  sleepers.clear();
  const stages = Math.floor(skipped / TICKS_PER_STAGE);
  for (const p of players) {
    safe(() => p.onScreenDisplay.setActionBar(completed ? "§a[ GOOD MORNING ]" : ""));
    if (completed) {
      safe(() => p.playSound("note.chime", { volume: 1, pitch: 1 }));
      safe(() => p.runCommand("camera @s fade time 0 0.2 1.2 color 0 0 0"));
    }
  }
  if (stages > 0 || completed) system.runJob(growJob(players, stages, completed));
}

function tick() {
  const sleeping = world.getAllPlayers().filter((p) => p.isSleeping && p.dimension.id === OVERWORLD);
  if (sleeping.length === 0) {
    waiting += 1;
    if (waiting > WAKE_GRACE) finish(false);
    return;
  }
  waiting = 0;
  for (const p of sleeping) sleepers.set(p.id, p);
  const remaining = targetTime - world.getAbsoluteTime();
  if (remaining <= 0) {
    finish(true);
    return;
  }
  const speed = Math.min(MAX_STEP, MIN_STEP + elapsed * RAMP_PER_TICK);
  const step = Math.min(speed, remaining);
  world.setAbsoluteTime(world.getAbsoluteTime() + step);
  skipped += step;
  elapsed += 1;
  const clock = formatClock(world.getTimeOfDay());
  const pitch = 0.8 + (speed / MAX_STEP) * 0.8;
  for (const p of sleeping) {
    safe(() => p.onScreenDisplay.setActionBar("§b[ CHRONO-BED ] §eAccelerating Time... §7(" + clock + " / 0700)"));
    if (elapsed % 2 === 0) safe(() => p.playSound("random.click", { volume: 0.4, pitch }));
  }
  if (step >= remaining) finish(true);
}

export function startTimeLapse(player, startTime) {
  if (handle !== undefined) return false;
  if (!isNight(startTime) || player.dimension.id !== OVERWORLD) return false;
  elapsed = 0;
  waiting = 0;
  skipped = 0;
  sleepers.clear();
  targetTime = world.getAbsoluteTime() + ((MORNING - startTime + DAY_LENGTH) % DAY_LENGTH);
  handle = system.runInterval(tick, 1);
  return true;
}
