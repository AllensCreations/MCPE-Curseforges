import { world, system } from "@minecraft/server";

const CONFIG = {
  MERGE_INTERVAL: 20,            // ticks between merge scans
  PICKUP_INTERVAL: 2,            // ticks between pickup checks
  MERGE_RADIUS: 5,               // blocks
  PICKUP_RADIUS: 2.5,            // larger than vanilla (~1) so we win the race
  PICKUP_MIN_AGE: 20,            // ticks before a stack can be picked up
  DESPAWN_REFRESH_TICKS: 4800,   // respawn merged piles at 4 min (vanilla despawn = 5 min)
  MAX_ITEMS_PER_DIMENSION: 1500, // safety cap per scan
  DIMENSIONS: ["overworld", "nether", "the_end"],
  PICKUP_SOUND: "random.pop",
};

const P = {
  COUNT: "stack_count",
  REAL: "real_amount", // amount of the actual vanilla stack, used to detect vanilla merges
  AGE: "age_ticks",
  LIFE: "life_ticks",
};

// ---------- helpers ----------
function isAlive(e) {
  try {
    const v = e.isValid;
    return typeof v === "function" ? e.isValid() : !!v;
  } catch {
    return false;
  }
}

function getStack(e) {
  try {
    return e.getComponent("minecraft:item")?.itemStack;
  } catch {
    return undefined;
  }
}

function num(e, key, fallback) {
  const v = e.getDynamicProperty(key);
  return typeof v === "number" ? v : fallback;
}

function displayName(stack) {
  if (stack.nameTag) return stack.nameTag;
  return stack.typeId
    .replace(/^[^:]+:/, "")
    .split("_")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1))
    .join(" ");
}

function updateTag(e, stack, count) {
  try {
    if (count > 1) {
      const tag = `§e${displayName(stack)} §6x${count}`;
      if (e.nameTag !== tag) e.nameTag = tag;
      if ("isNameTagAlwaysVisible" in e) e.isNameTagAlwaysVisible = true;
    } else if (e.nameTag) {
      e.nameTag = "";
    }
  } catch {}
}

function writeState(e, stack, count, real, age, life) {
  e.setDynamicProperty(P.COUNT, count);
  e.setDynamicProperty(P.REAL, real);
  e.setDynamicProperty(P.AGE, age);
  e.setDynamicProperty(P.LIFE, life);
  updateTag(e, stack, count);
}

/** Reads the logical count, correcting for vanilla's own tiny-radius merging. */
function syncCount(e, stack) {
  const real = stack.amount;
  let count = num(e, P.COUNT, -1);
  const last = num(e, P.REAL, -1);
  if (count < 0) count = real;
  else if (last >= 0 && real !== last) count = Math.max(1, count + (real - last));
  return count;
}

/** Replaces an item entity (resets vanilla age, or shrinks its real stack). */
function respawn(dim, e, stack, realAmount, count, age, life) {
  const s = stack.clone();
  s.amount = realAmount;
  const fresh = dim.spawnItem(s, e.location);
  writeState(fresh, s, count, realAmount, age, life);
  e.remove();
  return fresh;
}

