# Vanilla Quality of Life — Survival convenience features for Minecraft Bedrock

**By ALNStudios**

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-Stable%20Release-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCPACK%20%7C%20.MCADDON%20%7C%20.MCWORLD-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

**Auto-switching tools, 128-log tree felling, and 64-ore vein mining with Tree Capitator and Domino Ore Miner for Minecraft Bedrock.**

> Adds automatic tool and weapon switching, Tree Capitator, Domino Ore Miner, offhand quick-swap with moving held light, extra leashable mobs, new recipes, and Wandering Trader collector trades. It suits survival players who want fewer inventory chores.

## Overview

Hit a block and the best tool from your hotbar swaps into Slot 1, then returns a moment after you stop. Sneak while chopping a log or mining an ore to fell the whole tree or take the connected vein. Offhand quick-swap, moving held light, leads for most mobs, stonecutter woodcutting, and extra recipes cover the rest of survival play. Three mining presets in the Behavior Pack's subpack settings choose whether chain mining needs sneaking, works automatically, or is off.

## Key Features

### Tool and Weapon Auto-Switch
- **What Happens**: With Slot 1 selected, hitting a block or mob swaps the best tool from your hotbar into Slot 1, and the item that was there returns a moment after you stop.
- **How It Works**: Stone, ores, and bricks pick the best Pickaxe by tier, Efficiency, and durability. Logs, wood, and planks pick an Axe, dirt, sand, gravel, and clay pick a Shovel, leaves and cobwebs pick Shears, and mobs pick the best Sword or Axe. Glass and ice pick a tool with Silk Touch if you carry one, and bookshelves prefer an Axe with Silk Touch.
- **Good To Know**: Tools close to breaking are avoided, and a Mending tool that needs repair wins when two tools are equally good. Only hotbar tools are used, so items in your backpack are never moved. Auto-switch acts only while you are hitting blocks, never just from looking at them.

### Tree Capitator
- **What Happens**: Sneak while chopping a log with an Axe to fell the whole tree, up to 128 logs, with the drops merged into full stacks within 5-block areas.
- **How It Works**: It follows connected logs upward and sideways from the log you broke, matches the wood species so an Oak tree only fells Oak, and needs a natural leaf canopy before it fells an Overworld tree. Wart blocks and Shroomlights count as canopy only for Crimson and Warped fungi.
- **Good To Know**: Trees touching player-built blocks such as planks, doors, fences, glass, bricks, or storage are left standing, and logs more than 8 blocks sideways from the broken log are ignored. A very large tree can be only partly felled because of the 128-log cap, and an action-bar message tells you when that happens. Leaves stay in place and decay naturally, so saplings, sticks, and apples still drop.

### Domino Ore Miner
- **What Happens**: Sneak while mining an ore with a Pickaxe to harvest the connected vein, up to 64 ore blocks, or 4 for Ancient Debris.
- **How It Works**: Veins connect across faces, edges, and corners, and stone and deepslate versions chain together, so Coal Ore and Deepslate Coal Ore mine as one vein. Silk Touch drops the ore blocks, Fortune adds extra drops, and Redstone gets extra dust instead of a multiplier.
- **Good To Know**: Ores give their normal experience without Silk Touch, as up to 10 orbs per chain with any extra going straight to you. Drops merge into full stacks within 5-block areas so only a few item entities appear.

### Mining Presets
- **What Happens**: Three presets in the Behavior Pack's subpack settings choose how chain mining starts: Sneak to Chain Mine (Default), Auto Chain Mine: Tool in Slot 1, and Chain Mining Off (Other Features On).
- **How It Works**: The default needs sneaking. Auto Chain Mine needs no sneaking but works only while an Axe or Pickaxe is held in Slot 1. Chain Mining Off disables both mining features while every other feature stays active.
- **Good To Know**: Changing the preset may need the pack reactivated or the world reloaded.

