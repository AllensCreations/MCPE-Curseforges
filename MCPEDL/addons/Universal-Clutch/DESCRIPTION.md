# Universal Clutch (v1.0.2) — Intelligent Fall Mitigation Add-on

**By AllensCreations**

**AUTOMATIC CLUTCH SYSTEM & FALL PROTECTION UTILITY**

Automatically attempts a clutch when you fall while looking toward the ground. Supported items can reduce or prevent fall damage, and placed water or powder snow may be collected again after landing.

---

## Overview

Universal Clutch provides a vanilla-faithful safety mechanic for Minecraft Bedrock players.  the system checks your fall and whether you are looking toward the ground.

When aiming down and falling beyond the configured block height threshold, the add-on acts shortly before impact, triggers an authentic arm swing animation with placement audio, deploys the appropriate clutch item from your mainhand or offhand, and automatically re-scoops placed water upon touchdown.

---

## Key Features

### Multi-Item Clutch Support
- **Description**: Automatically identifies and uses Water Buckets, Powder Snow Buckets, Twisted Vines, Hay Bales, Cobwebs, Slime Blocks, Scaffolding, Boats/Rafts, or Sweet Berries.

### Dimension-Aware Clutches
- **Description**: Automatically disables evaporating Water Buckets in the Nether, prioritizing Twisted Vines & Powder Snow Buckets instead.

### Dual Hand & Inventory Detection
- **Description**: Evaluates mainhand items first, with failover to offhand, hotbar, and upper inventory.

### Totem of Undying Fail-Safe
- **Description**: When falling to certain death with no clutch item, automatically searches inventory and equips a Totem of Undying into the offhand slot before impact.

### Authentic Boat Placement
- **Description**: Spawns the boat at maximum player reach distance (~4.5 blocks) first, then seats the player with a slight delay upon touchdown. Strictly no teleportation.

### Timed Placement
- **Description**: Uses velocity-based vertical raycasting to trigger placements shortly before impact rather than snapping prematurely.

### Arm Placement Animation
- **Description**: Triggers vanilla arm swing animations (the standard arm-swing animation) synced directly to placement audio.

### Waterlogging Support
- **Description**: Detects stairs, slabs, fences, walls, and trapdoors beneath the player and applies native `{ waterlogged: true }` states without destroying structures.

### Automatic Item Recovery
- **Description**: Automatically retrieves placed water or powder snow 3 ticks after touchdown; verifies powder snow wasn't consumed to extinguish fire before re-scooping.

---

## Supported Clutch Items and Behaviors

### Water Bucket
- **Placement Target**: Surface (waterlog) or Impact Air
- **Effect**: Negates fall damage; auto-scooped 3 ticks after landing (disabled in Nether)

### Powder Snow Bucket
- **Placement Target**: Impact Air Block
- **Effect**: Absorbs fall damage; auto-scooped 3 ticks after landing (unless melted by fire)

### Twisted Vines
- **Placement Target**: Top Face of Solid Ground Block
- **Effect**: Nether-native climbing vine; resets vertical momentum and absorbs fall damage

### Hay Bale
- **Placement Target**: Impact Air Block
- **Effect**: Reduces fall damage by 80% upon touchdown

### Cobweb
- **Placement Target**: Impact Air Block
- **Effect**: Decelerates player velocity and completely negates fall damage

### Slime Block
- **Placement Target**: Impact Air Block
- **Effect**: Completely eliminates fall damage and bounces player upward

### Scaffolding
- **Placement Target**: Impact Air Block
- **Effect**: Traverses falling entity momentum and absorbs fall damage

### Boat / Raft
- **Placement Target**: Impact Air Coordinate
- **Effect**: Placed at max reach distance (~4.5 blocks) first, auto-riding player with slight delay

### Sweet Berries
- **Placement Target**: Impact Air Block
- **Effect**: Places sweet berry bush to decelerate and cancel fall damage

### Totem of Undying
- **Placement Target**: Offhand Slot (Emergency Swap)
- **Effect**: Auto-equipped when falling with no clutch items to attempt to prevent a fatal fall

---

## When It Activates

The player must be falling from the selected height threshold while looking down, and the add-on attempts placement close to impact.

---

---

## Operating Modes & Subpack Configuration

Universal Clutch supports three distinct operating modes selectable via subpack settings slider in World Settings or customizable per-player in-game:

### Operating Modes

- **Full Mode (Auto-Switch Inventory):**
  If a clutch item is not already held in hand, the system automatically scans your hotbar and upper inventory for available clutch items, switches or swaps it directly into your active hand, executes the clutch placement, and remains holding the switched item. Requires the player to aim downward (looking down toward the ground).
- **Simple Mode (Held Item Only):**
  Clutch placements only trigger if you are actively holding a supported clutch item in your mainhand or offhand slot. If holding a sword, pickaxe, or empty hand, no placement will occur. Requires the player to aim downward (looking down toward the ground).
- **Extreme Mode (Auto Smooth Look-Down & Auto-Switch):**
  When falling from dangerous heights, the add-on automatically and smoothly tilts the player's camera pitch downward toward the impact surface, scans and auto-switches to the best available clutch item in inventory, places it 1–2 ticks before impact, and remains holding the switched item. **No-Item Limitation:** If no suitable clutch item is available, the add-on cannot assist with the fall.

### Built-in Subpack Presets

Configurable via the Behavior Pack subpack settings slider in World Settings:

1. **Full Mode (Auto-Switch Inventory):** Recommended default. Automatically detects, equips, and places clutch items from inventory, keeping the switched item active.
2. **Simple Mode (Held Item Only):** Traditional manual clutching. Only executes if a supported clutch item is already held in mainhand or offhand.
3. **Extreme Mode (Auto Smooth Look-Down & Auto-Switch):** Hands-free safety system with auto smooth camera rotation and auto item switching. If inventory has no clutch item, the add-on cannot assist.

#---

## Highlights & Performance

- **Responsive Clutch Engine**: Attempts to place a suitable item shortly before impact; success depends on the fall and available items.
- **Survival Balanced**: Consumes clutch items faithfully from your inventory or hand in Survival and Adventure modes.
- **Waterlogging Support**: Supports clutching onto waterloggable blocks without awkward water spilling.
- **Anti-Spam Cooldown**: Built-in placement cooldown guarantees one clean clutch per fall.

---

## Compatibility

- Minecraft Bedrock Edition 1.21.0+
- Compatible with Bedrock 1.21.50+ and 1.26.0+ releases
- Check the current pack listing for setup requirements.
- Multiplayer behavior should be checked in the target game version.

---

## Creator Profiles

- [CurseForge Profile](https://www.curseforge.com/members/allenscreations/projects)
- [MCPEDL Profile](https://mcpedl.com/user/allenscreations/)

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.

---

## Search & Discovery Keywords

Universal Clutch Minecraft Bedrock, Multi-Item Clutch Support Bedrock, Dimension-Aware Clutches Bedrock, Dual Hand & Inventory Detection Bedrock, Totem of Undying Fail-Safe Bedrock, Minecraft PE survival, MCPEDL, CurseForge Bedrock, AllensCreations.
