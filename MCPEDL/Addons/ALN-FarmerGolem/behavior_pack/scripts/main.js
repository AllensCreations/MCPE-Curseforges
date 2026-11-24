import { world, system, ItemStack, EntityComponentTypes, BlockPermutation } from "@minecraft/server";

const GOLEM_ID = "aln:farmer_golem";
const BARREL_ID = "minecraft:barrel";
const LEGACY_CHEST_ID = "aln:farmer_chest";
const LEGACY_STORAGE_ID = "aln:farmer_chest_storage";
const HOME_PREFIX = "aln_home:";
const GOLEM_NAME = "§e§lFarmer Golem";
const STATUS_EVENT = "aln:golem_status";
const DIMENSION_IDS = ["overworld", "nether", "the_end"];

const BRAIN_INTERVAL = 10;
const MOVE_INTERVAL = 2;
const SCAN_RADIUS = 4;
const STEP_LENGTH = 0.4;
const HARVEST_REACH = 1.8;
const BREED_REACH = 3.2;
const IDLE_RADIUS = 6;
const PATROL_RADIUS = 10;
const LEASH_RADIUS = 16;
const BREED_COOLDOWN = 6000;
const BLOCKED_COOLDOWN = 1200;
const HEAL_COOLDOWN = 80;
const HEAL_THRESHOLD = 6;
const HERD_LIMIT = 14;
const HERD_RADIUS = 10;
const MATURE_GROWTH = 7;
const MISS_LIMIT = 3;
const FAILURE_LIMIT = 3;
const NOTICE_COOLDOWN = 600;
const NOTICE_RADIUS = 16;

const roll = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const center = (p) => ({ x: p.x + 0.5, y: p.y + 0.5, z: p.z + 0.5 });
const flat = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const keyOf = (p) => `${p.x},${p.y},${p.z}`;
const attempt = (fn) => {
  try {
    return fn();
  } catch (e) {
    return undefined;
  }
};

const CROPS = {
  "minecraft:wheat": () => [["minecraft:wheat", 1], ["minecraft:wheat_seeds", roll(0, 3)]],
  "minecraft:carrots": () => [["minecraft:carrot", roll(1, 4)]],
  "minecraft:potatoes": () => [["minecraft:potato", roll(1, 4)]],
  "minecraft:beetroot": () => [["minecraft:beetroot", 1], ["minecraft:beetroot_seeds", roll(0, 3)]],
};

const FREE_BLOCKS = new Set([
  "minecraft:short_grass",
  "minecraft:tallgrass",
  "minecraft:fern",
  ...Object.keys(CROPS),
]);

const LIVESTOCK = {
  "minecraft:cow": ["minecraft:wheat"],
  "minecraft:sheep": ["minecraft:wheat"],
  "minecraft:pig": ["minecraft:carrot", "minecraft:potato", "minecraft:beetroot"],
  "minecraft:chicken": ["minecraft:wheat_seeds", "minecraft:beetroot_seeds", "minecraft:pumpkin_seeds", "minecraft:melon_seeds"],
};

const HEAL_FOODS = [
  ["minecraft:apple", 4],
  ["minecraft:bread", 5],
  ["minecraft:baked_potato", 5],
  ["minecraft:cooked_beef", 7],
  ["minecraft:cooked_porkchop", 7],
  ["minecraft:cooked_chicken", 6],
  ["minecraft:cooked_mutton", 6],
  ["minecraft:carrot", 3],
];

const known = new Map();
const goals = new Map();
const homes = new Map();
const misses = new Map();
const failures = new Map();
const notices = new Map();
const lastError = new Map();
const healAt = new Map();
const cooldowns = new Map();
const blocked = new Map();

function forget(id) {
  known.delete(id);
  goals.delete(id);
  homes.delete(id);
  misses.delete(id);
  failures.delete(id);
  notices.delete(id);
  lastError.delete(id);
  healAt.delete(id);
}

function burst(dim, at, particle, count, spread) {
  for (let i = 0; i < count; i++) {
    attempt(() =>
      dim.spawnParticle(particle, {
        x: at.x + (Math.random() - 0.5) * spread,
        y: at.y + Math.random() * spread,
        z: at.z + (Math.random() - 0.5) * spread,
      })
    );
  }
}

