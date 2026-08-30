import * as THREE from "three";
import type { Volume } from "./data";
import { drawMotif } from "./motifs";

const SERIF = '"Literata", "Iowan Old Style", Georgia, serif';
const MONO = '"IBM Plex Mono", ui-monospace, Menlo, monospace';

/** FNV-1a — small and stable across engines. */
export function hashSeed(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Mulberry32 — small, fast, and stable across engines. Every procedural
 * texture is seeded from this, never `Math.random()`, so a reload paints
 * pixel-identical books and screenshot comparison means something.
 */
export function seededRandom(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Zero-padded folio / index numbers. */
function pad(value: number) {
  return String(value).padStart(2, "0");
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext("2d")! };
}

/** Colour maps — cloth, paper, foil marks read visually. */
function finish(c: HTMLCanvasElement, repeat?: [number, number], anisotropy = 16) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = anisotropy;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

/**
 * Data maps — normal, roughness, bump/emboss — are never colour. Tagging one
 * `SRGBColorSpace` by mistake is a silent failure: cloth reads as plastic and
 * nothing in the render throws to tell you why.
 */
function finishData(c: HTMLCanvasElement, repeat?: [number, number], anisotropy = 16) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = anisotropy;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repeat[0], repeat[1]);
  }
  return t;
}

/** Book cloth: a flat ground with a fine woven tooth over it. */
function drawCloth(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  color: string,
  random: () => number,
) {
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, w, h);

  // Weave — two crossed sets of faint threads.
  ctx.globalAlpha = 0.045;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  for (let x = 0; x < w; x += 3) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.05;
  ctx.strokeStyle = "#000000";
  for (let y = 0; y < h; y += 3) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
    ctx.stroke();
  }

  // Uneven dye, so the cloth never reads as flat plastic.
  ctx.globalAlpha = 1;
  for (let i = 0; i < 900; i++) {
    const a = random() * 0.05;
    ctx.fillStyle = random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    const r = 2 + random() * 9;
    ctx.beginPath();
    ctx.arc(random() * w, random() * h, r, 0, Math.PI * 2);
    ctx.fill();
  }
}

/** Fit text to a maximum width by stepping the size down. */
function fitFont(
  ctx: CanvasRenderingContext2D,
  text: string,
  family: string,
  weight: string,
  start: number,
  maxWidth: number,
) {
  let size = start;
  do {
    ctx.font = `${weight} ${size}px ${family}`;
    size -= 1;
  } while (ctx.measureText(text).width > maxWidth && size > 8);
  return size;
}

/** A flat paper ground with fibre grain and flecks — shared by every leaf. */
function drawPaperSurface(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  random: () => number,
) {
  ctx.fillStyle = "#e8e1d3";
  ctx.fillRect(0, 0, w, h);

  const wash = ctx.createLinearGradient(0, 0, w, h);
  wash.addColorStop(0, "rgba(255,255,255,0.22)");
  wash.addColorStop(0.42, "rgba(255,255,255,0.035)");
  wash.addColorStop(1, "rgba(103,87,64,0.08)");
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, w, h);

  for (let i = 0; i < 2400; i++) {
    const x = random() * w;
    const y = random() * h;
    const length = 5 + random() * 34;
    const light = random() > 0.44;
    ctx.strokeStyle = light
      ? `rgba(255,255,255,${0.025 + random() * 0.045})`
      : `rgba(92,76,55,${0.018 + random() * 0.035})`;
    ctx.lineWidth = 0.45 + random() * 0.65;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(Math.min(w, x + length), y + (random() - 0.5) * 2.2);
    ctx.stroke();
  }

  for (let i = 0; i < 1200; i++) {
    const tone = Math.round(112 + random() * 94);
    ctx.fillStyle = `rgba(${tone},${tone - 5},${tone - 13},${0.016 + random() * 0.025})`;
    const size = 0.5 + random() * 1.1;
    ctx.fillRect(random() * w, random() * h, size, size);
  }
}

/** Word-wrap onto a canvas by character count, capped at `maxLines`. */
function drawWrappedCanvasText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxCharacters: number,
  lineHeight: number,
  maxLines = 6,
) {
  const words = text.split(/\s+/);
  let line = "";
  let lineIndex = 0;

  for (const word of words) {
    if (lineIndex >= maxLines) break;
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > maxCharacters && line) {
      ctx.fillText(line, x, y + lineIndex * lineHeight);
      line = word;
      lineIndex += 1;
    } else {
      line = candidate;
    }
  }
  if (line && lineIndex < maxLines) {
    ctx.fillText(line, x, y + lineIndex * lineHeight);
  }
}

