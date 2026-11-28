import { ActionFormData } from "@minecraft/server-ui";
import { createLogger } from "./logger.js";
import { VANILLA_KEY, paletteByItem, isDoorItem, doorKind, itemLabel, iconForItem } from "./palette.js";
import { scanInventory, readSlot, consume, giveOrDrop } from "./inventory_utils.js";
import { createPaintedDoorItem } from "./painted_door_handler.js";

const log = createLogger("painter_ui");
const sessions = new Map();
const SLOT_NAMES = ["door", "bottom", "top"];
const MAIN_KEY = "ALNPAINTER";
const PICK_KEY = "ALNPICKER";

function getSession(player) {
  let session = sessions.get(player.id);
  if (!session) {
    session = { door: undefined, bottom: undefined, top: undefined };
    sessions.set(player.id, session);
  }
  return session;
}

function stillValid(player, selection) {
  const item = readSlot(player, selection.slot);
  return item !== undefined && item.typeId === selection.typeId;
}

function refresh(player, session) {
  for (const name of SLOT_NAMES) {
    if (session[name] && !stillValid(player, session[name])) {
      session[name] = undefined;
    }
  }
}

function labelOf(selection, fallback) {
  return selection ? itemLabel(selection.typeId) : fallback;
}

function keyOf(selection) {
  if (!selection) {
    return VANILLA_KEY;
  }
  const entry = paletteByItem(selection.typeId);
  return entry ? entry.key : VANILLA_KEY;
}

function resultLine(session) {
  if (!session.door) {
    return "§cAdd a door first";
  }
  return "§bPainted " + labelOf(session.door, "Door") + " §f(" + labelOf(session.bottom, "Vanilla") + " / " + labelOf(session.top, "Vanilla") + ")";
}

function buildBody(session) {
  return [
    "§fTap the name under a slot to change it.",
    "§eDoor: §f" + labelOf(session.door, "Empty"),
    "§aBottom: §f" + labelOf(session.bottom, "Vanilla texture"),
    "§dTop: §f" + labelOf(session.top, "Vanilla texture"),
    "§bResult: §f" + resultLine(session),
    "§fPainting uses 1 door and 1 of each chosen block.",
  ].join("\n");
}

async function pickItem(player, slotName) {
  const session = getSession(player);
  const isDoor = slotName === "door";
  const entries = scanInventory(player, (item) => (isDoor ? isDoorItem(item.typeId) : paletteByItem(item.typeId) !== undefined));
  const form = new ActionFormData();
  const heading = isDoor ? "§l§eChoose Door" : slotName === "bottom" ? "§l§aChoose Bottom Block" : "§l§dChoose Top Block";
  form.title(heading + "§r " + PICK_KEY);
  if (entries.length === 0) {
    form.body(isDoor ? "§cNo doors in your inventory." : "§cNo paintable blocks in your inventory.");
  } else {
    form.body("§fPick an item from your inventory.");
  }
  form.button("§l§cEmpty slot");
  for (const entry of entries) {
    form.button("§f" + itemLabel(entry.typeId) + " §ex" + entry.amount, iconForItem(entry.typeId));
  }
  const response = await form.show(player);
  log.step("picker " + slotName + " closed: canceled=" + response.canceled + (response.canceled ? " reason=" + response.cancelationReason : " selection=" + response.selection));
  if (response.canceled) {
    return;
  }
  if (response.selection === 0) {
    session[slotName] = undefined;
    return;
  }
  const chosen = entries[response.selection - 1];
  session[slotName] = { slot: chosen.slot, typeId: chosen.typeId };
}

function addNeed(needs, selection) {
  if (!selection) {
    return;
  }
  const current = needs.get(selection.slot);
  if (current) {
    current.count += 1;
  } else {
    needs.set(selection.slot, { typeId: selection.typeId, count: 1 });
  }
}

function paint(player, session) {
  if (!session.door) {
    player.sendMessage("§cPut a door in the Door Slot first.");
    return false;
  }
  const needs = new Map();
  addNeed(needs, session.door);
  addNeed(needs, session.bottom);
  addNeed(needs, session.top);
  if (!consume(player, needs)) {
    player.sendMessage("§cYour inventory changed. Pick the items again.");
    return false;
  }
  const result = createPaintedDoorItem(doorKind(session.door.typeId), keyOf(session.bottom), keyOf(session.top));
  log.step("painted result built: kind=" + doorKind(session.door.typeId) + " bottom=" + keyOf(session.bottom) + " top=" + keyOf(session.top));
  giveOrDrop(player, result);
  player.sendMessage("§aPainted door ready: §f" + labelOf(session.bottom, "Vanilla") + " / " + labelOf(session.top, "Vanilla"));
  return true;
}

async function showMain(player) {
  const session = getSession(player);
  refresh(player, session);
  const form = new ActionFormData();
  form.title("§l§bDoor Painter§r " + MAIN_KEY);
  form.body(buildBody(session));
  form.button("§l§eDoor\n§f" + labelOf(session.door, "Empty"), session.door ? iconForItem(session.door.typeId) : undefined);
  form.button("§l§aBottom\n§f" + labelOf(session.bottom, "Vanilla"), session.bottom ? iconForItem(session.bottom.typeId) : undefined);
  form.button("§l§dTop\n§f" + labelOf(session.top, "Vanilla"), session.top ? iconForItem(session.top.typeId) : undefined);
  form.button(session.door ? "§l§bResult\n§fTake it" : "§l§cResult\n§fNeeds a door", session.door ? iconForItem(session.door.typeId) : undefined);
  log.step("showing main painter form");
  const response = await form.show(player);
  log.step("main form closed: canceled=" + response.canceled + (response.canceled ? " reason=" + response.cancelationReason : " selection=" + response.selection));
  if (response.canceled) {
    return;
  }
  if (response.selection === 0) {
    await pickItem(player, "door");
  } else if (response.selection === 1) {
    await pickItem(player, "bottom");
  } else if (response.selection === 2) {
    await pickItem(player, "top");
  } else {
    paint(player, session);
  }
  await showMain(player);
}

export function registerPainterBlock(blockComponentRegistry) {
  blockComponentRegistry.registerCustomComponent("aln:door_painter_use", {
    onPlayerInteract(event) {
      log.step("door painter interact fired, player=" + (event.player ? event.player.name : "none"));
      if (event.player) {
        log.guard("open painter form", () => showMain(event.player));
      }
    },
  });
  log.step("registered aln:door_painter_use");
}