const sound = (dim, id, at) => attempt(() => dim.playSound(id, at));

function notify(golem, text, key) {
  const now = system.currentTick;
  const slot = `${golem.id}:${key}`;
  if ((notices.get(slot) ?? 0) > now) return;
  notices.set(slot, now + NOTICE_COOLDOWN);
  attempt(() => {
    const players = golem.dimension.getEntities({
      type: "minecraft:player",
      location: golem.location,
      maxDistance: NOTICE_RADIUS,
    });
    for (const player of players) player.onScreenDisplay.setActionBar(text);
  });
}

function fail(golem, error) {
  const message = error && error.message ? error.message : String(error);
  lastError.set(golem.id, message);
  const count = (failures.get(golem.id) ?? 0) + 1;
  failures.set(golem.id, count);
  if (count < FAILURE_LIMIT) return;
  attempt(() => console.warn(`[ALN FarmerGolem] ${message}`));
  notify(golem, `§cFarmer Golem problem: ${message}`, "error");
}

const containerOf = (storage) => storage.getComponent(EntityComponentTypes.Inventory)?.container;

function chestContainer(block) {
  const part = attempt(() => block.getComponent("minecraft:inventory")) ?? attempt(() => block.getComponent("inventory"));
  return part?.container;
}

function countOf(container, id) {
  let total = 0;
  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (item && item.typeId === id) total += item.amount;
  }
  return total;
}

function freeSlots(container) {
  let free = 0;
  for (let i = 0; i < container.size; i++) if (!container.getItem(i)) free++;
  return free;
}

function takeOne(container, id) {
  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (!item || item.typeId !== id) continue;
    if (item.amount > 1) {
      item.amount -= 1;
      container.setItem(i, item);
    } else {
      container.setItem(i, undefined);
    }
    return true;
  }
  return false;
}

function deposit(container, dim, at, id, amount) {
  if (amount <= 0) return false;
  const left = container.addItem(new ItemStack(id, amount));
  if (!left) return false;
  dim.spawnItem(left, at);
  return true;
}

function homeOf(golem) {
  const cached = homes.get(golem.id);
  if (cached) return cached;
  for (const tag of golem.getTags()) {
    if (!tag.startsWith(HOME_PREFIX)) continue;
    const [x, y, z] = tag.slice(HOME_PREFIX.length).split(",").map(Number);
    if ([x, y, z].every(Number.isFinite)) {
      const home = { x, y, z };
      homes.set(golem.id, home);
      return home;
    }
  }
  return undefined;
}

function placeBarrel(block) {
  try {
    block.setPermutation(BlockPermutation.resolve(BARREL_ID, { facing_direction: 1, open_bit: false }));
  } catch (e) {
    block.setType(BARREL_ID);
  }
}

function migrate(dim, block, home) {
  const at = center(home);
  const storage = dim.getEntities({ type: LEGACY_STORAGE_ID, location: at, maxDistance: 2.5 })[0];
  const source = storage ? containerOf(storage) : undefined;
  const items = [];
  if (source) {
    for (let i = 0; i < source.size; i++) {
      const item = source.getItem(i);
      if (item) items.push(item);
    }
  }
  placeBarrel(block);
  const target = chestContainer(dim.getBlock(home));
  for (const item of items) {
    const left = target ? target.addItem(item) : item;
    if (left) dim.spawnItem(left, at);
  }
  if (source) attempt(() => source.clearAll());
  if (storage) storage.remove();
}

function isFree(dim, x, y, z) {
  const block = dim.getBlock({ x, y, z });
  return !!block && (block.isAir || FREE_BLOCKS.has(block.typeId));
}

