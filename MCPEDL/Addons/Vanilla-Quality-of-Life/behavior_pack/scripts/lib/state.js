

export const qolPlayerState = new Map();

export function getQolState(id) {
  let state = qolPlayerState.get(id);
  if (!state) {
    state = {
      sneakHeld: false,
      sneakCount: 0,
      sneakTimer: 0,
      lastSwapTick: -9999,
      lightDim: undefined,
      lightX: undefined,
      lightY: undefined,
      lightZ: undefined,
      lightLevel: 0,
    };
    qolPlayerState.set(id, state);
  }
  return state;
}

export const recentCombat = new Map();

export const pendingSwaps = new Map();

export const webInteraction = new Map();

export const pendingToolDamage = new Map();

export const activeMiningOperations = new Set();

export const chainPauseUntil = new Map();

export const lastSwap = new Map();

export const swapBack = new Map();

export const miningActivity = new Map();

export const lastAutoSwitchKey = new Map();

export const lastBreakTick = new Map();
