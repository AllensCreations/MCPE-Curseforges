import { world, system, EntityComponentTypes, CommandPermissionLevel, CustomCommandStatus } from "@minecraft/server";
import { ActionFormData, ModalFormData, FormCancelationReason } from "@minecraft/server-ui";

const PACK_NAME = "2-in-1 Loot & XP Booster";
const VERSION = "10";
const TITLE = `§l§6@ALNStudios §e${PACK_NAME}§r (v${VERSION})`;
const ABOUT_TITLE = "About ALNStudios";
const ICON_MAIN = "textures/items/experience_bottle";
const ICON_ABOUT = "textures/items/name_tag";
const ICON_EXIT = "textures/items/door_wood";
const SOUND_ID = "random.orb";
const SOUND_ON = { pitch: 1.4, volume: 1 };
const SOUND_OFF = { pitch: 0.6, volume: 1 };
const LOOT_LEVELS = [1, 2, 4, 8, 16, 32];
const XP_LEVELS = [1, 2, 4, 8, 16, 32, 64];
const LOOT_KEY = "aln_loot_index";
const XP_KEY = "aln_xp_index";
const ENABLED_KEY = "aln_boost_enabled";
const ORES_KEY = "aln_loot_ores";
const CROPS_KEY = "aln_loot_crops";
const MOBS_KEY = "aln_loot_mobs";
const BOOK_ID = "minecraft:book";
const TRIGGER_NAME = "booster";
const XP_TAG = "aln_boosted_xp";
const XP_RADIUS = 8;
const XP_PICKUP_SQUARED = 1;
const XP_INTERVAL_TICKS = 2;
const MAX_FERTILIZED = 4096;
const MAX_FORM_RETRIES = 8;
const CATEGORIES = ["ores", "crops", "mobs"];
const CATEGORY_NAMES = { ores: "Ores", crops: "Crops", mobs: "Mobs" };
const NON_MOB_TYPES = new Set([
  "minecraft:armor_stand",
  "minecraft:player",
  "minecraft:ender_crystal",
  "minecraft:xp_orb",
  "minecraft:item",
  "minecraft:painting",
  "minecraft:donkey",
  "minecraft:mule",
  "minecraft:llama",
  "minecraft:trader_llama",
  "minecraft:allay",
  "minecraft:fox",
  "minecraft:villager",
  "minecraft:villager_v2",
  "minecraft:wandering_trader",
  "minecraft:copper_golem",
]);
const NON_MOB_FAMILIES = ["inanimate", "projectile", "minecart", "boat"];
const ORE_EXTRAS = new Set(["minecraft:gilded_blackstone", "minecraft:amethyst_cluster"]);
const GROWTH_RULES = {
  "minecraft:wheat": ["growth", 7],
  "minecraft:carrots": ["growth", 7],
  "minecraft:potatoes": ["growth", 7],
  "minecraft:beetroot": ["growth", 7],
  "minecraft:nether_wart": ["age", 3],
  "minecraft:sweet_berry_bush": ["growth", 3],
};
const fertilized = new Set();
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
      ores: player.getDynamicProperty(ORES_KEY) !== false,
      crops: player.getDynamicProperty(CROPS_KEY) !== false,
      mobs: player.getDynamicProperty(MOBS_KEY) !== false,
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

function blockCategory(typeId) {
  if (GROWTH_RULES[typeId]) return "crops";
  if (typeId.endsWith("_ore") || ORE_EXTRAS.has(typeId)) return "ores";
  return undefined;
}

function isGrown(permutation) {
  const rule = GROWTH_RULES[permutation.type.id];
  if (!rule) return true;
  try {
    return permutation.getState(rule[0]) === rule[1];
  } catch (error) {
    return false;
  }
}

function hasSilkTouch(itemStack) {
  if (!itemStack) return false;
  try {
    const enchantable = itemStack.getComponent("minecraft:enchantable");
    return Boolean(enchantable && enchantable.hasEnchantment("minecraft:silk_touch"));
  } catch (error) {
    return false;
  }
}

