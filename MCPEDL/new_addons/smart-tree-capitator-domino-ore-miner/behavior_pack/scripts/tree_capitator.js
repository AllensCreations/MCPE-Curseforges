/**
 * Tree Capitator Module
 * Created by AllensCreations — MCPE Curseforges
 *
 * Implements sneak-activated vertical tree capitating using footprint layering.
 */

import { system } from "@minecraft/server";
import { CONFIG, isEligibleLog } from "./config.js";
import { checkToolSafety, applyToolDurabilityDamage, notifyToolProtection } from "./durability_helper.js";

/**
 * Executes tree capitator on the tree connected to the broken block.
 *
 * @param {import("@minecraft/server").Player} player
 * @param {import("@minecraft/server").Dimension} dimension
 * @param {import("@minecraft/server").Vector3} startLoc
 * @param {string} startBlockId
 * @param {() => void} onComplete
 */
export function executeTreeCapitator(player, dimension, startLoc, startBlockId, onComplete) {
  if (!CONFIG.TREE_CAPITATOR_ENABLED) {
    if (onComplete) onComplete();
    return;
  }

  const visited = new Set();
  const startKey = `${startLoc.x},${startLoc.y},${startLoc.z}`;
  visited.add(startKey);

  const blocksToBreak = [];

  // Footprints of active trunks/branches to scan upward
  let currentFootprints = [{ x: startLoc.x, z: startLoc.z }];

  // Layer 0: Scan 8 horizontal perimeter neighbors surrounding start block
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (dx === 0 && dz === 0) continue;
      const nx = startLoc.x + dx;
      const nz = startLoc.z + dz;
      const key = `${nx},${startLoc.y},${nz}`;
      if (visited.has(key)) continue;
      visited.add(key);

      try {
        const neighborBlock = dimension.getBlock({ x: nx, y: startLoc.y, z: nz });
        if (neighborBlock && isEligibleLog(neighborBlock.typeId)) {
          blocksToBreak.push({ x: nx, y: startLoc.y, z: nz });
          currentFootprints.push({ x: nx, z: nz });
          if (blocksToBreak.length >= CONFIG.MAX_TREE_BLOCKS) break;
        }
      } catch (e) {}
    }
    if (blocksToBreak.length >= CONFIG.MAX_TREE_BLOCKS) break;
  }

  // Upper Layers: Scan 3x3 footprint centered at all connected trunk/branch coordinates
  for (let dy = 1; dy <= CONFIG.MAX_TREE_HEIGHT; dy++) {
    if (blocksToBreak.length >= CONFIG.MAX_TREE_BLOCKS) break;
    if (currentFootprints.length === 0) break;

    const nextFootprints = [];
    const layerY = startLoc.y + dy;

    // Deduplicate footprint centers
    const uniqueCenters = [];
    const centerKeys = new Set();
    for (const fp of currentFootprints) {
      const ck = `${fp.x},${fp.z}`;
      if (!centerKeys.has(ck)) {
        centerKeys.add(ck);
        uniqueCenters.push(fp);
      }
    }

    let foundInLayer = false;

    for (const center of uniqueCenters) {
      if (blocksToBreak.length >= CONFIG.MAX_TREE_BLOCKS) break;

      for (let dx = -1; dx <= 1; dx++) {
        for (let dz = -1; dz <= 1; dz++) {
          const bx = center.x + dx;
          const bz = center.z + dz;
          const key = `${bx},${layerY},${bz}`;

          if (visited.has(key)) continue;
          visited.add(key);

          try {
            const block = dimension.getBlock({ x: bx, y: layerY, z: bz });
            if (block && isEligibleLog(block.typeId)) {
              blocksToBreak.push({ x: bx, y: layerY, z: bz });
              nextFootprints.push({ x: bx, z: bz });
              foundInLayer = true;

              if (blocksToBreak.length >= CONFIG.MAX_TREE_BLOCKS) break;
            }
          } catch (e) {}
        }
        if (blocksToBreak.length >= CONFIG.MAX_TREE_BLOCKS) break;
      }
    }

    if (!foundInLayer) {
      // Tree trunk/branches ended
      break;
    }

    currentFootprints = nextFootprints;
  }

  if (blocksToBreak.length === 0) {
    if (onComplete) onComplete();
    return;
  }

  // Instantaneous single-tick burst execution
  if (CONFIG.INSTANT_BURST) {
    for (const pos of blocksToBreak) {
      if (!player || !player.isValid()) break;

      const safety = checkToolSafety(player, "axe");
      if (!safety.safe) {
        notifyToolProtection(player, safety.remaining);
        break;
      }

      try {
        dimension.runCommand(`setblock ${pos.x} ${pos.y} ${pos.z} air destroy`);
        applyToolDurabilityDamage(player);
      } catch (err) {}
    }
    if (onComplete) onComplete();
    return;
  }

  // Paced execution fallback
  let index = 0;
  const intervalId = system.runInterval(() => {
    // Re-verify player validity
    if (!player || !player.isValid()) {
      system.clearRun(intervalId);
      if (onComplete) onComplete();
      return;
    }

    const batchLimit = Math.min(index + (CONFIG.BLOCKS_PER_TICK || 6), blocksToBreak.length);

    while (index < batchLimit) {
      const pos = blocksToBreak[index++];

      // Durability safety check before each secondary break
      const safety = checkToolSafety(player, "axe");
      if (!safety.safe) {
        notifyToolProtection(player, safety.remaining);
        system.clearRun(intervalId);
        if (onComplete) onComplete();
        return;
      }

      // Break block using vanilla command destruction to trigger full drops, sound, and particles
      try {
        dimension.runCommand(`setblock ${pos.x} ${pos.y} ${pos.z} air destroy`);
        applyToolDurabilityDamage(player);
      } catch (err) {}
    }

    if (index >= blocksToBreak.length) {
      system.clearRun(intervalId);
      if (onComplete) onComplete();
    }
  }, 1);
}
