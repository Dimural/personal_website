import type { Grid } from "./grid";
import { WAKE_SECONDS, type Rest, type World3D } from "./scene3d";

const white = (alpha = 1) => `rgba(240, 243, 250, ${alpha.toFixed(2)})`;

/** Text over the world, game-style: small Zs while asleep, "!" on waking, the walking and sleeping hints. */
export function drawIntroOverlay(grid: Grid, world: World3D, now: number, ambient: number, rest: Rest, walked: boolean, atLog: boolean) {
  const head = world.headCell(grid.cols, grid.rows);

  const settled = rest.since === null || now - rest.since >= WAKE_SECONDS;
  if (rest.asleep && settled) {
    for (let i = 0; i < 3; i++) {
      const p = (ambient * 0.3 + i / 3) % 1;
      const alpha = Math.min(1, p * 5) * (1 - p);
      grid.big(head.col + 6 + p * 5, head.row - 4 - p * 5, "z", white(alpha), 1.2 + p * 1.2);
    }
  } else if (!rest.asleep && !settled) {
    grid.big(head.col + 1, head.row - 6, "!", white(), 2);
  }

  // How to walk, until they have. (Waking is the title card's "press space" button.)
  const pulse = white(0.55 + 0.3 * Math.sin(ambient * 2));
  const hint = !rest.asleep && !walked ? " WASD or arrow keys to walk " : "";
  if (hint) grid.art(Math.floor((grid.cols - hint.length) / 2), grid.rows - 4, [hint], pulse);
  if (atLog) {
    const log = world.logCell(grid.cols, grid.rows);
    const text = " press space to sleep ";
    grid.art(Math.round(log.col - text.length / 2), Math.round(log.row) - 3, [text], pulse);
  }
}
