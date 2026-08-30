# Shelf → Carousel → Reading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clicking a shelf bay empties it — the books arc out of the carcass into a scrollable carousel, any one can be picked up and read with a hinged cover and turnable pages, and closing gathers them home.

**Architecture:** One `mode` state machine in `scene.ts` drives three resting states (`shelf`, `browse`, `reading`) and four timed transitions (`spreading`, `regrouping`, `opening`, `closing`). Books become multi-pivot rigs rather than textured boxes. Every transition is a pose interpolator: capture the world matrix, lerp/slerp to a computed destination under `smootherstep`.

**Tech Stack:** TypeScript 5.5, Vite 5.4, Three.js r165 (with `examples/jsm` addons: `OrbitControls`, `RoomEnvironment`, `RoundedBoxGeometry`, `RectAreaLightUniformsLib`). No test runner — verification is `tsc --noEmit` plus a headless-Chrome harness built in Task 1.

**Spec:** `docs/superpowers/specs/2026-08-29-shelf-carousel-design.md`

## Global Constraints

- **Three.js is r165.** Addons import from `three/examples/jsm/...`. Do not add dependencies; all four addons are already in `node_modules`.
- **Reference implementation** lives at `/private/tmp/threeui-complete-shelf-v2.lean.html` (base64 blobs stripped; line numbers in this plan refer to this file). Full original at `/private/tmp/threeui-complete-shelf-v2.html`. If missing, re-fetch:
  `curl -sSL -o /private/tmp/threeui-complete-shelf-v2.html https://threeui.com/landing-pages/complete-shelf-v2.html`
  then `awk 'length($0) > 5000 { print "[ELIDED]"; next } { print }' /private/tmp/threeui-complete-shelf-v2.html > /private/tmp/threeui-complete-shelf-v2.lean.html`
- **No new runtime assets.** Every texture is painted on a canvas at runtime. Nothing is fetched. The reference's embedded WebP cover atlas is NOT used — implement its atlas-absent branch instead (`makeCoverTexture`, lean file lines 2437–2486).
- **Page ground stays light.** `--bone: #ebe6dc` / `--ink: #23324f` in `src/styles/tokens.css` govern the hero and page. Only the library section retints per book.
- **`Dimural_Murat.pdf` must never be committed.** It is in the repo root and gitignored. Never `git add -A` from the repo root; stage explicit paths.
- **Push every commit.** `git push` after each task's commit.
- **Motion constants are exact.** Where this plan gives a number (`STAGGER = 0.06`, `k = 178`, `/ 140`), use it verbatim — these are tuned values lifted from the reference, not suggestions.
- **`prefers-reduced-motion: reduce` collapses every transition to a single-frame settle.** Every animated system needs its reduced-motion branch in the same task that introduces it, not retrofitted later.

---

## File Structure

| File | State after plan | Responsibility |
|---|---|---|
| `scripts/verify.mjs` | new (Task 1) | Headless-Chrome harness: drives the page, asserts, screenshots |
| `src/library/debug.ts` | new (Task 1) | `window.__library` test surface, dev-only |
| `src/library/data.ts` | extended (Task 2) | Volume records, bays, the new per-volume fields |
| `src/library/materials.ts` | grown (Task 3) | All canvas texture painters |
| `src/library/motifs.ts` | new (Task 3) | `drawMotif` — the six per-volume cover devices |
| `src/library/rig.ts` | new (Task 4), replaces `book.ts` | `createBookRig` — geometry, materials, pivot tree |
| `src/library/pages.ts` | new (Task 5) | `updateFlexiblePage`, `updatePaginatedBook` |
| `src/library/room.ts` | reworked (Task 6) | `shelfStage`, carcass, floor, wall, lights, environment |
| `src/library/poses.ts` | new (Task 7) | The four pose interpolators |
| `src/library/carousel.ts` | new (Task 7) | Slot maths: `slotFor`, `snapRigToSlot`, `updateCarousel` |
| `src/library/theme.ts` | new (Task 9) | `applyBookTheme`, `updateTheme` |
| `src/library/gestures.ts` | new (Task 11) | `pageDrag` and `detailPress` machines |
| `src/library/scene.ts` | reworked (Tasks 7–11) | Mode machine, raycasting, render loop |
| `src/library/index.ts` | grown (Task 10) | Browse UI, detail panel, markers, keyboard, live region |
| `src/styles/library.css` | grown (Task 10) | Browse UI and detail panel |
| `src/library/book.ts` | deleted (Task 4) | — |

---

## Task 1: Verification harness

There is no test runner in this project and adding one for a WebGL scene would
not pay for itself. Instead, build the thing that actually proves this work:
a script that boots the dev server, drives the page in headless Chrome through
real interactions, asserts on a debug surface the scene exposes, and writes
screenshots. Every later task adds cases to it.

**Files:**
- Create: `scripts/verify.mjs`
- Create: `src/library/debug.ts`
- Modify: `src/main.ts`
- Modify: `tsconfig.json` (add Vite's client types)
- Modify: `package.json` (add `verify` script)
- Modify: `.gitignore` (ignore `shots/`)

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `installDebug(surface: () => LibraryDebug): void` from `debug.ts` — attaches a lazy getter at `window.__library`.
  - `LibraryDebug` interface: `{ mode: string; bay: string; selectedIndex: number; readingOpen: boolean; spread: number; bookCount: number; ready: boolean }`.
  - `npm run verify` — exits non-zero on any failed assertion or console error.

- [ ] **Step 1: Let TypeScript see `import.meta.env`**

`tsconfig.json` has no `types` entry, so `import.meta.env` fails `tsc --noEmit`.
Add to `compilerOptions`:

```json
"types": ["vite/client"],
```

- [ ] **Step 2: Write the debug surface**

`src/library/debug.ts`:

```ts
/**
 * A read-only window onto scene state, for the headless verification harness.
 * Attached in dev only; `scripts/verify.mjs` is its sole consumer.
 */
export interface LibraryDebug {
  mode: string;
  bay: string;
  selectedIndex: number;
  readingOpen: boolean;
  spread: number;
  bookCount: number;
  ready: boolean;
}

declare global {
  interface Window {
    __library?: LibraryDebug;
  }
}

export function installDebug(surface: () => LibraryDebug) {
  if (!import.meta.env.DEV) return;
  Object.defineProperty(window, "__library", {
    configurable: true,
    get: surface,
  });
}
```

- [ ] **Step 3: Install a placeholder surface so the harness has something to read**

In `src/main.ts`, after the existing `mountLibrary` call:

```ts
import { installDebug } from "./library/debug";

installDebug(() => ({
  mode: "shelf",
  bay: "experience",
  selectedIndex: 0,
  readingOpen: false,
  spread: 0,
  bookCount: 0,
  ready: true,
}));
```

This is replaced by the real surface in Task 7. It exists now so the harness
can be written and proven against the current site.

- [ ] **Step 4: Write the harness**

`scripts/verify.mjs`. Note `puppeteer-core` is resolved from `/private/tmp`,
NOT from this repo — the repo must not vendor it.

```js
import { spawn } from "node:child_process";
import { mkdir, rm } from "node:fs/promises";
import process from "node:process";

const PUPPETEER = process.env.PUPPETEER_PATH
  ?? "/private/tmp/node_modules/puppeteer-core/lib/esm/puppeteer/puppeteer-core.js";
const CHROME = process.env.CHROME_PATH
  ?? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome";
const PORT = 5178;
const ORIGIN = `http://localhost:${PORT}`;
const SHOTS = new URL("../shots/", import.meta.url).pathname;

const VIEWPORTS = [
  { name: "wide", width: 1440, height: 900 },
  { name: "laptop", width: 1280, height: 800 },
  { name: "phone", width: 390, height: 844 },
];

const failures = [];
function check(label, condition, detail = "") {
  if (condition) {
    console.log(`  ok   ${label}`);
  } else {
    console.log(`  FAIL ${label}${detail ? ` — ${detail}` : ""}`);
    failures.push(label);
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function startServer() {
  const server = spawn(
    "npx",
    ["vite", "--port", String(PORT), "--strictPort"],
    { cwd: new URL("..", import.meta.url).pathname, stdio: ["ignore", "pipe", "pipe"] },
  );
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error("vite did not start")), 30000);
    server.stdout.on("data", (chunk) => {
      if (String(chunk).includes("ready in")) {
        clearTimeout(timer);
        resolve();
      }
    });
    server.on("error", reject);
  });
  return server;
}

