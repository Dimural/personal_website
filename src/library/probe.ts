import * as THREE from "three";
import { VOLUMES, type Volume } from "./data";
import { installDebug } from "./debug";
import {
  makeBackCoverTexture,
  makeBackFoilTexture,
  makeClothBumpTexture,
  makeClothSurfaceMaps,
  makeContactShadowTexture,
  makeCoverTexture,
  makeEmbossMap,
  makeEndpaperTexture,
  makeFoilTexture,
  makeInteriorPageTextures,
  makePageEdgeTextures,
  makePaperFaceTexture,
  makeSpineFoilTexture,
  makeSpineTexture,
} from "./materials";
import { createBookRig } from "./rig";
import { addLights } from "./room";

const STYLE = `
  #probe {
    display: block;
    background: #f4f1ea;
    padding: 24px;
    font-family: system-ui, sans-serif;
    color: #2a241c;
  }
  #probe .probe__row {
    margin-bottom: 28px;
  }
  #probe .probe__row-label {
    font-size: 13px;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin: 0 0 8px;
    color: #55503f;
  }
  #probe .probe__strip {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
    gap: 10px;
  }
  #probe .probe__cell {
    background: #ffffff;
    border: 1px solid #ddd6c4;
    border-radius: 6px;
    padding: 6px;
  }
  #probe .probe__cell-label {
    font-size: 10px;
    letter-spacing: 0.03em;
    color: #7a725c;
    margin: 0 0 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  #probe .probe__canvas {
    display: block;
    width: 100%;
    /* Fixed, regardless of the source's aspect ratio (a spine or a fore
       edge is 4:1) — see the comment on \`snapshot\` for why the page's
       total height has to stay bounded. */
    height: 140px;
    object-fit: contain;
    background: #1c1a16;
  }

  /* Detail route (\`?probe=textures&volume=<id>\`) — one volume's canvases at
     native, un-downscaled resolution, so the sheet can actually be read for
     micro-text and margins. A CSS multi-column layout keeps total page
     height under headless Chrome's ~8192px raster ceiling (see \`snapshot\`)
     without shrinking any canvas below its native size: every column is
     wide enough (820px) to hold the widest normal-sized texture (768px)
     un-scaled, and the two oversized edge textures break out of the column
     flow entirely via \`column-span: all\` so they never get squeezed. */
  #probe .probe__detail {
    column-width: 820px;
    column-gap: 20px;
  }
  #probe .probe__detail-cell {
    display: inline-block;
    width: 100%;
    box-sizing: border-box;
    break-inside: avoid;
    background: #ffffff;
    border: 1px solid #ddd6c4;
    border-radius: 6px;
    padding: 6px;
    margin: 0 0 20px;
  }
  #probe .probe__detail-cell--span {
    column-span: all;
  }
  #probe .probe__detail-row {
    display: flex;
    align-items: flex-start;
    gap: 20px;
  }
  #probe .probe__canvas--full {
    display: block;
    max-width: 100%;
    background: #1c1a16;
  }
`;

/**
 * Snapshot a canvas at thumbnail resolution, so it can be embedded more than
 * once (a `THREE.Texture` may share a canvas element across draws —
 * appending the same node twice would move it, not copy it) and so the
 * ~140 source canvases (some up to 2048px on a side) don't balloon the raster
 * work headless Chrome has to do to paint the page.
 */
function snapshot(source: HTMLCanvasElement) {
  const maxDim = 320;
  const scale = Math.min(1, maxDim / Math.max(source.width, source.height));
  const w = Math.max(1, Math.round(source.width * scale));
  const h = Math.max(1, Math.round(source.height * scale));
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(source, 0, 0, w, h);
  c.className = "probe__canvas";
  return c;
}

/**
 * Snapshot a canvas at its native resolution (no downscale) — for the
 * detail route only. Still copies rather than moving the live canvas
 * element, for the same sharing reason as \`snapshot\` above (the plain
 * paper-stock texture and the emboss maps both reuse another texture's
 * canvas node).
 */
function snapshotFull(source: HTMLCanvasElement) {
  const c = document.createElement("canvas");
  c.width = source.width;
  c.height = source.height;
  const ctx = c.getContext("2d")!;
  ctx.drawImage(source, 0, 0);
  c.className = "probe__canvas--full";
  return c;
}

function labelledCanvas(name: string, texture: THREE.Texture) {
  const wrap = document.createElement("div");
  const label = document.createElement("p");
  label.className = "probe__cell-label";
  label.textContent = name;
  wrap.appendChild(label);
  wrap.appendChild(snapshotFull(texture.image as HTMLCanvasElement));
  return wrap;
}

function detailCell(name: string, texture: THREE.Texture) {
  const wrap = document.createElement("div");
  wrap.className = "probe__detail-cell";
  wrap.appendChild(labelledCanvas(name, texture));
  return wrap;
}

function cell(name: string, texture: THREE.Texture) {
  const wrap = document.createElement("div");
  wrap.className = "probe__cell";
  const label = document.createElement("p");
  label.className = "probe__cell-label";
  label.textContent = name;
  wrap.appendChild(label);
  wrap.appendChild(snapshot(texture.image as HTMLCanvasElement));
  return wrap;
}

