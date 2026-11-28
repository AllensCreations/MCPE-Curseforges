import { world, system, Block, Dimension, ItemStack, Player, Vector3 } from "@minecraft/server";
import { HOPPER_TYPE, LINKED_ID, RECEIVER_TYPES, REMOTE_ID } from "./constants.js";
import { notify } from "./feedback.js";
import { decodeSender, encodeSender } from "./lore.js";
import { getReceivers, makeKey, parseKey, removeHopper, toggleReceiver } from "./registry.js";

interface Context {
  player: Player;
  dimension: Dimension;
  loc: Vector3;
}

function safeBlock(dimension: Dimension, loc: Vector3): Block | undefined {
  try {
    return dimension.getBlock(loc);
  } catch {
    return undefined;
  }
}

function setHeld(player: Player, item: ItemStack): void {
  const container = player.getComponent("inventory")?.container;
  if (!container) return;
  container.setItem(player.selectedSlotIndex, item);
}

function blankRemote(): ItemStack {
  return new ItemStack(REMOTE_ID, 1);
}

function register(ctx: Context): void {
  const block = safeBlock(ctx.dimension, ctx.loc);
  if (!block || block.typeId !== HOPPER_TYPE) {
    notify(ctx.player, "That Hopper is gone.", "error");
    return;
  }
  const key = makeKey(ctx.dimension.id, ctx.loc.x, ctx.loc.y, ctx.loc.z);
  const linked = new ItemStack(LINKED_ID, 1);
  linked.setLore(encodeSender(key));
  setHeld(ctx.player, linked);
  const count = getReceivers(key).length;
  notify(ctx.player, `Hopper registered (${count} linked). Right-click containers to link them.`, "ok");
}

function unregister(ctx: Context): void {
  setHeld(ctx.player, blankRemote());
  notify(ctx.player, "Remote cleared. Right-click a Hopper to register it.", "warn");
}

function bind(ctx: Context, senderKey: string): void {
  const info = parseKey(senderKey);
  if (!info) {
    setHeld(ctx.player, blankRemote());
    notify(ctx.player, "This Remote has no valid Hopper. It was cleared.", "error");
    return;
  }
  let senderBlock: Block | undefined;
  try {
    senderBlock = world.getDimension(info.dimensionId).getBlock({ x: info.x, y: info.y, z: info.z });
  } catch {
    senderBlock = undefined;
  }
  if (!senderBlock) {
    notify(ctx.player, "The registered Hopper is not loaded right now.", "warn");
    return;
  }
  if (senderBlock.typeId !== HOPPER_TYPE) {
    removeHopper(senderKey);
    setHeld(ctx.player, blankRemote());
    notify(ctx.player, "The registered Hopper no longer exists. Remote cleared.", "error");
    return;
  }
  const target = safeBlock(ctx.dimension, ctx.loc);
  if (!target || !RECEIVER_TYPES.has(target.typeId)) {
    notify(ctx.player, "That is not a Chest, Barrel or Hopper.", "error");
    return;
  }
  const result = toggleReceiver(senderKey, makeKey(ctx.dimension.id, ctx.loc.x, ctx.loc.y, ctx.loc.z));
  const count = getReceivers(senderKey).length;
  switch (result) {
    case "added":
      notify(ctx.player, `Receiver linked (${count} total).`, "ok");
      break;
    case "removed":
      notify(ctx.player, `Receiver unlinked (${count} total).`, "warn");
      break;
    case "full":
      notify(ctx.player, "This Hopper has the maximum number of receivers.", "error");
      break;
    case "limit":
      notify(ctx.player, "The world has the maximum number of registered Hoppers.", "error");
      break;
    case "self":
      notify(ctx.player, "A Hopper cannot be its own receiver.", "error");
      break;
    default:
      notify(ctx.player, "A sending Hopper cannot be a receiver, and a receiver cannot send.", "error");
      break;
  }
}

export function initRemote(): void {
  world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    if (!event.isFirstEvent) return;
    const held = event.itemStack;
    if (!held) return;
    const isBlank = held.typeId === REMOTE_ID;
    const isLinked = held.typeId === LINKED_ID;
    if (!isBlank && !isLinked) return;
    const block = event.block;
    const typeId = block.typeId;
    if (!RECEIVER_TYPES.has(typeId)) return;

    const player = event.player;
    const dimension = block.dimension;
    const loc: Vector3 = { x: block.location.x, y: block.location.y, z: block.location.z };
    const ctx: Context = { player, dimension, loc };
    const isHopper = typeId === HOPPER_TYPE;
    const senderKey = isLinked ? decodeSender(held.getLore()) : undefined;

    event.cancel = true;

    if (!senderKey) {
      if (isHopper) system.run(() => register(ctx));
      else system.run(() => notify(player, "Right-click a Hopper with the Remote first.", "warn"));
      return;
    }

    const key = makeKey(dimension.id, loc.x, loc.y, loc.z);
    if (isHopper && key === senderKey) system.run(() => unregister(ctx));
    else system.run(() => bind(ctx, senderKey));
  });
}