// ── Cover ─────────────────────────────────────────────────────────

export function makeCoverTexture(v: Volume) {
  const W = 768;
  const H = 1152;
  const { c, ctx } = canvas(W, H);
  const random = seededRandom(hashSeed(`${v.id}-cover`) + v.seed);
  drawCloth(ctx, W, H, v.cloth, random);

  const edge = ctx.createLinearGradient(0, 0, W, 0);
  edge.addColorStop(0, "rgba(0,0,0,0.24)");
  edge.addColorStop(0.075, "rgba(255,255,255,0.035)");
  edge.addColorStop(0.5, "rgba(255,255,255,0.01)");
  edge.addColorStop(0.94, "rgba(0,0,0,0.06)");
  edge.addColorStop(1, "rgba(0,0,0,0.19)");
  ctx.fillStyle = edge;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 1250; i++) {
    const x = random() * W;
    const y = random() * H;
    const length = 4 + random() * 22;
    ctx.strokeStyle = random() > 0.5 ? "rgba(255,255,255,0.024)" : "rgba(0,0,0,0.025)";
    ctx.lineWidth = 0.6 + random() * 0.8;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + length, y + (random() - 0.5) * 2);
    ctx.stroke();
  }

  ctx.strokeStyle = v.foil;
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 42, W - 84, H - 84);
  ctx.strokeRect(55, 55, W - 110, H - 110);
  ctx.globalAlpha = 1;

  const motifSeed = hashSeed(`${v.id}-motif`) + v.seed;
  drawMotif(ctx, v.motifKey, v.foil, motifSeed, W, H);

  ctx.fillStyle = v.foil;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `400 18px ${MONO}`;
  ctx.letterSpacing = "4px";
  ctx.fillText(`EX LIBRIS  /  ${v.roman}`, W / 2, 92);
  ctx.letterSpacing = "0px";

  const titleStart = v.title.length > 10 ? 72 : 88;
  const titleSize = fitFont(ctx, v.title, SERIF, "500", titleStart, W - 160);
  ctx.font = `500 ${titleSize}px ${SERIF}`;
  ctx.fillText(v.title, W / 2, H * 0.72);

  ctx.font = `400 16px ${MONO}`;
  ctx.letterSpacing = "2px";
  ctx.fillText(v.discipline.toUpperCase(), W / 2, H * 0.79);
  ctx.letterSpacing = "0px";

  return finish(c);
}

/**
 * The foil map: a greyscale mask holding only the metal-stamped marks — same
 * rules, motif, and lettering as the cover, painted white on black. Drives
 * `alphaMap` and, through `makeEmbossMap`, `bumpMap`.
 */
export function makeFoilTexture(v: Volume) {
  const W = 768;
  const H = 1152;
  const { c, ctx } = canvas(W, H);

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.72;
  ctx.lineWidth = 2;
  ctx.strokeRect(42, 42, W - 84, H - 84);
  ctx.strokeRect(55, 55, W - 110, H - 110);
  ctx.globalAlpha = 1;

  const motifSeed = hashSeed(`${v.id}-motif`) + v.seed;
  drawMotif(ctx, v.motifKey, "#ffffff", motifSeed, W, H);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `400 18px ${MONO}`;
  ctx.letterSpacing = "4px";
  ctx.fillText(`EX LIBRIS  /  ${v.roman}`, W / 2, 92);
  ctx.letterSpacing = "0px";

  const titleStart = v.title.length > 10 ? 72 : 88;
  const titleSize = fitFont(ctx, v.title, SERIF, "500", titleStart, W - 160);
  ctx.font = `500 ${titleSize}px ${SERIF}`;
  ctx.fillText(v.title, W / 2, H * 0.72);

  ctx.font = `400 16px ${MONO}`;
  ctx.letterSpacing = "2px";
  ctx.fillText(v.discipline.toUpperCase(), W / 2, H * 0.79);
  ctx.letterSpacing = "0px";

  const t = finish(c);
  t.name = `${v.id}-cover-foil`;
  return t;
}

// ── Spine ─────────────────────────────────────────────────────────