function statusLine(player) {
  const boost = getBoost(player);
  const loot = LOOT_LEVELS[boost.loot];
  const xp = XP_LEVELS[boost.xp];
  const skipped = CATEGORIES.filter((category) => !boost[category]).map((category) => CATEGORY_NAMES[category]);
  const skipText = skipped.length > 0 ? `\nLoot skips: ${skipped.join(", ")}` : "";
  if (!boost.on) return `Boosters are off. Saved: Loot up to ${loot}x | XP ${xp}x${skipText}`;
  return `Loot Booster: up to ${loot}x | XP Booster: ${xp}x${skipText}`;
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
  addIfSupported(form, "label", `Loot slider 1 to ${LOOT_LEVELS.length} = random bonus up to ${levelText(LOOT_LEVELS)}`);
  form.slider(bold("Loot Booster"), 1, LOOT_LEVELS.length, { defaultValue: boost.loot + 1, valueStep: 1 });
  addIfSupported(form, "label", "Loot applies to:");
  form.toggle(bold("Ores"), { defaultValue: boost.ores });
  form.toggle(bold("Crops"), { defaultValue: boost.crops });
  form.toggle(bold("Mobs"), { defaultValue: boost.mobs });
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
  if (switches.length < 4 || sliders.length < 2) return "main";

  const on = switches[0];
  const lootIndex = Math.min(Math.max(Math.round(sliders[0]) - 1, 0), LOOT_LEVELS.length - 1);
  const xpIndex = Math.min(Math.max(Math.round(sliders[1]) - 1, 0), XP_LEVELS.length - 1);
  player.setDynamicProperty(LOOT_KEY, lootIndex);
  player.setDynamicProperty(XP_KEY, xpIndex);
  player.setDynamicProperty(ENABLED_KEY, on);
  player.setDynamicProperty(ORES_KEY, switches[1]);
  player.setDynamicProperty(CROPS_KEY, switches[2]);
  player.setDynamicProperty(MOBS_KEY, switches[3]);
  boosts.set(player.id, { loot: lootIndex, xp: xpIndex, on, ores: switches[1], crops: switches[2], mobs: switches[3] });
  player.playSound(SOUND_ID, on ? SOUND_ON : SOUND_OFF);
  return undefined;
}

async function aboutScreen(player) {
  const lines = [
    "Creator: ALNStudios",
    `${PACK_NAME} v${VERSION}`,
    "Adds a random Loot bonus up to 32x and XP multipliers up to 64x, with a Behavior Pack for the boosters and a Redesigned UI Resource Pack for the menu look.",
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
  if (itemStack.typeId !== BOOK_ID) return;
  const name = itemStack.nameTag;
  if (typeof name !== "string" || name.trim().toLowerCase() !== TRIGGER_NAME) return;
  openPanel(source);
});

world.afterEvents.playerLeave.subscribe(({ playerId }) => {
  boosts.delete(playerId);
  openMenus.delete(playerId);
});

system.beforeEvents.startup.subscribe(({ customCommandRegistry }) => {
  try {
    customCommandRegistry.registerCommand(
      {
        name: "aln:booster",
        description: "Open the XP & Loot Booster menu",
        permissionLevel: CommandPermissionLevel.Any,
        cheatsRequired: false,
      },
      (origin) => {
        const player = origin.sourceEntity ?? origin.initiator;
        if (!player || player.typeId !== "minecraft:player") {
          return { status: CustomCommandStatus.Failure, message: "Only players can open the booster menu." };
        }
        system.run(() => openPanel(player));
        return { status: CustomCommandStatus.Success, message: "Close the chat to open the booster menu." };
      },
    );
  } catch (error) {
    return;
  }
});

function distanceSquared(a, b) {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  const dz = a.z - b.z;
  return dx * dx + dy * dy + dz * dz;
}

function isMob(entity) {
  if (NON_MOB_TYPES.has(entity.typeId)) return false;
  try {
    return !NON_MOB_FAMILIES.some((family) => entity.matches({ families: [family] }));
  } catch (error) {
    return true;
  }
}

function rollMultiplier(max) {
  return 1 + Math.floor(Math.random() * max);
}

function isCreative(player) {
  try {
    return String(player.getGameMode()).toLowerCase() === "creative";
  } catch (error) {
    return false;
  }
}

function addToTotals(totals, stack) {
  for (const entry of totals) {
    if (entry.stack.isStackableWith(stack)) {
      entry.amount += stack.amount;
      return;
    }
  }
  totals.push({ stack, amount: stack.amount });
}

function spawnTotals(dimension, location, totals) {
  for (const entry of totals) {
    const size = entry.stack.maxAmount;
    let left = entry.amount;
    while (left > 0) {
      const count = Math.min(size, left);
      const piece = entry.stack.clone();
      piece.amount = count;
      try {
        dimension.spawnItem(piece, location);
      } catch (error) {
        return;
      }
      left -= count;
    }
  }
}

