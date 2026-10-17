# Selective Mob Controller by AllensCreations

A high-performance Bedrock Behavior Pack add-on designed to strictly filter entity spawns and heavily boost cluster sizes and spawn rates for allowed mobs up to **Ludicrous Swarms (75-mob density caps)**.

---

## Key Features

- **Four Selectable In-Game Subpacks**:
  1. **Undead Apocalypse**: Zombies, Skeletons, Phantoms, Drowned, Husks, and Strays.
  2. **Hostiles Only**: Full hostile monster invasion (Zombies, Skeletons, Creepers, Spiders, Endermen, Witches, Nether hostiles).
  3. **Peaceful Farm**: Livestock only (Cows, Sheep, Pigs, Chickens, Horses, Llamas, etc.).
  4. **Invasion & Raids**: Pillagers, Vindicators, Ravagers, and Witches.

- **Two-Layer Enforcement**:
  - **Layer 1 (Script Purge Guard)**: Powered by `@minecraft/server` v1.13.0 `world.afterEvents.entitySpawn`. Catches naturally spawned entities (`cause === EntityInitializationCause.Spawned`) and instantly, silently removes any unauthorized entity types.
  - **Layer 2 (Zero-Weight Spawn Rules)**: Every subpack includes tailored `spawn_rules/*.json` that zero out unselected vanilla mobs (`weight: 0`, `density_limit: 0`) so the game engine avoids allocating spawn cycles to unwanted mobs.

- **Ludicrous / Swarm Densities**:
  - Spawn weight boosted to **220** (vanilla ~10-40).
  - Herd cluster size boosted to **16–32 mobs per spawn** (vanilla ~2-4).
  - Area density cap expanded to **75 mobs** per surface and underground sector.

- **Anti-Lag & Survival Preservation**:
  - **Drop Throttling**: Reduces clutter from 75-mob horde massacres by retaining ~30% of ground item drops upon mob death.
  - **Exemptions**: Bosses (Ender Dragon, Wither, Elder Guardian), NPCs (Villagers, Iron Golems, Wandering Traders), Tamed Pets (`minecraft:tameable`), utility items/projectiles, and third-party custom add-on entities are completely protected.

---

## Directory Structure

```
Selective-Mob-Controller/
└── behavior_pack/
    ├── manifest.json
    ├── pack_icon.png
    ├── scripts/
    │   └── main.js
    ├── spawn_rules/
    │   └── zombie.json
    └── subpacks/
        ├── undead_apocalypse/
        │   ├── scripts/main.js
        │   └── spawn_rules/ (boosted undead, zeroed others)
        ├── hostiles_only/
        │   ├── scripts/main.js
        │   └── spawn_rules/ (boosted monsters, zeroed animals)
        ├── peaceful_farm/
        │   ├── scripts/main.js
        │   └── spawn_rules/ (boosted livestock, zeroed monsters)
        └── invasion_raids/
            ├── scripts/main.js
            └── spawn_rules/ (boosted illagers, zeroed others)
```

---

## Compatibility

- **Minecraft Bedrock**: 1.21.0 through 1.26+
- **Platforms**: Mobile (Android/iOS), PC (Windows 10/11), Consoles (Xbox/PlayStation/Switch), and Realms.
- **Dependencies**: `@minecraft/server` v1.13.0