/** Never `networkidle` — fonts come from Google and the hero animates to ~1.2s. */
async function settle(page) {
  await page.evaluate(() => document.fonts.ready);
  await sleep(3000);
}

async function debugState(page) {
  return page.evaluate(() => window.__library ?? null);
}

async function main() {
  await rm(SHOTS, { recursive: true, force: true });
  await mkdir(SHOTS, { recursive: true });

  const server = await startServer();
  const { default: puppeteer } = await import(PUPPETEER);
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: "new",
    args: ["--use-gl=angle", "--use-angle=swiftshader", "--enable-unsafe-swiftshader"],
  });

  try {
    for (const viewport of VIEWPORTS) {
      console.log(`\n${viewport.name} ${viewport.width}x${viewport.height}`);
      const page = await browser.newPage();
      const noise = [];
      page.on("console", (message) => {
        if (message.type() === "error" || message.type() === "warning") {
          noise.push(`${message.type()}: ${message.text()}`);
        }
      });
      page.on("pageerror", (error) => noise.push(`pageerror: ${error.message}`));
      await page.setViewport({ ...viewport, deviceScaleFactor: 2 });
      await page.goto(ORIGIN, { waitUntil: "domcontentloaded" });
      await settle(page);

      const state = await debugState(page);
      check(`${viewport.name}: debug surface present`, state !== null);
      check(`${viewport.name}: scene ready`, state?.ready === true);
      await page.screenshot({ path: `${SHOTS}${viewport.name}-load.png`, fullPage: true });

      check(`${viewport.name}: console clean`, noise.length === 0, noise.slice(0, 3).join(" | "));
      await page.close();
    }
  } finally {
    await browser.close();
    server.kill();
  }

  console.log("");
  if (failures.length) {
    console.log(`${failures.length} failure(s)`);
    process.exit(1);
  }
  console.log("all checks passed");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
```

- [ ] **Step 5: Wire the npm script and ignore the output**

In `package.json` `scripts`, add:

```json
"verify": "node scripts/verify.mjs"
```

Append to `.gitignore`:

```
shots/
```

- [ ] **Step 6: Run it and confirm it passes against the current site**

Run: `npm run verify`
Expected: three viewport blocks, `debug surface present` / `scene ready` / `console clean` ok in each, `all checks passed`, exit 0. Three PNGs in `shots/`.

- [ ] **Step 7: Prove the harness can fail**

Temporarily change `ready: true` to `ready: false` in `src/main.ts`, run `npm run verify`.
Expected: `FAIL wide: scene ready`, exit code 1. Revert the change and re-run to confirm green.

- [ ] **Step 8: Commit**

```bash
git add scripts/verify.mjs src/library/debug.ts src/main.ts tsconfig.json package.json .gitignore
git commit -m "Add a headless verification harness for the library scene"
git push
```

---

## Task 2: Extend the volume data

**Files:**
- Modify: `src/library/data.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: the extended `Volume` interface below, plus `VolumePalette`. Every later task reads these fields.

- [ ] **Step 1: Add the palette type and extend `Volume`**

Add to `src/library/data.ts`, above `Volume`:

```ts
/** Room colours a volume brings with it when selected. */
export interface VolumePalette {
  paper: string;
  paperDeep: string;
  paperPale: string;
  ink: string;
  inkSoft: string;
  wall: string;
  shelf: string;
  shelfDark: string;
  light: string;
  fill: string;
}

export type MotifKey =
  | "brackets"
  | "paths"
  | "lattice"
  | "orbit"
  | "strata"
  | "vault";
```

Extend the `Volume` interface with these fields, keeping every existing one:

```ts
  /** Roman numeral stamped on cover and running heads. */
  roman: string;
  /** Two or three words under the title on the cover. */
  discipline: string;
  /** One line, shown under the title while browsing. */
  note: string;
  /** A paragraph, shown on the detail panel and an interior page. */
  deck: string;
  binding: string;
  format: string;
  /** A short phrase printed beneath the plate. */
  theme: string;
  motifKey: MotifKey;
  /** Exactly two — they head the two chapter pages. */
  chapters: [string, string];
  palette: VolumePalette;
  /** Fixed, so procedural grain is identical between reloads. */
  seed: number;
  /** Cover dimensions in world units. `depth` already exists. */
  width: number;
  height: number;
```

- [ ] **Step 2: Fill in every field for all six volumes**

Widths and heights vary so the carousel does not read as a repeated object.
Keep each `palette.paper` and `palette.wall` distinct from its neighbours.

```ts
// finaldose
roman: "I",
discipline: "Systems of record",
note: "The unglamorous layer everything else stands on.",
deck: "An AWS-deployed system of record for clinical lab data — ten interlinked entities, provisioned in Terraform, with data integrity built into the schema rather than bolted onto it.",
binding: "Ultramarine cloth · copper foil",
format: "148 × 216 mm",
theme: "Integrity at the schema level",
motifKey: "vault",
chapters: ["The spine", "The interface"],
palette: {
  paper: "#1b2740", paperDeep: "#121a2c", paperPale: "#eee7db",
  ink: "#f2ece2", inkSoft: "#b4b3ae", wall: "#1b2740",
  shelf: "#3a2a1d", shelfDark: "#1d130c",
  light: "#f2d9bb", fill: "#9fb3c9",
},
seed: 11, width: 1.02, height: 1.58,

// uoft-research
roman: "II",
discipline: "Adaptive systems",
note: "Award-winning research, turned into a product.",
deck: "Commercializing adaptive AI research — an XPrize winner with $2M+ in grants — through customer discovery, and a notification engine that learns each user's moment.",
binding: "Pine cloth · copper foil",
format: "156 × 228 mm",
theme: "Research into product",
motifKey: "orbit",
chapters: ["Discovery", "The engine"],
palette: {
  paper: "#1d322f", paperDeep: "#132220", paperPale: "#ece8dc",
  ink: "#eeeae0", inkSoft: "#aeb3ac", wall: "#1d322f",
  shelf: "#35291b", shelfDark: "#1a120a",
  light: "#f0dcb6", fill: "#a6c0b6",
},
seed: 23, width: 0.98, height: 1.52,

// beau-vision
roman: "III",
discipline: "Applied interfaces",
note: "Seven features, two thousand people waiting.",
deck: "React WebAR in production — a landing page, a virtual makeup try-on and a marketplace, plus the datasets and the exploratory QA that kept them standing up.",
binding: "Sienna cloth · bone foil",
format: "140 × 210 mm",
theme: "Interface as the product",
motifKey: "lattice",
chapters: ["Surfaces", "Defects"],
palette: {
  paper: "#4a2a1c", paperDeep: "#301a10", paperPale: "#f2e8d8",
  ink: "#f4ebdd", inkSoft: "#c3b4a3", wall: "#4a2a1c",
  shelf: "#42301f", shelfDark: "#22160d",
  light: "#f6dcb4", fill: "#d0b39a",
},
seed: 37, width: 1.06, height: 1.61,

// lazarus
roman: "IV",
discipline: "Autonomous reasoning",
note: "Rescuing drug programs that were written off.",
deck: "An autonomous clinical R&D platform routing real-world data through a five-agent reasoning pipeline, streaming fourteen live steps over WebSockets onto a knowledge graph.",
binding: "Slate cloth · copper foil",
format: "152 × 224 mm",
theme: "Evidence into a blueprint",
motifKey: "paths",
chapters: ["The pipeline", "The graph"],
palette: {
  paper: "#26313c", paperDeep: "#182129", paperPale: "#ebe7de",
  ink: "#eeeae2", inkSoft: "#afb4b8", wall: "#26313c",
  shelf: "#38291d", shelfDark: "#1c130c",
  light: "#eedcc0", fill: "#a8bdc9",
},
seed: 41, width: 1.0, height: 1.66,

// ghost-protocol
roman: "V",
discipline: "Adversarial security",
note: "Ninety percent recall, dropped to forty-five.",
deck: "A security agent that stress-tests fraud detection, adapting its attack through a four-node state machine that re-routes on the defender's own feedback.",
binding: "Moss cloth · copper foil",
format: "144 × 212 mm",
theme: "Attack as a form of proof",
motifKey: "brackets",
chapters: ["The state machine", "The report"],
palette: {
  paper: "#232d26", paperDeep: "#161e19", paperPale: "#e9e7da",
  ink: "#ece9de", inkSoft: "#a9b0a6", wall: "#232d26",
  shelf: "#33271a", shelfDark: "#191009",
  light: "#eedcb8", fill: "#a9bda6",
},
seed: 53, width: 0.95, height: 1.49,

// projectory
roman: "VI",
discipline: "Learning tools",
note: "Tutorials that write themselves around your project.",
deck: "A learn-by-building platform generating dynamic coding tutorials from prompt-based scaffolds inside a browser IDE, on a scheduled Azure back end.",
binding: "Ochre cloth · bone foil",
format: "150 × 220 mm",
theme: "Build in order to learn",
motifKey: "strata",
chapters: ["Scaffolds", "The loop"],
palette: {
  paper: "#453619", paperDeep: "#2c220f", paperPale: "#f1ead6",
  ink: "#f3ecda", inkSoft: "#c2b795", wall: "#453619",
  shelf: "#3e2e1c", shelfDark: "#1f160b",
  light: "#f6e0b0", fill: "#cbc196",
},
seed: 67, width: 1.04, height: 1.55,
```