function stepToward(golem, from, goal) {
  const dim = golem.dimension;
  const dist = flat(from, goal);
  if (dist <= 0.5) return "arrived";
  const length = Math.min(STEP_LENGTH, dist);
  const nx = from.x + ((goal.x - from.x) / dist) * length;
  const nz = from.z + ((goal.z - from.z) / dist) * length;
  const bx = Math.floor(nx);
  const bz = Math.floor(nz);
  const by = Math.floor(from.y + 0.05);
  let ny;
  if (isFree(dim, bx, by, bz)) ny = by;
  else if (isFree(dim, bx, by + 1, bz)) ny = by + 1;
  else return "blocked";
  const target = { x: nx, y: ny, z: nz };
  try {
    golem.teleport(target, { facingLocation: { x: goal.x, y: ny + 1.6, z: goal.z } });
  } catch (e) {
    golem.teleport(target);
  }
  return "moving";
}

function move() {
  for (const [id, goal] of goals) {
    const golem = known.get(id);
    const from = golem ? attempt(() => golem.location) : undefined;
    if (!from) {
      forget(id);
      continue;
    }
    const result = attempt(() => stepToward(golem, from, goal));
    if (result === "moving") continue;
    if (result !== "arrived" && goal.key) blocked.set(goal.key, system.currentTick + BLOCKED_COOLDOWN);
    goals.delete(id);
  }
}

function tryHeal(golem, dim, container) {
  const health = golem.getComponent(EntityComponentTypes.Health);
  if (!health || health.currentValue > health.effectiveMax - HEAL_THRESHOLD) return false;
  const now = system.currentTick;
  if ((healAt.get(golem.id) ?? 0) > now) return false;
  for (const [id, amount] of HEAL_FOODS) {
    if (!takeOne(container, id)) continue;
    health.setCurrentValue(Math.min(health.effectiveMax, health.currentValue + amount));
    healAt.set(golem.id, now + HEAL_COOLDOWN);
    const at = golem.location;
    burst(dim, { x: at.x, y: at.y + 1.2, z: at.z }, "minecraft:heart_particle", 4, 1.2);
    burst(dim, { x: at.x, y: at.y + 0.5, z: at.z }, "minecraft:villager_happy", 8, 1.2);
    sound(dim, "random.eat", at);
    return true;
  }
  return false;
}

function findCrop(dim, golem, home) {
  const p = golem.location;
  const bx = Math.floor(p.x);
  const by = Math.floor(p.y + 0.05);
  const bz = Math.floor(p.z);
  const now = system.currentTick;
  const origin = center(home);
  let best;
  let bestDist = Infinity;
  for (let dx = -SCAN_RADIUS; dx <= SCAN_RADIUS; dx++) {
    for (let dz = -SCAN_RADIUS; dz <= SCAN_RADIUS; dz++) {
      for (let dy = -1; dy <= 1; dy++) {
        const pos = { x: bx + dx, y: by + dy, z: bz + dz };
        const block = dim.getBlock(pos);
        if (!block || !CROPS[block.typeId]) continue;
        if (block.permutation.getState("growth") !== MATURE_GROWTH) continue;
        if ((blocked.get(keyOf(pos)) ?? 0) > now) continue;
        const spot = center(pos);
        if (flat(spot, origin) > LEASH_RADIUS) continue;
        const d = flat(p, spot);
        if (d < bestDist) {
          best = block;
          bestDist = d;
        }
      }
    }
  }
  return best;
}

function harvest(golem, dim, block, container, home) {
  const drops = CROPS[block.typeId]();
  const at = center(block.location);
  block.setPermutation(block.permutation.withState("growth", 0));
  const dropAt = { x: home.x + 0.5, y: home.y + 1.2, z: home.z + 0.5 };
  let overflow = false;
  for (const [id, amount] of drops) if (deposit(container, dim, dropAt, id, amount)) overflow = true;
  burst(dim, at, "minecraft:villager_happy", 6, 0.8);
  sound(dim, "random.pop", at);
  if (overflow) notify(golem, "§eThe Farmer Chest is full. Empty it so the harvest fits.", "full");
}

