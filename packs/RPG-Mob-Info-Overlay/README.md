# ⚔️ RPG Mob Information Overlay — [AllensCreations]

[![Minecraft Bedrock](https://img.shields.io/badge/Minecraft%20Bedrock-1.20.80%20--%201.21+-brightgreen?style=flat-square&logo=minecraft)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Script API](https://img.shields.io/badge/Script%20API-@minecraft/server%201.13.0+-blue?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)
[![Format](https://img.shields.io/badge/Format-.MCADDON-orange?style=flat-square)](https://github.com/AllensCreations/MCPE-Curseforges)

> **Created by AllensCreations**  
> *A lightweight, immersive 3D RPG nametag overlay that displays mob ranks, a dynamic 10-pip health bar, and threat levels when looking at entities in Minecraft Bedrock.*

---

## 📸 Nametag Format (Exact 3-Line Overlay)

When you look directly at an entity (within 12 blocks), a floating holographic marker appears above its head:

```text
[ E-RANK ] SKELETON (Hostile)
[■■■■■■□□□□] 12/20 HP
Threat: Low
```

- **Line 1: Rank Badge, Entity Name, and Behavior Classification**
  - **Rank Scale:** E-Rank (Common passives), D-Rank (Low threat), C-Rank (Standard hostiles), B-Rank (Dangerous elite forces), A-Rank (Raid beasts & minibosses), S-Rank (Bosses & ancient terrors like Warden & Wither).
  - **Behavior Types:** Passive, Neutral, Hostile.
- **Line 2: Dynamic 10-Pip Health Bar + Numerical Readout**
  - Color-coded progress bar (Green > 50%, Yellow 25–50%, Red < 25%).
  - Active health pips (`■`) vs missing health pips (`□`).
  - Exact current and maximum HP display (`12/20 HP`).
- **Line 3: Threat Rating**
  - Scale: Very Low, Low, Moderate, High, Super High (Calamitous).

---

## ⚡ Technical Highlights

1. **Precision Raycasting:** Targets entities using `player.getEntitiesFromViewDirection({ maxDistance: 12 })`.
2. **Intelligent Target Filtering:** Excludes players, dropped items, arrows, and marker entities.
3. **Marker Entity Reuse:** Uses `sl:status_marker` with client-side invisible rendering. The marker entity is smoothly teleported and reused to minimize entity spawn churn.
4. **Optimized Tick Rate:** Runs on an efficient 3-tick interval (~6.6 checks/sec) using `system.runInterval` to prevent lag.
5. **Instant Despawn:** Automatically removes the marker when looking away, if the mob dies, or if the player disconnects.

---

## 📥 Downloads

- [⬇️ **Download Complete Addon (.mcaddon)**](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/RPG-Mob-Info-Overlay/RPG_Mob_Info_Overlay.mcaddon)
- [⬇️ **Download Behavior Pack (.mcpack)**](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/RPG-Mob-Info-Overlay/RPG_Mob_Info_Overlay_BP.mcpack)
- [⬇️ **Download Resource Pack (.mcpack)**](https://github.com/AllensCreations/MCPE-Curseforges/raw/main/builds/RPG-Mob-Info-Overlay/RPG_Mob_Info_Overlay_RP.mcpack)
