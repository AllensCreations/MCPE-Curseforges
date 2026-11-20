// Per-tick loop for double-sneak swap and held light.
import { world, system } from "@minecraft/server";
import { CONFIG } from "./config.js";
import { updatePlayerLight } from "./light.js";
import { swapHands } from "./offhand.js";
import { getQolState } from "./state.js";

system.runInterval(() => {
  let players;
  try {
    players = world.getAllPlayers();
  } catch (e) {
    return;
  }

  const tick = system.currentTick;
  const doLight = tick % CONFIG.LIGHT_UPDATE_TICKS === 0;

  for (const player of players) {
    try {
      const state = getQolState(player.id);
      const sneaking = !!player.isSneaking;

      if (sneaking && !state.sneakHeld) {
        let still = true;
        try {
          const v = player.getVelocity();
          still = Math.hypot(v.x, v.z) < CONFIG.STILL_SPEED_LIMIT && player.isOnGround !== false;
        } catch (e) {}
        if (still) {
          state.sneakCount += 1;
          state.sneakTimer = 0;
        } else {
          state.sneakCount = 0;
          state.sneakTimer = 0;
        }
      }
      state.sneakHeld = sneaking;

      if (state.sneakCount > 0) {
        state.sneakTimer += 1;
        if (state.sneakTimer > CONFIG.SWAP_WINDOW_TICKS) {
          state.sneakCount = 0;
          state.sneakTimer = 0;
        }
      }

      if (state.sneakCount >= 2) {
        state.sneakCount = 0;
        state.sneakTimer = 0;
        swapHands(player);
      }

      if (doLight && (state.lightLevel > 0 || tick % CONFIG.IDLE_LIGHT_CHECK_TICKS === 0)) {
        updatePlayerLight(player, state);
      }
    } catch (e) {}
  }
}, 1);
