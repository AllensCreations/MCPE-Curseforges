import { world, system, BlockPermutation, ItemStack } from "@minecraft/server";
import { ActionFormData, ModalFormData, FormCancelationReason } from "@minecraft/server-ui";

const BASE = "aln:portal_door";
const TOP = "aln:portal_door_top";
const AIR = "minecraft:air";
const INDEX_KEY = "aln_pd_index";
const DOOR_PREFIX = "aln_pd_door_";
const MAX_NAME = 24;
const COOLDOWN_TICKS = 40;
const NAUSEA_TICKS = 50;
const RANGE = 24;
const STAGES = 6;
const PULSE_TICKS = 4;
const VERIFY_TICKS = 200;
const GLYPH = "minecraft:enchanting_table_particle";
const SPARK = "minecraft:basic_portal_particle";
const SOUND_DEPART = "mob.endermen.portal";
const SOUND_ARRIVE = "note.chime";
const FACING = {
    north: { x: 0, z: -1 },
    south: { x: 0, z: 1 },
    east: { x: 1, z: 0 },
    west: { x: -1, z: 0 }
};
const DIM_COLOR = { overworld: "§a", nether: "§c", the_end: "§d" };

let registry = null;
let clock = 0;
const cooldowns = new Map();

function keyOf(dim, x, y, z) {
    return `${dim}_${x}_${y}_${z}`.replace(/-/g, "n");
}

function dimName(dimension) {
    return dimension.id.replace("minecraft:", "");
}

function loadRegistry() {
    if (registry) return registry;
    registry = new Map();
    let keys = [];
    try {
        const raw = world.getDynamicProperty(INDEX_KEY);
        keys = typeof raw === "string" ? JSON.parse(raw) : [];
    } catch (error) {
        keys = [];
    }
    for (const key of keys) {
        try {
            const raw = world.getDynamicProperty(DOOR_PREFIX + key);
            if (typeof raw === "string") registry.set(key, JSON.parse(raw));
        } catch (error) {
            continue;
        }
    }
    return registry;
}

function saveIndex() {
    world.setDynamicProperty(INDEX_KEY, JSON.stringify([...loadRegistry().keys()]));
}

function saveDoor(door) {
    loadRegistry().set(door.key, door);
    world.setDynamicProperty(DOOR_PREFIX + door.key, JSON.stringify(door));
    saveIndex();
}

function deleteDoor(door) {
    loadRegistry().delete(door.key);
    world.setDynamicProperty(DOOR_PREFIX + door.key, undefined);
    saveIndex();
}

function cleanName(text) {
    if (typeof text !== "string") return "";
    return text.replace(/§./g, "").replace(/[\r\n\t]/g, " ").trim().slice(0, MAX_NAME);
}

function colorOf(dim) {
    return DIM_COLOR[dim] ?? "§a";
}

function spotOf(block) {
    const isTop = block.typeId === TOP;
    const location = block.location;
    return {
        dim: dimName(block.dimension),
        x: location.x,
        y: isTop ? location.y - 1 : location.y,
        z: location.z
    };
}

function doorAt(spot) {
    return loadRegistry().get(keyOf(spot.dim, spot.x, spot.y, spot.z));
}

function isDoorBlock(block) {
    return block.typeId === BASE || block.typeId === TOP;
}

function giveDoor(player) {
    const inventory = player.getComponent("minecraft:inventory");
    if (!inventory || !inventory.container) return false;
    const leftover = inventory.container.addItem(new ItemStack(BASE, 1));
    return !leftover;
}

function burst(dimension, center, count) {
    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const radius = 0.3 + Math.random() * 1.1;
        const point = {
            x: center.x + Math.cos(angle) * radius,
            y: center.y + (Math.random() - 0.3) * 1.6,
            z: center.z + Math.sin(angle) * radius
        };
        try {
            dimension.spawnParticle(GLYPH, point);
            if (i % 2 === 0) dimension.spawnParticle(SPARK, point);
        } catch (error) {
            continue;
        }
    }
}

