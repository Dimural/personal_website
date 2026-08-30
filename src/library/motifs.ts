import type { MotifKey } from "./data";
import { seededRandom } from "./materials";

/**
 * Six devices, each drawn in `foil` on a transparent ground, centred in the
 * upper two-thirds of the surface. Every call is seeded, so the same volume
 * always stamps the same mark.
 */
export function drawMotif(
  ctx: CanvasRenderingContext2D,
  motif: MotifKey,
  foil: string,
  seed: number,
  width: number,
  height: number,
) {
  const random = seededRandom(seed);
  const cx = width / 2;
  const cy = height * 0.42;
  const unit = Math.min(width, height) * 0.17;

  ctx.save();
  ctx.strokeStyle = foil;
  ctx.fillStyle = foil;
  ctx.lineWidth = Math.max(1.4, unit * 0.035);
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.72;

  if (motif === "brackets") {
    // Nested square brackets, each inset and slightly rotated.
    for (let i = 0; i < 4; i++) {
      const s = unit * (1.5 - i * 0.28);
      const lip = s * 0.34;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate((random() - 0.5) * 0.04);
      for (const dir of [-1, 1]) {
        ctx.beginPath();
        ctx.moveTo(dir * s - dir * lip, -s);
        ctx.lineTo(dir * s, -s);
        ctx.lineTo(dir * s, s);
        ctx.lineTo(dir * s - dir * lip, s);
        ctx.stroke();
      }
      ctx.restore();
    }
  } else if (motif === "paths") {
    // Interlaced routes fanning from a single origin.
    for (let i = 0; i < 7; i++) {
      const spread = (i / 6 - 0.5) * unit * 2.4;
      ctx.beginPath();
      ctx.moveTo(cx, cy + unit * 1.5);
      ctx.bezierCurveTo(
        cx + spread * 0.4, cy + unit * 0.3,
        cx + spread * 1.3, cy - unit * 0.4,
        cx + spread, cy - unit * 1.5,
      );
      ctx.globalAlpha = 0.35 + random() * 0.4;
      ctx.stroke();
    }
  } else if (motif === "lattice") {
    // A woven grid with alternating strands lifted.
    const n = 7;
    const step = (unit * 2.6) / n;
    for (let i = 0; i <= n; i++) {
      const o = -unit * 1.3 + i * step;
      ctx.globalAlpha = i % 2 ? 0.8 : 0.42;
      ctx.beginPath();
      ctx.moveTo(cx + o, cy - unit * 1.3);
      ctx.lineTo(cx + o, cy + unit * 1.3);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(cx - unit * 1.3, cy + o);
      ctx.lineTo(cx + unit * 1.3, cy + o);
      ctx.stroke();
    }
  } else if (motif === "orbit") {
    // Concentric ellipses at varied inclinations, with one marker each.
    for (let i = 0; i < 5; i++) {
      const r = unit * (0.5 + i * 0.28);
      const tilt = (i / 5) * Math.PI * 0.7 + random() * 0.1;
      ctx.globalAlpha = 0.35 + i * 0.1;
      ctx.beginPath();
      ctx.ellipse(cx, cy, r, r * 0.42, tilt, 0, Math.PI * 2);
      ctx.stroke();
      const a = random() * Math.PI * 2;
      ctx.beginPath();
      ctx.arc(
        cx + Math.cos(a) * r * Math.cos(tilt),
        cy + Math.sin(a) * r * 0.42,
        ctx.lineWidth * 1.4, 0, Math.PI * 2,
      );
      ctx.fill();
    }
  } else if (motif === "strata") {
    // Sedimentary bands, each a slightly different thickness.
    let y = cy - unit * 1.3;
    while (y < cy + unit * 1.3) {
      const thickness = unit * (0.04 + random() * 0.1);
      ctx.globalAlpha = 0.3 + random() * 0.45;
      ctx.fillRect(cx - unit * 1.3, y, unit * 2.6, thickness);
      y += thickness + unit * (0.06 + random() * 0.08);
    }
  } else {
    // vault — a keyed arch over a rule.
    ctx.globalAlpha = 0.78;
    ctx.beginPath();
    ctx.arc(cx, cy + unit * 0.2, unit * 1.1, Math.PI, 0);
    ctx.lineTo(cx + unit * 1.1, cy + unit * 1.2);
    ctx.moveTo(cx - unit * 1.1, cy + unit * 0.2);
    ctx.lineTo(cx - unit * 1.1, cy + unit * 1.2);
    ctx.stroke();
    for (let i = 0; i < 5; i++) {
      const a = Math.PI + (i + 0.5) * (Math.PI / 5);
      ctx.globalAlpha = 0.4 + random() * 0.3;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * unit * 0.62, cy + unit * 0.2 + Math.sin(a) * unit * 0.62);
      ctx.lineTo(cx + Math.cos(a) * unit * 1.1, cy + unit * 0.2 + Math.sin(a) * unit * 1.1);
      ctx.stroke();
    }
    ctx.globalAlpha = 0.6;
    ctx.fillRect(cx - unit * 1.35, cy + unit * 1.28, unit * 2.7, ctx.lineWidth);
  }

  ctx.restore();
}
