import { world, system, ItemStack } from "@minecraft/server";

const DEFAULT_MODE = "simple";
const DEFAULT_THRESHOLD = 8;
const ANIM = "animation.player.attack_bare_hand";

const CLUTCH_REGISTRY = {
  "minecraft:water_bucket": { name: "Water Bucket", category: "water", placeSound: "bucket.empty_water" },
  "minecraft:powder_snow_bucket": { name: "Powder Snow Bucket", category: "powder_snow", placeSound: "bucket.empty_powder_snow" },
  "minecraft:twisting_vines": { name: "Twisting Vines", category: "vines", blockId: "minecraft:twisting_vines", placeSound: "dig.grass" },
  "minecraft:hay_block": { name: "Hay Bale", category: "block", blockId: "minecraft:hay_block", placeSound: "dig.grass" },
  "minecraft:web": { name: "Cobweb", category: "block", blockId: "minecraft:web", placeSound: "dig.cloth" },
  "minecraft:slime": { name: "Slime Block", category: "block", blockId: "minecraft:slime", placeSound: "dig.slime" },
  "minecraft:scaffolding": { name: "Scaffolding", category: "block", blockId: "minecraft:scaffolding", placeSound: "block.scaffolding.place" },
  "minecraft:sweet_berries": { name: "Sweet Berries", category: "sweet_berries", blockId: "minecraft:sweet_berry_bush", placeSound: "block.sweet_berry_bush.place" }
};

const OVERWORLD_CLUTCH_PRIORITY = [
  "minecraft:water_bucket",
  "minecraft:slime",
  "minecraft:web",
  "minecraft:hay_block",
  "minecraft:powder_snow_bucket",
  "minecraft:twisting_vines",
  "boat",
  "minecraft:scaffolding",
  "minecraft:sweet_berries"
];

const NETHER_CLUTCH_PRIORITY = [
  "minecraft:twisting_vines",
  "minecraft:powder_snow_bucket",
  "minecraft:hay_block",
  "minecraft:slime",
  "minecraft:web",
  "boat",
  "minecraft:scaffolding"
];

const PASSABLE_OR_AIR_BLOCKS = new Set([
  "minecraft:air", "minecraft:cave_air", "minecraft:void_air",
  "minecraft:short_grass", "minecraft:tall_grass", "minecraft:fern", "minecraft:large_fern",
  "minecraft:snow_layer", "minecraft:deadbush",
  "minecraft:dandelion", "minecraft:poppy", "minecraft:blue_orchid", "minecraft:allium",
  "minecraft:azure_bluet", "minecraft:red_tulip", "minecraft:orange_tulip", "minecraft:white_tulip",
  "minecraft:pink_tulip", "minecraft:oxeye_daisy", "minecraft:cornflower", "minecraft:lily_of_the_valley",
  "minecraft:wither_rose", "minecraft:sunflower", "minecraft:lilac", "minecraft:rose_bush", "minecraft:peony",
  "minecraft:torch", "minecraft:soul_torch", "minecraft:redwood_torch", "minecraft:redstone_wire",
  "minecraft:rail", "minecraft:golden_rail", "minecraft:detector_rail", "minecraft:activator_rail",
  "minecraft:tripwire", "minecraft:string", "minecraft:lever", "minecraft:stone_button", "minecraft:wooden_button"
]);

const NO_CLUTCH_SURFACES = new Set([
  "minecraft:water", "minecraft:flowing_water", "minecraft:lava", "minecraft:flowing_lava",
  "minecraft:hay_block", "minecraft:slime", "minecraft:web", "minecraft:powder_snow",
  "minecraft:vine", "minecraft:ladder", "minecraft:scaffolding", "minecraft:sweet_berry_bush",
  "minecraft:twisting_vines", "minecraft:weeping_vines", "minecraft:honey_block", "minecraft:bubble_column"
]);

const ENABLED_PROPERTY = "clutch_enabled";

const activeWaterClutches = new Map();
const activePowderSnowClutches = new Map();
const lastClutchTick = new Map();
const fallTrackers = new Map();

