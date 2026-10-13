/**
 * ==============================================================================
 * SHARED HIVEMIND INVENTORY -- MINECRAFT BEDROCK SCRIPT API
 * ==============================================================================
 * Version: 1.0.0
 * Target Engine: Minecraft Bedrock 1.21.0+ / v1.26 Standards
 * API Module: @minecraft/server v1.13.0+
 * Author: AllensCreations
 *
 * System Architecture:
 * 1. Authoritative Master State:
 *    - Master array tracking all 36 main inventory slots (0..35) + Offhand.
 * 2. Delta Detection Engine (1-Tick Frequency):
 *    - Each player has a local snapshot cache.
 *    - Differences between a player's inventory and their snapshot identify
 *      the intentional modification source.
 *    - Updates are applied to Master State and immediately mirrored across all
 *      peers while locked (`isSyncing`) to eliminate circular loops.
 * 3. Anti-Duplication & Fast Drop Protection:
 *    - Drops and consumptions are immediately deducted in the Master State,
 *      preventing phantom item pickup or rapid-click duplication.
 * 4. Single Death Spot Drop:
 *    - `keepInventory` is automatically enforced on startup.
 *    - When any player dies, all 36 slots + offhand are spawned as physical
 *      drops at that exact death coordinate and dimension.
 *    - All living teammates' inventories are instantly cleared with a shattering
 *      sound cue and coordinate warning HUD.
 * 5. Persistent HUD Action Bar:
 *    - Displays "[ HIVEMIND ACTIVE ] Shared Slots: Synchronized" at the top.
 * ==============================================================================
 */

import {
  world,
  system,
  ItemStack,
  EquipmentSlot
} from "@minecraft/server";

// ==============================================================================
// 1. STATE MANAGEMENT & GLOBALS
// ==============================================================================

/**
 * Authoritative Master Inventory State:
 * Slots 0 to 35 represent the player's 36 main inventory slots (0..8 hotbar, 9..35 storage).
 * @type {(ItemStack | undefined)[]}
 */
const masterInventory = new Array(36).fill(undefined);

/**
 * Authoritative Master Offhand State.
 * @type {ItemStack | undefined}
 */
let masterOffhand = undefined;

/**
 * Mutex lock flag to prevent re-entrant loops during inventory updates.
 * @type {boolean}
 */
let isSyncing = false;

/**
 * Flag indicating whether the master state has been initialized from an active player.
 * @type {boolean}
 */
let isInitialized = false;

/**
 * Local snapshot cache per connected player.
 * Map<playerId: string, { slots: (ItemStack | undefined)[], offhand: ItemStack | undefined }>
 * @type {Map<string, { slots: (ItemStack | undefined)[], offhand: ItemStack | undefined }>}
 */
const playerSnapshots = new Map();

/**
 * Countdown timers for death alert actionbars so death coordinates are not wiped by HUD.
 * Map<playerId: string, remainingSeconds: number>
 * @type {Map<string, number>}
 */
const deathAlertCountdown = new Map();

// ==============================================================================
// 2. HELPER FUNCTIONS: ITEM SERIALIZATION & COMPARISON
// ==============================================================================

/**
 * Compares two ItemStacks to determine if their type, count, custom name,
 * durability, lore, and enchantments are completely identical.
 *
 * @param {ItemStack | undefined} a
 * @param {ItemStack | undefined} b
 * @returns {boolean} True if items are identical, false if a delta exists.
 */