### Tool Durability Guard
- **What Happens**: Chain mining stops when your tool has 0 durability left, with a warning sound and an action-bar alert.
- **How It Works**: Chain mining uses a tool down to 0 durability without breaking it, and the next use of that tool breaks it.
- **Good To Know**: A tool at 0 durability breaks only the single block you hit and does not start Tree Capitator or Domino Ore Miner. In Creative mode chain mining uses no durability and drops no items.

### Offhand Quick-Swap and Held Light
- **What Happens**: Double-sneak while standing still, or sneak and use in the air, to move your held item into your offhand.
- **How It Works**: Torches, Soul Torches, Redstone Torches, Lanterns, Soul Lanterns, Clocks, Compasses, and Recovery Compasses swap this way. Held light moves with you: Torches give Light Level 14, Soul Torches and Soul Lanterns Level 10, Redstone Torches Level 7, and Lanterns, Glowstone, Sea Lanterns, Shroomlights, and Jack o'Lanterns Level 15.

### Universal Leads
- **What Happens**: Leads work on Villagers, Iron Golems, Creepers, Endermen, Ghasts, and most other mobs, while the Warden, Wither, and Ender Dragon cannot be leashed.
- **How It Works**: Hostile mobs attached to a lead do not attack players, so you can move them safely. Sneak-interacting with a Villager does not open the trading screen, so a lead can be attached.

### Pet and Mount Protection
- **What Happens**: Tamed Wolves, Cats, Parrots, Horses, Donkeys, Mules, and Llamas take no damage from player melee attacks, sweeping strikes, and arrows.
- **Good To Know**: Tamed animals are also immune to Creeper and TNT explosion damage.

### Fast Leaf Decay and Sleep
- **What Happens**: Floating leaves from chopped trees decay faster, and one sleeping player skips the night.
- **Good To Know**: The faster decay comes from a random tick speed of 4 that also speeds up crop growth. It is set once when the world first loads, so you can change it afterward in your world's game rules.

### Stonecutter Woodcutting
- **What Happens**: The Stonecutter cuts all 12 wood types: Oak, Spruce, Birch, Jungle, Acacia, Dark Oak, Mangrove, Cherry, Pale Oak, Bamboo, Crimson, and Warped.
- **How It Works**: Logs give 4 Planks, 8 Slabs, or 4 Stairs. Planks give 2 Slabs, 1 Stair, 1 Trapdoor, 1 Fence, or 1 Fence Gate.

### Stackable Potions and Milk
- **What Happens**: Potions, Splash Potions, Lingering Potions, and Milk Buckets stack up to 16 per slot.

### Mob Head Drops and Shulker Shells
- **What Happens**: Player kills have a 1.0% base chance to drop a mob head, plus 0.5% per Looting level, up to 2.5% at Looting III.
- **How It Works**: Zombies, Husks, and Drowned drop a Zombie Head, Skeletons, Strays, and Bogged drop a Skeleton Skull, Creepers drop a Creeper Head, and Piglins and Zombified Piglins drop a Piglin Head. Wither Skeletons, the Ender Dragon, and slain players use the same chance for their own heads.
- **Good To Know**: Shulkers drop 1 to 2 Shulker Shells per kill, with Looting adding more.

### Wandering Trader Collector Trades
- **What Happens**: Wandering Traders can offer collector trades that sell mob heads for 1 Diamond Block and 16 Emeralds.
- **Good To Know**: Biome flora trades offer Spore Blossoms, Wither Roses, Nautilus Shells, Bundles, and the Heart of the Sea.

