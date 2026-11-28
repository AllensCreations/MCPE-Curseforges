import { world, system, BlockInventoryComponent } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";
import { ITEM_ID, CONTAINER_TYPES, findEntry, saveEntry, deleteEntry, newId, refreshKnown, markSuppressed, showForm, flushEntry, releasePending, lockPlayer, unlockPlayer, callOptional, plainName, } from "./chest_sync.js";
const DEFAULT_NAME = "Storage Chest";
const NEIGHBORS = [
    { x: 1, y: 0, z: 0 },
    { x: -1, y: 0, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 0, y: 0, z: -1 },
];
function inventorySize(block) {
    const component = block.getComponent(BlockInventoryComponent.componentId);
    return component && component.container ? component.container.size : 0;
}
function facingOf(block) {
    try {
        const value = block.permutation.getState("minecraft:cardinal_direction");
        return typeof value === "string" ? value : undefined;
    }
    catch {
        return undefined;
    }
}
function facingAligned(a, b) {
    const facing = facingOf(a);
    if (!facing || facing !== facingOf(b))
        return false;
    const alongX = b.x !== a.x;
    const northSouth = facing === "north" || facing === "south";
    return alongX === northSouth;
}
function findPartner(block) {
    if (block.typeId === "minecraft:barrel")
        return undefined;
    if (inventorySize(block) <= 27)
        return undefined;
    const candidates = [];
    for (const offset of NEIGHBORS) {
        const neighbor = block.offset(offset);
        if (neighbor && neighbor.typeId === block.typeId && inventorySize(neighbor) > 27) {
            candidates.push(neighbor);
        }
    }
    if (candidates.length === 0)
        return undefined;
    const chosen = candidates.length === 1 ? candidates : candidates.filter((n) => facingAligned(block, n));
    if (chosen.length !== 1)
        return undefined;
    return { x: chosen[0].x, y: chosen[0].y, z: chosen[0].z };
}
function tell(player, text) {
    player.onScreenDisplay.setActionBar(text);
}
async function openRegisterForm(player, dimensionId, clicked) {
    const dimension = world.getDimension(dimensionId);
    const block = dimension.getBlock(clicked);
    if (!block)
        return;
    const existing = findEntry(dimensionId, clicked);
    if (existing && existing.owner !== player.id) {
        tell(player, "§c[ChestLog] §fThis chest is registered by another player.");
        return;
    }
    let location = { x: clicked.x, y: clicked.y, z: clicked.z };
    let partner = findPartner(block);
    if (partner && (partner.x < location.x || (partner.x === location.x && partner.z < location.z))) {
        const swap = location;
        location = partner;
        partner = swap;
    }
    const form = new ModalFormData().title(existing ? "§lEdit Chest" : "§lRegister Chest");
    callOptional(form, "header", existing ? plainName(existing) : "New chest");
    form.textField("§lChest Name§r", "e.g., Ores, Building Blocks, Mob Drops", {
        defaultValue: existing ? existing.name : DEFAULT_NAME,
    });
    callOptional(form, "divider");
    form.toggle("§lAuto-sort this chest§r", { defaultValue: existing ? existing.autoSort !== false : true });
    callOptional(form, "divider");
    if (existing) {
        form.toggle("§lUnregister this chest§r");
        callOptional(form, "divider");
    }
    form.submitButton(existing ? "Save" : "Register");
    const response = await showForm(form, player);
    if (!response || response.canceled || !response.formValues)
        return;
    const values = response.formValues;
    const texts = values.filter((v) => typeof v === "string");
    const flags = values.filter((v) => typeof v === "boolean");
    const current = findEntry(dimensionId, clicked);
    if (current && current.owner !== player.id)
        return;
    if (current && flags[1] === true) {
        flushEntry(current);
        if (!releasePending(current)) {
            saveEntry(current);
            tell(player, "§c[ChestLog] §fCould not release the waiting items. The chest stays registered.");
            return;
        }
        deleteEntry(current);
        tell(player, `§e[ChestLog] §f${current.name} was unregistered.`);
        return;
    }
    const typed = String(texts[0] ?? "");
    const name = typed.replace(/§./g, "").trim().slice(0, 32) || DEFAULT_NAME;
    const entry = current ?? {
        id: newId(),
        owner: player.id,
        created: Date.now(),
        name,
        dimensionId,
        location,
        pendingQueue: [],
        known: [],
    };
    if (!current && partner)
        entry.partner = partner;
    entry.name = name;
    entry.autoSort = flags[0] !== false;
    refreshKnown(entry);
    if (!saveEntry(entry)) {
        tell(player, "§c[ChestLog] §fCould not save the chest.");
        return;
    }
    try {
        player.playSound("random.orb");
    }
    catch { }
    try {
        dimension.spawnParticle("minecraft:totem_particle", {
            x: entry.location.x + 0.5,
            y: entry.location.y + 1.2,
            z: entry.location.z + 0.5,
        });
    }
    catch { }
    tell(player, `§a[ChestLog] §fRegistered §e${name}§f.`);
}
export function initRegister() {
    world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
        const { player, block, itemStack, isFirstEvent } = event;
        if (!itemStack || itemStack.typeId !== ITEM_ID)
            return;
        if (!CONTAINER_TYPES.has(block.typeId))
            return;
        markSuppressed(player);
        if (!player.isSneaking)
            return;
        event.cancel = true;
        if (!isFirstEvent)
            return;
        const dimensionId = block.dimension.id;
        const clicked = { x: block.x, y: block.y, z: block.z };
        system.run(() => {
            if (!lockPlayer(player))
                return;
            openRegisterForm(player, dimensionId, clicked)
                .catch(() => { })
                .finally(() => unlockPlayer(player));
        });
    });
}
