import { world, system } from "@minecraft/server";
import { PHASE_COUNT, phaseName, phaseIndexFor, pickBlock } from "./phases.js";

/* ------------------------------ Configuration ------------------------------ */
const ORIGIN = { x: 0, y: 50, z: 0 };             // the central block
const ABOVE_ORIGIN = { x: 0.5, y: 51, z: 0.5 };   // merchant spawn point
const COUNT_KEY = "total_blocks_broken";
const MERCHANT_EVERY = 250;
const MERCHANT_TICKS = 1200;                       // 60 seconds
const MERCHANT_TAG = "ob_merchant";

/* --------------------------------- State ----------------------------------- */
let total = 0;
let ready = false;
let hudQuiet = 0; // tick until which the HUD stays quiet (merchant announcement)

const overworld = () => world.getDimension("overworld");

function saveTotal() {
  try {
    world.setDynamicProperty(COUNT_KEY, total);
  } catch (e) {}
}

/* ----------------------- Regeneration and progression ----------------------- */
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
    } catch (e) {}
  }
  hudQuiet = system.currentTick + 100;
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

  system.run(() => {
    try {
      placeNext();
      if (total % MERCHANT_EVERY === 0) spawnMerchant();
    } catch (e) {}
  });
  if (after !== before) announcePhase(after);
});

/* ----------------------------- HUD and origin check (20 ticks) ----------------------------- */
system.runInterval(() => {
  if (!ready) return;

  // Fallback: if the origin vanished some other way (explosion, piston...), bring it back without counting it.
  try {
    const block = overworld().getBlock(ORIGIN);
    if (block && block.isAir) placeNext();
  } catch (e) {}

  if (system.currentTick < hudQuiet) return;

  const index = phaseIndexFor(total);
  const text =
    "§6[ ONE-BLOCK ECONOMY ] §fBlocks: " + total + " §8| §ePhase " + (index + 1) + "/" + PHASE_COUNT + " §8| §b" + phaseName(index);
  for (const player of world.getAllPlayers()) {
    try {
      player.onScreenDisplay.setActionBar(text);
    } catch (e) {}
  }
}, 20);

/* ---------------------------------- Startup ---------------------------------- */
system.run(() => {
  try {
    const saved = world.getDynamicProperty(COUNT_KEY);
    total = typeof saved === "number" ? saved : 0;
  } catch (e) {}
  try {
    world.setDefaultSpawnLocation({ x: 0, y: 52, z: 0 });
  } catch (e) {}
  try {
    for (const e of overworld().getEntities({ tags: [MERCHANT_TAG] })) e.remove();
  } catch (e) {}
  ready = true;
});
