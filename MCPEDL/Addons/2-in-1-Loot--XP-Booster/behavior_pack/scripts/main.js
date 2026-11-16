import { world, system, EntityComponentTypes } from "@minecraft/server";
import { ActionFormData, ModalFormData, FormCancelationReason } from "@minecraft/server-ui";

const PACK_NAME = "2-in-1 Loot & XP Booster";
const VERSION = "1.0.7";
const TITLE = `§l§6@ALNStudios §e${PACK_NAME}§r (v${VERSION})`;
const ABOUT_TITLE = "About ALNStudios";
const ICON_MAIN = "textures/items/experience_bottle";
const ICON_ABOUT = "textures/items/name_tag";
const ICON_EXIT = "textures/items/door_wood";
const LOOT_LEVELS = [1, 2, 4, 8, 16, 32];
const XP_LEVELS = [1, 2, 4, 8, 16, 32, 64];
const LOOT_KEY = "aln_loot_index";
const XP_KEY = "aln_xp_index";
const ENABLED_KEY = "aln_boost_enabled";
const BOOK_IDS = new Set(["minecraft:book", "minecraft:writable_book"]);
const TRIGGER_NAME = "booster";
const DROP_TAG = "aln_boosted_drop";
const XP_TAG = "aln_boosted_xp";
const BLOCK_RADIUS = 1.5;
const MOB_RADIUS = 2.2;
const XP_RADIUS = 8;
const XP_INTERVAL_TICKS = 2;
const MAX_XP_SPAWNS_PER_PASS = 128;
const SPAWN_WINDOW_TICKS = 4;
const MAX_FORM_RETRIES = 8;
const LOOT_BLOCKS = new Set([
  "minecraft:ancient_debris",
  "minecraft:gilded_blackstone",
  "minecraft:amethyst_cluster",
  "minecraft:glowstone",
  "minecraft:sea_lantern",
  "minecraft:melon_block",
  "minecraft:wheat",
  "minecraft:carrots",
  "minecraft:potatoes",
  "minecraft:beetroot",
  "minecraft:nether_wart",
  "minecraft:sweet_berry_bush",
]);
const recentItems = new Map();
const openMenus = new Set();
const boosts = new Map();

function readIndex(player, key, levels) {
  const value = player.getDynamicProperty(key);
  if (!Number.isInteger(value) || value < 0) return 0;
  return Math.min(value, levels.length - 1);
}

function getBoost(player) {
  let boost = boosts.get(player.id);
  if (!boost) {
    boost = {
      loot: readIndex(player, LOOT_KEY, LOOT_LEVELS),
      xp: readIndex(player, XP_KEY, XP_LEVELS),
      on: player.getDynamicProperty(ENABLED_KEY) !== false,
    };
    boosts.set(player.id, boost);
  }
  return boost;
}

function lootMultiplier(player) {
  const boost = getBoost(player);
  return boost.on ? LOOT_LEVELS[boost.loot] : 1;
}

function xpMultiplier(player) {
  const boost = getBoost(player);
  return boost.on ? XP_LEVELS[boost.xp] : 1;
}

function isLootBlock(typeId) {
  return typeId.endsWith("_ore") || LOOT_BLOCKS.has(typeId);
}

function statusLine(player) {
  const boost = getBoost(player);
  const loot = LOOT_LEVELS[boost.loot];
  const xp = XP_LEVELS[boost.xp];
  if (!boost.on) return `Boosters are off. Saved: Loot ${loot}x | XP ${xp}x`;
  return `Loot Booster: ${loot}x | XP Booster: ${xp}x`;
}

function bold(text) {
  return `§l${text}§r`;
}