function areItemStacksEqual(a, b) {
  // Both empty slots
  if (!a && !b) return true;

  // One empty and one occupied
  if (!a || !b) return false;

  // Type and stack quantity
  if (a.typeId !== b.typeId) return false;
  if (a.amount !== b.amount) return false;

  // Custom name tag applied via anvil or script
  if (a.nameTag !== b.nameTag) return false;

  // Durability component comparison
  try {
    const durA = a.getComponent("minecraft:durability") ?? a.getComponent("durability");
    const durB = b.getComponent("minecraft:durability") ?? b.getComponent("durability");
    const damageA = durA?.damage ?? 0;
    const damageB = durB?.damage ?? 0;
    if (damageA !== damageB) return false;
  } catch {}

  // Lore text comparison
  try {
    const loreA = a.getLore() || [];
    const loreB = b.getLore() || [];
    if (loreA.length !== loreB.length) return false;
    for (let i = 0; i < loreA.length; i++) {
      if (loreA[i] !== loreB[i]) return false;
    }
  } catch {}

  // Enchantment comparison
  try {
    const encA = a.getComponent("minecraft:enchantable") ?? a.getComponent("enchantable");
    const encB = b.getComponent("minecraft:enchantable") ?? b.getComponent("enchantable");
    if (encA || encB) {
      const listA = encA?.getEnchantments() || [];
      const listB = encB?.getEnchantments() || [];
      if (listA.length !== listB.length) return false;
      for (let i = 0; i < listA.length; i++) {
        if (listA[i].type.id !== listB[i].type.id || listA[i].level !== listB[i].level) {
          return false;
        }
      }
    }
  } catch {}

  return true;
}

/**
 * Safely creates a deep clone of an ItemStack.
 * Preserves all components, NBT, durability, and custom metadata.
 *
 * @param {ItemStack | undefined} item
 * @returns {ItemStack | undefined}
 */
function cloneItemStack(item) {
  if (!item) return undefined;
  try {
    return item.clone();
  } catch {
    try {
      const fallback = new ItemStack(item.typeId, item.amount);
      if (item.nameTag) fallback.nameTag = item.nameTag;
      return fallback;
    } catch {
      return undefined;
    }
  }
}

/**
 * Safely extracts the player's 36-slot inventory Container.
 *
 * @param {Player} player
 * @returns {Container | undefined}
 */
function getPlayerInventoryContainer(player) {
  try {
    const comp = player.getComponent("minecraft:inventory") ?? player.getComponent("inventory");
    return comp?.container;
  } catch {
    return undefined;
  }
}

/**
 * Safely retrieves the player's offhand ItemStack.
 *
 * @param {Player} player
 * @returns {ItemStack | undefined}
 */
function getPlayerOffhandItem(player) {
  try {
    const comp = player.getComponent("minecraft:equippable") ?? player.getComponent("equippable");
    return comp?.getEquipment(EquipmentSlot.Offhand);
  } catch {
    return undefined;
  }
}

/**
 * Safely sets the player's offhand ItemStack.
 *
 * @param {Player} player
 * @param {ItemStack | undefined} item
 */
function setPlayerOffhandItem(player, item) {
  try {
    const comp = player.getComponent("minecraft:equippable") ?? player.getComponent("equippable");
    comp?.setEquipment(EquipmentSlot.Offhand, item);
  } catch {}
}

/**
 * Updates a player's cached snapshot to reflect their current inventory slots.
 *
 * @param {Player} player
 */
function updatePlayerSnapshot(player) {
  const container = getPlayerInventoryContainer(player);
  if (!container) return;

  const slotCopies = new Array(36);
  for (let i = 0; i < 36; i++) {
    slotCopies[i] = cloneItemStack(container.getItem(i));
  }

  playerSnapshots.set(player.id, {
    slots: slotCopies,
    offhand: cloneItemStack(getPlayerOffhandItem(player))
  });
}

/**
 * Overwrites a player's inventory and offhand with the current Master State.
 *
 * @param {Player} player
 */
function applyMasterStateToPlayer(player) {
  const container = getPlayerInventoryContainer(player);
  if (!container) return;

  for (let i = 0; i < 36; i++) {
    try {
      container.setItem(i, cloneItemStack(masterInventory[i]));
    } catch {}
  }

  try {
    setPlayerOffhandItem(player, cloneItemStack(masterOffhand));
  } catch {}

  updatePlayerSnapshot(player);
}

