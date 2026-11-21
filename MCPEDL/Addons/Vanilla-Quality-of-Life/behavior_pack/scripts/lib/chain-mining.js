import { world, system } from "@minecraft/server";
import { MINING_OPTIONS } from "../mining-options.js";
import { CONFIG } from "./config.js";
import { checkToolSafety, flushToolDamage, notifyToolProtection } from "./durability.js";
import { executeDominoOreMiner, getOreInfo, isPickaxe } from "./ore-miner.js";
import { activeMiningOperations, chainPauseUntil, lastAutoSwitchKey, lastSwap, miningActivity } from "./state.js";
import { executeTreeCapitator, isAxe, isEligibleLog } from "./tree-capitator.js";
import { getContainer, getMainhandTool } from "./utils.js";

export function finishChain(player) {
  activeMiningOperations.delete(player.id);
  flushToolDamage(player);
  miningActivity.delete(player.id);
  lastAutoSwitchKey.delete(player.id);
}

world.afterEvents.playerBreakBlock.subscribe((event) => {
  const { block, brokenBlockPermutation, player, dimension, itemStackBeforeBreak } = event;

  if (!player || !player.isValid) return;
  if (MINING_OPTIONS.REQUIRE_SNEAK_FOR_CHAIN_MINING) {
    if (!player.isSneaking) return;
  } else if (player.selectedSlotIndex !== CONFIG.AUTO_SWITCH_SLOT) {
    return;
  }
  if (activeMiningOperations.has(player.id)) return;

  const startLoc = {
    x: Math.floor(block.location.x),
    y: Math.floor(block.location.y),
    z: Math.floor(block.location.z),
  };
  const brokenTypeId = brokenBlockPermutation?.type?.id;
  if (!brokenTypeId) return;

  const tool = itemStackBeforeBreak || getMainhandTool(player);
  if (!tool) return;

  const heldNow = getMainhandTool(player);
  if (!heldNow || heldNow.typeId !== tool.typeId) {
    const swap = lastSwap.get(player.id);
    const swapContainer = getContainer(player);
    if (swap && swapContainer && system.currentTick - swap.tick <= CONFIG.SWAP_RESTORE_TICKS) {
      try {
        const moved = swapContainer.getItem(swap.slot);
        if (moved && moved.typeId === tool.typeId) {
          swapContainer.swapItems(swap.slot, CONFIG.AUTO_SWITCH_SLOT, swapContainer);
        }
      } catch (e) {}
    }
    const restored = getMainhandTool(player);
    if (!restored || restored.typeId !== tool.typeId) return;
  }

  const toolTypeId = tool.typeId;

  if (isAxe(toolTypeId) && isEligibleLog(brokenTypeId)) {
    const treeSafety = checkToolSafety(player);
    if (!treeSafety.safe) {
      notifyToolProtection(player, Math.max(0, treeSafety.remaining));
      return;
    }
    activeMiningOperations.add(player.id);
    chainPauseUntil.set(player.id, system.currentTick + CONFIG.CHAIN_PAUSE_TICKS);
    try {
      executeTreeCapitator(player, dimension, startLoc, brokenTypeId, () => {
        finishChain(player);
      });
    } catch (err) {
      finishChain(player);
    }
    return;
  }

  if (isPickaxe(toolTypeId) && getOreInfo(brokenTypeId)) {
    const oreSafety = checkToolSafety(player);
    if (!oreSafety.safe) {
      notifyToolProtection(player, Math.max(0, oreSafety.remaining));
      return;
    }
    activeMiningOperations.add(player.id);
    chainPauseUntil.set(player.id, system.currentTick + CONFIG.CHAIN_PAUSE_TICKS);
    try {
      executeDominoOreMiner(player, dimension, startLoc, brokenTypeId, () => {
        finishChain(player);
      });
    } catch (err) {
      finishChain(player);
    }
    return;
  }
});
