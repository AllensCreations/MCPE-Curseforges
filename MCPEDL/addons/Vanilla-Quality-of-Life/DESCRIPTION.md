# Vanilla Quality of Life (v1.3.20)

**By AllensCreations**

**Survival convenience features for Minecraft Bedrock Edition**

Combines dynamic lighting, offhand quick-swap, automatic tool selection, tree capitator, ore-vein mining, mob interactions, and crafting adjustments in one add-on.

---

## Overview

**Vanilla Quality of Life** adds survival conveniences to Minecraft Bedrock Edition, including tool switching, tree and ore chain mining, offhand utilities, mob interactions, and crafting adjustments. Mining behavior can be selected through the pack’s subpack settings, including a preset that disables both mining features.

---

## Features and Specifications

### Feature Comparison Highlights

### Tool & Weapon Switching
- **Vanilla Bedrock**: Manual hotbar selection
- **With Vanilla QoL**: Automatic optimal tool/weapon swap when holding Slot 1

### Tree Harvesting
- **Vanilla Bedrock**: 1 log at a time
- **With Vanilla QoL**: Fells entire trees up to 128 logs; the No Sneak subpack works without sneaking while an axe is held in selected hotbar slot 1

### Ore Vein Mining
- **Vanilla Bedrock**: 1 ore block at a time
- **With Vanilla QoL**: Domino mines contiguous ore veins across 26 neighbors; the No Sneak subpack works without sneaking while a pickaxe is held in selected hotbar slot 1

### Optional Mining Subpacks
- **No Sneak (Slot 1 Required)**: Tree Capitator and Domino Ore Miner work without sneaking, only while the required axe or pickaxe is held in the selected first hotbar slot.
- **Both Off**: Disables Tree Capitator and Domino Ore Miner while keeping the rest of Vanilla QoL active.
- **Default (Sneak Required)**: Both mining features remain enabled and require sneaking, preserving the usual behavior.
- Choose one preset in the Behavior Pack's subpack settings. Changes may require reactivating the pack or reloading the world.
### Tool Durability Safety
- **Vanilla Bedrock**: Tools break unexpectedly
- **With Vanilla QoL**: Auto-halts chain mining at 1 durability with alert sounds

### Offhand Utilities & Lighting
- **Vanilla Bedrock**: Shield and Totem only
- **With Vanilla QoL**: Double-sneak offhand swap + real-time moving torch/lantern light

### Leashing Mobs
- **Vanilla Bedrock**: Passive mobs only
- **With Vanilla QoL**: Leash support extends to many additional mobs; the Warden, Wither, and Ender Dragon remain immune.

### Hostile Mob Aggro on Leads
- **Vanilla Bedrock**: Hostile attacks continue
- **With Vanilla QoL**: Pacified while attached to a lead

### Pet Friendly-Fire
- **Vanilla Bedrock**: Pets damaged by player attacks
- **With Vanilla QoL**: Immune to player melee sweeps, arrows, and explosions

### Leaf Decay Speed
- **Vanilla Bedrock**: 10 to 30 seconds
- **With Vanilla QoL**: 1 to 2 seconds

### Woodcutting in Stonecutter
- **Vanilla Bedrock**: Not supported (stone only)
- **With Vanilla QoL**: All 12 wood types supported at fair 1:1 ratios

### Potion & Milk Stacking
- **Vanilla Bedrock**: 1 per inventory slot
- **With Vanilla QoL**: Stacks up to 16

### Shulker Shell Yield
- **Vanilla Bedrock**: 0 to 1 shell per mob
- **With Vanilla QoL**: 1 to 2 shells per Shulker kill (+1 with Looting)

### Multiplayer Sleep
- **Vanilla Bedrock**: All online players must sleep
- **With Vanilla QoL**: 1 player sleeping skips the night

### Mob Head Trophy Drops
- **Vanilla Bedrock**: Requires Charged Creeper kill
- **With Vanilla QoL**: 1.0% base drop chance on player kills (+0.5% per Looting)

---

### Key Gameplay Mechanics

#### 1. Passive Auto-Switch Tools (Slot 1)
- Hold Slot 1 (first hotbar slot) to activate auto tool selection:
  - Hit stone, ores, or brick -> Equips best Pickaxe (evaluating tier, efficiency, and durability).
  - Hit logs, wood, or planks -> Equips best Axe.
  - Hit dirt, sand, gravel, or clay -> Equips best Shovel.
  - Hit leaves or cobwebs -> Equips Shears.
  - Attack hostile or passive mobs -> Equips best melee Weapon (Sword or Axe).
