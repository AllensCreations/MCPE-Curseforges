import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData, FormCancelationReason } from "@minecraft/server-ui";

const VERSION = "1.1.2";
const MENU_ITEM = "minecraft:compass";
const TITLE = `WPH|§6@ALNStudios Waypoint Helper §7(${VERSION})`;
const BASE_SLOTS = 10;
const COUNT_KEY = "waypoint_slot_count";
const SLOT_PREFIX = "waypoint_slot_";
const NAME_LIMIT = 24;
const BUSY_RETRIES = 10;
const BUSY_DELAY_TICKS = 10;
const TELEPORT_SECONDS = 3;
const TELEPORT_TICK_SOUND = "random.click";
const TELEPORT_ARRIVE_SOUND = "mob.endermen.portal";

const DIMENSION_COLORS = {
  "minecraft:overworld": "§a",
  "minecraft:nether": "§c",
  "minecraft:the_end": "§e",
};

const teleporting = new Set();
const GROUND_SEARCH = 128;
const SETTLE_TRIES = 30;
const SETTLE_DELAY_TICKS = 2;

const DIMENSION_NAMES = {
  "minecraft:overworld": "Overworld",
  "minecraft:nether": "Nether",
  "minecraft:the_end": "The End",
};

const PICKER = {
  save: { title: "Save Waypoint", body: "Choose a slot to save your current position." },
  load: { title: "Load Waypoint", body: "Choose a slot to teleport to." },
  rename: { title: "Rename Waypoint", body: "Choose a slot to rename. Named slots hide their coordinates." },
};

const heading = (text, body) => `§l§f${text}§r\n${body}`;

const openMenus = new Set();

const wait = (ticks) => new Promise((resolve) => system.runTimeout(resolve, ticks));

function slotCount(player) {
  const value = player.getDynamicProperty(COUNT_KEY);
  return typeof value === "number" && value >= BASE_SLOTS ? Math.floor(value) : BASE_SLOTS;
}

function readSlot(player, index) {
  const raw = player.getDynamicProperty(SLOT_PREFIX + index);
  if (typeof raw !== "string") return undefined;
  try {
    const data = JSON.parse(raw);
    if (data && typeof data.x === "number" && typeof data.y === "number" && typeof data.z === "number" && typeof data.d === "string") return data;
  } catch (error) {
    return undefined;
  }
  return undefined;
}

function writeSlot(player, index, data) {
  player.setDynamicProperty(SLOT_PREFIX + index, JSON.stringify(data));
}

function usedCount(player) {
  let used = 0;
  const total = slotCount(player);
  for (let i = 0; i < total; i++) if (readSlot(player, i)) used++;
  return used;
}

function dimensionColor(id) {
  return DIMENSION_COLORS[id] ?? "§f";
}

function playSound(player, soundId, pitch) {
  try {
    player.playSound(soundId, { volume: 1, pitch });
  } catch (error) {
    return;
  }
}

function actionBar(player, text) {
  try {
    player.onScreenDisplay.setActionBar(text);
  } catch (error) {
    return;
  }
}

function dimensionName(id) {
  return DIMENSION_NAMES[id] ?? id;
}

function coordText(slot) {
  return `${Math.floor(slot.x)}, ${Math.floor(slot.y)}, ${Math.floor(slot.z)}`;
}

function slotLabel(slot, index) {
  if (!slot) return `§7Slot ${index + 1}: Empty`;
  if (slot.n) return `§6${index + 1}. §f${slot.n}`;
  return `§6${index + 1}. §b${coordText(slot)}\n§7${dimensionName(slot.d)}`;
}

function slotTitle(slot, index) {
  return slot.n ? `"${slot.n}"` : `slot ${index + 1} (${coordText(slot)})`;
}

async function show(form, player) {
  for (let attempt = 0; attempt <= BUSY_RETRIES; attempt++) {
    const response = await form.show(player);
    if (response.cancelationReason !== FormCancelationReason.UserBusy) return response;
    await wait(BUSY_DELAY_TICKS);
  }
  return undefined;
}

async function pickSlot(player, mode, notice) {
  while (true) {
    const total = slotCount(player);
    const slots = [];
    for (let i = 0; i < total; i++) slots.push(readSlot(player, i));
    const form = new ActionFormData().title(TITLE).body(heading(PICKER[mode].title, `${notice ? `${notice}\n` : ""}${PICKER[mode].body}`));
    form.button("§cExit");
    form.button("§7Back");
    for (let i = 0; i < total; i++) form.button(slotLabel(slots[i], i));
    let next = total + 2;
    let addIndex = -1;
    if (mode === "save" && slots.every((slot) => slot)) {
      form.button("§a+ Add Slot");
      addIndex = next++;
    }
    const response = await show(form, player);
    if (!response || response.canceled || response.selection === 0) return { kind: "closed" };
    if (response.selection === 1) return { kind: "back" };
    if (response.selection === addIndex) {
      player.setDynamicProperty(COUNT_KEY, total + 1);
      notice = `Slot ${total + 1} added.`;
      continue;
    }
    return { kind: "slot", index: response.selection - 2 };
  }
}

