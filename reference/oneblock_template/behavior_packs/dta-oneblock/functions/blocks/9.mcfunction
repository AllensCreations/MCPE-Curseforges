# Jai Shree Ram # Om namah shivay!
# Copyright of DtA_MC7535 [Youtube:- @DtA_MC]
# Do not steal any thing respect creator work!

# Pale Garden

# Random values (converted)
scoreboard players random @e[type=armor_stand,tag=DtA] Block_place_rand 1 145
scoreboard players random @e[type=armor_stand,tag=DtA] mob_rando 1 17
scoreboard players add @e[type=armor_stand,tag=DtA,scores={mob_rando=3}] mob_rand 1

execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=1..30}] run setblock 0 50 0 minecraft:grass_block
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=31..40}] run setblock 0 50 0 minecraft:pale_oak_log
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=41..45}] run setblock 0 50 0 minecraft:pale_moss_block
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=44..45}] run setblock 0 51 0 minecraft:pale_moss_carpet
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=46..47}] run setblock 0 50 0 minecraft:pale_oak_leaves
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=48..50}] run setblock 0 50 0 minecraft:pale_oak_wood
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=51..55}] run setblock 0 50 0 minecraft:resin_block
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=56..60}] run setblock 0 50 0 minecraft:resin_bricks
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=61}] run setblock 0 50 0 minecraft:resin_clump
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=62..65}] run setblock 0 50 0 minecraft:chiseled_resin_bricks
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=66..70}] run setblock 0 50 0 minecraft:stone
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=71..75}] run setblock 0 50 0 minecraft:coal_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=76..80}] run setblock 0 50 0 minecraft:copper_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=81..85}] run setblock 0 50 0 minecraft:deepslate_coal_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=86..90}] run setblock 0 50 0 minecraft:deepslate_copper_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=91..95}] run setblock 0 50 0 minecraft:deepslate_diamond_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=96..100}] run setblock 0 50 0 minecraft:deepslate_gold_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=101..105}] run setblock 0 50 0 minecraft:deepslate_iron_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=106..110}] run setblock 0 50 0 minecraft:deepslate_lapis_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=111..115}] run setblock 0 50 0 minecraft:deepslate_redstone_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=116..120}] run setblock 0 50 0 minecraft:diamond_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=121..125}] run setblock 0 50 0 minecraft:emerald_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=126..130}] run setblock 0 50 0 minecraft:gold_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=131..135}] run setblock 0 50 0 minecraft:iron_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=136..140}] run setblock 0 50 0 minecraft:lapis_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=141..145}] run setblock 0 50 0 minecraft:redstone_ore

execute as @e[type=armor_stand,tag=DtA,scores={mob_rand=12..,mob_rando=3}] at @s run scoreboard players set @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rando=3},tag=DtA] level_rand 9
execute as @e[type=armor_stand,tag=DtA,scores={level_rand=9}] at @s run scoreboard players random @e[type=armor_stand,tag=DtA] mob_rand 1 11

# Tiny Takeover - Baby Mobs (Pale Garden)
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=1,mob_rando=3}] run summon minecraft:wolf 0 51.5 0 ~~ minecraft:entity_born
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=2,mob_rando=3}] run summon minecraft:fox 0 51.5 0 ~~ minecraft:entity_born
# Regular Mobs
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=3,mob_rando=3}] run summon minecraft:creaking 0 52 0
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=3..4,mob_rando=3}] run time set midnight
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=3..4,mob_rando=3}] run setblock 0 49 0 minecraft:pale_oak_log
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=3..4,mob_rando=3}] run setblock 0 50 0 minecraft:creaking_heart
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=3..4,mob_rando=3}] run setblock 0 51 0 minecraft:pale_oak_log
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=5,mob_rando=3}] run summon minecraft:zombie 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=6,mob_rando=3}] run summon minecraft:skeleton 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=7,mob_rando=3}] run summon minecraft:skeleton_horse 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=8,mob_rando=3}] run summon minecraft:spider 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=9,mob_rando=3}] run summon minecraft:creeper 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=10,mob_rando=3}] run summon minecraft:wolf 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=11,mob_rando=3}] run summon minecraft:fox 0 51.5 0

# Particle + Sound effect for mob_rando = 3
execute as @e[type=armor_stand,tag=DtA,scores={mob_rando=3}] at @s run particle minecraft:cauldron_explosion_emitter 0 51 0 
execute as @e[type=armor_stand,tag=DtA,scores={mob_rando=3}] at @s run playsound mob.blaze.death @a 0 51 0 5 2

execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_Count=2600}] run function chest-barrels/chest
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_Count=2659}] run function chest-barrels/chest
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_Count=2728}] run function chest-barrels/chest