export function makeSpineTexture(v: Volume) {
  const W = 384;
  const H = 1536;
  const { c, ctx } = canvas(W, H);
  const random = seededRandom(hashSeed(`${v.id}-spine-cloth`) + v.seed);
  drawCloth(ctx, W, H, v.cloth, random);

  const shade = ctx.createLinearGradient(0, 0, W, 0);
  shade.addColorStop(0, "rgba(0,0,0,0.2)");
  shade.addColorStop(0.14, "rgba(255,255,255,0.055)");
  shade.addColorStop(0.62, "rgba(255,255,255,0.012)");
  shade.addColorStop(1, "rgba(0,0,0,0.16)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 1900; i++) {
    const x = random() * W;
    const y = random() * H;
    const vertical = random() > 0.42;
    ctx.strokeStyle = random() > 0.5
      ? `rgba(255,255,255,${0.018 + random() * 0.038})`
      : `rgba(0,0,0,${0.018 + random() * 0.032})`;
    ctx.lineWidth = 0.45 + random() * 0.7;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(
      vertical ? x + (random() - 0.5) * 1.2 : x + 8 + random() * 28,
      vertical ? y + 8 + random() * 34 : y + (random() - 0.5) * 1.2,
    );
    ctx.stroke();
  }

  const bottomShade = ctx.createLinearGradient(0, H * 0.82, 0, H);
  bottomShade.addColorStop(0, "rgba(0,0,0,0)");
  bottomShade.addColorStop(1, "rgba(0,0,0,0.12)");
  ctx.fillStyle = bottomShade;
  ctx.fillRect(0, 0, W, H);

  return finish(c);
}

export function makeSpineFoilTexture(v: Volume) {
  const W = 384;
  const H = 1536;
  const { c, ctx } = canvas(W, H);

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = "#ffffff";
  ctx.fillStyle = "#ffffff";
  ctx.lineWidth = 2.4;
  ctx.strokeRect(34, 38, W - 68, H - 76);

  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = `400 24px ${MONO}`;
  ctx.letterSpacing = "5px";
  ctx.fillText(v.roman, W * 0.5, 118);
  ctx.letterSpacing = "0px";

  ctx.save();
  ctx.translate(W * 0.5, H * 0.5);
  ctx.rotate(Math.PI / 2);
  const titleStart = v.title.length > 10 ? 58 : 68;
  const titleSize = fitFont(ctx, v.title, SERIF, "500", titleStart, H - 340);
  ctx.font = `500 ${titleSize}px ${SERIF}`;
  ctx.fillText(v.title, 0, 0);
  ctx.restore();

  // A small stamped seal below the title — a ring bisected by a rule.
  ctx.beginPath();
  ctx.arc(W * 0.5, H - 120, 24, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(W * 0.5 - 24, H - 120);
  ctx.lineTo(W * 0.5 + 24, H - 120);
  ctx.stroke();

  const t = finish(c);
  t.name = `${v.id}-spine-foil`;
  return t;
}

// ── Back cover ────────────────────────────────────────────────────

export function makeBackCoverTexture(v: Volume) {
  const W = 768;
  const H = 1152;
  const { c, ctx } = canvas(W, H);
  const random = seededRandom(hashSeed(`${v.id}-back-cloth`) + v.seed);
  drawCloth(ctx, W, H, v.cloth, random);

  const edgeShade = ctx.createLinearGradient(0, 0, W, 0);
  edgeShade.addColorStop(0, "rgba(0,0,0,0.15)");
  edgeShade.addColorStop(0.05, "rgba(255,255,255,0.028)");
  edgeShade.addColorStop(0.84, "rgba(255,255,255,0)");
  edgeShade.addColorStop(1, "rgba(0,0,0,0.11)");
  ctx.fillStyle = edgeShade;
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 2600; i++) {
    const x = random() * W;
    const y = random() * H;
    const length = 5 + random() * 30;
    ctx.strokeStyle = random() > 0.5
      ? `rgba(255,255,255,${0.018 + random() * 0.03})`
      : `rgba(0,0,0,${0.016 + random() * 0.028})`;
    ctx.lineWidth = 0.45 + random() * 0.65;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + length, y + (random() - 0.5) * 1.5);
    ctx.stroke();
  }

  const vignette = ctx.createRadialGradient(W * 0.62, H * 0.38, 20, W * 0.62, H * 0.38, W * 0.75);
  vignette.addColorStop(0, "rgba(255,255,255,0.03)");
  vignette.addColorStop(1, "rgba(0,0,0,0.09)");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  return finish(c);
}

