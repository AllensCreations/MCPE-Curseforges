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

/* ----------------------- Foundation & Anti-Phasing ----------------------- */
// Guarantees bedrock foundation directly beneath the OneBlock so gravity blocks
// (gravel, sand) don't fall into the void, and creates an unpenetrable floor.
function ensureBedrockFoundation() {
  try {
    const floor = overworld().getBlock({ x: ORIGIN.x, y: ORIGIN.y - 1, z: ORIGIN.z });
    if (floor && floor.typeId !== "minecraft:bedrock") {
      floor.setType("minecraft:bedrock");
    }
  } catch (e) {}
}

// Elevates player standing directly on the OneBlock to prevent clipping/phasing through
function stabilizePlayer(player) {
  if (!player) return;
  try {
    const loc = player.location;
    // Check if player is on top of or slightly inside the OneBlock column
    if (Math.abs(loc.x - 0.5) < 0.9 && Math.abs(loc.z - 0.5) < 0.9 && loc.y >= ORIGIN.y - 0.2 && loc.y < ORIGIN.y + 1.5) {
      player.teleport(
        { x: loc.x, y: ORIGIN.y + 1.0, z: loc.z },
        { dimension: overworld(), checkForBlocks: false }
      );
      try {
        player.clearVelocity();
      } catch (ve) {}
    }
  } catch (e) {}
}

/* ----------------------- Regeneration and progression ----------------------- */
function placeNext() {
  ensureBedrockFoundation();
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

  const player = event.player;

  // 1. Immediately place next block synchronously in this tick (no 1-tick air gap)
  placeNext();

  // 2. Teleport player up to y=51 if standing on the block so they don't clip/phase through
  stabilizePlayer(player);

  const before = phaseIndexFor(total);
  total += 1;
  saveTotal();
  const after = phaseIndexFor(total);

  // 3. Teleport drops safely hovering above the block so they don't drop into void
  system.run(() => {
    try {
      stabilizePlayer(player);
      if (total % MERCHANT_EVERY === 0) spawnMerchant();

      const nearbyItems = overworld().getEntities({
        type: "minecraft:item",
        location: ABOVE_ORIGIN,
        maxDistance: 2.0
      });
      for (const item of nearbyItems) {
        item.teleport({ x: 0.5, y: ORIGIN.y + 1.2, z: 0.5 });
        try { item.clearVelocity(); } catch (ve) {}
      }
    } catch (e) {}
  });

  if (after !== before) announcePhase(after);
});

/* ----------------------------- HUD and origin check (20 ticks) ----------------------------- */
system.runInterval(() => {
  if (!ready) return;

  ensureBedrockFoundation();

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
      if (Math.abs(player.location.x - 0.5) < 0.9 && Math.abs(player.location.z - 0.5) < 0.9 && player.location.y < ORIGIN.y + 0.5) {
        stabilizePlayer(player);
      }
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
  ensureBedrockFoundation();
  try {
    placeNext();
  } catch (e) {}
  try {
    for (const e of overworld().getEntities({ tags: [MERCHANT_TAG] })) e.remove();
  } catch (e) {}
  ready = true;
});
