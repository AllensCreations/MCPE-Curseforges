# Editable Minecraft Bedrock World Templates

This folder contains the three mode-specific reference archives used by the OneBlock world builder:

- Creative: `Creative_Void_Sandbox.mcworld.zip`
- Survival: `Survival_Void_World.mcworld.zip`
- Hardcore: `Hardcore_Void_World.mcworld.zip`

## Editing

Use the extracted editable copies in `Extracted/Creative/`, `Extracted/Survival/`, and `Extracted/Hardcore/`. The sync workflow extracts archive references into these folders when initializing or refreshing them. When a commit changes files under `Extracted/`, the workflow packages the edited folders back into the three archives.

The current reference templates do not contain LevelDB databases. They can still provide inspectable world metadata/settings, but the build process must use the documented database carrier until complete reference worlds with `db/CURRENT` and real database files are supplied. Do not assume reference terrain/chunks are preserved.

After template or map-source changes, the build workflow regenerates all three Dirtbound world variants. Creative remains the only designated in-game tester; there is no Tester Build.
