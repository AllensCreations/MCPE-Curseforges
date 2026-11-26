import { FACES, FACE_LABELS, STATE_OUT } from "./constants.js";

export function feedback(block, player, message, pitch) {
  const l = block.location;
  const center = { x: l.x + 0.5, y: l.y + 0.5, z: l.z + 0.5 };
  try {
    player.onScreenDisplay.setActionBar(message);
  } catch (error) {
    player.sendMessage(message);
  }
  try {
    block.dimension.playSound("random.click", center, { volume: 1, pitch });
  } catch (error) {
    try {
      player.playSound("random.click", { volume: 1, pitch });
    } catch (inner) {
      return;
    }
  }
  try {
    block.dimension.spawnParticle("minecraft:villager_happy", center);
  } catch (error) {
    return;
  }
}

export function rotatePipe(block, player, reverse) {
  const current = block.permutation.getState(STATE_OUT);
  const index = FACES.indexOf(typeof current === "string" ? current : "north");
  const step = reverse ? FACES.length - 1 : 1;
  const next = FACES[(Math.max(index, 0) + step) % FACES.length];
  block.setPermutation(block.permutation.withState(STATE_OUT, next));
  feedback(block, player, `§6Output: §a${FACE_LABELS[next]}`, reverse ? 0.8 : 1.3);
}
