execute as @a[tag=!void_cleaned] run fill -16 -64 -16 16 -64 16 air
# Starter island: 9x9, two layers, built once (skipped when the core foundation already exists)
execute as @a[tag=!void_cleaned] unless block 0 -1 0 bedrock run fill -4 -2 -4 4 -2 4 dirt
execute as @a[tag=!void_cleaned] unless block 0 -1 0 bedrock run fill -4 -1 -4 4 -1 4 grass_block
execute as @a[tag=!void_cleaned] run tp @s 0 1 0
execute as @a[tag=!void_cleaned] unless block 0 -1 0 bedrock run setblock 0 -1 0 bedrock
execute as @a[tag=!void_cleaned] if block 0 0 0 air run setblock 0 0 0 dirt
execute as @a[tag=!void_cleaned] run setworldspawn 0 1 0
execute as @a[tag=!void_cleaned] run spawnpoint @s 0 1 0
execute as @a[tag=!void_cleaned] run tellraw @s {"rawtext":[{"text":"Welcome to OneBlock: Sovereign Market. Mine the block, then use the Trader Ledger."}]}
execute as @a[tag=!void_cleaned] run tellraw @s {"rawtext":[{"text":"Tip: open the Trader Ledger in hotbar slot 9 and tap How to Play."}]}
execute as @a[tag=!void_cleaned] run tag @s add void_cleaned
