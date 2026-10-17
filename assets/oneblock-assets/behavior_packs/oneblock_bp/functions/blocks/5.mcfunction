# Jai Shree Ram # Om namah shivay!

# Desert

setblock 0 50 0 stone

# Random values (converted)
scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] Block_place_rand 1 110
scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] mob_rando 1 17
scoreboard players add @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rando=3}] mob_rand 1

execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=1..20}] run setblock 0 50 0 sand
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=21..35}] run setblock 0 50 0 sandstone
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=36..45}] run setblock 0 50 0 stone
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=1..4}] run setblock 0 51 0 deadbush
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=46..50}] run setblock 0 50 0 sand
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=46..50}] run setblock 0 51 0 cactus
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=51..55}] run setblock 0 50 0 deepslate
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=56..58}] run setblock 0 50 0 deepslate_coal_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=59..60}] run setblock 0 50 0 deepslate_iron_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=61..62}] run setblock 0 50 0 deepslate_lapis_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=63..65}] run setblock 0 50 0 deepslate_gold_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=66..68}] run setblock 0 50 0 coal_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=69..70}] run setblock 0 50 0 iron_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=71..73}] run setblock 0 50 0 lapis_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=74..76}] run setblock 0 50 0 redstone_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=77..80}] run setblock 0 50 0 suspicious_sand
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=86..90}] run setblock 0 50 0 suspicious_gravel
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=91..94}] run setblock 0 50 0 tnt
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=93}] run setblock 0 51 0 stone_pressure_plate
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=95..110}] run setblock 0 50 0 deepslate_copper_ore

execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=14..,mob_rando=3}] at @s run scoreboard players set @e[type=armor_stand,tag=OneBlockAnchor] level_rand 5
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={level_rand=5}] at @s run scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] mob_rand 1 13

# Tiny Takeover - Baby Mobs (Desert)
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=1,mob_rando=3}] run summon camel 0 51.5 0 ~~ minecraft:entity_born
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=2,mob_rando=3}] run summon rabbit 0 51.5 0 ~~ minecraft:entity_born
# Regular Mobs
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=3,mob_rando=3}] run summon parched 0 51.5 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=4,mob_rando=3}] run summon parched 0 51.5 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=4,mob_rando=3}] run summon parched 0 51.5 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=5,mob_rando=3}] run summon camel_husk 0 51.5 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=6,mob_rando=3}] run summon rabbit 0 51.5 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=6,mob_rando=3}] run summon rabbit 0 51.5 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=7,mob_rando=3}] run summon husk 0 51.5 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=7,mob_rando=3}] run summon husk 0 51.5 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=8,mob_rando=3}] run summon camel_husk 0 51.5 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=9,mob_rando=3}] run summon creeper 0 51.5 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=10,mob_rando=3}] run summon creeper 0 51.5 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=10,mob_rando=3}] run summon creeper 0 51.5 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=11,mob_rando=3}] run summon spider 0 51.5 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=12,mob_rando=3}] run summon camel 0 51.5 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=13,mob_rando=3}] run summon skeleton 0 51.5 0

# Particle + Sound effect for mob_rando = 3
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rando=3}] at @s run particle minecraft:cauldron_explosion_emitter 0 51 0 
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rando=3}] at @s run playsound mob.blaze.death @a 0 51 0 5 2

execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_Count=1295}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_Count=1343}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_Count=1417}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_Count=1473}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_Count=1539}] run function chest-barrels/chest
