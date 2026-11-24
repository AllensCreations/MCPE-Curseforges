import { powerOf } from "./elements.js";

const ZOOM_FOV = [70, 62, 50, 38, 46];

export function applyZoom(entry, phase) {
  if (entry.zoom === phase) return;
  entry.zoom = phase;
  try {
    entry.player.runCommand(`camera @s fov_set ${ZOOM_FOV[phase]} 0.35 linear`);
  } catch (e) {}
}

export function clearZoom(player) {
  try {
    player.runCommand("camera @s fov_clear 0.2 linear");
  } catch (e) {}
}

export function chargeSound(player, held, mode) {
  if (held < 2 || held % 3 !== 0) return;
  const k = powerOf(held);
  try {
    player.playSound(`${mode.sfx}.charge`, { pitch: 0.6 + 1.4 * k, volume: 0.5 + 0.4 * k });
  } catch (e) {}
}
