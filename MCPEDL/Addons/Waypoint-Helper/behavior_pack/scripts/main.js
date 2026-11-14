import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData, FormCancelationReason } from "@minecraft/server-ui";

const VERSION = "1.1.9";
const MENU_ITEM = "minecraft:compass";
const TITLE = `WPH|§6@ALNStudios Waypoint Helper §7(${VERSION})`;
const BASE_SLOTS = 10;
const COUNT_KEY = "waypoint_slot_count";
const SLOT_PREFIX = "waypoint_slot_";
const DEATH_KEY = "waypoint_last_death";
const COOLDOWN_KEY = "waypoint_cooldown_until";
const NAME_LIMIT = 24;
const BUSY_RETRIES = 10;
const BUSY_DELAY_TICKS = 10;

const TELEPORT_SECONDS = 3;
const TELEPORT_STEP_TICKS = 2;
const TELEPORT_MOVE_LIMIT_SQ = 0.25;
const TELEPORT_COOLDOWN_MS = 10000;
const FALL_PROTECTION_TICKS = 100;
const TELEPORT_TICK_SOUND = "random.click";
const TELEPORT_ARRIVE_SOUND = "mob.endermen.portal";
const TELEPORT_CANCEL_SOUND = "note.bass";
const ARRIVAL_PARTICLE = "minecraft:basic_portal_particle";
const ARRIVAL_PARTICLE_COUNT = 24;
const GROUND_SEARCH = 128;
const SETTLE_TRIES = 30;
const SETTLE_DELAY_TICKS = 2;

const DIMENSION_COLORS = {
  "minecraft:overworld": "§a",
  "minecraft:nether": "§c",
  "minecraft:the_end": "§e",
};

const DIMENSION_NAMES = {
  "minecraft:overworld": "Overworld",
  "minecraft:nether": "Nether",
  "minecraft:the_end": "The End",
};

const PICKER = {
  save: { title: "Save Waypoint", body: "Choose a slot to save your current position." },
  load: { title: "Load Waypoint", body: "Choose a slot to teleport to." },
  rename: { title: "Rename Waypoint", body: "Choose a slot to rename. Named slots hide their coordinates." },
  delete: { title: "Delete Waypoint", body: "Choose a slot to delete. Choosing an empty extra slot at the end removes it." },
  move: { title: "Move Waypoint", body: "Choose the slot you want to move." },
  moveTo: { title: "Move To", body: "Choose where it goes. A filled slot swaps places with it." },
};

const heading = (text, body) => `§l${text}§r\n${body}`;

const openMenus = new Set();
const teleporting = new Map();

const wait = (ticks) => new Promise((resolve) => system.runTimeout(resolve, ticks));

function slotCount(player) {
  const value = player.getDynamicProperty(COUNT_KEY);
  return typeof value === "number" && value >= BASE_SLOTS ? Math.floor(value) : BASE_SLOTS;
}

function readStored(player, key) {
  const raw = player.getDynamicProperty(key);
  if (typeof raw !== "string") return undefined;
  try {
    const data = JSON.parse(raw);
    if (data && typeof data.x === "number" && typeof data.y === "number" && typeof data.z === "number" && typeof data.d === "string") return data;
  } catch (error) {
    return undefined;
  }
  return undefined;
}

