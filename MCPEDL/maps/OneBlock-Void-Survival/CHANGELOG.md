# Changelog

---

## [1.2.18] - 2026-10-30

### Improved & Balanced

- **Content update**: Updated gameplay scripts and world data.

## [1.2.17] - 2026-10-30

### Improved & Balanced

- **Content update**: Updated gameplay scripts and world data.

## [1.2.16] - 2026-10-30

### Improved & Balanced

- **Content update**: Updated gameplay scripts and world data.

## [1.2.15] - 2026-10-29

### Improved & Balanced

- **Content update**: Updated gameplay scripts and world data.

## Unreleased

### Improved & Balanced
- **Hardcore Removed**: The Hardcore world is gone. The map now comes as a Creative world and a Survival world. Permanent Spectator Mode after death and the locked Hard difficulty no longer exist.
- **Island Cores Complete Instantly**: Breaking the last block of an island core now completes it at once. The bedrock around the core is removed and the treasure chest appears immediately, with no bedrock reveal or 3 second wait.
- **Island Discovered Message**: The large centered title is now a small action bar message.
- **Chat Command Leftovers Removed**: Unused chat command code that cannot work in current Minecraft was removed.

## [1.2.14] - 2026-10-29

### Added
- **Three Worlds**: The map now comes as a Creative world, a Survival world, and a Hardcore world.
- **Worlds Included**: The Creative, Survival, and Hardcore worlds are included with the project.

### Improved & Balanced
- **Hardcore Is No Longer Forced**: Permanent Spectator Mode after death and the locked Hard difficulty now apply only to the Hardcore world. The Survival world uses normal respawning, and the Creative world starts every player in Creative mode.
- **Admin World Removed**: The separate Admin world is no longer included.

## Unreleased (fixes after v1.2.6)

### Gameplay fixes
- Random events now trigger while mining by hand: mystery chests, mob spawns, Lucky Rush, Void Surge, Jackpot, relic, totem and dragon egg. A wrong variable name previously stopped all of them.
- Island blocks, mobs and biomes now use valid Bedrock names, so islands no longer have missing blocks:
  - `terracotta` -> `hardened_clay`
  - `snow_block` -> `snow`
  - `end_stone_bricks` -> `end_bricks`
  - `rooted_dirt` -> `dirt_with_roots`
  - `spawner` -> `mob_spawner`
  - `stonecutter` -> `stonecutter_block`
  - entity `zombified_piglin` -> `zombie_pigman`
  - biomes `dark_forest` / `nether_wastes` are mapped to `roofed_forest` / `hell` when painting island biomes
- Island reward chests now spawn on Lush Floral Oasis, Badlands Mesa, Bee Apiary, Melon Greenhouse, Elytra Hangar and Ice Spike Peak.
- Finishing an island core is now retried automatically if you leave the area or close the world during the 3-second window. It no longer destroys blocks you built above the core.
- Sculk Laboratory can be completed: the unbreakable `reinforced_deepslate` was replaced with `deepslate_bricks` in its core pool.
- The OneBlock no longer stays bedrock if the world is closed during a phase change.
- The island repair loop no longer places a core before the island is built.
- The victory message now appears after completing the final End phase (200th End block) instead of when entering it.
- Chests no longer overwrite blocks you placed or loot still inside an old chest.
- Phase blocks that cannot exist on the OneBlock spot were replaced (dead bush, waterlily, bamboo, pink petals, pale hanging moss, chorus plant, chorus flower).
- The admin HUD no longer references a missing variable.
- Fixed the tutorial skipping every other step: a broken block is no longer counted twice.
- New island announcement is now a small action bar message instead of a large centered title.

### Exploit fixes
- A OneBlock or island core removed by a piston, explosion or similar now counts as progress instead of being renewed for free.
- Adding the `admin` tag no longer turns the whole survival world into an admin world. Admin features are only active in the Admin build.
- Lucky Rush now spawns ores instead of gold, emerald and iron blocks, and two rushes can no longer run at once.

### Dimension Shifter
- Now requires `@minecraft/server` 1.15.0 so the trade menu can open. The minimum engine version is now 1.21.50.
- Purchases are rejected after the Shifter has left.
- Stall blocks are removed when the Shifter leaves, and orphaned Shifters are removed after a reload.
- Trade pool changes: diamond block -> enchanting table (End), netherite block -> beacon (Nether), potion -> blaze powder.
- Liquid Protection now reads the correct player value.

### Cleanup
- Removed the unused `void_trader_trades.json`, the non-working piston hook, and unused code.
- `DESCRIPTION.md` now lists the correct island counts (33 Overworld, 7 Nether, 3 End), the real phase lengths, Hardcore Survival, and the 1.21.50 requirement.

### Documentation
- `README.md` now lists the requirements (Minecraft 1.21.50+, Hardcore Survival) and links to this changelog.
- `DESCRIPTION.md` now describes the tutorial and starter gift chest, island core chests, random mid-phase events, and how the Dimension Shifter works.

### Known limitations
- Admin chat commands do not work on stable APIs. The Admin build's buttons, double-sneak and scriptevent still work.
- Each island is built in a single tick, which can cause a short hitch.
- The `.mcworld` and `.mcpack` files must be rebuilt to include these changes.
