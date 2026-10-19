import type { Grid } from "./grid";
import type { World3D } from "./scene3d";
import { BUTTERFLY, BUTTERFLY_COLORS, LOG_ONLY, PALETTE, SLEEPER, STANDING } from "./sprites";

const WAKE_SECONDS = 0.9; // how long the "!" shows before they stand
const INK = [24, 30, 44];
const ink = (alpha = 1) => `rgba(${INK.join(", ")}, ${alpha.toFixed(2)})`;

/** The opening scene over the world: the hand-drawn sleeper, butterflies, Zs, then waking up. */
export function drawIntroOverlay(grid: Grid, world: World3D, now: number, ambient: number, wokeAt: number | null) {
  // Sprites are pinned to the log's spot in the 3D world, so they sit in the clearing at any window size.
  const at = world.toCell(0, 0.9, 0, grid.cols, grid.rows);
  const left = at.col - SLEEPER[0].art[0].length / 2;
  const top = at.row - 4;
  const head = { col: left + 9, row: top + 1 };
  const awake = wokeAt !== null && now - wokeAt >= WAKE_SECONDS;

  if (awake) {
    grid.sprite(left, top + 2, LOG_ONLY, PALETTE);
    grid.sprite(left + 18, top + 8, STANDING, PALETTE);
    const label = " dimural ";
    const alpha = Math.min(1, (now - wokeAt - WAKE_SECONDS) * 2);
    grid.art(left + 21 - Math.floor(label.length / 2), top + 16, [label], ink(alpha));
  } else {
    grid.sprite(left, top, SLEEPER[Math.floor(ambient / 1.3) % 2], PALETTE);
  }

  if (wokeAt === null) {
    // Zs grow and fade as they drift up and to the right: the plainest "asleep" sign there is.
    for (let i = 0; i < 3; i++) {
      const p = (ambient * 0.3 + i / 3) % 1;
      const alpha = Math.min(1, p * 5) * (1 - p);
      grid.big(head.col + 2 + p * 7, head.row - 2 - p * 6, "Z", ink(alpha), 1.4 + p * 1.4);
    }
  } else if (!awake) {
    grid.big(head.col, head.row - 3, "!", ink(), 2.4);
  }

  // Butterflies loop around the log, flapping a few times a second.
  BUTTERFLY_COLORS.forEach((color, i) => {
    const phase = i * 2.1;
    const col = at.col + 26 * Math.sin(ambient * (0.35 + i * 0.08) + phase);
    const row = at.row - 3 + 4 * Math.sin(ambient * (0.6 + i * 0.1) + phase * 1.7);
    grid.art(col, row, [BUTTERFLY[Math.floor(ambient * 5 + i) % 2]], color);
  });

  const hint = wokeAt === null ? " press any key to wake up " : " awake ";
  grid.art(Math.floor((grid.cols - hint.length) / 2), grid.rows - 3, [hint], ink(0.65 + 0.25 * Math.sin(ambient * 2)));
}
