import { world, system } from "@minecraft/server";
import { ActionFormData, ModalFormData } from "@minecraft/server-ui";
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
    if (typeId !== "minecraft:book" && typeId !== "minecraft:writable_book") {
      return;
    }

    const nameTag = item.nameTag;
    if (!nameTag || nameTag.trim().toLowerCase() !== "spawn manager") {
      return;
    }

    if (!hasAdminPermission(player)) {
      player.onScreenDisplay.setActionBar("§c[SpawnControl] §fOnly admins can open Spawn Manager!");
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
    `Manage world mob spawns with precision.\n\n` +
    `Active Status:\n` +
    `Allowed: ${allowedCount} mobs\n` +
    `Blocked: ${blockedCount} mobs\n` +
    `Blocked Spawns This Session: ${getBlockedCount()}\n` +
    `Filter Mode: ${config.blockSpawnEggs ? "All Sources (Inc. Eggs)" : "Natural Only"}\n` +
    `Admin Tag Lock: ${config.adminOnly ? "Enabled" : "Disabled"}`
  );

  form.button("§1§lOverworld Hostiles");
  form.button("§2§lPassive & Neutral Mobs");
  form.button("§4§lNether & End Mobs");
  form.button("§5§lBosses & Rare Mobs");
  form.button("§6§lQuick Presets");
  form.button("§3§lGlobal Filter Settings");

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
    }
  });
}

function openCategoryMenu(player, categoryKey) {
  const category = MOB_CATEGORIES[categoryKey];
  if (!category) {
    return;
  }

  const rules = getSpawnRules(world);
  const form = new ActionFormData();
  form.title(`§2§l${category.name}`);
  form.body(`Configure spawn rules for ${category.name}:`);

  for (const mob of category.mobs) {
    const isAllowed = rules[mob.id] !== false;
    // Using simple text buttons for toggling since ActionFormData allows easy custom back buttons, 
    // or keeping ModalFormData if preferred. Using ModalFormData per original structure with a Back option handled via ActionFormData wrapper:
  }

  // To cleanly incorporate a Back button into category selection while keeping toggles, 
  // we can use ActionFormData that opens a Modal for the toggles, or list items. 
  // Below is the direct Modal implementation converted to include navigation via Action form or standard approach:
  openCategoryModal(player, categoryKey);
}

function openCategoryModal(player, categoryKey) {
  const category = MOB_CATEGORIES[categoryKey];
  if (!category) return;

  const rules = getSpawnRules(world);
  const form = new ModalFormData();
  form.title(`§2§l${category.name}`);

  for (const mob of category.mobs) {
    const isAllowed = rules[mob.id] !== false;
    form.toggle(`${mob.name}`, { defaultValue: isAllowed });
  }

  form.show(player).then((response) => {
    if (response.canceled) {
      system.run(() => openMainMenu(player));
      return;
    }
    
    if (!response.formValues) return;

    const currentRules = getSpawnRules(world);
    category.mobs.forEach((mob, index) => {
      const val = response.formValues[index];
      currentRules[mob.id] = Boolean(val);
    });

    saveSpawnRules(world, currentRules);
    player.onScreenDisplay.setActionBar(`§a[SpawnControl] §fUpdated ${category.name} spawn rules!`);
    system.run(() => openMainMenu(player));
  });
}

function openPresetsMenu(player) {
  const form = new ActionFormData();
  form.title("§6§lQuick Presets");
  form.body("Choose a preset to apply instant spawn rule sets across categories:");

  form.button("§a§lEnable All Mobs");
  form.button("§c§lDisable All Hostiles");
  form.button("§e§lDisable All Passive Mobs");
  form.button("§4§lDisable Everything");
  form.button("§b§lBack to Dashboard");

  form.show(player).then((response) => {
    if (response.canceled) {
      return;
    }

    if (response.selection === 4) {
      system.run(() => openMainMenu(player));
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
  form.title("§3§lGlobal Filter Settings");

  form.toggle("Include Spawn Eggs & Summon Commands", { defaultValue: config.blockSpawnEggs });
  form.toggle("Admin Tag Lock (player tag: aln_admin)", { defaultValue: config.adminOnly });
  form.toggle("Purge Loaded Disabled Mobs Now", { defaultValue: false });

  form.show(player).then((response) => {
    if (response.canceled) {
      system.run(() => openMainMenu(player));
      return;
    }

    if (!response.formValues) return;

    const blockSpawnEggs = Boolean(response.formValues[0]);
    const adminOnly = Boolean(response.formValues[1]);
    const purgeNow = Boolean(response.formValues[2]);

    saveSpawnConfig(world, { blockSpawnEggs, adminOnly });

    if (purgeNow) {
      purgeDisabledEntities(player);
    } else {
      player.onScreenDisplay.setActionBar("§a[SpawnControl] §fSaved global filter settings!");
    }
    system.run(() => openMainMenu(player));
  });
}

function purgeDisabledEntities(player) {
  const rules = getSpawnRules(world);
  let purgedCount = 0;

  const dimensions = ["overworld", "nether", "the_end"];
  for (const dimId of dimensions) {
    try {
      const dim = world.getDimension(dimId);
      if (!dim) {
        continue;
      }
      const entities = dim.getEntities();
      for (const entity of entities) {
        if (!entity || !entity.isValid) {
          continue;
        }
        if (rules[entity.typeId] === false) {
          try {
            entity.remove();
            purgedCount++;
          } catch (e) {
          }
        }
      }
    } catch (e) {
    }
  }

  player.onScreenDisplay.setActionBar(`§a[SpawnControl] §fPurged ${purgedCount} disabled mobs!`);
}
