import { world, system } from "@minecraft/server";

const KITS = {
  tools: { structure: "aln:god_tools", name: "OpCodex God Tools" },
  armor: { structure: "aln:god_armor", name: "OpCodex God Armor" },
  supplies: { structure: "aln:god_supplies", name: "OpCodex God Supplies" },
};
const HEIGHTS = [2, 3, 4, 5];
const SIDES = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]];
const busy = new Set();

function tell(player, text) {
  try {
    player.onScreenDisplay.setActionBar(text);
  } catch (e) {}
}

function findAirSpot(player) {
  const base = player.location;
  for (const dy of HEIGHTS) {
    for (const [dx, dz] of SIDES) {
      const spot = { x: Math.floor(base.x) + dx, y: Math.floor(base.y) + dy, z: Math.floor(base.z) + dz };
      const key = `${player.dimension.id} ${spot.x} ${spot.y} ${spot.z}`;
      try {
        if (!busy.has(key) && player.dimension.getBlock(spot)?.typeId === "minecraft:air") return { spot, key };
      } catch (e) {}
    }
  }
  return undefined;
}

function celebrate(player) {
  try {
    player.playSound("random.orb");
    player.dimension.spawnParticle("minecraft:totem_particle", {
      x: player.location.x,
      y: player.location.y + 1,
      z: player.location.z,
    });
  } catch (e) {}
}

function countBoxes(container) {
  let total = 0;
  for (let slot = 0; slot < container.size; slot++) {
    if (container.getItem(slot)?.typeId.endsWith("_shulker_box")) total++;
  }
  return total;
}

export function deliverKit(player, kitId) {
  const kit = KITS[kitId];
  const inventory = player.getComponent("minecraft:inventory")?.container;
  if (!kit || !inventory) return;
  if (inventory.emptySlotsCount < 1) {
    tell(player, "§eFree one inventory slot first.");
    return;
  }
  const found = findAirSpot(player);
  if (!found) {
    tell(player, "§eNo empty space above you. Move and try again.");
    return;
  }
  const dimension = player.dimension;
  busy.add(found.key);
  try {
    world.structureManager.place(kit.structure, dimension, found.spot);
  } catch (e) {
    console.warn(`[OpCodex] structure: ${e}`);
    busy.delete(found.key);
    tell(player, "§cThe kit could not be created.");
    return;
  }
  const finish = (message) => {
    try {
      const block = dimension.getBlock(found.spot);
      const contents = block?.getComponent("minecraft:inventory")?.container;
      if (contents) {
        for (let slot = 0; slot < contents.size; slot++) contents.setItem(slot, undefined);
      }
      block?.setType("minecraft:air");
    } catch (e) {
      console.warn(`[OpCodex] cleanup: ${e}`);
    }
    busy.delete(found.key);
    tell(player, message);
  };
  const collect = (attempt) => {
    try {
      const contents = dimension.getBlock(found.spot)?.getComponent("minecraft:inventory")?.container;
      if (contents?.getItem(0)) {
        const before = countBoxes(inventory);
        player.runCommand(`loot give @s mine ${found.spot.x} ${found.spot.y} ${found.spot.z}`);
        if (countBoxes(inventory) > before) {
          celebrate(player);
          finish(`§a${kit.name} added to your inventory.`);
        } else {
          finish("§cError: the shulker box was not received.");
        }
        return;
      }
    } catch (e) {
      console.warn(`[OpCodex] delivery: ${e}`);
    }
    if (attempt < 20) {
      system.runTimeout(() => collect(attempt + 1), 2);
      return;
    }
    finish("§cError: the kit box did not appear.");
  };
  system.runTimeout(() => collect(0), 2);
}