function addIfSupported(form, method, ...args) {
  if (typeof form[method] !== "function") return;
  try {
    form[method](...args);
  } catch (error) {
    return;
  }
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

async function mainScreen(player) {
  const form = new ActionFormData()
    .title(TITLE)
    .body(`Tune your boosters.\n${statusLine(player)}`)
    .button(bold("XP & Loot Booster"), ICON_MAIN)
    .button(bold("About"), ICON_ABOUT)
    .button(bold("Exit"), ICON_EXIT);
  const response = await showForm(player, form);
  if (!response) return undefined;
  if (response.selection === 0) return "booster";
  if (response.selection === 1) return "about";
  return undefined;
}

function levelText(levels) {
  return levels.map((level) => `${level}x`).join(", ");
}

async function boosterScreen(player) {
  const boost = getBoost(player);
  const form = new ModalFormData().title(TITLE);
  addIfSupported(form, "header", bold("XP & Loot Booster"));
  addIfSupported(form, "label", statusLine(player));
  addIfSupported(form, "divider");
  form.toggle(bold("Boosters On"), { defaultValue: boost.on });
  addIfSupported(form, "divider");
  addIfSupported(form, "label", `Loot slider 1 to ${LOOT_LEVELS.length} = ${levelText(LOOT_LEVELS)}`);
  form.slider(bold("Loot Booster"), 1, LOOT_LEVELS.length, { defaultValue: boost.loot + 1, valueStep: 1 });
  addIfSupported(form, "divider");
  addIfSupported(form, "label", `XP slider 1 to ${XP_LEVELS.length} = ${levelText(XP_LEVELS)}`);
  form.slider(bold("XP Booster"), 1, XP_LEVELS.length, { defaultValue: boost.xp + 1, valueStep: 1 });
  addIfSupported(form, "divider");
  addIfSupported(form, "submitButton", bold("Apply"));

  const response = await showForm(player, form);
  if (!response || !player.isValid) return "main";

  const values = response.formValues ?? [];
  const switches = values.filter((value) => typeof value === "boolean");
  const sliders = values.filter((value) => typeof value === "number");
  if (switches.length < 1 || sliders.length < 2) return "main";

  const on = switches[0];
  const lootIndex = Math.min(Math.max(Math.round(sliders[0]) - 1, 0), LOOT_LEVELS.length - 1);
  const xpIndex = Math.min(Math.max(Math.round(sliders[1]) - 1, 0), XP_LEVELS.length - 1);
  player.setDynamicProperty(LOOT_KEY, lootIndex);
  player.setDynamicProperty(XP_KEY, xpIndex);
  player.setDynamicProperty(ENABLED_KEY, on);
  boosts.set(player.id, { loot: lootIndex, xp: xpIndex, on });
  player.playSound("random.orb");
  if (!on) {
    player.onScreenDisplay.setActionBar("§eBoosters turned off");
    return undefined;
  }
  player.onScreenDisplay.setActionBar(`§aLoot Booster set to ${LOOT_LEVELS[lootIndex]}x`);
  system.runTimeout(() => {
    if (player.isValid) player.onScreenDisplay.setActionBar(`§aXP Booster set to ${XP_LEVELS[xpIndex]}x`);
  }, 50);
  return undefined;
}

async function aboutScreen(player) {
  const lines = [
    "Creator: ALNStudios",
    `${PACK_NAME} v${VERSION}`,
    "Adds Loot multipliers up to 32x and XP multipliers up to 64x, with a Behavior Pack for the multipliers and a Redesigned UI Resource Pack for the menu look.",
    "",
    "CurseForge profile: curseforge.com/members/allenscreations/projects",
    "MCPEDL profile: mcpedl.com/user/alnstudios",
    "",
    "Unofficial community creation, not approved by or associated with Mojang or Microsoft.",
  ];
  const form = new ActionFormData().title(ABOUT_TITLE).body(lines.join("\n")).button(bold("Back"));
  await showForm(player, form);
  return "main";
}

async function runMenus(player) {
  let screen = "main";
  while (screen && player.isValid) {
    if (screen === "main") screen = await mainScreen(player);
    else if (screen === "booster") screen = await boosterScreen(player);
    else if (screen === "about") screen = await aboutScreen(player);
    else screen = undefined;
  }
}

function openPanel(player) {
  if (openMenus.has(player.id)) return;
  openMenus.add(player.id);
  runMenus(player)
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

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  boosts.delete(playerId);
  openMenus.delete(playerId);
});

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
  if (!entity.isValid || entity.typeId !== "minecraft:item") return;
  recentItems.set(entity.id, system.currentTick);
});

system.runInterval(() => {
  if (recentItems.size === 0) return;
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
  const maxMultiplier = lootMultiplier(player);
  if (maxMultiplier <= 1) return;
  if (!isLootBlock(brokenBlockPermutation.type.id)) return;

  const origin = block.location;
  const center = { x: origin.x + 0.5, y: origin.y + 0.5, z: origin.z + 0.5 };
  system.run(() => multiplyDrops(dimension, center, BLOCK_RADIUS, maxMultiplier));
});

world.afterEvents.entityDie.subscribe(({ deadEntity, damageSource }) => {
  const killer = damageSource ? damageSource.damagingEntity : undefined;
  if (!killer || killer.typeId !== "minecraft:player") return;
  if (deadEntity.typeId === "minecraft:player") return;

  const id = deadEntity.typeId;
  if (id.endsWith("chest_minecart") || id.endsWith("hopper_minecart") || id.endsWith("chest_boat")) return;

  const maxMultiplier = lootMultiplier(killer);
  if (maxMultiplier <= 1) return;

  const dimension = deadEntity.dimension;
  const location = deadEntity.location;
  system.run(() => multiplyDrops(dimension, location, MOB_RADIUS, maxMultiplier));
});

system.runInterval(() => {
  let budget = MAX_XP_SPAWNS_PER_PASS;
  for (const player of world.getAllPlayers()) {
    if (!player.isValid) continue;
    const multiplier = xpMultiplier(player);
    if (multiplier <= 1) continue;

    const dimension = player.dimension;
    const location = player.location;
    let orbs;
    try {
      orbs = dimension.getEntities({
        type: "minecraft:xp_orb",
        location,
        maxDistance: XP_RADIUS,
      });
    } catch (error) {
      continue;
    }

    for (const orb of orbs) {
      try {
        if (!orb.isValid) continue;
        if (!orb.hasTag(XP_TAG)) {
          const extra = multiplier - 1;
          if (budget < extra) continue;
          orb.addTag(XP_TAG);
          for (let i = 0; i < extra; i++) {
            const bonus = dimension.spawnEntity("minecraft:xp_orb", location);
            bonus.addTag(XP_TAG);
          }
          budget -= extra;
        }
        orb.teleport(location);
      } catch (error) {
        continue;
      }
    }
  }
}, XP_INTERVAL_TICKS);
