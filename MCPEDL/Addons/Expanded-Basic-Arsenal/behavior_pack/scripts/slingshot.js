import { world, system } from "@minecraft/server";
import { isCreative, heldItem, findAmmo, takeOne, wearHeldItem, muzzle, shoot } from "./lib/common.js";

const SLINGSHOT = "aln:slingshot";
const PEBBLE = "aln:slingshot_pebble";
const FLINT = "minecraft:flint";
const COBBLESTONE = "minecraft:cobblestone";
const STAGE_START = [0, 1, 9, 19];
const STAGE_SPEED = [0, 0.9, 1.6, 2.4];
const STAGE_EVENT = [undefined, undefined, "aln:set_damage_4", "aln:set_damage_6"];
const FLINT_EVENT = "aln:set_damage_8";
const STATES = ["aln_slingshot_0", "aln_slingshot_1", "aln_slingshot_2", "aln_slingshot_3"];
const BAR_REFRESH = 40;
const PEBBLE_LIFETIME = 100;

const charging = new Map();
let timer;

function stageOf(held) {
  let stage = 0;
  for (let i = 1; i < STAGE_START.length; i++) {
    if (held >= STAGE_START[i]) stage = i;
  }
  return stage;
}

function showBar(player, stage) {
  player.onScreenDisplay.setActionBar("§7Slingshot: §a[" + "|".repeat(stage) + " ".repeat(3 - stage) + "]");
}

function setStateTag(player, stage) {
  for (const tag of STATES) player.removeTag(tag);
  player.addTag(STATES[stage]);
}

function clearState(id) {
  const state = charging.get(id);
  charging.delete(id);
  if (state?.player.isValid) {
    for (const tag of STATES) state.player.removeTag(tag);
  }
}

function holdingSlingshot(player) {
  return heldItem(player)?.typeId === SLINGSHOT;
}

function stopTimerIfIdle() {
  if (charging.size === 0 && timer !== undefined) {
    system.clearRun(timer);
    timer = undefined;
  }
}

function tick() {
  const now = system.currentTick;
  for (const [id, state] of charging) {
    const player = state.player;
    if (!player.isValid || !holdingSlingshot(player)) {
      clearState(id);
      continue;
    }
    const stage = stageOf(now - state.startTick);
    if (stage !== state.stage) {
      state.stage = stage;
      setStateTag(player, stage);
      if (stage === 3) player.playSound("random.click");
      showBar(player, stage);
      state.nextBar = now + BAR_REFRESH;
    } else if (stage > 0 && now >= state.nextBar) {
      showBar(player, stage);
      state.nextBar = now + BAR_REFRESH;
    }
  }
  stopTimerIfIdle();
}

function launch(player, stage) {
  const creative = isCreative(player);
  const ammo = findAmmo(player, [FLINT, COBBLESTONE]);
  if (!ammo && !creative) {
    player.onScreenDisplay.setActionBar("§cNo Flint or Cobblestone");
    player.playSound("random.click");
    return;
  }
  const flint = ammo?.typeId === FLINT;
  const direction = player.getViewDirection();
  const pebble = player.dimension.spawnEntity(PEBBLE, muzzle(player, 0.9));
  try {
    const event = stage === 3 && flint ? FLINT_EVENT : STAGE_EVENT[stage];
    if (event) pebble.triggerEvent(event);
    shoot(pebble, player, direction, STAGE_SPEED[stage]);
  } catch (error) {
    if (pebble.isValid) pebble.remove();
    return;
  }
  if (ammo && !creative) takeOne(player, ammo.slot);
  wearHeldItem(player, 1);
  player.playSound("random.bow");
  system.runTimeout(() => {
    if (pebble.isValid) pebble.remove();
  }, PEBBLE_LIFETIME);
}

world.afterEvents.itemStartUse.subscribe(({ source, itemStack }) => {
  if (itemStack?.typeId !== SLINGSHOT) return;
  clearState(source.id);
  charging.set(source.id, { player: source, startTick: system.currentTick, stage: 0, nextBar: 0 });
  setStateTag(source, 0);
  if (timer === undefined) timer = system.runInterval(tick, 1);
});

world.afterEvents.itemReleaseUse.subscribe(({ source, itemStack }) => {
  const state = charging.get(source.id);
  if (!state || itemStack?.typeId !== SLINGSHOT) return;
  const stage = stageOf(system.currentTick - state.startTick);
  clearState(source.id);
  stopTimerIfIdle();
  if (stage > 0) launch(source, stage);
});