function getClutchPriority(dimensionId) {
  return dimensionId === "minecraft:nether" ? NETHER_CLUTCH_PRIORITY : OVERWORLD_CLUTCH_PRIORITY;
}

function getPlayerMode(player) {
  try {
    const tags = player.getTags();
    if (tags.includes("clutch_mode:extreme")) return "extreme";
    if (tags.includes("clutch_mode:full")) return "full";
    if (tags.includes("clutch_mode:simple")) return "simple";
  } catch {}
  return DEFAULT_MODE;
}

function getPlayerThreshold(player) {
  try {
    for (const tag of player.getTags()) {
      if (tag.startsWith("clutch_threshold:")) {
        const val = parseInt(tag.split(":")[1], 10);
        if (!isNaN(val) && val > 0) return val;
      }
    }
  } catch {}
  return DEFAULT_THRESHOLD;
}

function isClutchEnabled(player) {
  try {
    return player.getDynamicProperty(ENABLED_PROPERTY) !== false;
  } catch {
    return true;
  }
}

function isInactiveGameMode(player) {
  try {
    return player.matches({ gameMode: "creative" }) || player.matches({ gameMode: "spectator" });
  } catch {
    return false;
  }
}

function isCreative(player) {
  try {
    return player.matches({ gameMode: "creative" });
  } catch {
    return false;
  }
}

function trackPlayerFall(player, vel) {
  const loc = player.location;
  let tracker = fallTrackers.get(player.id);
  const isFallingDown = vel.y < -0.15 && !player.isOnGround;

  if (!isFallingDown) {
    fallTrackers.delete(player.id);
    return 0;
  }
  if (!tracker) {
    tracker = { startY: loc.y, fallDist: 0 };
    fallTrackers.set(player.id, tracker);
  } else {
    if (loc.y > tracker.startY) tracker.startY = loc.y;
    tracker.fallDist = Math.max(0, tracker.startY - loc.y);
  }
  return tracker.fallDist;
}

function isBoatId(typeId) {
  return typeId.endsWith("_boat") || typeId.endsWith("_raft");
}

function resolveClutchItem(itemStack) {
  if (!itemStack || !itemStack.typeId) return null;
  const typeId = itemStack.typeId;
  if (CLUTCH_REGISTRY[typeId]) return { ...CLUTCH_REGISTRY[typeId], typeId };
  if (isBoatId(typeId)) {
    const isChest = typeId.includes("chest_boat") || typeId.includes("chest_raft");
    return {
      name: "Boat",
      category: "boat",
      typeId,
      entityType: isChest ? "minecraft:chest_boat" : "minecraft:boat",
      placeSound: "step.wood"
    };
  }
  return null;
}

function usableInDimension(itemStack, isNether) {
  return !!itemStack && !(isNether && itemStack.typeId === "minecraft:water_bucket");
}

function itemMatchesPriority(itemStack, key) {
  if (!itemStack || !itemStack.typeId) return false;
  if (key === "boat") return isBoatId(itemStack.typeId);
  return itemStack.typeId === key;
}

function findBestClutchItemInInventory(container, dimensionId) {
  if (!container) return null;
  for (const key of getClutchPriority(dimensionId)) {
    for (let slot = 0; slot < 9 && slot < container.size; slot++) {
      const item = container.getItem(slot);
      if (item && itemMatchesPriority(item, key)) return { slot, item, inHotbar: true };
    }
    for (let slot = 9; slot < container.size; slot++) {
      const item = container.getItem(slot);
      if (item && itemMatchesPriority(item, key)) return { slot, item, inHotbar: false };
    }
  }
  return null;
}