export function makeBackFoilTexture(v: Volume) {
  const W = 768;
  const H = 1152;
  const { c, ctx } = canvas(W, H);

  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = "#ffffff";
  ctx.strokeStyle = "#ffffff";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";

  ctx.font = `400 16px ${MONO}`;
  ctx.letterSpacing = "3px";
  ctx.fillText(`EX LIBRIS  /  ${v.roman}`, 68, 82);
  ctx.letterSpacing = "0px";
  ctx.globalAlpha = 0.72;
  ctx.fillRect(68, 108, 176, 2);
  ctx.globalAlpha = 1;

  ctx.lineWidth = 1.5;
  for (let ring = 0; ring < 5; ring++) {
    ctx.globalAlpha = 0.24 - ring * 0.032;
    ctx.beginPath();
    ctx.arc(548, 374, 74 + ring * 38, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.beginPath();
  ctx.moveTo(348, 374);
  ctx.lineTo(704, 374);
  ctx.moveTo(548, 174);
  ctx.lineTo(548, 574);
  ctx.stroke();

  const titleStart = v.title.length > 10 ? 52 : 62;
  const titleSize = fitFont(ctx, v.title, SERIF, "500", titleStart, 632);
  ctx.font = `500 ${titleSize}px ${SERIF}`;
  ctx.fillText(v.title, 68, 956);

  ctx.font = `400 15px ${MONO}`;
  ctx.letterSpacing = "2.6px";
  ctx.fillText(v.discipline.toUpperCase(), 70, 1004);
  ctx.letterSpacing = "0px";

  ctx.globalAlpha = 0.68;
  ctx.fillRect(68, 1040, 632, 1.5);
  ctx.globalAlpha = 1;
  ctx.textAlign = "right";
  ctx.fillText("AN IMAGINED EDITION", 700, 1080);

  const t = finish(c);
  t.name = `${v.id}-back-foil`;
  return t;
}

// ── Cloth surface data ───────────────────────────────────────────

export function makeClothBumpTexture(v: Volume) {
  const size = 256;
  const { c, ctx } = canvas(size, size);
  const random = seededRandom(hashSeed(`${v.id}-cloth`) + v.seed);

  ctx.fillStyle = "#7f7f7f";
  ctx.fillRect(0, 0, size, size);

  for (let line = 0; line < size; line += 2) {
    const value = Math.round(98 + random() * 70);
    ctx.strokeStyle = `rgb(${value},${value},${value})`;
    ctx.globalAlpha = 0.34 + random() * 0.18;
    ctx.lineWidth = 0.65 + random() * 0.45;
    ctx.beginPath();
    ctx.moveTo(0, line + (random() - 0.5));
    ctx.lineTo(size, line + (random() - 0.5));
    ctx.stroke();
  }

  for (let line = 1; line < size; line += 3) {
    const value = Math.round(105 + random() * 58);
    ctx.strokeStyle = `rgb(${value},${value},${value})`;
    ctx.globalAlpha = 0.25 + random() * 0.14;
    ctx.lineWidth = 0.55 + random() * 0.35;
    ctx.beginPath();
    ctx.moveTo(line + (random() - 0.5), 0);
    ctx.lineTo(line + (random() - 0.5), size);
    ctx.stroke();
  }

  ctx.globalAlpha = 1;
  const t = finishData(c, [5, 8], 12);
  t.name = `${v.id}-cloth-bump`;
  return t;
}

/**
 * A crossed-weave height field, differentiated into a tangent-space normal
 * map (central differences) and a matching roughness map.
 */
export function makeClothSurfaceMaps(v: Volume) {
  const size = 256;
  const heightField = new Float32Array(size * size);
  const { c: normalCanvas, ctx: normalCtx } = canvas(size, size);
  const { c: roughCanvas, ctx: roughCtx } = canvas(size, size);
  const normalImage = normalCtx.createImageData(size, size);
  const roughImage = roughCtx.createImageData(size, size);
  const phase = (v.seed % 19) * 0.23;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const warp = Math.sin((x + phase) * Math.PI * 0.52);
      const weft = Math.sin((y - phase) * Math.PI * 0.41);
      const cross = Math.sin((x + y + phase) * Math.PI * 0.19);
      heightField[y * size + x] = 0.5 + warp * 0.18 + weft * 0.15 + cross * 0.045;
    }
  }

  const sampleHeight = (x: number, y: number) => {
    const wrappedX = (x + size) % size;
    const wrappedY = (y + size) % size;
    return heightField[wrappedY * size + wrappedX];
  };

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = y * size + x;
      const pixel = index * 4;
      const dx = (sampleHeight(x + 1, y) - sampleHeight(x - 1, y)) * 1.5;
      const dy = (sampleHeight(x, y + 1) - sampleHeight(x, y - 1)) * 1.5;
      const length = Math.hypot(dx, dy, 1);
      normalImage.data[pixel] = Math.round(((-dx / length) * 0.5 + 0.5) * 255);
      normalImage.data[pixel + 1] = Math.round(((-dy / length) * 0.5 + 0.5) * 255);
      normalImage.data[pixel + 2] = Math.round(((1 / length) * 0.5 + 0.5) * 255);
      normalImage.data[pixel + 3] = 255;

      const roughness = Math.round(188 + heightField[index] * 56);
      roughImage.data[pixel] = roughness;
      roughImage.data[pixel + 1] = roughness;
      roughImage.data[pixel + 2] = roughness;
      roughImage.data[pixel + 3] = 255;
    }
  }

  normalCtx.putImageData(normalImage, 0, 0);
  roughCtx.putImageData(roughImage, 0, 0);

  const normal = finishData(normalCanvas, [5, 8], 12);
  normal.name = `${v.id}-cloth-normal`;
  const roughness = finishData(roughCanvas, [5, 8], 12);
  roughness.name = `${v.id}-cloth-roughness`;

  return { normal, roughness };
}

