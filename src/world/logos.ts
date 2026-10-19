import * as THREE from "three";

// Company and project logos as flat 3D signs floating over the meadow, converted to ASCII like everything
// else (docs/look.md). Each image's background is keyed out, and colours too dark to read on night navy are
// lifted (dark greys become the light ink, dark brand colours are mixed toward white, keeping their hue).

type Logo = { src: string; at: [number, number]; width: number };

const LOGOS: Logo[] = [
  { src: "/logos/finaldose.png", at: [-1, 12], width: 22 }, // south of the log: kept out of the title card's view
  { src: "/logos/uoft.jpg", at: [-29, -6], width: 24 },
  { src: "/logos/beau.png", at: [27, -6], width: 14 },
  { src: "/logos/sprout.png", at: [-28, 26], width: 10 }, // guess: Lazarus
  { src: "/logos/chevron.png", at: [30, 28], width: 9 }, // guess: Projectory
];

const LIFT = 0.5; // the darkest a logo colour may be (0-1 luminance), so it reads as glyphs on navy
const INK = [216, 222, 234];

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
  let [x0, y0, x1, y1] = [canvas.width, canvas.height, 0, 0];
  for (let i = 0; i < d.length; i += 4) {
    const far = Math.hypot(d[i] - bg[0], d[i + 1] - bg[1], d[i + 2] - bg[2]);
    d[i + 3] = Math.min(d[i + 3], 255 * THREE.MathUtils.smoothstep(far, 40, 90));
    if (d[i + 3] < 128) continue;
    const p = i / 4;
    [x0, y0, x1, y1] = [Math.min(x0, p % canvas.width), Math.min(y0, Math.floor(p / canvas.width)), Math.max(x1, p % canvas.width), Math.max(y1, Math.floor(p / canvas.width))];
    const lum = (0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]) / 255;
    if (lum >= LIFT) continue;
    const grey = Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2]) < 40;
    const toward = (LIFT - lum) / (1 - lum); // mixing toward white keeps the hue; scaling up oversaturated it
    for (let c = 0; c < 3; c++) d[i + c] = grey ? INK[c] : d[i + c] + (255 - d[i + c]) * toward;
  }
  ctx.putImageData(image, 0, 0);
  const out = document.createElement("canvas");
  out.width = x1 - x0 + 1;
  out.height = y1 - y0 + 1;
  out.getContext("2d")!.drawImage(canvas, -x0, -y0);
  return out;
}

/** Adds the logos to `scene`; each appears once its image has loaded. */
export function createLogos(scene: THREE.Scene) {
  for (const logo of LOGOS) {
    const img = new Image();
    img.onload = () => {
      const art = keyed(img);
      const height = (logo.width * art.height) / art.width;
      const texture = new THREE.CanvasTexture(art);
      texture.colorSpace = THREE.SRGBColorSpace;
      const sign = new THREE.Mesh(
        new THREE.PlaneGeometry(logo.width, height),
        new THREE.MeshBasicMaterial({ map: texture, alphaTest: 0.5 }),
      );
      // Tilted back to face the camera (which looks down at 45°), floating clear of the grass.
      sign.rotation.x = -Math.PI / 4;
      sign.position.set(logo.at[0], 2.2 + height * 0.35, logo.at[1]);
      sign.castShadow = true;
      scene.add(sign);
    };
    img.src = logo.src;
  }
}
