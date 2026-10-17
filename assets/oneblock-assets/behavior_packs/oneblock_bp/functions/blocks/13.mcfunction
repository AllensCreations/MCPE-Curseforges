# Jai Shree Ram # Om namah shivay!

# Trail Chamber

setblock 0 50 0 minecraft:deepslate

# Random values (converted)
scoreboard players random @e[type=minecraft:armor_stand,tag=OneBlockAnchor] Block_place_rand 1 125
scoreboard players random @e[type=minecraft:armor_stand,tag=OneBlockAnchor] mob_rando 1 17
scoreboard players add @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rando=3}] mob_rand 1

execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=1..4}] run setblock 0 50 0 minecraft:copper_bulb
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=4..9}] run setblock 0 50 0 minecraft:copper_block
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=10..18}] run setblock 0 50 0 minecraft:cut_copper
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=19..25}] run setblock 0 50 0 minecraft:copper_grate
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=26..30}] run setblock 0 50 0 minecraft:chiseled_copper
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=31..50}] run setblock 0 50 0 minecraft:tuff
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=51..60}] run setblock 0 50 0 minecraft:tuff_bricks
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=61..65}] run setblock 0 50 0 minecraft:chiseled_tuff_bricks
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=66..67}] run setblock 0 50 0 minecraft:chiseled_tuff
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=68..69}] run setblock 0 50 0 minecraft:deepslate
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=70..75}] run setblock 0 50 0 minecraft:deepslate_tiles
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=76..80}] run setblock 0 50 0 minecraft:chiseled_deepslate
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=81..85}] run setblock 0 50 0 minecraft:dirt
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=86..95}] run setblock 0 50 0 minecraft:gravel
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=96..100}] run setblock 0 50 0 minecraft:deepslate_coal_ore
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=101..105}] run setblock 0 50 0 minecraft:deepslate_lapis_ore
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=106..110}] run setblock 0 50 0 minecraft:deepslate_iron_ore
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=111..115}] run setblock 0 50 0 minecraft:deepslate_redstone_ore
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=116..118}] run setblock 0 50 0 minecraft:deepslate_diamond_ore
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=119..125}] run setblock 0 50 0 minecraft:deepslate_copper_ore

execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=15..,mob_rando=3}] at @s run scoreboard players set @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rando=3},tag=OneBlockAnchor] level_rand 13
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={level_rand=13}] at @s run scoreboard players random @e[type=minecraft:armor_stand,tag=OneBlockAnchor] mob_rand 1 14

# Tiny Takeover - Baby Mobs (Trial Chamber)
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=1,mob_rando=3}] run summon zombie_villager 0 51.5 0 ~~ minecraft:as_baby
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=2,mob_rando=3}] run summon husk 0 51.5 0 ~~ minecraft:as_baby
# Regular Mobs
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=3,mob_rando=3}] run summon zombie 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=4,mob_rando=3}] run summon skeleton 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=5,mob_rando=3}] run summon zombie_villager 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=6,mob_rando=3}] run summon breeze 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=7,mob_rando=3}] run summon bogged 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=8,mob_rando=3}] run summon spider 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=9,mob_rando=3}] run summon creeper 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=10,mob_rando=3}] run summon husk 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=11,mob_rando=3}] run summon stray 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=12,mob_rando=3}] run summon zombie_horse 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=13,mob_rando=3}] run summon skeleton_horse 0 51.5 0
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rand=14,mob_rando=3}] run summon slime 0 51.5 0

# Particle + Sound effect for mob_rando = 3
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rando=3}] at @s run particle minecraft:cauldron_explosion_emitter 0 51 0 
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={mob_rando=3}] at @s run playsound mob.blaze.death @a 0 51 0 5 2

execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3712}] run function chest-barrels/chest
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3773}] run function chest-barrels/chest
execute as @e[type=minecraft:armor_stand,tag=OneBlockAnchor,scores={Block_Count=3834}] run function chest-barrels/chest