function addExtraBlockLoot(dimension, center, permutation, tool, maxMultiplier, skipSelf) {
  const rounds = rollMultiplier(maxMultiplier) - 1;
  if (rounds <= 0) return;
  const typeId = permutation.type.id;
  const manager = world.getLootTableManager();
  const totals = [];
  for (let round = 0; round < rounds; round++) {
    let stacks;
    try {
      stacks = manager.generateLootFromBlockPermutation(permutation, tool);
    } catch (error) {
      break;
    }
    if (!stacks) break;
    for (const stack of stacks) {
      if (stack.maxAmount <= 1) continue;
      if (skipSelf && stack.typeId === typeId) continue;
      addToTotals(totals, stack);
    }
  }
  spawnTotals(dimension, center, totals);
}

function addExtraMobLoot(player, deadEntity, maxMultiplier) {
  const rounds = rollMultiplier(maxMultiplier) - 1;
  if (rounds <= 0) return;
  let dimension;
  let location;
  let tool;
  try {
    dimension = deadEntity.dimension;
    location = deadEntity.location;
    const equippable = player.getComponent(EntityComponentTypes.Equippable);
    tool = equippable ? equippable.getEquipment("Mainhand") : undefined;
  } catch (error) {
    return;
  }
  const manager = world.getLootTableManager();
  const totals = [];
  for (let round = 0; round < rounds; round++) {
    let stacks;
    try {
      stacks = manager.generateLootFromEntity(deadEntity, tool);
    } catch (error) {
      break;
    }
    if (!stacks) break;
    for (const stack of stacks) {
      if (stack.maxAmount <= 1) continue;
      addToTotals(totals, stack);
    }
  }
  spawnTotals(dimension, location, totals);
}

function blockKey(dimension, location) {
  return `${dimension.id}:${location.x},${location.y},${location.z}`;
}

world.afterEvents.playerInteractWithBlock.subscribe(({ block, itemStack }) => {
  if (!itemStack || itemStack.typeId !== "minecraft:bone_meal") return;
  if (!GROWTH_RULES[block.typeId]) return;
  fertilized.add(blockKey(block.dimension, block.location));
  if (fertilized.size > MAX_FERTILIZED) fertilized.delete(fertilized.values().next().value);
});

world.afterEvents.playerPlaceBlock.subscribe(({ block }) => {
  fertilized.delete(blockKey(block.dimension, block.location));
});

world.afterEvents.playerBreakBlock.subscribe((event) => {
  const { player, block, brokenBlockPermutation, dimension, itemStackBeforeBreak } = event;
  const origin = block.location;
  const wasFertilized = fertilized.delete(blockKey(dimension, origin));

  const maxMultiplier = lootMultiplier(player);
  if (maxMultiplier <= 1) return;
  if (isCreative(player)) return;
  const category = blockCategory(brokenBlockPermutation.type.id);
  if (!category || !getBoost(player)[category]) return;
  if (!isGrown(brokenBlockPermutation)) return;
  if (wasFertilized) return;
  if (hasSilkTouch(itemStackBeforeBreak)) return;

  const center = { x: origin.x + 0.5, y: origin.y + 0.5, z: origin.z + 0.5 };
  addExtraBlockLoot(dimension, center, brokenBlockPermutation, itemStackBeforeBreak, maxMultiplier, category === "ores");
});

world.afterEvents.entityDie.subscribe(({ deadEntity, damageSource }) => {
  const killer = damageSource ? damageSource.damagingEntity : undefined;
  if (!killer || killer.typeId !== "minecraft:player") return;
  if (!isMob(deadEntity)) return;

  const maxMultiplier = lootMultiplier(killer);
  if (maxMultiplier <= 1 || !getBoost(killer).mobs) return;

  addExtraMobLoot(killer, deadEntity, maxMultiplier);
});

function hasNearerPlayer(orbLocation, player, players) {
  const own = distanceSquared(orbLocation, player.location);
  for (const other of players) {
    if (other.id === player.id || !other.isValid) continue;
    if (other.dimension.id !== player.dimension.id) continue;
    if (distanceSquared(orbLocation, other.location) < own) return true;
  }
  return false;
}

system.runInterval(() => {
  const players = world.getAllPlayers();
  for (const player of players) {
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
        const orbLocation = orb.location;
        if (hasNearerPlayer(orbLocation, player, players)) continue;
        if (!orb.hasTag(XP_TAG)) {
          const extra = multiplier - 1;
          orb.addTag(XP_TAG);
          for (let i = 0; i < extra; i++) {
            const bonus = dimension.spawnEntity("minecraft:xp_orb", location);
            bonus.addTag(XP_TAG);
          }
        }
        if (distanceSquared(orbLocation, location) > XP_PICKUP_SQUARED) orb.teleport(location);
      } catch (error) {
        continue;
      }
    }
  }
}, XP_INTERVAL_TICKS);
