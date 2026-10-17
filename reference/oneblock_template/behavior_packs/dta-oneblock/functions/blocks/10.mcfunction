# Jai Shree Ram # Om namah shivay!
# Copyright of DtA_MC7535 [Youtube:- @DtA_MC]
# Do not steal any thing respect creator work!

# Swamp & Cherry

# Random values (converted)
scoreboard players random @e[type=armor_stand,tag=DtA] Block_place_rand 1 185
scoreboard players random @e[type=armor_stand,tag=DtA] mob_rando 1 17
scoreboard players add @e[type=armor_stand,tag=DtA,scores={mob_rando=3}] mob_rand 1

execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=1..30}] run setblock 0 50 0 minecraft:grass_block
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=31..50}] run setblock 0 50 0 minecraft:dirt
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=51..55}] run setblock 0 50 0 minecraft:dirt_with_roots
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=56}] run setblock 0 50 0 minecraft:bone_block
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=57..65}] run setblock 0 50 0 minecraft:mangrove_log
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=66..73}] run setblock 0 50 0 minecraft:cherry_log
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=74}] run setblock 0 50 0 minecraft:ochre_froglight
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=75}] run setblock 0 50 0 minecraft:verdant_froglight
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=76}] run setblock 0 50 0 minecraft:pearlescent_froglight
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=77..80}] run setblock 0 50 0 minecraft:packed_mud
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=81..85}] run setblock 0 50 0 minecraft:clay
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=86..88}] run setblock 0 50 0 minecraft:mangrove_leaves
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=89..93}] run setblock 0 50 0 minecraft:muddy_mangrove_roots
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=94..96}] run setblock 0 50 0 minecraft:mud
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=97..104}] run setblock 0 50 0 minecraft:cherry_leaves
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=105..110}] run setblock 0 50 0 minecraft:deepslate_redstone_ore
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=111..120}] run setblock 0 50 0 minecraft:deepslate_iron_ore
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=121..125}] run setblock 0 50 0 minecraft:deepslate_copper_ore
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=126..129}] run setblock 0 50 0 minecraft:deepslate_lapis_ore
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=130}] run setblock 0 50 0 minecraft:deepslate_diamond_ore
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=131..140}] run setblock 0 50 0 minecraft:iron_ore
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=141..144}] run setblock 0 50 0 minecraft:redstone_ore
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=145}] run setblock 0 50 0 minecraft:diamond_ore
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=146..150}] run setblock 0 50 0 minecraft:lapis_ore
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=151..155}] run setblock 0 50 0 minecraft:copper_ore
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=156..170}] run setblock 0 50 0 minecraft:stone
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=171..185}] run setblock 0 50 0 minecraft:deepslate

execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=77..89}] run setblock 0 51 0 minecraft:moss_carpet
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=4..6}] run setblock 0 51 0 minecraft:cherry_sapling
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=8..10}] run setblock 0 51 0 minecraft:mangrove_propagule
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=13}] run setblock 0 51 0 minecraft:pitcher_plant

execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=10..,mob_rando=3}] at @s run scoreboard players set @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rando=3},tag=DtA] level_rand 10
execute as @e[type=armor_stand,tag=DtA,scores={level_rand=10}] at @s run scoreboard players random @e[type=armor_stand,tag=DtA] mob_rand 1 9

# Tiny Takeover - Baby Mobs (Swamp & Cherry)
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=1,mob_rando=3}] run summon minecraft:sniffer 0 51.5 0 ~~ minecraft:entity_born
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=2,mob_rando=3}] run summon minecraft:frog 0 51.5 0 ~~ minecraft:entity_born
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=3,mob_rando=3}] run summon minecraft:axolotl 0 51.5 0 ~~ minecraft:entity_born
# Regular Mobs
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=4..5,mob_rando=3}] run summon minecraft:bogged 0 51.5 0
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=6,mob_rando=3}] run summon minecraft:sniffer 0 51.5 0
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=7,mob_rando=3}] run summon minecraft:frog 0 51.5 0
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=8,mob_rando=3}] run summon minecraft:tadpole 0 50.5 0
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=8,mob_rando=3}] run setblock 0 50 0 water
execute at @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=9,mob_rando=3}] run summon minecraft:slime 0 51.5 0

# Particle + Sound effect for mob_rando = 3
execute as @e[type=armor_stand,tag=DtA,scores={mob_rando=3}] at @s run particle minecraft:cauldron_explosion_emitter 0 51 0 
execute as @e[type=armor_stand,tag=DtA,scores={mob_rando=3}] at @s run playsound mob.blaze.death @a 0 51 0 5 2

execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_Count=2806}] run function chest-barrels/chest
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_Count=2894}] run function chest-barrels/chest
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_Count=2948}] run function chest-barrels/chest
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_Count=2995}] run function chest-barrels/chest
