# Only restores missing Bedrock. No teleports, no spawn changes, no core placement.
execute if entity @a[tag=void_cleaned] unless block 0 63 0 bedrock run setblock 0 63 0 bedrock
