import * as THREE from "three";

import { FONT, type Grid } from "./grid";
import { SUPERSAMPLE } from "./scene3d";

// The rendered scene becomes coloured characters on a night-navy page, all on the GPU, in two passes:
//   1. cell pass (one pixel per cell): the cell's average colour and its stroke direction, EASED toward
//      the new frame instead of replaced, so characters change smoothly and never flicker;
//   2. draw pass: a glyph per cell — a line / \ | - where the cell holds a clear stroke (a grass blade,
//      a wall edge), otherwise a character from RAMP by brightness — in the cell's own, muted colour.
// Detail and motion come from the 3D scene (scene3d.ts); this pass only translates, calmly.

// Sparse to dense, deliberately quiet: no letters, which read as noise when they change.
const RAMP = " .`',:;-~=+*#%@";
const STROKES = "|/-\\";
const GLYPHS = RAMP + STROKES;

const SETTINGS = {
  paper: [0.039, 0.051, 0.094], // #0a0d18, same as the scene's night
  density: 2.4, // brightness → ramp position gain
  ink: 1.7, // brightness gain on the glyph's colour
  inkFloor: 0.14, // even the darkest drawn glyph keeps this much of its hue
  muted: 0.25, // pull colours this far toward grey, for a calm palette
  stroke: 0.3, // how clear a cell's stroke must be to draw a line instead of a ramp glyph
  ease: 7, // per second; how fast cells follow small changes (lower = smoother, laggier)
  stillBelow: 0.5, // world units/s of camera or figure motion above which easing stops entirely: motion never smears
  snapLo: 0.05, // colour change (0-1) where a cell starts skipping the ease...
  snapHi: 0.15, // ...and where it switches at once: real changes are crisp, tiny wobbles stay smooth
};

const vertexShader = /* glsl */ `
  void main() { gl_Position = vec4(position.xy, 0.0, 1.0); }
`;

const cellShader = /* glsl */ `
  precision highp float;
  layout(location = 0) out highp vec4 outColor;
  layout(location = 1) out highp vec4 outStroke;

  uniform sampler2D tColor, tPrevColor, tPrevStroke;
  uniform float blend; // 1 = take the new frame as is
  uniform float snapLo, snapHi;

  void main() {
    // One fragment per cell; the scene texture is ${SUPERSAMPLE}× larger, same bottom-left origin.
    ivec2 cell = ivec2(gl_FragCoord.xy);
    ivec2 base = cell * ${SUPERSAMPLE};
    float L[9];
    vec3 sum = vec3(0.0);
    for (int y = 0; y < 3; y++) for (int x = 0; x < 3; x++) {
      vec3 c = pow(texelFetch(tColor, base + ivec2(x, y), 0).rgb, vec3(1.0 / 2.2));
      L[y * 3 + x] = dot(c, vec3(0.299, 0.587, 0.114));
      sum += c;
    }
    float gx = (L[2] + 2.0 * L[5] + L[8]) - (L[0] + 2.0 * L[3] + L[6]);
    float gy = (L[6] + 2.0 * L[7] + L[8]) - (L[0] + 2.0 * L[1] + L[2]);
    // Structure tensor: unlike the raw gradient it doesn't cancel when averaged over frames.
    vec3 tensor = vec3(gx * gx, gy * gy, gx * gy);

    // Ease only small changes (grass swaying in place). A big change is something real arriving, and
    // easing it would smear it, so it switches at once.
    vec3 prev = texelFetch(tPrevColor, cell, 0).rgb;
    float b = mix(blend, 1.0, smoothstep(snapLo, snapHi, length(sum / 9.0 - prev)));
    outColor = vec4(mix(prev, sum / 9.0, b), 1.0);
    outStroke = vec4(mix(texelFetch(tPrevStroke, cell, 0).xyz, tensor, b), 1.0);
  }
`;

