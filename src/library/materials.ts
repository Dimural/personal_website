import * as THREE from "three";
import type { Volume } from "./data";

const SERIF = '"Literata", "Iowan Old Style", Georgia, serif';
const MONO = '"IBM Plex Mono", ui-monospace, Menlo, monospace';

/** The first year printed in a date range — "June 2026 — Present" → "2026". */
function spineYear(dates: string) {
  const match = dates.match(/\d{4}/);
  return match ? match[0] : "";
}

function canvas(w: number, h: number) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return { c, ctx: c.getContext("2d")! };
}

function finish(c: HTMLCanvasElement, repeat?: [number, number]) {
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
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
    const a = Math.random() * 0.05;
    ctx.fillStyle = Math.random() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a})`;
    const r = 2 + Math.random() * 9;
    ctx.beginPath();
    ctx.arc(Math.random() * w, Math.random() * h, r, 0, Math.PI * 2);
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

export function makeSpineTexture(v: Volume) {
  const W = 320;
  const H = 1024;
  const { c, ctx } = canvas(W, H);
  drawCloth(ctx, W, H, v.cloth);

  // Foil rules top and bottom, as on a bound spine.
  ctx.strokeStyle = v.foil;
  ctx.globalAlpha = 0.85;
  ctx.lineWidth = 3;
  for (const y of [96, 112, H - 112, H - 96]) {
    ctx.beginPath();
    ctx.moveTo(46, y);
    ctx.lineTo(W - 46, y);
    ctx.stroke();
  }

  // Title, stamped down the spine.
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.globalAlpha = 1;
  ctx.fillStyle = v.foil;
  const size = fitFont(ctx, v.title, SERIF, "500", 62, H - 340);
  ctx.font = `500 ${size}px ${SERIF}`;
  ctx.fillText(v.title, 0, -4);
  ctx.restore();

  // Year at the foot, small.
  ctx.save();
  ctx.translate(W / 2, H - 168);
  ctx.rotate(-Math.PI / 2);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = v.foil;
  ctx.globalAlpha = 0.7;
  ctx.font = `400 26px ${MONO}`;
  ctx.fillText(spineYear(v.dates), 0, 0);
  ctx.restore();

  return finish(c);
}

export function makeCoverTexture(v: Volume) {
  const W = 720;
  const H = 1024;
  const { c, ctx } = canvas(W, H);
  drawCloth(ctx, W, H, v.cloth);

  // A ruled frame, the way a case-bound cover is blocked.
  ctx.strokeStyle = v.foil;
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 3;
  ctx.strokeRect(64, 64, W - 128, H - 128);
  ctx.globalAlpha = 0.28;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(78, 78, W - 156, H - 156);

  ctx.textAlign = "center";
  ctx.globalAlpha = 1;
  ctx.fillStyle = v.foil;

  // Title, wrapped to the block.
  const words = v.title.split(" ");
  const lines: string[] = [];
  let line = "";
  const size = 66;
  ctx.font = `500 ${size}px ${SERIF}`;
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (ctx.measureText(next).width > W - 220 && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);

  let y = H / 2 - ((lines.length - 1) * size * 1.16) / 2 - 30;
  for (const l of lines) {
    ctx.fillText(l, W / 2, y);
    y += size * 1.16;
  }

  // Short rule and the role beneath it.
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(W / 2 - 52, y + 4);
  ctx.lineTo(W / 2 + 52, y + 4);
  ctx.stroke();

  ctx.globalAlpha = 0.82;
  ctx.font = `400 25px ${MONO}`;
  const sub = v.subtitle.toUpperCase();
  const subSize = fitFont(ctx, sub, MONO, "400", 25, W - 200);
  ctx.font = `400 ${subSize}px ${MONO}`;
  ctx.fillText(sub, W / 2, y + 62);

  return finish(c);
}

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
