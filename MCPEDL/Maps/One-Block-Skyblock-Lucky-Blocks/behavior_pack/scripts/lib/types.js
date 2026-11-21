// Picks the next lucky block type for the center spot, using each type's weight.
import { LUCKY, TYPES } from "./config.js";
import { tutorialActive } from "./tutorial.js";

export function nextBlockId() {
  if (tutorialActive()) return LUCKY;
  const ids = Object.keys(TYPES);
  let roll = Math.random() * ids.reduce((sum, id) => sum + TYPES[id].weight, 0);
  for (const id of ids) {
    roll -= TYPES[id].weight;
    if (roll < 0) return id;
  }
  return LUCKY;
}
