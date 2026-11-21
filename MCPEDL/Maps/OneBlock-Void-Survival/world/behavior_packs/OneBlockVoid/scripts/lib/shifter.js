import { world } from "@minecraft/server";
import { ActionFormData } from "@minecraft/server-ui";
import { rollRarityTier, getDimensionState, buildTradeStacks, hoverDropAboveOneBlock, dropAtPlayer } from "./helpers.js";
import { DIMENSION_TRADE_POOLS, RARITY_TIERS } from "./rarities.js";

// -------------------------------------------------------------
// Dimension Shifter Engine
// -------------------------------------------------------------
export const dimensionShifterState = {
  overworld: { nextVisitIn: getRandomInterval(), isPresent: false, secondsLeft: 0, trades: [] },
  nether: { nextVisitIn: getRandomInterval(), isPresent: false, secondsLeft: 0, trades: [] },
  end: { nextVisitIn: getRandomInterval(), isPresent: false, secondsLeft: 0, trades: [] }
};

export function getRandomInterval() {
  return Math.floor(Math.random() * (1200 - 480 + 1)) + 480;
}

function generateRandomTrades(dimKey) {
  const pool = DIMENSION_TRADE_POOLS[dimKey] || DIMENSION_TRADE_POOLS.overworld;
  const trades = [];
  let hasMythicOrFabled = false;

  for (let slot = 0; slot < 5; slot++) {
    const tierIdx = rollRarityTier();
    const tier = RARITY_TIERS[tierIdx];
    const itemData = pool[tierIdx];

    const cost = Math.floor(Math.random() * (tier.costMax - tier.costMin + 1)) + tier.costMin;
    const stock = tierIdx >= 16 ? 1 : Math.floor(Math.random() * 2) + 2;

    if (tierIdx >= 18) {
      hasMythicOrFabled = true;
    }

    trades.push({
      tierIdx,
      tierName: tier.name,
      tierColor: tier.color,
      currency: tier.currency,
      cost,
      itemId: itemData.id,
      itemCount: itemData.count,
      stock
    });
  }

  return { trades, hasMythicOrFabled };
}

export function clearShifterStall(dimKey) {
  try {
    const state = dimensionShifterState[dimKey];
    const dim = world.getDimension(dimKey === "end" ? "the_end" : dimKey);
    for (const sp of state.stall || []) {
      const sb = dim.getBlock(sp);
      if (sb && sb.typeId === state.stallMat) sb.setType("minecraft:air");
    }
    state.stall = [];
  } catch (e) {}
}

export function tickDimensionShifters() {
  const dims = [
    { key: "overworld", dim: world.getDimension("overworld") },
    { key: "nether", dim: world.getDimension("nether") },
    { key: "end", dim: world.getDimension("the_end") }
  ];

  for (const { key, dim } of dims) {
    // Postpone Dimension Shifter visits in Overworld until player reaches Phase 4+
    if (key === "overworld") {
      const owState = getDimensionState("overworld");
      if (owState.phaseIndex <= 3) {
        continue;
      }
    }
    const state = dimensionShifterState[key];

    if (!state.isPresent) {
      // Remove orphaned shifters left over from a previous session
      try { for (const oe of dim.getEntities({ tags: ["dimension_shifter"] })) oe.remove(); } catch (oe2) {}
      state.nextVisitIn--;
      if (state.nextVisitIn <= 0) {
        state.isPresent = true;
        state.visitId = (state.visitId || 0) + 1;
        state.secondsLeft = 180;

        const { trades, hasMythicOrFabled } = generateRandomTrades(key);
        state.trades = trades;

        try {
          const stallMaterial = key === "nether" ? "minecraft:nether_brick" : key === "end" ? "minecraft:end_bricks" : "minecraft:oak_planks";
          state.stall = [];
          state.stallMat = stallMaterial;
          for (let x = 2; x <= 4; x++) {
            for (let z = -1; z <= 1; z++) {
              const b = dim.getBlock({ x, y: 63, z });
              if (b && b.isAir) { b.setType(stallMaterial); state.stall.push({ x, y: 63, z }); }
            }
          }

          const entity = dim.spawnEntity("minecraft:wandering_trader", { x: 3.5, y: 64.0, z: 0.5 });
          entity.addTag("dimension_shifter");
          entity.addTag(`shifter_${key}`);
          entity.nameTag = `§d✦ Dimension Shifter ✦\n§e[Leaves in 3m 00s]`;

          dim.playSound("mob.endermen.portal", { x: 3.5, y: 64.0, z: 0.5 }, { volume: 1.0, pitch: 1.0 });

          for (const p of world.getAllPlayers()) {
            p.sendMessage(`§d[Dimension Shifter] §eA Dimension Shifter emerged in the §a${key.toUpperCase()}§e! §7(Leaves in 3 mins)`);
            p.playSound("random.levelup", { pitch: 1.2, volume: 1.0 });
          }

          if (hasMythicOrFabled) {
            for (const p of world.getAllPlayers()) {
              p.sendMessage("§e★ §6§l[MYTHIC ROLL!] §eThe Dimension Shifter is carrying a §b§lFABLED§e/§e§lMYTHIC§e item this visit! §e★");
              p.playSound("ui.toast.challenge_complete", { pitch: 1.2, volume: 1.0 });
            }
          }
        } catch (e) {}
      }
    } else {
      state.secondsLeft--;

      const mins = Math.floor(state.secondsLeft / 60);
      const secs = state.secondsLeft % 60;
      const timeStr = `${mins}m ${secs < 10 ? "0" : ""}${secs}s`;

      try {
        for (const entity of dim.getEntities({ tags: ["dimension_shifter"] })) {
          entity.nameTag = `§d✦ Dimension Shifter ✦\n§e[Leaves in ${timeStr}]`;
        }
      } catch (e) {}

      if (state.secondsLeft <= 0) {
        state.isPresent = false;
        state.nextVisitIn = getRandomInterval();
        clearShifterStall(key);

        try {
          for (const entity of dim.getEntities({ tags: ["dimension_shifter"] })) {
            dim.playSound("mob.endermen.portal", entity.location, { volume: 1.0, pitch: 0.8 });
            entity.remove();
          }
          for (const p of world.getAllPlayers()) {
            p.sendMessage(`§d[Dimension Shifter] §7The Dimension Shifter in ${key.toUpperCase()} slipped through the rift. He will return later!`);
          }
        } catch (e) {}
      }
    }
  }
}

