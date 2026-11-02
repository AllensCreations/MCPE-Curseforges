# Restore only missing foundation Bedrock, and only after a player finished setup
execute if entity @a[tag=void_cleaned] unless block 0 -1 0 bedrock run setblock 0 -1 0 bedrock
