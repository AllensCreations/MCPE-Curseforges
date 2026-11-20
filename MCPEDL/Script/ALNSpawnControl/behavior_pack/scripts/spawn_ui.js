import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData, MessageFormData } from "@minecraft/server-ui";
import {
  MOB_CATEGORIES,
  getSpawnRules,
  saveSpawnRules,
  getSpawnConfig,
  saveSpawnConfig,
  getAllMobIds
} from "./spawn_registry.js";
import { getBlockedCount } from "./spawn_filter.js";

const ADMIN_TAG = "aln_admin";

function hasAdminPermission(player) {
  const config = getSpawnConfig(world);
  if (!config.adminOnly) {
    return true;
  }
  const allPlayers = world.getAllPlayers();
  const hasAnyAdmin = allPlayers.some((p) => p.hasTag(ADMIN_TAG));
  if (!hasAnyAdmin) {
    player.addTag(ADMIN_TAG);
    player.onScreenDisplay.setActionBar("§a[SpawnControl] §fYou were granted Admin permissions.");
    return true;
  }
  return player.hasTag(ADMIN_TAG);
}

export function registerSpawnUI() {
  world.afterEvents.itemUse.subscribe((event) => {
    const item = event.itemStack;
    const player = event.source;

    if (!item || !player) {
      return;
    }

    const typeId = item.typeId;
    if (typeId !== "minecraft:book") {
      return;
    }

    const nameTag = item.nameTag;
    if (!nameTag || nameTag.trim().toLowerCase() !== "spawn control") {
      return;
    }

    if (!hasAdminPermission(player)) {
      player.onScreenDisplay.setActionBar("§c[SpawnControl] §fOnly admins can open Spawn Control!");
      return;
    }

    system.run(() => {
      openMainMenu(player);
    });
  });
}

function openMainMenu(player) {
  const rules = getSpawnRules(world);
  const config = getSpawnConfig(world);
  const allIds = getAllMobIds();

  let allowedCount = 0;
  let blockedCount = 0;

  for (const id of allIds) {
    if (rules[id] === false) {
      blockedCount++;
    } else {
      allowedCount++;
    }
  }

  const form = new ActionFormData();
  form.title("§2§lALN:SpawnControl");
  form.body(
    `§7Manage world mob spawns with precision.\n\n` +
    `§fActive Status:\n` +
    `§aAllowed: §f${allowedCount} mobs\n` +
    `§cBlocked: §f${blockedCount} mobs\n` +
    `§eBlocked Spawns This Session: §f${getBlockedCount()}\n` +
    `§bFilter Mode: §f${config.blockSpawnEggs ? "All Sources (Inc. Eggs)" : "Natural Only"}\n` +
    `§dAdmin Tag Lock: §f${config.adminOnly ? "Enabled" : "Disabled"}\n` +
    `§cDisabled Mobs Loaded Now: §f${countDisabledLoaded()}`
  );

  form.button("§1Overworld Hostiles\n§8Zombie, Creeper, Breeze...");
  form.button("§2Passive & Neutral Mobs\n§8Cow, Sheep, Villager...");
  form.button("§4Nether & End Mobs\n§8Blaze, Ghast, Piglin...");
  form.button("§5Bosses & Rare Mobs\n§8Warden, Wither, Dragon...");
  form.button("§6Quick Presets\n§8Enable/Disable Groups");
  form.button("§3Global Filter Settings\n§8Mode & Admin Lock");
  form.button("§cPurge Disabled Mobs\n§8Choose what gets removed");

  form.show(player).then((response) => {
    if (response.canceled) {
      return;
    }

    switch (response.selection) {
      case 0:
        openCategoryMenu(player, "overworld_hostiles");
        break;
      case 1:
        openCategoryMenu(player, "passive_neutral");
        break;
      case 2:
        openCategoryMenu(player, "nether_end");
        break;
      case 3:
        openCategoryMenu(player, "bosses_rare");
        break;
      case 4:
        openPresetsMenu(player);
        break;
      case 5:
        openGlobalSettingsMenu(player);
        break;
      case 6:
        openPurgeMenu(player);
        break;
    }
  });
}