function findPair(dim, golem, container) {
  const now = system.currentTick;
  for (const [type, foods] of Object.entries(LIVESTOCK)) {
    if (!foods.some((id) => countOf(container, id) > 0)) continue;
    const herd = dim.getEntities({ type, location: golem.location, maxDistance: HERD_RADIUS });
    if (herd.length >= HERD_LIMIT) continue;
    const ready = herd.filter(
      (a) =>
        !a.getComponent(EntityComponentTypes.IsBaby) &&
        (cooldowns.get(a.id) ?? 0) <= now &&
        (blocked.get(a.id) ?? 0) <= now
    );
    if (ready.length < 2) continue;
    const from = golem.location;
    ready.sort((a, b) => flat(from, a.location) - flat(from, b.location));
    const first = ready[0];
    const second = ready
      .slice(1)
      .sort((a, b) => flat(first.location, a.location) - flat(first.location, b.location))[0];
    return { type, foods, first, second };
  }
  return undefined;
}

function breed(dim, container, pair) {
  const food = pair.foods.find((id) => countOf(container, id) > 0);
  if (!food) return;
  const a = pair.first.location;
  const b = pair.second.location;
  const mid = { x: (a.x + b.x) / 2, y: Math.max(a.y, b.y), z: (a.z + b.z) / 2 };
  try {
    dim.spawnEntity(`${pair.type}<minecraft:entity_born>`, mid);
  } catch (e) {
    return;
  }
  takeOne(container, food);
  const until = system.currentTick + BREED_COOLDOWN;
  cooldowns.set(pair.first.id, until);
  cooldowns.set(pair.second.id, until);
  burst(dim, { x: a.x, y: a.y + 0.8, z: a.z }, "minecraft:heart_particle", 5, 1);
  burst(dim, { x: b.x, y: b.y + 0.8, z: b.z }, "minecraft:heart_particle", 5, 1);
}

function dismantle(golem, dim, home) {
  const at = center(home);
  dim.spawnItem(new ItemStack("minecraft:carved_pumpkin", 1), at);
  burst(dim, at, "minecraft:villager_happy", 12, 1.2);
  forget(golem.id);
  golem.remove();
}

function brain(golem) {
  const home = homeOf(golem);
  if (!home) return;
  const dim = golem.dimension;
  const block = dim.getBlock(home);
  if (!block) return;

  if (block.typeId === LEGACY_CHEST_ID) {
    migrate(dim, block, home);
    return;
  }
  if (block.typeId !== BARREL_ID) {
    const count = (misses.get(golem.id) ?? 0) + 1;
    misses.set(golem.id, count);
    if (count >= MISS_LIMIT) dismantle(golem, dim, home);
    return;
  }
  misses.set(golem.id, 0);

  const container = chestContainer(block);
  if (!container) throw new Error("the Farmer Chest has no inventory");

  if (tryHeal(golem, dim, container)) {
    goals.delete(golem.id);
    return;
  }

  const here = golem.location;
  const homeSpot = center(home);

  if (flat(here, homeSpot) > LEASH_RADIUS) {
    goals.set(golem.id, { x: homeSpot.x, z: homeSpot.z + 1.5 });
    return;
  }

  const crop = findCrop(dim, golem, home);
  if (crop) {
    const spot = center(crop.location);
    if (flat(here, spot) <= HARVEST_REACH) {
      harvest(golem, dim, crop, container, home);
      goals.delete(golem.id);
    } else {
      goals.set(golem.id, { x: spot.x, z: spot.z, key: keyOf(crop.location) });
    }
    return;
  }

  const pair = findPair(dim, golem, container);
  if (pair) {
    const target = pair.first.location;
    if (flat(here, target) <= BREED_REACH) {
      breed(dim, container, pair);
      goals.delete(golem.id);
    } else {
      goals.set(golem.id, { x: target.x, z: target.z, key: pair.first.id });
    }
    return;
  }

  if (goals.has(golem.id)) return;
  if (flat(here, homeSpot) > IDLE_RADIUS) {
    goals.set(golem.id, { x: homeSpot.x, z: homeSpot.z + 1.5 });
  } else if (Math.random() < 0.3) {
    const angle = Math.random() * Math.PI * 2;
    const radius = 3 + Math.random() * (PATROL_RADIUS - 3);
    goals.set(golem.id, { x: homeSpot.x + Math.cos(angle) * radius, z: homeSpot.z + Math.sin(angle) * radius });
  }
}

