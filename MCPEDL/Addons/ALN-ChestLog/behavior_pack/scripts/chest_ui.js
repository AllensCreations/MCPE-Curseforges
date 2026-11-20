import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import {
  ITEM_ID,
  chestsOf,
  getEntry,
  coloredName,
  itemDisplayName,
  getInventory,
  runDeposit,
  depositAll,
  isSuppressed,
  showForm,
} from "./chest_sync.js";

const ICON_CHEST = "textures/items/chest_minecart";
const ICON_ABOUT = "textures/items/book_normal";
const ICON_EXIT = "textures/ui/cancel";
const LORE = ["§7Sneak + Use on a Chest to register", "§7Use in air to open Remote Deposit"];

async function showMain(player) {
  const list = chestsOf(player);
  const response = await showForm(
    new ActionFormData()
      .title("§6§lALN:ChestLog")
      .body(`§7Registered Chests: §e${list.length}\n§a■ Overworld  §c■ Nether  §d■ The End`)
      .button("§eChest", ICON_CHEST)
      .button("§bAbout", ICON_ABOUT)
      .button("§cExit", ICON_EXIT),
    player
  );
  if (!response || response.canceled) return;
  if (response.selection === 0) await showChestList(player);
  else if (response.selection === 1) await showAbout(player);
}

async function showChestList(player) {
  const list = chestsOf(player);
  const form = new ActionFormData()
    .title("§6§lChests")
    .body(
      list.length === 0
        ? "§7No chests registered yet. Sneak + Use the ChestLog on a Chest, Trapped Chest or Barrel."
        : "§7Pick a chest to deposit into, or sort everything at once."
    )
    .button("§a§lDeposit All (Sort)");
  for (const entry of list) form.button(coloredName(entry));
  form.button("§7Back");
  const response = await showForm(form, player);
  if (!response || response.canceled) return;
  const selection = response.selection;
  if (selection === 0) {
    depositAll(player);
    return;
  }
  if (selection === list.length + 1) {
    await showMain(player);
    return;
  }
  const entry = list[selection - 1];
  if (entry) await showDepositForm(player, entry.id);
}

async function showDepositForm(player, entryId) {
  const entry = getEntry(entryId);
  if (!entry || entry.owner !== player.id) return;
  const inventory = getInventory(player);
  if (!inventory) return;

  const rows = [];
  for (let slot = 0; slot < 36; slot++) {
    const item = inventory.getItem(slot);
    if (!item || item.typeId === ITEM_ID) continue;
    rows.push({ slot, typeId: item.typeId, amount: item.amount, label: itemDisplayName(item) });
  }
  if (rows.length === 0) {
    player.onScreenDisplay.setActionBar("§e[ChestLog] §fYou have nothing to deposit.");
    return;
  }

  const form = new ModalFormData().title(coloredName(entry));
  for (const row of rows) {
    form.slider(`§f${row.label} §7(Held: ${row.amount})`, 0, row.amount, {
      valueStep: 1,
      defaultValue: 0,
    });
  }
  form.dropdown("Action", ["Deposit Selected Items", "Exit Without Depositing"]);
  form.submitButton("Confirm");

  const response = await showForm(form, player);
  if (!response || response.canceled || !response.formValues) return;
  const values = response.formValues;
  if (values[rows.length] !== 0) return;

  const plan = [];
  rows.forEach((row, i) => {
    const amount = Number(values[i]);
    if (amount > 0) plan.push({ slot: row.slot, typeId: row.typeId, amount, targets: [] });
  });
  if (plan.length === 0) return;

  const target = getEntry(entryId);
  if (!target) return;
  for (const step of plan) step.targets = [target];

  const result = runDeposit(player, plan);
  if (result.failed) {
    player.onScreenDisplay.setActionBar("§c[ChestLog] §fCould not buffer items for an unloaded chest.");
    return;
  }
  player.onScreenDisplay.setActionBar(
    `§a[ChestLog] §fDeposited §e${result.total} §fitems into ${coloredName(target)}§f!`
  );
}

async function showAbout(player) {
  const response = await showForm(
    new ActionFormData()
    .title("§6§lAbout ChestLog")
    .body(
      [
        "§eRegister§f: Sneak + Use the ChestLog on a Chest, Trapped Chest or Barrel and name it. A sign above it reads \"<Name> - Registered\".",
        "§eColors§f: §aOverworld §cNether §dThe End §fchests are colored by dimension. No coordinates are ever shown.",
        "§eUnloaded chunks§f: items for a chest in an unloaded chunk are held safely and moved in as soon as it loads.",
        "§eDeposit All (Sort)§f: sends matching items to your registered chests and sorts them.",
        "§eUnregister§f: Sneak + Use the ChestLog on a registered chest and switch on Unregister. Waiting items are delivered or dropped.",
        "§7by ALNStudios",
      ].join("\n\n")
    )
    .button("§7Back"),
    player
  );
  if (response && !response.canceled) await showMain(player);
}

function applyLore() {
  for (const player of world.getAllPlayers()) {
    try {
      const inventory = getInventory(player);
      if (!inventory) continue;
      for (let slot = 0; slot < 36; slot++) {
        const item = inventory.getItem(slot);
        if (!item || item.typeId !== ITEM_ID || item.getLore().length > 0) continue;
        item.setLore(LORE);
        inventory.setItem(slot, item);
      }
    } catch {}
  }
}

export function initUI() {
  world.afterEvents.itemUse.subscribe((event) => {
    const player = event.source;
    if (!event.itemStack || event.itemStack.typeId !== ITEM_ID) return;
    if (isSuppressed(player)) return;
    system.runTimeout(() => {
      if (isSuppressed(player)) return;
      showMain(player).catch(() => {});
    }, 2);
  });
  system.runInterval(applyLore, 40);
}
