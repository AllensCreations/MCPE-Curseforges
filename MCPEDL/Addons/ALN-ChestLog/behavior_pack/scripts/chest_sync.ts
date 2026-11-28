import {
  world,
  system,
  ItemStack,
  EnchantmentType,
  BlockInventoryComponent,
  EntityInventoryComponent,
} from "@minecraft/server";
import type { Container, Dimension, Player, Vector3 } from "@minecraft/server";
import { FormCancelationReason } from "@minecraft/server-ui";
import type {
  ActionFormData,
  ActionFormResponse,
  ModalFormData,
  ModalFormResponse,
} from "@minecraft/server-ui";

export const ITEM_ID = "aln:chest_log";
export const PACK_NAME = "ChestLog";
export const PACK_VERSION = "5.0.0";
export const CONTAINER_TYPES = new Set<string>([
  "minecraft:chest",
  "minecraft:trapped_chest",
  "minecraft:barrel",
]);

export interface ItemRecord {
  typeId: string;
  amount: number;
  nameTag?: string;
  lore?: string[];
  damage?: number;
  enchantments?: { id: string; level: number }[];
}

export interface ChestEntry {
  id: string;
  owner: string;
  created: number;
  name: string;
  dimensionId: string;
  location: Vector3;
  partner?: Vector3;
  pendingQueue: ItemRecord[];
  known: string[];
  autoSort?: boolean;
}

export interface DepositStep {
  slot: number;
  typeId: string;
  amount: number;
  targets: ChestEntry[];
}

export interface DepositResult {
  total: number;
  chests: number;
  failed?: boolean;
}

type Resolved =
  | { state: "unloaded" }
  | { state: "gone" }
  | { state: "loaded"; container: Container };

const PREFIX = "aln_chestlog:chest:";
const LEGACY_KEY = "aln_chestlog_list";
const MAX_KNOWN = 150;
const ALERT_COOLDOWN = 600;
const TOOL_TAGS = new Set<string>([
  "minecraft:is_tool",
  "minecraft:is_sword",
  "minecraft:is_axe",
  "minecraft:is_pickaxe",
  "minecraft:is_shovel",
  "minecraft:is_hoe",
  "minecraft:is_trident",
  "minecraft:is_shears",
  "minecraft:digger",
]);

const chests = new Map<string, ChestEntry>();
const alertTicks = new Map<string, number>();
const suppressed = new Map<string, number>();
const openMenus = new Set<string>();
const unsaved = new Set<string>();

function loadAll(): void {
  chests.clear();
  for (const key of world.getDynamicPropertyIds()) {
    if (!key.startsWith(PREFIX)) continue;
    const raw = world.getDynamicProperty(key);
    if (typeof raw !== "string") continue;
    try {
      const entry = JSON.parse(raw) as ChestEntry;
      if (entry && typeof entry.id === "string") chests.set(entry.id, entry);
    } catch {}
  }
}

export function saveEntry(entry: ChestEntry): boolean {
  try {
    world.setDynamicProperty(PREFIX + entry.id, JSON.stringify(entry));
    chests.set(entry.id, entry);
    return true;
  } catch {
    return false;
  }
}

function persist(entry: ChestEntry): boolean {
  if (saveEntry(entry)) {
    unsaved.delete(entry.id);
    return true;
  }
  unsaved.add(entry.id);
  return false;
}

export function deleteEntry(entry: ChestEntry): void {
  try {
    world.setDynamicProperty(PREFIX + entry.id, undefined);
  } catch {}
  chests.delete(entry.id);
  unsaved.delete(entry.id);
}

export function getEntry(id: string): ChestEntry | undefined {
  return chests.get(id);
}

export function newId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function chestsOf(player: Player): ChestEntry[] {
  return Array.from(chests.values())
    .filter((entry) => entry.owner === player.id)
    .sort((a, b) => (a.created ?? 0) - (b.created ?? 0));
}

function sameLocation(a: Vector3 | undefined, b: Vector3 | undefined): boolean {
  return !!a && !!b && a.x === b.x && a.y === b.y && a.z === b.z;
}

export function findEntry(dimensionId: string, location: Vector3): ChestEntry | undefined {
  for (const entry of chests.values()) {
    if (
      entry.dimensionId === dimensionId &&
      (sameLocation(entry.location, location) || sameLocation(entry.partner, location))
    ) {
      return entry;
    }
  }
  return undefined;
}

