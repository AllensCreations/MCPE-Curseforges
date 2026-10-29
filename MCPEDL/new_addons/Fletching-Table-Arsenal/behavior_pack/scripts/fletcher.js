import { system, ItemStack } from "@minecraft/server";
import { ActionFormData, FormCancelationReason } from "@minecraft/server-ui";

export const ARROW_ID = "minecraft:arrow";
export const BATCH_SIZE = 16;

const isPlainArrow = (item) => item.typeId === ARROW_ID && !item.nameTag && item.getLore().length === 0;
const isItem = (id) => (item) => item.typeId === id;

export const RECIPES = [
  {
    key: "explosive",
    tag: "fa_explosive",
    color: "§c",
    menuName: "Explosive Arrows",
    itemName: "§l§cExplosive Arrow",
    lore: ["§7Fletcher's Workbench ammunition", "§8Detonates on impact"],
    icon: "textures/items/gunpowder",
    effect: "Detonates on impact with a small blast that spares your blocks.",
    particles: ["minecraft:basic_flame_particle", "minecraft:basic_smoke_particle"],
    needs: [
      { name: ["Arrow", "Arrows"], amount: 16, match: isPlainArrow },
      { name: ["Gunpowder", "Gunpowder"], amount: 2, match: isItem("minecraft:gunpowder") }
    ]
  },
  {
    key: "teleport",
    tag: "fa_teleport",
    color: "§d",
    menuName: "Teleportation Arrows",
    itemName: "§l§dTeleportation Arrow",
    lore: ["§7Fletcher's Workbench ammunition", "§8Teleports the archer to the impact point"],
    icon: "textures/items/ender_pearl",
    effect: "Teleports you to the point where the arrow lands.",
    particles: ["minecraft:endrod", "minecraft:villager_happy"],
    needs: [
      { name: ["Arrow", "Arrows"], amount: 16, match: isPlainArrow },
      { name: ["Ender Pearl", "Ender Pearls"], amount: 1, match: isItem("minecraft:ender_pearl") }
    ]
  },
  {
    key: "frost",
    tag: "fa_frost",
    color: "§b",
    menuName: "Frost Arrows",
    itemName: "§l§bFrost Arrow",
    lore: ["§7Fletcher's Workbench ammunition", "§8Chills and slows targets"],
    icon: "textures/items/snowball",
    effect: "Slows and weakens targets and puts out fire on them.",
    particles: ["minecraft:ice_evaporation_emitter", "minecraft:critical_hit_emitter"],
    needs: [
      { name: ["Arrow", "Arrows"], amount: 16, match: isPlainArrow },
      { name: ["Snowball", "Snowballs"], amount: 4, match: isItem("minecraft:snowball") }
    ]
  },
  {
    key: "incendiary",
    tag: "fa_incendiary",
    color: "§6",
    menuName: "Incendiary Arrows",
    itemName: "§l§6Incendiary Arrow",
    lore: ["§7Fletcher's Workbench ammunition", "§8Sets targets and ground ablaze"],
    icon: "textures/items/fireball",
    effect: "Ignites targets and the open ground beside the impact.",
    particles: ["minecraft:basic_flame_particle", "minecraft:lava_particle"],
    needs: [
      { name: ["Arrow", "Arrows"], amount: 16, match: isPlainArrow },
      { name: ["Fire Charge", "Fire Charges"], amount: 1, match: isItem("minecraft:fire_charge") }
    ]
  }
];

const active = new Set();

const wait = (ticks) => new Promise((resolve) => system.runTimeout(resolve, ticks));

const label = (need, amount = need.amount) => `${amount} ${need.name[amount === 1 ? 0 : 1]}`;

function countMatching(container, match) {
  let total = 0;
  for (let i = 0; i < container.size; i++) {
    const item = container.getItem(i);
    if (item && match(item)) total += item.amount;
  }
  return total;
}

function removeMatching(container, match, amount) {
  let left = amount;
  for (let i = 0; i < container.size && left > 0; i++) {
    const item = container.getItem(i);
    if (!item || !match(item)) continue;
    const taken = Math.min(item.amount, left);
    left -= taken;
    if (item.amount === taken) {
      container.setItem(i, undefined);
    } else {
      item.amount -= taken;
      container.setItem(i, item);
    }
  }
  return left === 0;
}

export function checkRecipe(container, recipe) {
  const needs = recipe.needs.map((need) => ({ need, have: countMatching(container, need.match) }));
  return { needs, ready: needs.every((entry) => entry.have >= entry.need.amount) };
}

function burst(dimension, center, particles, count) {
  for (let i = 0; i < count; i++) {
    const location = {
      x: center.x + (Math.random() - 0.5) * 1.4,
      y: center.y + Math.random() * 0.9,
      z: center.z + (Math.random() - 0.5) * 1.4
    };
    for (const particle of particles) {
      try {
        dimension.spawnParticle(particle, location);
      } catch {
        continue;
      }
    }
  }
}

