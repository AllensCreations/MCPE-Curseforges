import { system } from "@minecraft/server";
import { CONFIG } from "./config.js";
import { chainPauseUntil, lastSwap, pendingSwaps, swapBack } from "./state.js";
import { needsRepair, scoreItem } from "./tool-scoring.js";
import { getContainer, normalizeId } from "./utils.js";

export function switchPlayerSlot1Tool(player, category, blockTypeId) {
  if (!player || player.selectedSlotIndex !== CONFIG.AUTO_SWITCH_SLOT) {
    return false;
  }
  if (system.currentTick < (chainPauseUntil.get(player.id) ?? 0)) return false;

  const container = getContainer(player);
  if (!container) return false;

  const blockId = normalizeId(blockTypeId);
  const currentScore = scoreItem(container.getItem(CONFIG.AUTO_SWITCH_SLOT), category, CONFIG.AUTO_SWITCH_SLOT, blockId);

  let bestSlot = -1;
  let bestScore = -Infinity;
  let bestItem;

  const lastSearchSlot = Math.min(container.size - 1, CONFIG.TOOL_SEARCH_LAST_SLOT);
  for (let slot = 1; slot <= lastSearchSlot; slot++) {
    if (CONFIG.PROTECTED_SLOTS.includes(slot)) continue;
    const item = container.getItem(slot);
    if (!item) continue;
    const score = scoreItem(item, category, slot, blockId);
    const tiedRepair =
      bestItem !== undefined &&
      Math.abs(score - bestScore) <= CONFIG.TOOL_TIE_TOLERANCE &&
      needsRepair(item) &&
      !needsRepair(bestItem);
    if (score > bestScore || tiedRepair) {
      bestScore = score;
      bestSlot = slot;
      bestItem = item;
    }
  }

  if (bestSlot === -1 || bestScore === -Infinity) return false;

  const currentItem = container.getItem(CONFIG.AUTO_SWITCH_SLOT);
  const repairSwap =
    currentScore !== -Infinity &&
    needsRepair(bestItem) &&
    !needsRepair(currentItem) &&
    Math.abs(bestScore - currentScore) <= CONFIG.TOOL_TIE_TOLERANCE;
  if (currentScore !== -Infinity && bestScore < currentScore + CONFIG.SWITCH_MARGIN && !repairSwap) return false;

  try {
    const record = swapBack.get(player.id);
    if (record) {
      swapBack.delete(player.id);
      if (isSwapBackValid(container, record)) {
        container.swapItems(record.slot, CONFIG.AUTO_SWITCH_SLOT, container);
        if (bestSlot === record.slot) {
          lastSwap.set(player.id, { tick: system.currentTick, slot: record.slot });
          return true;
        }
      }
    }
    const originalItem = container.getItem(CONFIG.AUTO_SWITCH_SLOT);
    container.swapItems(bestSlot, CONFIG.AUTO_SWITCH_SLOT, container);
    swapBack.set(player.id, {
      slot: bestSlot,
      toolTypeId: container.getItem(CONFIG.AUTO_SWITCH_SLOT)?.typeId,
      originalTypeId: originalItem?.typeId,
    });
    lastSwap.set(player.id, { tick: system.currentTick, slot: bestSlot });
    return true;
  } catch {
    return false;
  }
}

export function isSwapBackValid(container, record) {
  return (
    container.getItem(CONFIG.AUTO_SWITCH_SLOT)?.typeId === record.toolTypeId &&
    container.getItem(record.slot)?.typeId === record.originalTypeId
  );
}

export function restoreSwappedItem(player) {
  const record = swapBack.get(player.id);
  if (!record) return;
  swapBack.delete(player.id);
  if (player.selectedSlotIndex === record.slot) return;
  const container = getContainer(player);
  if (!container || !isSwapBackValid(container, record)) return;
  try {
    container.swapItems(record.slot, CONFIG.AUTO_SWITCH_SLOT, container);
  } catch (e) {}
}

export function clearPendingSwap(playerId) {
  const runId = pendingSwaps.get(playerId);
  if (runId !== undefined) {
    system.clearRun(runId);
    pendingSwaps.delete(playerId);
  }
}

export function scheduleSwapRetry(player, category, blockTypeId) {
  clearPendingSwap(player.id);
  const runId = system.runTimeout(() => {
    pendingSwaps.delete(player.id);
    try {
      if (player.selectedSlotIndex !== CONFIG.AUTO_SWITCH_SLOT) return;
      switchPlayerSlot1Tool(player, category, blockTypeId);
    } catch {}
  }, CONFIG.RETRY_TICKS);
  pendingSwaps.set(player.id, runId);
}
