// Auto-switch event handlers and intervals.
import { world, system } from "@minecraft/server";
import { CONFIG } from "./config.js";
import { clearPendingSwap, restoreSwappedItem, scheduleSwapRetry, switchPlayerSlot1Tool } from "./slot-switch.js";
import { chainPauseUntil, lastAutoSwitchKey, lastBreakTick, lastSwap, miningActivity, recentCombat, swapBack, webInteraction } from "./state.js";
import { ToolCategory, getRequiredToolCategory } from "./tool-categories.js";
import { blockKey, getContainer, getTargetBlock, normalizeId } from "./utils.js";

export const NON_COMBAT_ENTITIES = new Set([
  "item", "arrow", "spectral_arrow", "xp_orb", "experience_orb", "snowball", "egg",
  "splash_potion", "lingering_potion", "ender_pearl", "eye_of_ender_signal",
  "lightning_bolt", "armor_stand", "painting", "item_frame", "glow_item_frame",
  "leash_knot", "boat", "chest_boat", "minecart", "chest_minecart", "hopper_minecart",
  "tnt_minecart", "command_block_minecart", "tnt", "falling_block",
]);

export function isCombatTarget(entity) {
  if (!entity?.typeId) return false;
  const id = normalizeId(entity.typeId);
  if (NON_COMBAT_ENTITIES.has(id)) return false;
  try {
    return id === "player" || !!entity.getComponent("minecraft:health");
  } catch {
    return false;
  }
}

export function isWeb(block) {
  if (!block?.typeId) return false;
  const id = normalizeId(block.typeId);
  return id === "web" || id.includes("cobweb");
}

world.afterEvents.entityHitBlock.subscribe((event) => {
  try {
    const player = event.damagingEntity;
    if (!player || player.typeId !== "minecraft:player") return;
    if (player.selectedSlotIndex !== CONFIG.AUTO_SWITCH_SLOT) return;

    const block = event.hitBlock;
    if (!block) return;

    const category = getRequiredToolCategory(block.typeId);
    if (!category) return;

    const now = system.currentTick;
    const lastCombat = recentCombat.get(player.id) ?? -Infinity;
    if (now - lastCombat < CONFIG.COMBAT_COOLDOWN_TICKS) return;

    webInteraction.set(player.id, {
      key: blockKey(block),
      lastInteractionTick: now,
    });

    if (!switchPlayerSlot1Tool(player, category, block.typeId)) {
      scheduleSwapRetry(player, category, block.typeId);
    }
  } catch (e) {}
});

world.afterEvents.entityHitEntity.subscribe((event) => {
  try {
    const player = event.damagingEntity;
    if (!player || player.typeId !== "minecraft:player") return;
    if (player.selectedSlotIndex !== CONFIG.AUTO_SWITCH_SLOT) return;
    if (!isCombatTarget(event.hitEntity)) return;

    recentCombat.set(player.id, system.currentTick);
    clearPendingSwap(player.id);
    webInteraction.delete(player.id);

    switchPlayerSlot1Tool(player, ToolCategory.WEAPON);
  } catch (e) {}
});

system.runInterval(() => {
  const now = system.currentTick;

  for (const player of world.getAllPlayers()) {
    try {
      if (player.selectedSlotIndex !== CONFIG.AUTO_SWITCH_SLOT) {
        webInteraction.delete(player.id);
        continue;
      }

      const lastCombat = recentCombat.get(player.id) ?? -Infinity;
      if (now - lastCombat < CONFIG.WEB_COMBAT_COOLDOWN) continue;

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
          lastInteractionTick: -Infinity,
          initialTick: now,
        });
        continue;
      }

      const elapsed = now - state.initialTick;
      if (elapsed < CONFIG.WEB_INTERACTION_WINDOW) continue;

      if (now - state.lastInteractionTick > CONFIG.WEB_INTERACTION_WINDOW) {
        webInteraction.delete(player.id);
        continue;
      }

      const inventory = getContainer(player);
      const held = inventory?.getItem(CONFIG.AUTO_SWITCH_SLOT);
      if (held && normalizeId(held.typeId).includes("shears")) continue;

      switchPlayerSlot1Tool(player, ToolCategory.WEB, block.typeId);
      webInteraction.set(player.id, {
        key,
        initialTick: now,
        lastInteractionTick: now,
      });
    } catch (e) {}
  }
}, CONFIG.WEB_CHECK_INTERVAL);

export function markMining(player) {
  if (!player || player.typeId !== "minecraft:player") return;
  if (system.currentTick < (chainPauseUntil.get(player.id) ?? 0)) return;
  miningActivity.set(player.id, system.currentTick);
}

world.afterEvents.entityHitBlock.subscribe((event) => {
  try {
    markMining(event.damagingEntity);
  } catch (e) {}
});

world.afterEvents.playerBreakBlock.subscribe((event) => {
  try {
    lastBreakTick.set(event.player.id, system.currentTick);
  } catch (e) {}
});

system.runInterval(() => {
  const now = system.currentTick;
  for (const player of world.getAllPlayers()) {
    try {
      const last = miningActivity.get(player.id);
      if (last === undefined || now - last > CONFIG.MINING_ACTIVE_TICKS) {
        lastAutoSwitchKey.delete(player.id);
        if (swapBack.has(player.id)) {
          const idleSince = Math.max(
            last ?? -Infinity,
            lastBreakTick.get(player.id) ?? -Infinity,
            recentCombat.get(player.id) ?? -Infinity,
            lastSwap.get(player.id)?.tick ?? -Infinity
          );
          if (now - idleSince > CONFIG.SWAP_BACK_TICKS && now >= (chainPauseUntil.get(player.id) ?? 0)) {
            restoreSwappedItem(player);
          }
        }
        continue;
      }
      if (player.selectedSlotIndex !== CONFIG.AUTO_SWITCH_SLOT) continue;

      const lastCombat = recentCombat.get(player.id) ?? -Infinity;
      if (now - lastCombat < CONFIG.COMBAT_COOLDOWN_TICKS) continue;

      if (now - (lastBreakTick.get(player.id) ?? -Infinity) < CONFIG.BREAK_SWITCH_DELAY_TICKS) continue;

      const target = getTargetBlock(player);
      if (!target) continue;

      const key = blockKey(target);
      if (lastAutoSwitchKey.get(player.id) === key) continue;

      const category = getRequiredToolCategory(target.typeId);
      if (!category) continue;

      lastAutoSwitchKey.set(player.id, key);
      switchPlayerSlot1Tool(player, category, target.typeId);
    } catch (e) {}
  }
}, 1);
