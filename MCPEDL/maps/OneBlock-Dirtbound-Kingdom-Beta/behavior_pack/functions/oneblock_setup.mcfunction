# One-time safe setup for the Dirtbound world.
# Dirtbound layout: Bedrock (0,63,0), evolving core (0,64,0), spawn (0,65,0), Trader Post (2,65,0).
# The Void Cleaner is guarded by its persistent structure_void sentinel at (0,62,0).
# It clears only x/z -15..15 and y 0..62 once; it never clears the platform or teleports players.
execute unless block 0 62 0 structure_void run function void_cleaner

# Configure spawn and place required blocks only when their positions are air.
execute as @a[tag=!void_cleaned] run setworldspawn 0 65 0
execute as @a[tag=!void_cleaned] run gamerule spawnradius 0
execute as @a[tag=!void_cleaned] run execute if block 0 63 0 air run setblock 0 63 0 bedrock
execute as @a[tag=!void_cleaned] run execute if block 0 64 0 air run setblock 0 64 0 dirt
execute as @a[tag=!void_cleaned] run execute if block 2 65 0 air run setblock 2 65 0 barrel
# Mark player setup complete only after safe setup commands above.
tag @a[tag=!void_cleaned] add void_cleaned
