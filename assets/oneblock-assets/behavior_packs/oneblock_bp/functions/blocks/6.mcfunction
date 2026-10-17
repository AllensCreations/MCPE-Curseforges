# Jai Shree Ram # Om namah shivay!

# Jungle

setblock 0 50 0 stone

# Random values (converted)
scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] Block_place_rand 1 98
scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] mob_rando 1 17
scoreboard players add @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rando=3}] mob_rand 1

execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=1..30}] run setblock 0 50 0 grass_block
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=31..33}] run setblock 0 50 0 honey_block
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=34..35}] run setblock 0 50 0 honeycomb_block
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=36..40}] run setblock 0 50 0 melon_block
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=41}] run setblock 0 50 0 bee_nest
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=42}] run setblock 0 51 0 big_dripleaf
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=20..25}] run setblock 0 51 0 bamboo
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=36..45}] run setblock 0 50 0 dirt
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=46..60}] run setblock 0 50 0 jungle_log
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=61}] run setblock 0 50 0 jungle_leaves
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=62..65}] run setblock 0 50 0 cobblestone
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=66..70}] run setblock 0 50 0 mossy_cobblestone
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=71}] run setblock 0 50 0 coal_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=72..73}] run setblock 0 50 0 iron_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=74..75}] run setblock 0 50 0 redstone_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=76..77}] run setblock 0 50 0 lapis_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=78..80}] run setblock 0 50 0 gold_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=81..85}] run setblock 0 50 0 diamond_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=86..87}] run setblock 0 50 0 deepslate_coal_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=88..90}] run setblock 0 50 0 deepslate_iron_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=91..92}] run setblock 0 50 0 deepslate_redstone_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=93..94}] run setblock 0 50 0 deepslate_lapis_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=95..97}] run setblock 0 50 0 deepslate_gold_ore
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_place_rand=98}] run setblock 0 50 0 deepslate_diamond_ore

execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=13..,mob_rando=3}] at @s run scoreboard players set @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rando=3},tag=OneBlockAnchor] level_rand 6
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={level_rand=6}] at @s run scoreboard players random @e[type=armor_stand,tag=OneBlockAnchor] mob_rand 1 12

# Tiny Takeover - Baby Mobs (Jungle)
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=1,mob_rando=3}] run summon panda 0 51.5 0 ~~ minecraft:entity_born
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=2,mob_rando=3}] run summon ocelot 0 51.5 0 ~~ minecraft:entity_born
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=3,mob_rando=3}] run summon bee 0 51.6 0 ~~ minecraft:entity_born
# Regular Mobs
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=4,mob_rando=3}] run summon ocelot 0 51.5 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=5,mob_rando=3}] run summon parrot 0 51.5 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=5,mob_rando=3}] run summon parrot 0 51.5 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=6,mob_rando=3}] run summon panda 0 51.5 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=7,mob_rando=3}] run summon bee 0 51.6 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=7,mob_rando=3}] run summon bee 0 51.6 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=7,mob_rando=3}] run summon bee 0 51.6 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=7,mob_rando=3}] run summon bee 0 51.6 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=8,mob_rando=3}] run summon cave_spider 0 51.5 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=9,mob_rando=3}] run summon spider 0 51.5 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=10,mob_rando=3}] run summon creeper 0 51.5 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=11,mob_rando=3}] run summon skeleton 0 51.5 0
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rand=12,mob_rando=3}] run summon phantom 0 51.5 0

# Particle + Sound effect for mob_rando = 3
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rando=3}] at @s run particle minecraft:cauldron_explosion_emitter 0 51 0 
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={mob_rando=3}] at @s run playsound mob.blaze.death @a 0 51 0 5 2

execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_Count=1616}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_Count=1672}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_Count=1738}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_Count=1794}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_Count=1884}] run function chest-barrels/chest
execute as @e[type=armor_stand,tag=OneBlockAnchor,scores={Block_Count=1946}] run function chest-barrels/chest