function hasAnyClutchItem(player) {
  try {
    const isNether = player.dimension?.id === "minecraft:nether";
    const equippable = player.getComponent("minecraft:equippable");
    if (equippable) {
      for (const slot of ["Mainhand", "Offhand"]) {
        const it = equippable.getEquipment(slot);
        if (usableInDimension(it, isNether) && resolveClutchItem(it)) return true;
      }
    }
    const container = player.getComponent("minecraft:inventory")?.container;
    if (container) {
      for (let i = 0; i < container.size; i++) {
        const it = container.getItem(i);
        if (usableInDimension(it, isNether) && resolveClutchItem(it)) return true;
      }
    }
  } catch {}
  return false;
}

function hasTotemOfUndying(player) {
  try {
    const equippable = player.getComponent("minecraft:equippable");
    if (equippable) {
      if (equippable.getEquipment("Offhand")?.typeId === "minecraft:totem_of_undying") return true;
      if (equippable.getEquipment("Mainhand")?.typeId === "minecraft:totem_of_undying") return true;
    }
    const container = player.getComponent("minecraft:inventory")?.container;
    if (container) {
      for (let i = 0; i < container.size; i++) {
        if (container.getItem(i)?.typeId === "minecraft:totem_of_undying") return true;
      }
    }
  } catch {}
  return false;
}

function isFallLethal(player, fallDist) {
  try {
    const health = player.getComponent("minecraft:health")?.currentValue ?? 20;
    return Math.ceil(fallDist - 3) >= health;
  } catch {
    return true;
  }
}

function tryTriggerTotemFailSafe(player, fallDist) {
  try {
    if (!isFallLethal(player, fallDist)) return false;
    const equippable = player.getComponent("minecraft:equippable");
    if (!equippable) return false;

    const currentOffhand = equippable.getEquipment("Offhand");
    if (currentOffhand?.typeId === "minecraft:totem_of_undying") return true;
    if (equippable.getEquipment("Mainhand")?.typeId === "minecraft:totem_of_undying") return true;

    const container = player.getComponent("minecraft:inventory")?.container;
    if (!container) return false;

    let totemSlot = -1;
    for (let slot = 0; slot < container.size; slot++) {
      if (container.getItem(slot)?.typeId === "minecraft:totem_of_undying") {
        totemSlot = slot;
        break;
      }
    }
    if (totemSlot === -1) return false;

    const totemItem = container.getItem(totemSlot).clone();
    container.setItem(totemSlot, currentOffhand ?? undefined);
    equippable.setEquipment("Offhand", totemItem);

    try {
      player.playAnimation(ANIM);
      player.dimension.playSound("armor.equip_generic", player.location, { volume: 1.0, pitch: 1.0 });
    } catch {}
    return true;
  } catch {
    return false;
  }
}

function acquireClutchItem(player, mode) {
  const equippable = player.getComponent("minecraft:equippable");
  const container = player.getComponent("minecraft:inventory")?.container;
  const isNether = player.dimension?.id === "minecraft:nether";

  const mainhand = equippable?.getEquipment("Mainhand");
  if (usableInDimension(mainhand, isNether)) {
    const def = resolveClutchItem(mainhand);
    if (def) return { itemStack: mainhand, isOffhand: false, containerSlot: player.selectedSlotIndex, definition: def };
  }

  const offhand = equippable?.getEquipment("Offhand");
  if (usableInDimension(offhand, isNether)) {
    const def = resolveClutchItem(offhand);
    if (def) return { itemStack: offhand, isOffhand: true, containerSlot: null, definition: def };
  }

  if (mode === "simple" || !container) return null;

  const match = findBestClutchItemInInventory(container, player.dimension?.id);
  if (!match) return null;

  if (match.inHotbar) {
    player.selectedSlotIndex = match.slot;
    const switched = container.getItem(match.slot);
    const definition = resolveClutchItem(switched);
    if (!definition) return null;
    return { itemStack: switched, isOffhand: false, containerSlot: match.slot, definition };
  }

  try {
    const heldSlot = player.selectedSlotIndex;
    const hotbarItem = container.getItem(heldSlot);
    const invItem = container.getItem(match.slot);
    container.setItem(heldSlot, invItem);
    container.setItem(match.slot, hotbarItem);
    const switched = container.getItem(heldSlot);
    const definition = resolveClutchItem(switched);
    if (!definition) return null;
    return { itemStack: switched, isOffhand: false, containerSlot: heldSlot, definition };
  } catch {
    return null;
  }
}

