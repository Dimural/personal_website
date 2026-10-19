import * as THREE from "three";

import { FONT, type Grid } from "./grid";
import { SUPERSAMPLE } from "./scene3d";

// The rendered scene becomes coloured characters on a night-navy page, all on the GPU. Per cell:
//   - colour: the scene's own colour under the cell, brightened so dim things still show;
//   - glyph: if the cell's 3×3 pixels hold a strong stroke (a grass blade, a wall edge), the matching
//     line / \ | - ; otherwise a character from RAMP, denser the brighter the cell.
// Detail comes from the 3D scene (scene3d.ts); this pass only translates.

// Sparse to dense. Kept free of the stroke glyphs so strokes only appear where the scene has them.
const RAMP = " .`',:;~=+*il1tfjrxnuvczXYUJCLQ0OZmwqpdbkhao#MW&8%B@$";
const STROKES = "|/-\\";
const GLYPHS = RAMP + STROKES;

const SETTINGS = {
  paper: [0.039, 0.051, 0.094], // #0a0d18, same as the scene's night
  density: 2.9, // brightness → ramp position gain
  ink: 2.4, // brightness gain on the glyph's colour
  inkFloor: 0.18, // even the darkest drawn glyph keeps this much of its hue
  stroke: 0.22, // luminance gradient inside a cell that counts as a stroke
};

const vertexShader = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  out highp vec4 fragColor;

  uniform sampler2D tColor;
  uniform sampler2D tGlyphs;
  uniform vec2 grid;      // cols, rows
  uniform vec2 cellPx;    // device pixels per cell
  uniform float canvasH;  // device pixels
  uniform float glyphCount;
  uniform vec3 paper;
  uniform float density, ink, inkFloor, stroke;

  void main() {
    // Cells count from the top-left; gl_FragCoord and textures from the bottom-left.
    vec2 px = vec2(gl_FragCoord.x, canvasH - gl_FragCoord.y);
    vec2 cell = floor(px / cellPx);
    if (cell.x >= grid.x || cell.y >= grid.y) { fragColor = vec4(paper, 1.0); return; }

    // The cell's ${SUPERSAMPLE}×${SUPERSAMPLE} rendered pixels (sRGB), index = y * 3 + x with y up.
    ivec2 base = ivec2(int(cell.x) * ${SUPERSAMPLE}, int(grid.y - 1.0 - cell.y) * ${SUPERSAMPLE});
    float L[9];
    vec3 sum = vec3(0.0);
    for (int y = 0; y < 3; y++) for (int x = 0; x < 3; x++) {
      vec3 c = pow(texelFetch(tColor, base + ivec2(x, y), 0).rgb, vec3(1.0 / 2.2));
      L[y * 3 + x] = dot(c, vec3(0.299, 0.587, 0.114));
      sum += c;
    }
    vec3 c = sum / 9.0;
    float lum = dot(c, vec3(0.299, 0.587, 0.114));
    float gx = (L[2] + 2.0 * L[5] + L[8]) - (L[0] + 2.0 * L[3] + L[6]);
    float gy = (L[6] + 2.0 * L[7] + L[8]) - (L[0] + 2.0 * L[1] + L[2]);

    float level = clamp(lum * density, 0.0, 1.0);
    float glyph = floor(level * ${RAMP.length - 1}.0 + 0.5);
    if (length(vec2(gx, gy)) > stroke && glyph > 0.0) {
      // The stroke runs across the gradient. y is up here, so a gradient at 45° means a "\\" stroke.
      float a = mod(degrees(atan(gy, gx)) + 180.0, 180.0);
      int s = a < 22.5 || a >= 157.5 ? 0 : a < 67.5 ? 3 : a < 112.5 ? 2 : 1;
      glyph = ${RAMP.length}.0 + float(s);
    }

    float coverage = 0.0;
    if (glyph > 0.0) {
      vec2 local = px - cell * cellPx;
      vec2 uv = vec2((glyph * cellPx.x + local.x) / (glyphCount * cellPx.x), 1.0 - local.y / cellPx.y);
      coverage = texture(tGlyphs, uv).r;
    }
    float peak = max(max(c.r, c.g), c.b);
    vec3 hue = c / max(peak, 1e-3);
    vec3 col = clamp(max(c * ink, hue * inkFloor), 0.0, 1.0);
    fragColor = vec4(mix(paper, col, coverage), 1.0);
  }
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

export function createAsciiPass() {
  const material = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader,
    fragmentShader,
    depthTest: false,
    depthWrite: false,
    uniforms: {
      tColor: { value: null },
      tGlyphs: { value: null },
      grid: { value: new THREE.Vector2() },
      cellPx: { value: new THREE.Vector2() },
      canvasH: { value: 0 },
      glyphCount: { value: GLYPHS.length },
      paper: { value: new THREE.Vector3(...SETTINGS.paper) },
      density: { value: SETTINGS.density },
      ink: { value: SETTINGS.ink },
      inkFloor: { value: SETTINGS.inkFloor },
      stroke: { value: SETTINGS.stroke },
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
    render(renderer: THREE.WebGLRenderer, frame: { color: THREE.Texture }) {
      material.uniforms.tColor.value = frame.color;
      renderer.setRenderTarget(null);
      renderer.render(scene, camera);
    },
  };
}
