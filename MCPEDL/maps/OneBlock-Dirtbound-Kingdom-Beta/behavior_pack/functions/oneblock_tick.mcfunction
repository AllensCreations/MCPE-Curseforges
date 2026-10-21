# One-time setup invokes the per-player Void Cleaner; no other player teleportation occurs.
function oneblock_setup

# Ongoing safety recovery only: protect the new core foundation and Trader lectern.
execute if block 0 -1 0 air run setblock 0 -1 0 bedrock
execute if block 2 1 0 air run setblock 2 1 0 lectern

# Balance is displayed as actionbar text instead of a sidebar scoreboard.
execute as @a[tag=void_cleaned] run function balance_display
