import { world, system, EntityComponentTypes } from "@minecraft/server";
import { FOCUS_ID, MODES, MIN_HOLD, OVER_TICKS, state, modeIndexOf } from "./elements.js";
import { renderCharge, phaseOf } from "./visuals.js";
import { launchOrb, tickOrbs, registerHits } from "./orbs.js";

const chargers = new Map();
const PHASES = ["", "Gathering", "Compressing", "Max Charge", "Overcharged"];

function syncLore(player, index) {
  const mode = MODES[index];
  const lore = [`${mode.code}Mode: ${mode.name}`, `§7${mode.lore}`, "§8Sneak + use to switch element"];
  try {
    const inv = player.getComponent(EntityComponentTypes.Inventory)?.container;
    if (!inv) return;
    for (let i = 0; i < inv.size; i++) {
      const item = inv.getItem(i);
      if (item?.typeId === FOCUS_ID) {
        item.setLore(lore);
        inv.setItem(i, item);
      }
    }
  } catch (e) {}
}

function cycleMode(player) {
  const next = (modeIndexOf(player) + 1) % MODES.length;
  state.modes.set(player.id, next);
  syncLore(player, next);
  const mode = MODES[next];
  try {
    player.onScreenDisplay.setActionBar(`${mode.code}Element: ${mode.name}`);
    player.playSound("random.orb");
  } catch (e) {}
}

function finish(source, itemStack) {
  if (!itemStack || itemStack.typeId !== FOCUS_ID) return;
  const entry = chargers.get(source.id);
  if (!entry || entry.fired) return;
  entry.fired = true;
  entry.doneTick = state.tick;
  const held = state.tick - entry.start;
  if (held >= MIN_HOLD) {
    try {
      launchOrb(source, modeIndexOf(source), held);
    } catch (e) {}
  }
}

world.afterEvents.itemStartUse.subscribe((ev) => {
  const player = ev.source;
  if (!ev.itemStack || ev.itemStack.typeId !== FOCUS_ID) return;
  if (player.isSneaking) {
    cycleMode(player);
    chargers.set(player.id, { player, start: state.tick, fired: true, doneTick: state.tick });
    return;
  }
  chargers.set(player.id, { player, start: state.tick, fired: false, doneTick: -1 });
});

world.afterEvents.itemReleaseUse.subscribe((ev) => finish(ev.source, ev.itemStack));
world.afterEvents.itemStopUse.subscribe((ev) => finish(ev.source, ev.itemStack));

registerHits();

system.runInterval(() => {
  state.tick++;
  for (const [id, entry] of chargers) {
    if (entry.fired) {
      if (state.tick - entry.doneTick > 3) chargers.delete(id);
      continue;
    }
    try {
      const held = state.tick - entry.start;
      const mode = MODES[modeIndexOf(entry.player)];
      renderCharge(entry.player, held, mode);
      if (held % 5 === 0) {
        const phase = phaseOf(held);
        const tail = held >= OVER_TICKS ? "§c" : "§f";
        entry.player.onScreenDisplay.setActionBar(`${mode.code}${mode.name} §7| ${tail}${PHASES[phase]}`);
      }
    } catch (e) {
      chargers.delete(id);
    }
  }
  tickOrbs();
}, 1);