export function craft(player, recipe, dimension, center) {
  const container = player.getComponent("minecraft:inventory").container;
  const status = checkRecipe(container, recipe);
  if (!status.ready) {
    player.onScreenDisplay.setActionBar("§c[FLETCHER] §fInsufficient materials in inventory!");
    player.playSound("note.bass", { volume: 0.8, pitch: 0.7 });
    return false;
  }
  for (const need of recipe.needs) removeMatching(container, need.match, need.amount);
  const result = new ItemStack(ARROW_ID, BATCH_SIZE);
  result.nameTag = recipe.itemName;
  result.setLore(recipe.lore);
  const leftover = container.addItem(result);
  if (leftover) dimension.spawnItem(leftover, player.location);
  player.playSound("random.bow", { volume: 1, pitch: 1 });
  player.onScreenDisplay.setActionBar(`§6[FLETCHER] §fCrafted §a${BATCH_SIZE}x ${recipe.itemName}§f!`);
  burst(dimension, center, ["minecraft:villager_happy", ...recipe.particles], 10);
  return true;
}

function buildForm(container) {
  const form = new ActionFormData().title("§6[ FLETCHER'S WORKBENCH ]");
  const seen = new Set();
  const supplies = [];
  for (const recipe of RECIPES) {
    for (const need of recipe.needs) {
      if (seen.has(need.name[1])) continue;
      seen.add(need.name[1]);
      supplies.push(`§7${need.name[1]} §f${countMatching(container, need.match)}`);
    }
  }
  form.body(
    "Select an ammunition conversion to process using your inventory supplies:\n\n" +
      "§8Your supplies\n" + supplies.join("  §8|  ") + "\n"
  );
  for (const recipe of RECIPES) {
    const status = checkRecipe(container, recipe);
    const cost = recipe.needs.map((need) => label(need)).join(" + ");
    const state = status.ready ? "§2[READY]" : "§4[MISSING]";
    form.button(`§l${recipe.color}${recipe.menuName} §r§8x${BATCH_SIZE}\n§8${cost}  ${state}`, recipe.icon);
  }
  return form;
}

function buildDetailForm(container, recipe) {
  const status = checkRecipe(container, recipe);
  const slots = status.needs
    .map(({ need, have }) => `§8[ ${have >= need.amount ? "§a" : "§c"}${label(need)} §8]`)
    .join(" §7+ ");
  const stock = status.needs
    .map(({ need, have }) => `${have >= need.amount ? "§a" : "§c"}${have}§8/§7${need.amount} §7${need.name[1]}`)
    .join("  §8|  ");
  const form = new ActionFormData().title("§6[ FLETCHER'S WORKBENCH ]");
  form.body(
    `${recipe.color}§l${recipe.menuName}\n\n§8INPUT\n${slots}\n\n§8OUTPUT\n§8[ ${recipe.color}${BATCH_SIZE}x ${recipe.menuName} §8]\n\n` +
      `§8STOCK\n${stock}\n\n§8EFFECT\n§7${recipe.effect}\n`
  );
  form.button(
    status.ready ? `§2§lCRAFT §r§8x${BATCH_SIZE}` : "§4§lCRAFT §r§8(missing materials)",
    recipe.icon
  );
  form.button("§8« Back to recipes");
  return form;
}

async function showForm(player, form) {
  for (let attempt = 0; attempt < 10; attempt++) {
    const response = await form.show(player);
    if (response.cancelationReason !== FormCancelationReason.UserBusy) return response;
    await wait(10);
  }
  return undefined;
}

export async function openWorkbench(player, block) {
  if (active.has(player.id)) return;
  active.add(player.id);
  const dimension = block.dimension;
  const center = { x: block.location.x + 0.5, y: block.location.y + 1.05, z: block.location.z + 0.5 };
  try {
    player.playSound("random.click", { volume: 0.6, pitch: 1.2 });
    let view = -1;
    while (true) {
      const container = player.getComponent("minecraft:inventory").container;
      if (view < 0) {
        const response = await showForm(player, buildForm(container));
        if (!response || response.canceled) break;
        view = response.selection;
        continue;
      }
      const recipe = RECIPES[view];
      const response = await showForm(player, buildDetailForm(container, recipe));
      if (!response || response.canceled) break;
      if (response.selection === 0) {
        craft(player, recipe, dimension, center);
        await wait(6);
      } else {
        view = -1;
      }
    }
  } catch (error) {
    console.warn(`[Fletching Table Arsenal] ${error}`);
  } finally {
    active.delete(player.id);
  }
}
