import { world, system, ItemStack } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { CAPACITY, ARROW_ID, isQuiver, readCount, isPlainArrow, setQuiverCount } from "./quiver_data.js";

const VERSION = "1.0.0";
const TITLE = `§l§6@ALNStudios §eQuiver§r (v${VERSION})`;
const open = new Set();

function bar(player, text) {
  try {
    player.onScreenDisplay.setActionBar(text);
  } catch {}
}

function container(player) {
  return player.getComponent("inventory")?.container;
}

function liveCount(player, slot) {
  const c = container(player);
  const item = c?.getItem(slot);
  return isQuiver(item) ? readCount(item) : -1;
}

function deposit(player, slot, limit) {
  const c = container(player);
  const count = liveCount(player, slot);
  if (!c || count < 0) return 0;
  let room = Math.min(limit, CAPACITY - count);
  let moved = 0;
  for (let i = 0; i < c.size && room > 0; i++) {
    if (i === slot) continue;
    const it = c.getItem(i);
    if (!isPlainArrow(it)) continue;
    const take = Math.min(it.amount, room);
    if (take === it.amount) c.setItem(i, undefined);
    else {
      it.amount -= take;
      c.setItem(i, it);
    }
    room -= take;
    moved += take;
  }
  if (moved > 0) setQuiverCount(c, slot, count + moved);
  return moved;
}

function withdraw(player, slot, limit) {
  const c = container(player);
  const count = liveCount(player, slot);
  if (!c || count <= 0) return 0;
  let left = Math.min(limit, count);
  const total = left;
  while (left > 0) {
    const n = Math.min(64, left);
    const rest = c.addItem(new ItemStack(ARROW_ID, n));
    if (rest) player.dimension.spawnItem(rest, player.location);
    left -= n;
  }
  setQuiverCount(c, slot, count - total);
  return total;
}

async function manage(player, slot) {
  for (;;) {
    const count = liveCount(player, slot);
    if (count < 0) return bar(player, "§cThe quiver is no longer in that slot.");
    const form = new ActionFormData()
      .title(TITLE)
      .body(`§lStored: ${count} / ${CAPACITY}§r\n§lOnly standard arrows can be stored.§r`)
      .button("§lDeposit All Arrows§r", "textures/items/arrow")
      .button("§lDeposit 64 Arrows§r", "textures/items/arrow")
      .button("§lWithdraw 64 Arrows§r", "textures/items/arrow")
      .button("§lWithdraw All Arrows§r", "textures/items/arrow")
      .button("§lBack§r", "textures/items/door_wood");
    const res = await form.show(player);
    if (res.canceled || res.selection === 4) return res.canceled ? "exit" : "back";
    let n = 0;
    if (res.selection === 0) n = deposit(player, slot, CAPACITY);
    if (res.selection === 1) n = deposit(player, slot, 64);
    if (res.selection === 2) n = -withdraw(player, slot, 64);
    if (res.selection === 3) n = -withdraw(player, slot, CAPACITY);
    if (n > 0) bar(player, `§aDeposited ${n} arrows`);
    else if (n < 0) bar(player, `§aWithdrew ${-n} arrows`);
    else bar(player, res.selection < 2 ? "§eNo standard arrows to deposit or quiver is full" : "§eThe quiver is empty");
  }
}

async function about(player) {
  const form = new ActionFormData()
    .title("About ALNStudios")
    .body(`§lCreator: ALNStudios§r\n§lQuiver v${VERSION}§r\n§lHolds up to ${CAPACITY} arrows and feeds them to bows and crossbows.§r\n§lCurseForge: ALNStudios (allenscreations)§r\n§lMCPEDL: alnstudios§r\n§lNot affiliated with Mojang or Microsoft.§r`)
    .button("§lBack§r", "textures/items/door_wood");
  await form.show(player);
}

async function mainMenu(player, slot) {
  for (;;) {
    const count = liveCount(player, slot);
    if (count < 0) return;
    const form = new ActionFormData()
      .title(TITLE)
      .body(`§lStored: ${count} / ${CAPACITY}§r`)
      .button("§lManage Arrows§r", "textures/items/quiver")
      .button("§lAbout§r", "textures/items/name_tag")
      .button("§lExit§r", "textures/items/door_wood");
    const res = await form.show(player);
    if (res.canceled || res.selection === 2) return;
    if (res.selection === 0 && (await manage(player, slot)) === "exit") return;
    if (res.selection === 1) await about(player);
  }
}

export function registerStorage() {
  world.afterEvents.itemUse.subscribe((ev) => {
    const player = ev.source;
    if (!isQuiver(ev.itemStack) || open.has(player.id)) return;
    const slot = player.selectedSlotIndex;
    open.add(player.id);
    system.run(() => {
      mainMenu(player, slot)
        .catch(() => {})
        .finally(() => open.delete(player.id));
    });
  });
}
