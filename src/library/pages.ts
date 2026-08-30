import * as THREE from "three";
import type { BookRig } from "./rig";
import type { PageDragState } from "./gestures";

/** Leaves that carry printed content and can be turned. */
export const PAGINATED_LEAF_COUNT = 4;
/** Number of resting positions for the turned stack: 0 through 4 turned. */
export const SPREAD_COUNT = PAGINATED_LEAF_COUNT + 1;

const clamp = THREE.MathUtils.clamp;
const damp = THREE.MathUtils.damp;

/**
 * Advances one sheet's curve/twist springs toward their targets and, unless
 * the springs have already settled at rest, re-derives its vertex buffers
 * from the undeformed `base` copy captured at rig build time (Task 4).
 *
 * The early-out below is not optional: six books × six leaves × two
 * surfaces × 171 vertices, plus a `computeVertexNormals()` per surface,
 * every frame, is a real cost for books that are not moving.
 */
export function updateFlexiblePage(
  pivot: THREE.Group,
  targetCurve: number,
  delta: number,
  immediate = false,
  targetTwist = 0,
): void {
  const flex = pivot.userData.flex;
  if (!flex) return;

  const settleImmediately = immediate;
  const step = Math.min(delta, 0.033);
  let nextCurve = targetCurve;
  let nextTwist = targetTwist;

  if (settleImmediately) {
    flex.curveVelocity = 0;
    flex.twistVelocity = 0;
  } else {
    const curveAcceleration = (targetCurve - flex.curve) * 178 - flex.curveVelocity * 19;
    const twistAcceleration = (targetTwist - flex.twist) * 210 - flex.twistVelocity * 21;
    flex.curveVelocity = clamp(flex.curveVelocity + curveAcceleration * step, -1.8, 1.8);
    flex.twistVelocity = clamp(flex.twistVelocity + twistAcceleration * step, -1.6, 1.6);
    nextCurve = clamp(flex.curve + flex.curveVelocity * step, -0.025, 0.19);
    nextTwist = clamp(flex.twist + flex.twistVelocity * step, -0.12, 0.12);

    if (Math.abs(targetCurve - nextCurve) < 0.00002 && Math.abs(flex.curveVelocity) < 0.0008) {
      nextCurve = targetCurve;
      flex.curveVelocity = 0;
    }
    if (Math.abs(targetTwist - nextTwist) < 0.00002 && Math.abs(flex.twistVelocity) < 0.0008) {
      nextTwist = targetTwist;
      flex.twistVelocity = 0;
    }
  }

  if (
    !settleImmediately &&
    Math.abs(nextCurve - flex.curve) < 1e-5 &&
    Math.abs(targetCurve - nextCurve) < 1e-5 &&
    Math.abs(nextTwist - flex.twist) < 1e-5 &&
    Math.abs(targetTwist - nextTwist) < 1e-5
  ) {
    return;
  }

  flex.curve = nextCurve;
  flex.twist = nextTwist;

  for (const surface of flex.surfaces) {
    const { position, base, direction, geometry } = surface;
    for (let vertex = 0; vertex < position.count; vertex += 1) {
      const offset = vertex * 3;
      const x = base[offset];
      const y = base[offset + 1];
      const u = x + 0.5;
      const mappedU = direction > 0 ? u : 1 - u;
      const arch = Math.sin(Math.PI * mappedU);
      const freeEdgeLift = mappedU * mappedU * 0.16;
      const shape = arch * 0.84 + freeEdgeLift;
      const diagonalTwist = nextTwist * y * Math.pow(mappedU, 1.35);
      const softRipple =
        nextTwist *
        Math.sin(mappedU * Math.PI * 2) *
        (1 - Math.min(1, Math.abs(y) * 1.65)) *
        0.09;
      const z = (nextCurve * shape * (1 + y * 0.14) + diagonalTwist + softRipple) * direction;
      position.setXYZ(vertex, x, y, z);
    }
    position.needsUpdate = true;
    geometry.computeVertexNormals();
  }
}

/**
 * Advances one book's cover hinge and its page leaves toward the current
 * open amount / spread, and drives each leaf's flex spring off the result.
 *
 * `drag` is `null` until Task 11 wires up pointer-driven page turning; the
 * guard below reads it (satisfying `noUnusedParameters`) but does nothing
 * yet — Task 11 fills in the drag-driven boosts without restructuring this
 * function.
 */
export function updatePaginatedBook(
  rig: BookRig,
  delta: number,
  openAmount: number,
  spread: number,
  drag: PageDragState | null,
  hovered: boolean,
  reduced: boolean,
): void {
  const amount = clamp(openAmount, 0, 1);
  const speed = reduced ? 1000 : 10.5;
  const hoverCrack = amount === 0 && hovered && !reduced ? -0.16 : 0;
  const coverTarget = amount > 0 ? (-Math.PI + 0.055) * amount : hoverCrack;

  rig.frontPivot.rotation.y = damp(rig.frontPivot.rotation.y, coverTarget, speed, delta);

  rig.pagePivots.forEach((pagePivot, pageIndex) => {
    const leafOrder = rig.pagePivots.length - 1 - pageIndex;
    let pageTarget = 0;
    let positionTarget = pagePivot.userData.restZ;
    let pageTwistTarget = 0;
    const dragCurveBoost = 0;
    const flexTwistTarget = 0;

    if (leafOrder < PAGINATED_LEAF_COUNT) {
      const isTurned = leafOrder < spread;
      const unturnedTarget = -0.038 + leafOrder * 0.008;
      const turnedTarget = -Math.PI + 0.085 + leafOrder * 0.014;
      pageTarget = isTurned ? turnedTarget : unturnedTarget;
      positionTarget = isTurned ? pagePivot.userData.turnedZ : pagePivot.userData.restZ;

      if (drag !== null && drag.active) {
        // Task 11 fills this in: drag-driven page target, curve boost, and
        // twist, keyed off `drag.direction` / `drag.progress` for the leaf
        // currently being dragged.
      }

      pagePivot.position.z = damp(
        pagePivot.position.z,
        pagePivot.userData.restZ + (positionTarget - pagePivot.userData.restZ) * amount,
        speed,
        delta,
      );
    } else {
      pageTarget = -0.006 + (leafOrder - PAGINATED_LEAF_COUNT) * 0.003;
      pagePivot.position.z = damp(pagePivot.position.z, pagePivot.userData.restZ, speed, delta);
    }

    pagePivot.rotation.y = damp(pagePivot.rotation.y, pageTarget * amount, speed, delta);
    pagePivot.rotation.z = damp(pagePivot.rotation.z, pageTwistTarget * amount, speed, delta);

    const turnProgress = clamp(Math.abs(pagePivot.rotation.y) / Math.PI, 0, 1);
    const curveTarget =
      amount > 0
        ? amount * (0.004 + Math.sin(Math.PI * turnProgress) * 0.082 + dragCurveBoost)
        : 0;
    updateFlexiblePage(pagePivot, curveTarget, delta, reduced, flexTwistTarget * amount);
  });
}
