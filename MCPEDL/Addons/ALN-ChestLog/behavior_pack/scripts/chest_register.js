import { world, system, BlockPermutation, BlockInventoryComponent } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import {
  ITEM_ID,
  CONTAINER_TYPES,
  loadList,
  saveList,
  matchEntry,
  refreshKnown,
  markSuppressed,
} from "./chest_sync.js";

const DEFAULT_NAME = "Storage Chest";
const NEIGHBORS = [
  { x: 1, y: 0, z: 0 },
  { x: -1, y: 0, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 0, y: 0, z: -1 },
];

function findPartner(block) {
  if (block.typeId === "minecraft:barrel") return undefined;
  const component = block.getComponent(BlockInventoryComponent.componentId);
  if (!component || !component.container || component.container.size <= 27) return undefined;
  for (const offset of NEIGHBORS) {
    const neighbor = block.offset(offset);
    if (neighbor && neighbor.typeId === block.typeId) {
      return { x: neighbor.x, y: neighbor.y, z: neighbor.z };
    }
  }
  return undefined;
}

function labelChest(dimension, location, name, wasLabeled) {
  try {
    const above = dimension.getBlock({ x: location.x, y: location.y + 1, z: location.z });
    if (!above) return false;
    if (above.typeId === "minecraft:standing_sign") {
      if (!wasLabeled) return false;
    } else {
      if (wasLabeled || !above.isAir) return false;
      above.setPermutation(
        BlockPermutation.resolve("minecraft:standing_sign", { ground_sign_direction: 0 })
      );
    }
    const sign = above.getComponent("minecraft:sign");
    if (!sign) return false;
    sign.setText(`${name} - Registered`);
    sign.setWaxed(true);
    return true;
  } catch {
    return false;
  }
}

async function openRegisterForm(player, dimensionId, clicked) {
  const dimension = world.getDimension(dimensionId);
  const block = dimension.getBlock(clicked);
  if (!block) return;

  let location = { x: clicked.x, y: clicked.y, z: clicked.z };
  let partner = findPartner(block);
  if (partner && (partner.x < location.x || (partner.x === location.x && partner.z < location.z))) {
    const swap = location;
    location = partner;
    partner = swap;
  }

  const existingList = loadList(player);
  const existingIndex = matchEntry(existingList, dimensionId, clicked);
  const defaultName = existingIndex >= 0 ? existingList[existingIndex].name : DEFAULT_NAME;

  let response;
  try {
    response = await new ModalFormData()
      .title("§6§lRegister Chest")
      .textField("Enter Chest Name", "e.g., Ores, Building Blocks, Mob Drops", {
        defaultValue: defaultName,
      })
      .submitButton("Register")
      .show(player);
  } catch {
    return;
  }
  if (response.canceled || !response.formValues) return;

  const typed = String(response.formValues[0] ?? "");
  const name = typed.replace(/§./g, "").trim().slice(0, 32) || DEFAULT_NAME;

  const list = loadList(player);
  const index = matchEntry(list, dimensionId, clicked);
  let entry;
  if (index >= 0) {
    entry = list[index];
    entry.name = name;
  } else {
    entry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name,
      dimensionId,
      location,
      pendingQueue: [],
      known: [],
    };
    if (partner) entry.partner = partner;
    list.push(entry);
  }
  refreshKnown(entry);
  const wasLabeled = !!entry.labeled;
  entry.labeled = labelChest(dimension, entry.location, name, wasLabeled) || wasLabeled;

  if (!saveList(player, list)) {
    player.onScreenDisplay.setActionBar("§c[ChestLog] §fCould not save the chest list.");
    return;
  }

  try {
    player.playSound("random.orb");
  } catch {}
  try {
    dimension.spawnParticle("minecraft:totem_particle", {
      x: entry.location.x + 0.5,
      y: entry.location.y + 1.2,
      z: entry.location.z + 0.5,
    });
  } catch {}
  player.onScreenDisplay.setActionBar(`§a[ChestLog] §e${name} - Registered`);
}

export function initRegister() {
  world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    const { player, block, itemStack, isFirstEvent } = event;
    if (!itemStack || itemStack.typeId !== ITEM_ID) return;
    if (!CONTAINER_TYPES.has(block.typeId)) return;
    markSuppressed(player);
    if (!player.isSneaking) return;
    event.cancel = true;
    if (!isFirstEvent) return;
    const dimensionId = block.dimension.id;
    const clicked = { x: block.x, y: block.y, z: block.z };
    system.run(() => {
      openRegisterForm(player, dimensionId, clicked).catch(() => {});
    });
  });
}