function showNameForm(player, key, title, attempt) {
    const door = loadRegistry().get(key);
    if (!door) return;
    const form = new ModalFormData()
        .title(title)
        .textField("Door name (current: " + door.name + ")", "Home Base");
    form.show(player).then(response => {
        if (response.canceled) {
            if (response.cancelationReason === FormCancelationReason.UserBusy && attempt < 20) {
                system.runTimeout(() => showNameForm(player, key, title, attempt + 1), 10);
            }
            return;
        }
        const value = cleanName(response.formValues[0]);
        const current = loadRegistry().get(key);
        if (!current || !value) return;
        current.name = value;
        saveDoor(current);
        player.sendMessage("§dPortal Door named §r" + value);
    }).catch(() => {});
}

function removeDoor(player, door) {
    if (!giveDoor(player)) {
        player.sendMessage("§cYour inventory is full. Free a slot to pick up this Portal Door.");
        return;
    }
    const dimension = world.getDimension(door.dim);
    const air = BlockPermutation.resolve(AIR);
    const bottom = dimension.getBlock({ x: door.x, y: door.y, z: door.z });
    const upper = dimension.getBlock({ x: door.x, y: door.y + 1, z: door.z });
    if (bottom) bottom.setPermutation(air);
    if (upper) upper.setPermutation(air);
    deleteDoor(door);
    burst(dimension, { x: door.x + 0.5, y: door.y + 1, z: door.z + 0.5 }, 24);
    dimension.playSound(SOUND_DEPART, { x: door.x + 0.5, y: door.y + 1, z: door.z + 0.5 });
    player.sendMessage("§dPortal Door removed from the network and returned to your inventory.");
}

function openManage(player, door) {
    const owner = door.owner === player.id;
    const form = new ActionFormData().title("Manage Door");
    if (owner) {
        form.body("Door: " + colorOf(door.dim) + door.name)
            .button("Rename Door")
            .button("Pick Up Door")
            .button("Back");
    } else {
        form.body("Only the owner of " + colorOf(door.dim) + door.name + "§r can manage this door.")
            .button("Back");
    }
    form.show(player).then(response => {
        if (response.canceled) return;
        if (!owner) {
            openMenu(player, door);
            return;
        }
        if (response.selection === 0) showNameForm(player, door.key, "Rename Portal Door", 0);
        else if (response.selection === 1) removeDoor(player, door);
        else openMenu(player, door);
    }).catch(() => {});
}

function travel(player, from, to) {
    const ready = cooldowns.get(player.id) ?? 0;
    if (clock < ready) return;
    if (!loadRegistry().has(to.key)) {
        player.sendMessage("§cThat Portal Door no longer exists.");
        return;
    }
    cooldowns.set(player.id, clock + COOLDOWN_TICKS);
    const fromDimension = player.dimension;
    const origin = player.location;
    burst(fromDimension, { x: origin.x, y: origin.y + 1, z: origin.z }, 30);
    fromDimension.playSound(SOUND_DEPART, origin);
    const toDimension = world.getDimension(to.dim);
    const face = FACING[to.facing] ?? FACING.south;
    const arrival = { x: to.ex, y: to.ey, z: to.ez };
    player.teleport(arrival, {
        dimension: toDimension,
        facingLocation: { x: to.ex + face.x * 4, y: to.ey + 1.6, z: to.ez + face.z * 4 },
        checkForBlocks: true
    });
    system.runTimeout(() => {
        try {
            player.addEffect("nausea", NAUSEA_TICKS, { amplifier: 0, showParticles: false });
            const landed = player.location;
            burst(player.dimension, { x: landed.x, y: landed.y + 1, z: landed.z }, 20);
            player.dimension.playSound(SOUND_ARRIVE, landed);
        } catch (error) {
            return;
        }
    }, 5);
}

function openMenu(player, here) {
    const ready = cooldowns.get(player.id) ?? 0;
    if (clock < ready) return;
    const list = [...loadRegistry().values()]
        .filter(door => door.key !== here.key)
        .sort((a, b) => a.name.localeCompare(b.name));
    const form = new ActionFormData()
        .title("Portal Doors")
        .body(list.length > 0
            ? "You are at " + colorOf(here.dim) + here.name + "§r. Choose a destination."
            : "You are at " + colorOf(here.dim) + here.name + "§r. No other Portal Doors exist yet.");
    for (const door of list) form.button(colorOf(door.dim) + door.name);
    form.button("[ Manage Door ]");
    form.show(player).then(response => {
        if (response.canceled) return;
        if (response.selection === list.length) openManage(player, here);
        else travel(player, here, list[response.selection]);
    }).catch(() => {});
}

