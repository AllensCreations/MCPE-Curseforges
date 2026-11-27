import { world, system } from "@minecraft/server";

const KITS = {
  tools: { structure: "aln:god_tools", name: "OpCodex God Tools" },
  armor: { structure: "aln:god_armor", name: "OpCodex God Armor" },
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
    busy.delete(found.key);
    tell(player, "§cThe kit could not be created.");
    return;
  }
  system.run(() => {
    let delivered = false;
    let chest;
    try {
      chest = dimension.getBlock(found.spot)?.getComponent("minecraft:inventory")?.container;
      if (chest?.getItem(0)) delivered = chest.transferItem(0, inventory) === undefined;
    } catch (e) {}
    try {
      chest?.setItem(0, undefined);
    } catch (e) {}
    try {
      dimension.getBlock(found.spot)?.setType("minecraft:air");
    } catch (e) {}
    busy.delete(found.key);
    if (!delivered) {
      tell(player, "§cThe kit could not be delivered.");
      return;
    }
    celebrate(player);
    tell(player, `§a${kit.name} added to your inventory.`);
  });
}
