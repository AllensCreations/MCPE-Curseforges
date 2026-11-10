execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air
execute as @a[tag=!void_cleaned] run tp @s 1.5 65 1.5
execute as @a[tag=!void_cleaned] run setblock 0 63 0 bedrock
execute as @a[tag=!void_cleaned] run setblock 0 64 0 allenscreations:lucky_block keep
execute as @a[tag=!void_cleaned] run fill -1 64 -1 1 64 1 grass_block keep
execute as @a[tag=!void_cleaned] run setworldspawn 1 65 1
execute as @a[tag=!void_cleaned] if block 0 63 0 bedrock run tag @s add void_cleaned