- [ ] **Step 3: Verify it compiles and the fallback still lists everything**

Run: `npx tsc --noEmit`
Expected: clean.

Run: `npm run verify`
Expected: still all green — nothing renders these fields yet, but the type
change must not break the existing scene.

- [ ] **Step 4: Commit**

```bash
git add src/library/data.ts
git commit -m "Give each volume a palette, a motif, and its cover copy"
git push
```

---

## Task 3: Texture painters

The largest mechanical chunk, and the one with the least logic. Port the
reference's painters, adapted to the existing `canvas()` / `finish()` /
`drawCloth()` / `fitFont()` helpers already at the top of `materials.ts`.

**Files:**
- Create: `src/library/motifs.ts`
- Modify: `src/library/materials.ts`
- Modify: `scripts/verify.mjs` (add the texture contact sheet)
- Modify: `index.html` (add the probe container)
- Modify: `src/main.ts` (probe route)

**Interfaces:**
- Consumes: `Volume`, `VolumePalette`, `MotifKey` from Task 2.
- Produces, all from `materials.ts`:
  ```ts
  export function hashSeed(value: string): number
  export function seededRandom(seed: number): () => number
  export function makeCoverTexture(v: Volume): THREE.Texture
  export function makeFoilTexture(v: Volume): THREE.Texture
  export function makeSpineTexture(v: Volume): THREE.Texture      // exists, rewrite
  export function makeSpineFoilTexture(v: Volume): THREE.Texture
  export function makeBackCoverTexture(v: Volume): THREE.Texture
  export function makeBackFoilTexture(v: Volume): THREE.Texture
  export function makeEmbossMap(source: THREE.Texture, name: string): THREE.Texture
  export function makeClothBumpTexture(v: Volume): THREE.Texture
  export function makeClothSurfaceMaps(v: Volume): { normal: THREE.Texture; roughness: THREE.Texture }
  export function makeEndpaperTexture(v: Volume): THREE.Texture
  export function makePaperFaceTexture(v: Volume, printed?: boolean): THREE.Texture
  export function makeInteriorPageTextures(v: Volume): THREE.Texture[]   // exactly 8
  export function makePageEdgeTextures(v: Volume): { foreEdge: THREE.Texture; headTail: THREE.Texture }
  export function makeContactShadowTexture(): THREE.Texture
  ```
  and from `motifs.ts`:
  ```ts
  export function drawMotif(
    ctx: CanvasRenderingContext2D,
    motif: MotifKey, foil: string, seed: number,
    width: number, height: number,
  ): void
  ```

- [ ] **Step 1: Write the seeded random helpers**

These make every procedural texture identical between reloads, which is what
lets screenshot comparison mean anything. Add near the top of `materials.ts`:

```ts
export function hashSeed(value: string) {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i++) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/** Mulberry32 — small, fast, and stable across engines. */
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
```

Then replace the `Math.random()` calls in the existing `drawCloth` with a
`random: () => number` parameter threaded in from the caller, so cloth grain is
stable too.

- [ ] **Step 2: Write `motifs.ts`**

Six devices, each drawn in `foil` on a transparent ground, centred in the upper
two-thirds of the cover. Reference: `drawMotif` at lean line 2260. Each takes
the same signature and draws with `ctx.strokeStyle = foil`, `globalAlpha`
between 0.5 and 0.85, and a seeded jitter so no two volumes align exactly.

```ts
import type { MotifKey } from "./data";
import { seededRandom } from "./materials";

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
```

- [ ] **Step 3: Port the cover, foil, spine, and back painters**

Follow lean lines 2437–2486 (`makeCoverTexture`, atlas-absent branch),
2489–2522 (`makeFoilTexture`), 3083–3133 (`makeSpineTexture`), 3134–3170
(`makeSpineFoilTexture`), 3171–3218 (`makeBackCoverTexture`), 3219–3267
(`makeBackFoilTexture`).

Cover, at 768 × 1152: fill `v.cloth`; a left-to-right edge gradient
(`rgba(0,0,0,0.24)` → `rgba(255,255,255,0.035)` at 0.075 → `rgba(255,255,255,0.01)`
at 0.5 → `rgba(0,0,0,0.06)` at 0.94 → `rgba(0,0,0,0.19)`); 1,250 seeded grain
strokes 4–26 px at alternating white/black 0.024/0.025 alpha; two foil rules at
inset 42 and 55, `globalAlpha` 0.72, `lineWidth` 2; `drawMotif`; then in foil,
centred: `EX LIBRIS  /  ${v.roman}` in MONO 18px with 4px letter-spacing at
y = 92, the title in SERIF (88px, or 72px when longer than 10 characters) at
0.72 h, and `v.discipline.toUpperCase()` in MONO 16px at 0.79 h.

The foil map is a separate greyscale canvas holding only the foil marks — it
drives `alphaMap` and, through `makeEmbossMap`, `bumpMap`. Paint the same
lettering and motif in white on black.

- [ ] **Step 4: Port the cloth surface maps and emboss**

`makeClothSurfaceMaps` (lean 2566–2634) builds a height field from crossed sine
weaves at `phase = (seed % 19) * 0.23`, then differentiates it into a normal map
via central differences (`dx = (h(x+1,y) - h(x-1,y)) * 1.5`) and a roughness map
from the same field. `makeEmbossMap` (2635–2649) blurs a foil texture into a
bump map. Both must set `colorSpace = THREE.NoColorSpace` — they are data, not
colour. This is the single most common porting mistake here; a normal map in
sRGB makes the cloth look plastic.

