import { world, system, ItemStack } from "@minecraft/server";
import { IDS, VALUE, KEYS, MOB_DROPS, FISHING_TREASURE, SHIPWRECK_SIGNS, CUTLASS_NAME } from "./config.js";
import { inventoryOf, looseCounts, takeLoose, giveAmount } from "./vault.js";
import { addProgress } from "./bounties.js";

const rand = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
const lastFish = new Map();

export function holdsCutlass(player) {
  try {
    const it = inventoryOf(player)?.getItem(player.selectedSlotIndex);
    return !!it && it.typeId === "minecraft:iron_sword" && !!it.nameTag && it.nameTag.includes(CUTLASS_NAME);
  } catch (e) {
    return false;
  }
}

function spawnCoins(dim, loc, typeId, amount) {
  let left = amount;
  while (left > 0) {
    const n = Math.min(64, left);
    dim.spawnItem(new ItemStack(typeId, n), loc);
    left -= n;
  }
}

function scatterFx(dim, loc) {
  const at = `${loc.x.toFixed(1)} ${loc.y.toFixed(1)} ${loc.z.toFixed(1)}`;
  try {
    dim.runCommand(`playsound armor.equip_gold @a ${at} 1.5 1`);
    dim.runCommand(`playsound random.orb @a ${at} 1 1.4`);
    dim.runCommand(`particle minecraft:totem_particle ${at}`);
  } catch (e) {}
}

function rollDrops(rules, bonus) {
  const out = [];
  for (const rule of rules) {
    if (Math.random() < Math.min(1, rule.chance + (bonus ? 0.15 : 0))) {
      out.push({ id: rule.id, amount: rand(rule.min, rule.max) + (bonus ? 1 : 0) });
    }
  }
  return out;
}

