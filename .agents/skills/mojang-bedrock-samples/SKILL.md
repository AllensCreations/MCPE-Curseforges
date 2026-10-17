---
name: mojang-bedrock-samples
description: >-
  Reference and automation guide for using Mojang's official Bedrock Samples repository
  (https://github.com/mojang/bedrock-samples) to extract vanilla resource pack textures,
  reference vanilla JSON definitions, and generate authentic crafting UI images.
---

# Mojang Bedrock Samples Skill

This skill provides direct guidelines and workflows for leveraging Mojang's official [bedrock-samples repository](https://github.com/mojang/bedrock-samples) across all Minecraft Bedrock add-ons and documentation in this repository.

The full repository is cloned locally at `/root/bedrock-samples/` (containing all 22,000+ vanilla resource, behavior, and documentation files).

---

## 1. Overview of Bedrock Samples

The repository contains upstream vanilla Minecraft Bedrock data and assets that change between releases. Verify the checked-out sample version and confirm each referenced path exists before relying on a file or copying a value:

- **`resource_pack/`**: Complete vanilla client assets:
  - `textures/items/`: Item icons (e.g., `gold_helmet.png`, `lantern.png`, `iron_ingot.png`).
  - `textures/blocks/`: Block textures and placeable items (e.g., `torch_on.png`, `soul_torch.png`, `crafting_table_top.png`).
  - `textures/models/armor/`: Humanoid armor layer textures (64x32 / 64x64).
  - `textures/ui/`: UI frames, slots, and icons.
  - `attachables/`: Entity attachable JSON definitions for wearable items.
  - `texts/`: Official localized language strings (`en_US.lang`).
- **`behavior_pack/`**: Complete vanilla server/data definitions:
  - `items/`: Vanilla item components and schemas.
  - `entities/`: Base entity behaviors, components, and component groups.
  - `recipes/`: Standard vanilla shaped, shapeless, and furnace recipe schemas.
  - `loot_tables/`: Vanilla drop probabilities and equipment pools.

---

## 2. Using Official Resource Pack Textures in Crafting UI Images

When generating 3x3 crafting grid images for `README.md` files or platform documentation, always source vanilla ingredient textures directly from `/root/bedrock-samples/resource_pack/`:

### Standard Texture Paths
| Ingredient | Path in bedrock-samples |
| :--- | :--- |
| Golden Helmet | `resource_pack/textures/items/gold_helmet.png` |
| Lantern | `resource_pack/textures/items/lantern.png` |
| Torch | `resource_pack/textures/blocks/torch_on.png` |
| Soul Lantern | `resource_pack/textures/items/soul_lantern.png` |
| Soul Torch | `resource_pack/textures/blocks/soul_torch.png` |
| Iron Ingot | `resource_pack/textures/items/iron_ingot.png` |
| Gold Ingot | `resource_pack/textures/items/gold_ingot.png` |
| Diamond | `resource_pack/textures/items/diamond.png` |
| Redstone | `resource_pack/textures/items/redstone_dust.png` |

### Python Generation Workflow
Always scale vanilla 16x16 pixel textures using nearest-neighbor interpolation (`Image.Resampling.NEAREST`) to prevent blurring and preserve authentic pixel art:

```python
from PIL import Image

# Load official vanilla item texture
vanilla_icon = Image.open('/root/bedrock-samples/resource_pack/textures/items/gold_helmet.png').convert('RGBA')

# Nearest-neighbor upscale into crafting slot
slot_size = (44, 44)
pixel_scaled = vanilla_icon.resize(slot_size, Image.Resampling.NEAREST)
```

---

## 3. Best Practices for Add-on Development

1. **Vanilla Parity:** Inspect vanilla recipes in `behavior_pack/recipes/` to match formatting version, group tags, and ingredient identifiers.
2. **Durability and Defense:** Match armor values to the vanilla benchmark in the checked-out sample version. Inspect actual item definitions and relevant documentation before using values; do not rely on hardcoded examples here because vanilla values and schemas may change.
3. **Texture Sourcing:** Prefer official vanilla textures for vanilla items in promotional materials. First verify that `/root/bedrock-samples/` exists and contains the required asset; if unavailable, report the limitation and do not pretend the asset was sourced.
