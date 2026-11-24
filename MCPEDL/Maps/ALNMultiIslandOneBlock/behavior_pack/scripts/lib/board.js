import { world, system, DisplaySlotId, ObjectiveSortOrder } from "@minecraft/server";
import { BOARD_ID, BOARD_TITLE, BOARD_TICKS } from "./config.js";
import { readSlots } from "./slots.js";
import { coinsOf } from "./market.js";

function ensureObjective() {
  const existing = world.scoreboard.getObjective(BOARD_ID);
  const objective = existing ?? world.scoreboard.addObjective(BOARD_ID, BOARD_TITLE);
  world.scoreboard.setObjectiveAtDisplaySlot(DisplaySlotId.Sidebar, {
    objective,
    sortOrder: ObjectiveSortOrder.Descending,
  });
  return objective;
}

function refresh(objective) {
  const slots = readSlots();
  for (const key of Object.keys(slots)) {
    const record = slots[key];
    if (!record || !record.id || !record.name) continue;
    objective.setScore(record.name, coinsOf(record.id));
  }
}

export function startCoinBoard() {
  let objective;
  try {
    objective = ensureObjective();
  } catch (e) {
    return;
  }
  system.runInterval(() => {
    try {
      refresh(objective);
    } catch (e) {}
  }, BOARD_TICKS);
}
