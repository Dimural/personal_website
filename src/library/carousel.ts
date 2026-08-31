import * as THREE from "three";
import { updateFlexiblePage } from "./pages";
import type { BookRig } from "./rig";
import { SHELF_BOARD_TOP } from "./room";

/** Centre-to-centre distance between two neighbouring carousel slots. */
export const SPACING = 1.5;

const clamp = THREE.MathUtils.clamp;
const damp = THREE.MathUtils.damp;
const smoothstep = (value: number) => value * value * (3 - 2 * value);

/** Where one book sits in the carousel, in world space. */
export interface Slot {
  position: THREE.Vector3;
  rotation: THREE.Euler;
  scale: number;
  opacity: number;
}

/**
 * The carousel wraps, so a book's offset from the focus is taken modulo the
 * book count — index 2 of three sits at −1 (one slot left) rather than +2.
 * `position` is fractional: the ring slides continuously and only settles on
 * an integer when the wheel goes idle.
 */
export function slotFor(
  index: number,
  position: number,
  count: number,
  height: number,
): Slot {
  let offset = index - position;
  offset -= Math.round(offset / count) * count;
  const distance = Math.abs(offset);
  const focus = 1 - clamp(distance, 0, 1);
  const fade = clamp((distance - 2.55) / 0.7, 0, 1);
  return {
    position: new THREE.Vector3(
      offset * SPACING,
      SHELF_BOARD_TOP + height * 0.5 + focus * 0.15,
      0.13 + focus * 0.24 - Math.min(distance, 2.8) * 0.07,
    ),
    rotation: new THREE.Euler(0, -offset * 0.105, -offset * 0.018),
    scale: 1 + focus * 0.09,
    opacity: 1 - smoothstep(fade),
  };
}

/** Pushes a rig's carousel opacity down through every material that fades. */
export function applyOpacity(rig: BookRig, opacity: number): void {
  rig.opacity = opacity;
  for (const material of rig.fadeMaterials) material.opacity = opacity;
  rig.contactShadow.visible = true;
  (rig.contactShadow.material as THREE.Material).opacity = opacity * 0.24;
  rig.hit.visible = opacity > 0.12;
}

/** Places a rig on its slot outright, with no damping — used on arrival. */
export function snapRigToSlot(rig: BookRig, slot: Slot): void {
  rig.root.position.copy(slot.position);
  rig.root.rotation.copy(slot.rotation);
  rig.root.scale.setScalar(slot.scale);
  rig.motion.position.set(0, 0, 0);
  rig.motion.rotation.set(0, 0, 0);
  rig.frontPivot.rotation.y = 0;
  for (const pivot of rig.pagePivots) {
    pivot.rotation.y = 0;
    pivot.rotation.z = 0;
    pivot.position.z = pivot.userData.restZ;
    updateFlexiblePage(pivot, 0, 0, true);
  }
  applyOpacity(rig, slot.opacity);
}

/**
 * One frame of carousel motion: damp every rig toward its slot.
 *
 * The wrap seam is the subtle part. When the ring turns far enough that a
 * book's offset jumps from one end to the other, damping would fly it across
 * the whole frame. Instead, snap its x and drop it to zero opacity so it
 * fades in at the new end. `rig.lastOffset` is what detects that jump, so it
 * has to be written every call, not only on the frames that wrap.
 */
export function updateCarousel(
  rigs: BookRig[],
  position: number,
  delta: number,
  reduced: boolean,
): void {
  const count = rigs.length;
  if (!count) return;
  const speed = reduced ? 1000 : 12;

  rigs.forEach((rig, index) => {
    const slot = slotFor(index, position, count, rig.base.height);

    let offset = index - position;
    offset -= Math.round(offset / count) * count;
    const wrapped =
      rig.lastOffset !== null && Math.abs(offset - rig.lastOffset) > count * 0.5;
    if (wrapped) {
      rig.root.position.x = slot.position.x;
      rig.opacity = 0;
    }
    rig.lastOffset = offset;

    rig.root.position.x = damp(rig.root.position.x, slot.position.x, speed, delta);
    rig.root.position.y = damp(rig.root.position.y, slot.position.y, speed, delta);
    rig.root.position.z = damp(rig.root.position.z, slot.position.z, speed, delta);
    rig.root.rotation.y = damp(rig.root.rotation.y, slot.rotation.y, speed, delta);
    rig.root.rotation.z = damp(rig.root.rotation.z, slot.rotation.z, speed, delta);
    rig.root.rotation.x = damp(rig.root.rotation.x, slot.rotation.x, speed, delta);
    rig.root.scale.setScalar(damp(rig.root.scale.x, slot.scale, speed, delta));

    const opacity = reduced
      ? slot.opacity
      : damp(rig.opacity, slot.opacity, 18, delta);
    applyOpacity(rig, opacity);
  });
}
