import { world, system, BlockTypes, EntityInitializationCause } from "@minecraft/server";

const COOLDOWN_TICKS = 3;
const PLAYER_CLEARANCE = 1.5;
const MIN_ALONG = 0.45;
const MAX_ALONG = 1.05;
const MAX_ACROSS = 0.5;
const TOOL_SUFFIXES = ["_pickaxe", "_axe", "_shovel"];
const UNSAFE_PLACE = /(^|_)door$|bed$|sign$|banner$|head$|skull$/;
const PROTECTED = new Set([
  "minecraft:bedrock",
  "minecraft:barrier",
  "minecraft:command_block",
  "minecraft:chain_command_block",
  "minecraft:repeating_command_block",
  "minecraft:structure_block",
  "minecraft:structure_void",
  "minecraft:jigsaw",
  "minecraft:end_portal",
  "minecraft:end_portal_frame",
  "minecraft:end_gateway",
  "minecraft:portal",
  "minecraft:reinforced_deepslate",
  "minecraft:allow",
  "minecraft:deny",
  "minecraft:border_block",
  "minecraft:light_block",
]);
const FRONTS = [
  { x: 1, y: 0, z: 0 },
  { x: -1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: -1, z: 0 },
  { x: 0, y: 0, z: 1 },
  { x: 0, y: 0, z: -1 },
];

const cooldowns = new Map();

function isDigTool(stack) {
  if (!TOOL_SUFFIXES.some((suffix) => stack.typeId.endsWith(suffix))) return false;
  return stack.hasComponent("minecraft:durability");
}

function isPlaceable(stack) {
  if (UNSAFE_PLACE.test(stack.typeId)) return false;
  return BlockTypes.get(stack.typeId) !== undefined;
}

function findDispenser(dimension, at) {
  const cell = { x: Math.floor(at.x), y: Math.floor(at.y), z: Math.floor(at.z) };
  let best;
  for (const front of FRONTS) {
    const origin = { x: cell.x - front.x, y: cell.y - front.y, z: cell.z - front.z };
    const block = dimension.getBlock(origin);
    if (!block || block.typeId !== "minecraft:dispenser") continue;
    const dx = at.x - (origin.x + 0.5);
    const dy = at.y - (origin.y + 0.5);
    const dz = at.z - (origin.z + 0.5);
    const along = dx * front.x + dy * front.y + dz * front.z;
    const across = Math.max(
      Math.abs(front.x === 0 ? dx : 0),
      Math.abs(front.y === 0 ? dy : 0),
      Math.abs(front.z === 0 ? dz : 0)
    );
    if (along < MIN_ALONG || along > MAX_ALONG || across > MAX_ACROSS) continue;
    if (!best || along < best.along) best = { block, front, along };
  }
  return best;
}

function giveBack(dimension, dispenser, front, stack) {
  if (!stack || stack.amount <= 0) return;
  const inventory = dispenser.getComponent("minecraft:inventory");
  const container = inventory ? inventory.container : undefined;
  const rest = container ? container.addItem(stack) : stack;
  if (!rest) return;
  const mouth = dispenser.offset(front);
  dimension.spawnItem(rest, mouth ? mouth.center() : dispenser.center());
}

function destroy(dimension, block) {
  try {
    dimension.runCommand("setblock " + block.x + " " + block.y + " " + block.z + " air destroy");
  } catch (e) {}
  if (block.isAir) return true;
  try {
    const drop = block.getItemStack(1, true);
    const spot = block.center();
    block.setType("minecraft:air");
    if (drop) dimension.spawnItem(drop, spot);
    return true;
  } catch (e) {
    return false;
  }
}

function breakFront(dimension, dispenser, front, stack) {
  const tool = stack.clone();
  const target = dispenser.offset(front);
  const blocked =
    !target ||
    target.isAir ||
    target.isLiquid ||
    PROTECTED.has(target.typeId) ||
    target.hasComponent("minecraft:inventory");
  if (blocked || !destroy(dimension, target)) {
    giveBack(dimension, dispenser, front, tool);
    return;
  }
  const durability = tool.getComponent("minecraft:durability");
  if (durability) {
    durability.damage += 1;
    if (durability.damage >= durability.maxDurability) return;
  }
  giveBack(dimension, dispenser, front, tool);
}

function placeFront(dimension, dispenser, front, stack) {
  const target = dispenser.offset(front);
  if (!target || !target.isAir) {
    giveBack(dimension, dispenser, front, stack.clone());
    return;
  }
  try {
    target.setType(stack.typeId);
  } catch (e) {
    giveBack(dimension, dispenser, front, stack.clone());
    return;
  }
  if (stack.amount > 1) {
    const rest = stack.clone();
    rest.amount = stack.amount - 1;
    giveBack(dimension, dispenser, front, rest);
  }
}

function pruneCooldowns(tick) {
  if (cooldowns.size < 300) return;
  for (const [key, until] of cooldowns) {
    if (until <= tick) cooldowns.delete(key);
  }
}

function onSpawn(event) {
  try {
    if (event.cause === EntityInitializationCause.Loaded) return;
    const entity = event.entity;
    if (!entity.isValid || entity.typeId !== "minecraft:item") return;
    const dimension = entity.dimension;
    const at = entity.location;
    const found = findDispenser(dimension, at);
    if (!found) return;
    const component = entity.getComponent("minecraft:item");
    const stack = component ? component.itemStack : undefined;
    if (!stack) return;
    const breaker = isDigTool(stack);
    if (!breaker && !isPlaceable(stack)) return;
    const tick = system.currentTick;
    const key = dimension.id + "|" + found.block.x + "|" + found.block.y + "|" + found.block.z;
    if ((cooldowns.get(key) || 0) > tick) return;
    if (dimension.getPlayers({ location: at, maxDistance: PLAYER_CLEARANCE }).length > 0) return;
    cooldowns.set(key, tick + COOLDOWN_TICKS);
    pruneCooldowns(tick);
    entity.remove();
    if (breaker) breakFront(dimension, found.block, found.front, stack);
    else placeFront(dimension, found.block, found.front, stack);
  } catch (e) {}
}

world.afterEvents.worldLoad.subscribe(() => {
  world.afterEvents.entitySpawn.subscribe(onSpawn);
});
