# Gameplay Optimizer — Item limits, quiet potions and portal preloading

**By ALNStudios**

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-Stable%20Release-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCPACK%20%7C%20.MCADDON%20%7C%20.MCWORLD-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

**Limits dropped items to between 50 and 500 per dimension, hides potion particles, and preloads Nether portal destinations from a Clock menu.**

> Gameplay Optimizer adds one settings menu, opened by sneaking and using a Clock, with three switches. It suits worlds with item farms, frequent potion effects, or Nether portal trips that stall on arrival.

## Overview

Sneak and use a Clock to open the menu, then pick Optimizer Settings. The menu has a switch for the dropped item limit, one for potion particle hiding, and one for portal preloading. Settings are saved in the world and apply to every player in it.

## Key Features

### Dropped Item Limit
- **What Happens**: When switched on, the pack keeps the number of dropped items in each dimension at or below a limit you choose from 50 to 500, in steps of 50. When a new drop passes the limit, the oldest tracked dropped item is removed.
- **How It Works**: With the limit set to 200, the 201st dropped item in the Overworld makes the oldest dropped item in the Overworld disappear.
- **Good To Know**: This switch is off by default. Removed items are gone for good, including valuable ones. Only items dropped after the world loaded and after the switch was turned on are counted.

### Potion Particle Hiding
- **What Happens**: When switched on, effects that players receive from potions, beacons and similar sources are reapplied with the swirling particles turned off.
- **Good To Know**: This switch is on by default. Only players are affected. Instant effects such as Instant Health are skipped, and every other particle in the game is unchanged.

### Portal Preloading
- **What Happens**: While you stand inside a Nether portal, the pack asks the game to start loading the matching spot on the other side: Overworld coordinates divided by 8, or Nether coordinates multiplied by 8. The loaded area is released about 5 seconds after you arrive, or after 20 seconds at most.
- **Good To Know**: This switch is on by default. The effect on portal trip time was not measured, and loading an area early adds work while you wait. If the game has no room for another loaded area, the step is skipped.

### Settings Menu
- **What Happens**: The main menu shows the state of all three switches and has Optimizer Settings, About and Exit buttons. The settings screen has a toggle for each feature, a slider for the item limit, and a Save button.
- **Good To Know**: Operators can change the settings, and so can a player who is alone in the world. Other players can open the menu and read the status.

## How to Use

1. Import the .mcpack file and add the pack to your world's Behavior Packs.
2. Hold a Clock, sneak, and use it to open the Gameplay Optimizer menu.
3. Choose Optimizer Settings, change the switches, and press Save. The main menu then shows the new state.

## Common Questions

- **Does it raise my frame rate?**: Frame rate was not measured. The pack limits dropped items, hides potion particles and preloads portal destinations, and it does not change any video setting.
- **Does it hide every particle?**: No. Only the particles of effects that players receive are hidden.
- **Will the item limit delete my items?**: Only when the limit is switched on and the number of dropped items goes over it. The oldest dropped items are removed first.

## Compatibility

- Minecraft Bedrock Edition: 1.26.60
- Experimental features: No experiment requirement detected in the inspected files.
- Achievements: Unknown / needs confirmation.
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

Minecraft Bedrock add-on, Gameplay Optimizer Bedrock mod, dropped item limit, potion particle hiding, portal preloading, Clock menu, Minecraft PE survival, MCPEDL add-on, CurseForge Bedrock, ALNStudios.

