import { world } from "@minecraft/server";
import { ONE_BLOCK_Y, PROP } from "./config.js";
import { overworld, isLoaded, blockIdAt, runCmd, addArea, dropArea, later } from "./util.js";
import { slotCoords, markBuilt } from "./slots.js";
import { phaseIndexFor, nextBlockId } from "./phases.js";

export function globalBreaks() {
  const v = world.getDynamicProperty(PROP.GLOBAL);
  return typeof v === "number" ? v : 0;
}

export function currentPhase() {
  return phaseIndexFor(globalBreaks());
}

function placeIsland(dim, x, z, trait) {
  const first = nextBlockId(currentPhase(), trait);
  runCmd(dim, `fill ${x - 3} 63 ${z - 3} ${x + 3} 63 ${z + 3} grass_block`);
  runCmd(dim, `fill ${x - 2} 62 ${z - 2} ${x + 2} 62 ${z + 2} dirt`);
  runCmd(dim, `fill ${x - 1} 61 ${z - 1} ${x + 1} 61 ${z + 1} dirt`);
  runCmd(dim, `setblock ${x} 60 ${z} dirt`);
  runCmd(dim, `setblock ${x} ${ONE_BLOCK_Y} ${z} ${first}`);
  const top = blockIdAt(dim, x, ONE_BLOCK_Y, z);
  const base = blockIdAt(dim, x, ONE_BLOCK_Y - 1, z);
  return Boolean(top) && top !== "minecraft:air" && base === "minecraft:grass_block";
}

export function ensureIsland(slot, trait, onResult) {
  const c = slotCoords(slot);
  const dim = overworld();
  const area = `aln_i${slot}`;
  const hasArea = addArea(dim, area, c.x, ONE_BLOCK_Y, c.z);
  let tries = 0;
  let reported = false;
  const report = (ok) => {
    if (reported) return;
    reported = true;
    onResult(ok);
  };
  const step = () => {
    tries++;
    if (isLoaded(dim, c.x, ONE_BLOCK_Y, c.z) && placeIsland(dim, c.x, c.z, trait)) {
      markBuilt(slot);
      if (hasArea) dropArea(dim, area);
      report(true);
      return;
    }
    if (tries === 40) report(false);
    if (tries < 400) {
      later(step, 10);
    } else if (hasArea) {
      dropArea(dim, area);
    }
  };
  step();
}

export function regenerate(dim, x, z, trait, phaseIndex) {
  try {
    const block = dim.getBlock({ x, y: ONE_BLOCK_Y, z });
    if (block) block.setType(nextBlockId(phaseIndex, trait));
  } catch (e) {}
}
