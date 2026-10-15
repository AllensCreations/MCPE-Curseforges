/**
 * Smart Tree Capitator & Domino Ore Miner
 * Created by AllensCreations — MCPE Curseforges
 *
 * Sneak-activated tree capitating and domino ore mining with durability safety protection.
 * Target: Minecraft Bedrock 1.21+ / Script API @minecraft/server 1.13.0+
 */

import { world, system } from "@minecraft/server";
import { isAxe, isPickaxe, isEligibleLog, getOreInfo } from "./config.js";
import { getMainhandTool } from "./durability_helper.js";
import { executeTreeCapitator } from "./tree_capitator.js";
import { executeDominoOreMiner } from "./ore_miner.js";

// Active player operations set to prevent event recursion and concurrent tasks
const activeOperations = new Set();

/**
 * Main block-breaking listener
 */
world.afterEvents.playerBreakBlock.subscribe((event) => {
  const { block, brokenBlockPermutation, player, dimension, itemStackBeforeBreak } = event;

  if (!player || !player.isValid()) return;

  // Rule 1: Must be sneaking to activate mechanics
  if (!player.isSneaking) return;

  // Rule 2: Recursion guard
  if (activeOperations.has(player.id)) return;

  const startLoc = {
    x: Math.floor(block.location.x),
    y: Math.floor(block.location.y),
    z: Math.floor(block.location.z),
  };
  const brokenTypeId = brokenBlockPermutation?.type?.id;
  if (!brokenTypeId) return;

  // Re-verify currently held tool or tool used prior to break
  const tool = getMainhandTool(player) || itemStackBeforeBreak;
  if (!tool) return;

  const toolTypeId = tool.typeId;

  // Dispatch Tree Capitator (Axe + Eligible Log/Wood)
  if (isAxe(toolTypeId) && isEligibleLog(brokenTypeId)) {
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

  // Dispatch Domino Ore Miner (Pickaxe + Supported Ore)
  if (isPickaxe(toolTypeId) && getOreInfo(brokenTypeId)) {
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
