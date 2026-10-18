import { GameMode, world, system } from "@minecraft/server";

const NOTICE_COOLDOWN_TICKS = 40;
const lastNoticeByPlayer = new Map();

const REPLANTABLE_CROPS = new Map([
  ["minecraft:wheat", {
    blockId: "minecraft:wheat",
    state: "growth",
    matureAt: 7,
    itemId: "minecraft:wheat_seeds",
    itemLabel: "wheat seeds",
    cropLabel: "wheat"
  }],
  ["minecraft:carrots", {
    blockId: "minecraft:carrots",
    state: "growth",
    matureAt: 7,
    itemId: "minecraft:carrot",
    itemLabel: "carrots",
    cropLabel: "carrots"
  }],
  ["minecraft:potatoes", {
    blockId: "minecraft:potatoes",
    state: "growth",
    matureAt: 7,
    itemId: "minecraft:potato",
    itemLabel: "potatoes",
    cropLabel: "potatoes"
  }],
  ["minecraft:beetroot", {
    blockId: "minecraft:beetroot",
    state: "growth",
    matureAt: 3,
    itemId: "minecraft:beetroot_seeds",
    itemLabel: "beetroot seeds",
    cropLabel: "beetroot"
  }],
  ["minecraft:nether_wart", {
    blockId: "minecraft:nether_wart",
    state: "age",
    matureAt: 3,
    itemId: "minecraft:nether_wart",
    itemLabel: "nether wart",
    cropLabel: "nether wart"
  }],
  ["minecraft:torchflower_crop", {
    blockId: "minecraft:torchflower_crop",
    state: "growth",
    matureAt: 2,
    itemId: "minecraft:torchflower_seeds",
    itemLabel: "torchflower seeds",
    cropLabel: "torchflower"
  }],
  ["minecraft:melon_stem", {
    blockId: "minecraft:melon_stem",
    state: "growth",
    matureAt: 7,
    itemId: "minecraft:melon_seeds",
    itemLabel: "melon seeds",
    cropLabel: "melon stem"
  }],
  ["minecraft:pumpkin_stem", {
    blockId: "minecraft:pumpkin_stem",
    state: "growth",
    matureAt: 7,
    itemId: "minecraft:pumpkin_seeds",
    itemLabel: "pumpkin seeds",
    cropLabel: "pumpkin stem"
  }]
]);

function isMature(permutation, crop) {
  try {
    const growth = permutation.getState(crop.state);
    return typeof growth === "number" && growth >= crop.matureAt;
  } catch {
    return false;
  }
}

function getInventoryContainer(player) {
  try {
    const inventory = player.getComponent("minecraft:inventory");
    return inventory ? inventory.container : undefined;
  } catch {
    return undefined;
  }
}

function findItemSlot(container, itemId) {
  try {
    for (let slot = 0; slot < container.size; slot++) {
      const item = container.getItem(slot);
      if (item && item.typeId === itemId && item.amount > 0) return slot;
    }
  } catch {}
  return -1;
}

function takeOne(container, slot) {
  const current = container.getItem(slot);
  if (!current || current.amount < 1) return undefined;

  const originalStack = current.clone();

  if (current.amount === 1) {
    container.setItem(slot);
  } else {
    current.amount -= 1;
    container.setItem(slot, current);
  }

  return originalStack;
}

function notify(player, message) {
  if (lastNoticeByPlayer.has(player.id)) return;

  lastNoticeByPlayer.set(player.id, true);
  try {
    player.sendMessage(`§e[Harvest Intelligence] ${message}`);
  } catch {}

  system.runTimeout(() => {
    lastNoticeByPlayer.delete(player.id);
  }, NOTICE_COOLDOWN_TICKS);
}

function notifyNoSupply(player, crop) {
  notify(
    player,
    `No ${crop.itemLabel} available. ${crop.cropLabel} harvested normally; replanting skipped.`
  );
}

function isAir(block) {
  try {
    return block.typeId === "minecraft:air" ||
      block.typeId === "minecraft:cave_air" ||
      block.typeId === "minecraft:void_air";
  } catch {
    return false;
  }
}

function handleCropBreak(event) {
  const player = event.player;
  let blockId;

  try {
    blockId = event.brokenBlockPermutation.type.id;
  } catch {
    return;
  }

  const crop = REPLANTABLE_CROPS.get(blockId);
  if (!crop || !isMature(event.brokenBlockPermutation, crop)) return;

  try {
    const mode = player.getGameMode();
    if (mode === GameMode.Creative || mode === GameMode.Spectator) return;
  } catch {}

  const block = event.block;
  if (!isAir(block)) return;

  const container = getInventoryContainer(player);
  if (!container) {
    notify(player, `Could not access inventory. ${crop.cropLabel} harvested normally; replanting skipped.`);
    return;
  }

  const slot = findItemSlot(container, crop.itemId);
  if (slot < 0) {
    notifyNoSupply(player, crop);
    return;
  }

  let originalStack;
  try {
    originalStack = takeOne(container, slot);
  } catch {
    notify(player, `Could not update inventory safely. ${crop.cropLabel} harvested normally; replanting skipped.`);
    return;
  }

  if (!originalStack) {
    notifyNoSupply(player, crop);
    return;
  }

  try {
    block.setType(crop.blockId);
  } catch {
    try {
      container.setItem(slot, originalStack);
    } catch {}
    notify(player, `Replanting failed; ${crop.itemLabel} was returned to your inventory.`);
  }
}

world.afterEvents.playerBreakBlock.subscribe((event) => {
  try {
    handleCropBreak(event);
  } catch {}
});
