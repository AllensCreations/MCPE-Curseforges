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
    console.warn(`[OpCodex] structure: ${e}`);
    busy.delete(found.key);
    tell(player, "§cThe kit could not be created.");
    return;
  }
  const finish = (message) => {
    try {
      dimension.getBlock(found.spot)?.getComponent("minecraft:inventory")?.container?.setItem(0, undefined);
      dimension.getBlock(found.spot)?.setType("minecraft:air");
    } catch (e) {
      console.warn(`[OpCodex] cleanup: ${e}`);
    }
    busy.delete(found.key);
    tell(player, message);
  };
  const center = { x: found.spot.x + 0.5, y: found.spot.y + 0.5, z: found.spot.z + 0.5 };
  const nearbyItems = () => dimension.getEntities({ type: "minecraft:item", location: center, maxDistance: 3 });
  const gather = (attempt, before) => {
    let received = false;
    try {
      for (const entity of nearbyItems()) {
        if (before.has(entity.id)) continue;
        const typeId = entity.getComponent("minecraft:item")?.itemStack.typeId;
        if (typeId?.endsWith("_shulker_box")) {
          entity.teleport(player.location);
          received = true;
        } else if (typeId === "minecraft:chest") {
          entity.remove();
        }
      }
    } catch (e) {
      console.warn(`[OpCodex] pickup: ${e}`);
    }
    if (received) {
      celebrate(player);
      finish(`§a${kit.name} dropped to you.`);
      return;
    }
    if (attempt < 10) {
      system.runTimeout(() => gather(attempt + 1, before), 2);
      return;
    }
    finish("§cError: the shulker box did not drop.");
  };
  const collect = (attempt) => {
    let block;
    try {
      block = dimension.getBlock(found.spot);
      const chest = block?.getComponent("minecraft:inventory")?.container;
      if (chest?.getItem(0)) {
        const before = new Set(nearbyItems().map((entity) => entity.id));
        dimension.runCommand(`setblock ${found.spot.x} ${found.spot.y} ${found.spot.z} air destroy`);
        system.runTimeout(() => gather(0, before), 2);
        return;
      }
    } catch (e) {
      console.warn(`[OpCodex] delivery: ${e}`);
    }
    if (attempt < 20) {
      system.runTimeout(() => collect(attempt + 1), 2);
      return;
    }
    finish(block?.typeId === "minecraft:chest" ? "§cError: the kit chest was empty." : "§cError: the kit chest did not appear.");
  };
  system.runTimeout(() => collect(0), 2);
}
