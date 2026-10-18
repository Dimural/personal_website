import type { Grid } from "./grid";
import { drawTerrain } from "./terrain";

// All art is positioned relative to the scene's top-left; the log's middle sits on world origin.
const SCENE_W = 33;
const LOG = [
  "",
  "",
  "",
  "",
  "   _____________________________",
  "  /@\\                           \\",
  "  \\@/___________________________/",
];
const ASLEEP = [
  "",
  "",
  "        .--.",
  "       ( -.-)_______/\\______",
  "        `--'_______/__\\_____)",
];
const AWAKE = ["", "", "        (o)", "        /|\\", "        /_\\"];
const HEAD = { col: 9, row: 3 }; // the sleeper's face
const BARK_ROW = 5;
const WAKE_SECONDS = 0.9; // how long the "!" shows before the figure stands

const INK = [28, 34, 40];
const LOG_INK = "#4e3b2c";
const BARK = ["#7a604a", "#93785f"];
const BUTTERFLIES = [
  { rx: 16, ry: 2, wx: 0.45, wy: 0.9, phase: 0, color: "#b5835a" },
  { rx: 11, ry: 2.5, wx: 0.6, wy: 0.7, phase: 2.1, color: "#8d6a9f" },
  { rx: 20, ry: 2, wx: 0.35, wy: 1.1, phase: 4.2, color: "#5f8fa8" },
];

const ink = (alpha = 1) => `rgba(${INK.join(", ")}, ${alpha.toFixed(2)})`;

/** `now` is real seconds (drives waking); `ambient` is the clock for motion, frozen under reduced motion. */
export function drawIntro(grid: Grid, now: number, ambient: number, wokeAt: number | null) {
  drawTerrain(grid, 0, 0, ambient);

  const left = Math.floor(grid.cols / 2) - Math.floor(SCENE_W / 2);
  const top = Math.floor(grid.rows / 2) - BARK_ROW;
  const head = { col: left + HEAD.col, row: top + HEAD.row };
  const standing = wokeAt !== null && now - wokeAt >= WAKE_SECONDS;

  grid.art(left, top, LOG, LOG_INK);
  for (let x = 5; x < SCENE_W - 1; x++) {
    const grain = (x * 7) % 5;
    grid.put(left + x, top + BARK_ROW, grain < 2 ? "=" : grain < 4 ? "-" : "~", BARK[x % 3 ? 0 : 1]);
  }
  grid.art(left, top, standing ? AWAKE : ASLEEP, ink());

  if (wokeAt === null) {
    for (let i = 0; i < 3; i++) {
      const p = (ambient * 0.35 + i / 3) % 1;
      grid.put(head.col + 3 + p * 6, head.row - 1 - p * 4, p < 0.5 ? "z" : "Z", ink(1 - p));
    }
  } else if (!standing) {
    grid.art(head.col, head.row - 2, ["!"], ink());
  } else {
    const label = "dimural";
    grid.art(head.col - Math.floor(label.length / 2), head.row - 3, [label], ink(Math.min(1, (now - wokeAt - WAKE_SECONDS) * 2)));
  }

  const cx = left + SCENE_W / 2;
  for (const b of BUTTERFLIES) {
    const x = cx + b.rx * Math.sin(ambient * b.wx + b.phase);
    const y = top + b.ry * Math.sin(ambient * b.wy + b.phase * 1.7);
    grid.art(x, y, [Math.floor(ambient * 6 + b.phase) % 2 ? "}{" : "><"], b.color);
  }

  const hint = wokeAt === null ? " press any key " : " awake ";
  grid.art((grid.cols - hint.length) / 2, grid.rows - 3, [hint], ink(0.55 + 0.25 * Math.sin(ambient * 2)));
}
