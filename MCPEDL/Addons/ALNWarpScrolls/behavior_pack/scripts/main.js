import { world, system } from "@minecraft/server";
import { GATE_ID, SCROLL_ID, SOUND } from "./lib/config.js";
import { getGates, addGate, removeGateAt, shortDim, isFull } from "./lib/registry.js";
import { askGateName, chooseGate } from "./lib/menus.js";
import { beginWarp, isWarping, gateStillStands, arrivalBurst } from "./lib/warp.js";

const pendingMenus = new Set();
const pendingNames = new Set();

async function registerGate(player, dimension, block) {
  const dim = shortDim(dimension);
  const x = block.x;
  const y = block.y;
  const z = block.z;
  const key = dim + ":" + x + ":" + y + ":" + z;
  if (pendingNames.has(key)) return;
  pendingNames.add(key);
  try {
    if (isFull()) {
      player.sendMessage("§cThis world already has the maximum number of Beacon Gates. This one was not registered.");
      return;
    }
    const fallback = "Beacon Gate " + (getGates().length + 1);
    const name = await askGateName(player, fallback);
    if (!addGate(name, dim, x, y, z)) {
      player.sendMessage("§cThe Beacon Gate could not be saved.");
      return;
    }
    player.sendMessage("§aBeacon Gate §b" + name + "§a registered.");
    player.playSound(SOUND.register, { volume: 1, pitch: 1 });
    arrivalBurst(dimension, { x: x + 0.5, y: y + 1, z: z + 0.5 });
  } catch {
    return;
  } finally {
    pendingNames.delete(key);
  }
}

async function openScroll(player, item) {
  if (isWarping(player) || pendingMenus.has(player.id)) return;
  pendingMenus.add(player.id);
  try {
    const gates = getGates();
    if (gates.length === 0) {
      player.sendMessage("§eNo Beacon Gates are registered yet. Place a Beacon Gate and name it first.");
      return;
    }
    const picked = await chooseGate(player, gates);
    if (picked === undefined) return;
    const gate = gates[picked];
    if (!gate) return;
    if (!gateStillStands(gate)) {
      player.sendMessage("§cThat Beacon Gate no longer exists and was removed from the list.");
      return;
    }
    beginWarp(player, item, gate);
  } catch {
    return;
  } finally {
    pendingMenus.delete(player.id);
  }
}

world.afterEvents.playerPlaceBlock.subscribe((event) => {
  if (event.block.typeId !== GATE_ID) return;
  const { player, block, dimension } = event;
  system.runTimeout(() => {
    registerGate(player, dimension, block);
  }, 5);
});

world.afterEvents.playerBreakBlock.subscribe((event) => {
  const { player, block, dimension } = event;
  const gate = removeGateAt(shortDim(dimension), block.x, block.y, block.z);
  if (gate) player.sendMessage("§eBeacon Gate §f" + gate.n + "§e removed from the destination list.");
});

world.afterEvents.itemUse.subscribe((event) => {
  const item = event.itemStack;
  if (!item || item.typeId !== SCROLL_ID) return;
  openScroll(event.source, item);
});