function isPassableOrAir(block) {
  if (!block) return false;
  if (block.isAir) return true;
  return PASSABLE_OR_AIR_BLOCKS.has(block.typeId);
}

function findGroundBelow(dimension, location) {
  const px = Math.floor(location.x);
  const pz = Math.floor(location.z);
  const startY = Math.floor(location.y);
  const minY = Math.max(dimension.minHeight ?? -64, startY - 16);

  for (let y = startY; y >= minY; y--) {
    let block;
    try {
      block = dimension.getBlock({ x: px, y, z: pz });
    } catch {
      return null;
    }
    if (!block) return null;
    if (isPassableOrAir(block)) continue;
    if (NO_CLUTCH_SURFACES.has(block.typeId)) return null;

    let airAbove;
    try {
      airAbove = dimension.getBlock({ x: px, y: y + 1, z: pz });
    } catch {
      return null;
    }
    if (!airAbove || !isPassableOrAir(airAbove)) return null;
    return { surfaceBlock: block, airBlockAbove: airAbove, surfaceY: y };
  }
  return null;
}

function swapInto(player, clutchData, fromType, toType) {
  try {
    if (isCreative(player)) return;
    const makeItem = () => new ItemStack(toType, 1);

    if (clutchData.isOffhand) {
      const equippable = player.getComponent("minecraft:equippable");
      const off = equippable?.getEquipment("Offhand");
      if (off && off.typeId === fromType) {
        equippable.setEquipment("Offhand", makeItem());
        return;
      }
    } else {
      const container = player.getComponent("minecraft:inventory")?.container;
      if (container && clutchData.containerSlot !== null) {
        const item = container.getItem(clutchData.containerSlot);
        if (item && item.typeId === fromType) {
          container.setItem(clutchData.containerSlot, makeItem());
          return;
        }
      }
    }

    const container = player.getComponent("minecraft:inventory")?.container;
    if (!container) return;
    for (let i = 0; i < container.size; i++) {
      const item = container.getItem(i);
      if (item && item.typeId === fromType) {
        if (item.amount === 1) {
          container.setItem(i, makeItem());
        } else {
          item.amount -= 1;
          container.setItem(i, item);
          container.addItem(makeItem());
        }
        return;
      }
    }
  } catch {}
}

function consumeClutchItem(player, clutchData, replacementTypeId) {
  try {
    if (isCreative(player)) return;

    if (clutchData.isOffhand) {
      const equippable = player.getComponent("minecraft:equippable");
      const offhand = equippable?.getEquipment("Offhand");
      if (!offhand) return;
      if (replacementTypeId) {
        equippable.setEquipment("Offhand", new ItemStack(replacementTypeId, 1));
      } else if (offhand.amount > 1) {
        offhand.amount -= 1;
        equippable.setEquipment("Offhand", offhand);
      } else {
        equippable.setEquipment("Offhand", undefined);
      }
      return;
    }

    const container = player.getComponent("minecraft:inventory")?.container;
    if (!container || clutchData.containerSlot === null) return;
    const current = container.getItem(clutchData.containerSlot);
    if (!current) return;
    if (replacementTypeId) {
      container.setItem(clutchData.containerSlot, new ItemStack(replacementTypeId, 1));
    } else if (current.amount > 1) {
      current.amount -= 1;
      container.setItem(clutchData.containerSlot, current);
    } else {
      container.setItem(clutchData.containerSlot, undefined);
    }
  } catch {}
}

