import { world, system } from "@minecraft/server";

const VERSION = "1.0.0";
const MESSAGE_NO_SEED = "Harvest Intelligence: No planting item available; crop harvested normally.";

// Only crops with known, supported vanilla block states are handled here.
// Fruit blocks (melon/pumpkin) are not replanted because their stems remain.
const REPLANT_RULES = new Map([
  ["minecraft:wheat", { item: "minecraft:wheat_seeds", state: "growth", mature: 7, plant: "minecraft:wheat", soil: "farmland" }],
  ["minecraft:carrots", { item: "minecraft:carrot", state: "growth", mature: 7, plant: "minecraft:carrots", soil: "farmland" }],
  ["minecraft:potatoes", { item: "minecraft:potato", state: "growth", mature: 7, plant: "minecraft:potatoes", soil: "farmland" }],
  ["minecraft:beetroot", { item: "minecraft:beetroot_seeds", state: "growth", mature: 3, plant: "minecraft:beetroot", soil: "farmland" }],
  ["minecraft:nether_wart", { item: "minecraft:nether_wart", state: "age", mature: 3, plant: "minecraft:nether_wart", soil: "soul_sand" }],
  ["minecraft:melon_stem", { item: "minecraft:melon_seeds", state: "growth", mature: 7, plant: "minecraft:melon_stem", soil: "farmland" }],
  ["minecraft:pumpkin_stem", { item: "minecraft:pumpkin_seeds", state: "growth", mature: 7, plant: "minecraft:pumpkin_stem", soil: "farmland" }],
  ["minecraft:attached_melon_stem", { item: "minecraft:melon_seeds", alwaysMature: true, plant: "minecraft:melon_stem", plantState: "growth", plantAge: 0, soil: "farmland" }],
  ["minecraft:attached_pumpkin_stem", { item: "minecraft:pumpkin_seeds", alwaysMature: true, plant: "minecraft:pumpkin_stem", plantState: "growth", plantAge: 0, soil: "farmland" }],
  ["minecraft:torchflower_crop", { item: "minecraft:torchflower_seeds", state: "growth", mature: 1, plant: "minecraft:torchflower_crop", soil: "farmland" }],
  ["minecraft:pitcher_crop", { item: "minecraft:pitcher_pod", state: "growth", mature: 4, plant: "minecraft:pitcher_crop", soil: "farmland", multiBlock: true }],
  ["minecraft:sweet_berry_bush", { item: "minecraft:sweet_berries", state: "age", mature: 3, plant: "minecraft:sweet_berry_bush", soil: "plantable" }],
  ["minecraft:cocoa", { item: "minecraft:cocoa_beans", state: "age", mature: 2, plant: "minecraft:cocoa", soil: "attached" }],
]);

const PROTECTED_CROPS = new Set([
  "minecraft:wheat",
  "minecraft:carrots",
  "minecraft:potatoes",
  "minecraft:beetroot",
  "minecraft:melon_stem",
  "minecraft:pumpkin_stem",
  "minecraft:attached_melon_stem",
  "minecraft:attached_pumpkin_stem",
  "minecraft:torchflower_crop",
  "minecraft:pitcher_crop",
]);

const cropSnapshots = new Map();
const intentionalBreaks = new Map();
const recentInteractions = new Map();
const MAX_SNAPSHOTS = 512;
const PROTECTION_SCAN_INTERVAL = 2;
const PROTECTION_HORIZONTAL_RADIUS = 1;
const PROTECTION_VERTICAL_RADIUS = 1;
const RESTORE_CONFIRM_TICKS = 1;
const SNAPSHOT_MAX_AGE = 4;

function keyFor(dimensionId, location) {
  return dimensionId + ":" + location.x + "," + location.y + "," + location.z;
}

function getState(permutation, stateName) {
  try {
    return permutation.getState(stateName);
  } catch {
    return undefined;
  }
}

function isMature(permutation, rule) {
  if (rule.alwaysMature) return true;
  const state = getState(permutation, rule.state);
  return typeof state === "number" && state >= rule.mature;
}

function getInventory(player) {
  try {
    return player.getComponent("minecraft:inventory")?.container;
  } catch {
    return undefined;
  }
}

function findItemSlot(container, typeId) {
  if (!container) return -1;
  for (let slot = 0; slot < container.size; slot++) {
    const item = container.getItem(slot);
    if (item?.typeId === typeId && item.amount > 0) return slot;
  }
  return -1;
}

function hasPlantableSoil(dimension, location, rule) {
  try {
    const below = dimension.getBlock({ x: location.x, y: location.y - 1, z: location.z });
    if (!below) return false;

    if (rule.soil === "farmland") return below.typeId === "minecraft:farmland";
    if (rule.soil === "soul_sand") return below.typeId === "minecraft:soul_sand";
    if (rule.soil === "plantable") {
      return new Set([
        "minecraft:grass_block",
        "minecraft:dirt",
        "minecraft:coarse_dirt",
        "minecraft:podzol",
        "minecraft:rooted_dirt",
        "minecraft:moss_block",
        "minecraft:farmland",
      ]).has(below.typeId);
    }
    if (rule.soil === "attached") return true; // The original cocoa pod's attachment is validated by the saved permutation.
  } catch {}
  return false;
}

