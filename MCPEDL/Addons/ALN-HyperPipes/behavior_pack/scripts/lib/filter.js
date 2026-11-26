import { ensureRecord, saveRecord, setFilter } from "./state.js";
import { prettyName } from "./constants.js";
import { feedback } from "./wrench.js";

export function configureFilter(block, player, held) {
  const rec = ensureRecord(block);
  if (!rec) return;
  if (held) {
    setFilter(rec, held.typeId);
    saveRecord(rec);
    feedback(block, player, `§6Filter set: §a${prettyName(held.typeId)}`, 1.5);
    return;
  }
  if (player.isSneaking) {
    setFilter(rec, undefined);
    saveRecord(rec);
    feedback(block, player, "§6Filter cleared: §aall items pass", 0.8);
    return;
  }
  const label = rec.filter ? prettyName(rec.filter) : "none (all items pass)";
  feedback(block, player, `§6Filter: §f${label}`, 1.0);
}