function row(title: string, entries: { name: string; texture: THREE.Texture }[]) {
  const section = document.createElement("div");
  section.className = "probe__row";
  const label = document.createElement("h3");
  label.className = "probe__row-label";
  label.textContent = title;
  section.appendChild(label);
  const strip = document.createElement("div");
  strip.className = "probe__strip";
  for (const { name, texture } of entries) strip.appendChild(cell(name, texture));
  section.appendChild(strip);
  return section;
}

/** Every painter output for one volume, run once and reused by both routes. */
function paintVolume(v: Volume) {
  const cover = makeCoverTexture(v);
  const coverFoil = makeFoilTexture(v);
  const spine = makeSpineTexture(v);
  const spineFoil = makeSpineFoilTexture(v);
  const back = makeBackCoverTexture(v);
  const backFoil = makeBackFoilTexture(v);
  const clothBump = makeClothBumpTexture(v);
  const clothMaps = makeClothSurfaceMaps(v);
  const coverEmboss = makeEmbossMap(coverFoil, `${v.id}-cover-emboss`);
  const endpaper = makeEndpaperTexture(v);
  const paperPlain = makePaperFaceTexture(v, false);
  const paperPrinted = makePaperFaceTexture(v, true);
  const interior = makeInteriorPageTextures(v);
  const edges = makePageEdgeTextures(v);

  return {
    cover, coverFoil, spine, spineFoil, back, backFoil, clothBump, clothMaps,
    coverEmboss, endpaper, paperPlain, paperPrinted, interior, edges,
  };
}

function volumeEntries(painted: ReturnType<typeof paintVolume>) {
  const { cover, coverFoil, spine, spineFoil, back, backFoil, clothBump, clothMaps,
    coverEmboss, endpaper, paperPlain, paperPrinted, interior, edges } = painted;
  const entries: { name: string; texture: THREE.Texture }[] = [
    { name: "cover", texture: cover },
    { name: "cover foil", texture: coverFoil },
    { name: "spine", texture: spine },
    { name: "spine foil", texture: spineFoil },
    { name: "back", texture: back },
    { name: "back foil", texture: backFoil },
    { name: "cloth bump", texture: clothBump },
    { name: "cloth normal", texture: clothMaps.normal },
    { name: "cloth roughness", texture: clothMaps.roughness },
    { name: "cover emboss", texture: coverEmboss },
    { name: "endpaper", texture: endpaper },
    { name: "paper (plain)", texture: paperPlain },
    { name: "paper (printed)", texture: paperPrinted },
    ...interior.map((texture, i) => ({ name: `page ${i + 1}`, texture })),
    { name: "fore edge", texture: edges.foreEdge },
    { name: "head/tail edge", texture: edges.headTail },
  ];
  return entries;
}

function unmountShellChrome(el: HTMLElement) {
  const style = document.createElement("style");
  style.textContent = STYLE;
  document.head.appendChild(style);

  // `hidden` alone loses to the site's own `display: flex` on these
  // sections, so force it inline.
  for (const id of ["#top", "#library"]) {
    const section = document.querySelector<HTMLElement>(id);
    if (section) section.style.display = "none";
  }

  el.hidden = false;
  el.innerHTML = "";
}

/**
 * The overview route (`?probe=textures`) — every painter for every volume,
 * as a contact sheet of 320px thumbnails. Kept intentionally low-resolution
 * so the whole library fits on one page under headless Chrome's raster
 * ceiling; see `mountVolumeDetail` for a route that trades breadth for
 * native resolution on a single volume.
 */
function mountOverview(el: HTMLElement) {
  unmountShellChrome(el);

  el.appendChild(
    row("shared", [{ name: "contact shadow", texture: makeContactShadowTexture() }]),
  );

  for (const v of VOLUMES) {
    const entries = volumeEntries(paintVolume(v));
    el.appendChild(row(`${v.roman} — ${v.title}`, entries));
  }

  installDebug(() => ({
    mode: "probe",
    bay: "experience",
    selectedIndex: 0,
    readingOpen: false,
    spread: 0,
    bookCount: VOLUMES.length,
    ready: true,
  }));
}

/**
 * The detail route (`?probe=textures&volume=<id>`) — one volume's ~23
 * canvases at full, un-downscaled resolution, so micro-text and page
 * margins can actually be judged from the committed artifact rather than
 * the overview's 320px thumbnails. Accepts any id from `VOLUMES`; an
 * unknown or missing id falls back to the first volume.
 */
