import type { Grid } from "./grid";
import type { World3D } from "./scene3d";

const WAKE_SECONDS = 0.9; // how long the "!" shows; matches the stand-up in scene3d
const INK = [24, 30, 44];
const ink = (alpha = 1) => `rgba(${INK.join(", ")}, ${alpha.toFixed(2)})`;

/** Text drawn over the world: big Zs while asleep, "!" on waking, then a name label. */
export function drawIntroOverlay(grid: Grid, world: World3D, now: number, ambient: number, wokeAt: number | null) {
  const head = world.headCell(grid.cols, grid.rows);

  if (wokeAt === null) {
    // Zs grow and fade as they drift up and to the right: the plainest "asleep" sign there is.
    for (let i = 0; i < 3; i++) {
      const p = (ambient * 0.3 + i / 3) % 1;
      const alpha = Math.min(1, p * 5) * (1 - p);
      grid.big(head.col + 2 + p * 7, head.row - 3 - p * 6, "Z", ink(alpha), 1.4 + p * 1.4);
    }
  } else if (now - wokeAt < WAKE_SECONDS) {
    grid.big(head.col, head.row - 4, "!", ink(), 2.4);
  } else {
    const label = " dimural ";
    const alpha = Math.min(1, (now - wokeAt - WAKE_SECONDS) * 2);
    grid.art(head.col - Math.floor(label.length / 2), head.row - 3, [label], ink(alpha));
  }

  const hint = wokeAt === null ? " press any key to wake up " : " awake ";
  grid.art(Math.floor((grid.cols - hint.length) / 2), grid.rows - 3, [hint], ink(0.65 + 0.25 * Math.sin(ambient * 2)));
}