- [ ] **Step 5: Port the paper and page painters**

`drawPaperSurface` (2650–2686), `makePaperFaceTexture` (2687–2736),
`drawWrappedCanvasText` (2737–2758), `makeEndpaperTexture` (2759–2796),
`makePageEdgeTextures` (2974–3025), `makeContactShadowTexture` (2953–2973).

`makeInteriorPageTextures` returns exactly 8 textures at 384 × 576 backing a
512 × 768 logical space (`ctx.scale(0.75, 0.75)`). Ink is
`new THREE.Color(v.cloth).lerp(new THREE.Color(0x211b16), 0.62)`. Every face
carries a running head — `EX LIBRIS  /  ${v.roman}` left, zero-padded folio
right, a hairline rule beneath, all at `globalAlpha` 0.58. Content per face,
matching the spec's table:

| Face | Content |
|---|---|
| 0 | `discipline` in MONO caps, `title` in SERIF, `note` beneath at 0.55 alpha |
| 1 | `CHAPTER 01`, `chapters[0]` in SERIF 49px, `lines[0]` wrapped at 0.52 alpha |
| 2 | `PLATE 01  /  SYSTEM MOTIF`, `drawMotif` in ink at 0.58, `theme` beneath |
| 3 | `CHAPTER 02`, `chapters[1]`, `lines[1]` wrapped |
| 4 | `NOTES`, `lines[2]` wrapped |
| 5 | `NOTES` continued — `lines[3]` if present, else paper only |
| 6 | `COLOPHON`, `tags` as a rule-separated list |
| 7 | `IMPRINT` — `subtitle`, `place`, `dates` |

- [ ] **Step 6: Add a texture probe route**

So the harness can actually look at these. In `index.html`, add inside `<main>`:

```html
<section class="probe" id="probe" hidden aria-label="Texture probe"></section>
```

In `src/main.ts`, before mounting the library:

```ts
const probe = new URLSearchParams(location.search).get("probe");
if (probe === "textures") {
  const { mountTextureProbe } = await import("./library/probe");
  mountTextureProbe(document.querySelector<HTMLElement>("#probe")!);
} else if (library) {
  mountLibrary(library);
}
```

Create `src/library/probe.ts` — for each volume, call every painter and append
its source canvas to the probe element under a label. Set
`window.__library = { ...ready: true }` when done so the harness can wait on it.

- [ ] **Step 7: Add the contact sheet to the harness**

In `scripts/verify.mjs`, after the per-viewport loop, add:

```js
  const probe = await browser.newPage();
  await probe.setViewport({ width: 1400, height: 1000, deviceScaleFactor: 1 });
  await probe.goto(`${ORIGIN}/?probe=textures`, { waitUntil: "domcontentloaded" });
  await settle(probe);
  const painted = await probe.evaluate(() => document.querySelectorAll("#probe canvas").length);
  check("texture probe painted every canvas", painted >= 6 * 12, `got ${painted}`);
  await probe.screenshot({ path: `${SHOTS}textures.png`, fullPage: true });
  await probe.close();
```

- [ ] **Step 8: Verify**

Run: `npx tsc --noEmit` — clean.
Run: `npm run verify` — all green.
Then **open `shots/textures.png` and look at it.** Covers must be legible, foil
must read as metal-bright rather than washed out, page faces must have their
text inside the margins with no clipping, and normal maps must be the flat
lavender-blue of a tangent-space normal map, not a colour image.

- [ ] **Step 9: Commit**

```bash
git add src/library/materials.ts src/library/motifs.ts src/library/probe.ts \
        src/main.ts index.html scripts/verify.mjs
git commit -m "Paint every book surface: cloth, foil, spine, endpapers, pages"
git push
```

---

## Task 4: The book rig

**Files:**
- Create: `src/library/rig.ts`
- Delete: `src/library/book.ts`
- Modify: `src/library/scene.ts` (swap `createBook` for `createBookRig`, keep the old shelf behaviour otherwise)
- Modify: `src/library/probe.ts` (add a `?probe=rig` route)
- Modify: `scripts/verify.mjs`

**Interfaces:**
- Consumes: everything from Task 3.
- Produces:
  ```ts
  export interface BookRig {
    data: Volume;
    root: THREE.Group;        // layout transform
    motion: THREE.Group;      // idle sway, hover, parallax
    frontPivot: THREE.Group;
    backPivot: THREE.Group;
    pagePivots: THREE.Group[];        // exactly 6
    pageSurfaces: THREE.Mesh[];       // 12, front+back per leaf
    pageBlock: THREE.Mesh;
    hit: THREE.Mesh;
    contactShadow: THREE.Mesh;
    fadeMaterials: THREE.Material[];
    materials: THREE.Material[];
    base: { width: number; height: number; depth: number };
    opacity: number;
    lastOffset: number | null;
  }
  export function createBookRig(volume: Volume, index: number): BookRig
  export function disposeRig(rig: BookRig): void
  ```

- [ ] **Step 1: Build the pivot tree**

Reference: `createBookRig`, lean lines 3302–4020. Constants, verbatim:

```ts
const BOARD = 0.032;
const COVER_RADIUS = 0.0045;
const PAGE_RADIUS = 0.0025;
const SPINE_RADIUS = 0.0015;
const SPINE_BOARD_THICKNESS = 0.014;
const SPINE_WIDTH = 0.082;
```

Derived per volume: `pageWidth = width - 0.074`, `pageHeight = height - 0.068`,
`pageDepth = depth - 0.026`.

Pivot placement — these positions are the hinge lines and getting them wrong is
the difference between a cover that swings and a cover that pivots through the
text block:

```ts
backPivot.position.set(-width * 0.5, 0, -depth * 0.5 - BOARD * 0.5);
frontPivot.position.set(-width * 0.5, 0, depth * 0.5 + BOARD * 0.5);
// leaf i of 6:
pagePivot.position.set(-width * 0.5 + SPINE_WIDTH * 0.65, 0, pageDepth * 0.5 + 0.0015 + i * 0.0015);
pagePivot.userData.restZ = pagePivot.position.z;
pagePivot.userData.turnedZ = depth * 0.5 + BOARD + 0.004 + (5 - i) * 0.0015;
```

Note `leafOrder = 5 - pageIndex` — leaves are built back-to-front so leaf order
0 is the one you turn first. Faces 0–7 from Task 3 map to leaf orders 0–3
(`interiorPageMaterials[leafOrder * 2]` and `[leafOrder * 2 + 1]`); leaf orders
4 and 5 take the blank paper material.

Page sheets are `PlaneGeometry(1, 1, 18, 8)` scaled to
`(pageWidth - SPINE_WIDTH * 0.42, pageHeight - 0.014, 1)`, positioned at half
their width from the hinge, front at `z = +0.00022` and back at `-0.00022` with
`rotation.y = Math.PI`.

- [ ] **Step 2: Attach the flex state each sheet needs in Task 5**

On each page pivot:

```ts
pagePivot.userData.flex = {
  curve: 0, curveVelocity: 0, twist: 0, twistVelocity: 0,
  surfaces: [
    { geometry: frontGeometry, position: frontGeometry.attributes.position,
      base: Float32Array.from(frontGeometry.attributes.position.array), direction: 1 },
    { geometry: backGeometry, position: backGeometry.attributes.position,
      base: Float32Array.from(backGeometry.attributes.position.array), direction: -1 },
  ],
};
```

The `base` copy is the undeformed rest pose. Task 5 reads from it every frame
and writes into `position`; deforming in place would compound.

- [ ] **Step 3: Set every material transparent and collect it**

