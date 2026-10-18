import { world, system } from "@minecraft/server";

const VERSION = "1.6.0";

const CONFIG = {
  slot: 0,
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

    result.silk =
      component.getEnchantment("silk_touch")?.level ?? 0;

    result.fortune =
      component.getEnchantment("fortune")?.level ?? 0;

    result.efficiency =
      component.getEnchantment("efficiency")?.level ?? 0;

    result.sharpness =
      component.getEnchantment("sharpness")?.level ?? 0;
  } catch {}

  return result;
}

function readDurability(item) {
  try {
    const component = item.getComponent("minecraft:durability");

    if (!component) return null;

    const remaining =
      component.maxDurability - component.damage;

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
    return id.includes("pickaxe")
      ? getMaterialTier(id) + hotbarBonus
      : -1;
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
    return id.includes("hoe")
      ? getMaterialTier(id) + hotbarBonus
      : -1;
  }

  if (category === ToolCategory.LEAVES) {
    if (id.includes("shears")) return 100 + hotbarBonus;

    return id.includes("hoe")
      ? getMaterialTier(id) + hotbarBonus
      : -1;
  }

  if (category === ToolCategory.WEB) {
    if (id.includes("shears")) return 100 + hotbarBonus;

    return id.includes("sword")
      ? getMaterialTier(id) + hotbarBonus
      : -1;
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

    return (
      getMaterialTier(id) +
      (sword ? 2 : 0) +
      hotbarBonus
    );
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
    if (durability.remaining <= CONFIG.lowDurabilityUses) {
      score -= CONFIG.lowDurabilityPenalty;
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
    (
      id.endsWith("_door") ||
      id.endsWith("_trapdoor") ||
      id.endsWith("_button") ||
      id.endsWith("_pressure_plate") ||
      id.endsWith("_stairs") ||
      id.endsWith("_slab")
    )
  ) {
    return ToolCategory.AXE;
  }

  if (
    id.includes("stone") ||
    id.includes("cobble") ||
    id.includes("deepslate") ||
    id.includes("ore") ||
    id.includes("granite") ||
    id.includes("diorite") ||
    id.includes("andesite") ||
    id.includes("tuff") ||
    id.includes("calcite") ||
    id.includes("basalt") ||
    id.includes("blackstone") ||
    id.includes("obsidian") ||
    id.includes("ancient_debris") ||
    id.includes("brick") ||
    id.includes("terracotta") ||
    (id.includes("concrete") && !id.endsWith("concrete_powder")) ||
    id.includes("sandstone") ||
    id.includes("prismarine") ||
    id.includes("netherrack") ||
    id.includes("end_stone") ||
    id.includes("purpur") ||
    id.includes("magma") ||
    id.includes("copper") ||
    id.includes("iron") ||
    id.includes("gold") ||
    id.includes("diamond") ||
    id.includes("emerald") ||
    id.includes("lapis") ||
    id.includes("redstone") ||
    id.includes("netherite") ||
    id.includes("amethyst") ||
    id.includes("dripstone") ||
    id.includes("furnace") ||
    id.includes("smoker") ||
    id.includes("hopper") ||
    id.includes("dispenser") ||
    id.includes("dropper") ||
    id.includes("cauldron") ||
    id.includes("anvil") ||
    id.includes("enchanting_table") ||
    id.includes("brewing_stand") ||
    id.includes("grindstone") ||
    id.includes("stonecutter") ||
    id.includes("bell") ||
    id.includes("lantern") ||
    id.includes("chain") ||
    id.includes("spawner") ||
    id.includes("vault") ||
    id.includes("crafter") ||
    id.endsWith("_stairs") ||
    id.endsWith("_slab") ||
    id.endsWith("_wall")
  ) {
    return ToolCategory.PICKAXE;
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

function switchPlayerSlot1Tool(player, category, blockTypeId = "") {
  if (!player || player.selectedSlotIndex !== CONFIG.slot) {
    return false;
  }

  const container = getInventory(player);

  if (!container) return false;

  const blockId = normalizeId(blockTypeId);

  const currentScore = scoreItem(
    container.getItem(CONFIG.slot),
    category,
    CONFIG.slot,
    blockId
  );

  let bestSlot = -1;
  let bestScore = -Infinity;

  for (let slot = 1; slot < container.size; slot++) {
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
    bestScore < currentScore + CONFIG.switchMargin
  ) {
    return false;
  }

  try {
    container.swapItems(bestSlot, CONFIG.slot, container);
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
    return (
      id === "player" ||
      !!entity.getComponent("minecraft:health")
    );
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

  const runId = system.runTimeout(() => {
    pendingSwaps.delete(player.id);

    try {
      if (player.selectedSlotIndex !== CONFIG.slot) return;

      switchPlayerSlot1Tool(player, category, blockTypeId);
    } catch {}
  }, CONFIG.retryTicks);

  pendingSwaps.set(player.id, runId);
}

function getTargetBlock(player) {
  try {
    return player.getBlockFromViewDirection({
      maxDistance: CONFIG.raycastDistance,
      includeLiquidBlocks: false,
      includePassableBlocks: true,
    })?.block;
  } catch {
    return undefined;
  }
}

// Ordinary blocks: only switch following an actual block-hit event.
world.afterEvents.entityHitBlock.subscribe((event) => {
  try {
    const player = event.damagingEntity;

    if (!player || player.typeId !== "minecraft:player") return;
    if (player.selectedSlotIndex !== CONFIG.slot) return;

    const block = event.hitBlock;

    if (!block) return;

    const category = getRequiredToolCategory(block.typeId);

    if (!category) return;

    const now = system.currentTick;
    const lastCombat = recentCombat.get(player.id) ?? -Infinity;

    if (now - lastCombat < CONFIG.combatCooldownTicks) {
      return;
    }

    webInteraction.set(player.id, {
      key: blockKey(block),
      lastInteractionTick: now,
    });

    if (!switchPlayerSlot1Tool(player, category, block.typeId)) {
      scheduleSwapRetry(player, category, block.typeId);
    }
  } catch {}
});

// Cobwebs: watch for interaction, not merely looking at them.
system.runInterval(() => {
  const now = system.currentTick;

  for (const player of world.getAllPlayers()) {
    try {
      if (player.selectedSlotIndex !== CONFIG.slot) {
        webInteraction.delete(player.id);
        continue;
      }

      const lastCombat = recentCombat.get(player.id) ?? -Infinity;

      if (now - lastCombat < CONFIG.webCombatCooldown) {
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

      if (elapsed < CONFIG.webInteractionWindow) {
        continue;
      }

      // Aiming alone is not sufficient: require a recent block interaction.
      if (
        now - state.lastInteractionTick >
        CONFIG.webInteractionWindow
      ) {
        webInteraction.delete(player.id);
        continue;
      }

      const inventory = getInventory(player);
      const held = inventory?.getItem(CONFIG.slot);

      if (held && normalizeId(held.typeId).includes("shears")) {
        continue;
      }

      switchPlayerSlot1Tool(
        player,
        ToolCategory.WEB,
        block.typeId
      );

      webInteraction.set(player.id, {
        key,
        initialTick: now,
        lastInteractionTick: now,
      });
    } catch {}
  }
}, CONFIG.webCheckInterval);

// Mob combat: switch to the best sword or axe.
world.afterEvents.entityHitEntity.subscribe((event) => {
  try {
    const player = event.damagingEntity;

    if (!player || player.typeId !== "minecraft:player") return;
    if (player.selectedSlotIndex !== CONFIG.slot) return;
    if (!isCombatTarget(event.hitEntity)) return;

    recentCombat.set(player.id, system.currentTick);

    clearPendingSwap(player.id);
    webInteraction.delete(player.id);

    switchPlayerSlot1Tool(player, ToolCategory.WEAPON);
  } catch {}
});

world.afterEvents.playerLeave.subscribe((event) => {
  recentCombat.delete(event.playerId);
  webInteraction.delete(event.playerId);
  clearPendingSwap(event.playerId);
});

console.warn(
  `[Passive Auto-Switch Tools v${VERSION}] Initialized.`
);
