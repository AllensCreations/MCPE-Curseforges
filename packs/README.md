# 📂 Packs Source Directory — MCPE Curseforges

This directory stores the uncompressed development source trees (entities, functions, items, loot tables, recipes, and trading files) for each pack in the **MCPE Curseforges** collection by AllensCreations.

---

## 🗂️ Available Source Packs

| Pack Name | Description | Source Directory | Compiled Build (.mcpack) | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Vanilla Quality of Life** | Lightweight, scriptless vanilla-plus behavior pack with universal leashing, woodcutter, mob head drops & recipes. | [`Vanilla-Quality-of-Life/`](Vanilla-Quality-of-Life/) | [⬇️ **Download (.mcpack)**](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Vanilla-Quality-of-Life/Vanilla_QoL_AllensCreations.mcpack) | ✅ v1.2.0 |
| **Monster Companions** | Tame 27 hostile monsters into loyal combat bodyguards and rideable wall-climbing mounts using Beast Biscuits. | [`Monster-Companions/`](Monster-Companions/) | [⬇️ **Download (.mcaddon)**](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Monster-Companions/Monster_Companions_AllensCreations.mcaddon) | ✅ v1.0.0 |

---

## 🛠️ Contributing & Customizing
Each folder inside `packs/` is structured as a standard Minecraft Bedrock behavior pack:
- `entities/`: Custom and vanilla override entity JSON behaviors.
- `functions/`: Function commands and ticking hooks.
- `items/`: Custom item definitions and stack sizes.
- `loot_tables/`: Mob drop tables and block drop overrides.
- `recipes/`: Custom crafting table, furnace, smoker, and stonecutter recipes.
- `trading/`: Economy trading tables (Wandering Trader & Villagers).
- `manifest.json`: Pack UUIDs, engine versions, and module headers.
