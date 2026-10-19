import * as THREE from "three";

import { FAMILY, FONT, type Grid } from "./grid";

// The rendered scene becomes characters on the GPU, picked by SHAPE, not brightness
// (after Alex Harri, "ASCII characters are not pixels", alexharri.com/blog/ascii-rendering):
//   1. every glyph gets a 6-number "shape vector": how much ink it has in each of 6 circles
//      laid out 2 wide × 3 tall over its cell;
//   2. pass one samples the scene's darkness in the same 6 circles of every cell and picks the glyph
//      whose shape vector is nearest, so a diagonal edge becomes `/`, a cap becomes `^`, a mass `@`;
//   3. pass two stamps the picked glyphs from a font atlas onto the screen.
// Depth silhouettes are added to the darkness first, so outlines turn into line characters too.

/** Scene pixels rendered per character cell. 4×6 makes each circle exactly a 2×2 pixel block. */
export const SUB = { x: 4, y: 6 };

// Symbols and capitals, as in the reference: the search decides which fit, nothing is hand-ranked.
// Lowercase and digits are left out: in sparse areas they read as stray words and numbers.
const GLYPHS = " .,:;'\"`-_~=+*^!|/\\()[]{}<>#$%&@ABCDEFGHIJKLMNOPQRSTUVWXYZ";

// Circle centres (x from the left, y from the top) over the glyph BODY, cap height to baseline, not the
// whole cell: below the baseline only g/j/p/q/y have ink, and full cells would all become those.
// The left column sits a bit lower than the right, as in Harri's layout.
const CIRCLES = [
  [0.25, 0.2], [0.75, 0.13],
  [0.25, 0.53], [0.75, 0.47],
  [0.25, 0.87], [0.75, 0.8],
];

const SETTINGS = {
  white: 0.78, // scene luminance (sRGB) at or above this is empty paper
  black: 0.2, // ...at or below this is full ink
  contrast: 2.2, // exponent of the per-cell contrast boost (Harri's "global" enhancement)
  edgeLo: 0.04, // relative depth jump where a silhouette starts to draw...
  edgeHi: 0.18, // ...and where it is fully dark
  jitter: 0.45, // per-cell noise on the samples, relative to the cell's darkest sample
  stippleBelow: 0.5, // cells paler than this become sparse stipple; darker ones solid glyphs
};

const pickShader = /* glsl */ `
  #include <packing>
  precision highp float;
  out highp vec4 fragColor;

  uniform sampler2D tColor, tDepth, tShapes;
  uniform vec2 grid;     // cols, rows
  uniform vec2 texel;    // one scene pixel in uv
  uniform float near, far;
  uniform float white, black, contrast, edgeLo, edgeHi, jitter, stippleBelow, time;
  uniform vec2 circles[6];

  float dist(vec2 uv) { return -perspectiveDepthToViewZ(texture(tDepth, uv).x, near, far); }

  // How much ink the scene wants at uv: dark surfaces, plus a line where this surface is in front.
  float ink(vec2 uv, out vec3 color) {
    color = pow(texture(tColor, uv).rgb, vec3(1.0 / 2.2)); // the target is linear; judge tone as the eye does
    float lum = dot(color, vec3(0.299, 0.587, 0.114));
    float tone = clamp((white - lum) / (white - black), 0.0, 1.0);
    float d = dist(uv);
    float behind = max(max(dist(uv + vec2(texel.x, 0.0)), dist(uv - vec2(texel.x, 0.0))),
                       max(dist(uv + vec2(0.0, texel.y)), dist(uv - vec2(0.0, texel.y))));
    return max(tone, smoothstep(edgeLo, edgeHi, (behind - d) / d));
  }

  void main() {
    vec2 cell = floor(gl_FragCoord.xy); // row 0 is the BOTTOM row here
    float v[6];
    vec3 sum = vec3(0.0), color;
    float peak = 0.0;
    for (int k = 0; k < 6; k++) {
      // Bilinear filtering at a circle centre averages the 2×2 pixels under it.
      vec2 uv = (cell + vec2(circles[k].x, 1.0 - circles[k].y)) / grid;
      v[k] = ink(uv, color);
      sum += color;
      peak = max(peak, v[k]);
    }
    // Noise, reshuffled a few times a second. Pale cells are stippled: their ink lands in a few random
    // circles, so they become . , ' - instead of a field of | (the best match for an even pale cell).
    // Dark masses get a light jitter so they spread over glyphs of similar weight, like leaves.
    uint h = uint(cell.x) * 0x27d4eb2du ^ uint(cell.y) * 0x165667b1u ^ uint(time * 2.0) * 0x9e3779b9u;
    float solid = smoothstep(stippleBelow - 0.15, stippleBelow + 0.15, peak);
    for (int k = 0; k < 6; k++) {
      h = (h ^ (h >> 15u)) * 0x2c1b3c6du;
      h ^= h >> 12u;
      float n = float(h & 255u) / 255.0;
      float stipple = step(1.0 - v[k] * 1.6, n) * min(1.0, v[k] * 2.5);
      v[k] = mix(stipple, clamp(v[k] + jitter * peak * (n - 0.5), 0.0, 1.0), solid);
    }
    // Contrast: push each component away from the cell's brightest, so boundaries come out crisp.
    if (peak > 0.0) for (int k = 0; k < 6; k++) v[k] = peak * pow(v[k] / peak, contrast);

    int best = 0;
    float bestD = 1e9;
    for (int i = 0; i < ${GLYPHS.length}; i++) {
      vec4 a = texelFetch(tShapes, ivec2(i, 0), 0);
      vec2 b = texelFetch(tShapes, ivec2(i, 1), 0).xy;
      vec4 da = a - vec4(v[0], v[1], v[2], v[3]);
      vec2 db = b - vec2(v[4], v[5]);
      float dd = dot(da, da) + dot(db, db);
      if (dd < bestD) { bestD = dd; best = i; }
    }

    // Ink: the surface's own hue, deepened toward a dark green-black so every glyph reads on white.
    vec3 c = sum / 6.0;
    float lum = dot(c, vec3(0.299, 0.587, 0.114));
    vec3 hue = clamp(lum + (c - lum) * 1.8, 0.0, 1.0);
    vec3 color2 = mix(vec3(0.09, 0.14, 0.12), hue * 0.55, 0.45);
    fragColor = vec4(float(best) / 255.0, color2);
  }
`;