const drawShader = /* glsl */ `
  precision highp float;
  out highp vec4 fragColor;

  uniform sampler2D tCellColor, tCellStroke, tGlyphs;
  uniform vec2 grid;      // cols, rows
  uniform vec2 cellPx;    // device pixels per cell
  uniform float canvasH;  // device pixels
  uniform float glyphCount;
  uniform vec3 paper;
  uniform float density, ink, inkFloor, muted, stroke;

  void main() {
    vec2 px = vec2(gl_FragCoord.x, canvasH - gl_FragCoord.y); // from the top-left
    vec2 cell = floor(px / cellPx);
    if (cell.x >= grid.x || cell.y >= grid.y) { fragColor = vec4(paper, 1.0); return; }
    ivec2 at = ivec2(cell.x, grid.y - 1.0 - cell.y);
    vec3 c = texelFetch(tCellColor, at, 0).rgb;
    vec3 t = texelFetch(tCellStroke, at, 0).xyz;
    float lum = dot(c, vec3(0.299, 0.587, 0.114));

    float glyph = floor(clamp(lum * density, 0.0, 1.0) * ${RAMP.length - 1}.0 + 0.5);
    // Dominant gradient direction and how clear it is (0 = no single direction).
    float clarity = sqrt((t.x - t.y) * (t.x - t.y) + 4.0 * t.z * t.z);
    if (clarity > stroke && glyph > 0.0) {
      // The stroke runs across the gradient. y is up here, so a gradient at 45° means a "\\" stroke.
      float a = mod(degrees(0.5 * atan(2.0 * t.z, t.x - t.y)) + 180.0, 180.0);
      int s = a < 22.5 || a >= 157.5 ? 0 : a < 67.5 ? 3 : a < 112.5 ? 2 : 1;
      glyph = ${RAMP.length}.0 + float(s);
    }

    float coverage = 0.0;
    if (glyph > 0.0) {
      vec2 local = px - cell * cellPx;
      vec2 uv = vec2((glyph * cellPx.x + local.x) / (glyphCount * cellPx.x), 1.0 - local.y / cellPx.y);
      coverage = texture(tGlyphs, uv).r;
    }
    vec3 calm = mix(c, vec3(lum), muted);
    vec3 hue = calm / max(max(max(calm.r, calm.g), calm.b), 1e-3);
    vec3 col = clamp(max(calm * ink, hue * inkFloor), 0.0, 1.0);
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

function fullScreen(material: THREE.ShaderMaterial) {
  const quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
  quad.frustumCulled = false;
  const scene = new THREE.Scene();
  scene.add(quad);
  return scene;
}

/** Cell history: colour + stroke per cell, two of them so each frame reads the last and writes the next. */
const cellTarget = () =>
  new THREE.WebGLRenderTarget(1, 1, { count: 2, type: THREE.HalfFloatType, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter });

export function createAsciiPass() {
  let [prev, next] = [cellTarget(), cellTarget()];
  let fresh = true;
  let last = performance.now();

  const cell = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader,
    fragmentShader: cellShader,
    uniforms: {
      tColor: { value: null },
      tPrevColor: { value: null },
      tPrevStroke: { value: null },
      blend: { value: 1 },
      snapLo: { value: SETTINGS.snapLo },
      snapHi: { value: SETTINGS.snapHi },
    },
  });
  const draw = new THREE.ShaderMaterial({
    glslVersion: THREE.GLSL3,
    vertexShader,
    fragmentShader: drawShader,
    uniforms: {
      tCellColor: { value: null },
      tCellStroke: { value: null },
      tGlyphs: { value: null },
      grid: { value: new THREE.Vector2() },
      cellPx: { value: new THREE.Vector2() },
      canvasH: { value: 0 },
      glyphCount: { value: GLYPHS.length },
      paper: { value: new THREE.Vector3(...SETTINGS.paper) },
      ...Object.fromEntries(
        (["density", "ink", "inkFloor", "muted", "stroke"] as const).map((k) => [k, { value: SETTINGS[k] }]),
      ),
    },
  });
  const cellScene = fullScreen(cell);
  const drawScene = fullScreen(draw);
  const camera = new THREE.Camera();

  return {
    resize(grid: Grid, canvasH: number) {
      prev.setSize(grid.cols, grid.rows);
      next.setSize(grid.cols, grid.rows);
      fresh = true;
      const u = draw.uniforms;
      (u.tGlyphs.value as THREE.Texture | null)?.dispose();
      u.tGlyphs.value = glyphAtlas(grid);
      u.grid.value.set(grid.cols, grid.rows);
      u.cellPx.value.set(Math.round(grid.cellW * grid.dpr), Math.round(grid.cellH * grid.dpr));
      u.canvasH.value = canvasH;
    },
    /** `frame.motion` is how fast the camera or the figure moves (world units/s); any real motion turns easing off. */
    render(renderer: THREE.WebGLRenderer, frame: { color: THREE.Texture; motion: number }) {
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      cell.uniforms.tColor.value = frame.color;
      cell.uniforms.tPrevColor.value = prev.textures[0];
      cell.uniforms.tPrevStroke.value = prev.textures[1];
      const eased = 1 - Math.exp(-dt * SETTINGS.ease);
      const moving = Math.min(1, frame.motion / SETTINGS.stillBelow);
      cell.uniforms.blend.value = fresh ? 1 : eased + (1 - eased) * moving;
      fresh = false;
      renderer.setRenderTarget(next);
      renderer.render(cellScene, camera);

      draw.uniforms.tCellColor.value = next.textures[0];
      draw.uniforms.tCellStroke.value = next.textures[1];
      renderer.setRenderTarget(null);
      renderer.render(drawScene, camera);
      [prev, next] = [next, prev];
      return cell.uniforms.blend.value as number;
    },
  };
}