function readSlot(player, index) {
  return readStored(player, SLOT_PREFIX + index);
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

function trimExtraSlots(player) {
  const before = slotCount(player);
  let total = before;
  while (total > BASE_SLOTS && !readSlot(player, total - 1)) total--;
  if (total !== before) player.setDynamicProperty(COUNT_KEY, total);
  return before - total;
}

function dimensionColor(id) {
  return DIMENSION_COLORS[id] ?? "§f";
}

function dimensionName(id) {
  return DIMENSION_NAMES[id] ?? id;
}

function coordText(slot) {
  return `${Math.floor(slot.x)}, ${Math.floor(slot.y)}, ${Math.floor(slot.z)}`;
}

function slotLabel(slot, index) {
  if (!slot) return `Slot ${index + 1}: Empty`;
  if (slot.n) return `${dimensionColor(slot.d)}${index + 1}. ${slot.n}`;
  return `${dimensionColor(slot.d)}${index + 1}. ${coordText(slot)}\n${dimensionName(slot.d)}`;
}

function slotName(slot, index) {
  return slot.n ? `"${slot.n}"` : `slot ${index + 1}`;
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
    form.button("Exit");
    form.button("Back");
    const death = mode === "load" ? readStored(player, DEATH_KEY) : undefined;
    const offset = mode === "load" ? 3 : 2;
    if (mode === "load") form.button(death ? `${dimensionColor(death.d)}Last Death: ${coordText(death)}\n${dimensionName(death.d)}` : "Last Death: None");
    for (let i = 0; i < total; i++) form.button(slotLabel(slots[i], i));
    let next = total + offset;
    let addIndex = -1;
    if (mode === "save" && slots.every((slot) => slot)) {
      form.button("+ Add Slot");
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
    if (mode === "load" && response.selection === 2) return { kind: "death" };
    return { kind: "slot", index: response.selection - offset };
  }
}

async function confirmOverwrite(player, index, slot) {
  const form = new ActionFormData()
    .title(TITLE)
    .body(heading("Overwrite Slot", `Slot ${index + 1} already holds ${slot.n ? `"${slot.n}"` : coordText(slot)}.\nReplace it with your current position?`))
    .button("Exit")
    .button("Overwrite")
    .button("Cancel");
  const response = await show(form, player);
  if (!response || response.canceled || response.selection === 0) return null;
  return response.selection === 1;
}

async function confirmDelete(player, index, slot) {
  const form = new ActionFormData()
    .title(TITLE)
    .body(heading("Delete Slot", `Slot ${index + 1} holds ${slot.n ? `"${slot.n}"` : coordText(slot)}.\nDelete it? This cannot be undone.`))
    .button("Exit")
    .button("Delete")
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
    const hint = existing && existing.n ? `empty keeps "${existing.n}"` : "empty shows coordinates";
    const nameForm = new ModalFormData().title(TITLE).textField(`§lName Slot ${pick.index + 1}§r\nName (${hint})`, "Example: Home");
    const nameResponse = await show(nameForm, player);
    if (!nameResponse || nameResponse.canceled) return "closed";
    const name = cleanName(nameResponse.formValues[0]);
    if (name) data.n = name;
    else if (existing && existing.n) data.n = existing.n;
    writeSlot(player, pick.index, data);
    actionBar(player, `${dimensionColor(data.d)}Saved ${slotName(data, pick.index)} (${dimensionName(data.d)}).`);
    return "done";
  }
}

