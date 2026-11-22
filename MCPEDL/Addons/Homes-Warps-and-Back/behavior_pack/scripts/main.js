import { world, system, Player } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";

const MENU_ITEM = "minecraft:compass";
const HOMES_KEY = "aln_hwb:homes";
const WARPS_KEY = "aln_hwb:warps";
const BACK_KEY = "aln_hwb:back";
const TITLE = "Homes, Warps and Back";
const MAX_HOMES = 5;
const MAX_WARPS_EACH = 3;
const MAX_WARPS = 30;
const MAX_NAME = 16;

function readList(owner, key) {
  try {
    const raw = owner.getDynamicProperty(key);
    const data = typeof raw === "string" ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    return [];
  }
}

function readMap(owner, key) {
  try {
    const raw = owner.getDynamicProperty(key);
    const data = typeof raw === "string" ? JSON.parse(raw) : {};
    return data && typeof data === "object" && !Array.isArray(data) ? data : {};
  } catch (error) {
    return {};
  }
}

function save(owner, key, value) {
  try {
    owner.setDynamicProperty(key, JSON.stringify(value));
    return true;
  } catch (error) {
    return false;
  }
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function spotOf(entity) {
  const at = entity.location;
  return { x: round(at.x), y: round(at.y), z: round(at.z), d: entity.dimension.id };
}

function validSpot(spot) {
  return Boolean(spot) && Number.isFinite(spot.x) && Number.isFinite(spot.y) && Number.isFinite(spot.z) && typeof spot.d === "string";
}

function cleanName(value) {
  if (typeof value !== "string") return "";
  return value.replace(/[^A-Za-z0-9 _'-]/g, "").replace(/\s+/g, " ").trim().slice(0, MAX_NAME);
}

function sameName(a, b) {
  return a.toLowerCase() === b.toLowerCase();
}

function travel(player, spot, label) {
  if (!validSpot(spot)) {
    player.sendMessage("That saved place is damaged and cannot be used.");
    return;
  }
  system.run(() => {
    try {
      player.teleport({ x: spot.x, y: spot.y, z: spot.z }, { dimension: world.getDimension(spot.d) });
      player.sendMessage(`Teleported to ${label}.`);
    } catch (error) {
      player.sendMessage("That place could not be reached.");
    }
  });
}

function present(player, form, onPick) {
  form
    .show(player)
    .then((response) => {
      if (response.canceled) return;
      onPick(response);
    })
    .catch(() => {});
}

function mainMenu(player) {
  const form = new ActionFormData()
    .title(TITLE)
    .body("Choose an option.")
    .button("My Homes")
    .button("Set Home")
    .button("Warps")
    .button("Set Warp")
    .button("Back to Death Point");
  const actions = [
    () => homesMenu(player, false),
    () => setHomeForm(player),
    () => warpsMenu(player, false),
    () => setWarpForm(player),
    () => goBack(player),
  ];
  present(player, form, (response) => {
    const run = actions[response.selection];
    if (run) run();
  });
}

function homesMenu(player, removing) {
  const homes = readList(player, HOMES_KEY);
  if (homes.length === 0) {
    player.sendMessage("You have no homes yet. Use Set Home first.");
    return;
  }
  const form = new ActionFormData()
    .title(removing ? "Delete a Home" : "My Homes")
    .body(removing ? "Choose a home to delete." : "Choose a home to travel to.");
  for (const home of homes) form.button(home.name);
  if (!removing) form.button("Delete a Home");
  present(player, form, (response) => {
    if (!removing && response.selection === homes.length) {
      homesMenu(player, true);
      return;
    }
    const home = homes[response.selection];
    if (!home) return;
    if (removing) {
      homes.splice(response.selection, 1);
      save(player, HOMES_KEY, homes);
      player.sendMessage(`Deleted home ${home.name}.`);
      return;
    }
    travel(player, home, `home ${home.name}`);
  });
}

function setHomeForm(player) {
  const form = new ModalFormData().title("Set Home").textField("Home name", "home", "Home");
  present(player, form, (response) => {
    const name = cleanName(response.formValues[0]);
    if (!name) {
      player.sendMessage("Use 1 to 16 letters, numbers or spaces.");
      return;
    }
    const homes = readList(player, HOMES_KEY);
    const index = homes.findIndex((home) => sameName(home.name, name));
    if (index === -1 && homes.length >= MAX_HOMES) {
      player.sendMessage(`You can keep up to ${MAX_HOMES} homes. Delete one first.`);
      return;
    }
    const entry = { name, ...spotOf(player) };
    if (index === -1) homes.push(entry);
    else homes[index] = entry;
    player.sendMessage(save(player, HOMES_KEY, homes) ? `Home ${name} saved.` : "The home could not be saved.");
  });
}

function warpsMenu(player, removing) {
  const all = readList(world, WARPS_KEY);
  const shown = removing ? all.filter((warp) => warp.owner === player.name) : all;
  if (shown.length === 0) {
    player.sendMessage(removing ? "You have no warps to delete." : "No warps have been set yet.");
    return;
  }
  const form = new ActionFormData()
    .title(removing ? "Delete a Warp" : "Warps")
    .body(removing ? "Choose one of your warps to delete." : "Choose a warp to travel to.");
  for (const warp of shown) form.button(`${warp.name}\nby ${warp.owner}`);
  if (!removing) form.button("Delete My Warp");
  present(player, form, (response) => {
    if (!removing && response.selection === shown.length) {
      warpsMenu(player, true);
      return;
    }
    const warp = shown[response.selection];
    if (!warp) return;
    if (removing) {
      const index = all.indexOf(warp);
      if (index !== -1) all.splice(index, 1);
      save(world, WARPS_KEY, all);
      player.sendMessage(`Deleted warp ${warp.name}.`);
      return;
    }
    travel(player, warp, `warp ${warp.name}`);
  });
}

function setWarpForm(player) {
  const form = new ModalFormData().title("Set Warp").textField("Warp name", "spawn", "Warp");
  present(player, form, (response) => {
    const name = cleanName(response.formValues[0]);
    if (!name) {
      player.sendMessage("Use 1 to 16 letters, numbers or spaces.");
      return;
    }
    const all = readList(world, WARPS_KEY);
    const taken = all.findIndex((warp) => sameName(warp.name, name));
    if (taken !== -1 && all[taken].owner !== player.name) {
      player.sendMessage(`The warp ${all[taken].name} belongs to ${all[taken].owner}.`);
      return;
    }
    const owned = all.filter((warp) => warp.owner === player.name).length;
    if (taken === -1 && owned >= MAX_WARPS_EACH) {
      player.sendMessage(`You can keep up to ${MAX_WARPS_EACH} warps. Delete one first.`);
      return;
    }
    if (taken === -1 && all.length >= MAX_WARPS) {
      player.sendMessage("The warp list is full.");
      return;
    }
    const entry = { name, owner: player.name, ...spotOf(player) };
    if (taken === -1) all.push(entry);
    else all[taken] = entry;
    player.sendMessage(save(world, WARPS_KEY, all) ? `Warp ${name} saved.` : "The warp could not be saved.");
  });
}

function goBack(player) {
  const spot = readMap(world, BACK_KEY)[player.name];
  if (!spot) {
    player.sendMessage("No death point has been saved yet.");
    return;
  }
  travel(player, spot, "your last death point");
}

world.afterEvents.entityDie.subscribe((event) => {
  const dead = event.deadEntity;
  if (!(dead instanceof Player)) return;
  try {
    const all = readMap(world, BACK_KEY);
    all[dead.name] = spotOf(dead);
    save(world, BACK_KEY, all);
    dead.sendMessage("Death point saved. Use a compass to open the menu and return.");
  } catch (error) {
    return;
  }
});

world.afterEvents.itemUse.subscribe((event) => {
  if (event.itemStack.typeId !== MENU_ITEM) return;
  const player = event.source;
  system.run(() => mainMenu(player));
});