### Landscaping and Nature Recipes
- **What Happens**: New recipes turn common items into landscaping and nature blocks.
- **How It Works**: Dirt and any Seed make 1 Grass Block. 3 Gravel make 3 Flint. A Cobblestone or Stone Brick with a Moss Block or Vine makes a Mossy Block. 4 String and 1 Slimeball make a Cobweb. A Moss Block, a Flowering Azalea, and a Vine make a Spore Blossom. A Diorite and a Bone Meal make a Calcite. 2 Basalt and 2 Cobblestone make 4 Tuff. A Gold Block, 3 Stone, and 2 Sticks make a Bell. A Sandstone or Red Sandstone makes 4 Sand. An Ink Sac and Glowstone Dust make a Glow Ink Sac. A Quartz, a Lapis Lazuli, and 2 Sand make 2 Prismarine Shards.

### Fair Crafting Yields
- **What Happens**: Several vanilla recipes now return fairer amounts.
- **How It Works**: 6 Blocks make 8 Stairs for all 95 stair variants. An Iron Ingot and 2 Iron Nuggets make 4 Chains. 3 Sugar Cane make 6 Paper. 6 Glass Panes make 2 Glass Blocks. 8 Concrete Powder and a Water Bottle make 8 Solid Concrete and an Empty Glass Bottle.

### Smelting and Recycling
- **What Happens**: Rotten Flesh smelts into Leather in a furnace, smoker, or campfire, and several blocks can be turned back into their parts.
- **How It Works**: 2 Slabs make 1 Full Block, 4 Stairs make 3 Full Blocks, a Wool of any color makes 4 String, and a Blast Furnace or Smoker makes a Furnace. Repeaters and Comparators accept Cobblestone, Deepslate, or Blackstone.
- **Good To Know**: Amethyst Blocks, Quartz Blocks, Clay Blocks, Glowstone Blocks, Magma Blocks, Honeycomb Blocks, Melons, and Nether Wart Blocks can be uncrafted into their original items.

## How to Use

1. Import the complete add-on and enable both included packs in your world settings.
2. Choose a mining preset in the Behavior Pack's subpack settings: Sneak to Chain Mine (Default), Auto Chain Mine: Tool in Slot 1, or Chain Mining Off (Other Features On).
3. Put your tools in the hotbar, select Slot 1, and hit blocks or mobs to see the best tool swap in.
4. Sneak while breaking a log with an Axe or an ore with a Pickaxe to fell the tree or mine the vein.
5. Double-sneak while standing still to move a held Torch, Lantern, Clock, or Compass into your offhand.

## Common Questions

- **Why did a tree stay standing?**: Trees touching player-built blocks such as planks, doors, or fences are skipped, and a very large tree is cut off at 128 logs.
- **Why did auto-switch ignore a tool in my backpack?**: Auto-switch only uses tools in your hotbar.
- **What happens when a tool reaches 0 durability?**: Chain mining stops, and the next use of that tool breaks it.

## Compatibility

- Minecraft Bedrock Edition: 1.26.50 or newer.
- Experimental features: Not verified.
- Achievements: Likely achievement-friendly.
- Verification: Source created, not tested in game.

## Creator and Permissions

- Creator: ALNStudios
- Profiles: [CurseForge Profile](https://www.curseforge.com/members/allenscreations/projects) · [MCPEDL Profile](https://mcpedl.com/user/alnstudios/)

<a href="https://www.curseforge.com/members/allenscreations/projects"><img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/assets/Images/curseforge.jpg" alt="CurseForge" width="45%"></a> <a href="https://mcpedl.com/user/alnstudios/"><img src="https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/assets/Images/MCPEDL.jpg" alt="MCPEDL" width="45%"></a>

## Guidelines and Attribution

- Creator: ALNStudios
- Rights & Reservation: All rights reserved for ALNStudios.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to ALNStudios.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.
- Disclaimer: This is an unofficial community creation. It is not an official Minecraft product and is not approved by or associated with Mojang or Microsoft.

---

© All rights reserved for ALNStudios.

---

## Search & Discovery Keywords

Minecraft Bedrock add-on, Vanilla Quality of Life Bedrock mod, MCPEDL add-on, CurseForge Bedrock, ALNStudios, tool auto switch, tree capitator, ore vein miner, offhand quick swap, universal leash.
