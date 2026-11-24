const ZOOM_FOV = [70, 62, 50, 38, 34];

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

export function chargeSound(player, held) {
  if (held < 2 || held % 3 !== 0) return;
  const k = Math.min(held, 70) / 70;
  try {
    player.playSound("random.orb", { pitch: 0.6 + 1.4 * k, volume: 0.5 + 0.4 * k });
  } catch (e) {}
}