function cleanName(value) {
  return String(value ?? "").replace(/§/g, "").trim().slice(0, NAME_LIMIT);
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

function arrivalEffect(player) {
  try {
    const { x, y, z } = player.location;
    for (let i = 0; i < ARRIVAL_PARTICLE_COUNT; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.8;
      player.dimension.spawnParticle(ARRIVAL_PARTICLE, {
        x: x + Math.cos(angle) * radius,
        y: y + Math.random() * 2,
        z: z + Math.sin(angle) * radius,
      });
    }
  } catch (error) {
    return;
  }
}

function protectFromFall(player) {
  try {
    player.addEffect("slow_falling", FALL_PROTECTION_TICKS, { amplifier: 0, showParticles: false });
  } catch (error) {
    return;
  }
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
    arrivalEffect(player);
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
  const readyAt = player.getDynamicProperty(COOLDOWN_KEY);
  const left = typeof readyAt === "number" ? readyAt - Date.now() : 0;
  if (left > 0 && left <= TELEPORT_COOLDOWN_MS) {
    actionBar(player, `§eTeleport ready in ${Math.ceil(left / 1000)} seconds.`);
    return;
  }
  const color = dimensionColor(slot.d);
  const start = player.location;
  const startDimension = player.dimension.id;
  let remaining = TELEPORT_SECONDS * 20;
  let shown = -1;
  let handle;
  const finish = () => {
    system.clearRun(handle);
    teleporting.delete(player.id);
  };
  const cancel = (reason) => {
    finish();
    actionBar(player, `§cTeleport cancelled: ${reason}.`);
    playSound(player, TELEPORT_CANCEL_SOUND, 0.8);
  };
  handle = system.runInterval(() => {
    try {
      if (!player.isValid) {
        finish();
        return;
      }
      const here = player.location;
      const dx = here.x - start.x;
      const dy = here.y - start.y;
      const dz = here.z - start.z;
      if (player.dimension.id !== startDimension || dx * dx + dy * dy + dz * dz > TELEPORT_MOVE_LIMIT_SQ) {
        cancel("you moved");
        return;
      }
      if (remaining <= 0) {
        finish();
        if (teleportTo(player, slot)) {
          player.setDynamicProperty(COOLDOWN_KEY, Date.now() + TELEPORT_COOLDOWN_MS);
          protectFromFall(player);
          playSound(player, TELEPORT_ARRIVE_SOUND, 1);
          arrivalEffect(player);
          actionBar(player, `${color}Teleported to ${label}.`);
          settleOnGround(player, color);
        } else {
          actionBar(player, "§cCould not teleport to that waypoint.");
        }
        return;
      }
      const seconds = Math.ceil(remaining / 20);
      if (seconds !== shown) {
        shown = seconds;
        actionBar(player, `${color}Teleporting to ${label} in §l§f${seconds}§r${color}... Stay still.`);
        playSound(player, TELEPORT_TICK_SOUND, 1 + (TELEPORT_SECONDS - seconds) * 0.25);
      }
      remaining -= TELEPORT_STEP_TICKS;
    } catch (error) {
      finish();
    }
  }, TELEPORT_STEP_TICKS);
  teleporting.set(player.id, { cancel });
}

async function loadFlow(player) {
  let notice;
  while (true) {
    const pick = await pickSlot(player, "load", notice);
    if (pick.kind === "death") {
      const death = readStored(player, DEATH_KEY);
      if (!death) {
        notice = "No death location saved yet.";
        continue;
      }
      startTeleport(player, death, "your last death");
      return "done";
    }
    if (pick.kind !== "slot") return pick.kind;
    const slot = readSlot(player, pick.index);
    if (!slot) {
      notice = `Slot ${pick.index + 1} is empty.`;
      continue;
    }
    startTeleport(player, slot, slotName(slot, pick.index));
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
      notice = `Slot ${pick.index + 1} is empty. Save a position there first.`;
      continue;
    }
    const form = new ModalFormData()
      .title(TITLE)
      .textField(`§lRename Slot ${pick.index + 1}§r\nName (leave empty to show coordinates again)`, "Example: Home");
    const response = await show(form, player);
    if (!response || response.canceled) return "closed";
    const name = cleanName(response.formValues[0]);
    if (name) {
      slot.n = name;
      writeSlot(player, pick.index, slot);
      actionBar(player, `§aSlot ${pick.index + 1} renamed to "${name}". Coordinates are hidden.`);
    } else {
      delete slot.n;
      writeSlot(player, pick.index, slot);
      actionBar(player, `§aSlot ${pick.index + 1} name cleared. Coordinates are visible again.`);
    }
    return "done";
  }
}

async function deleteFlow(player) {
  let notice;
  while (true) {
    const pick = await pickSlot(player, "delete", notice);
    if (pick.kind !== "slot") return pick.kind;
    const slot = readSlot(player, pick.index);
    if (!slot) {
      const removed = pick.index >= BASE_SLOTS ? trimExtraSlots(player) : 0;
      if (removed > 0) {
        actionBar(player, `§aRemoved ${removed} empty extra slot${removed === 1 ? "" : "s"}.`);
        return "done";
      }
      notice = pick.index >= BASE_SLOTS ? `Slot ${pick.index + 1} is empty. Extra slots can only be removed from the end.` : `Slot ${pick.index + 1} is empty.`;
      continue;
    }
    const confirmed = await confirmDelete(player, pick.index, slot);
    if (confirmed === null) return "closed";
    if (!confirmed) {
      notice = undefined;
      continue;
    }
    player.setDynamicProperty(SLOT_PREFIX + pick.index, undefined);
    const removed = trimExtraSlots(player);
    actionBar(player, `§aDeleted ${slotName(slot, pick.index)}.${removed > 0 ? ` ${removed} empty extra slot${removed === 1 ? "" : "s"} removed.` : ""}`);
    return "done";
  }
}