export function openShifterTradeModal(player, dimKey) {
  const state = dimensionShifterState[dimKey];
  const visit = state ? state.visitId : undefined;
  if (!state || !state.isPresent || state.trades.length === 0) {
    player.sendMessage("§cThe Dimension Shifter is not available right now.");
    return;
  }

  const form = new ActionFormData();
  form.title("§d✦ Dimension Shifter Trades ✦");
  form.body("§7Choose a trade to purchase using your gathered materials.\nStock is shared across all players on the island!");

  for (const trade of state.trades) {
    const currName = trade.currency.replace("minecraft:", "").replace(/_/g, " ");
    const itemName = trade.itemId.replace("minecraft:", "").replace(/_/g, " ");
    const stockStr = trade.stock > 0 ? `§a[Stock: ${trade.stock}]` : "§c[SOLD OUT]";

    form.button(
      `${trade.tierColor}[${trade.tierName}] §f${trade.itemCount}x ${itemName}\n§ePrice: ${trade.cost}x ${currName} ${stockStr}`
    );
  }

  form.show(player).then((response) => {
    if (response.canceled || response.selection === undefined) return;

    if (!state.isPresent || state.visitId !== visit) {
      player.sendMessage("§c[Dimension Shifter] The Dimension Shifter has already left!");
      return;
    }
    const selectedTrade = state.trades[response.selection];
    if (!selectedTrade) return;

    if (selectedTrade.stock <= 0) {
      player.sendMessage("§c[Dimension Shifter] That item is completely sold out for this visit!");
      player.playSound("note.bass", { pitch: 0.8, volume: 1.0 });
      return;
    }

    const inv = player.getComponent("minecraft:inventory")?.container;
    if (!inv) return;

    let availableCurrency = 0;
    for (let slot = 0; slot < inv.size; slot++) {
      const item = inv.getItem(slot);
      if (item && item.typeId === selectedTrade.currency) {
        availableCurrency += item.amount;
      }
    }

    if (availableCurrency < selectedTrade.cost) {
      const currName = selectedTrade.currency.replace("minecraft:", "").replace(/_/g, " ");
      player.sendMessage(`§c[Dimension Shifter] You need §e${selectedTrade.cost}x ${currName}§c, but you only have §e${availableCurrency}§c!`);
      player.playSound("note.bass", { pitch: 0.8, volume: 1.0 });
      return;
    }

    const purchasedStacks = buildTradeStacks(selectedTrade.itemId, selectedTrade.itemCount);
    if (purchasedStacks.length === 0) {
      player.sendMessage("§c[Dimension Shifter] That item is unavailable right now. You were not charged.");
      player.playSound("note.bass", { pitch: 0.8, volume: 1.0 });
      return;
    }

    let remainingToDeduct = selectedTrade.cost;
    for (let slot = 0; slot < inv.size; slot++) {
      if (remainingToDeduct <= 0) break;
      const item = inv.getItem(slot);
      if (item && item.typeId === selectedTrade.currency) {
        if (item.amount <= remainingToDeduct) {
          remainingToDeduct -= item.amount;
          inv.setItem(slot, undefined);
        } else {
          item.amount -= remainingToDeduct;
          remainingToDeduct = 0;
          inv.setItem(slot, item);
        }
      }
    }

    let delivered = 0;
    for (const stack of purchasedStacks) {
      if (hoverDropAboveOneBlock(player.dimension, stack) || dropAtPlayer(player, stack)) delivered++;
    }
    if (delivered === 0) {
      for (const refund of buildTradeStacks(selectedTrade.currency, selectedTrade.cost)) dropAtPlayer(player, refund);
      player.sendMessage("§c[Dimension Shifter] The trade could not be completed. Your payment was returned.");
      player.playSound("note.bass", { pitch: 0.8, volume: 1.0 });
      return;
    }
    selectedTrade.stock--;

    const itemName = selectedTrade.itemId.replace("minecraft:", "").replace(/_/g, " ");
    player.sendMessage(`§a[Dimension Shifter] Trade complete! Purchased §e${selectedTrade.itemCount}x ${itemName}§a!`);
    player.playSound("random.orb", { pitch: 1.2, volume: 1.0 });
    player.dimension.spawnParticle("minecraft:totem_particle", player.location);
  });
}
