# Team Inventory (v1.0.13)

**By AllensCreations**

All players in a world share one inventory state. Item counts, slot changes, equipment, and selected hotbar slot are synchronized to other online players.

## Features

- Shares all 36 main inventory slots, armor, offhand, and selected hotbar slot.
- Detects inventory changes every two game ticks.
- Saves the shared state in world dynamic properties for world restarts.
- New and returning players receive the existing shared inventory.
- Preserves supported item metadata, including names, lore, durability, and enchantments where the Script API exposes them.
- Detects competing edits and attempts to preserve conflicting items as world drops, with brief player feedback.
- Death drops the authoritative shared inventory once and clears it for the team.
- Does not force the `keepInventory` gamerule.

## Compatibility and Settings

- **Minecraft Bedrock:** 1.21.0+
- **Format:** Script Behavior Pack (`.mcpack`)
- **Achievement Friendly:** No guarantee; behavior packs using Script API may require world settings that affect achievements.
- **Experimental Features:** No experimental toggle is intentionally required beyond the declared Script API dependency.

## Notes

Inventory changes are detected by polling, so updates occur on the next synchronization check. The game engine and available Script API determine whether every item component can be serialized and restored exactly. If vanilla `keepInventory` is disabled, vanilla death-drop behavior may overlap with scripted shared drops; the pack deliberately leaves the world's gamerule unchanged.

## Attribution

Created by AllensCreations. Do not re-upload or redistribute this pack as your own. Link to the official repository when featuring it.

© All rights reserved for AllensCreations.

## Creator Profiles

- [CurseForge Profile](https://www.curseforge.com/members/allenscreations/projects)
- [MCPEDL Profile](https://mcpedl.com/user/allenscreations/)

---

## Guidelines and Attribution

- Creator: AllensCreations
- Rights & Reservation: All rights reserved for AllensCreations.
- Content Creators: Content creators are permitted to feature this creation in videos and streams with credit to AllensCreations.
- Redistribution: Do not re-upload this creation or provide direct monetized download bypasses. Link directly to the official repository page.

---

© All rights reserved for AllensCreations.

---

## Search & Discovery Keywords

Minecraft Bedrock script pack, Team Inventory, Minecraft PE survival, MCPEDL, CurseForge Bedrock, AllensCreations.
