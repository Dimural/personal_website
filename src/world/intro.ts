import type { Grid } from "./grid";
import { WAKE_SECONDS, type World3D } from "./scene3d";

const white = (alpha = 1) => `rgba(240, 243, 250, ${alpha.toFixed(2)})`;

/** Text over the world, game-style: a name tag above the figure, small Zs while asleep, "!" on waking, hints. */
export function drawIntroOverlay(grid: Grid, world: World3D, now: number, ambient: number, wokeAt: number | null, walked: boolean) {
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

  // One hint at a time: how to wake, then how to walk, then nothing once they've walked.
  const hint = wokeAt === null ? " press any key to wake up " : !walked ? " WASD or arrow keys to walk " : "";
  const pulse = white(0.55 + 0.3 * Math.sin(ambient * 2));
  if (hint) grid.art(Math.floor((grid.cols - hint.length) / 2), grid.rows - 4, [hint], pulse);
}
