import { world, system } from "@minecraft/server";
import { ModalFormData } from "@minecraft/server-ui";

const KEY = "pet_immortality_config";
const DEFAULTS = { cat: false, wolf: false, parrot: false, horse: false, all: false };

const GROUPS = {
  cat: ["minecraft:cat"],
  wolf: ["minecraft:wolf"],
  parrot: ["minecraft:parrot"],
  horse: ["minecraft:horse", "minecraft:donkey", "minecraft:mule"]
};

const ALL_TAME = [
  "minecraft:cat",
  "minecraft:wolf",
  "minecraft:parrot",
  "minecraft:horse",
  "minecraft:donkey",
  "minecraft:mule",
  "minecraft:llama",
  "minecraft:trader_llama",
  "minecraft:camel"
];

const DIMENSIONS = ["overworld", "nether", "the_end"];

function loadConfig() {
  try {
    const raw = world.getDynamicProperty(KEY);
    return { ...DEFAULTS, ...(raw ? JSON.parse(raw) : {}) };
  } catch {
    return { ...DEFAULTS };
  }
}

function saveConfig(cfg) {
  world.setDynamicProperty(KEY, JSON.stringify(cfg));
}

function activeTypes(cfg) {
  if (cfg.all) return ALL_TAME;
  const types = [];
  for (const key of Object.keys(GROUPS)) {
    if (cfg[key]) types.push(...GROUPS[key]);
  }
  return types;
}

function isTamed(entity) {
  try {
    return entity.getComponent("minecraft:is_tamed") !== undefined;
  } catch {
    return false;
  }
}

function protect(entity) {
  try {
    entity.addEffect("resistance", 100, { amplifier: 255, showParticles: false });
    entity.addEffect("fire_resistance", 100, { amplifier: 0, showParticles: false });
    entity.addEffect("water_breathing", 100, { amplifier: 0, showParticles: false });
    const health = entity.getComponent("minecraft:health");
    if (health && health.currentValue < health.effectiveMax) health.resetToMaxValue();
  } catch {}
}

system.runInterval(() => {
  const types = activeTypes(loadConfig());
  if (types.length === 0) return;
  for (const dimId of DIMENSIONS) {
    let dim;
    try {
      dim = world.getDimension(dimId);
    } catch {
      continue;
    }
    for (const type of types) {
      let entities = [];
      try {
        entities = dim.getEntities({ type });
      } catch {}
      for (const entity of entities) {
        if (isTamed(entity)) protect(entity);
      }
    }
  }
}, 20);

world.afterEvents.entityHurt.subscribe((event) => {
  const entity = event.hurtEntity;
  if (!entity || !isTamed(entity)) return;
  if (activeTypes(loadConfig()).includes(entity.typeId)) protect(entity);
});

function openMenu(player) {
  const cfg = loadConfig();
  new ModalFormData()
    .title("Pet Immortality")
    .toggle("1. Cat", { defaultValue: cfg.cat })
    .toggle("2. Wolf", { defaultValue: cfg.wolf })
    .toggle("3. Parrot", { defaultValue: cfg.parrot })
    .toggle("4. Horse", { defaultValue: cfg.horse })
    .toggle("5. All Tame", { defaultValue: cfg.all })
    .show(player)
    .then((res) => {
      if (res.canceled || !res.formValues) return;
      const [cat, wolf, parrot, horse, all] = res.formValues;
      const next = { cat, wolf, parrot, horse, all };
      saveConfig(next);
      const state = (v) => (v ? "§aON" : "§cOFF");
      player.sendMessage(
        `§ePet Immortality §7| Cat ${state(cat)} §7| Wolf ${state(wolf)} §7| Parrot ${state(parrot)} §7| Horse ${state(horse)} §7| All Tame ${state(all)}`
      );
    })
    .catch(() => {});
}

world.afterEvents.itemUse.subscribe((event) => {
  if (event.itemStack.typeId === "minecraft:clock") openMenu(event.source);
});
