# Editable Minecraft Bedrock World Templates

This folder contains the three editable, mode-specific world references used by the OneBlock world builder:

- `Creative/` — Creative reference
- `Survival/` — Survival reference
- `Hardcore/` — Hardcore reference

## Editing

Open the matching folder and edit its files directly. These are the canonical sources; there are no duplicate `.mcworld.zip` archives and no nested `Extracted/` folder. Changes under `Mcpeworlds/` trigger source validation and the OneBlock build workflow, which regenerates the Creative, Survival, and Hardcore Dirtbound output worlds.

## Important database limitation

The three reference folders contain readable world metadata and pack setup but do not contain complete LevelDB databases (`db/CURRENT` and database data files). The builder currently uses a complete world only as a database carrier. Its terrain/chunks may therefore come from that carrier; do not assume the original reference terrain is preserved.

Creative remains the only designated in-game tester. There is no Tester Build, and static validation is not proof of an in-game test.