/** Recasts a colour texture's canvas as a data map, for use as `bumpMap`. */
export function makeEmbossMap(source: THREE.Texture, name: string) {
  const image = source.image as HTMLCanvasElement;
  const t = new THREE.CanvasTexture(image);
  t.name = name;
  t.wrapS = source.wrapS;
  t.wrapT = source.wrapT;
  t.repeat.copy(source.repeat);
  t.offset.copy(source.offset);
  t.center.copy(source.center);
  t.rotation = source.rotation;
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = 16;
  return t;
}

// ── Paper and interior pages ─────────────────────────────────────

let sharedPaperFaceTexture: THREE.Texture | null = null;

/** Blank paper stock, shared across every volume; `printed` stamps a title block. */
export function makePaperFaceTexture(v: Volume, printed = false) {
  if (!printed && sharedPaperFaceTexture) return sharedPaperFaceTexture;

  const W = 768;
  const H = 1152;
  const { c, ctx } = canvas(W, H);
  const random = seededRandom(
    printed ? hashSeed(`${v.id}-printed-page`) + v.seed : hashSeed("library-paper-stock"),
  );
  drawPaperSurface(ctx, W, H, random);

  if (printed) {
    const ink = new THREE.Color(v.palette.ink);
    const r = Math.round(ink.r * 255);
    const g = Math.round(ink.g * 255);
    const b = Math.round(ink.b * 255);
    ctx.fillStyle = `rgba(${r},${g},${b},0.2)`;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";
    ctx.font = `400 15px ${MONO}`;
    ctx.letterSpacing = "2px";
    ctx.fillText(v.title.toUpperCase(), 84, 98);
    ctx.letterSpacing = "0px";
    ctx.fillRect(84, 121, 190, 2);

    for (let column = 0; column < 2; column++) {
      const left = 84 + column * 316;
      for (let line = 0; line < 34; line++) {
        const y = 184 + line * 23;
        const lastInParagraph = line % 7 === 6;
        const lineWidth = lastInParagraph ? 108 + random() * 86 : 190 + random() * 72;
        ctx.globalAlpha = 0.22 + random() * 0.11;
        ctx.fillRect(left, y, lineWidth, 1.45);
      }
    }

    ctx.globalAlpha = 0.32;
    ctx.font = `400 17px ${SERIF}`;
    ctx.fillText(v.roman, W - 104, H - 72);
    ctx.globalAlpha = 1;
  }

  const t = finish(c);
  if (!printed) sharedPaperFaceTexture = t;
  return t;
}

