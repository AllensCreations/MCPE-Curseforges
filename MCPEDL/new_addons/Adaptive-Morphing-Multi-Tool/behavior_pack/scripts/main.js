import { world, system, ItemStack } from "@minecraft/server";

const NS = "allenscreations:adaptive_";
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
  if (!item?.typeId?.startsWith(NS)) return undefined;

  if (item.typeId === "allenscreations:adaptive_morphing_tool") {
    return { tier: "diamond", role: "pickaxe" };
  }

  const match = item.typeId.match(/^allenscreations:adaptive_(wood|copper|iron|gold|diamond|netherite)_(axe|pickaxe|shovel|sword|shears)$/);
  return match ? { tier: match[1], role: match[2] } : undefined;
}

function roleForBlock(blockId) {
  const id = String(blockId).toLowerCase();
  if (/(log|wood|stem|hyphae|planks|crafting_table|chest)/.test(id)) return "axe";
  if (/(stone|ore|deepslate|cobblestone|bricks|terracotta|concrete|netherrack|blackstone|prismarine|end_stone)/.test(id)) return "pickaxe";
  if (/(dirt|grass_block|sand|gravel|clay|snow|mud|soul_sand|soul_soil|podzol|mycelium|farmland)/.test(id)) return "shovel";
  if (/(leaves|wool|web|vine|coral|seagrass|hanging_roots|glow_lichen)/.test(id)) return "shears";
  return undefined;
}

function preserveEnchantments(held, next) {
  const oldEnchantable = held.getComponent("minecraft:enchantable");
  const newEnchantable = next.getComponent("minecraft:enchantable");
  if (!oldEnchantable || !newEnchantable) return;

  for (const enchantment of oldEnchantable.getEnchantments()) {
    try {
      if (newEnchantable.canAddEnchantment(enchantment)) {
        newEnchantable.addEnchantment(enchantment);
      }
    } catch {
      // Incompatible enchantments are intentionally skipped for the new tool role.
    }
  }
}

function morph(player, nextRole) {
  try {
    const equipment = player.getComponent("minecraft:equippable");
    const held = equipment?.getEquipment("Mainhand");
    const parsed = parseTool(held);
    if (!parsed || parsed.role === nextRole) return;

    const next = new ItemStack(`${NS}${parsed.tier}_${nextRole}`, 1);
    const defaultOldName = `Adaptive ${TIERS[parsed.tier].label} ${ROLES[parsed.role].label}`;
    const defaultNextName = `Adaptive ${TIERS[parsed.tier].label} ${ROLES[nextRole].label}`;
    const oldName = held.nameTag;
    const isBaseDefaultName = held.typeId === "allenscreations:adaptive_morphing_tool" && oldName === "Adaptive Morphing Multi-Tool";
    next.nameTag = !oldName || oldName === defaultOldName || isBaseDefaultName ? defaultNextName : oldName;

    const oldDurability = held.getComponent("minecraft:durability");
    const newDurability = next.getComponent("minecraft:durability");
    if (oldDurability && newDurability) {
      newDurability.damage = Math.max(
        0,
        Math.min(oldDurability.damage, newDurability.maxDurability - 1)
      );
    }

    preserveEnchantments(held, next);
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
    const key = String(error);
    if (!reportedErrors.has(key)) {
      reportedErrors.add(key);
      console.warn(`[Adaptive Morphing Multi-Tool] Morph failed: ${key}`);
    }
  }
}

world.afterEvents.playerBreakBlock.subscribe((event) => {
  const role = roleForBlock(event.brokenBlockPermutation.type.id);
  if (role) morph(event.player, role);
});

world.afterEvents.entityHitEntity.subscribe((event) => {
  if (event.damagingEntity.typeId === "minecraft:player") morph(event.damagingEntity, "sword");
});