function migratePlayer(player: Player): void {
  const raw = player.getDynamicProperty(LEGACY_KEY);
  if (typeof raw !== "string") return;
  try {
    const legacy = JSON.parse(raw) as ChestEntry[];
    if (Array.isArray(legacy)) {
      for (const entry of legacy) {
        if (!entry || typeof entry.id !== "string" || chests.has(entry.id)) continue;
        entry.owner = player.id;
        entry.created = entry.created ?? Date.now();
        saveEntry(entry);
      }
    }
    player.setDynamicProperty(LEGACY_KEY, undefined);
  } catch {}
}

export function lockPlayer(player: Player): boolean {
  if (openMenus.has(player.id)) return false;
  openMenus.add(player.id);
  return true;
}

export function unlockPlayer(player: Player): void {
  openMenus.delete(player.id);
}

export function callOptional(form: object, method: string, ...args: unknown[]): void {
  try {
    const fn = (form as Record<string, unknown>)[method];
    if (typeof fn === "function") fn.apply(form, args);
  } catch {}
}

export async function showForm(form: ActionFormData, player: Player): Promise<ActionFormResponse | undefined>;
export async function showForm(form: ModalFormData, player: Player): Promise<ModalFormResponse | undefined>;
export async function showForm(
  form: ActionFormData | ModalFormData,
  player: Player
): Promise<ActionFormResponse | ModalFormResponse | undefined> {
  for (let attempt = 0; attempt < 6; attempt++) {
    let response: ActionFormResponse | ModalFormResponse;
    try {
      response = await form.show(player);
    } catch {
      return undefined;
    }
    if (response.canceled && response.cancelationReason === FormCancelationReason.UserBusy) {
      await new Promise<void>((resolve) => system.runTimeout(resolve, 10));
      continue;
    }
    return response;
  }
  return undefined;
}

export function markSuppressed(player: Player): void {
  suppressed.set(player.id, system.currentTick);
}

export function isSuppressed(player: Player): boolean {
  const tick = suppressed.get(player.id);
  return tick !== undefined && system.currentTick - tick <= 3;
}

export function dimensionColor(dimensionId: string): string {
  if (dimensionId.includes("nether")) return "§c";
  if (dimensionId.includes("the_end")) return "§d";
  return "§a";
}

export function dimensionLabel(dimensionId: string): string {
  if (dimensionId.includes("nether")) return "Nether";
  if (dimensionId.includes("the_end")) return "The End";
  return "Overworld";
}

export function coloredName(entry: ChestEntry): string {
  return dimensionColor(entry.dimensionId) + entry.name;
}

export function plainName(entry: ChestEntry): string {
  return `${entry.name} [${dimensionLabel(entry.dimensionId)}]`;
}