const drawShader = /* glsl */ `
  precision highp float;
  out highp vec4 fragColor;

  uniform sampler2D tPick, tGlyphs;
  uniform vec2 grid, cellPx;
  uniform float canvasH, glyphCount;

  void main() {
    vec2 px = vec2(gl_FragCoord.x, canvasH - gl_FragCoord.y); // from the top-left
    vec2 cell = floor(px / cellPx);
    if (cell.x >= grid.x || cell.y >= grid.y) { fragColor = vec4(1.0); return; }
    vec4 pick = texelFetch(tPick, ivec2(cell.x, grid.y - 1.0 - cell.y), 0);
    float glyph = floor(pick.r * 255.0 + 0.5);
    vec2 local = px - cell * cellPx;
    vec2 uv = vec2((glyph * cellPx.x + local.x) / (glyphCount * cellPx.x), 1.0 - local.y / cellPx.y);
    fragColor = vec4(mix(vec3(1.0), pick.gba, texture(tGlyphs, uv).r), 1.0);
  }
`;

const vertexShader = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

/** Every glyph white-on-black in one row, one cell each, at device resolution. */
function glyphAtlas(grid: Grid) {
  const w = Math.round(grid.cellW * grid.dpr);
  const h = Math.round(grid.cellH * grid.dpr);
  const canvas = document.createElement("canvas");
  canvas.width = w * GLYPHS.length;
  canvas.height = h;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.scale(grid.dpr, grid.dpr);
  ctx.font = FONT;
  ctx.textBaseline = "top";
  ctx.fillStyle = "#fff";
  [...GLYPHS].forEach((ch, i) => ctx.fillText(ch, (i * w) / grid.dpr, 0));
  const tex = new THREE.CanvasTexture(canvas);
  tex.minFilter = tex.magFilter = THREE.NearestFilter;
  return tex;
}

/**
 * Each glyph's ink coverage in the 6 circles, measured on a large rendering of the same font,
 * then normalised per circle so the heaviest glyph scores 1. Row 0 holds circles 0-3, row 1 circles 4-5.
 * Also returns the circles in cell units, for sampling the scene at the same spots.
 */
