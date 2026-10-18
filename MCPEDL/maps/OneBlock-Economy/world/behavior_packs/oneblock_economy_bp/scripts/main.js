import { world, system } from "@minecraft/server";
import { PHASE_COUNT, phaseName, phaseIndexFor, pickBlock } from "./phases.js";

/* ------------------------------ Configuration ------------------------------ */
const ORIGIN = { x: 0, y: 50, z: 0 };             // the central block
const ABOVE_ORIGIN = { x: 0.5, y: 51, z: 0.5 };   // merchant spawn point
const HOLOGRAM_POS = { x: 0.5, y: 51.25, z: 0.5 }; // floating text anchor position
const COUNT_KEY = "total_blocks_broken";
const MERCHANT_EVERY = 250;
const MERCHANT_TICKS = 1200;                       // 60 seconds
const MERCHANT_TAG = "ob_merchant";
const HOLOGRAM_TAG = "ob_floating_text";

// 8 perimeter positions around (0, 50, 0) for starter platform expansion
const SURROUNDING_OFFSETS = [
  { x: -1, z: -1 }, { x: 0, z: -1 }, { x: 1, z: -1 },
  { x: -1, z: 0 },                    { x: 1, z: 0 },
  { x: -1, z: 1 },  { x: 0, z: 1 },  { x: 1, z: 1 }
];

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

/* ----------------------- Foundation & Platform ----------------------- */
// Guarantees bedrock foundation directly beneath the OneBlock so gravity blocks
// (gravel, sand) don't fall into the void, and creates an impenetrable base.
function ensureBedrockFoundation() {
  try {
    const floor = overworld().getBlock({ x: ORIGIN.x, y: ORIGIN.y - 1, z: ORIGIN.z });
    if (floor && floor.typeId !== "minecraft:bedrock") {
      floor.setType("minecraft:bedrock");
    }
  } catch (e) {}
}

// Starter Platform Assist: automatically expands a 3x3 platform around the central block
// during the first 8 blocks mined so players don't have to balance on 1 block or fall into the void.
function handleStarterPlatform(blockIndex) {
  if (blockIndex < SURROUNDING_OFFSETS.length) {
    const offset = SURROUNDING_OFFSETS[blockIndex];
    try {
      const targetPos = { x: ORIGIN.x + offset.x, y: ORIGIN.y, z: ORIGIN.z + offset.z };
      const sideBlock = overworld().getBlock(targetPos);
      if (sideBlock && sideBlock.isAir) {
        sideBlock.setType("minecraft:dirt");
        overworld().spawnParticle("minecraft:villager_happy", { x: targetPos.x + 0.5, y: targetPos.y + 0.5, z: targetPos.z + 0.5 });
        overworld().playSound("dig.gravel", targetPos, { volume: 0.8, pitch: 1.2 });
      }
    } catch (e) {}
  }
}

/* ----------------------- Floating Text in the Block ----------------------- */
// Renders dynamic holographic text floating directly on and above the active OneBlock altar
function updateHologram() {
  try {
    const index = phaseIndexFor(total);
    const holoText =
      "§e★ §6§lONEBLOCK ECONOMY §e★\n§fPhase " +
      (index + 1) +
      "/" +
      PHASE_COUNT +
      ": §b" +
      phaseName(index) +
      "\n§aBlocks Mined: §f" +
      total;

    const existing = overworld().getEntities({ tags: [HOLOGRAM_TAG] });
    let found = false;
    for (const ent of existing) {
      if (!found) {
        ent.nameTag = holoText;
        found = true;
      } else {
        ent.remove();
      }
    }
    if (!found) {
      const ent = overworld().spawnEntity("minecraft:armor_stand", HOLOGRAM_POS);
      ent.addTag(HOLOGRAM_TAG);
      ent.nameTag = holoText;
      try {
        ent.addEffect("invisibility", 20000000, { amplifier: 1, showParticles: false });
      } catch (e) {}
    }
  } catch (err) {}
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

  const currentCount = total;

  // 1. Immediately place next block synchronously in this tick (1-tick renewal, no air gap)
  placeNext();

  // 2. Active Player Auto-Elevation Snap & Velocity Cancel (prevents downward clipping)
  const player = event.player;
  if (player) {
    const pLoc = player.location;
    if (
      Math.abs(pLoc.x - (ORIGIN.x + 0.5)) < 0.9 &&
      Math.abs(pLoc.z - (ORIGIN.z + 0.5)) < 0.9 &&
      pLoc.y < ORIGIN.y + 1.1 &&
      pLoc.y >= ORIGIN.y - 0.2
    ) {
      system.run(() => {
        try {
          player.teleport(
            { x: pLoc.x, y: ORIGIN.y + 1.0, z: pLoc.z },
            { dimension: overworld(), checkForBlocks: false }
          );
          player.clearVelocity();
        } catch (err) {}
      });
    }
  }

  // 3. Starter Platform Assist: builds 3x3 dirt foundation around center on blocks 0-7
  handleStarterPlatform(currentCount);

  const before = phaseIndexFor(total);
  total += 1;
  saveTotal();
  const after = phaseIndexFor(total);

  // 4. Update the Floating Text in the Block
  updateHologram();

  if (total % MERCHANT_EVERY === 0) spawnMerchant();
  if (after !== before) announcePhase(after);
});

/* ----------------------------- HUD, Hologram, and origin check (20 ticks) ----------------------------- */
system.runInterval(() => {
  if (!ready) return;

  ensureBedrockFoundation();

  // Fallback: if the origin vanished some other way (explosion, piston...), bring it back without counting it.
  try {
    const block = overworld().getBlock(ORIGIN);
    if (block && block.isAir) placeNext();
  } catch (e) {}

  // Keep floating text hologram synced and active
  updateHologram();

  if (system.currentTick < hudQuiet) return;

  const index = phaseIndexFor(total);
  const text =
    "§6[ ONE-BLOCK ECONOMY ] §fBlocks: " +
    total +
    " §8| §ePhase " +
    (index + 1) +
    "/" +
    PHASE_COUNT +
    " §8| §b" +
    phaseName(index);
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
  ensureBedrockFoundation();
  try {
    placeNext();
  } catch (e) {}
  try {
    for (const e of overworld().getEntities({ tags: [MERCHANT_TAG] })) e.remove();
  } catch (e) {}
  updateHologram();
  ready = true;
});