export function itemDisplayName(item: ItemStack): string {
  if (item.nameTag) return item.nameTag;
  return item.typeId
    .replace(/^[^:]+:/, "")
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function getInventory(player: Player): Container | undefined {
  const component = player.getComponent(EntityInventoryComponent.componentId) as
    | EntityInventoryComponent
    | undefined;
  return component ? component.container : undefined;
}

function notifyOwner(entry: ChestEntry, text: string): void {
  const owner = world.getAllPlayers().find((player) => player.id === entry.owner);
  if (owner) owner.onScreenDisplay.setActionBar(text);
}

function containerAt(dimension: Dimension, location: Vector3): Resolved {
  const block = dimension.getBlock(location);
  if (!block) return { state: "unloaded" };
  if (!CONTAINER_TYPES.has(block.typeId)) return { state: "gone" };
  const component = block.getComponent(BlockInventoryComponent.componentId) as
    | BlockInventoryComponent
    | undefined;
  if (!component || !component.container) return { state: "gone" };
  return { state: "loaded", container: component.container };
}

function resolveContainer(entry: ChestEntry): Resolved {
  try {
    const dimension = world.getDimension(entry.dimensionId);
    const primary = containerAt(dimension, entry.location);
    if (primary.state !== "gone" || !entry.partner) return primary;
    const secondary = containerAt(dimension, entry.partner);
    if (secondary.state === "unloaded") return secondary;
    if (secondary.state !== "loaded") return primary;
    entry.location = entry.partner;
    delete entry.partner;
    return secondary;
  } catch {
    return { state: "unloaded" };
  }
}

function serializeItem(item: ItemStack): ItemRecord {
  const record: ItemRecord = { typeId: item.typeId, amount: item.amount };
  if (item.nameTag) record.nameTag = item.nameTag;
  const lore = item.getLore();
  if (lore.length > 0) record.lore = lore;
  const durability = item.getComponent("minecraft:durability");
  if (durability && durability.damage > 0) record.damage = durability.damage;
  const enchantable = item.getComponent("minecraft:enchantable");
  if (enchantable) {
    const list = enchantable.getEnchantments();
    if (list.length > 0) {
      record.enchantments = list.map((e) => ({ id: e.type.id, level: e.level }));
    }
  }
  return record;
}

function buildStack(record: ItemRecord, amount: number): ItemStack {
  const item = new ItemStack(record.typeId, amount);
  if (record.nameTag) item.nameTag = record.nameTag;
  if (record.lore && record.lore.length > 0) item.setLore(record.lore);
  if (record.damage) {
    const durability = item.getComponent("minecraft:durability");
    if (durability) durability.damage = record.damage;
  }
  if (record.enchantments && record.enchantments.length > 0) {
    const enchantable = item.getComponent("minecraft:enchantable");
    if (enchantable) {
      for (const e of record.enchantments) {
        try {
          enchantable.addEnchantment({ type: new EnchantmentType(e.id), level: e.level });
        } catch {}
      }
    }
  }
  return item;
}

function recordKey(record: ItemRecord): string {
  return JSON.stringify([
    record.typeId,
    record.nameTag ?? "",
    record.lore ?? [],
    record.damage ?? 0,
    record.enchantments ?? [],
  ]);
}

function enqueue(entry: ChestEntry, item: ItemStack): void {
  if (!Array.isArray(entry.pendingQueue)) entry.pendingQueue = [];
  const record = serializeItem(item);
  const key = recordKey(record);
  const hit = entry.pendingQueue.find((r) => recordKey(r) === key);
  if (hit) hit.amount += record.amount;
  else entry.pendingQueue.push(record);
}

function rememberType(entry: ChestEntry, typeId: string): void {
  if (!Array.isArray(entry.known)) entry.known = [];
  if (entry.known.includes(typeId)) return;
  entry.known.push(typeId);
  if (entry.known.length > MAX_KNOWN) entry.known.shift();
}

function pendingTypes(entry: ChestEntry): string[] {
  return (entry.pendingQueue ?? []).map((r) => r.typeId);
}

export function refreshKnown(entry: ChestEntry): void {
  const resolved = resolveContainer(entry);
  if (resolved.state !== "loaded") return;
  const types = new Set<string>(pendingTypes(entry));
  const container = resolved.container;
  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (item) types.add(item.typeId);
  }
  entry.known = Array.from(types).slice(0, MAX_KNOWN);
}

function entryTypeSet(entry: ChestEntry): Set<string> {
  const resolved = resolveContainer(entry);
  if (resolved.state === "loaded") {
    refreshKnown(entry);
    return new Set(entry.known);
  }
  return new Set([...(entry.known ?? []), ...pendingTypes(entry)]);
}

function categoryOf(item: ItemStack): number {
  let tags: string[];
  try {
    tags = item.getTags();
  } catch {
    return 3;
  }
  if (tags.some((tag) => TOOL_TAGS.has(tag))) return 0;
  if (tags.includes("minecraft:is_armor")) return 1;
  if (tags.includes("minecraft:is_food")) return 2;
  return 3;
}

export function sortContainer(container: Container): void {
  const original: (ItemStack | undefined)[] = [];
  try {
    const stacks: ItemStack[] = [];
    for (let i = 0; i < container.size; i++) {
      const item = container.getItem(i);
      original.push(item);
      if (item) stacks.push(item);
    }
    const merged: ItemStack[] = [];
    for (const item of stacks) {
      let remaining = item.amount;
      for (const target of merged) {
        if (remaining <= 0) break;
        if (target.amount < target.maxAmount && target.isStackableWith(item)) {
          const move = Math.min(target.maxAmount - target.amount, remaining);
          target.amount += move;
          remaining -= move;
        }
      }
      if (remaining > 0) {
        const copy = item.clone();
        copy.amount = remaining;
        merged.push(copy);
      }
    }
    const ranked = merged.map((item) => ({ item, category: categoryOf(item) }));
    ranked.sort(
      (a, b) =>
        a.category - b.category ||
        a.item.typeId.localeCompare(b.item.typeId) ||
        b.item.amount - a.item.amount
    );
    if (ranked.length > container.size) return;
    for (let i = 0; i < container.size; i++) {
      container.setItem(i, i < ranked.length ? ranked[i].item : undefined);
    }
  } catch {
    try {
      for (let i = 0; i < original.length; i++) container.setItem(i, original[i]);
    } catch {}
  }
}

function sortEntry(entry: ChestEntry): void {
  if (entry.autoSort === false) return;
  const resolved = resolveContainer(entry);
  if (resolved.state === "loaded") sortContainer(resolved.container);
}

