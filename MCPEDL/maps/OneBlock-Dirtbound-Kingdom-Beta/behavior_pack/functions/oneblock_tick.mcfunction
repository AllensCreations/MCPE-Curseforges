# One-time setup invokes the per-player Void Cleaner; no other player teleportation occurs.
function oneblock_setup

# Ongoing safety recovery protects only the core foundation.
execute if block 0 -1 0 air run setblock 0 -1 0 bedrock

# Balance is displayed as actionbar text instead of a sidebar scoreboard.
execute as @a[tag=void_cleaned] run function balance_display