// ---------- merge pass ----------
function mergePass(dim) {
  let entities;
  try {
    entities = dim.getEntities({ type: "minecraft:item" });
  } catch {
    return;
  }
  if (entities.length === 0) return;
  if (entities.length > CONFIG.MAX_ITEMS_PER_DIMENSION) {
    entities = entities.slice(0, CONFIG.MAX_ITEMS_PER_DIMENSION);
  }

  const R = CONFIG.MERGE_RADIUS;
  const R2 = R * R;
  const nodes = [];
  const grid = new Map();
  const key = (x, y, z) => `${x},${y},${z}`;

  for (const e of entities) {
    if (!isAlive(e)) continue;
    const stack = getStack(e);
    if (!stack) continue;
    const pos = e.location;
    const node = { e, stack, pos, count: syncCount(e, stack), removed: false };
    nodes.push(node);
    const k = key(Math.floor(pos.x / R), Math.floor(pos.y / R), Math.floor(pos.z / R));
    const cell = grid.get(k);
    if (cell) cell.push(node);
    else grid.set(k, [node]);
  }

  // Biggest piles absorb smaller ones.
  nodes.sort((a, b) => b.count - a.count);

  for (const n of nodes) {
    if (n.removed) continue;
    const cx = Math.floor(n.pos.x / R);
    const cy = Math.floor(n.pos.y / R);
    const cz = Math.floor(n.pos.z / R);

    for (let dx = -1; dx <= 1; dx++) {
      for (let dy = -1; dy <= 1; dy++) {
        for (let dz = -1; dz <= 1; dz++) {
          const cell = grid.get(key(cx + dx, cy + dy, cz + dz));
          if (!cell) continue;
          for (const o of cell) {
            if (o === n || o.removed) continue;
            const ox = o.pos.x - n.pos.x;
            const oy = o.pos.y - n.pos.y;
            const oz = o.pos.z - n.pos.z;
            if (ox * ox + oy * oy + oz * oz > R2) continue;
            // Same typeId, aux/damage, name, lore, enchantments, etc.
            if (!n.stack.isStackableWith(o.stack)) continue;
            n.count += o.count;
            o.removed = true;
            try {
              o.e.remove();
            } catch {}
          }
        }
      }
    }
  }

  // Persist state, refresh nametags and despawn timers.
  for (const n of nodes) {
    if (n.removed || !isAlive(n.e)) continue;
    const age = num(n.e, P.AGE, 0);
    const life = num(n.e, P.LIFE, 0);
    const real = n.stack.amount;

    if (n.count > 1 && life + CONFIG.MERGE_INTERVAL >= CONFIG.DESPAWN_REFRESH_TICKS) {
      respawn(dim, n.e, n.stack, real, n.count, age + CONFIG.MERGE_INTERVAL, 0);
    } else {
      writeState(n.e, n.stack, n.count, real, age + CONFIG.MERGE_INTERVAL, life + CONFIG.MERGE_INTERVAL);
    }
  }
}

// ---------- pickup ----------
/** Inserts up to `count` items, respecting maxAmount. Returns how many actually fit. */
function giveToPlayer(container, stack, count) {
  const max = stack.maxAmount;
  let given = 0;
  while (given < count) {
    const chunk = Math.min(max, count - given);
    const s = stack.clone();
    s.amount = chunk;
    const leftover = container.addItem(s);
    if (leftover) {
      given += chunk - leftover.amount;
      break;
    }
    given += chunk;
  }
  return given;
}

function canPickUp(player) {
  if (!isAlive(player)) return false;
  try {
    const hp = player.getComponent("minecraft:health");
    if (hp && hp.currentValue <= 0) return false;
    if (typeof player.getGameMode === "function" && player.getGameMode() === "spectator") return false;
  } catch {}
  return true;
}

function pickupPass() {
  for (const player of world.getAllPlayers()) {
    if (!canPickUp(player)) continue;
    const container = player.getComponent("minecraft:inventory")?.container;
    if (!container) continue;

    let items;
    try {
      items = player.dimension.getEntities({
        type: "minecraft:item",
        location: player.location,
        maxDistance: CONFIG.PICKUP_RADIUS,
      });
    } catch {
      continue;
    }

    for (const item of items) {
      if (!isAlive(item)) continue;
      const count = num(item, P.COUNT, 0);
      if (count <= 1) continue; // normal items: vanilla handles them
      if (num(item, P.AGE, 0) < CONFIG.PICKUP_MIN_AGE) continue;
      const stack = getStack(item);
      if (!stack) continue;

      const given = giveToPlayer(container, stack, count);
      if (given <= 0) continue;

      const remaining = count - given;
      const age = num(item, P.AGE, 0);
      const life = num(item, P.LIFE, 0);

      if (remaining <= 0) {
        item.remove();
      } else if (stack.amount > remaining) {
        // Real stack must never exceed the logical count, or vanilla pickup would duplicate items.
        respawn(player.dimension, item, stack, remaining, remaining, age, life);
      } else {
        writeState(item, stack, remaining, stack.amount, age, life);
      }

      try {
        player.playSound(CONFIG.PICKUP_SOUND, { volume: 0.35, pitch: 1.2 + Math.random() * 0.5 });
      } catch {}
    }
  }
}

// ---------- loops ----------
system.runInterval(() => {
  for (const id of CONFIG.DIMENSIONS) {
    try {
      mergePass(world.getDimension(id));
    } catch (err) {
      console.warn(`[ItemStacker] merge error in ${id}: ${err}`);
    }
  }
}, CONFIG.MERGE_INTERVAL);

system.runInterval(() => {
  try {
    pickupPass();
  } catch (err) {
    console.warn(`[ItemStacker] pickup error: ${err}`);
  }
}, CONFIG.PICKUP_INTERVAL);

console.warn("[ItemStacker] Infinite Ground Item Stacker loaded.");