function mountVolumeDetail(el: HTMLElement, volumeId: string) {
  unmountShellChrome(el);

  const v = VOLUMES.find((candidate) => candidate.id === volumeId) ?? VOLUMES[0];

  const heading = document.createElement("h3");
  heading.className = "probe__row-label";
  heading.textContent = `detail — ${v.roman} — ${v.title} (native resolution)`;
  el.appendChild(heading);

  const painted = paintVolume(v);
  const wrap = document.createElement("div");
  wrap.className = "probe__detail";

  wrap.appendChild(detailCell("cover", painted.cover));
  wrap.appendChild(detailCell("cover foil", painted.coverFoil));
  wrap.appendChild(detailCell("spine", painted.spine));
  wrap.appendChild(detailCell("spine foil", painted.spineFoil));
  wrap.appendChild(detailCell("back", painted.back));
  wrap.appendChild(detailCell("back foil", painted.backFoil));
  wrap.appendChild(detailCell("cloth bump", painted.clothBump));
  wrap.appendChild(detailCell("cloth normal", painted.clothMaps.normal));
  wrap.appendChild(detailCell("cloth roughness", painted.clothMaps.roughness));
  wrap.appendChild(detailCell("cover emboss", painted.coverEmboss));
  wrap.appendChild(detailCell("endpaper", painted.endpaper));
  wrap.appendChild(detailCell("paper (plain)", painted.paperPlain));
  wrap.appendChild(detailCell("paper (printed)", painted.paperPrinted));
  painted.interior.forEach((texture, i) => wrap.appendChild(detailCell(`page ${i + 1}`, texture)));

  // The two edge textures are unusually large (512×2048 / 2048×384) — break
  // them out of the column flow via `column-span: all` and place them side
  // by side, so neither gets squeezed into a normal column and neither adds
  // a second very tall segment to the page (see the STYLE comment above
  // `.probe__detail`).
  const edgeRow = document.createElement("div");
  edgeRow.className = "probe__detail-cell probe__detail-cell--span probe__detail-row";
  edgeRow.appendChild(labelledCanvas("fore edge", painted.edges.foreEdge));
  edgeRow.appendChild(labelledCanvas("head/tail edge", painted.edges.headTail));
  wrap.appendChild(edgeRow);

  el.appendChild(wrap);

  installDebug(() => ({
    mode: "probe",
    bay: "experience",
    selectedIndex: 0,
    readingOpen: false,
    spread: 0,
    bookCount: 1,
    ready: true,
  }));
}

/**
 * For each volume, run every painter in `materials.ts` and lay its source
 * canvas out under a label, so the verification harness — and a human — can
 * actually look at what the texture layer produces.
 *
 * `?probe=textures` alone renders the overview (every volume, downscaled
 * thumbnails). `?probe=textures&volume=<id>` renders one volume at full
 * resolution instead — see `mountVolumeDetail`.
 */
export function mountTextureProbe(el: HTMLElement) {
  const params = new URLSearchParams(location.search);
  if (params.has("volume")) {
    mountVolumeDetail(el, params.get("volume") ?? "");
    return;
  }
  mountOverview(el);
}

/**
 * The rig route (`?probe=rig`) — one book rig, alone, centred on a neutral
 * ground, so the harness can screenshot it and a human can judge whether
 * it reads as a bound object: board overhang, a rounded spine profile,
 * paper-like page edges, a contact shadow underneath.
 *
 * `?volume=<id>` swaps which volume builds the rig (defaults to the
 * first). `?spread=N&open=X` are accepted and otherwise ignored — the
 * query shape Task 5 will read to drive the page-turn and cover-open
 * state.
 */
export function mountRigProbe(el: HTMLElement) {
  // Hide the site chrome directly — this route wants a clean, full-bleed
  // canvas, not the texture route's padded contact-sheet card.
  for (const id of ["#top", "#library"]) {
    const section = document.querySelector<HTMLElement>(id);
    if (section) section.style.display = "none";
  }
  el.hidden = false;
  el.innerHTML = "";
  el.style.cssText = "display: block; margin: 0; padding: 0; background: #efe9dc;";

  const params = new URLSearchParams(location.search);
  const volumeId = params.get("volume");
  const volume = (volumeId && VOLUMES.find((v) => v.id === volumeId)) || VOLUMES[0];

  const canvasEl = document.createElement("canvas");
  canvasEl.style.cssText = "display: block; width: 100vw; height: 100vh;";
  el.appendChild(canvasEl);

  const width = window.innerWidth || 1280;
  const height = window.innerHeight || 800;

  const renderer = new THREE.WebGLRenderer({ canvas: canvasEl, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setSize(width, height, false);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#efe9dc");

  const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);

  const rig = createBookRig(volume, 0);
  scene.add(rig.root);

  // A plain, unbranded floor — the point is the rig, not the shelf room.
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: "#e3ddcf", roughness: 0.96 }),
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -rig.base.height * 0.5 - 0.02;
  ground.receiveShadow = true;
  scene.add(ground);

  addLights(scene);

  // A three-quarter, slightly elevated angle: reveals the front board's
  // overhang past the fore edge, the spine's rounded profile on the near
  // side, and the head edge (paper texture, headband) from above, with
  // enough room below the book to see the contact shadow on the ground.
  camera.position.set(-2.6, 1.7, 3.1);
  camera.lookAt(-0.05, -0.15, 0);

  renderer.render(scene, camera);

  installDebug(() => ({
    mode: "probe",
    bay: "experience",
    selectedIndex: 0,
    readingOpen: false,
    spread: 0,
    bookCount: 1,
    rigPivots: rig.pagePivots.length,
    ready: true,
  }));
}
