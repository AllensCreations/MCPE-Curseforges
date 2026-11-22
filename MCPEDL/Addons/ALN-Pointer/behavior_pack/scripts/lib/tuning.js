import { readSaved, writeSaved } from "./saved.js";

const KEY = "aln_pointer_tuning";

export const TUNING = [
  { id: "auraRange", name: "Aura range (blocks)", min: 2, max: 6, step: 1, def: 4 },
  { id: "auraDamage", name: "Aura damage (half hearts)", min: 1, max: 10, step: 1, def: 5 },
  { id: "auraTargets", name: "Aura targets per hit", min: 1, max: 5, step: 1, def: 3 },
  { id: "aimRange", name: "Bow Aimbot range (blocks)", min: 16, max: 96, step: 8, def: 48 },
  { id: "aimZoom", name: "Aim circle zoom (percent)", min: 50, max: 300, step: 10, def: 100 },
  { id: "bowZoom", name: "Bow zoom while drawing (percent)", min: 0, max: 30, step: 5, def: 0 },
  { id: "screenFov", name: "Your game FOV setting", min: 30, max: 110, step: 1, def: 70 },
  { id: "critPercent", name: "Always Critical damage (percent)", min: 110, max: 300, step: 10, def: 150 },
  { id: "knockback", name: "Knockback you deal (percent)", min: 0, max: 200, step: 25, def: 100 },
  { id: "auraTarget", name: "Aura hits", min: 0, max: 2, step: 1, def: 0, choices: ["Mobs and players", "Mobs only", "Players only"] },
  { id: "auraFace", name: "Aura turns you to face the target", min: 0, max: 1, step: 1, def: 0, choices: ["No", "Yes"] },
  { id: "aimCircle", name: "Target Highlight aim circle", min: 0, max: 1, step: 1, def: 1, choices: ["Off", "On"] },
  { id: "aimHostile", name: "Aimbot hits hostile mobs", min: 0, max: 1, step: 1, def: 1, choices: ["Off", "On"] },
  { id: "aimNeutral", name: "Aimbot hits neutral mobs", min: 0, max: 1, step: 1, def: 0, choices: ["Off", "On"] },
  { id: "aimPassive", name: "Aimbot hits passive mobs", min: 0, max: 1, step: 1, def: 0, choices: ["Off", "On"] },
  { id: "aimPlayers", name: "Aimbot hits players", min: 0, max: 1, step: 1, def: 1, choices: ["Off", "On"] },
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