function openCategoryMenu(player, categoryKey) {
  const category = MOB_CATEGORIES[categoryKey];
  if (!category) {
    return;
  }

  const rules = getSpawnRules(world);
  const form = new ModalFormData();
  form.title(`§2${category.name}`);

  form.dropdown("Group Action", ["No Change", "Enable All In Group", "Disable All In Group"], { defaultValueIndex: 0 });

  for (const mob of category.mobs) {
    const isAllowed = rules[mob.id] !== false;
    form.toggle(`${mob.name}`, { defaultValue: isAllowed });
  }

  form.show(player).then((response) => {
    if (response.canceled || !response.formValues) {
      return;
    }

    const currentRules = getSpawnRules(world);
    const groupAction = Number(response.formValues[0]);
    category.mobs.forEach((mob, index) => {
      if (groupAction === 1) {
        currentRules[mob.id] = true;
      } else if (groupAction === 2) {
        currentRules[mob.id] = false;
      } else {
        currentRules[mob.id] = Boolean(response.formValues[index + 1]);
      }
    });

    saveSpawnRules(world, currentRules);
    player.onScreenDisplay.setActionBar(`§a[SpawnControl] §fUpdated ${category.name} spawn rules!`);
  });
}

function openPresetsMenu(player) {
  const form = new ActionFormData();
  form.title("§6Quick Presets");
  form.body("§7Choose a preset to apply instant spawn rule sets across categories:");

  form.button("§aEnable All Mobs\n§8Allow all mobs to spawn");
  form.button("§cDisable All Hostiles\n§8Block all hostile & Nether threats");
  form.button("§eDisable All Passive Mobs\n§8Block all farm animals & pets");
  form.button("§4Disable Everything\n§8Completely empty mob world");

  form.show(player).then((response) => {
    if (response.canceled) {
      return;
    }

    const rules = getSpawnRules(world);

    if (response.selection === 0) {
      const allIds = getAllMobIds();
      for (const id of allIds) {
        rules[id] = true;
      }
      saveSpawnRules(world, rules);
      player.onScreenDisplay.setActionBar("§a[SpawnControl] §fEnabled all mobs!");
    } else if (response.selection === 1) {
      for (const mob of MOB_CATEGORIES.overworld_hostiles.mobs) {
        rules[mob.id] = false;
      }
      for (const mob of MOB_CATEGORIES.nether_end.mobs) {
        rules[mob.id] = false;
      }
      for (const mob of MOB_CATEGORIES.bosses_rare.mobs) {
        rules[mob.id] = false;
      }
      saveSpawnRules(world, rules);
      player.onScreenDisplay.setActionBar("§a[SpawnControl] §fDisabled all hostiles & bosses!");
    } else if (response.selection === 2) {
      for (const mob of MOB_CATEGORIES.passive_neutral.mobs) {
        rules[mob.id] = false;
      }
      saveSpawnRules(world, rules);
      player.onScreenDisplay.setActionBar("§a[SpawnControl] §fDisabled all passive mobs!");
    } else if (response.selection === 3) {
      const allIds = getAllMobIds();
      for (const id of allIds) {
        rules[id] = false;
      }
      saveSpawnRules(world, rules);
      player.onScreenDisplay.setActionBar("§a[SpawnControl] §fDisabled all mobs!");
    }
  });
}

function openGlobalSettingsMenu(player) {
  const config = getSpawnConfig(world);
  const form = new ModalFormData();
  form.title("§3Global Filter Settings");

  form.toggle("Include Spawn Eggs & Summon Commands", { defaultValue: config.blockSpawnEggs });
  form.toggle("Admin Tag Lock (player tag: aln_admin)", { defaultValue: config.adminOnly });
  form.toggle("Purge Loaded Disabled Mobs Now", { defaultValue: false });

  form.show(player).then((response) => {
    if (response.canceled || !response.formValues) {
      return;
    }

    const blockSpawnEggs = Boolean(response.formValues[0]);
    const adminOnly = Boolean(response.formValues[1]);

    saveSpawnConfig(world, { blockSpawnEggs, adminOnly });
    player.onScreenDisplay.setActionBar("§a[SpawnControl] §fSaved global filter settings!");
  });
}

const PURGE_OPTIONS_KEY = "aln_purge_options";

const PURGE_DIMENSIONS = [
  { name: "All Dimensions", ids: ["overworld", "nether", "the_end"] },
  { name: "Overworld", ids: ["overworld"] },
  { name: "Nether", ids: ["nether"] },
  { name: "The End", ids: ["the_end"] }
];

function isTamedEntity(entity) {
  try {
    if (entity.getComponent("minecraft:is_tamed")) {
      return true;
    }
  } catch (e) {
  }
  try {
    const tameable = entity.getComponent("minecraft:tameable");
    if (tameable && tameable.isTamed === true) {
      return true;
    }
  } catch (e) {
  }
  return false;
}

function isNameTaggedEntity(entity) {
  try {
    return typeof entity.nameTag === "string" && entity.nameTag.length > 0;
  } catch (e) {
    return false;
  }
}

