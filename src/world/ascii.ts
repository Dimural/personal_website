import type { Grid } from "./grid";
import { SUPERSAMPLE } from "./scene3d";

type Frame = { pixels: Uint8Array; depth: Uint8Array; width: number; height: number; near: number; far: number };

// Light mode: darker spots get denser characters; white stays empty. Each band mixes a few glyphs of
// similar weight per cell so solid masses look textured, but few enough that shapes stay readable.
const BANDS = [[" "], ["."], [":", "."], ["-", "="], ["+", "*"], ["o", "%", "#"], ["&", "$", "@", "Q"]];
// Relative depth jump between neighbours that counts as one object's outline against what's behind it.
const OUTLINE = 0.35;
// Ink keeps each spot's hue, and its lightness follows the scene's: lit faces light, shadows dark.
const INK_MIN = 0.1;
const INK_RANGE = 0.5;
const OUTLINE_INK = 0.55; // outlines are this much darker than the surface they belong to

// Well-mixed per-cell hash; plain multiplies leave the low bits periodic and the glyphs repeat in stripes.
function cellHash(col: number, row: number) {
  let h = Math.imul(col, 0x27d4eb2d) ^ Math.imul(row, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  return (h ^ (h >>> 12)) >>> 0;
}

let lum = new Float32Array(0);
let rgb = new Float32Array(0);
let dist = new Float32Array(0);
const colorCache = new Map<number, string>();

function ink(r: number, g: number, b: number, scale: number) {
  const l = Math.max(0.299 * r + 0.587 * g + 0.114 * b, 0.02);
  const k = ((INK_MIN + INK_RANGE * l) * scale) / l;
  const out = [r, g, b].map((v) => Math.round(Math.min(1, v * k) * 31));
  // 5 bits per channel keeps the cache small without visible banding.
  const key = (out[0] << 10) | (out[1] << 5) | out[2];
  let s = colorCache.get(key);
  if (!s) {
    s = `rgb(${out.map((v) => Math.round((v / 31) * 255)).join(",")})`;
    colorCache.set(key, s);
  }
  return s;
}

/** Unpack three.js RGBADepthPacking (a is most significant) and turn it into distance from the camera. */
function linearDepth(d: Uint8Array, i: number, near: number, far: number) {
  const z = (255 / 256) * (d[i] / 255 / 16777216 + d[i + 1] / 255 / 65536 + d[i + 2] / 255 / 256 + d[i + 3] / 255);
  return (near * far) / (far - z * (far - near));
}

/** Turn a rendered frame into characters: brightness picks density, depth jumps become outlines. */
export function drawAscii(grid: Grid, frame: Frame) {
  const { cols, rows } = grid;
  const { pixels, depth, width, height, near, far } = frame;
  if (lum.length !== cols * rows) {
    lum = new Float32Array(cols * rows);
    rgb = new Float32Array(cols * rows * 3);
    dist = new Float32Array(cols * rows);
  }

  // Average each cell's block of pixels. WebGL rows run bottom-up, so flip.
  const n = SUPERSAMPLE * SUPERSAMPLE;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let nearest = far;
      for (let dy = 0; dy < SUPERSAMPLE; dy++) {
        const py = height - 1 - (row * SUPERSAMPLE + dy);
        for (let dx = 0; dx < SUPERSAMPLE; dx++) {
          const i = (py * width + col * SUPERSAMPLE + dx) * 4;
          r += pixels[i];
          g += pixels[i + 1];
          b += pixels[i + 2];
          nearest = Math.min(nearest, linearDepth(depth, i, near, far));
        }
      }
      const c = row * cols + col;
      rgb[c * 3] = r / n / 255;
      rgb[c * 3 + 1] = g / n / 255;
      rgb[c * 3 + 2] = b / n / 255;
      lum[c] = 0.299 * rgb[c * 3] + 0.587 * rgb[c * 3 + 1] + 0.114 * rgb[c * 3 + 2];
      dist[c] = nearest;
    }
  }

  const at = (col: number, row: number) =>
    dist[Math.min(rows - 1, Math.max(0, row)) * cols + Math.min(cols - 1, Math.max(0, col))];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const c = row * cols + col;
      const r = rgb[c * 3];
      const g = rgb[c * 3 + 1];
      const b = rgb[c * 3 + 2];

      // Sobel on depth, relative to this cell's distance: a big jump means a silhouette edge.
      const gx = at(col + 1, row - 1) + 2 * at(col + 1, row) + at(col + 1, row + 1) - at(col - 1, row - 1) - 2 * at(col - 1, row) - at(col - 1, row + 1);
      const gy = at(col - 1, row + 1) + 2 * at(col, row + 1) + at(col + 1, row + 1) - at(col - 1, row - 1) - 2 * at(col, row - 1) - at(col + 1, row - 1);
      // Only the nearer side of an edge draws the line, so outlines are one cell thick and hug the object.
      const nearerSide = dist[c] < (at(col - 1, row) + at(col + 1, row) + at(col, row - 1) + at(col, row + 1)) / 4;
      if (nearerSide && Math.hypot(gx, gy) / dist[c] > OUTLINE) {
        // The stroke runs perpendicular to the gradient. Screen y points down.
        const angle = ((Math.atan2(gy, gx) * 180) / Math.PI + 180) % 180;
        const char = angle < 22.5 || angle >= 157.5 ? "|" : angle < 67.5 ? "\\" : angle < 112.5 ? "_" : "/";
        grid.put(col, row, char, ink(r, g, b, OUTLINE_INK));
        continue;
      }

      const density = 1 - lum[c];
      if (density < 0.07) continue;
      const band = BANDS[Math.min(BANDS.length - 1, Math.floor(density * BANDS.length))];
      grid.put(col, row, band[cellHash(col, row) % band.length], ink(r, g, b, 1));
    }
  }
}
