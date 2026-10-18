import type { Grid } from "./grid";

// Both pieces of art share a width and height so the scene doesn't shift when the figure wakes.
const ASLEEP = [
  "",
  "",
  "        .--.",
  "       ( -.-)_______/\\______",
  "   _____`--'_______/__\\_____)___",
  "  /@\\                           \\",
  "  \\@/___________________________/",
];
const AWAKE = [
  "",
  "",
  "        (o)",
  "        /|\\",
  "   _____/_\\_____________________",
  "  /@\\                           \\",
  "  \\@/___________________________/",
];
const WIDTH = ASLEEP[6].length;
const HEAD = { col: 9, row: 3 }; // the sleeper's face, inside ASLEEP
const WAKE_SECONDS = 0.9; // how long the "!" shows before the figure stands

const BUTTERFLIES = [
  { rx: 16, ry: 2, wx: 0.45, wy: 0.9, phase: 0 },
  { rx: 11, ry: 2.5, wx: 0.6, wy: 0.7, phase: 2.1 },
  { rx: 20, ry: 2, wx: 0.35, wy: 1.1, phase: 4.2 },
];

const fade = (alpha: number) => `rgba(17, 17, 17, ${alpha.toFixed(2)})`;
// Stable per-column noise, so the same columns always have grass.
const noise = (x: number) => {
  const s = Math.sin(x * 127.1) * 43758.5453;
  return s - Math.floor(s);
};

function grass(grid: Grid, row: number, t: number) {
  for (let x = 0; x < grid.cols; x++) {
    const sway = Math.sin(x * 0.35 - t * 1.8 + Math.sin(x * 0.1));
    if (noise(x) > 0.4) grid.put(x, row, sway > 0.35 ? "/" : sway < -0.35 ? "\\" : "|");
    const low = Math.sin(x * 0.5 - t * 1.4 + 1);
    if (noise(x + 500) > 0.55) grid.put(x, row + 1, low > 0 ? "," : "'");
  }
}

/** `now` is real seconds (drives waking); `ambient` is the clock for motion, frozen under reduced motion. */
export function drawIntro(grid: Grid, now: number, ambient: number, wokeAt: number | null) {
  const left = Math.floor((grid.cols - WIDTH) / 2);
  const top = Math.floor((grid.rows - ASLEEP.length) / 2);
  const head = { col: left + HEAD.col, row: top + HEAD.row };
  const standing = wokeAt !== null && now - wokeAt >= WAKE_SECONDS;

  grid.art(left, top, standing ? AWAKE : ASLEEP);
  grass(grid, top + ASLEEP.length, ambient);

  if (wokeAt === null) {
    for (let i = 0; i < 3; i++) {
      const p = (ambient * 0.35 + i / 3) % 1;
      grid.put(head.col + 3 + p * 6, head.row - 1 - p * 4, p < 0.5 ? "z" : "Z", fade(1 - p));
    }
  } else if (!standing) {
    grid.put(head.col, head.row - 2, "!");
  }

  const cx = left + WIDTH / 2;
  for (const b of BUTTERFLIES) {
    const x = cx + b.rx * Math.sin(ambient * b.wx + b.phase);
    const y = top + b.ry * Math.sin(ambient * b.wy + b.phase * 1.7);
    grid.put(x, y, Math.floor(ambient * 6 + b.phase) % 2 ? "}{" : "><");
  }

  const hint = wokeAt === null ? "press any key" : "awake";
  grid.put((grid.cols - hint.length) / 2, top + ASLEEP.length + 4, hint, fade(0.45 + 0.25 * Math.sin(ambient * 2)));
}