Every material gets `transparent: true` and goes into `fadeMaterials`. The
carousel's distance fade and the inactive bay's fade both work by walking that
one array, so a material left out will visibly fail to fade. `materials`
additionally holds the contact-shadow and hit materials, and exists for
`disposeRig`.

Boards use `RoundedBoxGeometry` from
`three/examples/jsm/geometries/RoundedBoxGeometry.js`.

- [ ] **Step 4: Add the hit proxy**

Raycasting against the deformed page geometry is both slow and unreliable. Add
an invisible `BoxGeometry(width, height, depth)` mesh named `hit` with
`visible` toggled by opacity, `material.visible = false`, and
`userData.index = index`. All carousel picking goes through this.

- [ ] **Step 5: Swap it into the existing scene**

In `scene.ts`, replace `createBook` with `createBookRig` and use
`rig.root` where `book.group` was, `rig.hit` in the raycast list. Leave the
current shelf-and-panel behaviour otherwise intact — this task only proves the
rig renders. Delete `src/library/book.ts`.

- [ ] **Step 6: Add the rig probe**

`?probe=rig` — one book alone, centred, on a neutral ground, with a
`?spread=N&open=X` query pair reserved for Task 5. Expose in the debug surface:
`bookCount`, plus `rigPivots: number` (should be 6).

- [ ] **Step 7: Verify**

Run: `npx tsc --noEmit` — clean.
Run: `npm run verify` — green, plus a new check that `rigPivots === 6`.
**Look at `shots/rig.png`:** the book must read as a bound object — visible
board overhang past the text block, a spine with a rounded profile, page edges
that are paper rather than a flat colour, and a contact shadow under it.

- [ ] **Step 8: Commit**

```bash
git add src/library/rig.ts src/library/scene.ts src/library/probe.ts scripts/verify.mjs
git rm src/library/book.ts
git commit -m "Rebuild the book as a rig: hinged boards, six leaves, a spine"
git push
```

---

## Task 5: Page physics

**Files:**
- Create: `src/library/pages.ts`
- Modify: `src/library/probe.ts`
- Modify: `scripts/verify.mjs`

**Interfaces:**
- Consumes: `BookRig` from Task 4.
- Produces:
  ```ts
  export const PAGINATED_LEAF_COUNT = 4;
  export const SPREAD_COUNT = 5;   // PAGINATED_LEAF_COUNT + 1
  export interface PageDragState { /* defined in Task 11; pass null until then */ }
  export function updateFlexiblePage(
    pivot: THREE.Group, targetCurve: number, delta: number,
    immediate?: boolean, targetTwist?: number,
  ): void
  export function updatePaginatedBook(
    rig: BookRig, delta: number, openAmount: number,
    spread: number, drag: PageDragState | null, hovered: boolean, reduced: boolean,
  ): void
  ```

- [ ] **Step 1: Write `updateFlexiblePage`**

The spring integrator and vertex write, exactly as specced. Reference lean
4467–4573. Curve spring `k = 178`, `c = 19`, clamped to `[-0.025, 0.19]`;
twist spring `k = 210`, `c = 21`, clamped to `[-0.12, 0.12]`; velocities
clamped to `±1.8` and `±1.6`. Step is `Math.min(delta, 0.033)`.

The deform, per vertex, reading `x` and `y` from `base`:

```ts
const u = x + 0.5;
const mappedU = direction > 0 ? u : 1 - u;
const arch = Math.sin(Math.PI * mappedU);
const freeEdgeLift = mappedU * mappedU * 0.16;
const shape = arch * 0.84 + freeEdgeLift;
const diagonalTwist = nextTwist * y * Math.pow(mappedU, 1.35);
const softRipple =
  nextTwist * Math.sin(mappedU * Math.PI * 2) *
  (1 - Math.min(1, Math.abs(y) * 1.65)) * 0.09;
const z = (nextCurve * shape * (1 + y * 0.14) + diagonalTwist + softRipple) * direction;
position.setXYZ(vertex, x, y, z);
```

Then `position.needsUpdate = true` and `geometry.computeVertexNormals()`.

**The early-out matters.** Before touching vertices, return when curve and
twist are both settled (deltas under `1e-5`). Without it every idle book pays
for 342 vertex writes and two normal recomputations every frame, six books
over.

- [ ] **Step 2: Write `updatePaginatedBook`**

Reference lean 4574–4698. Cover damps toward `(-Math.PI + 0.055) * openAmount`,
or toward `-0.16` when `openAmount === 0 && hovered && !reduced` — the hover
crack that hints the book opens. Damp speed is `reduced ? 1000 : 10.5`.

For leaf order `k < PAGINATED_LEAF_COUNT`:

```ts
const isTurned = k < spread;
const unturned = -0.038 + k * 0.008;
const turned = -Math.PI + 0.085 + k * 0.014;
```

with `position.z` interpolating `restZ → turnedZ` scaled by `openAmount`. Leaves
at `k >= PAGINATED_LEAF_COUNT` take `-0.006 + (k - 4) * 0.003` and stay at
`restZ`. Curve target is
`openAmount * (0.004 + Math.sin(Math.PI * turnProgress) * 0.082 + dragCurveBoost)`
where `turnProgress = |rotation.y| / Math.PI`.

Leave the `drag` branch as a no-op returning zero boosts for now; Task 11 fills
it in. Write the parameter and the branch so the shape is right — do not
restructure the function later.

`noUnusedParameters` is on in `tsconfig.json`, so the stub must genuinely read
the parameter. Write the guard as `if (drag !== null && drag.active) { ... }`
with an empty body comment rather than ignoring the argument, and do not
rename it to `_drag` — the name is part of the published interface.

- [ ] **Step 3: Drive it from the rig probe**

Extend `?probe=rig` to read `&open=` (0–1) and `&spread=` (0–4), and to run a
render loop for 1.5 s so the springs settle before the screenshot.

- [ ] **Step 4: Verify**

Add harness cases shooting the rig probe at `open=0`, `open=0.5`, `open=1`,
and `open=1&spread=2`.

Run: `npm run verify`
**Look at the four PNGs.** At `open=0.5` the cover must be genuinely mid-swing
with the leading page bowed, not flat. At `spread=2` two leaves must be lying
on the left board with their printed sides up, and the visible recto must be
face 4. Assert in the harness that `window.__library.spread === 2`.

- [ ] **Step 5: Commit**

```bash
git add src/library/pages.ts src/library/probe.ts scripts/verify.mjs
git commit -m "Make pages bend: spring-driven curve and twist per sheet"
git push
```

---

## Task 6: Room, lights, environment

**Files:**
- Modify: `src/library/room.ts`
- Modify: `src/library/scene.ts`

**Interfaces:**
- Produces:
  ```ts
  export const BAY_X: Record<Bay, number>
  export const SHELF_BOARD_TOP: number
  export const SHELF_REST_POSITION: THREE.Vector3
  export const SHELF_SUNK_POSITION: THREE.Vector3   // (0, -4.2, -3)
  export interface RoomHandles {
    shelfStage: THREE.Group;
    materials: { floor; wall; shelf; shelfDark; shadow };
    lights: { hemisphere; key; softKey; fill; rim; backFill; spineRake; pageRake };
  }
  export function createRoom(scene: THREE.Scene, renderer: THREE.WebGLRenderer): RoomHandles
  ```
  The named `materials` and `lights` handles exist so Task 9's `updateTheme`
  can retint by walking them. Do not inline these into `createRoom`.

- [ ] **Step 1: Put the carcass on a `shelfStage` group**

Everything that must sink away during `browse` — both bays, the boards, the
contact strip — parents to `shelfStage`. The floor and wall do not; they stay.
Keep the existing two-bay geometry at `BAY_X.experience = -1.55` and
`BAY_X.projects = 1.55`; it already reads well.

- [ ] **Step 2: Add the environment**

