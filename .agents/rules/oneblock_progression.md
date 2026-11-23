# OneBlock Progression & Data Pool Standard

Whenever creating or modifying any OneBlock pack, minigame, map, or script in MCPE-Curseforges:

1. **Pure Data Pool Separation**:
   - `Mcpeworlds/Progression/Oneblock_Progression.js` is the authoritative **Data Pool** (holds blocks, chest items, mobs, and milestone thresholds).
   - It does NOT dictate pack-specific gameplay mechanics or hardcoded spawn chances.

2. **Pack-Specific Rules**:
   - Rules such as chest spawn rates, mob encounter logic, special triggers, and island systems belong inside each pack's own behavior pack scripts.
   - Packs sample from `Oneblock_Progression.js` and apply their own unique rules.

3. **Maintenance**:
   - Always honor customizations made to `Oneblock_Progression.js`.
