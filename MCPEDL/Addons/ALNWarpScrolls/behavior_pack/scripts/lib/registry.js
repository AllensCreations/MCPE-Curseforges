import { world } from "@minecraft/server";
import { STORE_KEY, MAX_GATES } from "./config.js";

export function shortDim(dimension) {
  return String(dimension.id).replace("minecraft:", "");
}

function isGate(entry) {
  return (
    entry !== null &&
    typeof entry === "object" &&
    typeof entry.n === "string" &&
    typeof entry.d === "string" &&
    Number.isFinite(entry.x) &&
    Number.isFinite(entry.y) &&
    Number.isFinite(entry.z)
  );
}

export function getGates() {
  const raw = world.getDynamicProperty(STORE_KEY);
  if (typeof raw !== "string") return [];
  try {
    const data = JSON.parse(raw);
    return Array.isArray(data) ? data.filter(isGate) : [];
  } catch {
    return [];
  }
}

function saveGates(list) {
  try {
    world.setDynamicProperty(STORE_KEY, JSON.stringify(list));
    return true;
  } catch {
    return false;
  }
}

function same(gate, dim, x, y, z) {
  return gate.d === dim && gate.x === x && gate.y === y && gate.z === z;
}

export function findGate(dim, x, y, z) {
  return getGates().find((gate) => same(gate, dim, x, y, z));
}

export function isFull() {
  return getGates().length >= MAX_GATES;
}

export function addGate(name, dim, x, y, z) {
  const list = getGates().filter((gate) => !same(gate, dim, x, y, z));
  if (list.length >= MAX_GATES) return false;
  list.push({ n: name, d: dim, x, y, z });
  return saveGates(list);
}

export function removeGateAt(dim, x, y, z) {
  const list = getGates();
  const gate = list.find((entry) => same(entry, dim, x, y, z));
  if (!gate) return undefined;
  saveGates(list.filter((entry) => entry !== gate));
  return gate;
}
