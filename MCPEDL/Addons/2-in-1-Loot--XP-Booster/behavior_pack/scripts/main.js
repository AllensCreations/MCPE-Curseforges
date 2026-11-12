import { world, system, EntityComponentTypes } from "@minecraft/server";
import { ModalFormData, FormCancelationReason } from "@minecraft/server-ui";

const STEPS = [1, 2, 4, 8, 16, 32];
const LOOT_KEY = "aln_loot_index";
const XP_KEY = "aln_xp_index";
const BOOK_IDS = new Set(["minecraft:book", "minecraft:writable_book"]);
const TRIGGER_NAME = "booster";
const DROP_TAG = "aln_boosted_drop";
const XP_TAG = "aln_boosted_xp";
const BLOCK_RADIUS = 1.5;
const MOB_RADIUS = 2.2;
const XP_RADIUS = 8;
const XP_INTERVAL_TICKS = 2;
const MAX_XP_SPAWNS_PER_PASS = 64;
const SPAWN_WINDOW_TICKS = 4;
const MAX_FORM_RETRIES = 8;
const EXCLUDED_BLOCKS = new Set([
  "minecraft:chest",
  "minecraft:trapped_chest",
  "minecraft:barrel",
  "minecraft:ender_chest",
]);

const recentItems = new Map();
const openMenus = new Set();

function readIndex(player, key) {
  const value = player.getDynamicProperty(key);
  return Number.isInteger(value) && value >= 0 && value < STEPS.length ? value : 0;
}

function isExcludedBlock(typeId) {
  return EXCLUDED_BLOCKS.has(typeId) || typeId.endsWith("shulker_box");
}

function stepLegend() {
  return STEPS.map((mult, index) => `${index}=${mult}x`).join("  ");
}

async function openPanel(player, attempt = 0) {
  if (attempt === 0) {
    if (openMenus.has(player.id)) return;
    openMenus.add(player.id);
  }
  const finish = () => openMenus.delete(player.id);

  const form = new ModalFormData()
    .title("§6[ ALNStudios Booster ]")
    .slider(
      `§fLoot Drop Multiplier\n§7${stepLegend()}`,
      0,
      STEPS.length - 1,
      { valueStep: 1, defaultValue: readIndex(player, LOOT_KEY) }
    )
    .slider(
      `§fXP Gain Multiplier\n§7${stepLegend()}`,
      0,
      STEPS.length - 1,
      { valueStep: 1, defaultValue: readIndex(player, XP_KEY) }
    )
    .submitButton("§aApply Booster");

  let response;
  try {
    response = await form.show(player);
  } catch (error) {
    finish();
    return;
  }

  if (response.canceled) {
    if (response.cancelationReason === FormCancelationReason.UserBusy && attempt < MAX_FORM_RETRIES) {
      system.runTimeout(() => {
        if (player.isValid) {
          openPanel(player, attempt + 1);
        } else {
          finish();
        }
      }, 10);
      return;
    }
    finish();
    return;
  }

  finish();
  if (!player.isValid) return;

  const values = response.formValues ?? [];
  const lootIndex = Math.min(STEPS.length - 1, Math.max(0, Math.round(Number(values[0]) || 0)));
  const xpIndex = Math.min(STEPS.length - 1, Math.max(0, Math.round(Number(values[1]) || 0)));

  player.setDynamicProperty(LOOT_KEY, lootIndex);
  player.setDynamicProperty(XP_KEY, xpIndex);
  player.playSound("random.orb");
  player.onScreenDisplay.setActionBar(
    `§6[BOOSTER] §aLoot: §f${STEPS[lootIndex]}x §8| §bXP: §f${STEPS[xpIndex]}x`
  );
}

world.afterEvents.itemUse.subscribe((event) => {
  const { itemStack, source } = event;
  if (!itemStack || !source || source.typeId !== "minecraft:player") return;
  if (!BOOK_IDS.has(itemStack.typeId)) return;
  const name = itemStack.nameTag;
  if (typeof name !== "string" || name.trim().toLowerCase() !== TRIGGER_NAME) return;
  openPanel(source);
});

