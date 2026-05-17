// Camera is at 45° azimuth. These are the XZ movement directions
// relative to how the isometric view appears on screen.
const CAM_AZIMUTH = Math.PI / 4;
const FWD   = { x: -Math.sin(CAM_AZIMUTH), z: -Math.cos(CAM_AZIMUTH) }; // W — into scene
const RIGHT  = { x:  Math.cos(CAM_AZIMUTH), z: -Math.sin(CAM_AZIMUTH) }; // D — screen-right

/**
 * Returns a normalised XZ movement vector for the given key state.
 * Returns {x:0, z:0} when no keys are held.
 */
export function getMoveVector(keys) {
  let x = 0, z = 0;
  if (keys.w) { x += FWD.x;    z += FWD.z; }
  if (keys.s) { x -= FWD.x;    z -= FWD.z; }
  if (keys.a) { x -= RIGHT.x;  z -= RIGHT.z; }
  if (keys.d) { x += RIGHT.x;  z += RIGHT.z; }
  const len = Math.sqrt(x * x + z * z);
  return len > 0 ? { x: x / len, z: z / len } : { x: 0, z: 0 };
}

/**
 * Returns the yaw angle (radians) the character should face
 * given a movement direction vector.
 */
export function facingAngle(dx, dz) {
  return Math.atan2(dx, dz);
}

/**
 * Returns true if (px, pz) is within `radius` of (ox, oz).
 */
export function isNearby(px, pz, ox, oz, radius) {
  const dx = px - ox, dz = pz - oz;
  return dx * dx + dz * dz <= radius * radius;
}

/**
 * Axis-aligned bounding box overlap test on XZ plane.
 * a/b are centres; aw/ad and bw/bd are full widths and depths.
 * Returns true when the boxes overlap (touching edges = false).
 */
export function aabbOverlap(ax, az, aw, ad, bx, bz, bw, bd) {
  return (
    ax - aw / 2 < bx + bw / 2 &&
    ax + aw / 2 > bx - bw / 2 &&
    az - ad / 2 < bz + bd / 2 &&
    az + ad / 2 > bz - bd / 2
  );
}
