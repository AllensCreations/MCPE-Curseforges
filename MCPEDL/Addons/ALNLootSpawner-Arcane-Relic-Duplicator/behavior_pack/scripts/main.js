import { world, system, ItemStack, BlockInventoryComponent } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";

const BLOCK_ID = "aln:loot_spawner";
const PROP_ITEM = "aln:spawner_item";
const PROP_TYPE = "aln:spawner_type";
const PROP_TICK = "aln:spawner_tick";
const PROP_ACTIVE = "aln:spawner_active";

const RARITY = {
  common:   { label: "Common",   color: "§f", ticks: 160  },
  uncommon: { label: "Uncommon", color: "§a", ticks: 400  },
  rare:     { label: "Rare",     color: "§b", ticks: 1200 },
  epic:     { label: "Epic",     color: "§d", ticks: 4800 }
};

const EPIC_ITEMS = new Set([
  "minecraft:netherite_ingot","minecraft:netherite_scrap","minecraft:ancient_debris",
  "minecraft:enchanted_golden_apple","minecraft:totem_of_undying","minecraft:nether_star",
  "minecraft:elytra","minecraft:heavy_core"
]);

const RARE_ITEMS = new Set([
  "minecraft:diamond","minecraft:emerald","minecraft:gold_ingot","minecraft:ender_pearl",
  "minecraft:blaze_rod","minecraft:ghast_tear","minecraft:shulker_shell",
  "minecraft:music_disc_13","minecraft:music_disc_cat","minecraft:music_disc_blocks",
  "minecraft:music_disc_chirp","minecraft:music_disc_far","minecraft:music_disc_mall",
  "minecraft:music_disc_mellohi","minecraft:music_disc_stal","minecraft:music_disc_strad",
  "minecraft:music_disc_ward","minecraft:music_disc_11","minecraft:music_disc_wait",
  "minecraft:music_disc_otherside","minecraft:music_disc_5","minecraft:music_disc_pigstep",
  "minecraft:music_disc_relic","minecraft:heart_of_the_sea","minecraft:conduit",
  "minecraft:trident","minecraft:end_crystal","minecraft:beacon"
]);

const UNCOMMON_ITEMS = new Set([
  "minecraft:iron_ingot","minecraft:coal","minecraft:copper_ingot","minecraft:redstone",
  "minecraft:lapis_lazuli","minecraft:quartz","minecraft:cooked_beef","minecraft:cooked_porkchop",
  "minecraft:cooked_chicken","minecraft:cooked_mutton","minecraft:cooked_rabbit",
  "minecraft:cooked_salmon","minecraft:cooked_cod","minecraft:bread","minecraft:cake",
  "minecraft:potion","minecraft:splash_potion","minecraft:lingering_potion",
  "minecraft:experience_bottle","minecraft:book","minecraft:leather","minecraft:string"
]);

const BLOCKED_CONTAINERS = new Set([
  "minecraft:shulker_box","minecraft:undyed_shulker_box","minecraft:white_shulker_box",
  "minecraft:orange_shulker_box","minecraft:magenta_shulker_box","minecraft:light_blue_shulker_box",
  "minecraft:yellow_shulker_box","minecraft:lime_shulker_box","minecraft:pink_shulker_box",
  "minecraft:gray_shulker_box","minecraft:light_gray_shulker_box","minecraft:cyan_shulker_box",
  "minecraft:purple_shulker_box","minecraft:blue_shulker_box","minecraft:brown_shulker_box",
  "minecraft:green_shulker_box","minecraft:red_shulker_box","minecraft:black_shulker_box",
  "minecraft:bundle","minecraft:chest","minecraft:trapped_chest","minecraft:barrel"
]);

function getRarity(typeId) {
  if (EPIC_ITEMS.has(typeId))   return "epic";
  if (RARE_ITEMS.has(typeId))   return "rare";
  if (UNCOMMON_ITEMS.has(typeId)) return "uncommon";
  return "common";
}

