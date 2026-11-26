import { world, system, EquipmentSlot, ItemStack } from "@minecraft/server";
import { ModalFormData, FormCancelationReason } from "@minecraft/server-ui";

const VERSION = "1.0.0";
const HUB_ITEM_ID = "aln:tool_hub";
const SETTINGS_KEY = "aln_tool_hub_settings";
const DEFAULT_SETTINGS = {
  autoSwitch: true,
  treeCapitator: true,
  dominoMiner: true,
};

const SWITCH = {
  switchMargin: 3,
  lowDurabilityUses: 15,
  lowDurabilityPenalty: 100,
  raycastDistance: 6,
  retryTicks: 2,
  combatCooldownTicks: 10,
  webCheckInterval: 2,
  webInteractionWindow: 12,
  webCombatCooldown: 40,
};

const MINER = {
  TREE_CAPITATOR_ENABLED: true,
  DOMINO_ORE_MINER_ENABLED: true,
  MAX_TREE_BLOCKS: 128,
  MAX_TREE_HEIGHT: 320,
  MATCH_TREE_SPECIES: true,
  MAX_ORE_CLUSTER_SIZE: 64,
  DURABILITY_SAFETY_THRESHOLD: 5,
  ALERT_SOUND: "note.bass",
  ALERT_PITCH: 0.7,
  ALERT_VOLUME: 1.0,
  NETHER_GOLD_POLICY: "nether_gold",
};

const settingsCache = new Map();

function isAlive(entity) {
  try {
    if (!entity) return false;
    return typeof entity.isValid === "function"
      ? entity.isValid()
      : Boolean(entity.isValid);
  } catch {
    return false;
  }
}

function loadSettings(player) {
  const result = { ...DEFAULT_SETTINGS };

  try {
    const raw = player.getDynamicProperty(SETTINGS_KEY);
    const stored = typeof raw === "string" ? JSON.parse(raw) : null;

    for (const key of Object.keys(DEFAULT_SETTINGS)) {
      if (typeof stored?.[key] === "boolean") result[key] = stored[key];
    }
  } catch {}

  return result;
}

function getSettings(player) {
  let settings = settingsCache.get(player.id);

  if (!settings) {
    settings = loadSettings(player);
    settingsCache.set(player.id, settings);
  }

  return settings;
}

