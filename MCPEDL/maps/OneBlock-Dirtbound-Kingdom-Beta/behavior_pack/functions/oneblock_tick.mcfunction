# One-time setup includes the sentinel-guarded Void Cleaner and never teleports players.
function oneblock_setup

# Ongoing safety recovery only: never manage the evolving core or reset spawn here.
execute if block 0 63 0 air run setblock 0 63 0 bedrock
execute if block 2 65 0 air run setblock 2 65 0 barrel
