// Scoring of tools by tier, enchantments and durability.
import { CONFIG } from "./config.js";
import { ToolCategory } from "./tool-categories.js";
import { normalizeId } from "./utils.js";

export const TIER_SCORES = {
  netherite: 50,
  diamond: 40,
  iron: 30,
  stone: 20,
  golden: 15,
  gold: 15,
  wooden: 10,
  wood: 10,
};

export function getMaterialTier(id) {
  for (const [tier, score] of Object.entries(TIER_SCORES)) {
    if (id.includes(tier)) return score;
  }
  return 0;
}

export function readDurability(item) {
  try {
    const dur = item?.getComponent("minecraft:durability") || item?.getComponent("durability");
    if (!dur) return null;
    const max = dur.maxDurability;
    const damage = dur.damage;
    return {
      remaining: Math.max(0, max - damage),
      fraction: max > 0 ? (max - damage) / max : 1,
    };
  } catch {
    return null;
  }
}

export function readEnchantments(item) {
  const result = { efficiency: 0, fortune: 0, silk: 0, sharpness: 0, mending: 0 };
  try {
    const enchants = item?.getComponent("minecraft:enchantable") || item?.getComponent("enchantable");
    if (!enchants) return result;
    for (const ench of enchants.getEnchantments()) {
      const type = (ench.type?.id || ench.id || "").toLowerCase();
      if (type.includes("efficiency")) result.efficiency = ench.level;
      if (type.includes("fortune")) result.fortune = ench.level;
      if (type.includes("silk_touch")) result.silk = ench.level;
      if (type.includes("sharpness")) result.sharpness = ench.level;
      if (type.includes("mending")) result.mending = ench.level;
    }
  } catch {}
  return result;
}

export function needsRepair(item) {
  if (!item) return false;
  const durability = readDurability(item);
  if (!durability || durability.fraction >= 1) return false;
  return readEnchantments(item).mending > 0;
}

export function scoreItem(item, category, slot, blockId) {
  if (!item?.typeId) return -Infinity;
  const id = normalizeId(item.typeId);
  let score = 0;

  switch (category) {
    case ToolCategory.PICKAXE:
      if (!id.endsWith("_pickaxe")) return -Infinity;
      score = getMaterialTier(id);
      break;
    case ToolCategory.AXE:
      if (!id.endsWith("_axe")) return -Infinity;
      score = getMaterialTier(id);
      break;
    case ToolCategory.SHOVEL:
      if (!id.endsWith("_shovel")) return -Infinity;
      score = getMaterialTier(id);
      break;
    case ToolCategory.HOE:
      if (!id.endsWith("_hoe")) return -Infinity;
      score = getMaterialTier(id);
      break;
    case ToolCategory.LEAVES:
      if (id.includes("shears")) score = 100;
      else if (id.endsWith("_hoe")) score = 50 + getMaterialTier(id);
      else if (id.endsWith("_sword")) score = 20 + getMaterialTier(id);
      else return -Infinity;
      break;
    case ToolCategory.WEB:
      if (id.includes("shears")) score = 100;
      else if (id.endsWith("_sword")) score = 50 + getMaterialTier(id);
      else return -Infinity;
      break;
    case ToolCategory.SHEARS_OR_SWORD:
      if (id.includes("shears")) score = 100;
      else if (id.endsWith("_sword")) score = 50 + getMaterialTier(id);
      else return -Infinity;
      break;
    case ToolCategory.SILK:
      if (!/_(pickaxe|axe|shovel|hoe)$/.test(id)) return -Infinity;
      if (readEnchantments(item).silk <= 0) return -Infinity;
      score = getMaterialTier(id);
      break;
    case ToolCategory.WEAPON:
      if (id.endsWith("_sword")) score = 100 + getMaterialTier(id);
      else if (id.endsWith("_axe")) score = 80 + getMaterialTier(id);
      else if (id.endsWith("_mace")) score = 90;
      else return -Infinity;
      break;
    default:
      return -Infinity;
  }

  const enchants = readEnchantments(item);
  score += enchants.efficiency * 2;
  score += enchants.sharpness * 3;

  if (category === ToolCategory.PICKAXE && blockId) {
    if (blockId.endsWith("_ore")) {
      score += enchants.fortune * 1.5;
      if (enchants.silk > 0) score -= 8;
    }
  }

  if (category === ToolCategory.AXE && blockId === "bookshelf" && enchants.silk > 0) {
    score += CONFIG.SILK_BLOCK_BONUS;
  }

  const durability = readDurability(item);
  if (durability) {
    if (durability.remaining <= CONFIG.LOW_DURABILITY_USES) {
      score -= CONFIG.LOW_DURABILITY_PENALTY;
    } else {
      score += durability.fraction;
    }
  }

  return score;
}