function isLeashedEntity(entity) {
  try {
    const leashable = entity.getComponent("minecraft:leashable");
    return Boolean(leashable && leashable.isLeashed === true);
  } catch (e) {
    return false;
  }
}

function isRiddenEntity(entity) {
  try {
    const rideable = entity.getComponent("minecraft:rideable");
    return Boolean(rideable && rideable.getRiders().length > 0);
  } catch (e) {
    return false;
  }
}

function isChestedEntity(entity) {
  try {
    return Boolean(entity.getComponent("minecraft:is_chested"));
  } catch (e) {
    return false;
  }
}

const PURGE_PROTECTIONS = [
  { key: "tamed", label: "Include Tamed Mobs", kept: "tamed", test: isTamedEntity },
  { key: "named", label: "Include Name-Tagged Mobs", kept: "name-tagged", test: isNameTaggedEntity },
  { key: "leashed", label: "Include Leashed Mobs", kept: "leashed", test: isLeashedEntity },
  { key: "ridden", label: "Include Mobs With Riders", kept: "with riders", test: isRiddenEntity },
  { key: "chested", label: "Include Mobs Carrying Chests", kept: "carrying chests", test: isChestedEntity }
];

function getMobNameMap() {
  const map = {};
  for (const key of Object.keys(MOB_CATEGORIES)) {
    for (const mob of MOB_CATEGORIES[key].mobs) {
      map[mob.id] = mob.name;
    }
  }
  return map;
}

function getGroupMobIds(groupIndex) {
  const keys = Object.keys(MOB_CATEGORIES);
  if (groupIndex <= 0 || groupIndex > keys.length) {
    return getAllMobIds();
  }
  return MOB_CATEGORIES[keys[groupIndex - 1]].mobs.map((mob) => mob.id);
}

function loadPurgeOptions() {
  const options = {
    dimension: 0,
    group: 0,
    tamed: false,
    named: false,
    leashed: false,
    ridden: false,
    chested: false
  };
  try {
    const raw = world.getDynamicProperty(PURGE_OPTIONS_KEY);
    if (typeof raw === "string") {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        const dim = Number(parsed.dimension);
        const grp = Number(parsed.group);
        if (Number.isInteger(dim) && dim >= 0 && dim < PURGE_DIMENSIONS.length) {
          options.dimension = dim;
        }
        if (Number.isInteger(grp) && grp >= 0 && grp <= Object.keys(MOB_CATEGORIES).length) {
          options.group = grp;
        }
        for (const p of PURGE_PROTECTIONS) {
          options[p.key] = Boolean(parsed[p.key]);
        }
      }
    }
  } catch (e) {
  }
  return options;
}

function savePurgeOptions(options) {
  try {
    world.setDynamicProperty(PURGE_OPTIONS_KEY, JSON.stringify(options));
  } catch (e) {
  }
}

function scanPurge(options, selectedIds) {
  const rules = getSpawnRules(world);
  const groupIds = new Set(getGroupMobIds(options.group));
  const dimension = PURGE_DIMENSIONS[options.dimension] || PURGE_DIMENSIONS[0];
  const types = {};
  const kept = {};
  for (const p of PURGE_PROTECTIONS) {
    kept[p.key] = 0;
  }

  for (const dimId of dimension.ids) {
    try {
      const dim = world.getDimension(dimId);
      if (!dim) {
        continue;
      }
      for (const entity of dim.getEntities()) {
        if (!entity || !entity.isValid) {
          continue;
        }
        const id = entity.typeId;
        if (rules[id] !== false || !groupIds.has(id)) {
          continue;
        }
        if (selectedIds && !selectedIds.has(id)) {
          continue;
        }
        let protectedBy = null;
        for (const p of PURGE_PROTECTIONS) {
          if (!options[p.key] && p.test(entity)) {
            protectedBy = p.key;
            break;
          }
        }
        if (protectedBy) {
          kept[protectedBy]++;
          continue;
        }
        if (!types[id]) {
          types[id] = [];
        }
        types[id].push(entity);
      }
    } catch (e) {
    }
  }

  return { types, kept };
}

function describeKept(kept) {
  const parts = [];
  for (const p of PURGE_PROTECTIONS) {
    if (kept[p.key] > 0) {
      parts.push(`${kept[p.key]} ${p.kept}`);
    }
  }
  return parts.length > 0 ? parts.join(", ") : "none";
}

function countDisabledLoaded() {
  const rules = getSpawnRules(world);
  let count = 0;
  for (const dimId of PURGE_DIMENSIONS[0].ids) {
    try {
      const dim = world.getDimension(dimId);
      if (!dim) {
        continue;
      }
      for (const entity of dim.getEntities()) {
        if (entity && entity.isValid && rules[entity.typeId] === false) {
          count++;
        }
      }
    } catch (e) {
    }
  }
  return count;
}