function depositItem(entry: ChestEntry, part: ItemStack): { stored: number; queued: boolean } {
  const amount = part.amount;
  const resolved = resolveContainer(entry);
  if (resolved.state === "loaded") {
    let rest: ItemStack | undefined;
    try {
      rest = resolved.container.addItem(part);
    } catch {
      return { stored: 0, queued: false };
    }
    rememberType(entry, part.typeId);
    return { stored: amount - (rest ? rest.amount : 0), queued: false };
  }
  if (resolved.state === "unloaded") {
    enqueue(entry, part);
    rememberType(entry, part.typeId);
    return { stored: amount, queued: true };
  }
  return { stored: 0, queued: false };
}

interface StepResult {
  slot: number;
  held: ItemStack;
  stored: number;
  queuedBy: Map<string, number>;
}

export function runDeposit(player: Player, plan: DepositStep[]): DepositResult {
  const inventory = getInventory(player);
  if (!inventory) return { total: 0, chests: 0 };
  const snapshots = new Map<string, string>();
  const results: StepResult[] = [];
  const loadedHits = new Set<ChestEntry>();
  const queuedHits = new Set<ChestEntry>();

  for (const step of plan) {
    const held = inventory.getItem(step.slot);
    if (!held || held.typeId !== step.typeId) continue;
    let left = Math.min(step.amount, held.amount);
    const result: StepResult = { slot: step.slot, held, stored: 0, queuedBy: new Map() };
    for (const entry of step.targets) {
      if (left <= 0) break;
      if (!snapshots.has(entry.id)) snapshots.set(entry.id, JSON.stringify(entry.pendingQueue ?? []));
      const part = held.clone();
      part.amount = left;
      const out = depositItem(entry, part);
      if (out.stored <= 0) continue;
      result.stored += out.stored;
      left -= out.stored;
      if (out.queued) {
        queuedHits.add(entry);
        result.queuedBy.set(entry.id, (result.queuedBy.get(entry.id) ?? 0) + out.stored);
      } else {
        loadedHits.add(entry);
      }
    }
    results.push(result);
  }

  let failed = false;
  for (const entry of new Set([...queuedHits, ...loadedHits])) {
    if (persist(entry)) continue;
    if (!queuedHits.has(entry)) continue;
    failed = true;
    entry.pendingQueue = JSON.parse(snapshots.get(entry.id) ?? "[]") as ItemRecord[];
    queuedHits.delete(entry);
    unsaved.delete(entry.id);
    for (const result of results) {
      result.stored -= result.queuedBy.get(entry.id) ?? 0;
      result.queuedBy.delete(entry.id);
    }
  }

  let total = 0;
  for (const result of results) {
    if (result.stored <= 0) continue;
    total += result.stored;
    const remain = result.held.amount - result.stored;
    if (remain <= 0) {
      inventory.setItem(result.slot, undefined);
    } else {
      const keep = result.held.clone();
      keep.amount = remain;
      inventory.setItem(result.slot, keep);
    }
  }

  for (const entry of loadedHits) sortEntry(entry);
  return { total, chests: new Set([...loadedHits, ...queuedHits]).size, failed };
}

export function depositAll(player: Player): void {
  const entries = chestsOf(player);
  if (entries.length === 0) {
    player.onScreenDisplay.setActionBar("§e[ChestLog] §fNo chests registered yet.");
    return;
  }
  const inventory = getInventory(player);
  if (!inventory) return;
  const sets = entries.map(entryTypeSet);
  const plan: DepositStep[] = [];
  for (let slot = 0; slot < 36; slot++) {
    const item = inventory.getItem(slot);
    if (!item || item.typeId === ITEM_ID) continue;
    const targets = entries.filter((entry, index) => sets[index].has(item.typeId));
    if (targets.length > 0) plan.push({ slot, typeId: item.typeId, amount: item.amount, targets });
  }
  const result = runDeposit(player, plan);
  if (result.failed) {
    player.onScreenDisplay.setActionBar("§c[ChestLog] §fCould not buffer items for an unloaded chest.");
    return;
  }
  if (result.total === 0) {
    player.onScreenDisplay.setActionBar("§e[ChestLog] §fNo matching items to deposit.");
    return;
  }
  player.onScreenDisplay.setActionBar(
    `§a[ChestLog] §fSorted & deposited §e${result.total} §fitems across §b${result.chests} §fchests!`
  );
}

function alertFull(entry: ChestEntry): void {
  const last = alertTicks.get(entry.id);
  if (last !== undefined && system.currentTick - last < ALERT_COOLDOWN) return;
  alertTicks.set(entry.id, system.currentTick);
  const waiting = entry.pendingQueue.reduce((sum, r) => sum + r.amount, 0);
  notifyOwner(entry, `§c[ChestLog] ${coloredName(entry)} §fis full. §e${waiting} §fitems are waiting.`);
}

