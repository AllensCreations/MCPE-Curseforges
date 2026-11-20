// Tool durability protection for chain mining.
import { system } from "@minecraft/server";
import { CONFIG } from "./config.js";
import { pendingToolDamage } from "./state.js";
import { getContainer, getMainhandTool, isGameMode } from "./utils.js";

export function checkToolSafety(player) {
  if (isGameMode(player, "creative")) return { safe: true, remaining: 9999 };
  const tool = getMainhandTool(player);
  if (!tool) return { safe: false, remaining: 0 };

  try {
    const durComp = tool.getComponent("minecraft:durability") || tool.getComponent("durability");
    if (!durComp) return { safe: true, remaining: 9999 };

    const remaining = durComp.maxDurability - durComp.damage - getPendingToolDamage(player);
    if (remaining <= CONFIG.DURABILITY_SAFETY_THRESHOLD) {
      return { safe: false, remaining };
    }
    return { safe: true, remaining };
  } catch (e) {
    return { safe: true, remaining: 9999 };
  }
}

export function getPendingToolDamage(player) {
  const entry = pendingToolDamage.get(player.id);
  return entry ? entry.damage : 0;
}

export function applyToolDurabilityDamage(player) {
  if (isGameMode(player, "creative")) return;
  const container = getContainer(player);
  if (!container) return;

  const slot = player.selectedSlotIndex;
  const tool = container.getItem(slot);
  if (!tool) return;

  try {
    const durComp = tool.getComponent("minecraft:durability") || tool.getComponent("durability");
    if (!durComp) return;

    let unbreakingLevel = 0;
    try {
      const enchComp = tool.getComponent("minecraft:enchantable") || tool.getComponent("enchantable");
      if (enchComp) {
        for (const ench of enchComp.getEnchantments()) {
          const enchId = (ench.type?.id || ench.id || "").toLowerCase();
          if (enchId.includes("unbreaking")) {
            unbreakingLevel = ench.level;
            break;
          }
        }
      }
    } catch (e) {}

    const shouldDamage = unbreakingLevel > 0
      ? Math.random() < 1 / (unbreakingLevel + 1)
      : true;
    if (!shouldDamage) return;

    let entry = pendingToolDamage.get(player.id);
    if (!entry || entry.slot !== slot || entry.typeId !== tool.typeId) {
      entry = { slot, typeId: tool.typeId, damage: 0 };
      pendingToolDamage.set(player.id, entry);
    }
    entry.damage += 1;
  } catch (e) {}
}

export function flushToolDamage(player) {
  const entry = pendingToolDamage.get(player.id);
  pendingToolDamage.delete(player.id);
  if (!entry || entry.damage <= 0) return;

  system.run(() => {
    try {
      if (!player.isValid) return;
      const container = getContainer(player);
      if (!container) return;

      const tool = container.getItem(entry.slot);
      if (!tool || tool.typeId !== entry.typeId) return;

      const durComp = tool.getComponent("minecraft:durability") || tool.getComponent("durability");
      if (!durComp) return;

      durComp.damage = Math.min(durComp.damage + entry.damage, durComp.maxDurability);
      container.setItem(entry.slot, tool);
    } catch (e) {}
  });
}

export function notifyToolProtection(player, remainingDurability) {
  try {
    player.playSound(CONFIG.ALERT_SOUND, {
      pitch: CONFIG.ALERT_PITCH,
      volume: CONFIG.ALERT_VOLUME,
    });
    player.onScreenDisplay.setActionBar(
      `§e[Tool Protection] §cStopped mining to save tool! §6(${remainingDurability} durability left)`
    );
  } catch (e) {}
}

export function notifyTreeTooLarge(player) {
  try {
    player.onScreenDisplay.setActionBar("§e[Tree Capitator] §6Tree too large, some logs were left standing");
  } catch (e) {}
}