```ts
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";

RectAreaLightUniformsLib.init();
const pmrem = new THREE.PMREMGenerator(renderer);
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
```

This is what makes foil read as metal rather than as a bright colour. Dispose
the generator after — `pmrem.dispose()` — but keep the texture, and dispose the
texture in `dispose()`.

- [ ] **Step 3: Name the eight lights**

Reference lean 4164–4226. Hemisphere, key (directional, casts), softKey, fill,
rim, backFill, spineRake, pageRake. Return them all in `RoomHandles.lights`.
Keep the existing shadow-camera bounds from the current `addLights` — they are
already tuned to this wall.

- [ ] **Step 4: Verify**

Run: `npm run verify` — green.
**Look at `shots/wide-load.png`:** the shelf should look materially richer than
before — foil catching light, cloth with a visible tooth — without the palette
having moved off bone.

- [ ] **Step 5: Commit**

```bash
git add src/library/room.ts src/library/scene.ts
git commit -m "Light the room properly and put the carcass on a stage"
git push
```

---

## Task 7: The carousel and the fly-out

The centre of the whole plan.

**Files:**
- Create: `src/library/carousel.ts`
- Create: `src/library/poses.ts`
- Modify: `src/library/scene.ts`
- Modify: `src/main.ts` (real debug surface)
- Modify: `scripts/verify.mjs`

**Interfaces:**
- Produces:
  ```ts
  // carousel.ts
  export const SPACING = 1.5;
  export interface Slot { position: THREE.Vector3; rotation: THREE.Euler; scale: number; opacity: number }
  export function slotFor(index: number, position: number, count: number, height: number): Slot
  export function snapRigToSlot(rig: BookRig, slot: Slot): void
  export function updateCarousel(rigs: BookRig[], position: number, delta: number, reduced: boolean): void

  // poses.ts
  export const SPREAD_DURATION = 0.92;
  export const STAGGER = 0.06;
  export interface CapturedPose { position: THREE.Vector3; quaternion: THREE.Quaternion; scale: THREE.Vector3 }
  export function capturePose(object: THREE.Object3D): CapturedPose
  export function applySpreadPose(
    rigs: BookRig[], from: CapturedPose[], slots: Slot[],
    t: number, stagger: number,
  ): void
  ```

- [ ] **Step 1: Write `slotFor`**

The carousel wraps, so offsets are taken modulo the book count:

```ts
export function slotFor(index: number, position: number, count: number, height: number): Slot {
  let offset = index - position;
  offset -= Math.round(offset / count) * count;
  const distance = Math.abs(offset);
  const focus = 1 - clamp(distance, 0, 1);
  const fade = clamp((distance - 2.55) / 0.7, 0, 1);
  return {
    position: new THREE.Vector3(
      offset * SPACING,
      SHELF_BOARD_TOP + height * 0.5 + focus * 0.15,
      0.13 + focus * 0.24 - Math.min(distance, 2.8) * 0.07,
    ),
    rotation: new THREE.Euler(0, -offset * 0.105, -offset * 0.018),
    scale: 1 + focus * 0.09,
    opacity: 1 - smoothstep(fade),
  };
}
```

- [ ] **Step 2: Write `updateCarousel`**

Damp each rig toward its slot at `reduced ? 1000 : 12`, opacity at 18. Handle
the wrap seam: when `|offset - rig.lastOffset| > count * 0.5`, a book has just
jumped from one end to the other — snap its `position.x` and set `opacity = 0`
so it fades in at the new end instead of flying across frame. Store
`rig.lastOffset = offset` each call.

- [ ] **Step 3: Write the stagger**

```ts
export function applySpreadPose(rigs, from, slots, t, stagger) {
  const span = 1 - (rigs.length - 1) * stagger;
  rigs.forEach((rig, i) => {
    const local = clamp((t - i * stagger) / span, 0, 1);
    const eased = smootherstep(local);
    rig.root.position.lerpVectors(from[i].position, slots[i].position, eased);
    rig.root.quaternion.slerpQuaternions(
      from[i].quaternion,
      new THREE.Quaternion().setFromEuler(slots[i].rotation),
      eased,
    );
    const s = lerp(from[i].scale.x, slots[i].scale, eased);
    rig.root.scale.setScalar(s);
    // Arc up and out, so books clear the boards instead of passing through.
    rig.root.position.y += Math.sin(local * Math.PI) * 0.28;
    rig.root.position.z += Math.sin(local * Math.PI) * 0.18;
  });
}
```

With six books and `stagger = 0.06`, `span = 0.7`. Regrouping calls the same
function with `stagger = 0` and `from`/`slots` swapped.

- [ ] **Step 4: Wire the mode machine**

In `scene.ts`, replace the current `setBay` behaviour. State:

```ts
let mode: "shelf" | "spreading" | "browse" | "regrouping" | "opening" | "reading" | "closing" = "shelf";
let transitionTime = 0;
let position = 0;          // carousel position, fractional
let targetPosition = 0;
let selectedIndex = 0;
let wheelIdle = 0;
```

`openBay(bay)` guards on `mode === "shelf"`, captures poses via `capturePose`
for that bay's rigs, reparents them from `shelfStage` to `scene` (using
`scene.attach` so world transforms survive), computes destination slots, and
sets `mode = "spreading"`. The other bay's rigs fade to zero over the same
window. `shelfStage.position` lerps toward `SHELF_SUNK_POSITION` under
`smootherstep(t / 0.68)`.

On `t >= 1`: `mode = "browse"`, snap to final poses.

`closeBay()` mirrors it: `mode = "regrouping"`, stagger 0, destinations are the
original shelf slots, `shelfStage.position` lerps back over
`smootherstep((t - 0.24) / 0.76)` so the carcass is in place before the books
land. On finish, `shelfStage.attach(rig.root)` each book back.

Reduced motion calls the finish handler directly, as the reference does.

- [ ] **Step 5: Wheel, arrows, and selection**

```ts
function onWheel(event: WheelEvent) {
  if (mode !== "browse") return;
  event.preventDefault();
  const delta = Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
  targetPosition += clamp(delta * 0.0022, -0.72, 0.72);
  wheelIdle = 0.14;
}
```

In the loop while `mode === "browse"`: damp `position` toward `targetPosition`
at 9.5; when `wheelIdle` runs out, snap `targetPosition` to the nearest
integer; and when `Math.round(position)` changes, update the selection.
`navigate(direction)` sets `targetPosition = Math.round(targetPosition) + direction`.
`selectMarker(index)` takes the short way round the wrap.

Register the wheel listener with `{ passive: false }` — `preventDefault` on a
passive listener is a silent no-op, and this is easy to get wrong.

- [ ] **Step 6: Replace the debug surface with the real one**

In `scene.ts`, return a `debug()` accessor reporting live `mode`, `bay`,
`selectedIndex`, `bookCount`, `ready`. Wire it through `index.ts` to
`installDebug` in `main.ts`, replacing the Task 1 placeholder.

- [ ] **Step 7: Verify**

Add harness cases: click the Experience bay header; poll until
`__library.mode === "browse"` (with a 5 s timeout); screenshot. Take a
mid-transition shot by screenshotting 300 ms after the click without waiting.
Then dispatch two wheel events and assert `selectedIndex` advanced. Then press
Escape and poll until `mode === "shelf"`.

Run: `npm run verify`
**Look at `shots/wide-spreading.png`** — books must be at visibly different
points along their arcs. A shot where they move as a slab means the stagger
is not being applied.

- [ ] **Step 8: Commit**

```bash
git add src/library/carousel.ts src/library/poses.ts src/library/scene.ts \
        src/main.ts src/library/index.ts scripts/verify.mjs
git commit -m "Empty the shelf: books arc out into a scrollable carousel"
git push
```

---

## Task 8: Opening a book

