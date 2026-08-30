import * as THREE from "three";
import { VOLUMES } from "./data";
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

/**
 * For each volume, run every painter in `materials.ts` and lay its source
 * canvas out under a label, so the verification harness — and a human — can
 * actually look at what the texture layer produces.
 */
export function mountTextureProbe(el: HTMLElement) {
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

  el.appendChild(
    row("shared", [{ name: "contact shadow", texture: makeContactShadowTexture() }]),
  );

  for (const v of VOLUMES) {
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
