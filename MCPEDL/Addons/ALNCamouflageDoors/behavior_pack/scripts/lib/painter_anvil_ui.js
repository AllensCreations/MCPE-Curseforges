import { ActionFormData } from "@minecraft/server-ui";
import { VANILLA_KEY, paletteByItem, isDoorItem, doorKind, itemLabel } from "./palette.js";
import { scanInventory, readSlot, consume, giveOrDrop } from "./inventory_utils.js";
import { createPaintedDoorItem } from "./painted_door_handler.js";

const sessions = new Map();
const SLOT_NAMES = ["door", "bottom", "top"];

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
    "§e[Door] §f+ §a[Bottom Block] §f+ §d[Top Block] §f= §b[Result]",
    "",
    "§eDoor: §f" + labelOf(session.door, "Empty"),
    "§aBottom: §f" + labelOf(session.bottom, "Vanilla texture"),
    "§dTop: §f" + labelOf(session.top, "Vanilla texture"),
    "§bResult: §f" + resultLine(session),
    "",
    "§fPainting uses 1 door and 1 of each chosen block.",
  ].join("\n");
}

async function pickItem(player, slotName) {
  const session = getSession(player);
  const isDoor = slotName === "door";
  const entries = scanInventory(player, (item) => (isDoor ? isDoorItem(item.typeId) : paletteByItem(item.typeId) !== undefined));
  const form = new ActionFormData();
  form.title(isDoor ? "§l§eChoose Door" : slotName === "bottom" ? "§l§aChoose Bottom Block" : "§l§dChoose Top Block");
  if (entries.length === 0) {
    form.body(isDoor ? "§cNo doors in your inventory." : "§cNo paintable blocks in your inventory.");
  } else {
    form.body("§fPick an item from your inventory.");
  }
  form.button("§l§cEmpty slot");
  for (const entry of entries) {
    form.button("§f" + itemLabel(entry.typeId) + " §ex" + entry.amount);
  }
  const response = await form.show(player);
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
  giveOrDrop(player, result);
  player.sendMessage("§aPainted door ready: §f" + labelOf(session.bottom, "Vanilla") + " / " + labelOf(session.top, "Vanilla"));
  return true;
}

async function showMain(player) {
  const session = getSession(player);
  refresh(player, session);
  const form = new ActionFormData();
  form.title("§l§bDoor Painter");
  form.body(buildBody(session));
  form.button("§l§eDoor Slot\n§f" + labelOf(session.door, "Empty"));
  form.button("§l§aBottom Block\n§f" + labelOf(session.bottom, "Vanilla texture"));
  form.button("§l§dTop Block\n§f" + labelOf(session.top, "Vanilla texture"));
  form.button(session.door ? "§l§bTake Result\n" + resultLine(session) : "§l§cResult\n§fNeeds a door");
  form.button("§l§cClear Slots");
  const response = await form.show(player);
  if (response.canceled) {
    return;
  }
  if (response.selection === 0) {
    await pickItem(player, "door");
  } else if (response.selection === 1) {
    await pickItem(player, "bottom");
  } else if (response.selection === 2) {
    await pickItem(player, "top");
  } else if (response.selection === 3) {
    paint(player, session);
  } else {
    session.door = undefined;
    session.bottom = undefined;
    session.top = undefined;
  }
  await showMain(player);
}

export function registerPainterBlock(blockComponentRegistry) {
  blockComponentRegistry.registerCustomComponent("aln:door_painter_use", {
    onPlayerInteract(event) {
      if (event.player) {
        showMain(event.player);
      }
    },
  });
}
