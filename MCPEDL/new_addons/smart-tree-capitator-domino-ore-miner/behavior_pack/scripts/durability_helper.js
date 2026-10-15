/**
 * Durability Protection & Tool Management Helper
 * Created by AllensCreations — MCPE Curseforges
 */

import { EquipmentSlot } from "@minecraft/server";
import { CONFIG } from "./config.js";

/**
 * Retrieves the current item equipped in the player's mainhand.
 * @param {import("@minecraft/server").Player} player
 * @returns {import("@minecraft/server").ItemStack | undefined}
 */
export function getMainhandTool(player) {
  if (!player || !player.isValid()) return undefined;
  const equippable = player.getComponent("minecraft:equippable");
  if (!equippable) return undefined;
  return equippable.getEquipment(EquipmentSlot.Mainhand);
}

/**
 * Inspects the player's mainhand tool and verifies if it is safe to break another block.
 *
 * @param {import("@minecraft/server").Player} player
 * @param {string} expectedTypeCategory "axe" | "pickaxe"
 * @returns {{ safe: boolean, tool?: import("@minecraft/server").ItemStack, remaining: number, reason?: string }}
 */
export function checkToolSafety(player, expectedTypeCategory) {
  if (!player || !player.isValid()) {
    return { safe: false, remaining: 0, reason: "INVALID_PLAYER" };
  }

  const tool = getMainhandTool(player);
  if (!tool) {
    return { safe: false, remaining: 0, reason: "NO_TOOL_EQUIPPED" };
  }

  // Check durability component
  const durabilityComp = tool.getComponent("minecraft:durability");
  if (!durabilityComp) {
    // If the tool has no durability component (e.g. creative or indestructible tool), it is safe
    return { safe: true, tool, remaining: 9999 };
  }

  const maxDurability = durabilityComp.maxDurability;
  const currentDamage = durabilityComp.damage;
  const remaining = maxDurability - currentDamage;

  if (remaining <= CONFIG.DURABILITY_SAFETY_THRESHOLD) {
    return { safe: false, tool, remaining, reason: "SAFETY_THRESHOLD_REACHED" };
  }

  return { safe: true, tool, remaining };
}

/**
 * Deducts durability from the player's mainhand tool, respecting the Unbreaking enchantment.
 * Re-validates equipment before and after modification.
 *
 * @param {import("@minecraft/server").Player} player
 * @returns {boolean} True if durability was successfully managed, false if tool broke/missing
 */
export function applyToolDurabilityDamage(player) {
  if (!player || !player.isValid()) return false;

  const equippable = player.getComponent("minecraft:equippable");
  if (!equippable) return false;

  const tool = equippable.getEquipment(EquipmentSlot.Mainhand);
  if (!tool) return false;

  const durabilityComp = tool.getComponent("minecraft:durability");
  if (!durabilityComp) return true; // No durability component to deduct

  // Inspect Unbreaking enchantment
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

  // Minecraft Vanilla formula for tools: 100 / (unbreakingLevel + 1)% chance of taking damage
  const shouldTakeDamage = unbreakingLevel > 0
    ? (Math.random() < 1.0 / (unbreakingLevel + 1))
    : true;

  if (shouldTakeDamage) {
    durabilityComp.damage += 1;

    // Check if tool broke
    if (durabilityComp.damage >= durabilityComp.maxDurability) {
      equippable.setEquipment(EquipmentSlot.Mainhand, undefined);
      try {
        player.playSound("random.break", { volume: 1.0, pitch: 0.9 });
      } catch (e) {}
      return false;
    }

    // Save updated tool back to player mainhand slot
    equippable.setEquipment(EquipmentSlot.Mainhand, tool);
  }

  return true;
}

/**
 * Triggers an audio and action bar notification alerting the player that mining stopped
 * to protect their tool from breaking.
 *
 * @param {import("@minecraft/server").Player} player
 * @param {number} remainingDurability
 */
export function notifyToolProtection(player, remainingDurability) {
  if (!player || !player.isValid()) return;

  try {
    player.playSound(CONFIG.ALERT_SOUND, {
      volume: CONFIG.ALERT_VOLUME,
      pitch: CONFIG.ALERT_PITCH,
    });
  } catch (e) {}

  try {
    player.onScreenDisplay.setActionBar(
      `§e[Tool Protection] §cStopped mining to save tool! §6(${remainingDurability} durability left)`
    );
  } catch (e) {}
}
