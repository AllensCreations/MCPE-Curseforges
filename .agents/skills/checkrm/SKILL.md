---
name: checkrm
description: >-
  Audits and auto-updates all Minecraft Bedrock add-ons and projects across MCPEDL
  whose documentation status is 'Not yet written', 'Logo: Not supplied', 'Banner: Not supplied',
  or missing. Analyzes scripts, presets, entities, and manifests to write comprehensive, professional
  documentation without emojis, and synchronizes catalogs. Trigger with /checkrm or
  by asking to check/update placeholder READMEs.
---

# Check & Update READMEs Skill (/checkrm)

Use this skill whenever you or the user runs `/checkrm` or asks to scan, verify, and auto-update any add-ons with unwritten documentation or workflow placeholders (`Documentation status: Not yet written`, `Logo: Not supplied`, `Banner: Not supplied`, or missing `README.md`).

---

## Workflow Steps

### Step 1: Scan Documentation Status
Run the project status audit tool:
```bash
python3 scripts/check_readme_status.py
```
This identifies every project across `MCPEDL/addons/`, `MCPEDL/new_addons/`, `MCPEDL/script/`, and `MCPEDL/maps/` that has:
- `README.md` missing.
- Placeholders such as `Documentation status`, `Not yet written`, `Logo: Not supplied`, or `Banner: Not supplied`.
- Template comments such as `<!-- TODO: -->`.

### Step 2: Source Code Analysis
For each identified project needing updates:
1. **Manifests** (`behavior_pack/manifest.json`, `presets/**/manifest.json`, `resource_pack/manifest.json`):
   - Extract pack name, description, UUIDs, version, and `min_engine_version`.
   - Ensure `"metadata"` has `"authors": ["AllensCreations"]` and `"product_type": "addon"`.
2. **Scripts** (`behavior_pack/scripts/**/*.js`, `presets/**/scripts/**/*.js`):
   - Inspect Bedrock Script API events (`world.beforeEvents.entityHurt`, `world.afterEvents.worldInitialize`, etc.).
   - Deduce protection mechanics, cancel actions, event subscriptions, commands, and target entities.
3. **Entity Behaviors & Resources** (`entities/`, `animation_controllers/`, `texts/en_US.lang`):
   - Inspect components, interaction prompts, and visual states.
4. **Assets Check**:
   - Check if a logo or banner image exists (`banner.png`, `banner.jpg`, `pack_icon.png`, `preview.png`).
   - If present, link it cleanly in the header. If not present, omit the broken image/placeholder tags.

### Step 3: Write Complete Professional `README.md`
Generate the full documentation adhering to the repo standard:
- **No Emojis**: Do not use emojis in headings, feature lists, or text. Maintain a clean, professional, and technical tone matching `Vanilla-Quality-of-Life` and `Mining-Helmet`.
- **Badges**: Include standard Bedrock version, Release tag, Format, and Platform badges.
- **Overview**: In-depth explanation of the problem the add-on solves and how it works.
- **Features & Presets**: Clear breakdown of core features and any included presets (e.g. all-tamed, wolf, cat, horse, parrot).
- **Technical Mechanics**: Detail event cancellation (`entityHurt.subscribe`), component checks (`minecraft:tameable`), and game balance impacts.
- **Installation & Guidelines**: Step-by-step installation instructions, creator credit, and attribution notice.

### Step 4: Catalog Synchronization
After updating the add-on `README.md`:
1. Re-run `scripts/auto_bump_and_build.py --project "<Addon-Name>" --no-bump` to synchronize parent category tables, root `README.md`, and compiled builds.
2. Re-run `python3 scripts/check_readme_status.py` to confirm all projects now report `[OK]`.
