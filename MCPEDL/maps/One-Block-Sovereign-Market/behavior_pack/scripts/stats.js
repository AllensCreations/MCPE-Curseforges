// stats.js - tiny per-player counters (dynamic properties) used by milestones, contracts and prestige.
export const getStat = (p, k) => { const v = p.getDynamicProperty("sv_s_" + k); return typeof v === "number" ? v : 0; };
export const setStat = (p, k, v) => p.setDynamicProperty("sv_s_" + k, v);
export const bumpStat = (p, k, n = 1) => setStat(p, k, getStat(p, k) + n);
