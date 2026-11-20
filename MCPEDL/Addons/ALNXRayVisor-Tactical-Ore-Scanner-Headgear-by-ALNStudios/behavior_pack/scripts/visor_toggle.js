import {
  world,
  system,
  EquipmentSlot,
  EntityComponentTypes,
} from "@minecraft/server";

const VISOR_ID = "aln:xray_visor";

const PROP_ACTIVE  = "aln_visor_active";
const PROP_BATTERY = "aln_visor_battery";

const DRAIN_INTERVAL_TICKS = 100;

function getVisorStack(player) {
  try {
    const equip = player.getComponent(EntityComponentTypes.Equippable);
    if (!equip) return null;
    const stack = equip.getEquipment(EquipmentSlot.Head);
    if (!stack || stack.typeId !== VISOR_ID) return null;
    return stack;
  } catch {
    return null;
  }
}

function setVisorStack(player, stack) {
  try {
    const equip = player.getComponent(EntityComponentTypes.Equippable);
    if (!equip) return;
    equip.setEquipment(EquipmentSlot.Head, stack);
  } catch {

  }
}

export function getBattery(stack) {
  const val = stack.getDynamicProperty(PROP_BATTERY);
  return typeof val === "number" ? Math.max(0, Math.min(100, Math.floor(val))) : 100;
}

export function isActive(stack) {
  const val = stack.getDynamicProperty(PROP_ACTIVE);
  return val === true;
}

function buildStatusBar(active, battery) {
  if (!active) {
    return "§b[X-Ray Visor] §cOFFLINE §8(Battery: " + battery + "%)";
  }
  const battColour = battery > 30 ? "§a" : battery > 10 ? "§e" : "§c";
  return "§b[X-Ray Visor] §aONLINE §8(Battery: " + battColour + battery + "%§8)";
}

export function forceVisorOff(player) {
  const stack = getVisorStack(player);
  if (!stack) return null;
  stack.setDynamicProperty(PROP_ACTIVE, false);
  setVisorStack(player, stack);
  try {
    player.onScreenDisplay.setActionBar("§b[X-Ray Visor] §cBATTERY EMPTY — recharge with Redstone Dust!");
    player.playSound("random.click", { pitch: 0.5, volume: 1.0 });
  } catch {  }
  return stack;
}

export function registerToggleListener() {

  system.runInterval(() => {
    for (const player of world.getAllPlayers()) {
      const stack = getVisorStack(player);
      if (!stack) continue;
      if (!isActive(stack)) continue;

      let battery = getBattery(stack);
      battery = Math.max(0, battery - 1);
      stack.setDynamicProperty(PROP_BATTERY, battery);

      if (battery <= 0) {

        stack.setDynamicProperty(PROP_ACTIVE, false);
        setVisorStack(player, stack);
        try {
          player.onScreenDisplay.setActionBar(
            "§b[X-Ray Visor] §cBATTERY EMPTY — recharge with Redstone Dust!"
          );
          player.playSound("random.click", { pitch: 0.5, volume: 0.8 });
        } catch {  }
      } else {

        setVisorStack(player, stack);

        try {
          player.onScreenDisplay.setActionBar(buildStatusBar(true, battery));
        } catch {  }
      }
    }
  }, DRAIN_INTERVAL_TICKS);

  world.afterEvents.itemUse.subscribe((ev) => {
    const player = ev.source;

    if (ev.itemStack.typeId !== VISOR_ID) return;

    const stack = getVisorStack(player);
    if (!stack) return;

    const battery = getBattery(stack);

    if (!isActive(stack) && battery <= 0) {
      try {
        player.onScreenDisplay.setActionBar(
          "§b[X-Ray Visor] §cNo charge — repair with Redstone Dust!"
        );
        player.playSound("random.click", { pitch: 0.4, volume: 0.8 });
      } catch {  }
      return;
    }

    const newState = !isActive(stack);
    stack.setDynamicProperty(PROP_ACTIVE, newState);
    setVisorStack(player, stack);

    try {
      player.onScreenDisplay.setActionBar(buildStatusBar(newState, battery));

      player.playSound("random.click", {
        pitch: newState ? 1.4 : 0.8,
        volume: 1.0,
      });
    } catch {  }
  });
}