// ==============================================================================
// 3. CORE SYNCHRONIZATION ENGINE (1-TICK LOOP)
// ==============================================================================

/**
 * High-performance inventory synchronization loop.
 * Runs every tick to detect slot changes, update the Master State, and replicate
 * modifications across all active players without circular feedback.
 */
function syncInventoryTick() {
  if (isSyncing) return;

  const players = world.getAllPlayers();
  if (!players || players.length === 0) return;

  // Step 1: Initial state bootstrapping
  if (!isInitialized) {
    // Select the first player with items, or the first connected player
    let sourcePlayer = players[0];
    for (const p of players) {
      const c = getPlayerInventoryContainer(p);
      if (c && c.emptySlotsCount < 36) {
        sourcePlayer = p;
        break;
      }
    }

    const container = getPlayerInventoryContainer(sourcePlayer);
    if (container) {
      for (let i = 0; i < 36; i++) {
        masterInventory[i] = cloneItemStack(container.getItem(i));
      }
      masterOffhand = cloneItemStack(getPlayerOffhandItem(sourcePlayer));
      isInitialized = true;

      // Bring all online players into initial sync
      isSyncing = true;
      try {
        for (const p of players) {
          applyMasterStateToPlayer(p);
        }
      } finally {
        isSyncing = false;
      }
    }
    return;
  }

  // Step 2: Onboard newly joined players
  for (const p of players) {
    if (!playerSnapshots.has(p.id)) {
      isSyncing = true;
      try {
        applyMasterStateToPlayer(p);
      } finally {
        isSyncing = false;
      }
    }
  }

  // Step 3: Detect changes across all players
  // Map of slot index -> { newItem: ItemStack | undefined, sourcePlayer: Player }
  const slotChanges = new Map();
  let offhandChange = null;

  for (const p of players) {
    const container = getPlayerInventoryContainer(p);
    if (!container) continue;

    const snap = playerSnapshots.get(p.id);
    if (!snap) continue;

    // Scan all 36 main inventory slots
    for (let i = 0; i < 36; i++) {
      const currentItem = container.getItem(i);
      const lastItem = snap.slots[i];

      // If current differs from this player's snapshot, this player modified the slot
      if (!areItemStacksEqual(currentItem, lastItem)) {
        if (!slotChanges.has(i)) {
          slotChanges.set(i, {
            newItem: cloneItemStack(currentItem),
            sourcePlayer: p
          });
        } else {
          // Anti-dupe conflict resolution:
          // If two players modified the same slot in the exact same tick, the first
          // player takes precedence. Spawn the conflicting item at the second player's
          // feet so items are never voided or duplicated.
          if (currentItem) {
            try {
              p.dimension.spawnItem(cloneItemStack(currentItem), p.location);
            } catch {}
          }
        }
      }
    }

    // Scan offhand slot
    const currentOffhand = getPlayerOffhandItem(p);
    const lastOffhand = snap.offhand;
    if (!areItemStacksEqual(currentOffhand, lastOffhand)) {
      if (!offhandChange) {
        offhandChange = {
          newItem: cloneItemStack(currentOffhand),
          sourcePlayer: p
        };
      } else {
        if (currentOffhand) {
          try {
            p.dimension.spawnItem(cloneItemStack(currentOffhand), p.location);
          } catch {}
        }
      }
    }
  }

  // Step 4: Replicate modifications to Master State and all peers
  if (slotChanges.size > 0 || offhandChange !== null) {
    isSyncing = true;
    try {
      // 4a. Update Master State
      for (const [slot, change] of slotChanges.entries()) {
        masterInventory[slot] = change.newItem;
      }
      if (offhandChange !== null) {
        masterOffhand = offhandChange.newItem;
      }

      // 4b. Replicate to all players
      for (const p of players) {
        const container = getPlayerInventoryContainer(p);
        if (!container) continue;

        const snap = playerSnapshots.get(p.id);

        for (const [slot, change] of slotChanges.entries()) {
          // If this player did not initiate the change, update their container slot
          if (p.id !== change.sourcePlayer.id) {
            try {
              container.setItem(slot, cloneItemStack(change.newItem));
            } catch {}
          }

          // Update local snapshot
          if (snap) {
            snap.slots[slot] = cloneItemStack(change.newItem);
          }
        }

        if (offhandChange !== null) {
          if (p.id !== offhandChange.sourcePlayer.id) {
            try {
              setPlayerOffhandItem(p, cloneItemStack(offhandChange.newItem));
            } catch {}
          }

          if (snap) {
            snap.offhand = cloneItemStack(offhandChange.newItem);
          }
        }
      }
    } finally {
      isSyncing = false;
    }
  }
}

