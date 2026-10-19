import * as THREE from "three";

import { FONT, type Grid } from "./grid";
import { MARGIN, SUPERSAMPLE } from "./scene3d";

// The rendered scene becomes coloured characters on a night-navy page, all on the GPU, in two passes:
//   1. cell pass (one pixel per cell): the cell's average colour and its stroke direction, EASED toward
//      the new frame instead of replaced, so characters change smoothly and never flicker. The history is
//      reprojected first (read where the same patch of ground was last frame), so it moves with the world
//      and walking neither smears nor shimmers;
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
  uniform mat4 unproject, prevViewProj; // this frame's NDC → world, and world → last frame's NDC

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
    // The history to ease toward is where this cell's patch of ground was last frame. Ground (y = 0) stands
    // in for depth: nearly everything is on it, and the camera only slides, so the error is a tiny parallax.
    // Nearest cell, never interpolated: blending between cells smeared into streaks while walking.
    vec2 cells = vec2(textureSize(tPrevColor, 0));
    vec2 ndc = (vec2(cell) + 0.5) / cells * 2.0 - 1.0;
    vec4 near = unproject * vec4(ndc, -1.0, 1.0);
    vec4 far = unproject * vec4(ndc, 1.0, 1.0);
    near /= near.w;
    far /= far.w;
    vec4 was = prevViewProj * vec4(mix(near.xyz, far.xyz, near.y / (near.y - far.y)), 1.0);
    vec2 uv = was.xy / was.w * 0.5 + 0.5;
    bool seen = near.y > far.y && all(greaterThanEqual(uv, vec2(0.0))) && all(lessThanEqual(uv, vec2(1.0)));

    ivec2 from = ivec2(min(uv * cells, cells - 1.0));
    vec3 prev = texelFetch(tPrevColor, from, 0).rgb;
    float b = seen ? mix(blend, 1.0, smoothstep(snapLo, snapHi, length(sum / 9.0 - prev))) : 1.0;
    outColor = vec4(mix(prev, sum / 9.0, b), 1.0);
    outStroke = vec4(mix(texelFetch(tPrevStroke, from, 0).xyz, tensor, b), 1.0);
  }
`;

const drawShader = /* glsl */ `
  precision highp float;
  out highp vec4 fragColor;

  uniform sampler2D tCellColor, tCellStroke, tGlyphs;
  uniform vec2 grid;      // cols, rows
  uniform vec2 cellPx;    // device pixels per cell
  uniform vec2 shift;     // the view's slide past the cell-locked render, in cells (x right, y up)
  uniform float canvasH;  // device pixels
  uniform float glyphCount;
  uniform vec3 paper;
  uniform float density, ink, inkFloor, muted, stroke;

  void main() {
    vec2 px = vec2(gl_FragCoord.x, canvasH - gl_FragCoord.y); // from the top-left
    if (px.x >= grid.x * cellPx.x || px.y >= grid.y * cellPx.y) { fragColor = vec4(paper, 1.0); return; }
    // Where this pixel falls on the rendered grid (bottom-up, ${MARGIN} cell of margin), slid by the fraction.
    // Whole device pixels, so every glyph keeps its exact shape as it glides.
    vec2 slide = floor(shift * cellPx + 0.5);
    vec2 r = vec2((px.x + slide.x) / cellPx.x, grid.y - (px.y - slide.y) / cellPx.y) + ${MARGIN}.0;
    ivec2 at = ivec2(floor(r));
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
      vec2 local = vec2(fract(r.x), 1.0 - fract(r.y)) * cellPx;
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

/** Cell history: colour + stroke per cell, two of them so each frame reads the last and writes the next.
 *  Linear filtering, because the reprojected history is read between cells. */
const cellTarget = () =>
  new THREE.WebGLRenderTarget(1, 1, { count: 2, type: THREE.HalfFloatType, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });

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
      unproject: { value: new THREE.Matrix4() },
      prevViewProj: { value: new THREE.Matrix4() },
    },
  });
  const viewProj = new THREE.Matrix4();
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
      shift: { value: new THREE.Vector2() },
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
      prev.setSize(grid.cols + 2 * MARGIN, grid.rows + 2 * MARGIN);
      next.setSize(grid.cols + 2 * MARGIN, grid.rows + 2 * MARGIN);
      fresh = true;
      const u = draw.uniforms;
      (u.tGlyphs.value as THREE.Texture | null)?.dispose();
      u.tGlyphs.value = glyphAtlas(grid);
      u.grid.value.set(grid.cols, grid.rows);
      u.cellPx.value.set(Math.round(grid.cellW * grid.dpr), Math.round(grid.cellH * grid.dpr));
      u.canvasH.value = canvasH;
    },
    /** `frame.camera` is the camera the scene was just rendered with; its motion reprojects the history. */
    render(renderer: THREE.WebGLRenderer, frame: { color: THREE.Texture; camera: THREE.Camera; shift: THREE.Vector2 }) {
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      cell.uniforms.tColor.value = frame.color;
      cell.uniforms.tPrevColor.value = prev.textures[0];
      cell.uniforms.tPrevStroke.value = prev.textures[1];
      cell.uniforms.prevViewProj.value.copy(viewProj);
      viewProj.multiplyMatrices(frame.camera.projectionMatrix, frame.camera.matrixWorldInverse);
      cell.uniforms.unproject.value.copy(viewProj).invert();
      cell.uniforms.blend.value = fresh ? 1 : 1 - Math.exp(-dt * SETTINGS.ease);
      fresh = false;
      renderer.setRenderTarget(next);
      renderer.render(cellScene, camera);

      draw.uniforms.shift.value.copy(frame.shift);
      draw.uniforms.tCellColor.value = next.textures[0];
      draw.uniforms.tCellStroke.value = next.textures[1];
      renderer.setRenderTarget(null);
      renderer.render(drawScene, camera);
      [prev, next] = [next, prev];
      return cell.uniforms.blend.value as number;
    },
  };
}
