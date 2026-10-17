import { world, system } from "@minecraft/server";
import { PHASE_COUNT, phaseName, phaseIndexFor, pickBlock } from "./phases.js";

/* ------------------------------ Configuration ------------------------------ */
const ORIGIN = { x: 0, y: 64, z: 0 };            // the central block
const ABOVE_ORIGIN = { x: 0.5, y: 65, z: 0.5 };  // merchant spawn and void rescue point
const COUNT_KEY = "total_blocks_broken";
const MERCHANT_EVERY = 250;
const MERCHANT_TICKS = 1200;                      // 60 seconds
const MERCHANT_TAG = "ob_merchant";
const VOID_Y = -50;
const VOID_DAMAGE = 10;

/* --------------------------------- State ----------------------------------- */
let total = 0;
let ready = false;
const hudPause = new Map(); // player id -> tick until which the HUD stays quiet

const overworld = () => world.getDimension("overworld");

function saveTotal() {
  try {
    world.setDynamicProperty(COUNT_KEY, total);
  } catch (e) {}
}

function pauseHud(player, ticks) {
  hudPause.set(player.id, system.currentTick + ticks);
}

/* ----------------------- Regeneration and progression ----------------------- */
// Puts the next block for the current phase on the origin. Returns false if the chunk is unloaded.
function placeNext() {
  const block = overworld().getBlock(ORIGIN);
  if (!block) return false;
  block.setType(pickBlock(phaseIndexFor(total)));
  return true;
}

function announcePhase(index) {
  const title = "§6[PHASE UNLOCKED] §fPhase " + (index + 1) + ": " + phaseName(index);
  for (const player of world.getAllPlayers()) {
    try {
      player.onScreenDisplay.setTitle(title);
      player.playSound("random.levelup");
    } catch (e) {}
  }
}

/* ---------------------------------- Merchant --------------------------------- */
function spawnMerchant() {
  let trader;
  try {
    trader = overworld().spawnEntity("minecraft:wandering_trader", ABOVE_ORIGIN);
    trader.addTag(MERCHANT_TAG);
    // Slowness 255 keeps the trader standing on the origin instead of wandering into the void.
    trader.addEffect("slowness", MERCHANT_TICKS + 100, { amplifier: 255, showParticles: false });
  } catch (e) {
    return;
  }
  for (const player of world.getAllPlayers()) {
    try {
      player.onScreenDisplay.setActionBar("§a[MERCHANT] §fA Wandering Trader has arrived for 60 seconds!");
      pauseHud(player, 100);
    } catch (e) {}
  }
  system.runTimeout(() => {
    try {
      trader.remove();
    } catch (e) {}
  }, MERCHANT_TICKS);
}

/* -------------------------------- Event hooks -------------------------------- */
world.afterEvents.playerBreakBlock.subscribe((event) => {
  if (!ready) return;
  const b = event.block;
  if (b.dimension.id !== "minecraft:overworld" || b.x !== ORIGIN.x || b.y !== ORIGIN.y || b.z !== ORIGIN.z) return;

  const before = phaseIndexFor(total);
  total += 1;
  saveTotal();
  const after = phaseIndexFor(total);

  // Regenerate on the next tick.
  system.run(() => {
    try {
      placeNext();
      if (total % MERCHANT_EVERY === 0) spawnMerchant();
    } catch (e) {}
  });
  if (after !== before) announcePhase(after);
});

world.afterEvents.playerLeave.subscribe((event) => {
  hudPause.delete(event.playerId);
});

/* ----------------------------- Void safeguard (10 ticks) ----------------------------- */
system.runInterval(() => {
  if (!ready) return;
  for (const player of world.getAllPlayers()) {
    try {
      if (player.location.y >= VOID_Y) continue;
      player.teleport(ABOVE_ORIGIN, { dimension: overworld() });
      try {
        player.clearVelocity();
      } catch (e) {}
      // The safety tax never kills: it leaves at least half a heart.
      const health = player.getComponent("minecraft:health");
      const damage = health ? Math.min(VOID_DAMAGE, Math.max(0, health.currentValue - 1)) : VOID_DAMAGE;
      if (damage > 0) player.applyDamage(damage);
      player.playSound("mob.enderdragon.hit");
      player.onScreenDisplay.setActionBar("§c[VOID SAVIOR] §fSaved from the abyss! Safety tax applied.");
      pauseHud(player, 60);
    } catch (e) {}
  }
}, 10);

/* ----------------------------- HUD and origin check (20 ticks) ----------------------------- */
system.runInterval(() => {
  if (!ready) return;
  const now = system.currentTick;

  // Fallback: if the origin vanished some other way (explosion, piston...), bring it back without counting it.
  try {
    const block = overworld().getBlock(ORIGIN);
    if (block && block.isAir) placeNext();
  } catch (e) {}

  const index = phaseIndexFor(total);
  const text =
    "§6[ ONE-BLOCK ECONOMY ] §fBlocks: " + total + " §8| §ePhase " + (index + 1) + "/" + PHASE_COUNT + " §8| §b" + phaseName(index);
  for (const player of world.getAllPlayers()) {
    try {
      if ((hudPause.get(player.id) || 0) > now) continue;
      player.onScreenDisplay.setActionBar(text);
    } catch (e) {}
  }
}, 20);

/* ---------------------------------- Startup ---------------------------------- */
// Runs on the first tick, when world state can be read safely.
system.run(() => {
  try {
    const saved = world.getDynamicProperty(COUNT_KEY);
    total = typeof saved === "number" ? saved : 0;
  } catch (e) {}
  try {
    world.setDefaultSpawnLocation({ x: 0, y: 65, z: 0 });
  } catch (e) {}
  try {
    // Clear any trader left over from before a reload.
    for (const e of overworld().getEntities({ tags: [MERCHANT_TAG] })) e.remove();
  } catch (e) {}
  ready = true;
});