function saveSettings(player, settings) {
  settingsCache.set(player.id, settings);

  try {
    player.setDynamicProperty(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

function hasHubInOffhand(player) {
  try {
    const equippable = player.getComponent("minecraft:equippable");

    return (
      equippable?.getEquipment(EquipmentSlot.Offhand)?.typeId === HUB_ITEM_ID
    );
  } catch {
    return false;
  }
}

function isAutoSwitchActive(player) {
  return getSettings(player).autoSwitch && hasHubInOffhand(player);
}

function statusText(enabled) {
  return enabled ? "§aON" : "§cOFF";
}

function openHubMenu(player, attempt = 0) {
  const current = getSettings(player);

  const form = new ModalFormData()
    .title("Tool Hub")
    .toggle("Auto Switch Tools (Hub must be in offhand)", current.autoSwitch)
    .toggle("Tree Capitator (sneak + axe)", current.treeCapitator)
    .toggle("Domino Ore Miner (sneak + pickaxe)", current.dominoMiner);

  form
    .show(player)
    .then((response) => {
      if (response.canceled) {
        if (
          response.cancelationReason === FormCancelationReason.UserBusy &&
          attempt < 10
        ) {
          system.runTimeout(() => {
            if (isAlive(player)) openHubMenu(player, attempt + 1);
          }, 10);
        }

        return;
      }

      const values = response.formValues ?? [];

      const updated = {
        autoSwitch: Boolean(values[0]),
        treeCapitator: Boolean(values[1]),
        dominoMiner: Boolean(values[2]),
      };

      saveSettings(player, updated);

      let message =
        `§b[Tool Hub] §fAuto Switch ${statusText(updated.autoSwitch)}` +
        ` §7| §fTree ${statusText(updated.treeCapitator)}` +
        ` §7| §fOre ${statusText(updated.dominoMiner)}`;

      if (updated.autoSwitch && !hasHubInOffhand(player)) {
        message += "\n§eMove the Tool Hub to your offhand to use Auto Switch.";
      }

      player.onScreenDisplay.setActionBar(message);
    })
    .catch(() => {});
}

world.afterEvents.itemUse.subscribe((event) => {
  try {
    const player = event.source;

    if (!player || player.typeId !== "minecraft:player") return;
    if (event.itemStack?.typeId !== HUB_ITEM_ID) return;

    openHubMenu(player);
  } catch {}
});

const ToolCategory = {
  PICKAXE: "pickaxe",
  AXE: "axe",
  SHOVEL: "shovel",
  LEAVES: "leaves",
  WEB: "web",
  SHEARS_OR_SWORD: "shears_or_sword",
  HOE: "hoe",
  WEAPON: "weapon",
};

const TIER_SCORES = {
  netherite: 50,
  diamond: 40,
  iron: 30,
  stone: 20,
  golden: 15,
  gold: 15,
  wooden: 10,
  wood: 10,
};

const IGNORED_BLOCKS = new Set([
  "air",
  "cave_air",
  "void_air",
  "water",
  "flowing_water",
  "lava",
  "flowing_lava",
  "bedrock",
  "barrier",
  "structure_void",
  "light_block",
  "portal",
  "end_portal",
  "end_portal_frame",
  "end_gateway",
]);

const NON_COMBAT_ENTITIES = new Set([
  "item",
  "arrow",
  "spectral_arrow",
  "xp_orb",
  "experience_orb",
  "snowball",
  "egg",
  "splash_potion",
  "lingering_potion",
  "ender_pearl",
  "eye_of_ender_signal",
  "lightning_bolt",
  "armor_stand",
  "painting",
  "item_frame",
  "glow_item_frame",
  "leash_knot",
  "boat",
  "chest_boat",
  "minecart",
  "chest_minecart",
  "hopper_minecart",
  "tnt_minecart",
  "command_block_minecart",
  "tnt",
  "falling_block",
]);

const recentCombat = new Map();
const pendingSwaps = new Map();
const webInteraction = new Map();

function normalizeId(id) {
  return (id ?? "").replace(/^minecraft:/, "").toLowerCase();
}

function getMaterialTier(id) {
  for (const [tier, score] of Object.entries(TIER_SCORES)) {
    if (id.includes(tier)) return score;
  }

  return 25;
}

function readEnchants(item) {
  const result = {
    silk: 0,
    fortune: 0,
    efficiency: 0,
    sharpness: 0,
  };

  try {
    const component = item.getComponent("minecraft:enchantable");

    if (!component) return result;

    result.silk = component.getEnchantment("silk_touch")?.level ?? 0;
    result.fortune = component.getEnchantment("fortune")?.level ?? 0;
    result.efficiency = component.getEnchantment("efficiency")?.level ?? 0;
    result.sharpness = component.getEnchantment("sharpness")?.level ?? 0;
  } catch {}

  return result;
}

function readDurability(item) {
  try {
    const component = item.getComponent("minecraft:durability");

    if (!component) return null;

    const remaining = component.maxDurability - component.damage;

    return {
      remaining,
      fraction: remaining / component.maxDurability,
    };
  } catch {
    return null;
  }
}

function evaluateToolScore(item, category, slotIndex) {
  if (!item?.typeId) return -1;

  const id = normalizeId(item.typeId);
  const hotbarBonus = slotIndex >= 0 && slotIndex <= 8 ? 1 : 0;

  if (category === ToolCategory.PICKAXE) {
    return id.includes("pickaxe") ? getMaterialTier(id) + hotbarBonus : -1;
  }

  if (category === ToolCategory.AXE) {
    return id.includes("axe") && !id.includes("pickaxe")
      ? getMaterialTier(id) + hotbarBonus
      : -1;
  }

  if (category === ToolCategory.SHOVEL) {
    return id.includes("shovel") || id.includes("spade")
      ? getMaterialTier(id) + hotbarBonus
      : -1;
  }

  if (category === ToolCategory.HOE) {
    return id.includes("hoe") ? getMaterialTier(id) + hotbarBonus : -1;
  }

  if (category === ToolCategory.LEAVES) {
    if (id.includes("shears")) return 100 + hotbarBonus;

    return id.includes("hoe") ? getMaterialTier(id) + hotbarBonus : -1;
  }

  if (category === ToolCategory.WEB) {
    if (id.includes("shears")) return 100 + hotbarBonus;

    return id.includes("sword") ? getMaterialTier(id) + hotbarBonus : -1;
  }

  if (category === ToolCategory.SHEARS_OR_SWORD) {
    if (id.includes("shears")) return 60 + hotbarBonus;

    return id.includes("sword")
      ? Math.max(5, getMaterialTier(id) - 5) + hotbarBonus
      : -1;
  }

  if (category === ToolCategory.WEAPON) {
    const sword = id.includes("sword");
    const axe = id.includes("axe") && !id.includes("pickaxe");

    if (!sword && !axe) return -1;

    return getMaterialTier(id) + (sword ? 2 : 0) + hotbarBonus;
  }

  return -1;
}

function scoreItem(item, category, slotIndex, blockId = "") {
  const base = evaluateToolScore(item, category, slotIndex);

  if (base < 0) return -Infinity;

  let score = base;
  const enchants = readEnchants(item);

  score += enchants.efficiency;

  if (category === ToolCategory.WEAPON) {
    score += enchants.sharpness;
  }

  if (blockId) {
    const silkPreferred =
      blockId === "glass" ||
      blockId.endsWith("_glass") ||
      blockId.endsWith("glass_pane") ||
      /(^|_)ice$/.test(blockId) ||
      blockId === "bookshelf" ||
      blockId === "ender_chest";

    if (silkPreferred && enchants.silk > 0) {
      score += 60;
    }

    if (blockId.endsWith("_ore")) {
      score += enchants.fortune * 1.5;

      if (enchants.silk > 0) score -= 8;
    }
  }

  const durability = readDurability(item);

  if (durability) {
    if (durability.remaining <= SWITCH.lowDurabilityUses) {
      score -= SWITCH.lowDurabilityPenalty;
    } else {
      score += durability.fraction;
    }
  }

  return score;
}

function getRequiredToolCategory(typeId) {
  if (!typeId) return null;

  const id = normalizeId(typeId);

  if (IGNORED_BLOCKS.has(id)) return null;

  if (id === "web" || id.includes("cobweb")) {
    return ToolCategory.WEB;
  }

  if (
    id.endsWith("concrete_powder") ||
    id.includes("sand") ||
    id.includes("gravel") ||
    id.includes("clay") ||
    id.includes("dirt") ||
    id === "grass_block" ||
    id.includes("podzol") ||
    id.includes("mycelium") ||
    id.includes("farmland") ||
    id.includes("mud") ||
    id.includes("soul_soil") ||
    id.includes("snow")
  ) {
    return ToolCategory.SHOVEL;
  }

  if (id === "ender_chest") {
    return ToolCategory.PICKAXE;
  }

  if (id.includes("leaves")) {
    return ToolCategory.LEAVES;
  }

  if (
    id.includes("wool") ||
    id.includes("vine") ||
    id.includes("fern") ||
    id === "tallgrass" ||
    id === "seagrass" ||
    id === "hanging_roots" ||
    id === "deadbush" ||
    id === "tripwire"
  ) {
    return ToolCategory.SHEARS_OR_SWORD;
  }

  if (
    id === "hay_block" ||
    id === "target" ||
    id === "sponge" ||
    id === "wet_sponge" ||
    id.includes("sculk") ||
    id.includes("moss_block") ||
    id.includes("moss_carpet") ||
    id.includes("wart_block") ||
    id === "shroomlight"
  ) {
    return ToolCategory.HOE;
  }

  if (
    id.endsWith("_log") ||
    id.endsWith("_wood") ||
    id.endsWith("_stem") ||
    id.endsWith("_hyphae") ||
    id.startsWith("stripped_") ||
    id.includes("planks") ||
    id.includes("crafting_table") ||
    id.includes("cartography_table") ||
    id.includes("fletching_table") ||
    id.includes("smithing_table") ||
    id.includes("loom") ||
    id.includes("composter") ||
    id === "chest" ||
    id === "trapped_chest" ||
    id === "barrel" ||
    id.includes("bookshelf") ||
    id === "lectern" ||
    id.includes("pumpkin") ||
    id.includes("melon") ||
    id === "cocoa" ||
    id.includes("beehive") ||
    id === "bee_nest" ||
    id.includes("ladder") ||
    id.includes("sign") ||
    id.includes("mushroom_stem") ||
    id.includes("mushroom_block") ||
    id === "jukebox" ||
    id === "daylight_detector" ||
    id === "note_block" ||
    id.includes("bamboo_block") ||
    id.includes("bamboo_mosaic") ||
    (id.endsWith("_fence") && !id.includes("nether_brick")) ||
    id.endsWith("_fence_gate")
  ) {
    return ToolCategory.AXE;
  }

  const woodMaterials = [
    "oak",
    "spruce",
    "birch",
    "jungle",
    "acacia",
    "dark_oak",
    "mangrove",
    "cherry",
    "bamboo",
    "crimson",
    "warped",
    "pale_oak",
  ];

  if (
    woodMaterials.some((material) => id.includes(material)) &&
    !id.includes("petrified") &&
    (id.endsWith("_door") ||
      id.endsWith("_trapdoor") ||
      id.endsWith("_button") ||
      id.endsWith("_pressure_plate") ||
      id.endsWith("_stairs") ||
      id.endsWith("_slab"))
  ) {
    return ToolCategory.AXE;
  }

  return ToolCategory.PICKAXE;
}

function getInventory(player) {
  try {
    return player.getComponent("minecraft:inventory")?.container;
  } catch {
    return undefined;
  }
}

function switchSelectedSlotTool(player, category, blockTypeId = "") {
  if (!player || !isAutoSwitchActive(player)) {
    return false;
  }

  const container = getInventory(player);

  if (!container) return false;

  const targetSlot = player.selectedSlotIndex;
  const heldItem = container.getItem(targetSlot);

  if (heldItem?.typeId === HUB_ITEM_ID) return false;

  const blockId = normalizeId(blockTypeId);
  const currentScore = scoreItem(heldItem, category, targetSlot, blockId);

  let bestSlot = -1;
  let bestScore = -Infinity;

  for (let slot = 0; slot < container.size; slot++) {
    if (slot === targetSlot) continue;

    const item = container.getItem(slot);

    if (!item) continue;

    const score = scoreItem(item, category, slot, blockId);

    if (score > bestScore) {
      bestScore = score;
      bestSlot = slot;
    }
  }

  if (bestSlot === -1 || bestScore === -Infinity) {
    return false;
  }

  if (
    currentScore !== -Infinity &&
    bestScore < currentScore + SWITCH.switchMargin
  ) {
    return false;
  }

  try {
    container.swapItems(bestSlot, targetSlot, container);
    return true;
  } catch {
    return false;
  }
}

function isCombatTarget(entity) {
  if (!entity?.typeId) return false;

  const id = normalizeId(entity.typeId);

  if (NON_COMBAT_ENTITIES.has(id)) return false;

  try {
    return id === "player" || !!entity.getComponent("minecraft:health");
  } catch {
    return false;
  }
}

function isWeb(block) {
  if (!block?.typeId) return false;

  const id = normalizeId(block.typeId);

  return id === "web" || id.includes("cobweb");
}

function blockKey(block) {
  if (!block) return "";

  const { x, y, z } = block.location;

  return `${block.typeId}@${x},${y},${z}`;
}

function clearPendingSwap(playerId) {
  const runId = pendingSwaps.get(playerId);

  if (runId !== undefined) {
    system.clearRun(runId);
    pendingSwaps.delete(playerId);
  }
}

function scheduleSwapRetry(player, category, blockTypeId) {
  clearPendingSwap(player.id);

  const slotAtSchedule = player.selectedSlotIndex;

  const runId = system.runTimeout(() => {
    pendingSwaps.delete(player.id);

    try {
      if (player.selectedSlotIndex !== slotAtSchedule) return;

      switchSelectedSlotTool(player, category, blockTypeId);
    } catch {}
  }, SWITCH.retryTicks);

  pendingSwaps.set(player.id, runId);
}

function getTargetBlock(player) {
  try {
    return player.getBlockFromViewDirection({
      maxDistance: SWITCH.raycastDistance,
      includeLiquidBlocks: false,
      includePassableBlocks: true,
    })?.block;
  } catch {
    return undefined;
  }
}

world.afterEvents.entityHitBlock.subscribe((event) => {
  try {
    const player = event.damagingEntity;

    if (!player || player.typeId !== "minecraft:player") return;
    if (!isAutoSwitchActive(player)) return;

    const block = event.hitBlock;

    if (!block) return;

    const category = getRequiredToolCategory(block.typeId);

    if (!category) return;

    const now = system.currentTick;
    const lastCombat = recentCombat.get(player.id) ?? -Infinity;

    if (now - lastCombat < SWITCH.combatCooldownTicks) {
      return;
    }

    webInteraction.set(player.id, {
      key: blockKey(block),
      lastInteractionTick: now,
    });

    if (!switchSelectedSlotTool(player, category, block.typeId)) {
      scheduleSwapRetry(player, category, block.typeId);
    }
  } catch {}
});

system.runInterval(() => {
  const now = system.currentTick;

  for (const player of world.getAllPlayers()) {
    try {
      if (!isAutoSwitchActive(player)) {
        webInteraction.delete(player.id);
        continue;
      }

      const lastCombat = recentCombat.get(player.id) ?? -Infinity;

      if (now - lastCombat < SWITCH.webCombatCooldown) {
        continue;
      }

      const block = getTargetBlock(player);

      if (!isWeb(block)) {
        webInteraction.delete(player.id);
        continue;
      }

      const key = blockKey(block);
      const state = webInteraction.get(player.id);

      if (!state || state.key !== key) {
        webInteraction.set(player.id, {
          key,
          lastInteractionTick: now,
          initialTick: now,
        });

        continue;
      }

      const elapsed = now - state.initialTick;

      if (elapsed < SWITCH.webInteractionWindow) {
        continue;
      }

      if (now - state.lastInteractionTick > SWITCH.webInteractionWindow) {
        webInteraction.delete(player.id);
        continue;
      }

      const held = getInventory(player)?.getItem(player.selectedSlotIndex);

      if (held && normalizeId(held.typeId).includes("shears")) {
        continue;
      }

      switchSelectedSlotTool(player, ToolCategory.WEB, block.typeId);

      webInteraction.set(player.id, {
        key,
        initialTick: now,
        lastInteractionTick: now,
      });
    } catch {}
  }
}, SWITCH.webCheckInterval);

world.afterEvents.entityHitEntity.subscribe((event) => {
  try {
    const player = event.damagingEntity;

    if (!player || player.typeId !== "minecraft:player") return;
    if (!isAutoSwitchActive(player)) return;
    if (!isCombatTarget(event.hitEntity)) return;

    recentCombat.set(player.id, system.currentTick);

    clearPendingSwap(player.id);
    webInteraction.delete(player.id);

    switchSelectedSlotTool(player, ToolCategory.WEAPON);
  } catch {}
});

world.afterEvents.playerLeave.subscribe((event) => {
  recentCombat.delete(event.playerId);
  webInteraction.delete(event.playerId);
  settingsCache.delete(event.playerId);
  clearPendingSwap(event.playerId);
});

const AXE_IDENTIFIERS = new Set([
  "minecraft:wooden_axe",
  "minecraft:stone_axe",
  "minecraft:iron_axe",
  "minecraft:golden_axe",
  "minecraft:diamond_axe",
  "minecraft:netherite_axe",
]);

const PICKAXE_TIERS = {
  "minecraft:wooden_axe": 1,
  "minecraft:golden_axe": 1,
  "minecraft:wooden_pickaxe": 1,
  "minecraft:golden_pickaxe": 1,
  "minecraft:stone_pickaxe": 2,
  "minecraft:iron_pickaxe": 3,
  "minecraft:diamond_pickaxe": 4,
  "minecraft:netherite_pickaxe": 5,
};

function isAxe(typeId) {
  if (!typeId) return false;
  return AXE_IDENTIFIERS.has(typeId) || typeId.endsWith("_axe");
}

function isPickaxe(typeId) {
  if (!typeId) return false;
  return Boolean(PICKAXE_TIERS[typeId]) || typeId.endsWith("_pickaxe");
}

function getPickaxeTier(typeId) {
  return PICKAXE_TIERS[typeId] || (typeId?.endsWith("_pickaxe") ? 3 : 0);
}

const ELIGIBLE_LOGS = new Set([
  "minecraft:oak_log", "minecraft:stripped_oak_log", "minecraft:oak_wood", "minecraft:stripped_oak_wood",
  "minecraft:spruce_log", "minecraft:stripped_spruce_log", "minecraft:spruce_wood", "minecraft:stripped_spruce_wood",
  "minecraft:birch_log", "minecraft:stripped_birch_log", "minecraft:birch_wood", "minecraft:stripped_birch_wood",
  "minecraft:jungle_log", "minecraft:stripped_jungle_log", "minecraft:jungle_wood", "minecraft:stripped_jungle_wood",
  "minecraft:acacia_log", "minecraft:stripped_acacia_log", "minecraft:acacia_wood", "minecraft:stripped_acacia_wood",
  "minecraft:dark_oak_log", "minecraft:stripped_dark_oak_log", "minecraft:dark_oak_wood", "minecraft:stripped_dark_oak_wood",
  "minecraft:mangrove_log", "minecraft:stripped_mangrove_log", "minecraft:mangrove_wood", "minecraft:stripped_mangrove_wood",
  "minecraft:mangrove_roots", "minecraft:muddy_mangrove_roots",
  "minecraft:cherry_log", "minecraft:stripped_cherry_log", "minecraft:cherry_wood", "minecraft:stripped_cherry_wood",
  "minecraft:pale_oak_log", "minecraft:stripped_pale_oak_log", "minecraft:pale_oak_wood", "minecraft:stripped_pale_oak_wood",
  "minecraft:crimson_stem", "minecraft:stripped_crimson_stem", "minecraft:crimson_hyphae", "minecraft:stripped_crimson_hyphae",
  "minecraft:warped_stem", "minecraft:stripped_warped_stem", "minecraft:warped_hyphae", "minecraft:stripped_warped_hyphae",
]);

function isEligibleLog(blockId) {
  if (!blockId) return false;
  if (ELIGIBLE_LOGS.has(blockId)) return true;
  return /(log|wood|stem|hyphae|mangrove_roots)$/i.test(blockId);
}

function getWoodSpecies(typeId) {
  if (!typeId) return null;
  const match = typeId.match(
    /(dark_oak|pale_oak|oak|spruce|birch|jungle|acacia|mangrove|cherry|crimson|warped)/i
  );
  return match ? match[1].toLowerCase() : null;
}

function isMatchingLog(blockId, targetSpecies) {
  if (!isEligibleLog(blockId)) return false;
  if (!MINER.MATCH_TREE_SPECIES || !targetSpecies) return true;
  const species = getWoodSpecies(blockId);
  return !species || species === targetSpecies;
}

const ORE_DEFINITIONS = {
  "minecraft:coal_ore": { category: "coal", minTier: 1, dropItem: "minecraft:coal" },
  "minecraft:deepslate_coal_ore": { category: "coal", minTier: 1, dropItem: "minecraft:coal" },

  "minecraft:iron_ore": { category: "iron", minTier: 2, dropItem: "minecraft:raw_iron" },
  "minecraft:deepslate_iron_ore": { category: "iron", minTier: 2, dropItem: "minecraft:raw_iron" },

  "minecraft:copper_ore": { category: "copper", minTier: 2, dropItem: "minecraft:raw_copper", minDrop: 2, maxDrop: 5 },
  "minecraft:deepslate_copper_ore": { category: "copper", minTier: 2, dropItem: "minecraft:raw_copper", minDrop: 2, maxDrop: 5 },

  "minecraft:lapis_ore": { category: "lapis", minTier: 2, dropItem: "minecraft:lapis_lazuli", minDrop: 4, maxDrop: 9 },
  "minecraft:deepslate_lapis_ore": { category: "lapis", minTier: 2, dropItem: "minecraft:lapis_lazuli", minDrop: 4, maxDrop: 9 },

  "minecraft:gold_ore": { category: "gold", minTier: 3, dropItem: "minecraft:raw_gold" },
  "minecraft:deepslate_gold_ore": { category: "gold", minTier: 3, dropItem: "minecraft:raw_gold" },

  "minecraft:nether_gold_ore": {
    category: MINER.NETHER_GOLD_POLICY,
    minTier: 1,
    dropItem: "minecraft:gold_nugget",
    minDrop: 2,
    maxDrop: 6,
  },

  "minecraft:redstone_ore": { category: "redstone", minTier: 3, dropItem: "minecraft:redstone", minDrop: 4, maxDrop: 5 },
  "minecraft:deepslate_redstone_ore": { category: "redstone", minTier: 3, dropItem: "minecraft:redstone", minDrop: 4, maxDrop: 5 },
  "minecraft:lit_redstone_ore": { category: "redstone", minTier: 3, dropItem: "minecraft:redstone", minDrop: 4, maxDrop: 5 },
  "minecraft:lit_deepslate_redstone_ore": { category: "redstone", minTier: 3, dropItem: "minecraft:redstone", minDrop: 4, maxDrop: 5 },

  "minecraft:diamond_ore": { category: "diamond", minTier: 3, dropItem: "minecraft:diamond" },
  "minecraft:deepslate_diamond_ore": { category: "diamond", minTier: 3, dropItem: "minecraft:diamond" },

  "minecraft:emerald_ore": { category: "emerald", minTier: 3, dropItem: "minecraft:emerald" },
  "minecraft:deepslate_emerald_ore": { category: "emerald", minTier: 3, dropItem: "minecraft:emerald" },

  "minecraft:quartz_ore": { category: "quartz", minTier: 1, dropItem: "minecraft:quartz" },
  "minecraft:nether_quartz_ore": { category: "quartz", minTier: 1, dropItem: "minecraft:quartz" },

  "minecraft:ancient_debris": { category: "ancient_debris", minTier: 4, dropItem: "minecraft:ancient_debris" },
};

function getOreInfo(blockId) {
  if (!blockId) return null;
  return ORE_DEFINITIONS[blockId] || null;
}

const NEIGHBOR_OFFSETS_26 = [];
for (let dx = -1; dx <= 1; dx++) {
  for (let dy = -1; dy <= 1; dy++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (dx === 0 && dy === 0 && dz === 0) continue;
      NEIGHBOR_OFFSETS_26.push({ x: dx, y: dy, z: dz });
    }
  }
}

function getMainhandTool(player) {
  if (!isAlive(player)) return undefined;
  const equippable = player.getComponent("minecraft:equippable");
  if (!equippable) return undefined;
  return equippable.getEquipment(EquipmentSlot.Mainhand);
}

function checkToolSafety(player) {
  if (!isAlive(player)) {
    return { safe: false, remaining: 0 };
  }

  const tool = getMainhandTool(player);
  if (!tool) {
    return { safe: false, remaining: 0 };
  }

  const durabilityComp = tool.getComponent("minecraft:durability");
  if (!durabilityComp) {
    return { safe: true, tool, remaining: 9999 };
  }

  const remaining = durabilityComp.maxDurability - durabilityComp.damage;
  if (remaining <= MINER.DURABILITY_SAFETY_THRESHOLD) {
    return { safe: false, tool, remaining };
  }

  return { safe: true, tool, remaining };
}

function applyToolDurabilityDamage(player) {
  if (!isAlive(player)) return false;

  const equippable = player.getComponent("minecraft:equippable");
  if (!equippable) return false;

  const tool = equippable.getEquipment(EquipmentSlot.Mainhand);
  if (!tool) return false;

  const durabilityComp = tool.getComponent("minecraft:durability");
  if (!durabilityComp) return true;

  let unbreakingLevel = 0;
  try {
    const enchantable = tool.getComponent("minecraft:enchantable");
    if (enchantable) {
      const unbreaking = enchantable.getEnchantment("unbreaking");
      if (unbreaking && typeof unbreaking.level === "number") {
        unbreakingLevel = unbreaking.level;
      }
    }
  } catch (err) {}

  const shouldTakeDamage =
    unbreakingLevel > 0 ? Math.random() < 1.0 / (unbreakingLevel + 1) : true;

  if (shouldTakeDamage) {
    durabilityComp.damage += 1;

    if (durabilityComp.damage >= durabilityComp.maxDurability) {
      equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
      try {
        player.playSound("random.break", { volume: 1.0, pitch: 0.9 });
      } catch (e) {}
      return false;
    }

    equippable.setEquipment(EquipmentSlot.Mainhand, tool);
  }

  return true;
}

function notifyToolProtection(player, remainingDurability) {
  if (!isAlive(player)) return;

  try {
    player.playSound(MINER.ALERT_SOUND, {
      volume: MINER.ALERT_VOLUME,
      pitch: MINER.ALERT_PITCH,
    });
  } catch (e) {}

  try {
    player.onScreenDisplay.setActionBar(
      `§e[Tool Protection] §cStopped mining to save tool! §6(${remainingDurability} durability left)`
    );
  } catch (e) {}
}

function calculateFortuneDropCount(fortuneLevel, minBase = 1, maxBase = 1) {
  const baseCount =
    minBase === maxBase
      ? minBase
      : Math.floor(Math.random() * (maxBase - minBase + 1)) + minBase;

  if (fortuneLevel <= 0) return baseCount;
  const multiplier = Math.max(1, Math.floor(Math.random() * (fortuneLevel + 2)));
  return Math.min(baseCount * multiplier, 64);
}

function isTreeCanopy(dimension, blocks) {
  if (!blocks || blocks.length === 0) return false;
  const candidates = [...blocks].sort((a, b) => b.y - a.y).slice(0, 8);
  for (const pos of candidates) {
    for (let dx = -2; dx <= 2; dx++) {
      for (let dz = -2; dz <= 2; dz++) {
        for (let dy = -1; dy <= 2; dy++) {
          try {
            const b = dimension.getBlock({
              x: pos.x + dx,
              y: pos.y + dy,
              z: pos.z + dz,
            });
            if (!b) continue;

            if (b.typeId.includes("wart_block") || b.typeId.includes("shroomlight")) {
              return true;
            }

            if (b.typeId.includes("leaves")) {
              const permutation = b.permutation;
              const isPersistent = permutation?.getState("persistent_bit");
              if (isPersistent === true) {
                continue;
              }
              return true;
            }
          } catch (e) {}
        }
      }
    }
  }
  return false;
}

function executeTreeCapitator(player, dimension, startLoc, startBlockId, onComplete) {
  if (typeof startBlockId === "function") {
    onComplete = startBlockId;
    startBlockId = null;
  }
  if (!MINER.TREE_CAPITATOR_ENABLED) {
    if (onComplete) onComplete();
    return;
  }

  const targetSpecies = startBlockId ? getWoodSpecies(startBlockId) : null;
  const visited = new Set();
  visited.add(`${startLoc.x},${startLoc.y},${startLoc.z}`);

  const blocksToBreak = [];
  const queue = [{ x: startLoc.x, y: startLoc.y, z: startLoc.z }];

  while (queue.length > 0 && blocksToBreak.length < MINER.MAX_TREE_BLOCKS) {
    const cur = queue.shift();

    for (let dy = 0; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          if (dx === 0 && dy === 0 && dz === 0) continue;

          const nx = cur.x + dx;
          const ny = cur.y + dy;
          const nz = cur.z + dz;

          if (ny < startLoc.y) continue;
          if (ny > startLoc.y + MINER.MAX_TREE_HEIGHT) continue;

          const key = `${nx},${ny},${nz}`;
          if (visited.has(key)) continue;
          visited.add(key);

          try {
            const block = dimension.getBlock({ x: nx, y: ny, z: nz });
            if (block && isMatchingLog(block.typeId, targetSpecies)) {
              const logPos = { x: nx, y: ny, z: nz };
              blocksToBreak.push(logPos);
              queue.push(logPos);
              if (blocksToBreak.length >= MINER.MAX_TREE_BLOCKS) break;
            }
          } catch (e) {}
        }
        if (blocksToBreak.length >= MINER.MAX_TREE_BLOCKS) break;
      }
      if (blocksToBreak.length >= MINER.MAX_TREE_BLOCKS) break;
    }
  }

  if (blocksToBreak.length === 0) {
    if (onComplete) onComplete();
    return;
  }

  if (!isTreeCanopy(dimension, blocksToBreak)) {
    if (onComplete) onComplete();
    return;
  }

  for (const pos of blocksToBreak) {
    if (!isAlive(player)) break;

    const safety = checkToolSafety(player);
    if (!safety.safe) {
      notifyToolProtection(player, safety.remaining);
      break;
    }

    try {
      dimension.runCommand(`setblock ${pos.x} ${pos.y} ${pos.z} air destroy`);
      applyToolDurabilityDamage(player);
    } catch (err) {}
  }

  if (onComplete) onComplete();
}

