import { world, system, EnchantmentTypes } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

const VERSION = "1.0.2";
const TITLE = "§l§6@ALNStudios §eEnchanter§r (v" + VERSION + ")";
const BOOK_ID = "minecraft:book";
const BOOK_NAME = "Enchanter";
const ENCHANTABLE = "minecraft:enchantable";
const INVENTORY = "minecraft:inventory";
const ICON_OVERRIDES = {
  "minecraft:bow": "textures/items/bow_standby",
  "minecraft:crossbow": "textures/items/crossbow_standby",
  "minecraft:fishing_rod": "textures/items/fishing_rod_uncast",
  "minecraft:enchanted_book": "textures/items/book_enchanted",
};
const busy = new Set();

function notify(player, text) {
  try {
    player.onScreenDisplay.setActionBar(text);
  } catch (error) {
    return;
  }
}

function tryCall(target, method, ...args) {
  if (typeof target[method] === "function") target[method](...args);
}

function isEnchanterBook(item) {
  return !!item && item.typeId === BOOK_ID && item.nameTag === BOOK_NAME;
}

function titleCase(id) {
  return id
    .replace(/^minecraft:/, "")
    .split("_")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}

function iconFor(typeId) {
  if (ICON_OVERRIDES[typeId]) return ICON_OVERRIDES[typeId];
  const name = typeId
    .replace(/^minecraft:/, "")
    .replace(/^wooden_/, "wood_")
    .replace(/^golden_/, "gold_");
  if (name.endsWith("_spear")) return "textures/items/spear/" + name;
  if (name.endsWith("_nautilus_armor")) return "textures/items/nautilus_armor/" + name;
  return "textures/items/" + name;
}

function levelsOf(item) {
  const map = new Map();
  const comp = item.getComponent(ENCHANTABLE);
  if (!comp) return map;
  for (const enchant of comp.getEnchantments()) {
    map.set(enchant.type.id, enchant.level);
  }
  return map;
}

function signatureOf(item) {
  const parts = [];
  for (const [id, level] of levelsOf(item)) parts.push(id + ":" + level);
  parts.sort();
  return item.typeId + "|" + item.nameTag + "|" + parts.join(",");
}

function fittingTypes(item) {
  const probe = item.clone();
  const comp = probe.getComponent(ENCHANTABLE);
  if (!comp) return [];
  comp.removeAllEnchantments();
  const fits = [];
  for (const type of EnchantmentTypes.getAll()) {
    let ok = false;
    try {
      ok = comp.canAddEnchantment({ type, level: 1 });
    } catch (error) {
      ok = false;
    }
    if (ok) fits.push(type);
  }
  return fits;
}

function countText(count) {
  if (count === 0) return "no enchantments";
  return count + (count === 1 ? " enchantment" : " enchantments");
}

function listCandidates(container) {
  const entries = [];
  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (!item || isEnchanterBook(item)) continue;
    if (!item.getComponent(ENCHANTABLE)) continue;
    entries.push({
      index: i,
      typeId: item.typeId,
      signature: signatureOf(item),
      label:
        "§l" + titleCase(item.typeId) + "§r\nSlot " + (i + 1) + " | " + countText(levelsOf(item).size),
      icon: iconFor(item.typeId),
    });
  }
  return entries;
}

function consumeBook(container, bookSlot) {
  const book = container.getItem(bookSlot);
  if (!isEnchanterBook(book)) return;
  if (book.amount > 1) {
    book.amount -= 1;
    container.setItem(bookSlot, book);
  } else {
    container.setItem(bookSlot, undefined);
  }
}

async function mainMenu(player) {
  const form = new ActionFormData()
    .title(TITLE)
    .body("Set exact enchantment levels with sliders.\nEach applied change uses one Enchanter Book.")
    .button("§lEnchanter", "textures/items/book_enchanted")
    .button("§lAbout", "textures/items/name_tag")
    .button("§lExit", "textures/ui/cancel");
  const result = await form.show(player);
  return result.canceled ? 2 : result.selection;
}

async function aboutScreen(player) {
  const body = [
    "§l@ALNStudios§r",
    "Creator of Minecraft Bedrock add-ons.",
    "",
    "§lEnchanter§r v" + VERSION,
    "Choose an item, set a level for each enchantment, and confirm. Enchantments you set replace the old ones.",
    "",
    "§lCurseForge§r",
    "curseforge.com/members/allenscreations/projects",
    "§lMCPEDL§r",
    "mcpedl.com/user/alnstudios",
    "",
    "Unofficial community creation. Not approved by or associated with Mojang or Microsoft.",
  ].join("\n");
  const form = new ActionFormData()
    .title("§l§6About §eALNStudios")
    .body(body)
    .button("§lBack", "textures/ui/arrow_left");
  await form.show(player);
}

async function pickItem(player, entries) {
  const form = new ActionFormData().title(TITLE).body("Choose an item to enchant.");
  for (const entry of entries) form.button(entry.label, entry.icon);
  form.button("§lBack", "textures/ui/arrow_left");
  const result = await form.show(player);
  if (result.canceled) return -2;
  if (result.selection === entries.length) return -1;
  return result.selection;
}