world.afterEvents.playerPlaceBlock.subscribe(event => {
    const block = event.block;
    const player = event.player;
    if (block.typeId !== BASE) return;
    const dimension = block.dimension;
    const location = block.location;
    const upper = dimension.getBlock({ x: location.x, y: location.y + 1, z: location.z });
    if (!upper || upper.typeId !== AIR) {
        block.setPermutation(BlockPermutation.resolve(AIR));
        giveDoor(player);
        player.sendMessage("§cA Portal Door needs two free blocks of height.");
        return;
    }
    upper.setPermutation(BlockPermutation.resolve(TOP));
    const state = block.permutation.getState("minecraft:cardinal_direction");
    const facing = FACING[state] ? state : "south";
    const face = FACING[facing];
    const dim = dimName(dimension);
    const door = {
        key: keyOf(dim, location.x, location.y, location.z),
        name: "Portal Door " + (loadRegistry().size + 1),
        owner: player.id,
        dim: dim,
        x: location.x,
        y: location.y,
        z: location.z,
        facing: facing,
        ex: location.x + 0.5 + face.x,
        ey: location.y,
        ez: location.z + 0.5 + face.z
    };
    saveDoor(door);
    dimension.playSound(SOUND_ARRIVE, { x: location.x + 0.5, y: location.y + 1, z: location.z + 0.5 });
    system.runTimeout(() => showNameForm(player, door.key, "Name This Portal Door", 0), 5);
});

world.beforeEvents.playerInteractWithBlock.subscribe(event => {
    const block = event.block;
    if (!isDoorBlock(block)) return;
    if (event.itemStack && event.itemStack.typeId === BASE) return;
    event.cancel = true;
    if (!event.isFirstEvent) return;
    const player = event.player;
    const spot = spotOf(block);
    system.runTimeout(() => {
        const door = doorAt(spot);
        if (!door) {
            player.sendMessage("§cThis Portal Door is not registered.");
            return;
        }
        openMenu(player, door);
    }, 1);
});

world.beforeEvents.playerBreakBlock.subscribe(event => {
    const block = event.block;
    if (!isDoorBlock(block)) return;
    event.cancel = true;
    const player = event.player;
    const spot = spotOf(block);
    system.runTimeout(() => {
        const door = doorAt(spot);
        if (!door) return;
        if (door.owner !== player.id) {
            player.sendMessage("§cOnly the owner can remove this Portal Door.");
            return;
        }
        removeDoor(player, door);
    }, 1);
});

function pulse(dimension, door, stage, cycle) {
    const center = { x: door.x + 0.5, y: door.y + 1, z: door.z + 0.5 };
    const radius = 2 - stage * (1.8 / (STAGES - 1));
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + cycle * 0.7;
        const lift = Math.sin(i * 1.7 + cycle) * 0.9;
        const point = {
            x: center.x + Math.cos(angle) * radius,
            y: center.y + lift * (radius / 2),
            z: center.z + Math.sin(angle) * radius
        };
        try {
            dimension.spawnParticle(GLYPH, point);
            if ((i + stage) % 3 === 0) dimension.spawnParticle(SPARK, point);
        } catch (error) {
            continue;
        }
    }
}

function verifyDoors() {
    for (const door of [...loadRegistry().values()]) {
        try {
            const dimension = world.getDimension(door.dim);
            const bottom = dimension.getBlock({ x: door.x, y: door.y, z: door.z });
            if (!bottom || bottom.typeId === BASE) continue;
            deleteDoor(door);
        } catch (error) {
            continue;
        }
    }
}

system.runInterval(() => {
    clock++;
    if (clock % VERIFY_TICKS === 0) verifyDoors();
    if (clock % PULSE_TICKS !== 0) return;
    const step = clock / PULSE_TICKS;
    const stage = step % STAGES;
    const cycle = Math.floor(step / STAGES);
    const done = new Set();
    for (const player of world.getPlayers()) {
        const dim = dimName(player.dimension);
        const at = player.location;
        for (const door of loadRegistry().values()) {
            if (door.dim !== dim || done.has(door.key)) continue;
            const dx = door.x - at.x;
            const dy = door.y - at.y;
            const dz = door.z - at.z;
            if (dx * dx + dy * dy + dz * dz > RANGE * RANGE) continue;
            done.add(door.key);
            pulse(player.dimension, door, stage, cycle);
        }
    }
}, 1);