function blockKey(loc) {
  return `${loc.x}:${loc.y}:${loc.z}:${loc.dimension.id}`;
}

function getSpawnerData(block) {
  const key = blockKey(block.location);
  try {
    const raw = world.getDynamicProperty(`${PROP_ITEM}_${key}`);
    if (typeof raw !== "string" || !raw) return null;
    return {
      itemId:   raw,
      rarity:   typeof world.getDynamicProperty(`${PROP_TYPE}_${key}`) === "string"
                  ? world.getDynamicProperty(`${PROP_TYPE}_${key}`) : "common",
      ticksLeft: typeof world.getDynamicProperty(`${PROP_TICK}_${key}`) === "number"
                  ? world.getDynamicProperty(`${PROP_TICK}_${key}`) : RARITY["common"].ticks
    };
  } catch (e) {
    return null;
  }
}

function setSpawnerData(block, itemId, rarity, ticksLeft) {
  const key = blockKey(block.location);
  try {
    world.setDynamicProperty(`${PROP_ITEM}_${key}`, itemId);
    world.setDynamicProperty(`${PROP_TYPE}_${key}`, rarity);
    world.setDynamicProperty(`${PROP_TICK}_${key}`, ticksLeft);
  } catch (e) {}
}

function clearSpawnerData(block) {
  const key = blockKey(block.location);
  try {
    world.setDynamicProperty(`${PROP_ITEM}_${key}`, "");
    world.setDynamicProperty(`${PROP_TYPE}_${key}`, "");
    world.setDynamicProperty(`${PROP_TICK}_${key}`, 0);
  } catch (e) {}
}

function tryInsertIntoContainer(block, item) {
  const loc = block.location;
  const dim = block.dimension;
  const below = dim.getBlock({ x: loc.x, y: loc.y - 1, z: loc.z });
  if (!below) return false;
  const tid = below.typeId;
  const isContainer = tid === "minecraft:chest" || tid === "minecraft:trapped_chest"
                   || tid === "minecraft:barrel" || tid === "minecraft:hopper";
  if (!isContainer) return false;
  try {
    const inv = below.getComponent("minecraft:inventory");
    if (!inv || !inv.container) return false;
    const container = inv.container;
    for (let i = 0; i < container.size; i++) {
      const slot = container.getItem(i);
      if (!slot) {
        container.setItem(i, new ItemStack(item, 1));
        return true;
      }
      if (slot.typeId === item && slot.amount < slot.maxAmount) {
        container.setItem(i, new ItemStack(item, slot.amount + 1));
        return true;
      }
    }
  } catch (e) {}
  return false;
}

function ejectItem(block, itemId) {
  if (tryInsertIntoContainer(block, itemId)) return;
  try {
    const loc = block.location;
    block.dimension.spawnItem(new ItemStack(itemId, 1), {
      x: loc.x + 0.5,
      y: loc.y + 1.1,
      z: loc.z + 0.5
    });
  } catch (e) {}
}

function ticksToTime(ticks) {
  const secs = Math.ceil(ticks / 20);
  if (secs >= 60) {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return s > 0 ? `${m}m ${s}s` : `${m}m`;
  }
  return `${secs}s`;
}