// ==============================================================================
// 4. DEATH HANDLING ENGINE (SINGLE DEATH SPOT DROP)
// ==============================================================================

/**
 * Handles player death:
 * 1. Dumps all shared inventory items as physical drops at the exact death coordinate.
 * 2. Wipes all shared items from living teammates instantly.
 * 3. Plays a shattering sound cue and displays warning alerts with coordinates.
 */
world.afterEvents.entityDie.subscribe((event) => {
  const deadEntity = event.deadEntity;
  if (deadEntity.typeId !== "minecraft:player") return;

  const location = deadEntity.location;
  const dimension = deadEntity.dimension;
  const dropLocation = {
    x: location.x,
    y: location.y + 0.5,
    z: location.z
  };

  const coordX = Math.floor(location.x);
  const coordY = Math.floor(location.y);
  const coordZ = Math.floor(location.z);
  const dimName = dimension.id.replace("minecraft:", "").toUpperCase();

  isSyncing = true;
  try {
    let droppedStackCount = 0;

    // 1. Spawn all Master Inventory items at the death spot
    for (let i = 0; i < 36; i++) {
      const item = masterInventory[i];
      if (item) {
        try {
          dimension.spawnItem(cloneItemStack(item), dropLocation);
          droppedStackCount++;
        } catch {}
        masterInventory[i] = undefined;
      }
    }

    // Spawn offhand item
    if (masterOffhand) {
      try {
        dimension.spawnItem(cloneItemStack(masterOffhand), dropLocation);
        droppedStackCount++;
      } catch {}
      masterOffhand = undefined;
    }

    // 2. Clear all living teammates' inventories
    for (const player of world.getAllPlayers()) {
      const container = getPlayerInventoryContainer(player);
      if (container) {
        for (let i = 0; i < 36; i++) {
          try {
            container.setItem(i, undefined);
          } catch {}
        }
      }

      try {
        setPlayerOffhandItem(player, undefined);
      } catch {}

      updatePlayerSnapshot(player);

      // Set death coordinate alert for 6 seconds
      deathAlertCountdown.set(player.id, 6);

      // Play shattering sound cues
      try {
        player.playSound("random.break", { location: player.location, volume: 1.0, pitch: 0.8 });
        player.playSound("entity.item.break", { location: player.location, volume: 1.0, pitch: 0.9 });
      } catch {}

      // Actionbar death warning
      try {
        player.onScreenDisplay.setActionBar(
          `§c[!] A teammate died at [${coordX}, ${coordY}, ${coordZ}]! All items dropped there!`
        );
      } catch {}
    }

    // 3. Server-wide chat broadcast
    world.sendMessage(
      `§c[HIVEMIND DEATH] §e${deadEntity.name ?? "A player"} §cdied in §e${dimName} §cat §e[${coordX}, ${coordY}, ${coordZ}]§c! ${droppedStackCount} shared item stacks dropped at the death spot.`
    );
  } finally {
    isSyncing = false;
  }
});

// ==============================================================================
// 5. GAMERULE ENFORCEMENT & ENGINE INITIALIZATION
// ==============================================================================