function readKept() {
  try {
    const raw = world.getDynamicProperty(KEYS.kept);
    return typeof raw === "string" ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function writeKept(data) {
  world.setDynamicProperty(KEYS.kept, JSON.stringify(data));
}

function onPlayerDeath(dead) {
  let dim;
  let loc;
  let pid;
  try {
    dim = dead.dimension;
    loc = { x: dead.location.x, y: dead.location.y, z: dead.location.z };
    pid = dead.id;
  } catch (e) {
    return;
  }
  let handled = false;
  try {
    const counts = looseCounts(dead);
    const total = Object.keys(counts).reduce((s, k) => s + counts[k], 0);
    if (total > 0) {
      handled = true;
      for (const typeId of Object.keys(counts)) {
        const n = counts[typeId];
        if (!n) continue;
        const drop = Math.ceil(n / 2);
        takeLoose(dead, typeId, drop);
        spawnCoins(dim, loc, typeId, drop);
      }
      scatterFx(dim, loc);
    }
  } catch (e) {}
  if (handled) return;
  system.runTimeout(() => {
    try {
      const found = {};
      for (const e of dim.getEntities({ type: "minecraft:item", location: loc, maxDistance: 8 })) {
        const st = e.getComponent("item")?.itemStack;
        if (!st || !(st.typeId in VALUE)) continue;
        found[st.typeId] = (found[st.typeId] || 0) + st.amount;
        e.remove();
      }
      const kept = {};
      let any = false;
      for (const typeId of Object.keys(found)) {
        const n = found[typeId];
        const drop = Math.ceil(n / 2);
        spawnCoins(dim, loc, typeId, drop);
        if (n - drop > 0) kept[typeId] = n - drop;
        any = true;
      }
      if (!any) return;
      scatterFx(dim, loc);
      if (Object.keys(kept).length) {
        const all = readKept();
        all[pid] = kept;
        writeKept(all);
      }
    } catch (e) {}
  }, 2);
}

function giveKept(player) {
  const all = readKept();
  const mine = all[player.id];
  if (!mine) return;
  delete all[player.id];
  writeKept(all);
  for (const typeId of Object.keys(mine)) giveAmount(player, typeId, mine[typeId]);
  player.onScreenDisplay.setActionBar("§6Your remaining pirate coins were returned.");
}

function readChests() {
  const raw = world.getDynamicProperty(KEYS.chests);
  return typeof raw === "string" && raw.length ? raw.split(";") : [];
}

function isTreasureChest(block, container) {
  if (block.location.y > 64) return false;
  let signs = 0;
  for (let i = 0; i < container.size; i++) {
    const it = container.getItem(i);
    if (!it) continue;
    if (it.typeId === "minecraft:heart_of_the_sea") return true;
    if (SHIPWRECK_SIGNS.includes(it.typeId)) signs += 1;
  }
  return signs >= 3;
}

function onChestOpen(player, block) {
  const container = block.getComponent("inventory")?.container;
  if (!container) return;
  const key = `${block.dimension.id}@${block.location.x},${block.location.y},${block.location.z}`;
  const seen = readChests();
  if (seen.includes(key)) return;
  if (!isTreasureChest(block, container)) return;
  seen.push(key);
  while (seen.length > 300) seen.shift();
  world.setDynamicProperty(KEYS.chests, seen.join(";"));
  const gold = rand(1, 2);
  const silver = rand(4, 8);
  giveAmount(player, IDS.gold, gold);
  giveAmount(player, IDS.silver, silver);
  player.onScreenDisplay.setActionBar(`§6Treasure found: §e${gold} Gold Doubloons §f+ §f${silver} Silver Tokens`);
  scatterFx(player.dimension, player.location);
  addProgress(player, "chest", "");
}

function onItemSpawn(entity) {
  if (entity.typeId !== "minecraft:item") return;
  let dim;
  let loc;
  try {
    dim = entity.dimension;
    loc = entity.location;
  } catch (e) {
    return;
  }
  if (dim.getEntities({ type: "minecraft:fishing_hook", location: loc, maxDistance: 3 }).length === 0) return;
  const anglers = dim.getPlayers({ location: loc, maxDistance: 40 }).filter((p) => {
    const it = inventoryOf(p)?.getItem(p.selectedSlotIndex);
    return it && it.typeId === "minecraft:fishing_rod";
  });
  if (!anglers.length) return;
  const player = anglers[0];
  const now = system.currentTick;
  if (now - (lastFish.get(player.id) ?? -100) < 20) return;
  lastFish.set(player.id, now);
  const st = entity.getComponent("item")?.itemStack;
  const treasure = !!st && FISHING_TREASURE.includes(st.typeId);
  if (treasure) {
    giveAmount(player, IDS.gold, rand(1, 2));
    player.onScreenDisplay.setActionBar("§6Treasure catch: §eGold Pirate Doubloons");
    scatterFx(dim, player.location);
  } else if (Math.random() < 0.18) {
    giveAmount(player, IDS.silver, rand(1, 3));
    player.onScreenDisplay.setActionBar("§fYou fished up Silver Pirate Tokens");
  }
  addProgress(player, "fish", "");
}

export function registerDrops() {
  world.afterEvents.entityDie.subscribe((ev) => {
    const dead = ev.deadEntity;
    if (dead.typeId === "minecraft:player") {
      onPlayerDeath(dead);
      return;
    }
    const killer = ev.damageSource?.damagingEntity;
    if (!killer || killer.typeId !== "minecraft:player") return;
    let typeId;
    let loc;
    let dim;
    try {
      typeId = dead.typeId;
      loc = dead.location;
      dim = dead.dimension;
    } catch (e) {
      return;
    }
    addProgress(killer, "kill", typeId);
    const rules = MOB_DROPS[typeId];
    if (!rules) return;
    for (const drop of rollDrops(rules, holdsCutlass(killer))) spawnCoins(dim, loc, drop.id, drop.amount);
  });

  world.afterEvents.playerInteractWithBlock.subscribe((ev) => {
    if (ev.block.typeId !== "minecraft:chest") return;
    try {
      onChestOpen(ev.player, ev.block);
    } catch (e) {}
  });

  world.afterEvents.entitySpawn.subscribe((ev) => {
    try {
      onItemSpawn(ev.entity);
    } catch (e) {}
  });

  world.afterEvents.playerSpawn.subscribe((ev) => {
    const player = ev.player;
    system.runTimeout(() => {
      try {
        giveKept(player);
      } catch (e) {}
    }, 20);
  });
}
