import { world } from "@minecraft/server";

// Banquet buff table: item typeId -> [effect, amplifier (level - 1), duration in seconds]
const BUFFS = {
  "custom:glazed_wings": [["jump_boost", 1, 180], ["slow_falling", 0, 60]],
  "custom:miners_roast": [["haste", 1, 180], ["night_vision", 0, 180]],
  "custom:mariners_pot": [["dolphins_grace", 0, 120], ["water_breathing", 0, 240]],
  "custom:highland_venison": [["speed", 1, 180]],
  "custom:lumberjacks_ham": [["haste", 0, 240], ["saturation", 0, 30]],
  "custom:honey_berry_tart": [["saturation", 1, 60], ["speed", 0, 120]],
  "custom:strider_gumbo": [["fire_resistance", 0, 180]],
  "custom:scholars_dumplings": [["night_vision", 0, 240], ["luck", 0, 180]],
  "custom:warlords_steak": [["strength", 1, 120], ["resistance", 0, 120]],
  "custom:citadel_ham": [["absorption", 1, 180], ["resistance", 1, 120]],
  "custom:sovereign_platter": [["conduit_power", 0, 180], ["regeneration", 1, 60]],
  "custom:phoenix_roast": [["fire_resistance", 0, 600], ["strength", 0, 180]],
  "custom:verdant_ambrosia": [["regeneration", 1, 90], ["saturation", 2, 30]],
  "custom:dragonlords_galantine": [["strength", 2, 180], ["resistance", 1, 180], ["fire_resistance", 0, 600]],
  "custom:celestial_roast": [["absorption", 4, 240], ["regeneration", 2, 120], ["resistance", 1, 180]],
  "custom:imperial_feast": [["village_hero", 4, 900], ["saturation", 3, 120], ["resistance", 0, 300]]
};

world.afterEvents.itemCompleteUse.subscribe((event) => {
  const buffs = BUFFS[event.itemStack.typeId];
  if (!buffs) return;
  for (const [effect, amplifier, seconds] of buffs) {
    try {
      event.source.addEffect(effect, seconds * 20, { amplifier });
    } catch (e) {}
  }
});
