# Shared Hivemind Inventory — Synchronized Team Co-op Minigame

![MCPEDL](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/MCPEDL/script/Shared-Hivemind-Inventory/pack_icon.png "MCPEDL")

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21.0%2B-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Script API](https://img.shields.io/badge/Script%20API-%40minecraft%2Fserver%201.13.0%2B-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Achievement Friendly](https://img.shields.io/badge/Achievements-Friendly-brightgreen?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![No Experiments Required](https://img.shields.io/badge/Experimental%20Features-NOT%20REQUIRED-success?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCPACK-orange?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/tree/main/MCPEDL/script#available-scripts)
[![Release](https://img.shields.io/badge/Release-v1.0.5-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/tree/main/MCPEDL/script#available-scripts)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20PC%20%7C%20Console%20%7C%20Realms-yellow?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

**By AllensCreations**

**REAL-TIME MULTIPLAYER INVENTORY SYNCHRONIZATION & TEAM CO-OP**

Synchronize all 36 inventory storage slots and offhand in real-time across your entire multiplayer team.

---

## Overview

What happens when your entire survival team shares a single brain and a single backpack?

**Shared Hivemind Inventory** synchronizes all 36 main inventory slots, hotbar selections, and offhand slots across every player in your world in real-time. When one player mines diamond ore, it appears instantly in every teammate's inventory. When someone eats food, the stack depletes for the whole party. When an ally crafts new gear, anyone can immediately equip it.

Engineered with built-in loop protection and duplication safeguards, the pack delivers instant synchronization without item duplication or inventory desync.

No experimental features required. Designed to keep achievements available while testing your team's co-op communication across standard worlds and multiplayer Realms.

---

## Key Features

| Feature | Description |
| :--- | :--- |
| Complete 36-Slot Mirroring | Mirrors all 9 hotbar slots, 27 main inventory slots, and active offhand shield/totem positions across all online teammates. |
| Zero-Latency Sync | Instant real-time updates as soon as any player picks up, moves, or consumes items. |
| Anti-Duplication Safeguards | Update verification prevents item ghosting, duplication exploits, or infinite item loops. |
| Full Item Metadata Preservation | Retains exact item durability, custom anvil names, enchantments, and lore text during sync. |
| Unified Death Drop Alert | On teammate death, inventory drops at that exact location while on-screen coordinates guide the team to recover loot. |
| Seamless Player Join Sync | Teammates joining or reconnecting are immediately synced to the active team inventory state. |
| Non-Intrusive HUD | Action bar displays live status indicators verifying active synchronization. |

---

## How It Works

| Action / Event | Trigger | In-Game Result |
| :--- | :--- | :--- |
| Mine or Gather Item | Any player picks up an item | Item appears in the identical slot across all teammates' inventories. |
| Consume or Place | Any player eats food or places block | Stack count decrements simultaneously for all online players. |
| Tool & Weapon Usage | Player uses tool in combat or mining | Durability wear accurately updates and reflects for anyone holding it. |
| Offhand Shield / Totem | Move shield or totem into offhand | Offhand equipment synchronizes across party members. |
| Teammate Death | Any player falls in battle | Inventory drops at death spot; on-screen HUD displays dimension & coordinates. |
| Team Regroup | Teammate collects dropped loot | Inventory immediately replenishes across all players. |

---

## Admin Commands

Operators can manage the shared inventory using native commands:
- `/scriptevent hivemind:sync` - Force resynchronizes all online players to the current shared state.
- `/scriptevent hivemind:status` - Displays online player count and shared storage status.
- `/scriptevent hivemind:clear` - Wipes the shared inventory across all players.

---

## Compatibility

- Minecraft Bedrock Edition 1.21.0+
- No experimental features required
- Designed to preserve achievement eligibility
- Script Behavior Pack (.mcpack) format
- Compatible with Mobile, Windows, Console, and Realms

---

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this pack or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.