export function flushEntry(entry: ChestEntry): boolean {
  if (!Array.isArray(entry.pendingQueue) || entry.pendingQueue.length === 0) return false;
  const resolved = resolveContainer(entry);
  if (resolved.state !== "loaded") return false;
  let changed = false;
  let blocked = false;
  const remainingQueue: ItemRecord[] = [];
  for (const record of entry.pendingQueue) {
    let remaining = record.amount;
    if (!blocked) {
      let max: number;
      try {
        max = new ItemStack(record.typeId, 1).maxAmount;
      } catch {
        remainingQueue.push(record);
        continue;
      }
      while (remaining > 0) {
        const amount = Math.min(remaining, max);
        let rest: ItemStack | undefined;
        try {
          rest = resolved.container.addItem(buildStack(record, amount));
        } catch {
          blocked = true;
          break;
        }
        const moved = amount - (rest ? rest.amount : 0);
        remaining -= moved;
        if (moved > 0) changed = true;
        if (rest) {
          blocked = true;
          break;
        }
      }
    }
    if (remaining > 0) remainingQueue.push({ ...record, amount: remaining });
  }
  entry.pendingQueue = remainingQueue;
  if (blocked && remainingQueue.length > 0) alertFull(entry);
  return changed;
}

export function releasePending(entry: ChestEntry): boolean {
  const queue = entry.pendingQueue ?? [];
  const failedRecords: ItemRecord[] = [];
  let dimension: Dimension | undefined;
  try {
    dimension = world.getDimension(entry.dimensionId);
  } catch {}
  const at: Vector3 = { x: entry.location.x + 0.5, y: entry.location.y + 1, z: entry.location.z + 0.5 };
  for (const record of queue) {
    let max: number;
    try {
      max = new ItemStack(record.typeId, 1).maxAmount;
    } catch {
      continue;
    }
    let remaining = record.amount;
    while (remaining > 0 && dimension) {
      const amount = Math.min(remaining, max);
      try {
        dimension.spawnItem(buildStack(record, amount), at);
      } catch {
        break;
      }
      remaining -= amount;
    }
    if (remaining > 0) failedRecords.push({ ...record, amount: remaining });
  }
  entry.pendingQueue = failedRecords;
  return failedRecords.length === 0;
}

function flushSweep(): void {
  for (const entry of Array.from(chests.values())) {
    if (!entry.pendingQueue || entry.pendingQueue.length === 0) continue;
    const before = JSON.stringify(entry);
    if (flushEntry(entry)) {
      refreshKnown(entry);
      sortEntry(entry);
    }
    if (JSON.stringify(entry) !== before) persist(entry);
  }
}

function goneSweep(): void {
  for (const player of world.getAllPlayers()) {
    try {
      migratePlayer(player);
    } catch {}
  }
  for (const id of Array.from(unsaved)) {
    const pending = chests.get(id);
    if (pending) persist(pending);
    else unsaved.delete(id);
  }
  for (const entry of Array.from(chests.values())) {
    const before = JSON.stringify(entry);
    const resolved = resolveContainer(entry);
    if (resolved.state === "gone") {
      if (releasePending(entry)) {
        notifyOwner(entry, `§e[ChestLog] §fThe chest ${coloredName(entry)} §fwas removed and unregistered.`);
        deleteEntry(entry);
      } else {
        persist(entry);
      }
    } else if (JSON.stringify(entry) !== before) {
      persist(entry);
    }
  }
}

function flushAtLocation(dimensionId: string, location: Vector3): void {
  const entry = findEntry(dimensionId, location);
  if (!entry) return;
  const changed = flushEntry(entry);
  refreshKnown(entry);
  if (changed) sortEntry(entry);
  persist(entry);
}

export function initSync(): void {
  loadAll();
  system.runInterval(() => {
    try {
      flushSweep();
    } catch {}
  }, 20);
  system.runInterval(() => {
    try {
      goneSweep();
    } catch {}
  }, 100);

  world.beforeEvents.playerInteractWithBlock.subscribe((event) => {
    const { player, block, itemStack, isFirstEvent } = event;
    if (!isFirstEvent || !CONTAINER_TYPES.has(block.typeId)) return;
    if (itemStack && itemStack.typeId === ITEM_ID && player.isSneaking) return;
    const dimensionId = block.dimension.id;
    const location: Vector3 = { x: block.x, y: block.y, z: block.z };
    system.run(() => {
      try {
        flushAtLocation(dimensionId, location);
      } catch {}
    });
  });
}
