# Jai Shree Ram # Om namah shivay!
# Copyright of DtA_MC7535 [Youtube:- @DtA_MC]
# Do not steal any thing respect creator work!

# Nether

setblock 0 50 0 netherrack

# Random values (converted)
scoreboard players random @e[type=armor_stand,tag=DtA] Block_place_rand 1 100
scoreboard players random @e[type=armor_stand,tag=DtA] mob_rando 1 17
scoreboard players add @e[type=armor_stand,tag=DtA,scores={mob_rando=3}] mob_rand 1

execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=1..10}] run setblock 0 50 0 netherrack
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=11..15}] run setblock 0 50 0 ancient_debris
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=16..20}] run setblock 0 50 0 quartz_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=21}] run setblock 0 50 0 crimson_nylium
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=22}] run setblock 0 50 0 warped_nylium
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=23..25}] run setblock 0 50 0 weeping_vines
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=26}] run setblock 0 50 0 lava
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=27..35}] run setblock 0 50 0 nether_brick
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=36..40}] run setblock 0 50 0 red_nether_brick
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=41..50}] run setblock 0 50 0 nether_gold_ore
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=51..55}] run setblock 0 50 0 blackstone
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=56..58}] run setblock 0 50 0 basalt
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=59..62}] run setblock 0 50 0 soul_sand
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=63..65}] run setblock 0 50 0 soul_soil
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=66..67}] run setblock 0 50 0 warped_wart_block
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=68..69}] run setblock 0 50 0 warped_stem
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=70..73}] run setblock 0 50 0 crimson_stem
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=74..78}] run setblock 0 50 0 nether_wart_block
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=79..83}] run setblock 0 50 0 glowstone
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=84..87}] run setblock 0 50 0 shroomlight
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=88..95}] run setblock 0 50 0 gilded_blackstone
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=96}] run setblock 0 50 0 twisting_vines
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=97..100}] run setblock 0 50 0 gravel

execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=17..,mob_rando=3}] at @s run scoreboard players set @e[type=armor_stand,tag=DtA,scores={mob_rando=3},tag=DtA] level_rand 12
execute as @e[type=armor_stand,tag=DtA,scores={level_rand=12}] at @s run scoreboard players random @e[type=armor_stand,tag=DtA] mob_rand 1 16

# Tiny Takeover - Baby Mobs (Nether)
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=1,mob_rando=3}] run summon hoglin 0 51.5 0 ~~ minecraft:entity_born
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=2,mob_rando=3}] run summon strider 0 51.5 0 ~~ minecraft:entity_born
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=3,mob_rando=3}] run summon piglin 0 51.5 0 ~~ minecraft:entity_born
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=4,mob_rando=3}] run summon zombie_pigman 0 51.5 0 ~~ minecraft:entity_born
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=5,mob_rando=3}] run summon zoglin 0 51.5 0 ~~ minecraft:entity_born
# Regular Mobs
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=6,mob_rando=3}] run summon zoglin 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=7,mob_rando=3}] run summon hoglin 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=8,mob_rando=3}] run summon strider 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=9,mob_rando=3}] run summon piglin_brute 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=10,mob_rando=3}] run summon piglin 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=11,mob_rando=3}] run summon wither_skeleton 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=12,mob_rando=3}] run summon ghast 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=13,mob_rando=3}] run summon zombie_pigman 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=14,mob_rando=3}] run summon blaze 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=14,mob_rando=3}] run summon blaze 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=14,mob_rando=3}] run summon blaze 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=15,mob_rando=3}] run summon enderman 0 51.5 0
execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=16,mob_rando=3}] run summon magma_cube 0 51.5 0

# Particle + Sound effect for mob_rando = 3
execute as @e[type=armor_stand,tag=DtA,scores={mob_rando=3}] at @s run particle minecraft:cauldron_explosion_emitter 0 51 0 
execute as @e[type=armor_stand,tag=DtA,scores={mob_rando=3}] at @s run playsound mob.blaze.death @a 0 51 0 5 2

execute as @e[type=armor_stand,tag=DtA,scores={Block_Count=3420}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=DtA,scores={Block_Count=3490}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=DtA,scores={Block_Count=3560}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=DtA,scores={Block_Count=3630}] run function chest-barrels/chest