- Low durability penalty: Automatically favors healthy tools so nearly-broken tools aren't worn down.

#### 2. Smart Tree Capitator (Axe; sneak requirement depends on selected subpack)
- With Default, sneak while chopping any tree log with an axe to fell the entire tree. No Sneak removes this requirement while the axe is held in selected hotbar slot 1:
  - **Upward-Biased connected-log search**: Connects same-level and upward logs, including diagonal branches, without searching below the stump.
  - **Species Matching**: Enforces strict wood species matching (Oak only fells Oak) to prevent chain reactions into adjacent trees.
  - **The Leaf Scan (Build & Bush Protection)**: Ignores player-placed decorative leaves (harvested with shears), protecting your custom bushes, hedges, and roof designs while exclusively verifying natural tree canopies.
  - **House Protection (the canopy check)**: Requires natural-looking leaf canopy evidence for Overworld trees; wart blocks and shroomlights count only for crimson/warped fungi. This reduces false positives but cannot guarantee protection for every custom build.
  - **Natural Leaf Decay**: Preserves leaf canopies for authentic leaf decay drops (saplings, sticks, apples).
  - **Capacity Limit**: Up to 128 logs per tree operation.

#### 3. Domino Ore Miner (Pickaxe; sneak requirement depends on selected subpack)
- With Default, sneak while mining any mineral ore with a pickaxe to harvest the connected ore vein. No Sneak removes this requirement while the pickaxe is held in selected hotbar slot 1:
  - **connected-block Detection**: Sweeps faces, edges, and corners across all 3 spatial dimensions.
  - **Category Normalization**: Normalizes stone and deepslate variants (e.g. Coal Ore and Deepslate Coal Ore chain together).
  - **Fortune & Silk Touch**: Honors Silk Touch block drops and vanilla Fortune item multipliers.
  - **Capacity Limit**: Up to 64 ore blocks per vein cluster.

#### 4. Durability Safety Guard
- Automatically halts Tree Capitator and Domino Ore Miner operations if your tool reaches **1 durability point remaining**.
- Plays a warning sound and displays an action-bar alert when the durability threshold is reached. This reduces the risk of breaking tools during chain-mining but does not guarantee that tools can never break.

#### 5. Offhand Quick-Swap, Torch Placement & Dynamic Handheld Lighting
- Supported quick-swap items: Torches, Soul Torches, Redstone Torches, Lanterns, Soul Lanterns, Clocks, Compasses, Recovery Compasses.
- **Offhand Torch Placement**: When holding a Torch, Soul Torch, or Redstone Torch in your offhand, simply **Sneak and Click** (right-click / interact) on any block surface to place it from your offhand without swapping items or losing your mainhand tool.
- Quick-swap gestures:
  - **Double-sneak** (crouch twice within 0.7 seconds) to swap held item into offhand.
  - **Sneak + Use/Tap in air** to swap held item into offhand.
  - Run  command.
- Real-time dynamic light: Torches emit Light Level 14, Soul Torches and Soul Lanterns Level 10, Redstone Torches Level 7, and Lanterns Level 15 as you move.

#### 6. Universal Leashing (101 Mobs)
- Leash any entity: Villagers, Iron Golems, Hostiles, Creepers, Endermen, Wardens, Withers, and Ghasts.
- Pacification on leads: Hostile mobs attached to leads do not attack players, allowing safe relocation.
- Sneak-interaction on Villagers attaches leads without opening the trading UI.

#### 7. Friendly-Fire Immunity for Pets and Mounts
- Tamed Wolves, Cats, Parrots, Horses, Donkeys, Mules, and Llamas take no damage from player melee attacks, sweeping strikes, and projectile fire.
- Tamed entities are immune to Creeper and TNT explosion damage.

#### 8. Fast Leaf Decay
- Floating leaves from chopped trees decay within 1 to 2 seconds.
- Natural leaf drops such as saplings, sticks, and apples remain available as leaves decay.

#### 9. Stonecutter Woodcutter Integration
- Cut all 12 wood types (Oak, Spruce, Birch, Jungle, Acacia, Dark Oak, Mangrove, Cherry, Pale Oak, Bamboo, Crimson, Warped):
  - Logs -> 4 Planks, 8 Slabs, 4 Stairs
  - Planks -> 2 Slabs, 1 Stair, 1 Trapdoor, 1 Fence, 1 Fence Gate