export function makeEndpaperTexture(v: Volume) {
  const W = 512;
  const H = 768;
  const { c, ctx } = canvas(W, H);
  const random = seededRandom(hashSeed(`${v.id}-endpaper`) + v.seed);
  drawPaperSurface(ctx, W, H, random);

  ctx.save();
  ctx.fillStyle = v.cloth;
  ctx.globalAlpha = 0.14;
  ctx.fillRect(0, 0, W, H);
  ctx.globalAlpha = 0.18;
  ctx.strokeStyle = v.foil;
  ctx.lineWidth = 1;
  for (let x = 28; x < W; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, H);
    ctx.stroke();
  }
  for (let y = 24; y < H; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(W, y);
    ctx.stroke();
  }
  ctx.globalAlpha = 0.42;
  const motifSeed = hashSeed(`${v.id}-endpaper-motif`) + v.seed;
  drawMotif(ctx, v.motifKey, v.palette.inkSoft, motifSeed, W, H);
  ctx.restore();

  const t = finish(c, undefined, 16);
  t.name = `${v.id}-endpaper`;
  return t;
}

/**
 * The eight interior leaves, drawn from the volume's real data — title page,
 * two chapters, a plate, notes, a colophon, and an imprint. Two of the six
 * volumes have only two `lines` entries, and none has a fourth, so faces 4
 * and 5 must guard against a missing line rather than index past the end.
 */