async function openSpawnerUI(player, block) {
  const data = getSpawnerData(block);
  if (!data) return;
  const rar = RARITY[data.rarity] || RARITY.common;
  const totalTicks = rar.ticks;
  const elapsed = totalTicks - data.ticksLeft;
  const pct = Math.max(0, Math.min(100, Math.floor((elapsed / totalTicks) * 100)));
  const timeLeft = ticksToTime(data.ticksLeft);

  const form = new ActionFormData()
    .title("Loot Spawner")
    .body(
      `Item: ${data.itemId.replace("minecraft:", "")}\n` +
      `Rarity: ${rar.color}${rar.label}§r\n\n` +
      `Progress: ${pct}%\n` +
      `Next duplicate in: ${timeLeft}`
    )
    .button("Retrieve Template Item")
    .button("Exit");

  let res;
  try { res = await form.show(player); } catch (e) { return; }
  if (!res || res.canceled) return;
  if (res.selection === 0) {
    try {
      player.getComponent("minecraft:inventory")?.container?.addItem(new ItemStack(data.itemId, 1));
    } catch (e) {}
    clearSpawnerData(block);
    player.playSound("random.orb");
    player.onScreenDisplay.setActionBar("§aTemplate retrieved.");
  }
}

world.afterEvents.playerInteractWithBlock.subscribe(({ player, block, beforeItemStack }) => {
  if (block.typeId !== BLOCK_ID) return;
  const existing = getSpawnerData(block);

  if (existing) {
    system.run(() => openSpawnerUI(player, block));
    return;
  }

  const held = beforeItemStack;
  if (!held) {
    player.onScreenDisplay.setActionBar("§eHold an item and interact to attune it.");
    return;
  }

  const typeId = held.typeId;
  if (BLOCKED_CONTAINERS.has(typeId)) {
    player.onScreenDisplay.setActionBar("§cFilled containers cannot be attuned.");
    return;
  }
  if (typeId === "minecraft:air" || typeId === BLOCK_ID) {
    player.onScreenDisplay.setActionBar("§eHold an item and interact to attune it.");
    return;
  }

  const rarity = getRarity(typeId);
  const ticks = RARITY[rarity].ticks;

  try {
    const inv = player.getComponent("minecraft:inventory");
    if (!inv || !inv.container) return;
    const container = inv.container;
    for (let i = 0; i < container.size; i++) {
      const slot = container.getItem(i);
      if (slot && slot.typeId === typeId) {
        if (slot.amount > 1) {
          container.setItem(i, new ItemStack(typeId, slot.amount - 1));
        } else {
          container.setItem(i, undefined);
        }
        break;
      }
    }
  } catch (e) {}

  setSpawnerData(block, typeId, rarity, ticks);
  player.playSound("beacon.activate");
  const rar = RARITY[rarity];
  player.onScreenDisplay.setActionBar(`§bAttuned: §r${typeId.replace("minecraft:", "")} §8[${rar.color}${rar.label}§8]`);
});

const activeBlocks = new Map();

system.runInterval(() => {
  for (const dim of ["minecraft:overworld","minecraft:nether","minecraft:the_end"]) {
    let dimension;
    try { dimension = world.getDimension(dim); } catch (e) { continue; }
    for (const player of world.getAllPlayers()) {
      if (player.dimension.id !== dim) continue;
      const origin = player.location;
      const range = 32;
      try {
        const blocks = dimension.getBlocks(
          { x: origin.x - range, y: origin.y - range, z: origin.z - range },
          { x: origin.x + range, y: origin.y + range, z: origin.z + range },
          { type: BLOCK_ID }
        );
        if (!blocks) continue;
        for (const block of blocks) {
          if (!block || block.typeId !== BLOCK_ID) continue;
          const key = blockKey(block.location);
          const data = getSpawnerData(block);
          if (!data || !data.itemId) { activeBlocks.delete(key); continue; }
          let ticksLeft = data.ticksLeft - 1;
          if (ticksLeft <= 0) {
            ticksLeft = RARITY[data.rarity]?.ticks ?? RARITY.common.ticks;
            ejectItem(block, data.itemId);
            try {
              dimension.spawnParticle("minecraft:basic_flame_particle",
                { x: block.location.x + 0.5, y: block.location.y + 1.0, z: block.location.z + 0.5 });
            } catch (pe) {}
          }
          setSpawnerData(block, data.itemId, data.rarity, ticksLeft);
        }
      } catch (e) {}
    }
  }
}, 1);
