# Jai Shree Ram # Om namah shivay!

# StrongHold

setblock 0 50 0 minecraft:deepslate

# Random values (converted)
scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] Block_place_rand 1 155
scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] mob_rando 1 17
scoreboard players add @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rando=3}] mob_rand 1

execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=0..20}] run setblock 0 50 0 stone_bricks
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=21..30}] run setblock 0 50 0 mossy_stone_bricks
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=31..40}] run setblock 0 50 0 cracked_stone_bricks
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=41..50}] run setblock 0 50 0 stone
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=51..55}] run setblock 0 50 0 dirt
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=56..60}] run setblock 0 50 0 gravel
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=61..65}] run setblock 0 50 0 suspicious_gravel
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=66}] run setblock 0 50 0 iron_bars
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=67..70}] run setblock 0 50 0 bookshelf
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=71}] run setblock 0 50 0 oak_fence
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=72..75}] run setblock 0 50 0 oak_planks
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=76..80}] run setblock 0 50 0 infested_stone
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=81..85}] run setblock 0 50 0 infested_deepslate
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=86..95}] run setblock 0 50 0 emerald_ore
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=96..100}] run setblock 0 50 0 redstone_ore
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=101..105}] run setblock 0 50 0 coal_ore
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=106..110}] run setblock 0 50 0 lapis_ore
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=111..115}] run setblock 0 50 0 iron_ore
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=116..120}] run setblock 0 50 0 gold_ore
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=121..125}] run setblock 0 50 0 diamond_ore
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=126..130}] run setblock 0 50 0 deepslate_coal_ore
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=131..135}] run setblock 0 50 0 deepslate_iron_ore
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=136..140}] run setblock 0 50 0 deepslate_redstone_ore
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=141..145}] run setblock 0 50 0 deepslate_lapis_ore
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=146..150}] run setblock 0 50 0 deepslate_gold_ore
execute as @e[tag=OneBlockAnchor,scores={Block_place_rand=151..155}] run setblock 0 50 0 deepslate_diamond_ore

execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=12..,mob_rando=3}] at @s run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rando=3},tag=OneBlockAnchor] level_rand 15
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={level_rand=15}] at @s run scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] mob_rand 1 11

# Tiny Takeover - Baby Mobs (Stronghold)
execute as @e[tag=OneBlockAnchor,scores={mob_rand=1,mob_rando=3}] run summon zombie 0 51.5 0 ~~ minecraft:as_baby
execute as @e[tag=OneBlockAnchor,scores={mob_rand=2,mob_rando=3}] run summon zombie_villager 0 51.5 0 ~~ minecraft:as_baby
# Regular Mobs
execute as @e[tag=OneBlockAnchor,scores={mob_rand=3,mob_rando=3}] run summon blaze 0 51.5 0
execute as @e[tag=OneBlockAnchor,scores={mob_rand=4,mob_rando=3}] run summon enderman 0 51.5 0
execute as @e[tag=OneBlockAnchor,scores={mob_rand=5,mob_rando=3}] run summon shulker 0 51.5 0
execute as @e[tag=OneBlockAnchor,scores={mob_rand=6,mob_rando=3}] run summon silverfish 0 51.5 0
execute as @e[tag=OneBlockAnchor,scores={mob_rand=6,mob_rando=3}] run summon silverfish 0 51.5 0
execute as @e[tag=OneBlockAnchor,scores={mob_rand=6,mob_rando=3}] run summon silverfish 0 51.5 0
execute as @e[tag=OneBlockAnchor,scores={mob_rand=6,mob_rando=3}] run summon silverfish 0 51.5 0
execute as @e[tag=OneBlockAnchor,scores={mob_rand=6,mob_rando=3}] run summon silverfish 0 51.5 0
execute as @e[tag=OneBlockAnchor,scores={mob_rand=7,mob_rando=3}] run summon skeleton 0 51.5 0
execute as @e[tag=OneBlockAnchor,scores={mob_rand=8,mob_rando=3}] run summon zombie 0 51.5 0
execute as @e[tag=OneBlockAnchor,scores={mob_rand=9,mob_rando=3}] run summon creeper 0 51.5 0
execute as @e[tag=OneBlockAnchor,scores={mob_rand=10,mob_rando=3}] run summon bat 0 51.5 0
execute as @e[tag=OneBlockAnchor,scores={mob_rand=11,mob_rando=3}] run summon spider 0 51.5 0

# Particle + Sound effect for mob_rando = 3
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rando=3}] at @s run particle minecraft:cauldron_explosion_emitter 0 51 0 
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rando=3}] at @s run playsound mob.blaze.death @a 0 51 0 5 2

execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=4373}] run function chest-barrels/chest
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=4443}] run function chest-barrels/chest
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=4517}] run function chest-barrels/chest
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=4578}] run function chest-barrels/chest
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=4647}] run function chest-barrels/chest
