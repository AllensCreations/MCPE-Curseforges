import { world, Block } from "@minecraft/server";
import { DIM_CODES, MAX_HOPPERS, MAX_RECEIVERS, PROP_LINKS } from "./constants.js";

export interface KeyInfo {
  dimensionId: string;
  x: number;
  y: number;
  z: number;
}

export type ToggleResult = "added" | "removed" | "full" | "limit" | "self" | "chain";

type LinkMap = Record<string, string[]>;

let cache: LinkMap | undefined;

function load(): LinkMap {
  if (cache) return cache;
  let raw: unknown;
  try {
    raw = world.getDynamicProperty(PROP_LINKS);
  } catch {
    raw = undefined;
  }
  let parsed: unknown = {};
  if (typeof raw === "string") {
    try {
      parsed = JSON.parse(raw);
    } catch {
      parsed = {};
    }
  }
  const links: LinkMap = {};
  if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (Array.isArray(value)) {
        const list = value.filter((entry): entry is string => typeof entry === "string");
        if (list.length > 0) links[key] = list;
      }
    }
  }
  cache = links;
  return links;
}

function save(): void {
  try {
    world.setDynamicProperty(PROP_LINKS, JSON.stringify(load()));
  } catch {
    return;
  }
}

export function makeKey(dimensionId: string, x: number, y: number, z: number): string {
  const code = DIM_CODES[dimensionId] ?? dimensionId;
  return `${code}|${x}|${y}|${z}`;
}

export function blockKey(block: Block): string {
  const location = block.location;
  return makeKey(block.dimension.id, location.x, location.y, location.z);
}

export function parseKey(key: string): KeyInfo | undefined {
  const parts = key.split("|");
  if (parts.length !== 4) return undefined;
  const entry = Object.entries(DIM_CODES).find(([, code]) => code === parts[0]);
  const dimensionId = entry ? entry[0] : parts[0];
  const x = Number(parts[1]);
  const y = Number(parts[2]);
  const z = Number(parts[3]);
  if (![x, y, z].every(Number.isFinite)) return undefined;
  return { dimensionId, x, y, z };
}

export function getReceivers(senderKey: string): string[] {
  return (load()[senderKey] ?? []).slice();
}

export function hasLinks(): boolean {
  return Object.keys(load()).length > 0;
}

export function linkedHopperKeys(): string[] {
  return Object.keys(load());
}

export function isSender(key: string): boolean {
  return key in load();
}

export function isReceiver(key: string): boolean {
  return Object.values(load()).some((list) => list.includes(key));
}

export function toggleReceiver(senderKey: string, receiverKey: string): ToggleResult {
  const links = load();
  const list = links[senderKey] ?? [];
  const index = list.indexOf(receiverKey);
  if (index >= 0) {
    list.splice(index, 1);
    if (list.length === 0) delete links[senderKey];
    else links[senderKey] = list;
    save();
    return "removed";
  }
  if (receiverKey === senderKey) return "self";
  if (isSender(receiverKey)) return "chain";
  if (list.length === 0 && isReceiver(senderKey)) return "chain";
  if (list.length >= MAX_RECEIVERS) return "full";
  if (!(senderKey in links) && Object.keys(links).length >= MAX_HOPPERS) return "limit";
  list.push(receiverKey);
  links[senderKey] = list;
  save();
  return "added";
}

export function dropReceiver(senderKey: string, receiverKey: string): void {
  const links = load();
  const list = links[senderKey];
  if (!list) return;
  const index = list.indexOf(receiverKey);
  if (index < 0) return;
  list.splice(index, 1);
  if (list.length === 0) delete links[senderKey];
  save();
}

export function dropReceiverEverywhere(receiverKey: string): void {
  for (const senderKey of Object.keys(load())) {
    dropReceiver(senderKey, receiverKey);
  }
}

export function removeHopper(senderKey: string): void {
  const links = load();
  if (!(senderKey in links)) return;
  delete links[senderKey];
  save();
}