export function makeInteriorPageTextures(v: Volume) {
  const pageCount = 8;
  const inkColor = new THREE.Color(v.cloth).lerp(new THREE.Color(0x211b16), 0.62);
  const ink = `#${inkColor.getHexString()}`;

  return Array.from({ length: pageCount }, (_, pageIndex) => {
    const logicalWidth = 512;
    const logicalHeight = 768;
    const c = document.createElement("canvas");
    c.width = 384;
    c.height = 576;
    const ctx = c.getContext("2d")!;
    ctx.scale(0.75, 0.75);
    const random = seededRandom(hashSeed(`${v.id}-leaf-${pageIndex}`) + v.seed);
    drawPaperSurface(ctx, logicalWidth, logicalHeight, random);

    ctx.fillStyle = ink;
    ctx.strokeStyle = ink;
    ctx.textAlign = "left";
    ctx.textBaseline = "alphabetic";

    // Running head, on every face.
    ctx.globalAlpha = 0.58;
    ctx.font = `400 10px ${MONO}`;
    ctx.letterSpacing = "1.8px";
    ctx.fillText(`EX LIBRIS  /  ${v.roman}`, 48, 48);
    ctx.textAlign = "right";
    ctx.fillText(pad(pageIndex + 1), logicalWidth - 48, 48);
    ctx.textAlign = "left";
    ctx.letterSpacing = "0px";
    ctx.fillRect(48, 64, logicalWidth - 96, 1);
    ctx.globalAlpha = 1;

    if (pageIndex === 0) {
      ctx.font = `400 12px ${MONO}`;
      ctx.letterSpacing = "2.3px";
      ctx.fillText(v.discipline.toUpperCase(), 54, 174);
      ctx.letterSpacing = "0px";
      ctx.font = `500 ${v.title.length > 10 ? 48 : 58}px ${SERIF}`;
      drawWrappedCanvasText(ctx, v.title, 52, 246, 18, 58, 2);
      ctx.globalAlpha = 0.55;
      ctx.font = `400 22px ${SERIF}`;
      drawWrappedCanvasText(ctx, v.note, 54, 462, 36, 30, 4);
      ctx.globalAlpha = 1;
    } else if (pageIndex === 1 || pageIndex === 3) {
      const chapterIndex = pageIndex === 1 ? 0 : 1;
      const line = v.lines[chapterIndex];
      ctx.font = `400 11px ${MONO}`;
      ctx.letterSpacing = "2px";
      ctx.fillText(`CHAPTER ${pad(chapterIndex + 1)}`, 54, 166);
      ctx.letterSpacing = "0px";
      ctx.font = `500 49px ${SERIF}`;
      drawWrappedCanvasText(ctx, v.chapters[chapterIndex], 52, 244, 18, 54, 3);
      if (line) {
        ctx.globalAlpha = 0.52;
        ctx.font = `400 20px ${SERIF}`;
        drawWrappedCanvasText(ctx, line, 54, 438, 42, 28, 6);
        ctx.globalAlpha = 1;
      }
    } else if (pageIndex === 2) {
      ctx.font = `400 11px ${MONO}`;
      ctx.letterSpacing = "2px";
      ctx.fillText("PLATE 01  /  SYSTEM MOTIF", 54, 146);
      ctx.letterSpacing = "0px";
      ctx.save();
      ctx.globalAlpha = 0.58;
      const motifSeed = hashSeed(`${v.id}-leaf-2-motif`) + v.seed;
      drawMotif(ctx, v.motifKey, ink, motifSeed, logicalWidth, logicalHeight * 0.92);
      ctx.restore();
      ctx.globalAlpha = 0.48;
      ctx.font = `400 17px ${SERIF}`;
      drawWrappedCanvasText(ctx, v.theme, 54, 650, 44, 24, 3);
      ctx.globalAlpha = 1;
    } else if (pageIndex === 4) {
      ctx.font = `400 11px ${MONO}`;
      ctx.letterSpacing = "2px";
      ctx.fillText("NOTES", 54, 166);
      ctx.letterSpacing = "0px";
      const line = v.lines[2];
      if (line) {
        ctx.globalAlpha = 0.52;
        ctx.font = `400 20px ${SERIF}`;
        drawWrappedCanvasText(ctx, line, 54, 238, 42, 28, 8);
        ctx.globalAlpha = 1;
      }
    } else if (pageIndex === 5) {
      ctx.font = `400 11px ${MONO}`;
      ctx.letterSpacing = "2px";
      ctx.fillText("NOTES  /  CONTINUED", 54, 166);
      ctx.letterSpacing = "0px";
      // Only present on volumes with a fourth field note — do not index
      // past the end for the two- and three-line volumes.
      const line = v.lines[3];
      if (line) {
        ctx.globalAlpha = 0.52;
        ctx.font = `400 20px ${SERIF}`;
        drawWrappedCanvasText(ctx, line, 54, 238, 42, 28, 8);
        ctx.globalAlpha = 1;
      }
    } else if (pageIndex === 6) {
      ctx.font = `400 11px ${MONO}`;
      ctx.letterSpacing = "2px";
      ctx.fillText("COLOPHON", 54, 166);
      ctx.letterSpacing = "0px";
      ctx.font = `500 32px ${SERIF}`;
      const titleSize = fitFont(ctx, v.title, SERIF, "500", 32, logicalWidth - 108);
      ctx.font = `500 ${titleSize}px ${SERIF}`;
      ctx.fillText(v.title, 54, 230);
      ctx.globalAlpha = 0.58;
      ctx.font = `400 18px ${SERIF}`;
      drawWrappedCanvasText(ctx, v.tags.join("  /  "), 54, 306, 44, 30, 6);
      ctx.globalAlpha = 1;
    } else {
      ctx.font = `400 11px ${MONO}`;
      ctx.letterSpacing = "2px";
      ctx.fillText("IMPRINT", 54, 166);
      ctx.letterSpacing = "0px";
      ctx.font = `500 30px ${SERIF}`;
      drawWrappedCanvasText(ctx, v.subtitle, 52, 226, 20, 36, 2);
      ctx.globalAlpha = 0.62;
      ctx.font = `400 18px ${SERIF}`;
      ctx.fillText(v.place, 54, 340);
      ctx.globalAlpha = 0.5;
      ctx.font = `400 13px ${MONO}`;
      ctx.letterSpacing = "1.4px";
      ctx.fillText(v.dates.toUpperCase(), 54, 376);
      ctx.letterSpacing = "0px";
      ctx.globalAlpha = 1;
    }

    ctx.globalAlpha = 0.62;
    ctx.fillRect(48, logicalHeight - 48, logicalWidth - 96, 1);
    ctx.globalAlpha = 1;

    const texture = finish(c, undefined, 16);
    texture.name = `${v.id}-interior-page-${pageIndex + 1}`;
    return texture;
  });
}