function purge() {
  const now = system.currentTick;
  for (const [id, until] of cooldowns) if (until <= now) cooldowns.delete(id);
  for (const [id, until] of blocked) if (until <= now) blocked.delete(id);
  for (const [id, until] of notices) if (until <= now) notices.delete(id);
}

function build(player, dim, top, base) {
  const spot = base.location;
  const cx = spot.x + 0.5;
  const cz = spot.z + 0.5;
  top.setType("minecraft:air");
  placeBarrel(base);
  const golem = dim.spawnEntity(GOLEM_ID, { x: cx, y: spot.y + 1, z: cz });
  golem.nameTag = GOLEM_NAME;
  golem.addTag(`${HOME_PREFIX}${spot.x},${spot.y},${spot.z}`);
  homes.set(golem.id, { x: spot.x, y: spot.y, z: spot.z });
  known.set(golem.id, golem);
  const at = { x: cx, y: spot.y + 1, z: cz };
  attempt(() => player.playSound("pumpkin.carve"));
  sound(dim, "pumpkin.carve", at);
  burst(dim, at, "minecraft:basic_flame_particle", 24, 1.6);
  burst(dim, at, "minecraft:villager_happy", 16, 1.6);
  player.onScreenDisplay.setActionBar(
    "§6§lFarmer Golem§r§e awakens. Tap the Farmer Chest to store seeds, wheat, carrots and food."
  );
}

function describe(golem) {
  const home = homeOf(golem);
  const loc = golem.location;
  const lines = [`§6Farmer Golem at ${Math.floor(loc.x)}, ${Math.floor(loc.y)}, ${Math.floor(loc.z)}`];
  if (!home) return lines.concat("§cno home chest recorded");
  const dim = golem.dimension;
  const block = attempt(() => dim.getBlock(home));
  if (!block) return lines.concat(`§echest at ${home.x}, ${home.y}, ${home.z}: chunk not loaded`);
  lines.push(`§echest at ${home.x}, ${home.y}, ${home.z}: ${block.typeId}`);
  if (block.typeId === BARREL_ID) {
    const container = chestContainer(block);
    if (container) {
      lines.push(`§echest free slots: ${freeSlots(container)} of ${container.size}`);
    } else {
      lines.push("§cchest inventory not readable");
    }
  }
  const crop = attempt(() => findCrop(dim, golem, home));
  lines.push(`§eripe crop in reach: ${crop ? "yes" : "no"}`);
  lines.push(`§egoal: ${goals.has(golem.id) ? "walking" : "none"}`);
  lines.push(`§elast problem: ${lastError.get(golem.id) ?? "none"}`);
  return lines;
}

world.afterEvents.playerPlaceBlock.subscribe((event) => {
  const { block, player } = event;
  if (block.typeId !== "minecraft:carved_pumpkin") return;
  const dim = block.dimension;
  const base = dim.getBlock({ x: block.x, y: block.y - 1, z: block.z });
  if (!base || base.typeId !== "minecraft:hay_block") return;
  build(player, dim, block, base);
});

system.afterEvents.scriptEventReceive.subscribe((event) => {
  if (event.id !== STATUS_EVENT) return;
  const source = event.sourceEntity;
  if (!source) return;
  const dim = source.dimension;
  const golems = dim.getEntities({ type: GOLEM_ID, location: source.location, maxDistance: 64 });
  const send = (text) => attempt(() => source.sendMessage(text));
  if (golems.length === 0) send("§cNo Farmer Golem within 64 blocks.");
  for (const golem of golems) for (const line of describe(golem)) send(line);
});

system.runInterval(() => {
  if (system.currentTick % 1200 < BRAIN_INTERVAL) purge();
  for (const id of DIMENSION_IDS) {
    const dim = attempt(() => world.getDimension(id));
    if (!dim) continue;
    const golems = attempt(() => dim.getEntities({ type: GOLEM_ID })) ?? [];
    for (const golem of golems) {
      known.set(golem.id, golem);
      try {
        brain(golem);
        failures.set(golem.id, 0);
      } catch (e) {
        fail(golem, e);
      }
    }
  }
}, BRAIN_INTERVAL);

system.runInterval(move, MOVE_INTERVAL);