function executeDominoOreMiner(player, dimension, startLoc, startBlockId, onComplete) {
  if (!MINER.DOMINO_ORE_MINER_ENABLED) {
    if (onComplete) onComplete();
    return;
  }

  const startOreInfo = getOreInfo(startBlockId);
  if (!startOreInfo) {
    if (onComplete) onComplete();
    return;
  }

  const initialTool = getMainhandTool(player);
  const toolTier = getPickaxeTier(initialTool?.typeId);
  if (toolTier < startOreInfo.minTier) {
    if (onComplete) onComplete();
    return;
  }

  const queue = [{ x: startLoc.x, y: startLoc.y, z: startLoc.z }];
  const visited = new Set();
  visited.add(`${startLoc.x},${startLoc.y},${startLoc.z}`);

  const cluster = [];

  while (queue.length > 0 && cluster.length < MINER.MAX_ORE_CLUSTER_SIZE) {
    const current = queue.shift();

    for (const offset of NEIGHBOR_OFFSETS_26) {
      const nx = current.x + offset.x;
      const ny = current.y + offset.y;
      const nz = current.z + offset.z;
      const key = `${nx},${ny},${nz}`;

      if (visited.has(key)) continue;
      visited.add(key);

      if (ny < -64 || ny > 320) continue;

      try {
        const neighborBlock = dimension.getBlock({ x: nx, y: ny, z: nz });
        if (!neighborBlock) continue;

        const neighborOreInfo = getOreInfo(neighborBlock.typeId);
        if (neighborOreInfo && neighborOreInfo.category === startOreInfo.category) {
          cluster.push({
            x: nx,
            y: ny,
            z: nz,
            blockId: neighborBlock.typeId,
            oreInfo: neighborOreInfo,
          });
          queue.push({ x: nx, y: ny, z: nz });

          if (cluster.length >= MINER.MAX_ORE_CLUSTER_SIZE) break;
        }
      } catch (err) {}
    }
  }

  if (cluster.length === 0) {
    if (onComplete) onComplete();
    return;
  }

  for (const target of cluster) {
    if (!isAlive(player)) break;

    const safety = checkToolSafety(player);
    if (!safety.safe) {
      notifyToolProtection(player, safety.remaining);
      break;
    }

    const currentTool = safety.tool;
    const currentTier = getPickaxeTier(currentTool?.typeId);
    if (currentTier < target.oreInfo.minTier) break;

    let silkTouch = false;
    let fortuneLevel = 0;

    try {
      const enchantable = currentTool.getComponent("minecraft:enchantable");
      if (enchantable) {
        silkTouch = Boolean(enchantable.getEnchantment("silk_touch"));
        const fortune = enchantable.getEnchantment("fortune");
        if (fortune && typeof fortune.level === "number") {
          fortuneLevel = fortune.level;
        }
      }
    } catch (e) {}

    try {
      const centerPos = { x: target.x + 0.5, y: target.y + 0.5, z: target.z + 0.5 };

      if (silkTouch) {
        dimension.spawnItem(new ItemStack(target.blockId, 1), centerPos);
        dimension.getBlock({ x: target.x, y: target.y, z: target.z })?.setType("minecraft:air");
        try {
          dimension.playSound("dig.stone", centerPos, { volume: 0.8, pitch: 1.0 });
        } catch (pe) {}
      } else if (
        fortuneLevel > 0 &&
        target.oreInfo.dropItem &&
        target.oreInfo.dropItem !== target.blockId
      ) {
        const minDrop = target.oreInfo.minDrop || 1;
        const maxDrop = target.oreInfo.maxDrop || 1;
        const count = calculateFortuneDropCount(fortuneLevel, minDrop, maxDrop);

        dimension.spawnItem(new ItemStack(target.oreInfo.dropItem, count), centerPos);
        dimension.getBlock({ x: target.x, y: target.y, z: target.z })?.setType("minecraft:air");
        try {
          dimension.playSound("dig.stone", centerPos, { volume: 0.8, pitch: 1.0 });
        } catch (pe) {}
      } else {
        dimension.runCommand(`setblock ${target.x} ${target.y} ${target.z} air destroy`);
      }

      applyToolDurabilityDamage(player);
    } catch (err) {}
  }

  if (onComplete) onComplete();
}

