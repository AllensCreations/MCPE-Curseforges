import { world, system, ItemStack } from "@minecraft/server";
import { ONE_BLOCK_Y, PROP, BONUS_CHANCE, BONUS_AMOUNT_MULT, BREAKS_PER_COIN, COINS_PER_REWARD, RARE_UNIT_PRICE, PHASE_REWARD, COIN_NAME } from "./config.js";
import { slotAt, recordOf, slotOf, slotCoords, islandMemberIds } from "./slots.js";
import { phaseIndexFor, rollBonus, PHASES, phaseLabel, breaksToNextPhase } from "./phases.js";
import { islandBreaks, addIslandBreak, regenerate } from "./island.js";
import { traitLabel } from "./traits.js";
import { blockIdAt, isLoaded, isValidItem, overworld, stackLimit, findPlayer, isCreative, niceName } from "./util.js";
import { addCoins } from "./market.js";
import { priceInfo } from "./prices.js";

function announcePhase(players, index) {
  const p = PHASES[index];
  for (const player of players) {
    try {
      player.sendMessage(`§6§l[ALN] §r§eYour island advances to phase ${index + 1}: ${p.color}${p.name}§e.`);
      player.onScreenDisplay.setTitle(`${p.color}${p.name}`);
      player.playSound("random.levelup");
    } catch (e) {}
  }
}

function dropBonus(dim, x, z, trait, phaseIndex, breaker) {
  if (Math.random() >= BONUS_CHANCE) return;
  for (let attempt = 0; attempt < 3; attempt++) {
    const bonus = rollBonus(phaseIndex, trait);
    if (!bonus || !isValidItem(bonus.id)) continue;
    try {
      const mult = priceInfo(bonus.id).unit >= RARE_UNIT_PRICE ? 1 : BONUS_AMOUNT_MULT;
      const amount = Math.min(bonus.amount * mult, stackLimit(bonus.id));
      dim.spawnItem(new ItemStack(bonus.id, amount), { x: x + 0.5, y: ONE_BLOCK_Y + 1.2, z: z + 0.5 });
      breaker.onScreenDisplay.setActionBar(`§6Bonus drop: §f${amount}x ${niceName(bonus.id)}`);
      breaker.playSound("random.orb");
    } catch (e) {}
    return;
  }
}

function handleBreak(event) {
  const block = event.block;
  if (block.y !== ONE_BLOCK_Y || block.dimension.id !== "minecraft:overworld") return;
  const slot = slotAt(block.x, block.z);
  if (slot === undefined) return;
  const record = recordOf(slot);
  if (!record) return;

  const before = phaseIndexFor(islandBreaks(slot));
  const total = addIslandBreak(slot);
  const after = phaseIndexFor(total);

  const breaker = event.player;
  const mine = (breaker.getDynamicProperty(PROP.BREAKS) ?? 0) + 1;
  breaker.setDynamicProperty(PROP.BREAKS, mine);
  if (mine % BREAKS_PER_COIN === 0 && !isCreative(breaker)) addCoins(breaker.id, COINS_PER_REWARD);

  const dim = block.dimension;
  const x = block.x;
  const z = block.z;
  system.run(() => {
    regenerate(dim, x, z, record.trait, after);
    dropBonus(dim, x, z, record.trait, after, breaker);
  });

  if (after !== before) {
    const memberIds = islandMemberIds(slot);
    const others = memberIds.map((id) => findPlayer(id)).filter((p) => p && p.id !== breaker.id);
    announcePhase([breaker, ...others], after);
    if (!isCreative(breaker)) {
      const share = Math.floor((PHASE_REWARD * after) / memberIds.length);
      for (const memberId of memberIds) {
        addCoins(memberId, share);
        findPlayer(memberId)?.sendMessage(`§6[ALN] §aPhase reward: ${share} ${COIN_NAME}.`);
      }
    }
  }
  const left = breaksToNextPhase(total);
  const tail = left > 0 ? `§7Next phase in §f${left}` : "§7Final phase";
  try {
    breaker.onScreenDisplay.setActionBar(`${phaseLabel(after)} §8| §7Island: ${traitLabel(record.trait)} §8| ${tail}`);
  } catch (e) {}
}

function guardIslands() {
  const dim = overworld();
  for (const player of world.getAllPlayers()) {
    const slot = slotOf(player);
    if (slot === undefined) continue;
    const record = recordOf(slot);
    if (!record || !record.built) continue;
    const c = slotCoords(slot);
    if (!isLoaded(dim, c.x, ONE_BLOCK_Y, c.z)) continue;
    if (blockIdAt(dim, c.x, ONE_BLOCK_Y, c.z) === "minecraft:air") {
      regenerate(dim, c.x, c.z, record.trait, phaseIndexFor(islandBreaks(slot)));
    }
  }
}

export function startOneBlock() {
  world.afterEvents.playerBreakBlock.subscribe((event) => {
    try {
      handleBreak(event);
    } catch (e) {}
  });
  system.runInterval(() => {
    try {
      guardIslands();
    } catch (e) {}
  }, 40);
}
