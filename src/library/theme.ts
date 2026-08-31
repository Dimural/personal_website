import * as THREE from "three";
import type { Volume, VolumePalette } from "./data";
import type { RoomHandles } from "./room";

/**
 * Each volume brings its own light into the room. Selecting a book eases the
 * floor, wall, carcass and all eight lights toward its palette, and sets the
 * matching custom properties on the library section so the HTML interface
 * retints with the WebGL behind it.
 *
 * The properties are scoped to `#library`, never `:root` — the hero and the
 * page ground stay bone, so the shift reads as a reading room dimming around
 * a book rather than as the whole site going dark.
 */

/** The room's resting palette: the bone-and-ultramarine daylight it starts in. */
export const NEUTRAL_PALETTE: VolumePalette = {
  paper: "#ebe6dc",
  paperDeep: "#ddd5c6",
  paperPale: "#f6f1e7",
  ink: "#23324f",
  inkSoft: "#5a6376",
  wall: "#e6e0d5",
  shelf: "#c7a877",
  shelfDark: "#d9d0c1",
  light: "#fff6e8",
  fill: "#e8eef6",
};

const NEUTRAL_ACCENT = "#9a6b4f";

interface ThemeTargets {
  floor: THREE.Color;
  wall: THREE.Color;
  shelf: THREE.Color;
  shelfDark: THREE.Color;
  shadow: THREE.Color;
  hemisphere: THREE.Color;
  hemisphereGround: THREE.Color;
  key: THREE.Color;
  fill: THREE.Color;
  rim: THREE.Color;
}

export interface Theme {
  /** Point the room at a volume's palette, or at the neutral one. */
  apply(volume: Volume | null): void;
  /** Ease one frame toward the targets. Returns whether it is still moving. */
  update(delta: number): boolean;
}

export function createTheme(
  room: RoomHandles,
  section: HTMLElement,
  reduced: boolean,
): Theme {
  const targets: ThemeTargets = {
    floor: new THREE.Color(),
    wall: new THREE.Color(),
    shelf: new THREE.Color(),
    shelfDark: new THREE.Color(),
    shadow: new THREE.Color(),
    hemisphere: new THREE.Color(),
    hemisphereGround: new THREE.Color(),
    key: new THREE.Color(),
    fill: new THREE.Color(),
    rim: new THREE.Color(),
  };

  let moving = false;
  let started = false;

  const { materials, lights } = room;

  function setTargets(palette: VolumePalette, accent: string) {
    targets.floor.set(palette.paperDeep);
    targets.wall.set(palette.wall);
    targets.shelf.set(palette.shelf);
    targets.shelfDark.set(palette.shelfDark);
    targets.shadow.set(palette.shelfDark);
    targets.hemisphere.set(palette.paperPale);
    targets.hemisphereGround.set(palette.shelf);
    targets.key.set(palette.light);
    targets.fill.set(palette.fill);
    targets.rim.set(accent);
  }

  function snap() {
    materials.floor.color.copy(targets.floor);
    materials.wall.color.copy(targets.wall);
    materials.shelf.color.copy(targets.shelf);
    materials.shelfDark.color.copy(targets.shelfDark);
    materials.shadow.color.copy(targets.shadow);
    lights.hemisphere.color.copy(targets.hemisphere);
    lights.hemisphere.groundColor.copy(targets.hemisphereGround);
    lights.key.color.copy(targets.key);
    lights.softKey.color.copy(targets.key);
    lights.fill.color.copy(targets.fill);
    lights.rim.color.copy(targets.rim);
    lights.backFill.color.copy(targets.fill);
    lights.spineRake.color.copy(targets.key);
    lights.pageRake.color.copy(targets.hemisphere);
    moving = false;
  }

  function apply(volume: Volume | null) {
    const palette = volume ? volume.palette : NEUTRAL_PALETTE;
    const accent = volume ? volume.foil : NEUTRAL_ACCENT;

    // Scoped to the section, so the hero and page ground stay bone.
    const style = section.style;
    style.setProperty("--paper", palette.paper);
    style.setProperty("--paper-deep", palette.paperDeep);
    style.setProperty("--paper-pale", palette.paperPale);
    style.setProperty("--ink", palette.ink);
    style.setProperty("--ink-soft", palette.inkSoft);
    style.setProperty("--accent", accent);
    style.setProperty(
      "--rule",
      `color-mix(in srgb, ${palette.ink} 24%, transparent)`,
    );

    setTargets(palette, accent);

    if (!started || reduced) {
      started = true;
      snap();
    } else {
      moving = true;
    }
  }

  function update(delta: number) {
    if (!moving) return false;
    const amount = 1 - Math.exp(-delta * 5.5);
    let largestGap = 0;

    const ease = (current: THREE.Color, target: THREE.Color) => {
      const dr = current.r - target.r;
      const dg = current.g - target.g;
      const db = current.b - target.b;
      largestGap = Math.max(largestGap, dr * dr + dg * dg + db * db);
      current.lerp(target, amount);
    };

    ease(materials.floor.color, targets.floor);
    ease(materials.wall.color, targets.wall);
    ease(materials.shelf.color, targets.shelf);
    ease(materials.shelfDark.color, targets.shelfDark);
    ease(materials.shadow.color, targets.shadow);
    ease(lights.hemisphere.color, targets.hemisphere);
    ease(lights.hemisphere.groundColor, targets.hemisphereGround);
    ease(lights.key.color, targets.key);
    ease(lights.softKey.color, targets.key);
    ease(lights.fill.color, targets.fill);
    ease(lights.rim.color, targets.rim);
    ease(lights.backFill.color, targets.fill);
    ease(lights.spineRake.color, targets.key);
    ease(lights.pageRake.color, targets.hemisphere);

    // Close enough that another frame would not be visible — stop asking.
    if (largestGap < 0.0000025) snap();
    return moving;
  }

  return { apply, update };
}