#### 10. Stackable Potions and Buckets
- Standard Potions, Splash Potions, Lingering Potions, and Milk Buckets stack up to 16 per slot.

#### 11. Mob Head Trophy System
- Slain mobs have a 1.0% base drop chance (+0.5% per Looting level up to 2.5% max at Looting III) on player kills:
  - Zombie, Husk, Drowned -> Zombie Head
  - Skeleton, Stray, Bogged -> Skeleton Skull
  - Creeper -> Creeper Head
  - Piglin, Zombified Piglin -> Piglin Head
  - Wither Skeleton -> 1.0% base drop rate (+0.5% per Looting level)
  - Ender Dragon -> 1.0% drop chance (+0.5% per Looting level)
  - PvP Player Kills -> Slain players have 1.0% drop chance (+0.5% per Looting level) for Player Head

#### 12. Wandering Trader Collector Trades
- Rare 2% spawn rate collector trades offering mob heads for **1 Diamond Block + 16 Emeralds**.
- Biome flora trades: Spore Blossoms, Wither Roses, Nautilus Shells, Bundles, and Heart of the Sea.

---

## Crafting and Recycling Recipes

### Landscaping and Nature
- Dirt + Any Seed -> 1 Grass Block
- 3 Gravel -> 3 Flint (Shapeless)
- 1 Cobblestone or Stone Brick + 1 Moss Block (or Vine) -> 1 Mossy Block
- 4 String + 1 Slimeball -> 1 Cobweb
- 1 Moss Block + 1 Flowering Azalea + 1 Vine -> 1 Spore Blossom
- 1 Diorite + 1 Bone Meal -> 1 Calcite
- 2 Basalt + 2 Cobblestone -> 4 Tuff Blocks
- 1 Gold Block + 3 Stone + 2 Sticks -> 1 Bell
- 1 Sandstone or Red Sandstone -> 4 Sand
- 1 Ink Sac + 1 Glowstone Dust -> 1 Glow Ink Sac
- 1 Quartz + 1 Lapis Lazuli + 2 Sand -> 2 Prismarine Shards

### Fair Crafting Yields
- 6 Blocks -> 8 Stairs (all 95 stair variants)
- 1 Iron Ingot + 2 Iron Nuggets -> 4 Chains
- 3 Sugar Cane -> 6 Paper
- 6 Glass Panes -> 2 Glass Blocks
- 8 Concrete Powder + 1 Water Bottle -> 8 Solid Concrete + 1 Empty Glass Bottle

### Smelting and Recycling
- Smelt Rotten Flesh in a furnace, smoker, or campfire -> Leather
- 2 Slabs -> 1 Full Block
- 4 Stairs -> 3 Full Blocks
- 1 Wool (any color) -> 4 String
- 1 Blast Furnace or Smoker -> 1 Furnace
- Repeaters and Comparators accept Cobblestone, Deepslate, or Blackstone
- Uncrafting support: Amethyst Blocks (4 shards), Quartz Blocks (4 quartz), Clay Blocks (4 clay balls), Glowstone Blocks (4 dust), Magma Blocks (4 cream), Honeycomb Blocks (4 honeycombs), Melons (9 slices), Nether Wart Blocks (9 nether wart)

---

## Compatibility & Packaging Formats

- Minecraft Bedrock Edition. Check the current release listing for the supported version.
- Designed around Minecraft Bedrock gameplay mechanics
- **Available Package Formats**:
  - **Complete **: 1-click full install with all features and companion visuals.
  - **Behavior Pack ()**: Standalone gameplay and survival mechanics.
  - **Resource Pack ()**: Visual lead attachments and companion animations.

---

## Creator Profiles

- [CurseForge Profile](https://www.curseforge.com/members/allenscreations/projects)
- [MCPEDL Profile](https://mcpedl.com/user/allenscreations/)

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this pack in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.

---

## Search & Discovery Keywords

Vanilla Quality of Life Minecraft Bedrock, Feature Comparison Highlights Bedrock, Tool & Weapon Switching Bedrock, Tree Harvesting Bedrock, Ore Vein Mining Bedrock, Minecraft PE survival, MCPEDL, CurseForge Bedrock, AllensCreations.
