import { world, EnchantmentTypes } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

const BOOK_ID = "minecraft:book";
const BOOK_NAME = "Enchanter";
const ENCHANTABLE = "minecraft:enchantable";
const INVENTORY = "minecraft:inventory";
const PRESETS = ["Keep current levels", "Maximum (255)", "Clear all"];
const ICON_OVERRIDES = {
  "minecraft:bow": "textures/items/bow_standby",
  "minecraft:crossbow": "textures/items/crossbow_standby",
  "minecraft:fishing_rod": "textures/items/fishing_rod_uncast",
  "minecraft:enchanted_book": "textures/items/book_enchanted",
};
const busy = new Set();

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

// Modified to allow all enchantment types, bypassing strict vanilla compatibility filters
function fittingTypes(item) {
  const comp = item.getComponent(ENCHANTABLE);
  if (!comp) return [];
  // Returns all game enchantments so you can mix and match freely
  return EnchantmentTypes.getAll();
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
      label: titleCase(item.typeId) + "\nSlot " + (i + 1),
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

async function openEnchanter(player) {
  const bookSlot = player.selectedSlotIndex;
  const container = player.getComponent(INVENTORY).container;
  const entries = listCandidates(container);
  if (entries.length === 0) {
    player.sendMessage("§cEnchanter: no enchantable items in your inventory.");
    return;
  }

  const pickForm = new ActionFormData().title("Enchanter").body("Choose an item to enchant.");
  for (const entry of entries) pickForm.button(entry.label, entry.icon);
  const picked = await pickForm.show(player);
  if (picked.canceled) return;
  const entry = entries[picked.selection];

  const chosen = container.getItem(entry.index);
  if (!chosen || chosen.typeId !== entry.typeId || signatureOf(chosen) !== entry.signature) {
    player.sendMessage("§cEnchanter: that item changed, nothing was applied.");
    return;
  }

  const types = fittingTypes(chosen);
  if (types.length === 0) {
    player.sendMessage("§cEnchanter: this item accepts no enchantments.");
    return;
  }

  const presetForm = new ActionFormData()
    .title("Enchanter")
    .body("Starting levels for " + titleCase(chosen.typeId) + ".");
  for (const preset of PRESETS) presetForm.button(preset);
  const preset = await presetForm.show(player);
  if (preset.canceled) return;

  const current = levelsOf(chosen);
  const modal = new ModalFormData().title("Enchanter: " + titleCase(chosen.typeId));
  
  for (const type of types) {
    const max = 255; // Set absolute maximum limit to 255 for all enchantments
    let start = 0;
    if (preset.selection === 0) start = current.get(type.id) ?? 0;
    if (preset.selection === 1) start = 255; // Default to 255 if "Maximum" preset is chosen
    modal.slider(titleCase(type.id) + " (max 255)", 0, 255, {
      valueStep: 1,
      defaultValue: Math.min(start, 255),
    });
  }
  
  const result = await modal.show(player);
  if (result.canceled) return;
  const levels = result.formValues.map((value) => Math.round(value));

  const lines = [];
  types.forEach((type, i) => {
    const before = current.get(type.id) ?? 0;
    const after = levels[i];
    if (before === after) return;
    if (after === 0) lines.push("§c- " + titleCase(type.id) + " removed");
    else lines.push("§a+ " + titleCase(type.id) + " " + after);
  });
  if (lines.length === 0) {
    player.sendMessage("§eEnchanter: no changes selected.");
    return;
  }

  const confirmForm = new ActionFormData()
    .title("Confirm")
    .body(lines.join("\n§r") + "\n\n§rUses one Enchanter book.")
    .button("Apply")
    .button("Cancel");
  const confirmed = await confirmForm.show(player);
  if (confirmed.canceled || confirmed.selection !== 0) return;

  const now = container.getItem(entry.index);
  if (!now || now.typeId !== entry.typeId || signatureOf(now) !== entry.signature) {
    player.sendMessage("§cEnchanter: that item changed, nothing was applied.");
    return;
  }
  if (!isEnchanterBook(container.getItem(bookSlot))) {
    player.sendMessage("§cEnchanter: the book is no longer in its slot, nothing was applied.");
    return;
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

  container.setItem(entry.index, now);
  consumeBook(container, bookSlot);
  player.sendMessage("§aEnchanter: updated " + titleCase(now.typeId) + " with level 255 capabilities.");
  if (rejected.length > 0) {
    player.sendMessage("§eSome enchantments were rejected by the game engine: " + rejected.join(", "));
  }
}

world.afterEvents.itemUse.subscribe((event) => {
  const player = event.source;
  if (!isEnchanterBook(event.itemStack)) return;
  if (busy.has(player.id)) return;
  busy.add(player.id);
  openEnchanter(player)
    .catch(() => {
      try {
        player.sendMessage("§cEnchanter closed unexpectedly.");
      } catch (error) {
        return;
      }
    })
    .finally(() => busy.delete(player.id));
});