function shapeVectors() {
  const size = 96;
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true })!;
  ctx.font = `bold ${size}px ${FAMILY}`;
  const w = Math.ceil(ctx.measureText("M").width);
  const h = Math.round(size * 1.2);
  canvas.width = w;
  canvas.height = h;
  // The body's top and bottom, from where "M" has ink.
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, w, h);
  ctx.font = `bold ${size}px ${FAMILY}`;
  ctx.textBaseline = "top";
  ctx.fillStyle = "#fff";
  ctx.fillText("M", 0, 0);
  const m = ctx.getImageData(0, 0, w, h).data;
  const inkRows = [...Array(h).keys()].filter((y) => [...Array(w).keys()].some((x) => m[(y * w + x) * 4] > 127));
  const top = inkRows[0] / h;
  const bottom = (inkRows[inkRows.length - 1] + 1) / h;
  const circles = CIRCLES.map(([x, y]) => [x, top + y * (bottom - top)]);
  const r = 0.3 * w;
  const vectors = [...GLYPHS].map((ch) => {
    ctx.fillStyle = "#000";
    ctx.fillRect(0, 0, w, h);
    ctx.font = `bold ${size}px ${FAMILY}`;
    ctx.textBaseline = "top";
    ctx.fillStyle = "#fff";
    ctx.fillText(ch, 0, 0);
    const px = ctx.getImageData(0, 0, w, h).data;
    return circles.map(([cx, cy]) => {
      let ink = 0;
      let all = 0;
      for (let y = Math.floor(cy * h - r); y <= cy * h + r; y++) {
        for (let x = Math.floor(cx * w - r); x <= cx * w + r; x++) {
          if (x < 0 || y < 0 || x >= w || y >= h || Math.hypot(x - cx * w, y - cy * h) > r) continue;
          ink += px[(y * w + x) * 4] / 255;
          all++;
        }
      }
      return ink / all;
    });
  });
  const max = CIRCLES.map((_, k) => Math.max(...vectors.map((v) => v[k])));
  const data = new Float32Array(GLYPHS.length * 2 * 4);
  vectors.forEach((v, i) => {
    const n = v.map((x, k) => x / max[k]);
    data.set(n.slice(0, 4), i * 4);
    data.set([n[4], n[5], 0, 0], (GLYPHS.length + i) * 4);
  });
  const tex = new THREE.DataTexture(data, GLYPHS.length, 2, THREE.RGBAFormat, THREE.FloatType);
  tex.needsUpdate = true;
  return { tex, circles };
}

function fullScreen(material: THREE.ShaderMaterial) {
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(quad);
  return scene;
}

export function createAsciiPass() {
  const shapes = shapeVectors();
  const pickTarget = new THREE.WebGLRenderTarget(1, 1, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });
  const pick = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader,
    fragmentShader: pickShader,
    uniforms: {
      tColor: { value: null },
      tDepth: { value: null },
      tShapes: { value: shapes.tex },
      grid: { value: new THREE.Vector2() },
      texel: { value: new THREE.Vector2() },
      near: { value: 0 },
      far: { value: 0 },
      time: { value: 0 },
      circles: { value: shapes.circles.map(([x, y]) => new THREE.Vector2(x, y)) },
      ...Object.fromEntries(Object.entries(SETTINGS).map(([k, v]) => [k, { value: v }])),
    },
  });
  const draw = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader,
    fragmentShader: drawShader,
    uniforms: {
      tPick: { value: pickTarget.texture },
      tGlyphs: { value: null },
      grid: { value: new THREE.Vector2() },
      cellPx: { value: new THREE.Vector2() },
      canvasH: { value: 0 },
      glyphCount: { value: GLYPHS.length },
    },
  });
  const pickScene = fullScreen(pick);
  const drawScene = fullScreen(draw);
  const camera = new THREE.Camera();

  return {
    resize(grid: Grid, canvasH: number) {
      pickTarget.setSize(grid.cols, grid.rows);
      pick.uniforms.grid.value.set(grid.cols, grid.rows);
      pick.uniforms.texel.value.set(1 / (grid.cols * SUB.x), 1 / (grid.rows * SUB.y));
      const u = draw.uniforms;
      (u.tGlyphs.value as THREE.Texture | null)?.dispose();
      u.tGlyphs.value = glyphAtlas(grid);
      u.grid.value.set(grid.cols, grid.rows);
      u.cellPx.value.set(Math.round(grid.cellW * grid.dpr), Math.round(grid.cellH * grid.dpr));
      u.canvasH.value = canvasH;
    },
    render(renderer: THREE.WebGLRenderer, frame: { color: THREE.Texture; depth: THREE.Texture; near: number; far: number }, time: number) {
      const u = pick.uniforms;
      u.time.value = time;
      u.tColor.value = frame.color;
      u.tDepth.value = frame.depth;
      u.near.value = frame.near;
      u.far.value = frame.far;
      renderer.setRenderTarget(pickTarget);
      renderer.render(pickScene, camera);
      renderer.setRenderTarget(null);
      renderer.render(drawScene, camera);
    },
  };
}
