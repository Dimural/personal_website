import * as THREE from "three";
import type { Slot } from "./carousel";
import type { BookRig } from "./rig";

/** Seconds the whole fly-out (or the gather back up) takes, stagger included. */
export const SPREAD_DURATION = 0.92;
/** Seconds a book's flight to (or back from) the reading pose takes. */
export const DETAIL_TRANSITION_DURATION = 0.92;
/**
 * Fraction of the window each successive book waits before starting. The
 * books do not leave the shelf as a slab — the second sets off a beat after
 * the first, the third a beat after that.
 */
export const STAGGER = 0.06;

const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const smootherstep = (value: number) =>
  value * value * value * (value * (value * 6 - 15) + 10);

/** A world transform frozen at one instant, to interpolate away from. */
export interface CapturedPose {
  position: THREE.Vector3;
  quaternion: THREE.Quaternion;
  scale: THREE.Vector3;
}

/**
 * Snapshots an object's *local* transform. Callers reparent with `attach()`
 * first, so the local transform is already the world one — capturing after
 * the reparent is what makes the fly-out start exactly where the book stood.
 */
export function capturePose(object: THREE.Object3D): CapturedPose {
  return {
    position: object.position.clone(),
    quaternion: object.quaternion.clone(),
    scale: object.scale.clone(),
  };
}

const destination = new THREE.Quaternion();

/**
 * Interpolates every rig from `from[i]` to `slots[i]` at global progress `t`,
 * each book on its own staggered sub-window.
 *
 * `span = 1 - (count - 1) * stagger` is the width of one book's window, so
 * the last one still finishes exactly at `t === 1`. With three books and
 * `stagger = 0.06`, `span = 0.88`. Pass `stagger = 0` to move them as a
 * group — which is what regrouping wants.
 */
export function applySpreadPose(
  rigs: BookRig[],
  from: CapturedPose[],
  slots: Slot[],
  t: number,
  stagger: number,
): void {
  const span = 1 - (rigs.length - 1) * stagger;
  rigs.forEach((rig, i) => {
    const local = clamp((t - i * stagger) / span, 0, 1);
    const eased = smootherstep(local);
    rig.root.position.lerpVectors(from[i].position, slots[i].position, eased);
    rig.root.quaternion.slerpQuaternions(
      from[i].quaternion,
      destination.setFromEuler(slots[i].rotation),
      eased,
    );
    rig.root.scale.setScalar(lerp(from[i].scale.x, slots[i].scale, eased));
    // Arc up and out, so books clear the boards instead of passing through.
    rig.root.position.y += Math.sin(local * Math.PI) * 0.28;
    rig.root.position.z += Math.sin(local * Math.PI) * 0.18;
  });
}

/**
 * Flies one rig from a captured pose to an explicit destination transform —
 * the single book leaving the carousel to be held and read. Every other rig
 * in the carousel stays exactly where it is; this only ever touches one.
 */
export function applyOpeningPose(
  rig: BookRig,
  from: CapturedPose,
  toPosition: THREE.Vector3,
  toQuaternion: THREE.Quaternion,
  toScale: number,
  t: number,
): void {
  const eased = smootherstep(clamp(t, 0, 1));
  rig.root.position.lerpVectors(from.position, toPosition, eased);
  rig.root.quaternion.slerpQuaternions(from.quaternion, toQuaternion, eased);
  rig.root.scale.setScalar(lerp(from.scale.x, toScale, eased));
}

/**
 * The reverse of `applyOpeningPose`: flies the held rig from its reading
 * pose back down onto its carousel slot.
 */
export function applyClosingPose(
  rig: BookRig,
  from: CapturedPose,
  toSlot: Slot,
  t: number,
): void {
  const eased = smootherstep(clamp(t, 0, 1));
  rig.root.position.lerpVectors(from.position, toSlot.position, eased);
  rig.root.quaternion.slerpQuaternions(
    from.quaternion,
    destination.setFromEuler(toSlot.rotation),
    eased,
  );
  rig.root.scale.setScalar(lerp(from.scale.x, toSlot.scale, eased));
}
