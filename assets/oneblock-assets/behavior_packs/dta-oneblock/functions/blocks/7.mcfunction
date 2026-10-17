# Jai Shree Ram # Om namah shivay!
# Copyright of DtA_MC7535 [Youtube:- @DtA_MC]
# Do not steal any thing respect creator work!

# BarrenLands

# Random values (converted)
scoreboard players random @e[type=minecraft:armor_stand,tag=DtA] Block_place_rand 1 160
scoreboard players random @e[type=minecraft:armor_stand,tag=DtA] mob_rando 1 18
scoreboard players add @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rando=3}] mob_rand 1

execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=0..30}] run setblock 0 50 0 red_sand
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=31..32}] run setblock 0 50 0 acacia_leaves
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=33..40}] run setblock 0 50 0 acacia_log
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=41..44}] run setblock 0 50 0 dark_oak_planks
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=45}] run setblock 0 50 0 dark_oak_fence
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=46..50}] run setblock 0 50 0 clay
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=51..70}] run setblock 0 50 0 red_sandstone
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=71..80}] run setblock 0 50 0 deepslate
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=81..85}] run setblock 0 50 0 deepslate_coal_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=86..90}] run setblock 0 50 0 deepslate_iron_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=91..95}] run setblock 0 50 0 deepslate_lapis_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=96..100}] run setblock 0 50 0 deepslate_redstone_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=101..105}] run setblock 0 50 0 deepslate_gold_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=106..107}] run setblock 0 50 0 deepslate_diamond_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=108..115}] run setblock 0 50 0 coal_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=116..120}] run setblock 0 50 0 iron_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=121..125}] run setblock 0 50 0 lapis_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=126..130}] run setblock 0 50 0 redstone_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=131..135}] run setblock 0 50 0 gold_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=136..137}] run setblock 0 50 0 diamond_ore
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=138..144}] run setblock 0 50 0 suspicious_sand
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_place_rand=145..150}] run setblock 0 50 0 suspicious_gravel
execute as @e[type=armor_stand,tag=DtA,scores={Block_place_rand=151..160}] run setblock 0 50 0 deepslate_copper_ore

execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=17..,mob_rando=3}] at @s run scoreboard players set @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rando=3},tag=DtA] level_rand 7
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={level_rand=7}] at @s run scoreboard players random @e[type=minecraft:armor_stand,tag=DtA] mob_rand 1 16

# Tiny Takeover - Baby Mobs (Barren Lands / Savanna)
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=1,mob_rando=3}] run summon llama 0 51.5 0 ~~ minecraft:entity_born
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=2,mob_rando=3}] run summon armadillo 0 51.50 0 ~~ minecraft:entity_born
# Regular Mobs
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=3,mob_rando=3}] run summon rabbit 0 51.50 0
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=4,mob_rando=3}] run summon husk 0 51.50 0
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=5,mob_rando=3}] run summon creeper 0 51.50 0
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=6,mob_rando=3}] run summon zombie 0 51.50 0
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=7,mob_rando=3}] run summon skeleton 0 51.50 0
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=8,mob_rando=3}] run summon spider 0 51.50 0
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=9,mob_rando=3}] run summon cave_spider 0 51.50 0
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=10,mob_rando=3}] at @s run summon zombie_horse 0 52 0
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=10,mob_rando=3}] at @s run summon zombie_horse 0 52 0
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=11,mob_rando=3}] run summon camel 0 51.50 0
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=11,mob_rando=3}] run summon armadillo 0 51.50 0
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=12,mob_rando=3}] run summon armadillo 0 51.50 0
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=13,mob_rando=3}] run structure load savanna-cow 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=14,mob_rando=3}] run structure load savanna-pig 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=15,mob_rando=3}] run structure load savanna-chicken 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rand=16,mob_rando=3}] run summon llama 0 51.5 0

# Particle + Sound effect for mob_rando = 3
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rando=3}] at @s run particle minecraft:cauldron_explosion_emitter 0 51 0 
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={mob_rando=3}] at @s run playsound mob.blaze.death @a 0 51 0 5 2

execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_Count=2006}] run function chest-barrels/chest
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_Count=2094}] run function chest-barrels/chest
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_Count=2149}] run function chest-barrels/chest
execute as @e[type=minecraft:armor_stand,tag=DtA,scores={Block_Count=2194}] run function chest-barrels/chest
