# One-time setup invokes the per-player Void Cleaner; no other player teleportation occurs.
function oneblock_setup

# Ongoing safety recovery only: protect the new core foundation and permanent Trader Post.
execute if block 0 -1 0 air run setblock 0 -1 0 bedrock
execute if block 2 1 0 air run setblock 2 1 0 barrel