function openPurgeMenu(player) {
  const options = loadPurgeOptions();
  const groupNames = ["All Groups"];
  for (const key of Object.keys(MOB_CATEGORIES)) {
    groupNames.push(MOB_CATEGORIES[key].name);
  }

  const form = new ModalFormData();
  form.title("§cPurge Disabled Mobs");
  form.dropdown("Dimension", PURGE_DIMENSIONS.map((d) => d.name), { defaultValueIndex: options.dimension });
  form.dropdown("Mob Group", groupNames, { defaultValueIndex: options.group });
  for (const p of PURGE_PROTECTIONS) {
    form.toggle(p.label, { defaultValue: options[p.key] });
  }

  form.show(player).then((response) => {
    if (response.canceled || !response.formValues) {
      return;
    }

    const chosen = {
      dimension: Number(response.formValues[0]),
      group: Number(response.formValues[1])
    };
    PURGE_PROTECTIONS.forEach((p, index) => {
      chosen[p.key] = Boolean(response.formValues[index + 2]);
    });
    savePurgeOptions(chosen);

    system.run(() => openPurgeMobPicker(player, chosen));
  });
}

function openPurgeMobPicker(player, options) {
  const scan = scanPurge(options, null);
  const ids = Object.keys(scan.types);

  if (ids.length === 0) {
    showPurgeResult(player, 0, scan.kept, [], "No disabled mobs matched your choices.");
    return;
  }

  const names = getMobNameMap();
  const form = new ModalFormData();
  form.title("§cChoose Mobs To Purge");
  for (const id of ids) {
    form.toggle(`${names[id] || id} (${scan.types[id].length})`, { defaultValue: true });
  }

  form.show(player).then((response) => {
    if (response.canceled || !response.formValues) {
      return;
    }

    const selectedIds = new Set();
    ids.forEach((id, index) => {
      if (Boolean(response.formValues[index])) {
        selectedIds.add(id);
      }
    });

    if (selectedIds.size === 0) {
      player.onScreenDisplay.setActionBar("§c[SpawnControl] §fNo mobs were selected.");
      return;
    }

    system.run(() => openPurgeConfirm(player, options, selectedIds));
  });
}

function openPurgeConfirm(player, options, selectedIds) {
  const scan = scanPurge(options, selectedIds);
  const names = getMobNameMap();
  const ids = Object.keys(scan.types);
  let total = 0;
  const lines = [];
  for (const id of ids) {
    total += scan.types[id].length;
    lines.push(`§f${names[id] || id}: §c${scan.types[id].length}`);
  }

  if (total === 0) {
    showPurgeResult(player, 0, scan.kept, [], "No disabled mobs matched your choices.");
    return;
  }

  const form = new MessageFormData();
  form.title("§cConfirm Purge");
  form.body(
    `§fMobs to remove: §c${total}\n` +
    `${lines.join("\n")}\n\n` +
    `§7Kept safe: §f${describeKept(scan.kept)}\n\n` +
    `§cThis cannot be undone.`
  );
  form.button1("Cancel");
  form.button2("Purge Now");

  form.show(player).then((response) => {
    if (response.canceled || response.selection !== 1) {
      player.onScreenDisplay.setActionBar("§e[SpawnControl] §fPurge cancelled.");
      return;
    }
    system.run(() => runPurge(player, options, selectedIds));
  });
}

function runPurge(player, options, selectedIds) {
  const scan = scanPurge(options, selectedIds);
  const names = getMobNameMap();
  const removed = [];
  let purged = 0;

  for (const id of Object.keys(scan.types)) {
    let typeCount = 0;
    for (const entity of scan.types[id]) {
      try {
        if (entity.isValid) {
          entity.remove();
          typeCount++;
          purged++;
        }
      } catch (e) {
      }
    }
    if (typeCount > 0) {
      removed.push(`${names[id] || id}: ${typeCount}`);
    }
  }

  showPurgeResult(player, purged, scan.kept, removed, null);
}

function showPurgeResult(player, purged, kept, removed, note) {
  const form = new ActionFormData();
  form.title("§aPurge Summary");
  let body = `§fMobs purged: §a${purged}\n§7Kept safe: §f${describeKept(kept)}`;
  if (removed.length > 0) {
    body += `\n\n§fRemoved:\n§7${removed.join("\n")}`;
  }
  if (note) {
    body += `\n\n§e${note}`;
  }
  form.body(body);
  form.button("Close");
  form.show(player).then(() => {
  });
}
