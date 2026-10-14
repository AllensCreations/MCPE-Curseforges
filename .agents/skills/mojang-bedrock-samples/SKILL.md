---
name: mojang-bedrock-samples
description: >-
  Reference and automation guide for using Mojang's official Bedrock Samples repository
  (https://github.com/mojang/bedrock-samples) to extract vanilla resource pack textures,
  reference vanilla JSON definitions, and generate authentic crafting UI images.
---

# Mojang Bedrock Samples Skill

This skill provides direct guidelines and workflows for leveraging Mojang's official [bedrock-samples repository](https://github.com/mojang/bedrock-samples) across all Minecraft Bedrock add-ons and documentation in this repository.

---

## 1. Overview of Bedrock Samples

The official repository `https://github.com/mojang/bedrock-samples` contains the upstream vanilla Minecraft Bedrock data and assets updated with every release:

- **`resource_pack/`**: Complete vanilla client assets:
  - `textures/items/`: Item icons (e.g., `gold_helmet.png`, `lantern.png`, `iron_ingot.png`).
  - `textures/blocks/`: Block textures and placeable items (e.g., `torch_on.png`, `soul_torch.png`, `crafting_table_top.png`).
  - `textures/models/armor/`: Humanoid armor layer textures (64x32 / 64x64).
  - `attachables/`: Entity attachable JSON definitions for wearable items.
  - `texts/`: Official localized language strings (`en_US.lang`).
- **`behavior_pack/`**: Complete vanilla server/data definitions:
  - `items/`: Vanilla item components and schemas.
  - `entities/`: Base entity behaviors, components, and component groups.
  - `recipes/`: Standard vanilla shaped, shapeless, and furnace recipe schemas.
  - `loot_tables/`: Vanilla drop probabilities and equipment pools.

---

## 2. Using Official Resource Pack Textures in Crafting UI Images

When generating 3x3 crafting grid images for `README.md` files or platform documentation, always source vanilla ingredient textures directly from `bedrock-samples/resource_pack/`:

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
vanilla_icon = Image.open('resource_pack/textures/items/gold_helmet.png').convert('RGBA')

# Nearest-neighbor upscale into crafting slot
slot_size = (44, 44)
pixel_scaled = vanilla_icon.resize(slot_size, Image.Resampling.NEAREST)
```

---

## 3. Best Practices for Add-on Development

1. **Vanilla Parity:** Inspect vanilla recipes in `behavior_pack/recipes/` to match formatting version, group tags, and ingredient identifiers.
2. **Durability and Defense:** Match armor values to vanilla benchmarks in `behavior_pack/items/` (e.g., Gold helmet = 2 protection, 165 durability; Iron helmet = 2 protection, 165 durability; Diamond helmet = 3 protection, 363 durability).
3. **Texture Sourcing:** Never draw placeholder textures for vanilla items when generating promotional materials; always pull directly from `bedrock-samples`.
