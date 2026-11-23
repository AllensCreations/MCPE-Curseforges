import { world } from "@minecraft/server";
import { LEDGER_ID, SPAWN_Y, STARTER_LEDGER } from "./config.js";
import { firstFreeSlot, assignSlot, slotCoords, slotOf, readSlots, recordOf } from "./slots.js";
import { pickTrait, traitInfo, traitLabel } from "./traits.js";
import { ensureIsland, currentPhase } from "./island.js";
import { phaseLabel } from "./phases.js";
import { overworld, giveItem, findPlayer } from "./util.js";

const claiming = new Set();

export function hasIsland(player) {
  return slotOf(player) !== undefined;
}

export function goHome(player, slot, islandReady) {
  const c = slotCoords(slot);
  const dim = overworld();
  try {
    player.teleport({ x: c.x + 0.5, y: SPAWN_Y, z: c.z + 0.5 }, { dimension: dim });
  } catch (e) {}
  try {
    player.setSpawnPoint({ dimension: dim, x: c.x, y: SPAWN_Y, z: c.z });
  } catch (e) {}
  if (!islandReady) {
    try {
      player.addEffect("slow_falling", 600, { amplifier: 0, showParticles: false });
    } catch (e) {}
  }
}

function welcomeToIsland(player, slot, islandReady) {
  const record = recordOf(slot);
  const info = traitInfo(record.trait);
  const c = slotCoords(slot);
  goHome(player, slot, islandReady);
  if (STARTER_LEDGER) giveItem(player, LEDGER_ID, 1);
  try {
    player.onScreenDisplay.setTitle(`§6Island #${slot}`);
  } catch (e) {}
  player.sendMessage(`§6[ALN] §eIsland #${slot} claimed at X: ${c.x}, Z: ${c.z}.`);
  player.sendMessage(`§6[ALN] §fRichness: ${traitLabel(record.trait)} §7- ${info.blurb}`);
  player.sendMessage(`§6[ALN] §fWorld phase: ${phaseLabel(currentPhase())}§f. Break your OneBlock to begin.`);
  if (STARTER_LEDGER) player.sendMessage("§6[ALN] §7You received a Global Pirate Ledger. Right-click it to trade with other islands.");
}

export function claimIsland(player) {
  const id = player.id;
  if (claiming.has(id)) return;
  const owned = slotOf(player);
  if (owned !== undefined) {
    goHome(player, owned, true);
    return;
  }
  const slot = firstFreeSlot();
  if (slot === undefined) {
    player.sendMessage("§c[ALN] Every island spot on this world is taken.");
    return;
  }
  const trait = pickTrait(readSlots());
  assignSlot(player, slot, trait);
  claiming.add(id);
  player.sendMessage(`§6[ALN] §7Preparing island #${slot}...`);
  world.sendMessage(`§6[ALN] §f${player.name} §7claimed island #${slot} (${traitLabel(trait)}§7).`);
  ensureIsland(slot, trait, (ready) => {
    claiming.delete(id);
    const p = findPlayer(id);
    if (p) welcomeToIsland(p, slot, ready);
  });
}

export function returnToIsland(player) {
  const slot = slotOf(player);
  if (slot === undefined) return;
  const record = recordOf(slot);
  if (!record.built) ensureIsland(slot, record.trait, () => {});
}
