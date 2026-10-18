import type { Grid } from "./grid";

// World coordinates are cells, origin at the log. Cells are about twice as tall as wide,
// so round shapes scale y by 2.

const hash = (x: number, y: number) => {
  const s = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return s - Math.floor(s);
};

function noise(x: number, y: number) {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const fx = x - xi;
  const fy = y - yi;
  const u = fx * fx * (3 - 2 * fx);
  const v = fy * fy * (3 - 2 * fy);
  const top = hash(xi, yi) + (hash(xi + 1, yi) - hash(xi, yi)) * u;
  const bottom = hash(xi, yi + 1) + (hash(xi + 1, yi + 1) - hash(xi, yi + 1)) * u;
  return top + (bottom - top) * v;
}

const fbm = (x: number, y: number) => noise(x, y) * 0.6 + noise(x * 2.1, y * 2.1) * 0.3 + noise(x * 4.3, y * 4.3) * 0.1;

// Light to dark, so higher density reads as deeper shade.
const CANOPY_CHARS = ":;=+o*%$&Q@";
const CANOPY = ["#b4c2b6", "#93a798", "#748c7b", "#5a7262", "#43594a", "#2f4236"];
const WATER = ["#9fb2c4", "#7590a8", "#55718c"];
const GRASS = ["#b3c0b6", "#9aab9d"];
const SCATTER = "#c7cec9";

const streamCentre = (x: number) => 13 + 3 * Math.sin(x * 0.07) + 1.5 * Math.sin(x * 0.023 + 1);
const streamHalfWidth = (x: number) => 2.2 + 0.6 * Math.sin(x * 0.05);
// The clearing around the log stays free of trees.
const inClearing = (x: number, y: number, margin: number) => (x / (34 + margin)) ** 2 + (y / (9 + margin / 2)) ** 2 < 1;

type Tree = { x: number; y: number; r: number } | null;
const TREE_SX = 16;
const TREE_SY = 8;
const trees = new Map<number, Tree>();

function treeAt(i: number, j: number): Tree {
  const key = i * 100003 + j;
  if (trees.has(key)) return trees.get(key)!;
  let tree: Tree = null;
  if (hash(i, j) > 0.4) {
    const x = i * TREE_SX + (hash(i + 0.3, j) - 0.5) * TREE_SX * 0.7;
    const y = j * TREE_SY + (hash(i, j + 0.7) - 0.5) * TREE_SY * 0.7;
    const r = 6 + hash(i + 0.5, j + 0.5) * 6;
    const nearStream = Math.abs(y - streamCentre(x)) < streamHalfWidth(x) + r / 2 + 1;
    if (!inClearing(x, y, r) && !nearStream) tree = { x, y, r };
  }
  trees.set(key, tree);
  return tree;
}

/** Canopy shade at a cell: 0 for none, otherwise roughly 0.3 (lit edge) to 1.3 (deep shadow). */
function canopy(x: number, y: number, t: number) {
  const i = Math.round(x / TREE_SX);
  const j = Math.round(y / TREE_SY);
  let best = -1;
  let shade = 0;
  for (let di = -1; di <= 1; di++) {
    for (let dj = -1; dj <= 1; dj++) {
      const tree = treeAt(i + di, j + dj);
      if (!tree) continue;
      const dx = (x - tree.x) / tree.r;
      const dy = ((y - tree.y) * 2) / tree.r;
      const d = 1 - Math.sqrt(dx * dx + dy * dy);
      if (d > best) {
        best = d;
        // Light from the top-left: the far side of each crown sits in shadow.
        shade = 0.75 + (dx + dy) * 0.25;
      }
    }
  }
  // Wind: the leaf texture drifts and ripples, so crowns shimmer and their edges move.
  const leaves = fbm(x * 0.25 + Math.sin(t * 0.7 + y * 0.1) * 0.6, y * 0.5 + t * 0.15);
  if (best + (leaves - 0.5) * 0.5 <= 0.04) return 0;
  return shade + (leaves - 0.5) * 0.6;
}

const pick = <T>(list: T[] | string, v: number) => list[Math.max(0, Math.min(list.length - 1, Math.floor(v * list.length)))];

/** What one world cell looks like at time t, or null for bare ground. */
export function terrainAt(x: number, y: number, t: number): [string, string] | null {
  const c = canopy(x, y, t);
  if (c > 0) return [pick(CANOPY_CHARS, c / 1.3) as string, pick(CANOPY, c / 1.3) as string];

  const fromStream = Math.abs(y - streamCentre(x)) / streamHalfWidth(x);
  if (fromStream < 1) {
    const flow = noise(x * 0.3 - t * 3, y * 0.8);
    const char = flow > 0.62 ? "~" : flow > 0.45 ? "-" : flow > 0.35 ? "=" : null;
    return char && [char, pick(WATER, 1 - fromStream) as string];
  }
  if (fromStream < 1.5) return hash(x, y) > 0.6 ? [".", SCATTER] : null;

  if (fbm(x * 0.08, y * 0.16) > 0.64 && hash(x, y) > 0.55) {
    const sway = Math.sin(x * 0.45 + y * 0.9 - t * 2.2);
    return [sway > 0.4 ? "/" : sway < -0.4 ? "\\" : "|", pick(GRASS, hash(y, x)) as string];
  }
  const h = hash(x, y);
  return h > 0.985 ? [h > 0.995 ? "Q" : h > 0.99 ? "o" : ".", SCATTER] : null;
}

/** Fill the screen with terrain, with world cell (camX, camY) at the centre. */
export function drawTerrain(grid: Grid, camX: number, camY: number, t: number) {
  const left = Math.round(camX) - Math.floor(grid.cols / 2);
  const top = Math.round(camY) - Math.floor(grid.rows / 2);
  for (let row = 0; row < grid.rows; row++) {
    for (let col = 0; col < grid.cols; col++) {
      const cell = terrainAt(left + col, top + row, t);
      if (cell) grid.put(col, row, cell[0], cell[1]);
    }
  }
}