export function makePageEdgeTextures(v: Volume) {
  const makeEdge = (width: number, height: number, suffix: string) => {
    const { c, ctx } = canvas(width, height);
    const random = seededRandom(hashSeed(`${v.id}-${suffix}`) + v.seed);

    ctx.fillStyle = "#dcd5c7";
    ctx.fillRect(0, 0, width, height);

    const pageStep = suffix === "fore-edge" ? 2 : 1.35;
    for (let y = 0; y < height; y += pageStep) {
      const shade = Math.round(106 + random() * 74);
      const signature = random() > 0.965;
      ctx.strokeStyle = `rgba(${shade},${shade - 3},${shade - 9},${signature ? 0.34 : 0.13 + random() * 0.13})`;
      ctx.lineWidth = signature ? 1.05 : 0.42 + random() * 0.42;
      ctx.beginPath();
      ctx.moveTo(0, y + (random() - 0.5) * 0.5);
      ctx.bezierCurveTo(
        width * 0.3, y + (random() - 0.5) * 0.9,
        width * 0.72, y + (random() - 0.5) * 0.9,
        width, y + (random() - 0.5) * 0.5,
      );
      ctx.stroke();
    }

    const edgeShade = ctx.createLinearGradient(0, 0, width, 0);
    edgeShade.addColorStop(0, "rgba(58,48,35,0.18)");
    edgeShade.addColorStop(0.035, "rgba(255,255,255,0.04)");
    edgeShade.addColorStop(0.86, "rgba(255,255,255,0)");
    edgeShade.addColorStop(1, "rgba(58,48,35,0.12)");
    ctx.fillStyle = edgeShade;
    ctx.fillRect(0, 0, width, height);

    const t = finish(c);
    t.name = `${v.id}-${suffix}`;
    return t;
  };

  return {
    foreEdge: makeEdge(512, 2048, "fore-edge"),
    headTail: makeEdge(2048, 384, "head-tail-edge"),
  };
}

let sharedContactShadowTexture: THREE.Texture | null = null;

/** A soft radial falloff, laid under a presented book. Shared across the scene. */
export function makeContactShadowTexture() {
  if (sharedContactShadowTexture) return sharedContactShadowTexture;
  const { c, ctx } = canvas(512, 128);
  const gradient = ctx.createRadialGradient(256, 64, 10, 256, 64, 254);
  gradient.addColorStop(0, "rgba(255,255,255,0.95)");
  gradient.addColorStop(0.38, "rgba(255,255,255,0.62)");
  gradient.addColorStop(0.72, "rgba(255,255,255,0.18)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 512, 128);
  sharedContactShadowTexture = finishData(c, undefined, 8);
  sharedContactShadowTexture.name = "soft-contact-shadow";
  return sharedContactShadowTexture;
}

// ── Page edges (legacy, flat) ─────────────────────────────────────

/** Page edges — stacked leaves seen side on. */
export function makePagesTexture() {
  const W = 256;
  const H = 512;
  const { c, ctx } = canvas(W, H);
  ctx.fillStyle = "#efe9dc";
  ctx.fillRect(0, 0, W, H);
  for (let x = 0; x < W; x += 1) {
    const n = 0.5 + Math.random() * 0.5;
    ctx.globalAlpha = 0.055 * n;
    ctx.fillStyle = Math.random() > 0.65 ? "#8e8676" : "#ffffff";
    ctx.fillRect(x, 0, 1, H);
  }
  ctx.globalAlpha = 0.14;
  ctx.fillStyle = "#a89c86";
  ctx.fillRect(0, 0, W, 5);
  ctx.fillRect(0, H - 5, W, 5);
  return finish(c);
}

/** Light oak, quarter-sawn — the shelf and the room's only warmth. */
export function makeOakTexture(repeat: [number, number] = [1, 1]) {
  const W = 1024;
  const H = 256;
  const { c, ctx } = canvas(W, H);
  ctx.fillStyle = "#cbb392";
  ctx.fillRect(0, 0, W, H);

  for (let i = 0; i < 70; i++) {
    const y = Math.random() * H;
    ctx.globalAlpha = 0.05 + Math.random() * 0.1;
    ctx.strokeStyle = Math.random() > 0.4 ? "#a98d68" : "#e0cdb0";
    ctx.lineWidth = 0.6 + Math.random() * 2.4;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= W; x += 32) {
      ctx.lineTo(x, y + Math.sin((x + i * 40) * 0.006) * 5 + (Math.random() - 0.5) * 2);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  return finish(c, repeat);
}

/** Wall plaster: bone, with just enough variation to catch the light. */
export function makePlasterTexture() {
  const W = 512;
  const H = 512;
  const { c, ctx } = canvas(W, H);
  ctx.fillStyle = "#e8e2d7";
  ctx.fillRect(0, 0, W, H);
  for (let i = 0; i < 2600; i++) {
    const a = Math.random() * 0.035;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(120,110,95,${a})`;
    ctx.beginPath();
    ctx.arc(Math.random() * W, Math.random() * H, 1 + Math.random() * 7, 0, Math.PI * 2);
    ctx.fill();
  }
  return finish(c, [3, 3]);
}
