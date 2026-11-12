import { world, system, EntityComponentTypes } from "@minecraft/server";
import { ActionFormData, FormCancelationReason } from "@minecraft/server-ui";

const TITLE = "§6[ ALNStudios Booster ]";
const LOOT_TIERS = [
  { name: "Normal", color: "§7", max: 1 },
  { name: "Quite Good", color: "§a", max: 2 },
  { name: "Great", color: "§b", max: 4 },
  { name: "Amazing", color: "§d", max: 8 },
  { name: "Insane", color: "§c", max: 16 },
  { name: "The Leprechaun", color: "§6", max: 32 },
];
const XP_TIERS = [
  { name: "Normal", color: "§7", max: 1 },
  { name: "Quite Good", color: "§a", max: 2 },
  { name: "Great", color: "§b", max: 4 },
  { name: "Amazing", color: "§d", max: 8 },
  { name: "Insane", color: "§c", max: 16 },
  { name: "Legendary", color: "§e", max: 32 },
  { name: "The Sage", color: "§6", max: 64 },
];
const LOOT_KEY = "aln_loot_index";
const XP_KEY = "aln_xp_index";
const BOOK_IDS = new Set(["minecraft:book", "minecraft:writable_book"]);
const TRIGGER_NAME = "booster";
const DROP_TAG = "aln_boosted_drop";
const XP_TAG = "aln_boosted_xp";
const BLOCK_RADIUS = 1.5;
const MOB_RADIUS = 2.2;
const XP_RADIUS = 8;
const XP_INTERVAL_TICKS = 2;
const MAX_XP_SPAWNS_PER_PASS = 256;
const SPAWN_WINDOW_TICKS = 4;
const MAX_FORM_RETRIES = 8;
const EXCLUDED_BLOCKS = new Set([
  "minecraft:chest",
  "minecraft:trapped_chest",
  "minecraft:barrel",
  "minecraft:ender_chest",
]);

const recentItems = new Map();
const openMenus = new Set();

function readIndex(player, key, tiers) {
  const value = player.getDynamicProperty(key);
  return Number.isInteger(value) && value >= 0 && value < tiers.length ? value : 0;
}

function lootTier(player) {
  return LOOT_TIERS[readIndex(player, LOOT_KEY, LOOT_TIERS)];
}

function xpTier(player) {
  return XP_TIERS[readIndex(player, XP_KEY, XP_TIERS)];
}

function isExcludedBlock(typeId) {
  return EXCLUDED_BLOCKS.has(typeId) || typeId.endsWith("shulker_box");
}

function statusLine(player) {
  const loot = lootTier(player);
  const xp = xpTier(player);
  return `§aLoot: ${loot.color}${loot.name} §8| §bXP: ${xp.color}${xp.name}`;
}

async function showForm(player, form) {
  for (let attempt = 0; attempt <= MAX_FORM_RETRIES; attempt++) {
    if (!player.isValid) return undefined;
    let response;
    try {
      response = await form.show(player);
    } catch (error) {
      return undefined;
    }
    if (!response.canceled) return response;
    if (response.cancelationReason !== FormCancelationReason.UserBusy) return undefined;
    await new Promise((resolve) => system.runTimeout(resolve, 10));
  }
  return undefined;
}

async function mainMenu(player) {
  const form = new ActionFormData()
    .title(TITLE)
    .body(`§7Tune your boosters.\n${statusLine(player)}`)
    .button("§bLoot Drop Booster")
    .button("§bXP Gain Booster")
    .button("§eAbout");
  const response = await showForm(player, form);
  if (!response) return;
  if (response.selection === 0) await tierMenu(player, "loot");
  else if (response.selection === 1) await tierMenu(player, "xp");
  else if (response.selection === 2) await aboutMenu(player);
}

async function tierMenu(player, kind) {
  const isLoot = kind === "loot";
  const tiers = isLoot ? LOOT_TIERS : XP_TIERS;
  const current = readIndex(player, isLoot ? LOOT_KEY : XP_KEY, tiers);
  const body = isLoot
    ? "§7Pick a Loot tier. Drops roll randomly like Fortune, so a tier's number is the best possible roll, not a guarantee."
    : "§7Pick an XP tier. Every orb near you becomes that many orbs and flies straight to you.";
  const form = new ActionFormData().title(TITLE).body(body);
  tiers.forEach((tier, index) => {
    const mark = index === current ? "§a> " : "";
    form.button(`${mark}${tier.color}${tier.name} §8(${isLoot ? "up to " : ""}${tier.max}x)`);
  });
  form.button("§7Back");

  const response = await showForm(player, form);
  if (!response) return;
  if (response.selection === tiers.length) {
    await mainMenu(player);
    return;
  }
  if (!player.isValid) return;

  player.setDynamicProperty(isLoot ? LOOT_KEY : XP_KEY, response.selection);
  player.playSound("random.orb");
  const loot = lootTier(player);
  const xp = xpTier(player);
  player.onScreenDisplay.setActionBar(
    `§6[BOOSTER] §aLoot: §f${loot.name} (${loot.max}x) §8| §bXP: §f${xp.name} (${xp.max}x)`
  );
}

