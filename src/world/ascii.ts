import type { Grid } from "./grid";
import { SUPERSAMPLE } from "./scene3d";

// Light mode: darker spots get denser characters; white stays empty. Each band holds several glyphs
// of similar weight, mixed per cell, so solid masses look textured instead of one repeated letter.
const BANDS = [[" "], [".", ","], [":", ";", "'", "."], ["-", "=", "+", "~"], ["*", "o", "c", "x", "+"], ["%", "#", "w", "0", "a"], ["$", "&", "8", "Q", "@", "N", "M", "0"]];
const EDGE = 0.6; // gradient strength that turns a cell into a stroke
// Ink keeps each spot's hue but is darkened and saturated, so pale greens read as green on white.
const INK_LIGHTNESS = 0.22;
const INK_SATURATE = 1;

// Well-mixed per-cell hash; plain multiplies leave the low bits periodic and the glyphs repeat in stripes.
function cellHash(col: number, row: number) {
  let h = Math.imul(col, 0x27d4eb2d) ^ Math.imul(row, 0x165667b1);
  h = Math.imul(h ^ (h >>> 15), 0x2c1b3c6d);
  return (h ^ (h >>> 12)) >>> 0;
}

let lum = new Float32Array(0);
let rgb = new Float32Array(0);
const colorCache = new Map<number, string>();


function ink(r: number, g: number, b: number) {
  // 5 bits per channel keeps the cache small without visible banding.
  const key = (Math.round(r * 31) << 10) | (Math.round(g * 31) << 5) | Math.round(b * 31);
  let s = colorCache.get(key);
  if (!s) {
    const l = 0.299 * r + 0.587 * g + 0.114 * b;
    const out = [r, g, b].map((v) => {
      const sat = l + (v - l) * INK_SATURATE;
      return Math.round(Math.min(1, Math.max(0, (sat * (INK_LIGHTNESS + 0.2 * (1 - l))) / Math.max(l, 0.05))) * 255);
    });
    s = `rgb(${out.join(",")})`;
    colorCache.set(key, s);
  }
  return s;
}

/** Turn a rendered frame into characters on the grid: brightness picks density, edges become strokes. */
export function drawAscii(grid: Grid, frame: { pixels: Uint8Array; width: number; height: number }) {
  const { cols, rows } = grid;
  const { pixels, width } = frame;
  if (lum.length !== cols * rows) {
    lum = new Float32Array(cols * rows);
    rgb = new Float32Array(cols * rows * 3);
  }

  // Average each cell's block of pixels. WebGL rows run bottom-up, so flip.
  const n = SUPERSAMPLE * SUPERSAMPLE;
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      let r = 0;
      let g = 0;
      let b = 0;
      for (let dy = 0; dy < SUPERSAMPLE; dy++) {
        const py = frame.height - 1 - (row * SUPERSAMPLE + dy);
        for (let dx = 0; dx < SUPERSAMPLE; dx++) {
          const i = (py * width + col * SUPERSAMPLE + dx) * 4;
          r += pixels[i];
          g += pixels[i + 1];
          b += pixels[i + 2];
        }
      }
      const c = row * cols + col;
      rgb[c * 3] = r / n / 255;
      rgb[c * 3 + 1] = g / n / 255;
      rgb[c * 3 + 2] = b / n / 255;
      lum[c] = 0.299 * rgb[c * 3] + 0.587 * rgb[c * 3 + 1] + 0.114 * rgb[c * 3 + 2];
    }
  }

  const at = (col: number, row: number) =>
    lum[Math.min(rows - 1, Math.max(0, row)) * cols + Math.min(cols - 1, Math.max(0, col))];

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const c = row * cols + col;
      const density = 1 - lum[c];
      if (density < 0.07) continue;

      // Sobel: strong brightness changes draw as strokes along the edge, like pen line work.
      const gx = at(col + 1, row - 1) + 2 * at(col + 1, row) + at(col + 1, row + 1) - at(col - 1, row - 1) - 2 * at(col - 1, row) - at(col - 1, row + 1);
      const gy = at(col - 1, row + 1) + 2 * at(col, row + 1) + at(col + 1, row + 1) - at(col - 1, row - 1) - 2 * at(col, row - 1) - at(col + 1, row - 1);
      let char: string;
      if (density > 0.2 && Math.hypot(gx, gy) > EDGE) {
        // The stroke runs perpendicular to the gradient. Screen y points down.
        const angle = ((Math.atan2(gy, gx) * 180) / Math.PI + 180) % 180;
        char = angle < 22.5 || angle >= 157.5 ? "|" : angle < 67.5 ? "\\" : angle < 112.5 ? "-" : "/";
      } else {
        const band = BANDS[Math.min(BANDS.length - 1, Math.floor(density * BANDS.length))];
        char = band[cellHash(col, row) % band.length];
      }
      grid.put(col, row, char, ink(rgb[c * 3], rgb[c * 3 + 1], rgb[c * 3 + 2]));
    }
  }
}
