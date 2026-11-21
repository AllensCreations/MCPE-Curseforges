import { ItemStack, system, world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { isAdmin, IS_ADMIN_BUILD, ONEBLOCK_POS, tickCounter } from "./config.js";
import { getDimKey, getDimensionState } from "./helpers.js";
import { buildThemedIsland } from "./island-builder.js";
import { getIslandLocation, isIslandPhysicallyBuilt } from "./island-layout.js";
import { materializeIsland } from "./island-spawn.js";
import { ISLAND_THEMES, OVERWORLD_ISLAND_ORDER } from "./island-themes.js";
import { handleAutomatedBlockDestruction } from "./oneblock.js";

// =========================================================================
// ADMIN AUTO-BREAK TESTING RUNNER & ISLAND INSPECTOR
// =========================================================================

export let isAutoBreakRunning = false;

export function toggleAdminAutoBreak(player) {
  try {
    if (!isAdmin(player)) {
      return;
    }

    isAutoBreakRunning = !isAutoBreakRunning;

    if (isAutoBreakRunning) {
      player.sendMessage("\n§a⚡ [Admin Auto-Break] Started fast auto-mining runner! (10 blocks/sec)");
      player.sendMessage("§eRapidly breaking OneBlock, progressing through phases, and summoning secret islands!");
      player.sendMessage("§7Type §b!run§7 or §brun§7 again anytime to stop.\n");
      player.playSound("random.levelup", { pitch: 1.5, volume: 1.0 });
    } else {
      player.sendMessage("\n§c⏹ [Admin Auto-Break] Stopped auto-break simulation.");
      player.sendMessage("§7Auto-mining runner halted.\n");
      player.playSound("random.fizz", { pitch: 1.0, volume: 1.0 });
      try {
        player.onScreenDisplay.setActionBar("§c[Auto-Break Stopped]");
      } catch (e) {}
    }
  } catch (err) {}
}

// Fast Auto-Break Runner Tick Loop (runs every 2 ticks / 0.1s -> 10 blocks/sec)
export function autoBreakTick() {
  if (IS_ADMIN_BUILD) {
    try { checkAdminDoubleSneak(); } catch (se) {}
  }
  if (!isAutoBreakRunning) return;
  try {
    for (const player of world.getAllPlayers()) {
      const dimension = player.dimension;
      if (!dimension) continue;
      const dimKey = getDimKey(dimension.id);

      // Clear block at ONEBLOCK_POS to simulate rapid mining
      const b = dimension.getBlock(ONEBLOCK_POS);
      if (b && !b.isAir && b.typeId !== "minecraft:air") {
        try {
          b.setType("minecraft:air");
        } catch (e1) {}
      }

      // Execute automated block destruction & advance progression
      handleAutomatedBlockDestruction(dimension);

      // Audio & Particle feedback
      try {
        dimension.spawnParticle("minecraft:villager_happy", { x: ONEBLOCK_POS.x + 0.5, y: ONEBLOCK_POS.y + 1.2, z: ONEBLOCK_POS.z + 0.5 });
      } catch (pe) {}

      // Live HUD Actionbar status
      const state = getDimensionState(dimKey);
      const targetDim = (dimKey === "nether") ? "nether" : ((dimKey === "end") ? "the_end" : "overworld");
      const spawnedCount = ISLAND_THEMES.filter(t => (t.dimension || "overworld") === targetDim && world.getDynamicProperty(`island_spawned_${t.id}`)).length;
      const totalDimIslands = ISLAND_THEMES.filter(t => (t.dimension || "overworld") === targetDim).length;

      player.onScreenDisplay.setActionBar(
        `§6[Auto-Break Active] §eMined: §b${state.count} §7| §ePhase: §a${state.phaseIndex + 1} §7| §eIslands: §d${spawnedCount}/${totalDimIslands} §7(Type !run to stop)`
      );
      break; // Run once per tick interval
    }
  } catch (err) {}
}

export function summonNextIslandAdmin(player) {
  try {
    const dimKey = getDimKey(player.dimension.id);
    const targetDim = (dimKey === "nether") ? "nether" : ((dimKey === "end") ? "the_end" : "overworld");
    let nextTheme = null;
    if (targetDim === "overworld") {
      for (const id of OVERWORLD_ISLAND_ORDER) {
        if (!world.getDynamicProperty(`island_spawned_${id}`)) {
          nextTheme = ISLAND_THEMES.find(t => t.id === id);
          break;
        }
      }
    } else {
      nextTheme = ISLAND_THEMES.find(t => (t.dimension || "overworld") === targetDim && !world.getDynamicProperty(`island_spawned_${t.id}`));
    }
    if (!nextTheme) {
      nextTheme = ISLAND_THEMES.find(t => !world.getDynamicProperty(`island_spawned_${t.id}`));
    }
    if (!nextTheme) {
      player.sendMessage("§e[Admin] All islands have already been summoned!");
      return;
    }
    const state = getDimensionState(dimKey);
    materializeIsland(player.dimension, nextTheme, state.phaseIndex, state.count);
    player.sendMessage(`§a[Admin] ★ Summoned Island: §l${nextTheme.name}§r§a!`);
  } catch (e) {}
}

// Photography Camera Angle Calculation for scenic 3/4 isometric panoramic framing
export function getIslandPhotoViewpoint(theme, center) {
  const { x: cx, y: cy, z: cz } = center;
  const distFromSpawn = Math.hypot(cx, cz);
  let camX, camY, camZ;

  if (distFromSpawn < 10) {
    // Center island
    camX = cx + 14;
    camY = cy + 9;
    camZ = cz + 14;
  } else {
    // Frame from radial vector shifted 25 degrees for optimal 3/4 elevation angle
    const angle = Math.atan2(cz, cx);
    const camAngle = angle + (25 * Math.PI / 180);
    const camDist = theme.size === "huge" ? 22 : (theme.size === "big" ? 18 : 15);
    camX = Math.round(cx + camDist * Math.cos(camAngle));
    camY = cy + (theme.size === "huge" ? 10 : 8);
    camZ = Math.round(cz + camDist * Math.sin(camAngle));
  }

  return {
    cameraPos: { x: camX, y: camY, z: camZ },
    lookAt: { x: cx, y: cy + 1, z: cz }
  };
}

export function summonAllIslandsAdmin(player) {
  try {
    if (player) {
      player.sendMessage("\n§6=== [ADMIN SHOWCASE] MANIFESTING ALL 43 ISLANDS FOR PHOTOGRAPHY ===");
      player.sendMessage("§ePreloading chunks and generating all 43 themed islands across Overworld, Nether, and The End...");
    }

    const total = ISLAND_THEMES.length;

    // Process each island sequentially with ticking area preloading
    for (let i = 0; i < total; i++) {
      const theme = ISLAND_THEMES[i];
      const loc = getIslandLocation(i, total, theme);
      const targetDimName = theme.dimension || "overworld";

      world.setDynamicProperty(`island_spawned_${theme.id}`, true);
      world.setDynamicProperty(`island_target_x_${theme.id}`, loc.center.x);
      world.setDynamicProperty(`island_target_y_${theme.id}`, loc.center.y);
      world.setDynamicProperty(`island_target_z_${theme.id}`, loc.center.z);

      const delay = i * 16;
      system.runTimeout(() => {
        try {
          const dim = world.getDimension(targetDimName);
          if (!dim) return;

          const areaSlot = i % 6;
          const areaName = `isl_photo_${areaSlot}`;
          try { dim.runCommand(`tickingarea remove ${areaName}`); } catch (e1) {}
          try { dim.runCommand(`tickingarea add circle ${loc.center.x} ${loc.center.y} ${loc.center.z} 3 ${areaName} true`); } catch (e2) {}

          system.runTimeout(() => {
            try {
              if (!isIslandPhysicallyBuilt(dim, loc.center)) {
                const placed = buildThemedIsland(dim, theme, loc.center);
                if (placed > 0) world.setDynamicProperty(`island_built_${theme.id}`, true);
              }
            } catch (be) {}
            try { dim.runCommand(`tickingarea remove ${areaName}`); } catch (e3) {}
          }, 14);
        } catch (e) {}
      }, delay);
    }

    world.setDynamicProperty("admin_islands_manifested", true);

    system.runTimeout(() => {
      for (const p of world.getAllPlayers()) {
        p.sendMessage(`\n§a[Admin Showcase] ★ All ${total} Secret Islands successfully manifested and ready for photography!`);
        p.sendMessage("§eDouble-crouch or chat 'photo' to open the Photography Studio teleporter.");
        p.playSound("random.levelup", { pitch: 1.2, volume: 1.0 });
      }
    }, total * 16 + 25);
  } catch (e) {}
}

export function setupAdminStation(dimension) {
  if (!IS_ADMIN_BUILD) return;
  try {
    for (let z = -2; z <= 2; z++) {
      // Bedrock foundation underneath walkway and podium
      const bUnderWalk = dimension.getBlock({ x: 2, y: 63, z });
      if (bUnderWalk && bUnderWalk.typeId !== "minecraft:bedrock") bUnderWalk.setType("minecraft:bedrock");
      const bUnderPod = dimension.getBlock({ x: 3, y: 63, z });
      if (bUnderPod && bUnderPod.typeId !== "minecraft:bedrock") bUnderPod.setType("minecraft:bedrock");

      // Polished Blackstone Bricks Walkway
      const bWalk = dimension.getBlock({ x: 2, y: 64, z });
      if (bWalk && bWalk.typeId !== "minecraft:polished_blackstone_bricks") bWalk.setType("minecraft:polished_blackstone_bricks");

      // Polished Blackstone Console Base
      const bPod = dimension.getBlock({ x: 3, y: 64, z });
      if (bPod && bPod.typeId !== "minecraft:polished_blackstone") bPod.setType("minecraft:polished_blackstone");

      // Interactive Buttons on top of console
      const bBtn = dimension.getBlock({ x: 3, y: 65, z });
      if (bBtn && (bBtn.isAir || bBtn.typeId === "minecraft:air")) {
        bBtn.setType("minecraft:stone_button");
      }
    }
  } catch (e) {}
}

const playerSneakHistory = new Map();

export function checkAdminDoubleSneak() {
  if (!IS_ADMIN_BUILD) return;
  for (const player of world.getAllPlayers()) {
    try {
      const isSneaking = player.isSneaking;
      const hist = playerSneakHistory.get(player.id) || { wasSneaking: false, lastTapTick: 0 };

      if (isSneaking && !hist.wasSneaking) {
        const now = tickCounter;
        if (now - hist.lastTapTick <= 24 && now - hist.lastTapTick >= 2) {
          hist.lastTapTick = 0;
          openAdminIslandMenu(player);
          player.playSound("random.orb", { pitch: 1.2, volume: 1.0 });
        } else {
          hist.lastTapTick = now;
        }
      }
      hist.wasSneaking = isSneaking;
      playerSneakHistory.set(player.id, hist);
    } catch (e) {}
  }
}

export function openAdminIslandMenu(player) {
  try {
    if (!isAdmin(player)) return;
    const form = new ActionFormData();
    form.title("§6§lISLAND PHOTO STUDIO & INSPECTOR§r");
    form.body("§eChoose studio lighting or select an island to take panoramic screenshots in Creative Mode.\n§7Tip: Double-tap Sneak or chat 'photo' anytime to open this studio!");

    form.button("§6§l🌟 MANIFEST ALL 43 ISLANDS§r\n§8(Preload & build all islands into the void)", "textures/ui/refresh_light");
    form.button("§e§l☀️ PHOTO LIGHTING: HIGH NOON§r\n§8(Clear sky & bright overhead sunlight)", "textures/ui/weather_clear");
    form.button("§6§l🌅 PHOTO LIGHTING: GOLDEN HOUR§r\n§8(Dramatic sunset & warm horizon glow)", "textures/ui/icon_recipe_nature");
    form.button("§9§l🌌 PHOTO LIGHTING: STARRY NIGHT§r\n§8(Clear starry night & glowing lanterns)", "textures/ui/portal_icon");
    form.button("§b§l👁️ TOGGLE NIGHT VISION & FLIGHT§r\n§8(Crystal-clear void visibility)", "textures/ui/accessibility_glyph_color");
    form.button("§c§l▶ TOGGLE AUTO-BREAK RUNNER§r\n§8(Rapidly mine & test progression)", "textures/ui/speed_effect");

    for (let i = 0; i < ISLAND_THEMES.length; i++) {
      const theme = ISLAND_THEMES[i];
      const dimPrefix = theme.dimension === "nether" ? "§c[Nether]" : (theme.dimension === "the_end" ? "§d[End]" : "§a[Overworld]");
      let ringLabel = "";
      if (theme.dimension === "overworld") {
        const orderIdx = OVERWORLD_ISLAND_ORDER.indexOf(theme.id);
        if (orderIdx < 6) ringLabel = "Ring 1 (72m)";
        else if (orderIdx < 14) ringLabel = "Ring 2 (125m)";
        else if (orderIdx < 24) ringLabel = "Ring 3 (180m)";
        else ringLabel = "Ring 4 (240m)";
      } else {
        ringLabel = theme.dimension === "nether" ? "Nether (75m)" : "End (85m)";
      }
      const sizeLabel = theme.size ? theme.size.toUpperCase() : "MED";
      form.button(`${theme.color}§l${theme.name}§r\n§8${dimPrefix} ${ringLabel} • ${sizeLabel}`);
    }

    form.show(player).then((response) => {
      if (response.canceled || response.selection === undefined) return;

      if (response.selection === 0) {
        summonAllIslandsAdmin(player);
        return;
      }
      if (response.selection === 1) {
        try {
          player.dimension.runCommand("time set noon");
          player.dimension.runCommand("weather clear");
          player.sendMessage("§a[Photo Studio] Studio lighting set to High Noon (Bright Sunlight)!");
          player.playSound("random.orb", { pitch: 1.2, volume: 0.8 });
        } catch (e) {}
        return;
      }
      if (response.selection === 2) {
        try {
          player.dimension.runCommand("time set 12000");
          player.dimension.runCommand("weather clear");
          player.sendMessage("§6[Photo Studio] Studio lighting set to Golden Hour Sunset!");
          player.playSound("random.orb", { pitch: 1.2, volume: 0.8 });
        } catch (e) {}
        return;
      }
      if (response.selection === 3) {
        try {
          player.dimension.runCommand("time set 18000");
          player.dimension.runCommand("weather clear");
          player.sendMessage("§9[Photo Studio] Studio lighting set to Starry Midnight!");
          player.playSound("random.orb", { pitch: 1.2, volume: 0.8 });
        } catch (e) {}
        return;
      }
      if (response.selection === 4) {
        try {
          player.addEffect("night_vision", 999999, { showParticles: false });
          player.setGameMode("creative");
          player.sendMessage("§b[Photo Studio] Night Vision & Creative Flight refreshed!");
          player.playSound("random.orb", { pitch: 1.2, volume: 0.8 });
        } catch (e) {}
        return;
      }
      if (response.selection === 5) {
        toggleAdminAutoBreak(player);
        return;
      }

      // Island Selected: Open Sub-Form with Photography Angles
      const themeIndex = response.selection - 6;
      const theme = ISLAND_THEMES[themeIndex];
      if (!theme) return;

      openIslandPhotoSubMenu(player, theme, themeIndex);
    });
  } catch (err) {}
}

function openIslandPhotoSubMenu(player, theme, themeIndex) {
  try {
    const loc = getIslandLocation(themeIndex, ISLAND_THEMES.length, theme);
    const photoView = getIslandPhotoViewpoint(theme, loc.center);
    const targetDimName = theme.dimension || "overworld";

    const subForm = new ActionFormData();
    subForm.title(`${theme.color}§l${theme.name}§r`);
    subForm.body(
      `§eDimension: §f${targetDimName.toUpperCase()}\n` +
      `§eBiome: §f${theme.biome}\n` +
      `§eCenter Location: §b(${loc.center.x}, ${loc.center.y}, ${loc.center.z})\n` +
      `§eDistance from Spawn: §a${loc.distance}m\n\n` +
      `§7Select how you would like to view this island for photography:`
    );

    subForm.button("§6§l📸 SCENIC PHOTO VIEWPOINT§r\n§8(Elevated 3/4 panoramic isometric camera angle)", "textures/ui/camera");
    subForm.button("§a§l📍 LAND ON ISLAND CORE§r\n§8(Teleport directly onto OneBlock surface)", "textures/ui/portal_icon");
    subForm.button("§d§l🔨 RE-GENERATE ISLAND§r\n§8(Force procedural build of this island)", "textures/ui/icon_recipe_nature");
    subForm.button("§7🔙 Back to Studio List", "textures/ui/undo");

    subForm.show(player).then((subResp) => {
      if (subResp.canceled || subResp.selection === undefined) return;

      if (subResp.selection === 3) {
        openAdminIslandMenu(player);
        return;
      }

      const targetDim = world.getDimension(targetDimName) || player.dimension;
      const isPhotoAngle = subResp.selection === 0;
      const destPos = isPhotoAngle ? photoView.cameraPos : { x: loc.center.x, y: loc.center.y + 2, z: loc.center.z };

      // Teleport player & setup creative mode + night vision
      try {
        player.teleport(destPos, { dimension: targetDim, checkForBlocks: false });
        player.setGameMode("creative");
        player.addEffect("night_vision", 999999, { showParticles: false });
      } catch (tpe) {}

      // Preload chunk and ensure physically built
      const areaName = `temp_view_${theme.id.slice(0, 6)}`;
      try { targetDim.runCommand(`tickingarea remove ${areaName}`); } catch (e) {}
      try { targetDim.runCommand(`tickingarea add circle ${loc.center.x} ${loc.center.y} ${loc.center.z} 3 ${areaName} true`); } catch (e) {}

      system.runTimeout(() => {
        try {
          if (subResp.selection === 2 || !isIslandPhysicallyBuilt(targetDim, loc.center)) {
            const placed = buildThemedIsland(targetDim, theme, loc.center);
            if (placed > 0) world.setDynamicProperty(`island_built_${theme.id}`, true);
          }
        } catch (be) {}
        try { targetDim.runCommand(`tickingarea remove ${areaName}`); } catch (e) {}
      }, 10);

      if (isPhotoAngle) {
        player.sendMessage(`\n${theme.color}📸 [Photo Studio] Teleported to §l${theme.name}§r${theme.color} Scenic Viewpoint!`);
        player.sendMessage(`§eCamera: §b(${destPos.x}, ${destPos.y}, ${destPos.z}) §7looking towards center §b(${loc.center.x}, ${loc.center.y}, ${loc.center.z})`);
        player.sendMessage(`§aTip: Hide HUD (F1 or Settings) and adjust FOV to 70° for magazine-quality screenshots!\n`);
      } else if (subResp.selection === 1) {
        player.sendMessage(`\n${theme.color}📍 [Island Inspector] Landed on §l${theme.name}§r${theme.color} core at (${destPos.x}, ${destPos.y}, ${destPos.z})!\n`);
      } else {
        player.sendMessage(`\n${theme.color}🔨 [Island Inspector] Re-generated §l${theme.name}§r${theme.color}!\n`);
      }
      player.playSound("mob.endermen.portal", { pitch: 1.2, volume: 1.0 });
    });
  } catch (e) {}
}

export function giveAdminInspectorTool(player) {
  try {
    const inv = player.getComponent("minecraft:inventory")?.container;
    if (!inv) return;

    let hasCompass = false;
    let hasRunner = false;

    for (let i = 0; i < inv.size; i++) {
      const it = inv.getItem(i);
      if (it && it.nameTag) {
        if (it.nameTag.includes("Island Inspector")) hasCompass = true;
        if (it.nameTag.includes("Auto-Break Runner")) hasRunner = true;
      }
    }

    if (!hasCompass) {
      const compass = new ItemStack("minecraft:compass", 1);
      compass.nameTag = "§6§lIsland Inspector Compass§r";
      compass.setLore([
        "§e[Admin Inspection Tool]",
        "§aRight-click to open Island Inspector GUI!",
        "§bTeleport to any of the 43 secret void islands",
        "§dor pre-generate all of them with 1 click."
      ]);
      inv.addItem(compass);
    }

    if (!hasRunner) {
      const runner = new ItemStack("minecraft:nether_star", 1);
      runner.nameTag = "§e⚡ §6§lAuto-Break Runner§r";
      runner.setLore([
        "§e[Admin Testing Tool]",
        "§aRight-click or Tap Screen to Start/Stop!",
        "§bRapidly mines OneBlock at 10 blocks/sec",
        "§dSummons islands with starlight trails & advances phases."
      ]);
      inv.addItem(runner);
    }
  } catch (e) {}
}