**Files:**
- Modify: `src/library/poses.ts` (add `applyOpeningPose`, `applyClosingPose`)
- Modify: `src/library/scene.ts`

**Interfaces:**
- Produces: `DETAIL_TRANSITION_DURATION = 0.92`, `applyOpeningPose(...)`, `applyClosingPose(...)`, and on the scene `open(): void` / `close(): void`.

- [ ] **Step 1: Responsive inspect targets**

Reference lean 4021–4069. `configureResponsiveTargets()` sets, for
`narrow = viewWidth < 820`:

```ts
shelfCameraPosition.set(0, narrow ? 2.02 : 1.92, narrow ? 8.7 : 8.1);
shelfCameraTarget.set(0, narrow ? 1.57 : 1.55, 0);
inspectPosition.set(narrow ? 0 : -2.25, narrow ? 2.3 : 1.56, narrow ? 0.15 : 0);
inspectCameraPosition.set(narrow ? 0 : -0.52, narrow ? 2.46 : 1.78, narrow ? 5.7 : 5.25);
```

Plus `applyDetailViewOffset()` using `camera.setViewOffset` to slide the book
left of the panel on wide screens, and `getInspectScale()` sizing the book to
the space the panel leaves. Port both — they are what stop the book from
sitting behind the detail panel at awkward widths.

- [ ] **Step 2: Open and close**

`open()` guards on `mode === "browse"`, captures the selected rig's world
matrix, camera position and target, then interpolates to
`inspectPosition` / `inspectCameraPosition` under `smootherstep` over 0.92 s.
`close()` reverses to the rig's carousel slot. Both mirror lean 5208–5429.

Reading state — `readingOpen`, `spread` — resets to closed/0 on both.

- [ ] **Step 3: OrbitControls in reading only**

```ts
controls.enabled = mode === "reading";
controls.enableDamping = !reduced;
controls.enablePan = false;
controls.minDistance = 2.4;
controls.maxDistance = 7.5;
controls.minPolarAngle = Math.PI * 0.18;
controls.maxPolarAngle = Math.PI * 0.62;
```

Plus `resetInspectionView()` restoring `inspectCameraPosition` and target.

- [ ] **Step 4: Verify**

Harness: from `browse`, press Enter; poll `mode === "reading"`; screenshot.
Press `o` (Task 10 binds it to open the cover) — deferred; for now just assert
`readingOpen === false` and that the book is on screen. Escape back to
`browse`, assert the book returned to its slot by comparing
`selectedIndex` and a screenshot against the earlier `browse` shot.

- [ ] **Step 5: Commit**

```bash
git add src/library/poses.ts src/library/scene.ts
git commit -m "Pick a volume up: fly it to camera and let it be turned over"
git push
```

---

## Task 9: Per-book theme

**Files:**
- Create: `src/library/theme.ts`
- Modify: `src/library/scene.ts`
- Modify: `src/styles/library.css`

**Interfaces:**
- Produces:
  ```ts
  export function applyBookTheme(volume: Volume, handles: RoomHandles, scene: THREE.Scene, reduced: boolean): void
  export function updateTheme(delta: number, handles: RoomHandles, scene: THREE.Scene): boolean
  ```
  `updateTheme` returns whether it is still moving, so the render loop knows to
  keep requesting frames.

- [ ] **Step 1: Write it**

Reference lean 4265–4356. Set CSS custom properties on `documentElement`
(`--paper`, `--paper-deep`, `--paper-pale`, `--ink`, `--ink-soft`, `--walnut`,
`--walnut-deep`, `--rule`, `--accent` from `volume.foil`) and the `theme-color`
meta. Set `themeTargets` colours. Ease at `1 - Math.exp(-delta * 5.5)`, snapping
when the largest squared gap drops below `2.5e-6`.

**Scope the CSS properties to the library section, not `:root`.** The reference
themes its whole page; we must not. Set them on the `#library` element instead
of `documentElement`, and leave `tokens.css` untouched so the hero stays bone.
The `theme-color` meta is the one exception — it is global by nature; set it on
enter and restore `#efeae1` on return to `shelf`.

- [ ] **Step 2: Make the library CSS consume them**

In `library.css`, the browse UI and detail panel read `var(--paper)`,
`var(--ink)`, `var(--accent)` with the bone tokens as fallbacks:
`color: var(--ink, #23324f)`. Transition `background-color` and `color` over
`0.5s var(--ease-out)` so HTML and WebGL retint together.

- [ ] **Step 3: Call it**

`applyBookTheme` on selection change in `browse` and on entering `reading`. On
returning to `shelf`, apply a neutral bone palette so the room comes back to
where it started.

- [ ] **Step 4: Verify**

Harness: enter `browse`, screenshot; navigate two books, screenshot; assert the
`#library` computed `--paper` differs between the two. Return to `shelf` and
assert it is back to the bone value.

**Look at the shots.** This is the step the spec flags as a knowing override of
the no-dark-grounds preference. If the section reads as oppressive rather than
as a room dimming around a book, the documented fallback is to lift each
palette's `paper` and `wall` toward bone while keeping the hue shift — apply it
in `data.ts` and say so in the commit.

- [ ] **Step 5: Commit**

```bash
git add src/library/theme.ts src/library/scene.ts src/styles/library.css
git commit -m "Let each volume bring its own light into the room"
git push
```

---

## Task 10: Browse UI, detail panel, keyboard

**Files:**
- Modify: `index.html`
- Modify: `src/library/index.ts`
- Modify: `src/styles/library.css`

**Interfaces:**
- Consumes: the scene's `open`/`close`/`navigate`/`selectMarker`/`turnPage`/`setReadingOpen`.
- Produces: no new module exports; this is the DOM layer.

- [ ] **Step 1: Mark up the browse UI and panel**

Follow the reference's structure at lean 1626–1709, renamed to this project's
vocabulary: a counter (`01 / 03`), selection title and note, previous/next
round buttons, an "Open" text button, a marker `tablist`, and the microcopy
`Wheel · arrows · select`.

The detail panel is `role="dialog" aria-modal="true"` holding eyebrow, title,
deck, a `<dl>` of binding / format / theme / motif, page navigation with a
live page counter, and the `Open book` / `Reset view` buttons.

Bay headers become real `<button>`s — they are the entry point to the whole
interaction and must be reachable by keyboard.

- [ ] **Step 2: Style it**

Editorial, matching the existing hero: Literata for titles, IBM Plex Mono for
labels and counters, generous negative space, hairline rules. Panel slides in
from the right on wide screens and up from the bottom under 820 px. All colours
via the theme properties from Task 9.

- [ ] **Step 3: Keyboard**

| Key | `browse` | `reading` |
|---|---|---|
| `←` `→` | previous / next volume | previous / next spread |
| `Enter` | open the selected volume | — |
| `Space` | — | toggle the cover open |
| `Escape` | back to `shelf` | back to `browse` |
| `Home` / `End` | first / last volume | first / last spread |

Only bind when the library section is on screen, and never swallow a key when
focus is in a text field.

- [ ] **Step 4: Modal discipline**

Entering `reading`: `browseUi.inert = true`, panel `aria-hidden="false"` and
`inert = false`, focus to the close button. Leaving: reverse, and return focus
to whichever control opened it. Announce every state change through the polite
live region — selection, opening, each page turn, shelving.

- [ ] **Step 5: Verify**

Add a keyboard-only harness pass: Tab to the Experience bay button, Enter, poll
for `browse`, `→` twice, `Enter`, poll for `reading`, `Space`, poll for
`readingOpen === true`, `→` twice, assert `spread === 2`, `Escape`, `Escape`,
assert `mode === "shelf"`. No mouse events at all in this pass.

Also assert focus lands on the close button on entering `reading`, and returns
to the marker on leaving.

- [ ] **Step 6: Commit**