async function confirmOverwrite(player, index, slot) {
  const form = new ActionFormData()
    .title(TITLE)
    .body(heading("Overwrite Slot", `Slot ${index + 1} already holds §b${slot.n ? `"${slot.n}"` : coordText(slot)}§r.\nReplace it with your current position?`))
    .button("§cExit")
    .button("§eOverwrite")
    .button("Cancel");
  const response = await show(form, player);
  if (!response || response.canceled || response.selection === 0) return null;
  return response.selection === 1;
}

async function saveFlow(player) {
  let notice;
  while (true) {
    const pick = await pickSlot(player, "save", notice);
    if (pick.kind !== "slot") return pick.kind;
    const existing = readSlot(player, pick.index);
    if (existing) {
      const confirmed = await confirmOverwrite(player, pick.index, existing);
      if (confirmed === null) return "closed";
      if (!confirmed) {
        notice = undefined;
        continue;
      }
    }
    const rotation = player.getRotation();
    const data = {
      x: Math.round(player.location.x * 100) / 100,
      y: Math.round(player.location.y * 100) / 100,
      z: Math.round(player.location.z * 100) / 100,
      d: player.dimension.id,
      rx: rotation.x,
      ry: rotation.y,
    };
    if (existing && existing.n) data.n = existing.n;
    writeSlot(player, pick.index, data);
    actionBar(player, `${dimensionColor(data.d)}Saved ${data.n ? `"${data.n}"` : `slot ${pick.index + 1}`} (${dimensionName(data.d)}).`);
    return "done";
  }
}

function teleportTo(player, slot) {
  try {
    player.teleport(
      { x: slot.x, y: slot.y, z: slot.z },
      { dimension: world.getDimension(slot.d), rotation: { x: slot.rx ?? 0, y: slot.ry ?? 0 } }
    );
    return true;
  } catch (error) {
    return false;
  }
}

function groundTarget(dimension, x, y, z) {
  const passable = (yy) => {
    const block = dimension.getBlock({ x, y: yy, z });
    return !!block && (block.isAir || (!block.isSolid && !block.isLiquid));
  };
  const holds = (yy) => {
    const block = dimension.getBlock({ x, y: yy, z });
    return !!block && (block.isSolid || block.isLiquid);
  };
  const range = dimension.heightRange;
  if (!passable(y + 1)) {
    const top = Math.min(y + GROUND_SEARCH, range.max - 1);
    for (let yy = y + 2; yy < top; yy++) if (passable(yy) && passable(yy + 1) && holds(yy - 1)) return yy;
    return null;
  }
  if (!passable(y) || holds(y - 1)) return y;
  const bottom = Math.max(y - GROUND_SEARCH, range.min);
  for (let yy = y - 2; yy > bottom; yy--) if (holds(yy)) return yy + 1;
  return null;
}

function settleOnGround(player, color, tries = 0) {
  try {
    if (!player.isValid) return;
    const location = player.location;
    const x = Math.floor(location.x);
    const y = Math.floor(location.y);
    const z = Math.floor(location.z);
    const target = groundTarget(player.dimension, x, y, z);
    if (target === null) {
      actionBar(player, "§eNo solid ground found at this waypoint.");
      return;
    }
    if (target === y) return;
    const below = player.dimension.getBlock({ x, y: target - 1, z });
    if (below && below.typeId.includes("lava")) {
      actionBar(player, "§cLava below this waypoint. Staying put.");
      return;
    }
    player.teleport({ x: location.x, y: target, z: location.z });
    actionBar(player, `${color}Landing moved to solid ground.`);
  } catch (error) {
    if (tries < SETTLE_TRIES) system.runTimeout(() => settleOnGround(player, color, tries + 1), SETTLE_DELAY_TICKS);
  }
}

function startTeleport(player, slot, label) {
  if (teleporting.has(player.id)) {
    actionBar(player, "§eYou are already teleporting.");
    return;
  }
  teleporting.add(player.id);
  const color = dimensionColor(slot.d);
  let remaining = TELEPORT_SECONDS;
  const step = () => {
    try {
      if (!player.isValid) {
        teleporting.delete(player.id);
        return;
      }
      if (remaining > 0) {
        actionBar(player, `${color}Teleporting to ${label} in §l${remaining}§r${color}...`);
        playSound(player, TELEPORT_TICK_SOUND, 1 + (TELEPORT_SECONDS - remaining) * 0.25);
        remaining--;
        system.runTimeout(step, 20);
        return;
      }
      teleporting.delete(player.id);
      if (teleportTo(player, slot)) {
        playSound(player, TELEPORT_ARRIVE_SOUND, 1);
        actionBar(player, `${color}Teleported to ${label}.`);
        settleOnGround(player, color);
      } else {
        actionBar(player, "§cCould not teleport to that waypoint.");
      }
    } catch (error) {
      teleporting.delete(player.id);
    }
  };
  step();
}

