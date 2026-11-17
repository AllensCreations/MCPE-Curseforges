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
    `§7Manage world mob spawns with precision.\n\n` +
    `§fActive Status:\n` +
    `§a✔ Allowed: §f${allowedCount} mobs\n` +
    `§c✖ Blocked: §f${blockedCount} mobs\n` +
    `§e⚡ Blocked Spawns This Session: §f${getBlockedCount()}\n` +
    `§b⚙ Filter Mode: §f${config.blockSpawnEggs ? "All Sources (Inc. Eggs)" : "Natural Only"}\n` +
    `§d🔒 Admin Tag Lock: §f${config.adminOnly ? "Enabled" : "Disabled"}`
  );

  form.button("§1Overworld Hostiles\n§8Zombie, Creeper, Breeze...", "textures/ui/icon_hostile");
  form.button("§2Passive & Neutral Mobs\n§8Cow, Sheep, Villager...", "textures/ui/icon_passive");
  form.button("§4Nether & End Mobs\n§8Blaze, Ghast, Piglin...", "textures/ui/icon_nether");
  form.button("§5Bosses & Rare Mobs\n§8Warden, Wither, Dragon...", "textures/ui/icon_boss");
  form.button("§6⚡ Quick Presets\n§8Enable/Disable Groups", "textures/ui/icon_presets");
  form.button("§3⚙ Global Filter Settings\n§8Mode & Admin Lock", "textures/ui/icon_settings");

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
  const form = new ModalFormData();
  form.title(`§2${category.name}`);

  for (const mob of category.mobs) {
    const isAllowed = rules[mob.id] !== false;
    form.toggle(`${mob.name}`, { defaultValue: isAllowed });
  }

  form.show(player).then((response) => {
    if (response.canceled || !response.formValues) {
      return;
    }

    const currentRules = getSpawnRules(world);
    category.mobs.forEach((mob, index) => {
      const val = response.formValues[index];
      currentRules[mob.id] = Boolean(val);
    });

    saveSpawnRules(world, currentRules);
    player.onScreenDisplay.setActionBar(`§a[SpawnControl] §fUpdated ${category.name} spawn rules!`);
  });
}

function openPresetsMenu(player) {
  const form = new ActionFormData();
  form.title("§6⚡ Quick Presets");
  form.body("§7Choose a preset to apply instant spawn rule sets across categories:");

  form.button("§aEnable All Mobs\n§8Allow all mobs to spawn");
  form.button("§cDisable All Hostiles\n§8Block all hostile & Nether threats");
  form.button("§eDisable All Passive Mobs\n§8Block all farm animals & pets");
  form.button("§4Disable Everything\n§8Completely empty mob world");
  form.button("§7« Back to Dashboard\n§8Return to main menu");

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
  form.title("§3⚙ Global Filter Settings");

  form.toggle("Include Spawn Eggs & Summon Commands", { defaultValue: config.blockSpawnEggs });
  form.toggle("Admin Tag Lock (player tag: aln_admin)", { defaultValue: config.adminOnly });
  form.toggle("Purge Loaded Disabled Mobs Now", { defaultValue: false });

  form.show(player).then((response) => {
    if (response.canceled || !response.formValues) {
      return;
    }

    const blockSpawnEggs = Boolean(response.formValues[0]);
    const adminOnly = Boolean(response.formValues[1]);
    const purgeNow = Boolean(response.formValues[2]);

    saveSpawnConfig(world, { blockSpawnEggs, adminOnly });

    if (purgeNow) {
      purgeDisabledEntities(player);
    } else {
      player.onScreenDisplay.setActionBar("§a[SpawnControl] §fSaved global filter settings!");
    }
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
