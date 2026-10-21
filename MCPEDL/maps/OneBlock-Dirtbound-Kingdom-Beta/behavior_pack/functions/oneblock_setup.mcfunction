# One-time safe setup for the Dirtbound world.
# Dirtbound translates the reference layout to Bedrock (0,63,0), core (0,64,0), spawn (0,65,0).
# Never clear preserved terrain or teleport players during setup.
execute as @a[tag=!void_cleaned] run setworldspawn 0 65 0
execute as @a[tag=!void_cleaned] run gamerule spawnradius 0
execute as @a[tag=!void_cleaned] run execute if block 0 63 0 air run setblock 0 63 0 bedrock
execute as @a[tag=!void_cleaned] run execute if block 0 64 0 air run setblock 0 64 0 dirt
execute as @a[tag=!void_cleaned] run execute if block 2 65 0 air run setblock 2 65 0 barrel
# Mark setup complete only after the safe, non-teleporting setup commands above.
tag @a[tag=!void_cleaned] add void_cleaned