function consumeOne(container, slot) {
  const stack = container.getItem(slot);
  if (!stack || stack.amount < 1) return false;
  if (stack.amount === 1) {
    container.setItem(slot, undefined);
  } else {
    stack.amount -= 1;
    container.setItem(slot, stack);
  }
  return true;
}

function placeFreshCrop(dimension, block, originalPermutation, originalType, rule) {
  if (!block || block.typeId !== "minecraft:air") return false;

  try {
    if (originalType === "minecraft:cocoa") {
      block.setPermutation(originalPermutation.withState("age", 0));
      return block.typeId === "minecraft:cocoa";
    }

    if (rule.multiBlock) {
      const above = dimension.getBlock({ x: block.location.x, y: block.location.y + 1, z: block.location.z });
      if (!above || above.typeId !== "minecraft:air") return false;
    }

    block.setType(rule.plant);
    if (rule.plantState) {
      block.setPermutation(block.permutation.withState(rule.plantState, rule.plantAge));
    } else if (rule.state) {
      block.setPermutation(block.permutation.withState(rule.state, 0));
    }
    return block.typeId === rule.plant;
  } catch {
    // Do not leave a partially placed crop if a block state is unsupported.
    try {
      if (block.typeId === rule.plant) block.setType("minecraft:air");
    } catch {}
    return false;
  }
}

function notifyNoSeed(player) {
  try {
    player.onScreenDisplay.setActionBar(MESSAGE_NO_SEED);
  } catch {
    try { player.sendMessage(MESSAGE_NO_SEED); } catch {}
  }
}

function handleCropBreak(event) {
  const originalPermutation = event.brokenBlockPermutation;
  const originalType = originalPermutation?.type?.id;
  if (!originalType) return;

  const location = event.block.location;
  const dimension = event.dimension;
  const locationKey = keyFor(dimension.id, location);
  intentionalBreaks.set(locationKey, system.currentTick + 4);

  const rule = REPLANT_RULES.get(originalType);
  if (!rule || !isMature(originalPermutation, rule)) return;

  // Pitcher crop is two blocks tall. Breaking its upper half must not create a new plant.
  if (rule.multiBlock && getState(originalPermutation, "upper_block_bit") === true) return;

  system.run(() => {
    try {
      const player = event.player;
      const block = dimension.getBlock(location);
      if (!block || block.typeId !== "minecraft:air") return;
      if (!hasPlantableSoil(dimension, location, rule)) return;

      const container = getInventory(player);
      const slot = findItemSlot(container, rule.item);
      if (slot < 0) {
        notifyNoSeed(player);
        return;
      }

      if (!placeFreshCrop(dimension, block, originalPermutation, originalType, rule)) return;
      if (!consumeOne(container, slot)) {
        // If inventory changed unexpectedly, remove the unconsumed crop to avoid free planting.
        try { block.setType("minecraft:air"); } catch {}
      }
    } catch {
      // The player may leave, the chunk may unload, or inventory access may fail.
    }
  });
}

function isCropOnFarmland(dimension, location) {
  try {
    const crop = dimension.getBlock(location);
    if (!crop || !PROTECTED_CROPS.has(crop.typeId)) return null;
    const soil = dimension.getBlock({ x: location.x, y: location.y - 1, z: location.z });
    if (!soil || soil.typeId !== "minecraft:farmland") return null;
    return { crop, soil };
  } catch {
    return null;
  }
}

function rememberNearbyCrops(player, tick, seen) {
  const dimension = player.dimension;
  const centerX = Math.floor(player.location.x);
  const centerY = Math.floor(player.location.y);
  const centerZ = Math.floor(player.location.z);

  for (let dx = -PROTECTION_HORIZONTAL_RADIUS; dx <= PROTECTION_HORIZONTAL_RADIUS; dx++) {
    for (let dz = -PROTECTION_HORIZONTAL_RADIUS; dz <= PROTECTION_HORIZONTAL_RADIUS; dz++) {
      for (let dy = -PROTECTION_VERTICAL_RADIUS; dy <= PROTECTION_VERTICAL_RADIUS; dy++) {
        const location = { x: centerX + dx, y: centerY + dy, z: centerZ + dz };
        const found = isCropOnFarmland(dimension, location);
        if (!found) continue;

        const key = keyFor(dimension.id, location);
        seen.add(key);
        cropSnapshots.set(key, {
          key,
          dimensionId: dimension.id,
          location,
          cropType: found.crop.typeId,
          cropPermutation: found.crop.permutation,
          soilPermutation: found.soil.permutation,
          lastSeenTick: tick,
          missingSinceTick: undefined,
        });
      }
    }
  }
}

