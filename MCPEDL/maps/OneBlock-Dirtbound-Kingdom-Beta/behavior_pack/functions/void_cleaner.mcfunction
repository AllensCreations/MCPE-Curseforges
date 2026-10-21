# One-time bounded void cleanup for Dirtbound.
# Clear only the 31x31 area below the starting platform; preserve the platform at y=63 and everything above it.
# Two fills stay below Bedrock's per-command fill volume limit.
fill -15 0 -15 15 30 15 air
fill -15 31 -15 15 62 15 air
# Persistent one-time sentinel under the center Bedrock block.
setblock 0 62 0 structure_void
