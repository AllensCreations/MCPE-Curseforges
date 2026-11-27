const CHIME = "aln.uncraftablecraftable.altar.chime";
const BURST = "aln:fabricate_burst";

export function celebrate(dimension, location) {
  try {
    dimension.spawnParticle(BURST, location);
  } catch (error) {
  }
  try {
    dimension.playSound(CHIME, location);
  } catch (error) {
  }
}
