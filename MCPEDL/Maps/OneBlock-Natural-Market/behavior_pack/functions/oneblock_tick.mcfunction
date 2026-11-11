execute as @a[tag=void_cleaned,tag=!oneblock_ready] run scriptevent allenscreations:oneblock_ready
tag @a[tag=void_cleaned,tag=!oneblock_ready] add oneblock_ready
execute if block 0 -1 0 air run setblock 0 -1 0 bedrock
