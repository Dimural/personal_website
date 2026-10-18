import * as THREE from "three";

import { FONT, type Grid } from "./grid";

// The rendered scene becomes characters on the GPU: a full-screen shader reads each cell's colour and
// depth straight from the scene's render target and stamps a glyph from a pre-drawn font atlas.

// Every glyph the world can use. BANDS and outline strokes index into this.
const GLYPHS = " .:-=+*o%#&$@Q|\\_/";
const g = (ch: string) => GLYPHS.indexOf(ch);
// Light mode: darker spots get denser glyphs. Each band holds 4 slots (repeats allowed); a per-cell
// hash picks one so solid masses look textured.
const BANDS = [" ", ".", ":.:.", "-=-=", "+*+*", "o%#o", "&$@Q"];

const SETTINGS = {
  outline: 0.35, // relative depth jump between neighbouring cells that draws an outline
  glyphMin: 0.12, // density below this is bare ground: nothing drawn
  fillMin: 0.4, // below this (ground shadows) faint glyphs only, no fill, so only objects look solid
  fillFull: 0.6, // density where a fill reaches full strength
  fillLift: 0.18, // fills are the scene colour lifted toward white by this much
  fillSaturate: 1.5,
  glyphShade: 0.42, // glyph = scene colour × this
  outlineShade: 0.22, // outlines darker still
};

const vertexShader = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const fragmentShader = /* glsl */ `
  #include <packing>
  precision highp float;
  out highp vec4 fragColor;

  uniform sampler2D tColor;
  uniform sampler2D tDepth;
  uniform sampler2D tGlyphs;
  uniform vec2 grid;      // cols, rows
  uniform vec2 cellPx;    // device pixels per cell
  uniform float canvasH;  // device pixels
  uniform float glyphCount;
  uniform float bands[28];
  uniform float near, far;
  uniform float outline, glyphMin, fillMin, fillFull, fillLift, fillSaturate, glyphShade, outlineShade;

  vec2 cellUv(vec2 cell) { return vec2((cell.x + 0.5) / grid.x, 1.0 - (cell.y + 0.5) / grid.y); }
  float dist(vec2 cell) {
    cell = clamp(cell, vec2(0.0), grid - 1.0);
    return -perspectiveDepthToViewZ(texture(tDepth, cellUv(cell)).x, near, far);
  }

  void main() {
    // Cells count from the top-left; gl_FragCoord counts from the bottom-left.
    vec2 px = vec2(gl_FragCoord.x, canvasH - gl_FragCoord.y);
    vec2 cell = floor(px / cellPx);
    if (cell.x >= grid.x || cell.y >= grid.y) { fragColor = vec4(1.0); return; }

    // Linear filtering at the cell centre averages the 2×2 rendered pixels under it.
    vec3 c = texture(tColor, cellUv(cell)).rgb;
    float lum = dot(c, vec3(0.299, 0.587, 0.114));
    float density = 1.0 - lum;

    vec3 bg = vec3(1.0);
    if (density >= fillMin) {
      vec3 fill = (lum + (c - lum) * fillSaturate) * (1.0 - fillLift) + fillLift;
      bg = mix(bg, fill, clamp((density - fillMin) / (fillFull - fillMin), 0.0, 1.0));
    }

    // Sobel on depth: a big relative jump is a silhouette. Only the nearer side draws it, one cell thick.
    float d = dist(cell);
    float tl = dist(cell + vec2(-1, -1)), t = dist(cell + vec2(0, -1)), tr = dist(cell + vec2(1, -1));
    float l = dist(cell + vec2(-1, 0)), r = dist(cell + vec2(1, 0));
    float bl = dist(cell + vec2(-1, 1)), b = dist(cell + vec2(0, 1)), br = dist(cell + vec2(1, 1));
    float gx = tr + 2.0 * r + br - tl - 2.0 * l - bl;
    float gy = bl + 2.0 * b + br - tl - 2.0 * t - tr;

    float glyph = -1.0;
    vec3 ink = c * glyphShade;
    if (d < (l + r + t + b) / 4.0 && length(vec2(gx, gy)) / d > outline) {
      // The stroke runs perpendicular to the gradient (screen y points down).
      float angle = mod(degrees(atan(gy, gx)) + 180.0, 180.0);
      glyph = angle < 22.5 || angle >= 157.5 ? ${g("|")}.0 : angle < 67.5 ? ${g("\\")}.0 : angle < 112.5 ? ${g("_")}.0 : ${g("/")}.0;
      ink = c * outlineShade;
    } else if (density >= glyphMin) {
      // Well-mixed hash; plain multiplies leave low bits periodic and glyphs repeat in stripes.
      uint h = uint(cell.x) * 0x27d4eb2du ^ uint(cell.y) * 0x165667b1u;
      h = (h ^ (h >> 15u)) * 0x2c1b3c6du;
      h ^= h >> 12u;
      int band = min(6, int(density * 7.0));
      glyph = bands[band * 4 + int(h % 4u)];
    }

    float coverage = 0.0;
    if (glyph > 0.0) {
      vec2 local = px - cell * cellPx;
      vec2 uv = vec2((glyph * cellPx.x + local.x) / (glyphCount * cellPx.x), 1.0 - local.y / cellPx.y);
      coverage = texture(tGlyphs, uv).r;
    }
    fragColor = vec4(mix(bg, ink, coverage), 1.0);
  }
`;

/** Draw every glyph white-on-black in one row, one cell each, at device resolution. */
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

export function createAsciiPass() {
  const material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      tColor: { value: null },
      tDepth: { value: null },
      tGlyphs: { value: null },
      grid: { value: new THREE.Vector2() },
      cellPx: { value: new THREE.Vector2() },
      canvasH: { value: 0 },
      glyphCount: { value: GLYPHS.length },
      bands: { value: BANDS.flatMap((band) => [...band.padEnd(4, band)].map(g)) },
      near: { value: 0 },
      far: { value: 0 },
      ...Object.fromEntries(Object.entries(SETTINGS).map(([k, v]) => [k, { value: v }])),
    },
  });
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(quad);
  const camera = new THREE.Camera();

  return {
    resize(grid: Grid, canvasH: number) {
      const u = material.uniforms;
      (u.tGlyphs.value as THREE.Texture | null)?.dispose();
      u.tGlyphs.value = glyphAtlas(grid);
      u.grid.value.set(grid.cols, grid.rows);
      u.cellPx.value.set(Math.round(grid.cellW * grid.dpr), Math.round(grid.cellH * grid.dpr));
      u.canvasH.value = canvasH;
    },
    render(renderer: THREE.WebGLRenderer, frame: { color: THREE.Texture; depth: THREE.Texture; near: number; far: number }) {
      const u = material.uniforms;
      u.tColor.value = frame.color;
      u.tDepth.value = frame.depth;
      u.near.value = frame.near;
      u.far.value = frame.far;
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
    },
  };
}