async function loadFlow(player) {
  let notice;
  while (true) {
    const pick = await pickSlot(player, "load", notice);
    if (pick.kind !== "slot") return pick.kind;
    const slot = readSlot(player, pick.index);
    if (!slot) {
      notice = `§cSlot ${pick.index + 1} is empty.`;
      continue;
    }
    startTeleport(player, slot, slot.n ? `"${slot.n}"` : `slot ${pick.index + 1}`);
    return "done";
  }
}

async function renameFlow(player) {
  let notice;
  while (true) {
    const pick = await pickSlot(player, "rename", notice);
    if (pick.kind !== "slot") return pick.kind;
    const slot = readSlot(player, pick.index);
    if (!slot) {
      notice = `§cSlot ${pick.index + 1} is empty. Save a position there first.`;
      continue;
    }
    const form = new ModalFormData()
      .title(TITLE)
      .textField(`§l§fRename Slot ${pick.index + 1}§r\n§7Name (leave empty to show coordinates again)`, "Example: Home");
    const response = await show(form, player);
    if (!response || response.canceled) return "closed";
    const name = String(response.formValues[0] ?? "").replace(/§/g, "").trim().slice(0, NAME_LIMIT);
    if (name) {
      slot.n = name;
      writeSlot(player, pick.index, slot);
      player.sendMessage(`§aSlot ${pick.index + 1} renamed to "${name}". Coordinates are hidden.`);
    } else {
      delete slot.n;
      writeSlot(player, pick.index, slot);
      player.sendMessage(`§aSlot ${pick.index + 1} name cleared. Coordinates are visible again.`);
    }
    return "done";
  }
}

function saveSpawnHere(player) {
  try {
    const location = {
      dimension: player.dimension,
      x: Math.floor(player.location.x),
      y: Math.floor(player.location.y),
      z: Math.floor(player.location.z),
    };
    player.setSpawnPoint(location);
    player.sendMessage(`§aSpawn point saved at ${location.x}, ${location.y}, ${location.z} (${dimensionName(player.dimension.id)}).`);
  } catch (error) {
    player.sendMessage("§cCould not save the spawn point here.");
  }
}

async function aboutScreen(player) {
  const form = new ActionFormData()
    .title(TITLE)
    .body(
      heading(
        "About",
        `Waypoint Helper by §6ALNStudios§r\n\nSlots start at §b${BASE_SLOTS}§r. When every slot is filled, Save shows a button to add one more, with no upper limit.\n\n` +
          "§aSave§r stores your position. §bLoad§r teleports you there. §dRename§r gives a slot a name and hides its coordinates.\n\n" +
          "§eSave Spawn Here§r sets your respawn point to where you stand.\n\nWaypoints belong to each player."
      )
    )
    .button("§cExit")
    .button("§7Back");
  const response = await show(form, player);
  return !response || response.canceled || response.selection === 0 ? "closed" : "back";
}

async function mainMenu(player) {
  while (true) {
    const form = new ActionFormData()
      .title(TITLE)
      .body(heading("Main Menu", `Slots used: §b${usedCount(player)}§r / §b${slotCount(player)}§r`))
      .button("§cExit")
      .button("§eSave Spawn Here")
      .button("§aSave")
      .button("§bLoad")
      .button("§dRename")
      .button("§7About");
    const response = await show(form, player);
    if (!response || response.canceled) return;
    let result = "back";
    switch (response.selection) {
      case 0:
        return;
      case 1:
        saveSpawnHere(player);
        return;
      case 2:
        result = await saveFlow(player);
        break;
      case 3:
        result = await loadFlow(player);
        break;
      case 4:
        result = await renameFlow(player);
        break;
      case 5:
        result = await aboutScreen(player);
        break;
    }
    if (result !== "back") return;
  }
}

async function openMenu(player) {
  if (openMenus.has(player.id)) return;
  openMenus.add(player.id);
  try {
    await mainMenu(player);
  } catch (error) {
    return;
  } finally {
    openMenus.delete(player.id);
  }
}

world.afterEvents.itemUse.subscribe((event) => {
  if (event.itemStack.typeId !== MENU_ITEM) return;
  openMenu(event.source);
});
