import type { Grid } from "./grid";
import type { World3D } from "./scene3d";

const WAKE_SECONDS = 0.9; // how long the "!" shows; matches the stand-up in scene3d
const white = (alpha = 1) => `rgba(240, 243, 250, ${alpha.toFixed(2)})`;

/** Text over the world, game-style: a name tag above the figure, small Zs while asleep, "!" on waking. */
export function drawIntroOverlay(grid: Grid, world: World3D, now: number, ambient: number, wokeAt: number | null) {
  const head = world.headCell(grid.cols, grid.rows);

  const name = "Dimural";
  grid.put(head.col - Math.floor(name.length / 2), head.row - 4, name, white(0.95));

  if (wokeAt === null) {
    for (let i = 0; i < 3; i++) {
      const p = (ambient * 0.3 + i / 3) % 1;
      const alpha = Math.min(1, p * 5) * (1 - p);
      grid.big(head.col + 6 + p * 5, head.row - 4 - p * 5, "z", white(alpha), 1.2 + p * 1.2);
    }
  } else if (now - wokeAt < WAKE_SECONDS) {
    grid.big(head.col + 1, head.row - 6, "!", white(), 2);
  }

  const hint = wokeAt === null ? " press any key to wake up " : "";
  if (hint) grid.art(Math.floor((grid.cols - hint.length) / 2), grid.rows - 4, [hint], white(0.55 + 0.3 * Math.sin(ambient * 2)));
}
