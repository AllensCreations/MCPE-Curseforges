import { readSaved, writeSaved } from "./saved.js";

const KEY = "aln_pointer_tuning";

export const TUNING = [
  { id: "auraRange", name: "Aura range (blocks)", min: 2, max: 6, step: 1, def: 4 },
  { id: "auraDamage", name: "Aura damage (half hearts)", min: 1, max: 10, step: 1, def: 5 },
  { id: "auraTargets", name: "Aura targets per hit", min: 1, max: 5, step: 1, def: 3 },
  { id: "aimRange", name: "Bow Aimbot range (blocks)", min: 16, max: 96, step: 8, def: 48 },
  { id: "aimCone", name: "Bow Aimbot angle (degrees)", min: 5, max: 45, step: 5, def: 25 },
  { id: "critPercent", name: "Always Critical damage (percent)", min: 110, max: 300, step: 10, def: 150 },
  { id: "knockback", name: "Knockback you deal (percent)", min: 0, max: 200, step: 25, def: 100 },
  { id: "auraTarget", name: "Aura hits", min: 0, max: 2, step: 1, def: 0, choices: ["Mobs and players", "Mobs only", "Players only"] },
  { id: "auraFace", name: "Aura turns you to face the target", min: 0, max: 1, step: 1, def: 0, choices: ["No", "Yes"] },
];

export function tune(player, id) {
  const value = readSaved(player, KEY)[id];
  return typeof value === "number" ? value : TUNING.find((t) => t.id === id).def;
}

export function applyTuning(player, values) {
  const data = {};
  TUNING.forEach((t, i) => {
    if (typeof values[i] === "number") data[t.id] = Math.min(t.max, Math.max(t.min, values[i]));
  });
  writeSaved(player, KEY, data);
}

export const resetTuning = (player) => writeSaved(player, KEY, {});
