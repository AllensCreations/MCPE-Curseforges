# Shared Hivemind Inventory

![MCPEDL](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/script/Shared-Hivemind-Inventory/pack_icon.png "MCPEDL")

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21%20--%201.26+-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Release](https://img.shields.io/badge/Release-v1.0.0-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Shared-Hivemind-Inventory/Shared_Hivemind_Inventory_AllensCreations.mcaddon)
[![Format](https://img.shields.io/badge/Format-.MCPACK%20%7C%20.MCADDON-orange?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Shared-Hivemind-Inventory/Shared_Hivemind_Inventory_AllensCreations.mcaddon)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20PC%20%7C%20Console%20%7C%20Realms-yellow?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

Creator: AllensCreations  
Description: Real-time multiplayer synchronization challenge where all connected players share the exact same 36 inventory slots and offhand.

---

## About The Minigame

What happens when your entire team shares a single brain and a single backpack?

**Shared Hivemind Inventory** synchronizes all 36 main inventory slots, hotbar selections, and offhand slots across every player in your world. If Player A mines diamond ore, it appears instantly in Player B's inventory. If Player B eats bread, the stack depletes for everyone. If Player C crafts an iron sword, any player can immediately wield it!

Built with an authoritative Master State engine on the modern Bedrock Script API, the pack guarantees 1-tick real-time updates while eliminating circular update loops and duplication exploits.

---

## Core System Mechanics

### 1. Real-Time Inventory Synchronization
- **Complete Slot Mirroring:** Synchronizes all 36 main inventory slots (hotbar 0 to 8 and main storage 9 to 35) plus the offhand shield/totem slot.
- **1-Tick Delta Engine:** Scans inventory slots every 50ms (1 tick) using an authoritative Master State array to mirror item changes across all online players without delay.
- **Loop Mutex Lock:** Employs an internal lock flag to completely eliminate circular sync loops and infinite replication bugs.
- **Component Preservation:** Clones item counts, custom anvil names, durability damage, lore lines, and enchantments with full fidelity.

---

### 2. Anti-Duplication and Drop Safety
- **Instant Subtraction:** When any player drops or throws an item, it is immediately subtracted from the Master State so other players cannot drop duplicate phantom copies.
- **Fast-Click Protection:** Simultaneous modifications on the same slot are safely resolved; the first action commits to the hivemind, and conflicting items are dropped safely at the player's feet rather than voided or duplicated.
- **Seamless Reconnection:** Newly joined or returning players are automatically synchronized to the current Master State upon joining.

---

### 3. Single Death Spot Drop
- **Gamerule Enforcement:** Automatically sets `keepInventory` to `true` to stop vanilla Minecraft from spawning redundant duplicate drops for each player upon death.
- **Physical Spot Drop:** When any player dies, all 36 shared inventory slots and offhand items are deposited as physical drop entities at that exact death coordinate and dimension.
- **Instant Team Wipe:** Clears the inventory of all living teammates simultaneously, plays an item shatter sound cue, and alerts everyone with exact death coordinates.
- **Coordinate Warning:** Displays an on-screen warning and broadcast message showing the exact dimension and coordinates where all shared items were dropped.

---

### 4. Top-Of-Screen HUD Indicator
- Displays a persistent status indicator at the top of the screen:
  `[ HIVEMIND ACTIVE ] Shared Slots: Synchronized`
- During a teammate death, the indicator dynamically switches to display the death coordinates for 6 seconds before resuming normal status.

---

## How to Apply and Activate (Experiments Guide)

Because this minigame utilizes the Bedrock Script API (`@minecraft/server`), follow these simple activation steps:

### 1. Apply the Behavior Pack
1. In Minecraft Bedrock, open your World Settings (or create a New World).
2. Scroll down on the left menu to **Behavior Packs**.
3. Under **Available**, locate **Shared Hivemind Inventory BP by AllensCreations** and click **Activate**.

### 2. Enable Experimental Toggles
4. Scroll down on the left menu to **Experiments**.
5. Toggle **ON** the following switch:
   - **Beta APIs** -> **Turn ON** *(Required to enable the Script API JavaScript engine)*.
6. Click **Play** or **Create**! The hivemind engine will automatically initialize and begin synchronizing all players.

---

## Admin Commands

Admins and operators can use native script commands via `/scriptevent`:
- `/scriptevent hivemind:sync` -- Force resynchronizes all online players to the Master State.
- `/scriptevent hivemind:status` -- Displays online player count, occupied slot count, and offhand item.
- `/scriptevent hivemind:clear` -- Wipes the shared inventory across all players.

---

## Direct Downloads

| Package | Format | Description | Download Link |
| :--- | :--- | :--- | :--- |
| **All-In-One Pack (Recommended)** | `.mcaddon` | Complete one-click install archive | [Download .mcaddon](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Shared-Hivemind-Inventory/Shared_Hivemind_Inventory_AllensCreations.mcaddon) |
| **Behavior Pack Only** | `.mcpack` | Standalone Behavior Pack archive | [Download .mcpack](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Shared-Hivemind-Inventory/Shared_Hivemind_Inventory_AllensCreations.mcpack) |

---

## Terms of Use and Guidelines

- **Creator Attribution:** Created by **AllensCreations**.
- **Rights & Reservation:** All rights reserved for AllensCreations.
- **Content Creators (YouTube, TikTok, Twitch):** You are 100% welcome to showcase this pack in videos, live streams, and reviews! Please include credit to **AllensCreations** and link to the official download page or this GitHub repository.
- **No Direct Re-uploading:** Do not re-upload this pack, its individual files, or modified copies to any website, app store, or file-sharing service.
- **No Paywalls or Link Shorteners:** It is strictly prohibited to distribute this pack behind paywalls, ad-gate links (e.g., AdFly, Linkvertise, Boost.ink), or paid monetization walls.
- **Server and Realm Use:** You are free to use this challenge pack on your personal worlds, private servers, and Bedrock Realms.

---

© All rights reserved for AllensCreations.

