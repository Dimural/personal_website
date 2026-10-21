import * as THREE from "three";

// Company and project logos laid flat in the meadow like mosaics, walkable like the grass, converted to ASCII like everything
// else (docs/look.md). Each image's background is keyed out, and colours too dark to read on night navy are
// lifted (dark greys become the light ink, dark brand colours are mixed toward white, keeping their hue).

// `bold`: thicken strokes by this fraction of the image's width, for logos whose lines are thinner than a cell.
type Logo = { src: string; at: [number, number]; width: number; bold?: number };

// All in the south of the meadow (z > 16): out of the title card's view, which ends near z 6 at any window
// width, and clear of the groves and the pond. Staggered north/south so neighbours never touch.
export const LOGOS: Logo[] = [
  { src: "/logos/uoft.jpg", at: [-34, 30], width: 15, bold: 0.006 },
  { src: "/logos/morphace.png", at: [-17, 34], width: 14, bold: 0.008 },
  { src: "/logos/finaldose.png", at: [0, 30], width: 15 },
  { src: "/logos/cibc.jpg", at: [17, 34], width: 13 },
  { src: "/logos/beau.png", at: [34, 30], width: 9 },
];

const LIFT = 0.65; // colours darker than this (0-1 luminance) are lifted, so they read as glyphs on navy…
const FLOOR = 0.35; // …into FLOOR..LIFT, keeping their order: two dark shades stay two shades (CIBC's chevron)
const INK = [216, 222, 234];

/**
 * No grass on a logo or just around it, so no blade ever covers it. The south margin is wider: the camera
 * looks down from the south, so a blade there stands up over the logo's near edge. The logo's depth is
 * guessed generously from its width.
 */
export function inClearing(x: number, z: number, pad = 0) {
  return LOGOS.some(({ at, width }) => {
    const depth = width * 0.55; // the deepest logo (UofT, ~2.8:1, stretched by √2) is ~0.5 × its width
    return Math.abs(x - at[0]) < width / 2 + 0.8 + pad && z > at[1] - depth / 2 - 0.6 - pad && z < at[1] + depth / 2 + 1.4 + pad;
  });
}

/** The image with its background keyed out, dark colours lifted, cropped to what's left. */
function keyed(img: HTMLImageElement) {
  const canvas = document.createElement("canvas");
  canvas.width = img.naturalWidth;
  canvas.height = img.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = image.data;
  const bg = [d[0], d[1], d[2]]; // the top-left corner is background in every logo
  const far = (i: number) => Math.hypot(d[i] - bg[0], d[i + 1] - bg[1], d[i + 2] - bg[2]);
  const [w, h] = [canvas.width, canvas.height];
  let [x0, y0, x1, y1] = [w, h, 0, 0];
  for (let i = 0; i < d.length; i += 4) {
    d[i + 3] = Math.min(d[i + 3], 255 * THREE.MathUtils.smoothstep(far(i), 40, 90));
    if (d[i + 3] < 128) continue;
    const p = i / 4;
    [x0, y0, x1, y1] = [Math.min(x0, p % canvas.width), Math.min(y0, Math.floor(p / canvas.width)), Math.max(x1, p % canvas.width), Math.max(y1, Math.floor(p / canvas.width))];
    const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
    if (lum >= LIFT) continue;
    const grey = Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) < 40;
    const target = FLOOR + (lum / LIFT) * (LIFT - FLOOR);
    const toward = (target - lum) / (1 - lum); // mixing toward white keeps the hue; scaling up oversaturated it
    for (let c = 0; c < 3; c++) d[i + c] = grey ? INK[c] : d[i + c] + (255 - d[i + c]) * toward;
  }
  ctx.putImageData(image, 0, 0);
  const out = document.createElement("canvas");
  out.width = x1 - x0 + 1;
  out.height = y1 - y0 + 1;
  out.getContext("2d")!.drawImage(canvas, -x0, -y0);
  return out;
}

/** The art with every stroke grown by `r` pixels: drawn again at each offset within a small disc. */
function bolden(art: HTMLCanvasElement, r: number) {
  const out = document.createElement("canvas");
  out.width = art.width + 2 * r;
  out.height = art.height + 2 * r;
  const ctx = out.getContext("2d")!;
  for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) if (dx * dx + dy * dy <= r * r) ctx.drawImage(art, r + dx, r + dy);
  return out;
}

/** Adds the logos to `scene`; each appears once its image has loaded. */
export function createLogos(scene: THREE.Scene) {
  for (const logo of LOGOS) {
    const img = new Image();
    img.onload = () => {
      const keyedArt = keyed(img);
      const art = logo.bold ? bolden(keyedArt, Math.max(1, Math.round(keyedArt.width * logo.bold))) : keyedArt;
      // Stretched along the ground by √2: the camera looks down at 45°, so the logo then reads undistorted.
      const height = ((logo.width * art.height) / art.width) * Math.SQRT2;
      const texture = new THREE.CanvasTexture(art);
      texture.colorSpace = THREE.SRGBColorSpace;
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(logo.width, height),
        new THREE.MeshBasicMaterial({ map: texture, alphaTest: 0.5 }),
      );
      // Flat on the ground, a hair above it: the walker and the rabbits cross it like any other ground.
      sign.rotation.x = -Math.PI / 2;
      sign.position.set(logo.at[0], 0.03, logo.at[1]);
      scene.add(sign);
    };
    img.src = logo.src;
  }
}