async function configure(player, container, bookSlot, entry) {
  const chosen = container.getItem(entry.index);
  if (!chosen || chosen.typeId !== entry.typeId || signatureOf(chosen) !== entry.signature) {
    notify(player, "§cThat item changed. Nothing was applied.");
    return "done";
  }
  const name = titleCase(chosen.typeId);
  const types = fittingTypes(chosen);
  if (types.length === 0) {
    notify(player, "§cThis item accepts no enchantments.");
    return "back";
  }

  const presetForm = new ActionFormData()
    .title(TITLE)
    .body("Item: " + name + "\nChoose the starting levels.")
    .button("§lKeep current levels")
    .button("§lMaximum levels")
    .button("§lClear all")
    .button("§lBack", "textures/ui/arrow_left");
  const preset = await presetForm.show(player);
  if (preset.canceled) return "done";
  if (preset.selection === 3) return "back";

  const current = levelsOf(chosen);
  const currentText =
    current.size === 0
      ? "none"
      : [...current].map(([id, level]) => titleCase(id) + " " + level).join(", ");
  const modal = new ModalFormData().title(TITLE);
  tryCall(modal, "header", name);
  tryCall(modal, "label", "Slot " + (entry.index + 1) + "\nCurrent: " + currentText);
  tryCall(modal, "divider");
  for (const type of types) {
    const max = type.maxLevel;
    let start = 0;
    if (preset.selection === 0) start = current.get(type.id) ?? 0;
    if (preset.selection === 1) start = max;
    modal.slider(titleCase(type.id) + " (max " + max + ")", 0, max, {
      valueStep: 1,
      defaultValue: Math.min(start, max),
    });
    tryCall(modal, "divider");
  }
  tryCall(modal, "submitButton", "§lContinue");
  const result = await modal.show(player);
  if (result.canceled) return "done";
  const levels = result.formValues.filter((value) => typeof value === "number").map((value) => Math.round(value));
  if (levels.length !== types.length) {
    notify(player, "§cEnchanter could not read the sliders. Nothing was applied.");
    return "done";
  }

  const lines = [];
  types.forEach((type, i) => {
    const before = current.get(type.id) ?? 0;
    const after = levels[i];
    if (before === after) return;
    if (after === 0) lines.push("- " + titleCase(type.id) + " removed");
    else lines.push("+ " + titleCase(type.id) + " " + after);
  });
  if (lines.length === 0) {
    notify(player, "§eNo changes selected.");
    return "done";
  }

  const confirmForm = new ActionFormData()
    .title(TITLE)
    .body(name + "\n\n" + lines.join("\n") + "\n\nUses one Enchanter Book.")
    .button("§lApply", "textures/ui/check")
    .button("§lCancel", "textures/ui/cancel");
  const confirmed = await confirmForm.show(player);
  if (confirmed.canceled || confirmed.selection !== 0) return "done";

  const now = container.getItem(entry.index);
  if (!now || now.typeId !== entry.typeId || signatureOf(now) !== entry.signature) {
    notify(player, "§cThat item changed. Nothing was applied.");
    return "done";
  }
  if (!isEnchanterBook(container.getItem(bookSlot))) {
    notify(player, "§cThe book is no longer in its slot. Nothing was applied.");
    return "done";
  }

  const comp = now.getComponent(ENCHANTABLE);
  for (const type of types) {
    try {
      comp.removeEnchantment(type);
    } catch (error) {
      continue;
    }
  }
  const rejected = [];
  types.forEach((type, i) => {
    if (levels[i] <= 0) return;
    try {
      comp.addEnchantment({ type, level: levels[i] });
    } catch (error) {
      rejected.push(titleCase(type.id));
    }
  });

  if (signatureOf(now) === entry.signature) {
    notify(player, "§eThe game rejected every change. The book was not used.");
    return "done";
  }
  container.setItem(entry.index, now);
  consumeBook(container, bookSlot);
  notify(player, "§aEnchanted §f" + name + "§a.");
  if (rejected.length > 0) {
    system.runTimeout(() => {
      notify(player, "§eNot applied, they conflict: " + rejected.join(", "));
    }, 50);
  }
  return "done";
}

async function enchantFlow(player, container, bookSlot) {
  while (true) {
    const entries = listCandidates(container);
    if (entries.length === 0) {
      notify(player, "§cNo enchantable items in your inventory.");
      return false;
    }
    const picked = await pickItem(player, entries);
    if (picked === -2) return true;
    if (picked === -1) return false;
    const outcome = await configure(player, container, bookSlot, entries[picked]);
    if (outcome !== "back") return true;
  }
}

async function openMenu(player) {
  const bookSlot = player.selectedSlotIndex;
  const container = player.getComponent(INVENTORY).container;
  while (true) {
    const choice = await mainMenu(player);
    if (choice === 0) {
      const finished = await enchantFlow(player, container, bookSlot);
      if (finished) return;
    } else if (choice === 1) {
      await aboutScreen(player);
    } else {
      return;
    }
  }
}

world.afterEvents.itemUse.subscribe((event) => {
  const player = event.source;
  if (!isEnchanterBook(event.itemStack)) return;
  if (busy.has(player.id)) return;
  busy.add(player.id);
  openMenu(player)
    .catch(() => notify(player, "§cEnchanter closed unexpectedly."))
    .finally(() => busy.delete(player.id));
});