function placeBoatClutch(dimension, airBlock, entityType, player, distToSurface, fallSpeed) {
  try {
    const boat = dimension.spawnEntity(entityType, {
      x: airBlock.location.x + 0.5,
      y: airBlock.location.y,
      z: airBlock.location.z + 0.5
    });
    if (!boat) return false;

    const speed = Math.max(0.5, Math.abs(fallSpeed));
    const delayTicks = Math.max(1, Math.min(2, Math.round(distToSurface / speed)));

    system.runTimeout(() => {
      try {
        if (boat.isValid() && player.isValid()) {
          const rideable = boat.getComponent("minecraft:rideable");
          if (rideable) {
            rideable.addRider(player);
          }
        }
      } catch {}
    }, delayTicks);
    return true;
  } catch {
    return false;
  }
}

function isDead(player) {
  try {
    return (player.getComponent("minecraft:health")?.currentValue ?? 20) <= 0;
  } catch {
    return false;
  }
}

function executeAutoScoop(clutch) {
  const { player, playerId, targetPos, dimension, clutchData } = clutch;
  try {
    if (!player.isValid() || isDead(player)) return;

    try {
      const block = dimension.getBlock(targetPos);
      if (block && (block.typeId === "minecraft:water" || block.typeId === "minecraft:flowing_water")) {
        block.setType("minecraft:air");
      }
    } catch {}

    try { dimension.playSound("bucket.fill_water", player.location, { volume: 1.0, pitch: 1.0 }); } catch {}
    try { player.playAnimation(ANIM); } catch {}
    swapInto(player, clutchData, "minecraft:bucket", "minecraft:water_bucket");
  } catch {
  } finally {
    activeWaterClutches.delete(playerId);
  }
}

function executeAutoScoopPowderSnow(clutch) {
  const { player, playerId, targetPos, dimension, clutchData } = clutch;
  try {
    if (!player.isValid() || isDead(player)) return;

    let stillSnow = false;
    try {
      const block = dimension.getBlock(targetPos);
      if (block && block.typeId === "minecraft:powder_snow") {
        stillSnow = true;
        block.setType("minecraft:air");
      }
    } catch {}

    if (stillSnow) {
      try { dimension.playSound("bucket.fill_powder_snow", player.location, { volume: 1.0, pitch: 1.0 }); } catch {}
      try { player.playAnimation(ANIM); } catch {}
      swapInto(player, clutchData, "minecraft:bucket", "minecraft:powder_snow_bucket");
    }
  } catch {
  } finally {
    activePowderSnowClutches.delete(playerId);
  }
}

function executeClutch(player, velocity, clutchData, ground, distToSurface) {
  const { definition } = clutchData;
  const { airBlockAbove } = ground;
  const dimension = player.dimension;

  try { player.playAnimation(ANIM); } catch {}
  try { dimension.playSound(definition.placeSound, player.location, { volume: 1.0, pitch: 1.0 }); } catch {}

  let placed = false;

  switch (definition.category) {
    case "water": {
      try {
        airBlockAbove.setType("minecraft:water");
        placed = true;
        consumeClutchItem(player, clutchData, "minecraft:bucket");
        activeWaterClutches.set(player.id, {
          player,
          playerId: player.id,
          targetPos: airBlockAbove.location,
          dimension,
          deployedTick: system.currentTick,
          scheduled: false,
          clutchData
        });
      } catch {}
      break;
    }
    case "powder_snow": {
      try {
        airBlockAbove.setType("minecraft:powder_snow");
        placed = true;
        consumeClutchItem(player, clutchData, "minecraft:bucket");
        activePowderSnowClutches.set(player.id, {
          player,
          playerId: player.id,
          targetPos: airBlockAbove.location,
          dimension,
          deployedTick: system.currentTick,
          scheduled: false,
          clutchData
        });
      } catch {}
      break;
    }
    case "vines": {
      try {
        airBlockAbove.setType(definition.blockId);
        if (airBlockAbove.typeId === definition.blockId) {
          consumeClutchItem(player, clutchData);
          placed = true;
        }
      } catch {}
      break;
    }
    case "block":
    case "sweet_berries": {
      try {
        airBlockAbove.setType(definition.blockId);
        consumeClutchItem(player, clutchData);
        placed = true;
      } catch {}
      break;
    }
    case "boat": {
      if (placeBoatClutch(dimension, airBlockAbove, definition.entityType, player, distToSurface, velocity.y)) {
        consumeClutchItem(player, clutchData);
        placed = true;
      }
      break;
    }
  }

  if (placed) lastClutchTick.set(player.id, system.currentTick);
}

