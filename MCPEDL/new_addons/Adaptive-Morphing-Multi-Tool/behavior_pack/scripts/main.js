import { world, system, ItemStack, EnchantmentTypes } from "@minecraft/server";

const NS = "allenscreations:adaptive_";
const BASE_ITEM = "allenscreations:adaptive_morphing_tool";
const PENDING_ENCHANTMENTS = "allenscreations:adaptive_pending_enchantments";
const TIERS = {
  wood: { label: "Wood", durability: 59 },
  copper: { label: "Copper", durability: 190 },
  iron: { label: "Iron", durability: 250 },
  gold: { label: "Gold", durability: 32 },
  diamond: { label: "Diamond", durability: 1561 },
  netherite: { label: "Netherite", durability: 2031 }
};
const ROLES = {
  axe: { label: "Axe", particle: "minecraft:basic_flame_particle" },
  pickaxe: { label: "Pickaxe", particle: "minecraft:basic_flame_particle" },
  shovel: { label: "Shovel", particle: "minecraft:basic_flame_particle" },
  sword: { label: "Sword", particle: "minecraft:basic_flame_particle" },
  shears: { label: "Shears", particle: "minecraft:basic_flame_particle" }
};
const notices = new Map();
const reportedErrors = new Set();

function parseTool(item) {
  if (!item?.typeId?.startsWith(NS) && item?.typeId !== BASE_ITEM) return undefined;
  if (item.typeId === BASE_ITEM) return { tier: "diamond", role: "pickaxe" };

  const match = item.typeId.match(/^allenscreations:adaptive_(wood|copper|iron|gold|diamond|netherite)_(axe|pickaxe|shovel|sword|shears)$/);
  return match ? { tier: match[1], role: match[2] } : undefined;
}

function roleForBlock(blockId) {
  const id = String(blockId).toLowerCase().replace(/^minecraft:/, "");

  if (/(leaves|wool|cobweb|web|vine|coral|seagrass|hanging_roots|glow_lichen|deadbush|tall_grass|short_grass|fern|azalea|dripleaf|moss_carpet|carpet|nether_sprouts|pink_petals|spore_blossom)/.test(id)) return "shears";
  if (/(log|wood|stem|hyphae|planks|bamboo_block|bamboo_mosaic|crafting_table|chest|barrel|bookshelf|lectern|fence|fence_gate|door|trapdoor|sign|hanging_sign|pumpkin|melon|hay_block|target|composter|note_block|jukebox|loom|cartography_table|fletching_table|smithing_table|roots)/.test(id)) return "axe";
  if (/(stone|ore|deepslate|cobblestone|bricks|terracotta|concrete|netherrack|blackstone|prismarine|end_stone|obsidian|quartz_block|copper_block|iron_block|gold_block|diamond_block|emerald_block|redstone_block|lapis_block)/.test(id)) return "pickaxe";
  if (/(dirt|grass_block|sand|gravel|clay|snow|mud|soul_sand|soul_soil|podzol|mycelium|farmland|powder_snow|dirt_path|suspicious_sand|suspicious_gravel)/.test(id)) return "shovel";
  return undefined;
}