async function aboutMenu(player) {
  const lines = [
    "§bALNStudios Booster §7v1.0.1",
    "",
    "§eLoot Drop §7- Breaking blocks and killing mobs rolls a random bonus, Fortune-style. The Leprechaun tier can reach 32x but usually lands lower.",
    "",
    "§eXP Gain §7- Orbs near you are multiplied (up to 64x) and collected instantly.",
    "",
    "§eOpen this menu §7- Rename a Book to Booster on an anvil, then right-click.",
    "",
    "§8Chests, barrels, ender chests and shulker boxes are never multiplied.",
    "§6by ALNStudios",
  ];
  const form = new ActionFormData().title(TITLE).body(lines.join("\n")).button("§7Back");
  const response = await showForm(player, form);
  if (response) await mainMenu(player);
}

function openPanel(player) {
  if (openMenus.has(player.id)) return;
  openMenus.add(player.id);
  mainMenu(player)
    .catch(() => {})
    .finally(() => openMenus.delete(player.id));
}

world.afterEvents.itemUse.subscribe((event) => {
  const { itemStack, source } = event;
  if (!itemStack || !source || source.typeId !== "minecraft:player") return;
  if (!BOOK_IDS.has(itemStack.typeId)) return;
  const name = itemStack.nameTag;
  if (typeof name !== "string" || name.trim().toLowerCase() !== TRIGGER_NAME) return;
  openPanel(source);
});

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
  if (!entity.isValid || entity.typeId !== "minecraft:item") return;
  recentItems.set(entity.id, system.currentTick);
});

system.runInterval(() => {
  const now = system.currentTick;
  for (const [id, tick] of recentItems) {
    if (now - tick > 40) recentItems.delete(id);
  }
}, 40);

function rollMultiplier(max) {
  return 1 + Math.floor(Math.random() * max);
}

function multiplyDrops(dimension, center, radius, maxMultiplier) {
  if (maxMultiplier <= 1) return;
  const now = system.currentTick;
  let found;
  try {
    found = dimension.getEntities({
      type: "minecraft:item",
      location: center,
      maxDistance: radius,
    });
  } catch (error) {
    return;
  }

  for (const entity of found) {
    try {
      if (!entity.isValid || entity.hasTag(DROP_TAG)) continue;
      const born = recentItems.get(entity.id);
      if (born === undefined || now - born > SPAWN_WINDOW_TICKS) continue;
      entity.addTag(DROP_TAG);

      const component = entity.getComponent(EntityComponentTypes.Item);
      const stack = component ? component.itemStack : undefined;
      if (!stack || stack.maxAmount <= 1) continue;

      let remaining = stack.amount * (rollMultiplier(maxMultiplier) - 1);
      const location = entity.location;
      while (remaining > 0) {
        const amount = Math.min(stack.maxAmount, remaining);
        const copy = stack.clone();
        copy.amount = amount;
        const spawned = dimension.spawnItem(copy, location);
        spawned.addTag(DROP_TAG);
        remaining -= amount;
      }
    } catch (error) {
      continue;
    }
  }
}

world.afterEvents.playerBreakBlock.subscribe((event) => {
  const { player, block, brokenBlockPermutation, dimension } = event;
  const maxMultiplier = lootTier(player).max;
  if (maxMultiplier <= 1) return;
  if (isExcludedBlock(brokenBlockPermutation.type.id)) return;

  const origin = block.location;
  const center = { x: origin.x + 0.5, y: origin.y + 0.5, z: origin.z + 0.5 };
  system.run(() => multiplyDrops(dimension, center, BLOCK_RADIUS, maxMultiplier));
});

world.afterEvents.entityDie.subscribe(({ deadEntity, damageSource }) => {
  const killer = damageSource ? damageSource.damagingEntity : undefined;
  if (!killer || killer.typeId !== "minecraft:player") return;
  if (deadEntity.typeId === "minecraft:player") return;

  const maxMultiplier = lootTier(killer).max;
  if (maxMultiplier <= 1) return;

  const dimension = deadEntity.dimension;
  const location = deadEntity.location;
  system.run(() => multiplyDrops(dimension, location, MOB_RADIUS, maxMultiplier));
});

system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    if (!player.isValid) continue;
    const multiplier = xpTier(player).max;
    if (multiplier <= 1) continue;

    const dimension = player.dimension;
    let orbs;
    try {
      orbs = dimension.getEntities({
        type: "minecraft:xp_orb",
        location: player.location,
        maxDistance: XP_RADIUS,
      });
    } catch (error) {
      continue;
    }

    let budget = MAX_XP_SPAWNS_PER_PASS;
    for (const orb of orbs) {
      try {
        if (!orb.isValid) continue;
        if (!orb.hasTag(XP_TAG)) {
          const extra = multiplier - 1;
          if (budget < extra) continue;
          orb.addTag(XP_TAG);
          for (let i = 0; i < extra; i++) {
            const bonus = dimension.spawnEntity("minecraft:xp_orb", player.location);
            bonus.addTag(XP_TAG);
          }
          budget -= extra;
        }
        orb.teleport(player.location);
      } catch (error) {
        continue;
      }
    }
  }
}, XP_INTERVAL_TICKS);