const activeOperations = new Set();

world.afterEvents.playerBreakBlock.subscribe((event) => {
  const { block, brokenBlockPermutation, player, dimension, itemStackBeforeBreak } = event;

  if (!isAlive(player)) return;
  if (!player.isSneaking) return;
  if (activeOperations.has(player.id)) return;

  const startLoc = {
    x: Math.floor(block.location.x),
    y: Math.floor(block.location.y),
    z: Math.floor(block.location.z),
  };
  const brokenTypeId = brokenBlockPermutation?.type?.id;
  if (!brokenTypeId) return;

  const tool = getMainhandTool(player) || itemStackBeforeBreak;
  if (!tool) return;

  const toolTypeId = tool.typeId;
  const settings = getSettings(player);

  if (settings.treeCapitator && isAxe(toolTypeId) && isEligibleLog(brokenTypeId)) {
    activeOperations.add(player.id);
    try {
      executeTreeCapitator(player, dimension, startLoc, brokenTypeId, () => {
        activeOperations.delete(player.id);
      });
    } catch (err) {
      activeOperations.delete(player.id);
    }
    return;
  }

  if (settings.dominoMiner && isPickaxe(toolTypeId) && getOreInfo(brokenTypeId)) {
    activeOperations.add(player.id);
    try {
      executeDominoOreMiner(player, dimension, startLoc, brokenTypeId, () => {
        activeOperations.delete(player.id);
      });
    } catch (err) {
      activeOperations.delete(player.id);
    }
    return;
  }
});

console.warn(`[Smart Tool Hub v${VERSION}] Initialized.`);
