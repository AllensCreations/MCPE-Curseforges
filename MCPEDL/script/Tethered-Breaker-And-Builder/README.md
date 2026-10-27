# Tethered: Breaker and Builder (v1.0.9)

A two-player co-op challenge for Minecraft Bedrock Edition. One player breaks, the other builds, and an elastic leash keeps you together.

## Overview

Two players share a 15-meter tether. The Breaker mines blocks and fights but cannot place anything. The Builder places blocks and fluids but cannot mine or attack. Wander too far apart and the leash pulls you back together.

The challenge begins when the host or an operator uses the Controller. Until then the world plays normally, with no roles and no leash.

## Features

### Asymmetric Roles
- **What Happens**: When the challenge starts, each player picks Breaker or Builder from a menu. Only one player can hold each role. Players without a role cannot build, mine or fight.

### Breaker
- **What Happens**: Mines blocks and fights mobs. Cannot place blocks, buckets, fire, spawn eggs, boats, minecarts, armor stands, item frames, paintings, end crystals or bone meal.

### Builder
- **What Happens**: Places blocks and fluids. Cannot break blocks, attack mobs or players, or set off TNT.

### Elastic Leash
- **What Happens**: A particle beam links the partners and changes with distance. Slack under 10 meters, tense up to 15 meters, overstretched up to 18 meters, and strained beyond that.
- **What Happens**: Past 15 meters you are pulled toward each other. A grounded partner anchors the one who is falling or swimming.
- **What Happens**: Past 18 meters you take strain damage after a short grace period. Strain never takes you below one heart.

### Recall
- **What Happens**: If the partners are more than 64 blocks apart for 5 seconds, or in different dimensions for 15 seconds, the Builder is teleported to the Breaker.

### Respawn Support
- **What Happens**: A partner who dies respawns beside the survivor with brief protection and healing.

### Goal
- **What Happens**: Defeat the Ender Dragon together to win. The host can also end the challenge early.

## Controller

The host or an operator receives the AllensCreations Controller on first spawn. Using it opens a menu with Start and How to play. In Survival, starting the challenge uses up the Controller. It is returned when the challenge ends. Creative players keep it.

Operators can use the commands function give_controller to get a new Controller and end_game to stop the challenge. Role changes are available with the commands scriptevent tether:swap, tether:breaker, tether:builder and tether:reset while a challenge is running.

## Compatibility

- Minecraft Bedrock Edition: 1.26.40 or newer
- Experiments: No experiment requirement detected in the inspected files.
- Achievements: Likely achievement-friendly. Using operator commands requires cheats, which disables achievements.
- Verification: Source created, not tested in game.

## Limitations

- Redstone machines, lava and fire spread are not restricted by roles.
- Only one Breaker and one Builder are tethered. Other players are not tethered.
- The test world is added after the build and is not linked here.

## More Information

Read the [full description](https://github.com/AllensCreations/MCPE-Curseforges/tree/main/MCPEDL/script/Tethered-Breaker-And-Builder/DESCRIPTION.md) for the creator profile links and attribution.