```bash
git add index.html src/library/index.ts src/styles/library.css
git commit -m "Give the shelf a reading-room interface and a keyboard route"
git push
```

---

## Task 11: Drag gestures

**Files:**
- Create: `src/library/gestures.ts`
- Modify: `src/library/pages.ts` (fill in the drag branch left stubbed in Task 5)
- Modify: `src/library/scene.ts`

**Interfaces:**
- Produces:
  ```ts
  export interface PageDragState {
    active: boolean; pointerId: number | null;
    startX: number; startY: number;
    progress: number; peakProgress: number; committed: boolean;
    progressVelocity: number; verticalBias: number;
    lastProgress: number; lastTime: number;
    direction: -1 | 0 | 1;
    kind: "cover-open" | "cover-close" | "page" | null;
  }
  export interface DetailPressState {
    active: boolean; pointerId: number | null;
    startX: number; startY: number; moved: boolean; allowClick: boolean;
  }
  export const PAGE_TURN_COMMIT_PROGRESS = 0.18;
  export const COVER_OPEN_COMMIT_PROGRESS = 0.16;
  export const COVER_CLOSE_COMMIT_PROGRESS = 0.2;
  export function createPageDrag(): PageDragState
  export function createDetailPress(): DetailPressState
  export function updatePageDragFromEvent(drag: PageDragState, event: PointerEvent, spread: number): void
  export function applyPageReleaseImpulse(rig: BookRig, drag: PageDragState, spread: number): void
  ```

- [ ] **Step 1: Port the two state machines**

Reference lean 4841–5143. The gating rule that makes this feel right rather
than twitchy: a drag only counts once horizontal travel clears 3 px **and**
exceeds `Math.abs(deltaY) * 0.72`. Progress is
`clamp(Math.max(0, signed) / 140, 0, 1)` for covers and `/ 150` for pages.

`peakProgress` latches `committed` once it passes the threshold — dragging back
does not un-commit, which is what lets a short decisive flick work.

Velocity smoothing, over clamped 8–80 ms frames:

```ts
const instant = clamp((drag.progress - drag.lastProgress) / elapsed, -8, 8);
drag.progressVelocity = lerp(drag.progressVelocity, instant, 0.42);
drag.verticalBias = lerp(drag.verticalBias, clamp(deltaY / 180, -1, 1), 0.36);
```

- [ ] **Step 2: Direction latching for pages**

Once horizontal travel passes 6 px, latch a direction — but only if a spread
exists that way (`spread < SPREAD_COUNT - 1` forward, `spread > 0` back).
Otherwise the direction stays 0 and the page does not move, so dragging past
the last page does nothing rather than tearing a leaf off the end.

- [ ] **Step 3: Release impulse**

On a committed page turn, pour velocity into the sheet's springs before calling
`turnPage`:

```ts
const speedResponse = clamp(Math.abs(drag.progressVelocity) / 5.5, 0.12, 1);
flex.curveVelocity = clamp(flex.curveVelocity + speedResponse * 0.46, -1.8, 1.8);
flex.twistVelocity = clamp(
  flex.twistVelocity + drag.verticalBias * 0.38
    + clamp(drag.progressVelocity / 5.5, -1, 1) * direction * 0.14,
  -1.6, 1.6,
);
```

- [ ] **Step 4: Fill in the drag branch in `updatePaginatedBook`**

The branch stubbed in Task 5. Only the leaf at `drag.direction > 0 ? spread : spread - 1`
responds. It interpolates `unturned → turned` by `smoothstep(drag.progress)`,
picks up a twist of
`direction * sin(π * dragProgress) * (0.014 + verticalBias * 0.026)`, and a
curve boost of `sin(π * dragProgress) * (0.032 + speedResponse * 0.064)`.

- [ ] **Step 5: Separate press from orbit**

`detailPress` exists so a click opens the book while a drag orbits the camera.
Record the down point; set `moved` past 16 px; allow the click only on an
unmoved pointerup. While `pageDrag.active`, `controls.enabled = false`; restore
on release. Use pointer capture on the canvas and release it in every exit path
— including `cancelPageDrag` — or a lost pointer will wedge the scene.

- [ ] **Step 6: Verify**

Harness, using `page.mouse`: in `reading` with the book closed, press on the
cover, move left 180 px over several steps, release; poll `readingOpen === true`.
Then press on the recto, move left 200 px, release; assert `spread === 1`.
Then a short 40 px drag and release; assert `spread` is unchanged — under the
commit threshold.

Also verify the vertical guard: a drag of 20 px horizontal and 120 px vertical
must leave `spread` unchanged.

- [ ] **Step 7: Commit**

```bash
git add src/library/gestures.ts src/library/pages.ts src/library/scene.ts
git commit -m "Open the cover and turn pages by hand"
git push
```

---

## Task 12: Reduced motion, fallback, and the full pass

**Files:**
- Modify: `src/library/scene.ts`
- Modify: `src/library/index.ts`
- Modify: `scripts/verify.mjs`

- [ ] **Step 1: Audit reduced motion**

Walk every animated system added in Tasks 5–11 and confirm its reduced-motion
branch exists and is reached: transitions settle in one frame, damp speeds go
to 1000, idle sway and pointer parallax are off, `controls.enableDamping` is
false, page springs settle immediately. Also handle a live change of the media
query, not just its value at load.

- [ ] **Step 2: Confirm the no-WebGL fallback still stands**

The existing `buildFallback()` catalog in `index.ts` must still render every
volume with all its lines, and must now also surface the new `deck` copy. It is
the outer guard and nothing in this plan should have touched it — verify by
launching with `--disable-gpu --disable-software-rasterizer` and asserting
`.shelf-static` is present with six items.

- [ ] **Step 3: Full verification matrix**

Extend the harness to run every state at all three viewports:
`shelf`, mid-`spreading`, `browse`, `browse` scrolled two slots, `reading`
closed, `reading` open at spread 2, and back at `shelf`. Plus the keyboard-only
pass, the reduced-motion pass, and the no-WebGL pass. Console must be clean of
errors and warnings throughout.

- [ ] **Step 4: Check `dispose()`**

Every geometry, material, and texture created per rig must be released in
`disposeRig`, and the PMREM texture and render target in the scene's
`dispose()`. Verify by entering and leaving the section twenty times in the
harness while sampling `renderer.info.memory` — geometries and textures must
level off rather than climb.

- [ ] **Step 5: Build**

Run: `npx tsc --noEmit` — clean.
Run: `npx vite build` — clean.
Run: `npm run verify` — all green.

- [ ] **Step 6: Commit**

```bash
git add src/library/scene.ts src/library/index.ts scripts/verify.mjs
git commit -m "Hold the whole shelf to reduced motion, no WebGL, and no leaks"
git push
```

---

## Self-review notes

**Spec coverage.** Every section of the spec maps to a task: Modes → 7, 8;
The fly-out → 7; The rig → 4; Page physics → 5; Gestures → 11; Theme → 9;
Content → 2, 3; Files → the File Structure table; Rendering → 6, 8;
Accessibility → 10, 12; Verification → 1, 12.

**Deferred-by-design.** Two forward references are deliberate and named where
they occur: `updatePaginatedBook`'s `drag` parameter is stubbed in Task 5 and
filled in Task 11 (so the signature never changes), and the debug surface is a
placeholder in Task 1 replaced in Task 7 (so the harness can be proven before
the scene it inspects exists).

**Naming.** `BookRig` throughout (never `BookHandle`, the name in today's
`book.ts`). `spread` is the reading position; `position` is the carousel
position; `selectedIndex` is the book. `openAmount` is the cover's 0–1, never
`presented`.

**Risk carried from the spec.** `scene.ts` sprawl — mitigated by extracting
`carousel.ts` and `poses.ts` in Task 7, before it grows rather than after.
