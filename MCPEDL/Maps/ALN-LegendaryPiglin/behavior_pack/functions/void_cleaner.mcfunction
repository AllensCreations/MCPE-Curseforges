execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air
execute as @a[tag=!void_cleaned] run tp @s 0.5 65 0.5
execute as @a[tag=!void_cleaned] run setblock 0 63 0 bedrock
execute as @a[tag=!void_cleaned] if block 0 64 0 air run setblock 0 64 0 oak_log
execute as @a[tag=!void_cleaned] run fill 1 64 0 2 64 0 polished_blackstone keep
execute as @a[tag=!void_cleaned] run fill 3 64 -1 5 64 1 polished_blackstone keep
execute as @a[tag=!void_cleaned] run setworldspawn 0 65 0
execute as @a[tag=!void_cleaned] if block 0 63 0 bedrock run tag @s add void_cleaned
