import { world, system, BlockPermutation } from "@minecraft/server";
import { CONFIG, LOG_PREFIX } from "./config.js";
import { clearPlacedLight, isLightBlock, markLightsCleaned, persistLights } from "./light.js";
import { clearPendingSwap } from "./slot-switch.js";
import { activeMiningOperations, chainPauseUntil, lastAutoSwitchKey, lastBreakTick, lastSwap, miningActivity, pendingToolDamage, qolPlayerState, recentCombat, swapBack, webInteraction } from "./state.js";

world.afterEvents.playerLeave.subscribe((event) => {
  miningActivity.delete(event.playerId);
  lastAutoSwitchKey.delete(event.playerId);
});

world.afterEvents.playerLeave.subscribe((event) => {
  const id = event.playerId;
  if (!id) return;
  const state = qolPlayerState.get(id);
  if (state) clearPlacedLight(state);
  qolPlayerState.delete(id);
  recentCombat.delete(id);
  webInteraction.delete(id);
  clearPendingSwap(id);
  activeMiningOperations.delete(id);
  lastSwap.delete(id);
  swapBack.delete(id);
  lastBreakTick.delete(id);
  chainPauseUntil.delete(id);
  pendingToolDamage.delete(id);
});

system.runTimeout(() => {
  try {
    const raw = world.getDynamicProperty("qol:lights");
    if (typeof raw === "string") {
      const active = new Set();
      for (const st of qolPlayerState.values()) {
        if (st.lightDim !== undefined && st.lightX !== undefined) {
          active.add(`${st.lightDim.id},${st.lightX},${st.lightY},${st.lightZ}`);
        }
      }
      for (const [dimId, x, y, z] of JSON.parse(raw)) {
        if (active.has(`${dimId},${x},${y},${z}`)) continue;
        try {
          const b = world.getDimension(dimId).getBlock({ x, y, z });
          if (b && isLightBlock(b.typeId)) b.setPermutation(BlockPermutation.resolve("minecraft:air"));
        } catch (e) {}
      }
    }
  } catch (e) {}
  markLightsCleaned();
  persistLights();

  try {
    if (CONFIG.APPLY_RANDOM_TICK_SPEED && !world.getDynamicProperty("qol:gamerules_set")) {
      const dim = world.getDimension("overworld");
      dim.runCommand(`gamerule randomTickSpeed ${CONFIG.RANDOM_TICK_SPEED}`);
      world.setDynamicProperty("qol:gamerules_set", true);
    }
  } catch (e) {}
}, CONFIG.STARTUP_DELAY_TICKS);

console.warn(`${LOG_PREFIX} Initialized. Tree Capitator: ${CONFIG.TREE_CAPITATOR_ENABLED ? "ON" : "OFF"}; Vein Miner: ${CONFIG.DOMINO_ORE_MINER_ENABLED ? "ON" : "OFF"}.`);
