// ui_util.js - shared form helpers.
import { system } from "@minecraft/server";
import { FormCancelationReason } from "@minecraft/server-ui";

export const fmt = (n) => (Math.round(n * 100) / 100).toFixed(2);
const sleep = (t) => new Promise((r) => system.runTimeout(r, t));

// Show a form; retry while the player's screen is busy (chat/inventory open).
export async function show(player, form) {
  for (let i = 0; i < 20; i++) {
    const res = await form.show(player);
    if (res.canceled && res.cancelationReason === FormCancelationReason.UserBusy) { await sleep(10); continue; }
    return res;
  }
  return { canceled: true };
}
