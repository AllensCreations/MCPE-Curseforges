# Runs every tick; every command is guarded so it acts once per player (tag=!void_cleaned).
# Core (0,64,0) | Bedrock (0,63,0) | Spawn (0,65,0).
# 1. Clear the starting layer (required exact line for the world builder)
execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air
# 1b. Clear the island volume (skipped if the Bedrock marker exists, so later joiners never wipe the core)
execute as @a[tag=!void_cleaned] unless block 0 63 0 bedrock run fill -8 56 -8 8 72 8 air
# 2. Teleport the untagged player to spawn (the only function-side player teleport)
execute as @a[tag=!void_cleaned] run tp @s 0.5 65 0.5
# 3. Bedrock under the core
execute as @a[tag=!void_cleaned] run setblock 0 63 0 bedrock
# 4. Placeholder at the core (only if the core spot is empty; the script replaces it)
execute as @a[tag=!void_cleaned] if block 0 64 0 air run setblock 0 64 0 dirt
# 5. World spawn
execute as @a[tag=!void_cleaned] run setworldspawn 0 65 0
# 6. Notice
execute as @a[tag=!void_cleaned] run tellraw @s {"rawtext":[{"text":"§6[Sovereign Market] §fWelcome! Break the block, earn coins. Use the Sovereign Ledger."}]}
# 7. Mark as done
execute as @a[tag=!void_cleaned] run tag @s add void_cleaned
