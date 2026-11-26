import { MolangVariableMap } from "@minecraft/server";
import { BURST_TICK, FULL_TICKS, OVER_TICKS, powerOf } from "./elements.js";

const SMALL = "aln:ss_small";
const MID = "aln:ss_mid";
const BIG = "aln:ss_big";
const PULL_HAND = "aln:ss_pull_hand";
const PULL_ORB = "aln:ss_pull_orb";
const PULL_VOID = "aln:ss_pull_void";
const PULL_CORE = "aln:ss_pull_core";

export function puff(dimension, id, location, color) {
  try {
    const vars = new MolangVariableMap();
    vars.setColorRGB("variable.color", color);
    dimension.spawnParticle(id, location, vars);
  } catch (e) {}
}

export function sound(dimension, id, location) {
  try {
    dimension.playSound(id, location);
  } catch (e) {}
}

function cross(a, b) {
  return { x: a.y * b.z - a.z * b.y, y: a.z * b.x - a.x * b.z, z: a.x * b.y - a.y * b.x };
}

export function basisOf(view) {
  const rl = Math.hypot(view.z, view.x) || 1;
  const right = { x: -view.z / rl, y: 0, z: view.x / rl };
  const up = cross(right, view);
  return { right, up };
}

export function handPoint(player, view) {
  const loc = player.location;
  return {
    x: loc.x + view.x * 0.9,
    y: loc.y + 1.2 + view.y * 0.9,
    z: loc.z + view.z * 0.9,
  };
}

function ring(dimension, center, view, radius, count, spin, id, color) {
  const { right, up } = basisOf(view);
  for (let i = 0; i < count; i++) {
    const a = spin + (i * Math.PI * 2) / count;
    const c = Math.cos(a) * radius;
    const s = Math.sin(a) * radius;
    puff(
      dimension,
      id,
      {
        x: center.x + right.x * c + up.x * s,
        y: center.y + right.y * c + up.y * s,
        z: center.z + right.z * c + up.z * s,
      },
      color
    );
  }
}

export function shell(dimension, center, radius, count, id, color) {
  for (let i = 0; i < count; i++) {
    const u = Math.random() * 2 - 1;
    const t = Math.random() * Math.PI * 2;
    const r = Math.sqrt(1 - u * u);
    puff(
      dimension,
      id,
      { x: center.x + Math.cos(t) * r * radius, y: center.y + u * radius, z: center.z + Math.sin(t) * r * radius },
      color
    );
  }
}

export function phaseOf(held) {
  if (held >= OVER_TICKS) return 4;
  if (held >= BURST_TICK) return 3;
  if (held >= 24) return 2;
  return 1;
}

function energyHands(dimension, player, center, view, held, color) {
  const { right, up } = basisOf(view);
  const loc = player.location;
  const k = Math.min(held / FULL_TICKS, 1);
  const spread = held >= BURST_TICK ? 0.8 : 0.65 - 0.35 * k;
  const at = (a, b, c) => ({
    x: center.x + right.x * a + up.x * b + view.x * c,
    y: center.y + right.y * a + up.y * b + view.y * c,
    z: center.z + right.z * a + up.z * b + view.z * c,
  });
  for (const side of [-1, 1]) {
    const palm = at(side * spread, -0.12, -0.12);
    puff(dimension, MID, palm, color);
    for (let f = 0; f < 4; f++) {
      const rise = -0.12 + f * 0.1;
      for (let j = 1; j <= 3; j++) {
        const t = j / 3;
        puff(dimension, SMALL, at(side * spread * (1 - 0.45 * t), rise, -0.12 + 0.24 * t), color);
      }
    }
    const shoulder = { x: loc.x + right.x * side * 0.38, y: loc.y + 1.3, z: loc.z + right.z * side * 0.38 };
    for (let j = 1; j <= 5; j++) {
      const t = j / 6;
      puff(
        dimension,
        SMALL,
        {
          x: shoulder.x + (palm.x - shoulder.x) * t,
          y: shoulder.y + (palm.y - shoulder.y) * t,
          z: shoulder.z + (palm.z - shoulder.z) * t,
        },
        color
      );
    }
  }
}

export function renderCharge(player, held, mode) {
  const dimension = player.dimension;
  const view = player.getViewDirection();
  const center = handPoint(player, view);
  const phase = phaseOf(held);
  if (held % 2 === 0) energyHands(dimension, player, center, view, held, mode.color);
  if (phase === 1) {
    if (held % 2 === 0) ring(dimension, center, view, 0.55, 8, held * 0.25, SMALL, mode.color);
    if (held % 6 === 0) puff(dimension, PULL_HAND, center, mode.color);
  } else if (phase === 2) {
    const k = (held - 24) / (FULL_TICKS - 24);
    ring(dimension, center, view, 0.55 * (1 - k) + 0.04, 6, held * (0.5 + k * 1.5), SMALL, mode.color);
    puff(dimension, MID, center, { red: 1, green: 1, blue: 1 });
    if (held % 2 === 0) puff(dimension, PULL_HAND, center, mode.color);
  } else {
    if (held === BURST_TICK) {
      shell(dimension, center, 0.9, 30, MID, mode.color);
      ring(dimension, center, view, 0.9, 16, 0, BIG, mode.color);
      sound(dimension, `${mode.sfx}.burst`, center);
    }
    puff(dimension, BIG, center, mode.color);
    shell(dimension, center, 0.55 * Math.max(powerOf(held), 0.5), 8, SMALL, mode.color);
    if (phase === 4 && held % 3 === 0) shell(dimension, center, 0.8, 4, MID, { red: 1, green: 1, blue: 1 });
  }
}

export function impactBurst(dimension, center, radius, color) {
  shell(dimension, center, radius * 0.6, 40, MID, color);
  shell(dimension, center, radius * 0.3, 12, BIG, color);
  for (let i = 0; i < 24; i++) {
    const a = (i * Math.PI * 2) / 24;
    puff(dimension, SMALL, { x: center.x + Math.cos(a) * radius, y: center.y + 0.2, z: center.z + Math.sin(a) * radius }, color);
  }
}

export function orbTrail(dimension, center, color, age) {
  puff(dimension, BIG, center, color);
  if (age % 2 === 0) puff(dimension, PULL_ORB, center, color);
  const a = age * 0.9;
  puff(dimension, SMALL, { x: center.x + Math.cos(a) * 0.5, y: center.y + Math.sin(a * 1.3) * 0.5, z: center.z + Math.sin(a) * 0.5 }, color);
  puff(dimension, SMALL, { x: center.x - Math.cos(a) * 0.5, y: center.y - Math.sin(a * 1.3) * 0.5, z: center.z - Math.sin(a) * 0.5 }, color);
}

export function voidSwirl(dimension, center, radius, color, tick) {
  const k = 1 - (tick % 30) / 30;
  const r = radius * k;
  for (let i = 0; i < 8; i++) {
    const a = tick * 0.35 + (i * Math.PI) / 4;
    puff(dimension, SMALL, { x: center.x + Math.cos(a) * r, y: center.y + Math.sin(a * 0.5) * r * 0.4, z: center.z + Math.sin(a) * r }, color);
  }
  puff(dimension, BIG, center, color);
  if (tick % 2 === 0) puff(dimension, PULL_VOID, center, color);
  if (tick > 80) puff(dimension, PULL_CORE, center, color);
}
