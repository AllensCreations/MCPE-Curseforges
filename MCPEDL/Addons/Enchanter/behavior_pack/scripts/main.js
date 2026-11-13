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

// --- LOGGER HELPER ---
function logDebug(player, message) {
  const timestamp = new Date().toLocaleTimeString();
  const formattedMsg = `[Enchanter Log ${timestamp}] ${message}`;
  console.warn(formattedMsg); // Outputs to server console / content log
  if (player && player.isValid()) {
    player.sendMessage(`§7${formattedMsg}§r`); // Outputs to player chat for live debugging
  }
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

function fittingTypes(item, player) {
  const comp = item.getComponent(ENCHANTABLE);
  if (!comp) {
    logDebug(player, `Item ${item.typeId} lacks the 'enchantable' component.`);
    return [];
  }
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
  logDebug(player, `Found ${fits.length} fitting enchantment types for ${item.typeId}.`);
  return fits;
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
  logDebug(player, `Enchanter triggered by ${player.name}`);
  const bookSlot = player.selectedSlotIndex;
  const container = player.getComponent(INVENTORY).container;
  const entries = listCandidates(container);
  
  if (entries.length === 0) {
    logDebug(player, "Aborted: No enchantable items found in inventory.");
    player.sendMessage("§cEnchanter: no enchantable items in your inventory.");
    return;
  }

  const pickForm = new ActionFormData().title("Enchanter").body("Choose an item to enchant.");
  for (const entry of entries) pickForm.button(entry.label, entry.icon);
  const picked = await pickForm.show(player);
  if (picked.canceled) {
    logDebug(player, "User canceled item selection form.");
    return;
  }
  
  const entry = entries[picked.selection];
  logDebug(player, `Selected item slot ${entry.index + 1} (${entry.typeId})`);

  const chosen = container.getItem(entry.index);
  if (!chosen || chosen.typeId !== entry.typeId || signatureOf(chosen) !== entry.signature) {
    logDebug(player, "Error: Item changed or vanished before configuration.");
    player.sendMessage("§cEnchanter: that item changed, nothing was applied.");
    return;
  }

  const types = fittingTypes(chosen, player);
  if (types.length === 0) {
    logDebug(player, `Error: No valid enchantment types found for ${chosen.typeId}`);
    player.sendMessage("§cEnchanter: this item accepts no enchantments.");
    return;
  }

  const presetForm = new ActionFormData()
    .title("Enchanter")
    .body("Starting levels for " + titleCase(chosen.typeId) + ".");
  for (const preset of PRESETS) presetForm.button(preset);
  const preset = await presetForm.show(player);
  if (preset.canceled) {
    logDebug(player, "User canceled preset form.");
    return;
  }

  logDebug(player, `Chosen preset index: ${preset.selection}`);

  const current = levelsOf(chosen);
  const modal = new ModalFormData().title("Enchanter: " + titleCase(chosen.typeId));
  
  for (const type of types) {
    const max = 255;
    let start = 0;
    if (preset.selection === 0) start = current.get(type.id) ?? 0;
    if (preset.selection === 1) start = 255;
    modal.slider(titleCase(type.id) + " (max 255)", 0, 255, {
      valueStep: 1,
      defaultValue: Math.min(start, 255),
    });
  }
  
  const result = await modal.show(player);
  if (result.canceled) {
    logDebug(player, "User canceled slider modal form.");
    return;
  }
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
    logDebug(player, "No configuration changes selected by user.");
    player.sendMessage("§eEnchanter: no changes selected.");
    return;
  }

  const confirmForm = new ActionFormData()
    .title("Confirm")
    .body(lines.join("\n§r") + "\n\n§rUses one Enchanter book.")
    .button("Apply")
    .button("Cancel");
  const confirmed = await confirmForm.show(player);
  if (confirmed.canceled || confirmed.selection !== 0) {
    logDebug(player, "User canceled confirmation form.");
    return;
  }

  const now = container.getItem(entry.index);
  if (!now || now.typeId !== entry.typeId || signatureOf(now) !== entry.signature) {
    logDebug(player, "Error: Item changed during confirmation step.");
    player.sendMessage("§cEnchanter: that item changed, nothing was applied.");
    return;
  }
  if (!isEnchanterBook(container.getItem(bookSlot))) {
    logDebug(player, "Error: Enchanter book was removed from slot.");
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
      logDebug(null, `Successfully applied ${type.id} at level ${levels[i]}`);
    } catch (error) {
      logDebug(null, `ENGINE REJECTION: Failed to apply ${type.id} at level ${levels[i]} -> ${error.message}`);
      rejected.push(titleCase(type.id));
    }
  });

  container.setItem(entry.index, now);
  consumeBook(container, bookSlot);
  logDebug(player, `Successfully updated ${now.typeId} with level 255 capabilities.`);
  player.sendMessage("§aEnchanter: updated " + titleCase(now.typeId) + " with level 255 capabilities.");
  
  if (rejected.length > 0) {
    logDebug(player, `Total rejected enchantments: ${rejected.length}`);
    player.sendMessage("§eSome enchantments were rejected: " + rejected.join(", "));
  }
}

world.afterEvents.itemUse.subscribe((event) => {
  const player = event.source;
  if (!isEnchanterBook(event.itemStack)) return;
  if (busy.has(player.id)) {
    logDebug(player, "Ignored duplicate trigger: player is already busy.");
    return;
  }
  busy.add(player.id);
  openEnchanter(player)
    .catch((err) => {
      logDebug(player, `CRITICAL ERROR in openEnchanter: ${err.message}`);
      try {
        player.sendMessage("§cEnchanter closed unexpectedly.");
      } catch (error) {
        return;
      }
    })
    .finally(() => busy.delete(player.id));
});
