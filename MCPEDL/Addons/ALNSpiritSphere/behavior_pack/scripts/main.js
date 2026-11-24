import { world, system } from "@minecraft/server";
import { MODES, MODE_BY_ITEM, MIN_HOLD, OVER_TICKS, state } from "./elements.js";
import { renderCharge, phaseOf } from "./visuals.js";
import { launchOrb, tickOrbs, registerHits } from "./orbs.js";
import { applyZoom, clearZoom, chargeSound } from "./charge_fx.js";

const chargers = new Map();
const PHASES = ["", "Gathering", "Compressing", "Max Charge", "Overcharged"];

function finish(source, itemStack) {
  if (!itemStack || !MODE_BY_ITEM.has(itemStack.typeId)) return;
  const entry = chargers.get(source.id);
  if (!entry || entry.fired) return;
  entry.fired = true;
  entry.doneTick = state.tick;
  clearZoom(source);
  const held = state.tick - entry.start;
  if (held >= MIN_HOLD) {
    try {
      launchOrb(source, entry.mode, held);
    } catch (e) {}
  }
}

world.afterEvents.itemStartUse.subscribe((ev) => {
  const player = ev.source;
  const mode = MODE_BY_ITEM.get(ev.itemStack?.typeId);
  if (mode === undefined) return;
  chargers.set(player.id, { player, mode, start: state.tick, fired: false, doneTick: -1, zoom: -1 });
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
      const mode = MODES[entry.mode];
      const phase = phaseOf(held);
      renderCharge(entry.player, held, mode);
      applyZoom(entry, phase);
      chargeSound(entry.player, held);
      if (held % 5 === 0) {
        const tail = held >= OVER_TICKS ? "§c" : "§f";
        entry.player.onScreenDisplay.setActionBar(`${mode.code}${mode.name} §7| ${tail}${PHASES[phase]}`);
      }
    } catch (e) {
      clearZoom(entry.player);
      chargers.delete(id);
    }
  }
  tickOrbs();
}, 1);
