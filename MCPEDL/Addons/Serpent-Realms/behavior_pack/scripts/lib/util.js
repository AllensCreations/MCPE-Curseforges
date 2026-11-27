export function isLive(entity) {
  try {
    const valid = entity.isValid;
    return typeof valid === "function" ? Boolean(valid.call(entity)) : Boolean(valid);
  } catch {
    return false;
  }
}

export function distanceBetween(a, b) {
  const dx = a.location.x - b.location.x;
  const dy = a.location.y - b.location.y;
  const dz = a.location.z - b.location.z;
  return Math.sqrt(dx * dx + dy * dy + dz * dz);
}
