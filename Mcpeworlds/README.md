# Editable Minecraft Bedrock World Templates

This folder contains the three editable, mode-specific world references used by the OneBlock world builder:

- `Creative/` — Creative reference
- `Survival/` — Survival reference
- `Hardcore/` — Hardcore reference

## Editing

Open the matching folder and edit its files directly. These are the canonical sources; there are no duplicate `.mcworld.zip` archives and no nested `Extracted/` folder. Changes under `Mcpeworlds/` trigger static source validation. World generation is intentionally manual and remains gated until the Creative mechanics have been tested in Minecraft and a rebuild is approved.

## Important database limitation

The three reference folders currently contain readable world metadata and pack setup but do not contain complete LevelDB databases (`db/CURRENT` and actual database data files). They are not yet complete world foundations. The builder now refuses to borrow another world's database or substitute its terrain. Supply a complete matching world for each mode before generation can proceed. No new `.mcworld` files should be generated until the Creative mechanics have been tested in Minecraft and a rebuild is approved.

Creative remains the only designated in-game tester. There is no Tester Build, and static validation is not proof of an in-game test.
