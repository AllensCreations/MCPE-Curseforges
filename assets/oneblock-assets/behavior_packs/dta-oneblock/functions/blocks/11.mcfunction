# Jai Shree Ram # Om namah shivay!
# Copyright of DtA_MC7535 [Youtube:- @DtA_MC]
# Do not steal any thing respect creator work!

# Mansion

setblock 0 50 0 oak_planks

# Random values (converted)
scoreboard players random @e[type=armor_stand,tag=DtA] Block_place_rand 1 100
scoreboard players random @e[type=armor_stand,tag=DtA] mob_rando 1 17
scoreboard players add @e[type=armor_stand,tag=DtA,scores={mob_rando=3}] mob_rand 1

execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=1..5}] run setblock 0 50 0 dark_oak_planks
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=6..10}] run setblock 0 50 0 dark_oak_stairs
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=11..15}] run setblock 0 50 0 cobblestone
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=16..20}] run setblock 0 50 0 dark_oak_log
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=21..22}] run setblock 0 50 0 glass_pane
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=23..25}] run setblock 0 50 0 dark_oak_leaves
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=26..27}] run setblock 0 50 0 grass_block
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=28..30}] run setblock 0 50 0 dirt
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=31}] run setblock 0 50 0 bee_nest
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=32..33}] run setblock 0 50 0 brown_mushroom_block
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=34..35}] run setblock 0 50 0 emerald_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=36..37}] run setblock 0 50 0 red_mushroom_block
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=38}] run setblock 0 50 0 obsidian
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=39..45}] run setblock 0 50 0 coal_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=46}] run setblock 0 50 0 anvil
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=47..51}] run setblock 0 50 0 iron_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=52..56}] run setblock 0 50 0 redstone_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=57..63}] run setblock 0 50 0 lapis_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=64..70}] run setblock 0 50 0 gold_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=71..73}] run setblock 0 50 0 diamond_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=74..79}] run setblock 0 50 0 deepslate_coal_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=80..83}] run setblock 0 50 0 deepslate_iron_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=84..87}] run setblock 0 50 0 deepslate_redstone_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=88..95}] run setblock 0 50 0 deepslate_lapis_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=96..99}] run setblock 0 50 0 deepslate_gold_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=100}] run setblock 0 50 0 diamond_ore

execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=19..,mob_rando=3}] at @s run scoreboard players set @e[type=armor_stand,tag=DtA,scores={mob_rando=3},tag=DtA] level_rand 11
execute as @e[type=armor_stand,tag=DtA,scores={level_rand=11}] at @s run scoreboard players random @e[type=armor_stand,tag=DtA] mob_rand 1 18

# Tiny Takeover - Baby Mobs (Mansion)
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=1,mob_rando=3}] run summon horse 0 51.5 0 ~~ minecraft:entity_born
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=2,mob_rando=3}] run summon donkey 0 51.5 0 ~~ minecraft:entity_born
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=3,mob_rando=3}] run summon cat 0 51.5 0 ~~ minecraft:entity_born
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=4,mob_rando=3}] run summon villager 0 51.5 0 ~~ minecraft:as_baby
# Regular Mobs
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=5,mob_rando=3}] run summon donkey 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=6,mob_rando=3}] run summon horse 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=7,mob_rando=3}] run summon bee 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=8,mob_rando=3}] run summon allay 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=9,mob_rando=3}] run summon witch 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=10..12,mob_rando=3}] run summon villager 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=11,mob_rando=3}] run summon cat 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=12,mob_rando=3}] run summon slime 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=13,mob_rando=3}] run summon pillager 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=13,mob_rando=3}] run summon pillager 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=13,mob_rando=3}] run summon pillager 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=14,mob_rando=3}] run summon phantom 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=14,mob_rando=3}] run summon phantom 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=15,mob_rando=3}] run summon evocation_illager 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=16,mob_rando=3}] run summon vindicator 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=16,mob_rando=3}] run summon vindicator 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=17,mob_rando=3}] run summon creeper 0 51.6 0 ~ ~ minecraft:become_charged
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=18,mob_rando=3}] run summon iron_golem 0 51.5 0

# Particle + Sound effect for mob_rando = 3
execute as @e[type=armor_stand,tag=DtA,scores={mob_rando=3}] at @s run particle minecraft:cauldron_explosion_emitter 0 51 0 
execute as @e[type=armor_stand,tag=DtA,scores={mob_rando=3}] at @s run playsound mob.blaze.death @a 0 51 0 5 2

execute as @e[type=armor_stand,tag=DtA,scores={Block_Count=3061}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=DtA,scores={Block_Count=3128}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=DtA,scores={Block_Count=3206}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=DtA,scores={Block_Count=3253}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=DtA,scores={Block_Count=3348}] run function chest-barrels/chest
