# Dirtbound Kingdom: Technical Spec (v1)

Moved from `INSTRUCTIONS.md` 1.7.

- Core `(0,0,0)`, Bedrock `(0,-1,0)`, spawn `(0,1,0)`. Trader Ledger = only shop access. No physical Trader Post.
- `void_cleaner.mcfunction`, once per player, guarded `tag=!void_cleaned`, order: 1 `execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air` (33x33 = 1,089 blocks; `fill 0 -64 0 15 -64 15 air` = 256, WRONG); 2 teleport untagged player to `(0,1,0)` (only function-side teleport); 3 Bedrock `(0,-1,0)`; 4 grass placeholder `(0,0,0)`; 5 world spawn `(0,1,0)`; 6 cleaning notice; 7 add `void_cleaned` ONLY once core Bedrock exists.
- Chunk loading: Bedrock does not keep spawn chunks loaded; fill on unloaded chunks fails silently. Final tag MUST be conditional: `execute as @a[tag=!void_cleaned] if block 0 -1 0 bedrock run tag @s add void_cleaned`. Guard the notice against retry spam. Unverified until tested in game (1.11).
- NEVER expand cleanup beyond this layer without approval.
- `tick.json`: `void_cleaner` before `oneblock_tick`. `oneblock_tick` restores only missing Bedrock. NEVER reset spawn, teleport, place/replace core.
- Script API owns core `(0,0,0)`, break rewards, stage progression; waits for `void_cleaned` before replacing the placeholder.
- Player tags persist: a source fix NEVER patches an imported world. Test with a fresh import.
- Mechanics change: update source, player docs, test checklists together; reinstall into all 3 world folders.