function processPending(map, executor, currentTick) {
  for (const [playerId, clutch] of map.entries()) {
    let valid = false;
    try { valid = clutch.player.isValid(); } catch {}
    if (!valid) {
      map.delete(playerId);
      continue;
    }
    if (clutch.scheduled) continue;

    let vel = { x: 0, y: 0, z: 0 };
    try { vel = clutch.player.getVelocity(); } catch {}
    const landed = clutch.player.isOnGround === true || Math.abs(vel.y) < 0.1 || currentTick - clutch.deployedTick > 15;
    if (landed) {
      clutch.scheduled = true;
      system.runTimeout(() => executor(clutch), 3);
    }
  }
}

system.runInterval(() => {
  const currentTick = system.currentTick;

  processPending(activeWaterClutches, executeAutoScoop, currentTick);
  processPending(activePowderSnowClutches, executeAutoScoopPowderSnow, currentTick);

  for (const player of world.getAllPlayers()) {
    try {
      if (!player.isValid()) continue;

      let vel;
      try {
        vel = player.getVelocity();
      } catch {
        continue;
      }

      let blocked = false;
      try {
        blocked = player.isGliding || player.isInWater || player.isSwimming;
      } catch {}
      if (blocked || isInactiveGameMode(player) || !isClutchEnabled(player)) {
        fallTrackers.delete(player.id);
        continue;
      }

      const currentFallDist = trackPlayerFall(player, vel);
      if (vel.y > -0.5) continue;

      const threshold = getPlayerThreshold(player);
      const ground = findGroundBelow(player.dimension, player.location);
      if (!ground) continue;

      const distToSurface = player.location.y - (ground.surfaceY + 1);
      if (distToSurface < 0.1) continue;

      const tracker = fallTrackers.get(player.id);
      const totalDrop = tracker ? tracker.startY - (ground.surfaceY + 1) : currentFallDist;
      if (currentFallDist < threshold && totalDrop < threshold) continue;

      const mode = getPlayerMode(player);
      const fallSpeed = Math.abs(vel.y);

      if (mode === "extreme") {
        if (!hasAnyClutchItem(player) && !hasTotemOfUndying(player)) continue;
      }

      if (currentTick - (lastClutchTick.get(player.id) ?? -100) < 25) continue;

      const rot = player.getRotation();
      if (mode !== "extreme" && rot.x < 55) continue;

      if (distToSurface > Math.max(4.5, fallSpeed * 1.6 + 0.4)) continue;

      const clutchData = acquireClutchItem(player, mode);
      const isBoat = clutchData?.definition?.category === "boat";
      const maxTrigger = isBoat ? 4.5 : Math.max(2.2, fallSpeed * 1.6 + 0.4);
      if (distToSurface > maxTrigger) continue;

      if (clutchData) {
        executeClutch(player, vel, clutchData, ground, distToSurface);
      } else {
        tryTriggerTotemFailSafe(player, Math.max(currentFallDist, totalDrop));
      }
    } catch {}
  }
}, 1);

world.afterEvents.playerLeave.subscribe((event) => {
  fallTrackers.delete(event.playerId);
  lastClutchTick.delete(event.playerId);
  activeWaterClutches.delete(event.playerId);
  activePowderSnowClutches.delete(event.playerId);
});

system.afterEvents.scriptEventReceive.subscribe((event) => {
  if (event.id !== "clutch:on" && event.id !== "clutch:off") return;
  const player = event.sourceEntity;
  if (!player || player.typeId !== "minecraft:player") return;
  const enable = event.id === "clutch:on";
  try {
    player.setDynamicProperty(ENABLED_PROPERTY, enable);
    player.sendMessage(enable ? "§aUniversal Clutch: ON" : "§cUniversal Clutch: OFF");
  } catch {}
});
