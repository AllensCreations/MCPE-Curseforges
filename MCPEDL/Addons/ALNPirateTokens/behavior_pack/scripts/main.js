import { world, system } from "@minecraft/server";
import { IDS, COMPASS_NAME, BREEZE_NAME } from "./config.js";
import { inventoryOf } from "./vault.js";
import { registerDrops, holdsCutlass } from "./drops.js";
import { openLedger, openCrates } from "./ui.js";

const compassCooldown = new Map();
const crateCooldown = new Map();
const CRATE_BLOCK = "aln:mystery_crate";

function locate(player) {
  const now = system.currentTick;
  if (now - (compassCooldown.get(player.id) ?? -200) < 100) return;
  compassCooldown.set(player.id, now);
  const structure = player.isSneaking ? "shipwreck" : "buriedtreasure";
  player.onScreenDisplay.setActionBar("§bThe compass needle spins... check the chat for coordinates.");
  player.playSound("random.orb");
  try {
    player.runCommand(`locate structure ${structure}`);
  } catch (e) {}
}

function drinkBreeze(player) {
  const c = inventoryOf(player);
  const slot = player.selectedSlotIndex;
  const it = c?.getItem(slot);
  if (!it) return;
  if (it.amount > 1) {
    it.amount -= 1;
    c.setItem(slot, it);
  } else {
    c.setItem(slot, undefined);
  }
  player.addEffect("dolphins_grace", 6000, { amplifier: 0, showParticles: true });
  player.addEffect("water_breathing", 6000, { amplifier: 0, showParticles: true });
  player.playSound("random.drink");
  player.onScreenDisplay.setActionBar("§bSea Breeze: Dolphin's Grace and Water Breathing for 5 minutes");
}

world.afterEvents.itemUse.subscribe((ev) => {
  const player = ev.source;
  if (!player || player.typeId !== "minecraft:player") return;
  const item = ev.itemStack;
  try {
    if (item.typeId === IDS.ledger) {
      openLedger(player);
    } else if (item.typeId === "minecraft:compass" && item.nameTag && item.nameTag.includes(COMPASS_NAME)) {
      locate(player);
    } else if (item.typeId === "minecraft:glass_bottle" && item.nameTag && item.nameTag.includes(BREEZE_NAME)) {
      drinkBreeze(player);
    }
  } catch (e) {}
});

world.beforeEvents.playerInteractWithBlock.subscribe((ev) => {
  if (ev.block.typeId !== CRATE_BLOCK) return;
  const player = ev.player;
  if (player.isSneaking) return;
  ev.cancel = true;
  const now = system.currentTick;
  if (now - (crateCooldown.get(player.id) ?? -20) < 10) return;
  crateCooldown.set(player.id, now);
  system.run(() => openCrates(player));
});

system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    try {
      if (player.isInWater && holdsCutlass(player)) {
        player.addEffect("speed", 60, { amplifier: 1, showParticles: false });
        player.addEffect("dolphins_grace", 60, { amplifier: 0, showParticles: false });
      }
    } catch (e) {}
  }
}, 20);

registerDrops();
