import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
import { ITEM_ID, PACK_NAME, PACK_VERSION, chestsOf, getEntry, plainName, itemDisplayName, getInventory, runDeposit, depositAll, isSuppressed, showForm, lockPlayer, unlockPlayer, callOptional, } from "./chest_sync.js";
const ICON = "textures/items/aln_chest_log";
const ABOUT_ICON = "textures/items/name_tag";
const MAIN_TITLE = `§l§6@ALNStudios §e${PACK_NAME}§r (v${PACK_VERSION})`;
const LORE = ["§eSneak + Use on a Chest to register", "§eUse in air to open Remote Deposit"];
async function showChestList(player) {
    while (true) {
        const list = chestsOf(player);
        const form = new ActionFormData()
            .title("§lChests")
            .body(list.length === 0
            ? "§lNo chests registered yet.§r Sneak + Use the ChestLog on a Chest, Trapped Chest or Barrel."
            : "§lPick a chest to deposit into, or sort everything at once.§r")
            .button("§lDeposit All (Sort)§r", ICON);
        for (const entry of list)
            form.button(`§l${plainName(entry)}§r`, ICON);
        form.button("§lBack§r");
        const response = await showForm(form, player);
        if (!response || response.canceled || response.selection === undefined)
            return false;
        const selection = response.selection;
        if (selection === list.length + 1)
            return true;
        if (selection === 0) {
            depositAll(player);
            continue;
        }
        const entry = list[selection - 1];
        if (entry && !(await showDepositForm(player, entry.id)))
            return false;
    }
}
async function showDepositForm(player, entryId) {
    const entry = getEntry(entryId);
    if (!entry || entry.owner !== player.id)
        return true;
    const inventory = getInventory(player);
    if (!inventory)
        return true;
    const rows = [];
    for (let slot = 0; slot < 36; slot++) {
        const item = inventory.getItem(slot);
        if (!item || item.typeId === ITEM_ID)
            continue;
        rows.push({ slot, typeId: item.typeId, amount: item.amount, label: itemDisplayName(item) });
    }
    if (rows.length === 0) {
        player.onScreenDisplay.setActionBar("§e[ChestLog] §fYou have nothing to deposit.");
        return true;
    }
    const form = new ModalFormData().title(`§l${plainName(entry)}§r`);
    for (const row of rows) {
        callOptional(form, "header", row.label);
        form.slider(`§lAmount§r (Held: ${row.amount})`, 0, row.amount, {
            valueStep: 1,
            defaultValue: 0,
        });
        callOptional(form, "divider");
    }
    form.submitButton("Deposit");
    const response = await showForm(form, player);
    if (!response || response.canceled || !response.formValues)
        return false;
    const amounts = response.formValues.filter((v) => typeof v === "number");
    if (amounts.length < rows.length)
        return true;
    const target = getEntry(entryId);
    if (!target)
        return true;
    const plan = [];
    rows.forEach((row, i) => {
        const amount = Number(amounts[i]);
        if (amount > 0)
            plan.push({ slot: row.slot, typeId: row.typeId, amount, targets: [target] });
    });
    if (plan.length === 0)
        return true;
    const result = runDeposit(player, plan);
    if (result.failed) {
        player.onScreenDisplay.setActionBar("§c[ChestLog] §fCould not buffer items for an unloaded chest.");
        return true;
    }
    player.onScreenDisplay.setActionBar(`§a[ChestLog] §fDeposited §e${result.total} §fitems into ${target.name}§f!`);
    return true;
}
async function showAbout(player) {
    const response = await showForm(new ActionFormData()
        .title("About ALNStudios")
        .body([
        "§lCreator:§r ALNStudios",
        `§lPack:§r ${PACK_NAME} (v${PACK_VERSION})`,
        "Wireless chest deposit with an unloaded-chunk buffer.",
        "§lCurseForge:§r curseforge.com/members/allenscreations/projects",
        "§lMCPEDL:§r mcpedl.com/user/alnstudios/",
        "This is an unofficial community creation. It is not affiliated with Mojang or Microsoft.",
    ].join("\n\n"))
        .button("§lBack§r", ABOUT_ICON), player);
    return !!response && !response.canceled;
}
async function openMenu(player) {
    if (!lockPlayer(player))
        return;
    try {
        while (true) {
            const list = chestsOf(player);
            const response = await showForm(new ActionFormData()
                .title(MAIN_TITLE)
                .body(`§lRegistered Chests:§r ${list.length}`)
                .button("§lChests§r", ICON)
                .button("§lAbout§r", ABOUT_ICON)
                .button("§lExit§r"), player);
            if (!response || response.canceled)
                return;
            if (response.selection === 0) {
                if (!(await showChestList(player)))
                    return;
            }
            else if (response.selection === 1) {
                if (!(await showAbout(player)))
                    return;
            }
            else {
                return;
            }
        }
    }
    finally {
        unlockPlayer(player);
    }
}
function applyLore() {
    for (const player of world.getAllPlayers()) {
        try {
            const inventory = getInventory(player);
            if (!inventory)
                continue;
            for (let slot = 0; slot < 36; slot++) {
                const item = inventory.getItem(slot);
                if (!item || item.typeId !== ITEM_ID || item.getLore().length > 0)
                    continue;
                item.setLore(LORE);
                inventory.setItem(slot, item);
            }
        }
        catch { }
    }
}
export function initUI() {
    world.afterEvents.itemUse.subscribe((event) => {
        const player = event.source;
        if (!event.itemStack || event.itemStack.typeId !== ITEM_ID)
            return;
        if (isSuppressed(player))
            return;
        system.runTimeout(() => {
            if (isSuppressed(player))
                return;
            openMenu(player).catch(() => { });
        }, 2);
    });
    system.runInterval(applyLore, 40);
}