async function moveFlow(player) {
  let notice;
  while (true) {
    const from = await pickSlot(player, "move", notice);
    if (from.kind !== "slot") return from.kind;
    const source = readSlot(player, from.index);
    if (!source) {
      notice = `Slot ${from.index + 1} is empty.`;
      continue;
    }
    const to = await pickSlot(player, "moveTo");
    if (to.kind === "closed") return "closed";
    if (to.kind !== "slot") {
      notice = undefined;
      continue;
    }
    if (to.index === from.index) {
      notice = "Choose a different slot to move it to.";
      continue;
    }
    const target = readSlot(player, to.index);
    writeSlot(player, to.index, source);
    if (target) writeSlot(player, from.index, target);
    else player.setDynamicProperty(SLOT_PREFIX + from.index, undefined);
    trimExtraSlots(player);
    actionBar(player, `§aMoved ${slotName(source, from.index)} to slot ${to.index + 1}.${target ? ` The old slot ${to.index + 1} is now slot ${from.index + 1}.` : ""}`);
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
    actionBar(player, `§aSpawn point saved at ${location.x}, ${location.y}, ${location.z} (${dimensionName(player.dimension.id)}).`);
  } catch (error) {
    actionBar(player, "§cCould not save the spawn point here.");
  }
}

async function aboutScreen(player) {
  const form = new ActionFormData()
    .title(TITLE)
    .body(
      heading(
        "About",
        `Waypoint Helper by §lALNStudios§r\n\nSlots start at §l${BASE_SLOTS}§r. When every slot is filled, Save shows a button to add one more, with no upper limit.\n\n` +
          `§lSave§r stores your position and asks for an optional name. §lLoad§r counts down ${TELEPORT_SECONDS} seconds, then teleports you there. Moving or taking damage cancels it, and there is a ${TELEPORT_COOLDOWN_MS / 1000} second wait between teleports. ` +
          "§lRename§r gives a slot a name and hides its coordinates. §lMove§r changes a slot's position and swaps places with a filled slot. §lDelete§r clears a slot and removes empty extra slots from the end. §lLoad§r also lists where you last died.\n\n" +
          "§lSave Spawn Here§r sets your respawn point to where you stand.\n\nWaypoints belong to each player."
      )
    )
    .button("Exit")
    .button("Back");
  const response = await show(form, player);
  return !response || response.canceled || response.selection === 0 ? "closed" : "back";
}

async function mainMenu(player) {
  while (true) {
    const form = new ActionFormData()
      .title(TITLE)
      .body(heading("Main Menu", `Slots used: §l${usedCount(player)}§r / §l${slotCount(player)}§r`))
      .button("Exit")
      .button("Save Spawn Here")
      .button("Save")
      .button("Load")
      .button("Rename")
      .button("Move")
      .button("Delete")
      .button("About");
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
        result = await moveFlow(player);
        break;
      case 6:
        result = await deleteFlow(player);
        break;
      case 7:
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

world.afterEvents.entityHurt.subscribe((event) => {
  const state = teleporting.get(event.hurtEntity.id);
  if (state) state.cancel("you took damage");
});

world.afterEvents.entityDie.subscribe(
  (event) => {
    try {
      const player = event.deadEntity;
      const rotation = player.getRotation();
      player.setDynamicProperty(
        DEATH_KEY,
        JSON.stringify({
          x: Math.round(player.location.x * 100) / 100,
          y: Math.round(player.location.y * 100) / 100,
          z: Math.round(player.location.z * 100) / 100,
          d: player.dimension.id,
          rx: rotation.x,
          ry: rotation.y,
        })
      );
    } catch (error) {
      return;
    }
  },
  { entityTypes: ["minecraft:player"] }
);