/**
 * Enforces keepInventory gamerule to true so Minecraft does not naturally spawn
 * redundant per-player drops upon death.
 */
function enforceGameRules() {
  try {
    world.gameRules.keepInventory = true;
  } catch {
    try {
      world.getDimension("overworld").runCommand("gamerule keepinventory true");
    } catch {}
  }
}

// Initial engine setup
system.run(() => {
  enforceGameRules();
});

// Enforce gamerule on player spawn
world.afterEvents.playerSpawn.subscribe((event) => {
  enforceGameRules();
  const player = event.player;
  if (isInitialized && !playerSnapshots.has(player.id)) {
    isSyncing = true;
    try {
      applyMasterStateToPlayer(player);
    } finally {
      isSyncing = false;
    }
  }
});

// Cleanup disconnected player caches to prevent memory leaks
world.beforeEvents.playerLeave.subscribe((event) => {
  playerSnapshots.delete(event.player.id);
  deathAlertCountdown.delete(event.player.id);
});

// ==============================================================================
// 6. HUD ACTIONBAR ENGINE (1-SECOND INTERVAL)
// ==============================================================================

/**
 * Periodically updates the persistent HUD at the top of the screen.
 * Respects active death alert countdowns so coordinate alerts are not wiped.
 */
system.runInterval(() => {
  for (const player of world.getAllPlayers()) {
    const alertTime = deathAlertCountdown.get(player.id) ?? 0;
    if (alertTime > 0) {
      deathAlertCountdown.set(player.id, alertTime - 1);
      continue;
    }

    try {
      player.onScreenDisplay.setActionBar("§6[ HIVEMIND ACTIVE ] §fShared Slots: Synchronized");
    } catch {}
  }
}, 20);

// ==============================================================================
// 7. TICK LOOP SCHEDULER
// ==============================================================================

// Execute inventory synchronization every tick (50ms interval)
system.runInterval(() => {
  try {
    syncInventoryTick();
  } catch (err) {
    // Safeguard to ensure mutex lock is never permanently frozen
    isSyncing = false;
  }
}, 1);

// ==============================================================================
// 8. SCRIPT EVENT COMMANDS (ADMIN / TESTING)
// ==============================================================================

/**
 * Native slash command support via `/scriptevent`:
 * - `/scriptevent hivemind:sync`: Force resynchronizes all players from Master State.
 * - `/scriptevent hivemind:status`: Displays connected player count and occupied slots.
 * - `/scriptevent hivemind:clear`: Wipes shared inventory across all players.
 */
system.afterEvents.scriptEventReceive.subscribe((event) => {
  if (event.id === "hivemind:sync") {
    isSyncing = true;
    try {
      for (const p of world.getAllPlayers()) {
        applyMasterStateToPlayer(p);
      }
      world.sendMessage("§6[HIVEMIND] §aAll player inventories manually resynchronized to Master State.");
    } finally {
      isSyncing = false;
    }
  } else if (event.id === "hivemind:status") {
    const players = world.getAllPlayers();
    let occupiedSlots = 0;
    for (let i = 0; i < 36; i++) {
      if (masterInventory[i]) occupiedSlots++;
    }
    const offhandStatus = masterOffhand ? masterOffhand.typeId : "Empty";
    world.sendMessage(
      `§6[HIVEMIND STATUS] §fOnline Players: §a${players.length} §f| Occupied Slots: §a${occupiedSlots}/36 §f| Offhand: §a${offhandStatus}`
    );
  } else if (event.id === "hivemind:clear") {
    isSyncing = true;
    try {
      for (let i = 0; i < 36; i++) {
        masterInventory[i] = undefined;
      }
      masterOffhand = undefined;
      for (const p of world.getAllPlayers()) {
        applyMasterStateToPlayer(p);
      }
      world.sendMessage("§6[HIVEMIND] §cShared inventory cleared across all players.");
    } finally {
      isSyncing = false;
    }
  }
});
