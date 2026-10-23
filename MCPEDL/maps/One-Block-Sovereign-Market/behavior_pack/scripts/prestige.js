// prestige.js - reset your personal progress for a permanent +10% coins per prestige.
import { getRankInfo, getPhaseInfo, resetWallet } from "./economy.js";
import { setPermitLevel } from "./zoning.js";
import { resetUpgrades } from "./workers.js";
import { getStat, bumpStat } from "./stats.js";

export const REQ_RANK = 3;   // Magnate
export const REQ_PHASE = 5;  // Golden Age
export const prestigeCount = (p) => getStat(p, "prestige");
export const canPrestige = (p) => getRankInfo(p).index >= REQ_RANK && getPhaseInfo().index >= REQ_PHASE;

export function doPrestige(player) {
  if (!canPrestige(player)) return false;
  resetWallet(player);              // coins and rank progress
  setPermitLevel(player, 0);        // personal permit (a team's shared permit stays)
  resetUpgrades(player.id);         // worker upgrades
  bumpStat(player, "prestige");
  return true;
}