function isPlayerNearSnapshot(players, snapshot) {
  return players.some((player) => {
    try {
      if (player.dimension.id !== snapshot.dimensionId) return false;
      const pos = player.location;
      return Math.abs(pos.x - (snapshot.location.x + 0.5)) <= 1.6
        && Math.abs(pos.z - (snapshot.location.z + 0.5)) <= 1.6
        && Math.abs(pos.y - snapshot.location.y) <= 2.5;
    } catch {
      return false;
    }
  });
}

function wasRecentlyInteracted(snapshot, tick) {
  const cropKey = snapshot.key;
  const soilKey = keyFor(snapshot.dimensionId, {
    x: snapshot.location.x,
    y: snapshot.location.y - 1,
    z: snapshot.location.z,
  });
  return (intentionalBreaks.get(cropKey) ?? -1) >= tick
    || (recentInteractions.get(cropKey) ?? -1) >= tick
    || (recentInteractions.get(soilKey) ?? -1) >= tick;
}

function restoreTrampledCrop(snapshot, dimension) {
  try {
    const crop = dimension.getBlock(snapshot.location);
    const soilLocation = { x: snapshot.location.x, y: snapshot.location.y - 1, z: snapshot.location.z };
    const soil = dimension.getBlock(soilLocation);
    if (!crop || !soil || crop.typeId !== "minecraft:air" || soil.typeId !== "minecraft:dirt") return false;

    soil.setPermutation(snapshot.soilPermutation);
    crop.setPermutation(snapshot.cropPermutation);
    return soil.typeId === "minecraft:farmland" && crop.typeId === snapshot.cropType;
  } catch {
    return false;
  }
}

function protectCropsFromTrampling() {
  const tick = system.currentTick;
  let players = [];
  try { players = world.getAllPlayers(); } catch { return; }

  const seen = new Set();
  for (const player of players) rememberNearbyCrops(player, tick, seen);

  for (const [key, snapshot] of cropSnapshots) {
    if (seen.has(key)) continue;

    if (!isPlayerNearSnapshot(players, snapshot)) {
      if (tick - snapshot.lastSeenTick > 1) cropSnapshots.delete(key);
      continue;
    }

    let dimension;
    let crop;
    let soil;
    try {
      dimension = world.getDimension(snapshot.dimensionId);
      crop = dimension.getBlock(snapshot.location);
      soil = dimension.getBlock({ x: snapshot.location.x, y: snapshot.location.y - 1, z: snapshot.location.z });
    } catch {
      cropSnapshots.delete(key);
      continue;
    }

    if (!crop || !soil) {
      cropSnapshots.delete(key);
      continue;
    }

    // If the crop still exists, keep its newest state; it may simply be outside the small scan window.
    if (crop.typeId === snapshot.cropType && soil.typeId === "minecraft:farmland") {
      snapshot.cropPermutation = crop.permutation;
      snapshot.soilPermutation = soil.permutation;
      snapshot.lastSeenTick = tick;
      snapshot.missingSinceTick = undefined;
      continue;
    }

    // Only restore a recently tracked crop when farmland became dirt and the crop disappeared.
    // Intentional block breaks/interactions are excluded to avoid undoing normal player actions.
    if (crop.typeId === "minecraft:air" && soil.typeId === "minecraft:dirt") {
      if (wasRecentlyInteracted(snapshot, tick)) {
        cropSnapshots.delete(key);
        continue;
      }
      if (snapshot.missingSinceTick === undefined) {
        snapshot.missingSinceTick = tick;
        continue;
      }
      if (tick - snapshot.missingSinceTick >= RESTORE_CONFIRM_TICKS
        && tick - snapshot.lastSeenTick <= SNAPSHOT_MAX_AGE) {
        if (!restoreTrampledCrop(snapshot, dimension)) {
          // Keep trying only while the player is still close and the snapshot is fresh.
          if (tick - snapshot.lastSeenTick > SNAPSHOT_MAX_AGE) cropSnapshots.delete(key);
        } else {
          cropSnapshots.delete(key);
        }
      }
      continue;
    }

    // Any other change is not confidently identifiable as accidental trampling.
    if (tick - snapshot.lastSeenTick > SNAPSHOT_MAX_AGE) cropSnapshots.delete(key);
  }

  for (const [key, expiry] of intentionalBreaks) if (expiry < tick) intentionalBreaks.delete(key);
  for (const [key, expiry] of recentInteractions) if (expiry < tick) recentInteractions.delete(key);

  while (cropSnapshots.size > MAX_SNAPSHOTS) {
    cropSnapshots.delete(cropSnapshots.keys().next().value);
  }
}

world.afterEvents.playerBreakBlock.subscribe(handleCropBreak);

world.afterEvents.playerInteractWithBlock.subscribe((event) => {
  const key = keyFor(event.player.dimension.id, event.block.location);
  recentInteractions.set(key, system.currentTick + 3);
});

system.runInterval(protectCropsFromTrampling, PROTECTION_SCAN_INTERVAL);

console.warn("[Harvest Intelligence] v" + VERSION + " initialized.");
