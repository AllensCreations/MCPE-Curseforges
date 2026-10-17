import { world, system } from "@minecraft/server";

const TOOL_ID = "allenscreations:adaptive_morphing_tool";
const ROLE_NAMES = {
  axe: "Adaptive Axe",
  pickaxe: "Adaptive Pickaxe",
  shovel: "Adaptive Shovel",
  shears: "Adaptive Shears",
  sword: "Adaptive Sword",
  tool: "Adaptive Multi-Tool"
};
const lastNotice = new Map();

function getRole(blockId) {
  const id = String(blockId).toLowerCase();
  if (/(log|wood|stem|hyphae|planks|mushroom_block|bamboo_block)/.test(id)) return "axe";
  if (/(stone|ore|deepslate|cobblestone|bricks|terracotta|concrete|netherrack|blackstone|prismarine|end_stone)/.test(id)) return "pickaxe";
  if (/(dirt|grass_block|sand|gravel|clay|snow|mud|soul_sand|soul_soil|podzol|mycelium|farmland)/.test(id)) return "shovel";
  if (/(leaves|wool|web|vine|coral|seagrass|hanging_roots)/.test(id)) return "shears";
  return "tool";
}

function sendRoleNotice(player, role) {
  const key = player.id;
  const now = system.currentTick;
  const previous = lastNotice.get(key) ?? -100;
  if (now - previous < 12) return;
  lastNotice.set(key, now);
  try {
    player.onScreenDisplay.setActionBar(`§6✦ §r${ROLE_NAMES[role]} §7adapted`);
    player.dimension.spawnParticle("minecraft:basic_flame_particle", {
      x: player.location.x,
      y: player.location.y + 1,
      z: player.location.z
    });
  } catch {}
}

world.afterEvents.playerBreakBlock.subscribe((event) => {
  const player = event.player;
  try {
    const equippable = player.getComponent("minecraft:equippable");
    const selected = equippable?.getEquipment("Mainhand");
    if (!selected || selected.typeId !== TOOL_ID) return;
    const role = getRole(event.brokenBlockPermutation.type.id);
    selected.nameTag = ROLE_NAMES[role];
    equippable.setEquipment("Mainhand", selected);
    sendRoleNotice(player, role);
  } catch {}
});

world.afterEvents.entityHitEntity.subscribe((event) => {
  const player = event.damagingEntity;
  if (player.typeId !== "minecraft:player") return;
  try {
    const equippable = player.getComponent("minecraft:equippable");
    const selected = equippable?.getEquipment("Mainhand");
    if (!selected || selected.typeId !== TOOL_ID) return;
    selected.nameTag = ROLE_NAMES.sword;
    equippable.setEquipment("Mainhand", selected);
    sendRoleNotice(player, "sword");
  } catch {}
});

world.afterEvents.itemUse.subscribe((event) => {
  if (event.itemStack.typeId !== TOOL_ID) return;
  const player = event.source;
  try {
    player.sendMessage("§6Adaptive Morphing Multi-Tool §7— adapts its role after mining or attacking.");
  } catch {}
});