world.afterEvents.entitySpawn.subscribe(({ entity }) => {
  if (!entity.isValid || entity.typeId !== "minecraft:item") return;
  recentItems.set(entity.id, system.currentTick);
});

system.runInterval(() => {
  const now = system.currentTick;
  for (const [id, tick] of recentItems) {
    if (now - tick > 40) recentItems.delete(id);
  }
}, 40);

function multiplyDrops(dimension, center, radius, multiplier) {
  if (multiplier <= 1) return;
  const now = system.currentTick;
  let found;
  try {
    found = dimension.getEntities({
      type: "minecraft:item",
      location: center,
      maxDistance: radius,
    });
  } catch (error) {
    return;
  }

  for (const entity of found) {
    try {
      if (!entity.isValid || entity.hasTag(DROP_TAG)) continue;
      const born = recentItems.get(entity.id);
      if (born === undefined || now - born > SPAWN_WINDOW_TICKS) continue;
      entity.addTag(DROP_TAG);

      const component = entity.getComponent(EntityComponentTypes.Item);
      const stack = component ? component.itemStack : undefined;
      if (!stack || stack.maxAmount <= 1) continue;

      let remaining = stack.amount * (multiplier - 1);
      const location = entity.location;
      while (remaining > 0) {
        const amount = Math.min(stack.maxAmount, remaining);
        const copy = stack.clone();
        copy.amount = amount;
        const spawned = dimension.spawnItem(copy, location);
        spawned.addTag(DROP_TAG);
        remaining -= amount;
      }
    } catch (error) {
      continue;
    }
  }
}

world.afterEvents.playerBreakBlock.subscribe((event) => {
  const { player, block, brokenBlockPermutation, dimension } = event;
  const multiplier = STEPS[readIndex(player, LOOT_KEY)];
  if (multiplier <= 1) return;
  if (isExcludedBlock(brokenBlockPermutation.type.id)) return;

  const origin = block.location;
  const center = { x: origin.x + 0.5, y: origin.y + 0.5, z: origin.z + 0.5 };
  system.run(() => multiplyDrops(dimension, center, BLOCK_RADIUS, multiplier));
});

world.afterEvents.entityDie.subscribe(({ deadEntity, damageSource }) => {
  const killer = damageSource ? damageSource.damagingEntity : undefined;
  if (!killer || killer.typeId !== "minecraft:player") return;
  if (deadEntity.typeId === "minecraft:player") return;

  const multiplier = STEPS[readIndex(killer, LOOT_KEY)];
  if (multiplier <= 1) return;

  const dimension = deadEntity.dimension;
  const location = deadEntity.location;
  system.run(() => multiplyDrops(dimension, location, MOB_RADIUS, multiplier));
});

system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    if (!player.isValid) continue;
    const multiplier = STEPS[readIndex(player, XP_KEY)];
    if (multiplier <= 1) continue;

    const dimension = player.dimension;
    let orbs;
    try {
      orbs = dimension.getEntities({
        type: "minecraft:xp_orb",
        location: player.location,
        maxDistance: XP_RADIUS,
      });
    } catch (error) {
      continue;
    }

    let budget = MAX_XP_SPAWNS_PER_PASS;
    for (const orb of orbs) {
      try {
        if (!orb.isValid) continue;
        if (!orb.hasTag(XP_TAG)) {
          const extra = multiplier - 1;
          if (budget < extra) continue;
          orb.addTag(XP_TAG);
          for (let i = 0; i < extra; i++) {
            const bonus = dimension.spawnEntity("minecraft:xp_orb", player.location);
            bonus.addTag(XP_TAG);
          }
          budget -= extra;
        }
        orb.teleport(player.location);
      } catch (error) {
        continue;
      }
    }
  }
}, XP_INTERVAL_TICKS);
