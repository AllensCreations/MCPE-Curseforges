import { world, system, BlockPermutation, ItemStack } from "@minecraft/server";
import { createLogger } from "./logger.js";
import { PAINTED_DOOR_ID, VANILLA_KEY, PROP_KIND, PROP_BOTTOM, PROP_TOP, nameForKey } from "./palette.js";

const log = createLogger("painted_door");
const pending = new Map();

export function createPaintedDoorItem(kind, bottom, top) {
  const item = new ItemStack(PAINTED_DOOR_ID, 1);
  item.setDynamicProperty(PROP_KIND, kind);
  item.setDynamicProperty(PROP_BOTTOM, bottom);
  item.setDynamicProperty(PROP_TOP, top);
  item.setLore([
    "§b" + (kind === "iron" ? "Iron" : "Wooden") + " Door, painted",
    "§aBottom: §f" + nameForKey(bottom),
    "§dTop: §f" + nameForKey(top),
  ]);
  return item;
}

function readItem(item) {
  const kind = item.getDynamicProperty(PROP_KIND);
  const bottom = item.getDynamicProperty(PROP_BOTTOM);
  const top = item.getDynamicProperty(PROP_TOP);
  return {
    kind: kind === "iron" ? "iron" : "wood",
    bottom: typeof bottom === "string" ? bottom : VANILLA_KEY,
    top: typeof top === "string" ? top : VANILLA_KEY,
  };
}

function edgeFacingPlayer(player) {
  const yaw = player.getRotation().y;
  if (yaw >= -45 && yaw < 45) {
    return "north";
  }
  if (yaw >= 45 && yaw < 135) {
    return "east";
  }
  if (yaw >= -135 && yaw < -45) {
    return "west";
  }
  return "south";
}

function doorStates(half, tex, kind, dir, open) {
  return {
    "aln:half": half,
    "aln:tex": tex,
    "aln:kind": kind,
    "aln:dir": dir,
    "aln:open": open,
  };
}

function centerOf(block) {
  return { x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 };
}

function airPermutation() {
  return BlockPermutation.resolve("minecraft:air");
}

function onInteractBefore(event) {
  const item = event.itemStack;
  if (!item || item.typeId !== PAINTED_DOOR_ID) {
    return;
  }
  const data = readItem(item);
  log.step("placing painted door: kind=" + data.kind + " bottom=" + data.bottom + " top=" + data.top);
  pending.set(event.player.id, {
    kind: data.kind,
    bottom: data.bottom,
    top: data.top,
    dir: edgeFacingPlayer(event.player),
    tick: system.currentTick,
  });
}

function onPlaced(event) {
  const block = event.block;
  if (block.typeId !== PAINTED_DOOR_ID) {
    return;
  }
  const info = pending.get(event.player.id);
  pending.delete(event.player.id);
  log.step("painted door placed at " + block.x + "," + block.y + "," + block.z + " cached=" + (info ? "yes" : "no"));
  const data =
    info && system.currentTick - info.tick <= 10
      ? info
      : { kind: "wood", bottom: VANILLA_KEY, top: VANILLA_KEY, dir: edgeFacingPlayer(event.player) };
  const upper = block.above();
  if (!upper || upper.typeId !== "minecraft:air") {
    log.warn("no room for the upper half, returning the item");
    block.setPermutation(airPermutation());
    event.player.dimension.spawnItem(createPaintedDoorItem(data.kind, data.bottom, data.top), centerOf(block));
    return;
  }
  block.setPermutation(BlockPermutation.resolve(PAINTED_DOOR_ID, doorStates("lower", data.bottom, data.kind, data.dir, false)));
  upper.setPermutation(BlockPermutation.resolve(PAINTED_DOOR_ID, doorStates("upper", data.top, data.kind, data.dir, false)));
}

function onBroken(event) {
  const permutation = event.brokenBlockPermutation;
  if (permutation.type.id !== PAINTED_DOOR_ID) {
    return;
  }
  log.step("painted door broken at " + event.block.x + "," + event.block.y + "," + event.block.z);
  const half = permutation.getState("aln:half");
  const kind = permutation.getState("aln:kind") === "iron" ? "iron" : "wood";
  const ownTex = permutation.getState("aln:tex");
  const own = typeof ownTex === "string" ? ownTex : VANILLA_KEY;
  const other = half === "lower" ? event.block.above() : event.block.below();
  let otherTex = VANILLA_KEY;
  if (other && other.typeId === PAINTED_DOOR_ID) {
    const stored = other.permutation.getState("aln:tex");
    if (typeof stored === "string") {
      otherTex = stored;
    }
    other.setPermutation(airPermutation());
  }
  const bottom = half === "lower" ? own : otherTex;
  const top = half === "lower" ? otherTex : own;
  event.dimension.spawnItem(createPaintedDoorItem(kind, bottom, top), centerOf(event.block));
}

function toggleDoor(block) {
  log.step("door toggled at " + block.x + "," + block.y + "," + block.z);
  const permutation = block.permutation;
  const half = permutation.getState("aln:half");
  const open = permutation.getState("aln:open") === true;
  const other = half === "lower" ? block.above() : block.below();
  block.setPermutation(permutation.withState("aln:open", !open));
  if (other && other.typeId === PAINTED_DOOR_ID) {
    other.setPermutation(other.permutation.withState("aln:open", !open));
  }
}

export function registerPaintedDoor(blockComponentRegistry) {
  blockComponentRegistry.registerCustomComponent("aln:painted_door_use", {
    onPlayerInteract(event) {
      log.guard("toggle door", () => toggleDoor(event.block));
    },
  });
  log.step("registered aln:painted_door_use");
}

export function initPaintedDoorEvents() {
  world.beforeEvents.playerInteractWithBlock.subscribe((event) => log.guard("interact before", () => onInteractBefore(event)));
  world.afterEvents.playerPlaceBlock.subscribe((event) => log.guard("place after", () => onPlaced(event)));
  world.afterEvents.playerBreakBlock.subscribe((event) => log.guard("break after", () => onBroken(event)));
  world.afterEvents.playerLeave.subscribe((event) => {
    pending.delete(event.playerId);
  });
  log.step("door events subscribed");
}
