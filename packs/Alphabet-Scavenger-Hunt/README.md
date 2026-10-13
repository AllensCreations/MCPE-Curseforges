# 🔤 Alphabet Scavenger Hunt Challenge

![Alphabet Scavenger Hunt Icon](https://raw.githubusercontent.com/AllensCreations/MCPE-Curseforges/main/packs/Alphabet-Scavenger-Hunt/pack_icon.png)

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.21%20--%201.26+-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Release](https://img.shields.io/badge/Release-v1.0.0-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Alphabet-Scavenger-Hunt/Alphabet_Scavenger_Hunt_AllensCreations.mcaddon)
[![Format](https://img.shields.io/badge/Format-.MCPACK%20%7C%20.MCADDON-orange?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Alphabet-Scavenger-Hunt/Alphabet_Scavenger_Hunt_AllensCreations.mcaddon)
[![Platform](https://img.shields.io/badge/Platform-Mobile%20%7C%20PC%20%7C%20Console%20%7C%20Realms-yellow?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

> **Created by AllensCreations**  
> *A high-stakes 20-round survival scavenger challenge! Find items matching the target letter before the 60-second timer expires—or suffer permanent maximum health decay!*

---

## 📖 About The Challenge

Can you think on your feet and scavenge your surroundings under immense pressure?

**Alphabet Scavenger Hunt** is an intense, fast-paced survival minigame challenge built with the latest Bedrock Script API. In each round, the game randomly chooses a balanced letter from the alphabet. You have exactly **60 seconds** to craft, mine, gather, or locate an item in your inventory whose name begins with that letter.

Succeed, and you earn an intermission to prepare for the next round. Fail, and you suffer a **permanent, un-regenerable maximum health penalty** that stacks with each failure until your vitality is depleted!

---

## ⚡ Core Rules & Mechanics

### 🎯 1. 20-Round Gauntlet
- **Total Rounds:** Survive and conquer **20 progressive rounds** to claim ultimate victory.
- **Fair Letter Balancing:** Letters that are impossible or excessively tedious in early survival (such as Q, X, Z, Y, J, K, U, and V) are excluded from the pool to keep gameplay fair, fast-paced, and strategic.
- **Round Intermission:** Completing a round grants a **30-second rest period** to organize your inventory, smelt ores, or explore the terrain before the next letter is assigned.

---

### 🖥️ 2. Top-Of-Screen Objective Display
- **Strictly Positioned at the Top:** The current challenge objective, target letter, timer, and health penalty status are displayed strictly at the **TOP of your screen** using native Bossbar and Action Bar integration.
- **Zero Screen Obstruction:** Does not use annoying centered title popups that block your vision during intense gameplay or combat.
- **Live Objective Tracker:**
  - **Round Counter:** Shows your exact progress (e.g., `Round 5/20`).
  - **Target Letter:** Clearly highlighted (e.g., `Letter: [ C ]`).
  - **Countdown Timer:** Live second-by-second countdown with warning cues during the final 5 seconds.
  - **Penalty Indicator:** Real-time indicator of current health penalties (e.g., `💔 -2 Max HP`).

---

### 🎒 3. Instant Inventory Verification
- Every second, the system scans your inventory slots and held items.
- As soon as you pick up or craft an item matching the target letter (e.g., for **Letter C**: *Cobblestone*, *Coal*, *Cooked Beef*, *Carrot*), the system instantly validates it:
  - Plays a triumphant level-up fanfare (`random.levelup`).
  - Displays a confirmation message in chat announcing the item you found.
  - Automatically advances your progress and enters the 30-second intermission.

---

### 💔 4. Permanent Health Decay Penalty
- If the **60-second timer hits 0** before you acquire a matching item:
  - You suffer an **un-regenerable maximum health penalty** (-2 Max HP / 1 full heart per failure).
  - Your health ceiling is clamped, preventing natural saturation or potions from healing you past your damaged threshold!
  - Plays an ominous cave and break sound cue.
  - If cumulative penalties reduce your vitality to zero or you die during the run, the mission ends in **MISSION FAILED**.

---

### 🏆 5. Victory Condition
- Successfully complete all **20 rounds** to achieve victory!
- Triggers a celebratory fireworks display, triumphant fanfare, and a server-wide victory announcement.

---

## 🎮 In-Game Chat Commands

| Command | Description |
| :--- | :--- |
| **`!start`** or **`!scavenger`** | Starts a fresh 20-round Alphabet Scavenger Hunt run. |
| **`!reset`** | Stops the active game, clears all accumulated health penalties, and restores full 20 HP. |
| **`!status`** | Displays the current round, target letter, remaining timer, and active penalties. |

---

## 🛠️ How to Apply & Activate (Experiments Guide)

Because this challenge is powered by the modern Bedrock Script API (`@minecraft/server`), follow these simple activation steps:

### 1. Apply the Behavior Pack
1. In Minecraft Bedrock, go to your World Settings (or create a New World).
2. Scroll down on the left menu to **Behavior Packs**.
3. Under **Available**, locate **Alphabet Scavenger Hunt BP by AllensCreations** and click **Activate**.

### 2. Enable Experimental Toggles
4. Scroll down on the left menu to **Experiments**.
5. Toggle **ON** the following switch:
   - **Beta APIs** → **Turn ON** *(Required to enable the Script API JavaScript engine)*.
6. Click **Create** or **Play**! The challenge will automatically initialize 10 seconds after joining, or you can type **`!start`** in chat whenever you are ready!

---

## 📥 Direct Downloads

| Package | Format | Description | Download Link |
| :--- | :--- | :--- | :--- |
| **All-In-One Pack (Recommended)** | `.mcaddon` | Installs the complete challenge Behavior Pack in one click! | [⬇️ **Download .mcaddon**](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Alphabet-Scavenger-Hunt/Alphabet_Scavenger_Hunt_AllensCreations.mcaddon) |
| **Behavior Pack Only** | `.mcpack` | Standalone Behavior Pack archive. | [⬇️ **Download .mcpack**](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/Alphabet-Scavenger-Hunt/Alphabet_Scavenger_Hunt_AllensCreations.mcpack) |

---

## 📜 Terms of Use & Guidelines

- **Creator Attribution:** Created by **AllensCreations**.
- **Content Creators (YouTube, TikTok, Twitch):** You are 100% welcome to showcase this challenge in videos, livestreams, and speedruns! Please include credit to **AllensCreations** and link to the official download page or this GitHub repository.
- **No Direct Re-uploading:** Do not re-upload this pack, its individual files, or modified copies to any website, app store, or file-sharing service.
- **No Paywalls or Link Shorteners:** It is strictly prohibited to distribute this pack behind paywalls, ad-gate links (e.g., AdFly, Linkvertise, Boost.ink), or paid monetization walls.
- **Server & Realm Use:** You are free to use this challenge pack on your personal worlds, private servers, and Bedrock Realms.
