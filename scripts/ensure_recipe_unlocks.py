#!/usr/bin/env python3
"""Ensure every custom shaped/shapeless crafting recipe is always unlocked."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SEARCH_ROOTS = (ROOT / "MCPEDL" / "addons", ROOT / "MCPEDL" / "new_addons")
RECIPE_TYPES = {"minecraft:recipe_shaped", "minecraft:recipe_shapeless"}
changed = 0
already_correct = 0
skipped = 0

for search_root in SEARCH_ROOTS:
    if not search_root.is_dir():
        continue
    for path in sorted(search_root.glob("*/behavior_pack/recipes/**/*.json")):
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            raise SystemExit(f"Cannot read recipe JSON {path.relative_to(ROOT)}: {exc}")
        recipe_type = next((key for key in RECIPE_TYPES if key in data), None)
        if recipe_type is None:
            skipped += 1
            continue
        recipe = data[recipe_type]
        # Bedrock uses a single unlock object for shaped recipes and an array for shapeless recipes.
        desired = {"context": "AlwaysUnlocked"} if recipe_type == "minecraft:recipe_shaped" else [{"context": "AlwaysUnlocked"}]
        if recipe.get("unlock") == desired:
            already_correct += 1
            continue
        recipe["unlock"] = desired
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        changed += 1

print(f"AlwaysUnlocked recipes updated: {changed}; already correct: {already_correct}; non-shaped/shapeless recipes skipped: {skipped}")