function readPendingEnchantments(item) {
  try {
    const raw = item.getDynamicProperty(PENDING_ENCHANTMENTS);
    if (typeof raw !== "string" || !raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((entry) =>
      entry && typeof entry.id === "string" &&
      Number.isInteger(entry.level) && entry.level > 0
    ) : [];
  } catch {
    return [];
  }
}

function copyDynamicProperties(source, target) {
  try {
    for (const id of source.getDynamicPropertyIds()) {
      if (id === PENDING_ENCHANTMENTS) continue;
      const value = source.getDynamicProperty(id);
      if (value !== undefined) target.setDynamicProperty(id, value);
    }
  } catch (error) {
    reportOnce("dynamic properties", error);
  }
}

function copyAdventureRestrictions(source, target) {
  try {
    const canDestroy = source.getCanDestroy();
    if (canDestroy.length) target.setCanDestroy(canDestroy);
  } catch { /* The item may not have adventure-mode restrictions. */ }

  try {
    const canPlaceOn = source.getCanPlaceOn();
    if (canPlaceOn.length) target.setCanPlaceOn(canPlaceOn);
  } catch { /* The item may not have adventure-mode restrictions. */ }
}

function collectEnchantments(item) {
  const entries = new Map();
  try {
    const component = item.getComponent("minecraft:enchantable");
    for (const enchantment of component?.getEnchantments() ?? []) {
      entries.set(enchantment.type.id, { id: enchantment.type.id, level: enchantment.level });
    }
  } catch (error) {
    reportOnce("reading enchantments", error);
  }

  for (const pending of readPendingEnchantments(item)) {
    if (!entries.has(pending.id)) entries.set(pending.id, pending);
  }
  return [...entries.values()];
}

function applyEnchantments(enchantments, target) {
  const component = target.getComponent("minecraft:enchantable");
  const pending = [];

  for (const entry of enchantments) {
    try {
      const type = EnchantmentTypes.get(entry.id);
      if (!type) {
        pending.push(entry);
        continue;
      }

      const enchantment = { type, level: entry.level };
      if (component && component.canAddEnchantment(enchantment)) {
        component.addEnchantment(enchantment);
      } else {
        // Keep incompatible enchantments attached as metadata so they can return
        // when the tool morphs into a role that supports them.
        pending.push(entry);
      }
    } catch (error) {
      pending.push(entry);
      reportOnce(`enchantment ${entry.id}`, error);
    }
  }

  try {
    if (pending.length) target.setDynamicProperty(PENDING_ENCHANTMENTS, JSON.stringify(pending));
    else target.setDynamicProperty(PENDING_ENCHANTMENTS, undefined);
  } catch (error) {
    reportOnce("saving pending enchantments", error);
  }
}

function preserveItemData(held, next) {
  // Preserve custom names while updating the generated default name.
  const parsed = parseTool(held);
  const nextParsed = parseTool(next);
  const oldDefaultName = parsed ? `Adaptive ${TIERS[parsed.tier].label} ${ROLES[parsed.role].label}` : "";
  const nextDefaultName = nextParsed ? `Adaptive ${TIERS[nextParsed.tier].label} ${ROLES[nextParsed.role].label}` : "";
  const oldName = held.nameTag;
  const isBaseDefaultName = held.typeId === BASE_ITEM && oldName === "Adaptive Morphing Multi-Tool";
  next.nameTag = !oldName || oldName === oldDefaultName || isBaseDefaultName ? nextDefaultName : oldName;

  try {
    const lore = held.getLore();
    if (lore.length) next.setLore(lore);
  } catch (error) {
    reportOnce("copying lore", error);
  }

  try {
    const oldDurability = held.getComponent("minecraft:durability");
    const newDurability = next.getComponent("minecraft:durability");
    if (oldDurability && newDurability) {
      // All roles in a tier use the same durability. Clamp safely for custom items.
      newDurability.damage = Math.max(0, Math.min(oldDurability.damage, newDurability.maxDurability - 1));
    }
  } catch (error) {
    reportOnce("copying durability", error);
  }

  copyAdventureRestrictions(held, next);
  copyDynamicProperties(held, next);
  applyEnchantments(collectEnchantments(held), next);
}

function reportOnce(context, error) {
  const key = `${context}: ${String(error)}`;
  if (reportedErrors.has(key)) return;
  reportedErrors.add(key);
  console.warn(`[Adaptive Morphing Multi-Tool] ${key}`);
}

function morph(player, nextRole) {
  try {
    const equipment = player.getComponent("minecraft:equippable");
    const held = equipment?.getEquipment("Mainhand");
    const parsed = parseTool(held);
    if (!parsed || parsed.role === nextRole) return;

    const next = new ItemStack(`${NS}${parsed.tier}_${nextRole}`, 1);
    preserveItemData(held, next);
    equipment.setEquipment("Mainhand", next);

    const now = system.currentTick;
    const previous = notices.get(player.id) ?? -100;
    if (now - previous >= 10) {
      notices.set(player.id, now);
      player.onScreenDisplay.setActionBar(`§6Adaptive ${TIERS[parsed.tier].label} ${ROLES[nextRole].label}`);
      player.dimension.spawnParticle(ROLES[nextRole].particle, {
        x: player.location.x,
        y: player.location.y + 1,
        z: player.location.z
      });
    }
  } catch (error) {
    reportOnce("morph failed", error);
  }
}

world.afterEvents.playerBreakBlock.subscribe((event) => {
  const role = roleForBlock(event.brokenBlockPermutation.type.id);
  if (role) morph(event.player, role);
});

world.afterEvents.entityHitEntity.subscribe((event) => {
  if (event.damagingEntity.typeId === "minecraft:player") morph(event.damagingEntity, "sword");
});
