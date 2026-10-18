import type { Grid } from "./grid";
import type { World3D } from "./scene3d";

const WAKE_SECONDS = 0.9; // how long the "!" shows; matches the stand-up in scene3d
const INK = [28, 34, 40];
const ink = (alpha = 1) => `rgba(${INK.join(", ")}, ${alpha.toFixed(2)})`;

/** Text drawn over the world: Zs while asleep, "!" on waking, then a name label. */
export function drawIntroOverlay(grid: Grid, world: World3D, now: number, ambient: number, wokeAt: number | null) {
  const head = world.headCell(grid.cols, grid.rows);

  if (wokeAt === null) {
    for (let i = 0; i < 3; i++) {
      const p = (ambient * 0.35 + i / 3) % 1;
      grid.put(head.col + 2 + p * 6, head.row - 2 - p * 4, p < 0.5 ? "z" : "Z", ink(1 - p));
    }
  } else if (now - wokeAt < WAKE_SECONDS) {
    grid.art(head.col, head.row - 3, ["!"], ink());
  } else {
    const label = " dimural ";
    const alpha = Math.min(1, (now - wokeAt - WAKE_SECONDS) * 2);
    grid.art(head.col - Math.floor(label.length / 2), head.row - 3, [label], ink(alpha));
  }

  const hint = wokeAt === null ? " press any key " : " awake ";
  grid.art((grid.cols - hint.length) / 2, grid.rows - 3, [hint], ink(0.55 + 0.25 * Math.sin(ambient * 2)));
}
