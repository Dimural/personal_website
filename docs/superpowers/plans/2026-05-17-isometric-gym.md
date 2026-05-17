# Isometric Voxel Gym Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the first-person Three.js gym with a Crossy Road-style isometric voxel gym where a third-person character explores a 20×20 tile gym and interacts with equipment and props to reveal portfolio content and fun facts.

**Architecture:** All scene logic is split into focused modules under `js/gym/`. `js/main.js` is the entry point that imports these modules and runs the animation loop. `gym.html` and `css/style.css` are untouched except for copy changes to the welcome overlay and controls reminder.

**Tech Stack:** Three.js (via importmap CDN), Vitest (pure-logic unit tests), vanilla ES modules, existing DOM overlay structure in `gym.html`.

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `js/gym/content.js` | Create | All CONTENT data: portfolio sections + fun-fact props |
| `js/gym/math.js` | Create | Pure math: movement vectors, proximity, AABB overlap |
| `js/gym/math.test.js` | Create | Vitest tests for math.js |
| `js/gym/voxel.js` | Create | `box()` and `group()` helpers for building voxel objects |
| `js/gym/scene.js` | Create | 20×20 floor, walls, lighting, fog |
| `js/gym/equipment.js` | Create | 5 portfolio equipment stations |
| `js/gym/props.js` | Create | 6 fun-fact prop objects |
| `js/gym/player.js` | Create | Voxel character model + facing + bob animation |
| `js/gym/camera.js` | Create | Fixed isometric camera + smooth follow |
| `js/gym/controls.js` | Create | Keyboard input state, E-press detection |
| `js/gym/interaction.js` | Create | Proximity check, screen-space tooltip, panel open/close |
| `js/main.js` | Rewrite | Init, animation loop, `window.__initGym` |
| `gym.html` | Modify | Welcome overlay copy, crosshair removal, controls reminder |

---

## Task 1: Add Vitest and create content.js

**Files:**
- Modify: `package.json`
- Create: `vite.config.ts` (add test config)
- Create: `js/gym/content.js`

- [ ] **Step 1.1 — Install Vitest**

```bash
npm install -D vitest
```

Expected: vitest appears in `package.json` devDependencies.

- [ ] **Step 1.2 — Add test script and Vitest config to vite.config.ts**

Read current `vite.config.ts` first, then add the `test` block:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['js/**/*.test.js'],
  },
})
```

Also add `"test": "vitest run"` to the `scripts` section of `package.json`.

- [ ] **Step 1.3 — Create js/gym/content.js**

```js
// js/gym/content.js

export const CONTENT = {
  // ── Portfolio sections ────────────────────────────────────────
  benchPress: {
    title: 'Experience',
    label: 'Experience',
    icon: '💼',
    html: `
      <h3>Job Title — Company Name</h3>
      <p>Month Year – Present</p>
      <ul>
        <li>Describe what you did here</li>
        <li>Another accomplishment or responsibility</li>
        <li>Impact you made</li>
      </ul>
      <h3>Previous Role — Previous Company</h3>
      <p>Month Year – Month Year</p>
      <ul>
        <li>Describe what you did here</li>
        <li>Another accomplishment</li>
      </ul>
    `
  },
  dumbbellRack: {
    title: 'Skills',
    label: 'Skills',
    icon: '🛠️',
    html: `
      <h3>Languages</h3>
      <p>
        <span class="tag">JavaScript</span>
        <span class="tag">Python</span>
        <span class="tag">TypeScript</span>
        <span class="tag">C++</span>
        <span class="tag">SQL</span>
      </p>
      <h3>Frameworks & Tools</h3>
      <p>
        <span class="tag">React</span>
        <span class="tag">Node.js</span>
        <span class="tag">Three.js</span>
        <span class="tag">Git</span>
        <span class="tag">Docker</span>
        <span class="tag">AWS</span>
      </p>
      <h3>Soft Skills</h3>
      <p>
        <span class="tag">Problem Solving</span>
        <span class="tag">Team Leadership</span>
        <span class="tag">Communication</span>
      </p>
    `
  },
  treadmill: {
    title: 'Projects',
    label: 'Projects',
    icon: '🚀',
    html: `
      <h3>Project Name One</h3>
      <p>Brief description of the project. What problem did it solve? What tech did you use?</p>
      <ul>
        <li>Key feature or achievement</li>
        <li>Technologies used</li>
      </ul>
      <h3>Project Name Two</h3>
      <p>Brief description of another project.</p>
      <ul>
        <li>Key feature or achievement</li>
        <li>Technologies used</li>
      </ul>
      <h3>Project Name Three</h3>
      <p>Brief description of yet another project.</p>
      <ul>
        <li>Key feature or achievement</li>
        <li>Technologies used</li>
      </ul>
    `
  },
  pullUpBar: {
    title: 'Education',
    label: 'Education',
    icon: '🎓',
    html: `
      <h3>Degree — University Name</h3>
      <p>Expected Graduation: Month Year</p>
      <ul>
        <li>Relevant coursework or achievements</li>
        <li>GPA (if you want to include it)</li>
        <li>Clubs or organizations</li>
      </ul>
    `
  },
  punchingBag: {
    title: 'About Me',
    label: 'About Me',
    icon: '👋',
    html: `
      <p>Hey! I'm Dimural Murat. Welcome to my virtual gym — thanks for stopping by!</p>
      <p>I'm a software engineer passionate about building immersive digital experiences at the intersection of design, code, and craft.</p>
      <h3>What I'm about</h3>
      <ul>
        <li>Building things that people actually enjoy using</li>
        <li>Pushing the limits of what's possible in the browser</li>
        <li>Always learning something new</li>
      </ul>
    `
  },

  // ── Fun-fact props ────────────────────────────────────────────
  soccerBall: {
    title: 'Fun Fact',
    label: 'Soccer Ball',
    icon: '⚽',
    html: `
      <h3>Soccer is my sport</h3>
      <p>I'm a huge soccer fan and love playing whenever I get the chance. There's nothing quite like the energy of a live match.</p>
    `
  },
  boxingGloves: {
    title: 'Fun Fact',
    label: 'Boxing Gloves',
    icon: '🥊',
    html: `
      <h3>UFC & Boxing fan</h3>
      <p>I love watching UFC and boxing — the strategy, the conditioning, and the heart it takes to compete at that level fascinates me.</p>
    `
  },
  clapperboard: {
    title: 'Fun Fact',
    label: 'Film Board',
    icon: '🎬',
    html: `
      <h3>Movie enthusiast</h3>
      <p>From classic thrillers to the latest blockbusters, I love watching movies. Hit me up for a recommendation any time.</p>
    `
  },
  stethoscope: {
    title: 'Fun Fact',
    label: 'Stethoscope',
    icon: '🩺',
    html: `
      <h3>Almost a doctor</h3>
      <p>I originally set out to go into healthcare and become a doctor. But my love for coding turned out to be stronger — and here we are.</p>
    `
  },
  suitcase: {
    title: 'Fun Fact',
    label: 'Suitcase',
    icon: '✈️',
    html: `
      <h3>I love to travel</h3>
      <p>Exploring new places, cultures, and perspectives is one of my favorite things. Every trip teaches me something I bring back into my work.</p>
    `
  },
  lunchBox: {
    title: 'Fun Fact',
    label: 'Lunch Box',
    icon: '🍜',
    html: `
      <h3>Huge foodie</h3>
      <p>I love trying new food — different cuisines, hole-in-the-wall spots, anything adventurous. Good food is one of life's best experiences.</p>
    `
  },
};
```

- [ ] **Step 1.4 — Commit**

```bash
git add js/gym/content.js package.json vite.config.ts
git commit -m "feat: add content module and Vitest"
```

---

## Task 2: Pure math utilities and tests

**Files:**
- Create: `js/gym/math.js`
- Create: `js/gym/math.test.js`

- [ ] **Step 2.1 — Write the failing tests first**

```js
// js/gym/math.test.js
import { describe, it, expect } from 'vitest';
import { getMoveVector, isNearby, aabbOverlap } from './math.js';

describe('getMoveVector', () => {
  it('returns zero vector when no keys pressed', () => {
    const v = getMoveVector({ w: false, a: false, s: false, d: false });
    expect(v.x).toBe(0);
    expect(v.z).toBe(0);
  });

  it('returns a unit-length vector for a single key', () => {
    const v = getMoveVector({ w: true, a: false, s: false, d: false });
    const len = Math.sqrt(v.x ** 2 + v.z ** 2);
    expect(len).toBeCloseTo(1, 5);
  });

  it('returns unit length for diagonal (two keys)', () => {
    const v = getMoveVector({ w: true, a: false, s: false, d: true });
    const len = Math.sqrt(v.x ** 2 + v.z ** 2);
    expect(len).toBeCloseTo(1, 5);
  });

  it('W and S cancel out to zero', () => {
    const v = getMoveVector({ w: true, a: false, s: true, d: false });
    expect(v.x).toBe(0);
    expect(v.z).toBe(0);
  });

  it('A and D cancel out to zero', () => {
    const v = getMoveVector({ w: false, a: true, s: false, d: true });
    expect(v.x).toBe(0);
    expect(v.z).toBe(0);
  });
});

describe('isNearby', () => {
  it('returns true when distance is within radius', () => {
    expect(isNearby(0, 0, 1, 0, 2)).toBe(true);
  });

  it('returns false when distance exceeds radius', () => {
    expect(isNearby(0, 0, 3, 0, 2)).toBe(false);
  });

  it('returns true when exactly at radius boundary', () => {
    expect(isNearby(0, 0, 2, 0, 2)).toBe(true);
  });
});

describe('aabbOverlap', () => {
  // args: (ax, az, aw, ad, bx, bz, bw, bd)
  it('detects overlapping boxes', () => {
    expect(aabbOverlap(0, 0, 2, 2, 1, 0, 2, 2)).toBe(true);
  });

  it('returns false for separated boxes', () => {
    expect(aabbOverlap(0, 0, 1, 1, 3, 0, 1, 1)).toBe(false);
  });

  it('returns false for boxes that only touch at edge', () => {
    expect(aabbOverlap(0, 0, 2, 2, 2, 0, 2, 2)).toBe(false);
  });
});
```

- [ ] **Step 2.2 — Run tests to confirm they fail**

```bash
npm test
```

Expected: tests fail with "Cannot find module './math.js'"

- [ ] **Step 2.3 — Implement math.js**

```js
// js/gym/math.js

// Camera is at 45° azimuth. These are the XZ movement directions
// relative to how the isometric view appears on screen.
const CAM_AZIMUTH = Math.PI / 4;
const FWD   = { x: -Math.sin(CAM_AZIMUTH), z: -Math.cos(CAM_AZIMUTH) }; // W — into scene
const RIGHT  = { x:  Math.cos(CAM_AZIMUTH), z: -Math.sin(CAM_AZIMUTH) }; // D — screen-right

/**
 * Returns a normalised XZ movement vector for the given key state.
 * Returns {x:0, z:0} when no keys are held.
 */
export function getMoveVector(keys) {
  let x = 0, z = 0;
  if (keys.w) { x += FWD.x;    z += FWD.z; }
  if (keys.s) { x -= FWD.x;    z -= FWD.z; }
  if (keys.a) { x -= RIGHT.x;  z -= RIGHT.z; }
  if (keys.d) { x += RIGHT.x;  z += RIGHT.z; }
  const len = Math.sqrt(x * x + z * z);
  return len > 0 ? { x: x / len, z: z / len } : { x: 0, z: 0 };
}

/**
 * Returns the yaw angle (radians) the character should face
 * given a movement direction vector.
 */
export function facingAngle(dx, dz) {
  return Math.atan2(dx, dz);
}

/**
 * Returns true if (px, pz) is within `radius` of (ox, oz).
 */
export function isNearby(px, pz, ox, oz, radius) {
  const dx = px - ox, dz = pz - oz;
  return dx * dx + dz * dz <= radius * radius;
}

/**
 * Axis-aligned bounding box overlap test on XZ plane.
 * a/b are centres; aw/ad and bw/bd are full widths and depths.
 * Returns true when the boxes overlap (touching edges = false).
 */
export function aabbOverlap(ax, az, aw, ad, bx, bz, bw, bd) {
  return (
    ax - aw / 2 < bx + bw / 2 &&
    ax + aw / 2 > bx - bw / 2 &&
    az - ad / 2 < bz + bd / 2 &&
    az + ad / 2 > bz - bd / 2
  );
}
```

- [ ] **Step 2.4 — Run tests to confirm they pass**

```bash
npm test
```

Expected: all 8 tests pass.

- [ ] **Step 2.5 — Commit**

```bash
git add js/gym/math.js js/gym/math.test.js
git commit -m "feat: add pure math utilities with tests"
```

---

## Task 3: Voxel geometry builder helpers

**Files:**
- Create: `js/gym/voxel.js`

Note: Three.js is loaded via the importmap in `gym.html`, not via npm. These helpers will be imported only inside files that run in the browser context (not in Vitest tests, which have `environment: 'node'`). Do not import voxel.js from math.test.js.

- [ ] **Step 3.1 — Create voxel.js**

```js
// js/gym/voxel.js
import * as THREE from 'three';

/**
 * Creates a MeshLambertMaterial box mesh at the given local position.
 * @param {number} w width  @param {number} h height  @param {number} d depth
 * @param {number} color hex colour  @param {number} x  @param {number} y  @param {number} z
 */
export function box(w, h, d, color, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshLambertMaterial({ color })
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

/**
 * Creates a THREE.Group containing the given meshes.
 */
export function group(...meshes) {
  const g = new THREE.Group();
  meshes.forEach(m => g.add(m));
  return g;
}
```

- [ ] **Step 3.2 — Commit**

```bash
git add js/gym/voxel.js
git commit -m "feat: add voxel geometry helpers"
```

---

## Task 4: Room — floor, walls, lighting

**Files:**
- Create: `js/gym/scene.js`

- [ ] **Step 4.1 — Create scene.js**

```js
// js/gym/scene.js
import * as THREE from 'three';

export const ROOM = 20;  // 20×20 tiles
export const HALF = ROOM / 2; // 10 — room spans -10 to +10 on X and Z
const WALL_H = 3.5;

export function buildScene(threeScene) {
  threeScene.background = new THREE.Color(0xdce8f0);
  threeScene.fog = new THREE.FogExp2(0xdce8f0, 0.022);

  _buildFloor(threeScene);
  _buildWalls(threeScene);
  _buildLighting(threeScene);
}

function _buildFloor(threeScene) {
  const geo = new THREE.BoxGeometry(0.97, 0.1, 0.97);
  const matA = new THREE.MeshLambertMaterial({ color: 0xd4b896 });
  const matB = new THREE.MeshLambertMaterial({ color: 0xc8a880 });

  const posA = [], posB = [];
  for (let x = 0; x < ROOM; x++) {
    for (let z = 0; z < ROOM; z++) {
      ((x + z) % 2 === 0 ? posA : posB).push([x - HALF + 0.5, 0, z - HALF + 0.5]);
    }
  }

  const dummy = new THREE.Object3D();

  function instanced(positions, mat) {
    const mesh = new THREE.InstancedMesh(geo, mat, positions.length);
    mesh.receiveShadow = true;
    positions.forEach(([x, y, z], i) => {
      dummy.position.set(x, y, z);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    });
    mesh.instanceMatrix.needsUpdate = true;
    return mesh;
  }

  threeScene.add(instanced(posA, matA));
  threeScene.add(instanced(posB, matB));
}

function _buildWalls(threeScene) {
  const wallMat = new THREE.MeshLambertMaterial({ color: 0xe8ddd0 });
  const winMat  = new THREE.MeshLambertMaterial({ color: 0xc2d8e8, transparent: true, opacity: 0.75 });
  const dummy   = new THREE.Object3D();

  // Back wall (z = -HALF): ROOM tiles wide
  const backGeo = new THREE.BoxGeometry(1, WALL_H, 0.3);
  const backMesh = new THREE.InstancedMesh(backGeo, wallMat, ROOM);
  for (let x = 0; x < ROOM; x++) {
    dummy.position.set(x - HALF + 0.5, WALL_H / 2, -HALF);
    dummy.updateMatrix();
    backMesh.setMatrixAt(x, dummy.matrix);
  }
  backMesh.instanceMatrix.needsUpdate = true;
  threeScene.add(backMesh);

  // Left wall (x = -HALF): ROOM tiles deep
  const leftGeo = new THREE.BoxGeometry(0.3, WALL_H, 1);
  const leftMesh = new THREE.InstancedMesh(leftGeo, wallMat, ROOM);
  for (let z = 0; z < ROOM; z++) {
    dummy.position.set(-HALF, WALL_H / 2, z - HALF + 0.5);
    dummy.updateMatrix();
    leftMesh.setMatrixAt(z, dummy.matrix);
  }
  leftMesh.instanceMatrix.needsUpdate = true;
  threeScene.add(leftMesh);

  // Windows on back wall — every 4 tiles starting at x=1
  for (let x = 1; x < ROOM; x += 4) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.9, 0.06), winMat);
    w.position.set(x - HALF + 0.5, WALL_H * 0.65, -HALF - 0.05);
    threeScene.add(w);
  }

  // Windows on left wall — every 4 tiles starting at z=2
  for (let z = 2; z < ROOM; z += 4) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.65), winMat);
    w.position.set(-HALF - 0.05, WALL_H * 0.65, z - HALF + 0.5);
    threeScene.add(w);
  }

  // Entrance strip (front edge, z = HALF - 0.15)
  const stripMat = new THREE.MeshLambertMaterial({ color: 0x0071e3, transparent: true, opacity: 0.45 });
  const strip = new THREE.Mesh(new THREE.BoxGeometry(4, 0.05, 0.3), stripMat);
  strip.position.set(0, 0.08, HALF - 0.15);
  threeScene.add(strip);

  // Potted plants — 4 corners and mid-walls
  _addPlants(threeScene);
}

function _addPlants(threeScene) {
  const potMat  = new THREE.MeshLambertMaterial({ color: 0xc07850 });
  const leafMat = new THREE.MeshLambertMaterial({ color: 0x5a8a5a });

  const positions = [
    [-HALF + 0.8, -HALF + 0.8],
    [ HALF - 0.8, -HALF + 0.8],
    [-HALF + 0.8,  HALF - 2.5],
    [ HALF - 0.8,  HALF - 2.5],
    [-HALF + 0.8,  0],
    [ HALF - 0.8, -4],
    [ 3,          -HALF + 0.8],
    [-3,           HALF - 3],
  ];

  positions.forEach(([x, z]) => {
    const pot = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.35, 0.4), potMat);
    pot.position.set(x, 0.17, z);
    const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.55, 0.5), leafMat);
    leaf.position.set(x, 0.62, z);
    threeScene.add(pot, leaf);
  });
}

function _buildLighting(threeScene) {
  threeScene.add(new THREE.AmbientLight(0xfff8f0, 1.0));
  threeScene.add(new THREE.HemisphereLight(0xfff0e8, 0xd4b896, 0.5));

  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(12, 20, 12);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left   = -18;
  key.shadow.camera.right  =  18;
  key.shadow.camera.top    =  18;
  key.shadow.camera.bottom = -18;
  threeScene.add(key);
}
```

- [ ] **Step 4.2 — Commit**

```bash
git add js/gym/scene.js
git commit -m "feat: add 20x20 room with floor, walls, lighting"
```

---

## Task 5: Equipment stations (portfolio content)

**Files:**
- Create: `js/gym/equipment.js`

Each builder returns `{ interactable, collider }`.
- `interactable`: `{ position: THREE.Vector3, radius: number, contentKey: string, label: string }`
- `collider`: `{ cx: number, cz: number, w: number, d: number }` (centre + full extents on XZ)

- [ ] **Step 5.1 — Create equipment.js**

```js
// js/gym/equipment.js
import * as THREE from 'three';
import { box, group } from './voxel.js';

const WOOD    = 0xc07850;
const WOOD_DK = 0x8a5030;
const METAL   = 0x7a8a8a;
const METAL_DK= 0x555566;
const PAD     = 0xd08860;
const DARK    = 0x3a3a4a;
const BLUE    = 0x0071e3;

export function buildAllEquipment(scene) {
  const interactables = [];
  const colliders     = [];

  function add(builder) {
    const { interactable, collider } = builder(scene);
    interactables.push(interactable);
    colliders.push(collider);
  }

  add(buildBenchPress);
  add(buildDumbbellRack);
  add(buildTreadmill);
  add(buildPullUpRig);
  add(buildPunchingBag);

  return { interactables, colliders };
}

// ── Bench Press — Experience (-6, 0, -7) ─────────────────────
function buildBenchPress(scene) {
  const g = new THREE.Group();

  // Four legs
  [[-0.4, -0.1], [0.4, -0.1], [-0.4, 0.8], [0.4, 0.8]].forEach(([x, z]) => {
    g.add(box(0.12, 0.5, 0.12, WOOD_DK, x, 0.25, z));
  });
  // Bench pad
  g.add(box(1.0, 0.15, 0.55, PAD,     0, 0.57, 0.35));
  // Uprights
  g.add(box(0.1, 0.85, 0.1, METAL,  -0.35, 0.92, -0.15));
  g.add(box(0.1, 0.85, 0.1, METAL,   0.35, 0.92, -0.15));
  // Barbell bar
  g.add(box(1.8, 0.07, 0.07, METAL,  0, 1.35, -0.15));
  // Weight plates
  g.add(box(0.12, 0.38, 0.38, METAL_DK, -0.92, 1.35, -0.15));
  g.add(box(0.12, 0.38, 0.38, METAL_DK,  0.92, 1.35, -0.15));

  const POS = new THREE.Vector3(-6, 0, -7);
  g.position.copy(POS);
  scene.add(g);
  return {
    interactable: { position: POS.clone(), radius: 2.2, contentKey: 'benchPress', label: 'Experience' },
    collider:     { cx: POS.x, cz: POS.z, w: 2.2, d: 1.5 },
  };
}

// ── Dumbbell Rack — Skills (6, 0, -7) ────────────────────────
function buildDumbbellRack(scene) {
  const g = new THREE.Group();

  // Rack frame
  g.add(box(1.8, 0.1, 0.5,  WOOD_DK, 0, 0.05, 0));  // base
  g.add(box(1.8, 0.08, 0.5, WOOD,    0, 0.55, 0));  // top shelf
  g.add(box(1.8, 0.08, 0.5, WOOD,    0, 0.95, 0));  // middle shelf
  g.add(box(0.1, 1.0, 0.5,  WOOD_DK,-0.9, 0.5, 0)); // left post
  g.add(box(0.1, 1.0, 0.5,  WOOD_DK, 0.9, 0.5, 0)); // right post

  // Dumbbells on shelves — 3 pairs (small, medium, large)
  const dbColors = [0xc07850, 0xd08860, 0xa06840];
  [-0.55, 0, 0.55].forEach((x, i) => {
    // handle
    g.add(box(0.28, 0.1, 0.1, METAL, x, 0.62, 0));
    // plates
    g.add(box(0.08, 0.22 + i * 0.04, 0.22 + i * 0.04, dbColors[i], x - 0.14, 0.62, 0));
    g.add(box(0.08, 0.22 + i * 0.04, 0.22 + i * 0.04, dbColors[i], x + 0.14, 0.62, 0));
  });

  const POS = new THREE.Vector3(6, 0, -7);
  g.position.copy(POS);
  scene.add(g);
  return {
    interactable: { position: POS.clone(), radius: 2.2, contentKey: 'dumbbellRack', label: 'Skills' },
    collider:     { cx: POS.x, cz: POS.z, w: 2.2, d: 1.0 },
  };
}

// ── Treadmill — Projects (-6, 0, 5) ──────────────────────────
function buildTreadmill(scene) {
  const g = new THREE.Group();

  // Base platform
  g.add(box(1.6, 0.3,  1.0, DARK,    0, 0.15,  0));
  // Belt surface
  g.add(box(1.4, 0.05, 0.85, 0x4a4a5a, 0, 0.32, 0));
  // Console column
  g.add(box(0.15, 0.9, 0.15, DARK,   0, 0.8, -0.38));
  // Console head
  g.add(box(0.75, 0.45, 0.15, DARK,  0, 1.3, -0.38));
  // Screen (glowing blue)
  g.add(box(0.55, 0.28, 0.04, BLUE,  0, 1.35, -0.31));
  // Handrails
  g.add(box(0.04, 0.6, 0.04, METAL, -0.7, 0.9, -0.15));
  g.add(box(0.04, 0.6, 0.04, METAL,  0.7, 0.9, -0.15));
  g.add(box(1.44, 0.04, 0.04, METAL, 0, 1.2, -0.15));

  const POS = new THREE.Vector3(-6, 0, 5);
  g.position.copy(POS);
  scene.add(g);
  return {
    interactable: { position: POS.clone(), radius: 2.2, contentKey: 'treadmill', label: 'Projects' },
    collider:     { cx: POS.x, cz: POS.z, w: 2.0, d: 1.5 },
  };
}

// ── Pull-Up Rig — Education (5, 0, -2) ───────────────────────
function buildPullUpRig(scene) {
  const g = new THREE.Group();

  // Four vertical posts
  [[-0.7, -0.6], [0.7, -0.6], [-0.7, 0.6], [0.7, 0.6]].forEach(([x, z]) => {
    g.add(box(0.12, 2.2, 0.12, WOOD_DK, x, 1.1, z));
  });
  // Top horizontal bars
  g.add(box(1.55, 0.1, 0.1, METAL, 0, 2.2, -0.6));
  g.add(box(1.55, 0.1, 0.1, METAL, 0, 2.2,  0.6));
  g.add(box(0.1, 0.1, 1.35, METAL, -0.7, 2.2, 0));
  g.add(box(0.1, 0.1, 1.35, METAL,  0.7, 2.2, 0));
  // Cross brace (mid)
  g.add(box(1.55, 0.1, 0.1, WOOD, 0, 1.4, -0.6));
  g.add(box(1.55, 0.1, 0.1, WOOD, 0, 1.4,  0.6));
  // Base feet
  g.add(box(1.55, 0.1, 0.12, WOOD_DK, 0, 0.05, -0.6));
  g.add(box(1.55, 0.1, 0.12, WOOD_DK, 0, 0.05,  0.6));

  const POS = new THREE.Vector3(5, 0, -2);
  g.position.copy(POS);
  scene.add(g);
  return {
    interactable: { position: POS.clone(), radius: 2.4, contentKey: 'pullUpBar', label: 'Education' },
    collider:     { cx: POS.x, cz: POS.z, w: 1.8, d: 1.6 },
  };
}

// ── Punching Bag — About Me (0, 0, -3) ───────────────────────
function buildPunchingBag(scene) {
  const g = new THREE.Group();

  // Ceiling mount (short post)
  g.add(box(0.15, 0.5, 0.15, METAL_DK, 0, 2.55, 0));
  // Chain (thin tall box)
  g.add(box(0.05, 0.5, 0.05, METAL,    0, 2.1, 0));
  // Bag body
  g.add(box(0.55, 1.1, 0.55, WOOD,     0, 1.3, 0));
  // Bag top cap
  g.add(box(0.45, 0.18, 0.45, PAD,     0, 1.9, 0));
  // Bag bottom
  g.add(box(0.4,  0.12, 0.4, WOOD_DK,  0, 0.74, 0));
  // Stripe bands
  g.add(box(0.56, 0.08, 0.56, WOOD_DK, 0, 1.55, 0));
  g.add(box(0.56, 0.08, 0.56, WOOD_DK, 0, 1.05, 0));

  const POS = new THREE.Vector3(0, 0, -3);
  g.position.copy(POS);
  scene.add(g);
  return {
    interactable: { position: POS.clone(), radius: 2.0, contentKey: 'punchingBag', label: 'About Me' },
    collider:     { cx: POS.x, cz: POS.z, w: 0.8, d: 0.8 },
  };
}
```

- [ ] **Step 5.2 — Commit**

```bash
git add js/gym/equipment.js
git commit -m "feat: add 5 voxel equipment stations"
```

---

## Task 6: Fun-fact prop objects

**Files:**
- Create: `js/gym/props.js`

Same return shape as equipment: `{ interactable, collider }`. Props have smaller colliders (they're decorative scale) and a proximity radius of 1.8.

- [ ] **Step 6.1 — Create props.js**

```js
// js/gym/props.js
import * as THREE from 'three';
import { box } from './voxel.js';

const WOOD    = 0xc07850;
const WOOD_DK = 0x8a5030;
const METAL   = 0x7a8a8a;
const WHITE   = 0xf5f5f5;
const BLACK   = 0x1d1d1f;
const RED     = 0xc0392b;
const BLUE    = 0x0071e3;
const TAN     = 0xe8c87a;
const LEATHER = 0x8b4513;

export function buildAllProps(scene) {
  const interactables = [];
  const colliders     = [];

  function add(builder) {
    const { interactable, collider } = builder(scene);
    interactables.push(interactable);
    colliders.push(collider);
  }

  add(buildSoccerBall);
  add(buildBoxingGloves);
  add(buildClapperboard);
  add(buildStethoscope);
  add(buildSuitcase);
  add(buildLunchBox);

  return { interactables, colliders };
}

// ── Soccer Ball (-3, 0, 4) ────────────────────────────────────
function buildSoccerBall(scene) {
  const g = new THREE.Group();
  // Body (slightly squarish voxel sphere approximation)
  g.add(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.5, 0.5), new THREE.MeshLambertMaterial({ color: WHITE })));
  // Dark pentagon patches
  const patchMat = new THREE.MeshLambertMaterial({ color: BLACK });
  [[0, 0, 0.26], [0, 0, -0.26], [0.26, 0, 0], [-0.26, 0, 0], [0, 0.26, 0]].forEach(([x, y, z]) => {
    const p = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.18, 0.04), patchMat);
    p.position.set(x, y, z);
    p.lookAt(x * 10, y * 10, z * 10);
    g.add(p);
  });

  const POS = new THREE.Vector3(-3, 0.25, 4);
  g.position.copy(POS);
  scene.add(g);
  return {
    interactable: { position: new THREE.Vector3(-3, 0, 4), radius: 1.8, contentKey: 'soccerBall', label: 'Soccer Ball' },
    collider:     { cx: -3, cz: 4, w: 0.7, d: 0.7 },
  };
}

// ── Boxing Gloves — hung on wall hook (8, 0, 1) ──────────────
function buildBoxingGloves(scene) {
  const g = new THREE.Group();
  // Wall-mount hook plate
  g.add(box(0.12, 0.5, 0.5, 0x888888, 0, 1.1, 0));
  // Hook pegs
  g.add(box(0.35, 0.07, 0.07, METAL,  0.2, 1.2, 0.12));
  g.add(box(0.35, 0.07, 0.07, METAL,  0.2, 1.0, 0.12));
  // Left glove
  g.add(box(0.3, 0.38, 0.28, RED, 0.5, 1.2, 0.05));
  g.add(box(0.22, 0.12, 0.22, LEATHER, 0.5, 0.98, 0.05)); // cuff
  // Right glove
  g.add(box(0.3, 0.38, 0.28, RED, 0.5, 0.88, 0.05));
  g.add(box(0.22, 0.12, 0.22, LEATHER, 0.5, 0.66, 0.05)); // cuff

  // Mount on right wall (x = HALF - 0.4)
  const POS_WORLD = new THREE.Vector3(8.4, 0, 1);
  g.position.set(POS_WORLD.x, 0, POS_WORLD.z);
  g.rotation.y = -Math.PI / 2; // face inward
  scene.add(g);
  return {
    interactable: { position: new THREE.Vector3(8, 0, 1), radius: 1.8, contentKey: 'boxingGloves', label: 'Boxing Gloves' },
    collider:     { cx: 8, cz: 1, w: 0.6, d: 0.6 },
  };
}

// ── Clapperboard — leaning on left wall (-8, 0, -4) ──────────
function buildClapperboard(scene) {
  const g = new THREE.Group();
  // Board body
  g.add(box(0.7, 0.6, 0.06, BLACK,  0, 0.8, 0));
  // White stripe rows on board
  g.add(box(0.7, 0.08, 0.07, WHITE, 0, 0.65, 0));
  g.add(box(0.7, 0.08, 0.07, WHITE, 0, 0.75, 0));
  // Clapper arm (angled slightly)
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.14, 0.06), new THREE.MeshLambertMaterial({ color: WHITE }));
  arm.position.set(0, 1.14, 0);
  arm.rotation.z = 0.25;
  g.add(arm);
  // Diagonal stripe on arm
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.06, 0.07), new THREE.MeshLambertMaterial({ color: BLACK }));
  stripe.position.set(0.05, 1.14, 0);
  stripe.rotation.z = 0.25;
  g.add(stripe);

  g.position.set(-8.4, 0, -4);
  g.rotation.y = Math.PI / 2;
  scene.add(g);
  return {
    interactable: { position: new THREE.Vector3(-8, 0, -4), radius: 1.8, contentKey: 'clapperboard', label: 'Film Board' },
    collider:     { cx: -8, cz: -4, w: 0.6, d: 0.6 },
  };
}

// ── Stethoscope on a shelf (2, 0, -8.5) ──────────────────────
function buildStethoscope(scene) {
  const g = new THREE.Group();
  // Shelf bracket
  g.add(box(0.8, 0.08, 0.3, WOOD,    0, 1.1, 0));
  g.add(box(0.08, 1.1, 0.1, WOOD_DK, 0, 0.55, -0.1));
  // Stethoscope tube (coiled — approximated as small torus-like boxes)
  const tubeMat = new THREE.MeshLambertMaterial({ color: 0x444444 });
  g.add(new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.025, 6, 12), tubeMat)); // coil
  g.children[g.children.length - 1].position.set(0, 1.28, 0.05);
  g.children[g.children.length - 1].rotation.x = Math.PI / 2;
  // Earpieces
  g.add(box(0.04, 0.12, 0.04, 0x444, -0.12, 1.42, 0.05));
  g.add(box(0.04, 0.12, 0.04, 0x444,  0.12, 1.42, 0.05));
  // Chest piece
  g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.04, 0.06, 8), new THREE.MeshLambertMaterial({ color: METAL })));
  g.children[g.children.length - 1].position.set(0, 1.14, 0.18);

  g.position.set(2, 0, -8.5);
  scene.add(g);
  return {
    interactable: { position: new THREE.Vector3(2, 0, -8.5), radius: 1.8, contentKey: 'stethoscope', label: 'Stethoscope' },
    collider:     { cx: 2, cz: -8.5, w: 1.0, d: 0.6 },
  };
}

// ── Suitcase (-7, 0, 2) ───────────────────────────────────────
function buildSuitcase(scene) {
  const g = new THREE.Group();
  // Body
  g.add(box(0.7, 0.5, 0.3, TAN, 0, 0.35, 0));
  // Darker trim strip
  g.add(box(0.72, 0.06, 0.32, LEATHER, 0, 0.35, 0));
  // Lid
  g.add(box(0.7, 0.12, 0.3, 0xd0a850, 0, 0.67, 0));
  // Handle
  g.add(box(0.04, 0.18, 0.04, METAL, -0.15, 0.84, 0));
  g.add(box(0.04, 0.18, 0.04, METAL,  0.15, 0.84, 0));
  g.add(box(0.3,  0.04, 0.04, METAL,   0,   0.93, 0));
  // Latch
  g.add(box(0.1, 0.08, 0.06, METAL, 0, 0.67, 0.16));
  // Wheels
  g.add(box(0.08, 0.08, 0.08, BLACK, -0.28, 0.05, 0));
  g.add(box(0.08, 0.08, 0.08, BLACK,  0.28, 0.05, 0));

  g.position.set(-7, 0, 2);
  scene.add(g);
  return {
    interactable: { position: new THREE.Vector3(-7, 0, 2), radius: 1.8, contentKey: 'suitcase', label: 'Suitcase' },
    collider:     { cx: -7, cz: 2, w: 0.9, d: 0.6 },
  };
}

// ── Lunch Box (3, 0, 5) ───────────────────────────────────────
function buildLunchBox(scene) {
  const g = new THREE.Group();
  // Container body
  g.add(box(0.55, 0.35, 0.4, 0x2a7a9a, 0, 0.22, 0));
  // Lid
  g.add(box(0.55, 0.1, 0.4, 0x3a9aba, 0, 0.44, 0));
  // Contents visible — small food blocks
  g.add(box(0.18, 0.1, 0.18, 0xe8a050, -0.12, 0.5, -0.05)); // bread/rice
  g.add(box(0.14, 0.1, 0.14, 0x5a8a5a,  0.1,  0.5,  0.05)); // veggies
  g.add(box(0.12, 0.1, 0.12, 0xc04040, -0.05, 0.5,  0.1));  // protein
  // Handle
  g.add(box(0.04, 0.12, 0.04, 0x1a5a7a, -0.15, 0.58, 0));
  g.add(box(0.04, 0.12, 0.04, 0x1a5a7a,  0.15, 0.58, 0));
  g.add(box(0.3,  0.04, 0.04, 0x1a5a7a,  0,    0.66, 0));

  g.position.set(3, 0, 5);
  scene.add(g);
  return {
    interactable: { position: new THREE.Vector3(3, 0, 5), radius: 1.8, contentKey: 'lunchBox', label: 'Lunch Box' },
    collider:     { cx: 3, cz: 5, w: 0.8, d: 0.7 },
  };
}
```

- [ ] **Step 6.2 — Commit**

```bash
git add js/gym/props.js
git commit -m "feat: add 6 fun-fact voxel props"
```

---

## Task 7: Player character

**Files:**
- Create: `js/gym/player.js`

- [ ] **Step 7.1 — Create player.js**

```js
// js/gym/player.js
import * as THREE from 'three';
import { box } from './voxel.js';

const SKIN   = 0xf0c898;
const HAIR   = 0x3a2510;
const SHIRT  = 0x0071e3;
const PANTS  = 0x1d1d1f;
const SHOE   = 0x111111;

export const PLAYER_SPEED  = 5.5;  // units per second
export const PLAYER_RADIUS = 0.35; // collision half-width

// Spawn position — near entrance (front of room)
export const SPAWN = new THREE.Vector3(0, 0, 8);

/**
 * Builds the voxel character group and returns it.
 * The group's origin is at foot level (y = 0).
 */
export function buildPlayer() {
  const g = new THREE.Group();

  // Legs
  g.add(box(0.2, 0.35, 0.2, PANTS,  -0.12, 0.17, 0));
  g.add(box(0.2, 0.35, 0.2, PANTS,   0.12, 0.17, 0));
  // Shoes
  g.add(box(0.22, 0.1, 0.28, SHOE,  -0.12, 0.05, 0.04));
  g.add(box(0.22, 0.1, 0.28, SHOE,   0.12, 0.05, 0.04));
  // Torso
  g.add(box(0.55, 0.42, 0.3, SHIRT,  0, 0.57, 0));
  // Arms
  g.add(box(0.18, 0.36, 0.18, SHIRT, -0.37, 0.55, 0));
  g.add(box(0.18, 0.36, 0.18, SHIRT,  0.37, 0.55, 0));
  // Neck
  g.add(box(0.2, 0.1, 0.2, SKIN,  0, 0.83, 0));
  // Head
  g.add(box(0.45, 0.42, 0.42, SKIN, 0, 1.11, 0));
  // Hair
  g.add(box(0.46, 0.14, 0.43, HAIR, 0, 1.28, 0));
  // Eyes (small dark cubes)
  g.add(box(0.08, 0.08, 0.04, 0x1a0a00, -0.1, 1.12, 0.21));
  g.add(box(0.08, 0.08, 0.04, 0x1a0a00,  0.1, 1.12, 0.21));

  g.position.copy(SPAWN);

  // Store refs for animation
  g.userData.legL  = g.children[0];
  g.userData.legR  = g.children[1];
  g.userData.armL  = g.children[5];
  g.userData.armR  = g.children[6];
  g.userData.bobBase = g.position.y;

  return g;
}

/**
 * Rotates the character to face the direction of movement (dx, dz).
 * Uses Math.atan2 for the yaw angle and lerps smoothly.
 */
export function updateFacing(playerGroup, dx, dz, delta) {
  if (dx === 0 && dz === 0) return;
  const targetAngle = Math.atan2(dx, dz);
  const current = playerGroup.rotation.y;

  // Shortest-path lerp on angle
  let diff = targetAngle - current;
  while (diff >  Math.PI) diff -= Math.PI * 2;
  while (diff < -Math.PI) diff += Math.PI * 2;
  playerGroup.rotation.y += diff * Math.min(delta * 14, 1);
}

/**
 * Animates the leg/arm swing and body bob while moving.
 * @param {THREE.Group} playerGroup
 * @param {number} time  elapsed seconds (from THREE.Clock)
 * @param {boolean} isMoving
 */
export function animatePlayer(playerGroup, time, isMoving) {
  const { legL, legR, armL, armR } = playerGroup.userData;
  if (isMoving) {
    const swing = Math.sin(time * 8) * 0.35;
    legL.rotation.x =  swing;
    legR.rotation.x = -swing;
    armL.rotation.x = -swing * 0.6;
    armR.rotation.x =  swing * 0.6;
    playerGroup.position.y = playerGroup.userData.bobBase + Math.abs(Math.sin(time * 8)) * 0.04;
  } else {
    legL.rotation.x = 0;
    legR.rotation.x = 0;
    armL.rotation.x = 0;
    armR.rotation.x = 0;
    playerGroup.position.y = playerGroup.userData.bobBase;
  }
}
```

- [ ] **Step 7.2 — Commit**

```bash
git add js/gym/player.js
git commit -m "feat: add voxel player character with bob animation"
```

---

## Task 8: Isometric camera

**Files:**
- Create: `js/gym/camera.js`

- [ ] **Step 8.1 — Create camera.js**

```js
// js/gym/camera.js
import * as THREE from 'three';

const CAM_DISTANCE  = 16;
const CAM_ELEVATION = Math.PI / 5;    // 36° above horizon
const CAM_AZIMUTH   = Math.PI / 4;    // 45° horizontal

// Camera offset from player position (fixed — never changes)
export const CAM_OFFSET = new THREE.Vector3(
  CAM_DISTANCE * Math.sin(CAM_AZIMUTH) * Math.cos(CAM_ELEVATION),
  CAM_DISTANCE * Math.sin(CAM_ELEVATION),
  CAM_DISTANCE * Math.cos(CAM_AZIMUTH) * Math.cos(CAM_ELEVATION)
);
// ≈ (8.6, 9.4, 8.6)

// Internal: current smoothed camera position
const _camPos = new THREE.Vector3();
let _initialised = false;

/**
 * Creates and configures the isometric perspective camera.
 * Call once during init.
 */
export function createCamera(renderer) {
  const aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
  const cam = new THREE.PerspectiveCamera(52, aspect, 0.1, 120);
  return cam;
}

/**
 * Smoothly moves the camera to follow `playerPos`.
 * Must be called every frame with the elapsed delta (seconds).
 */
export function updateCamera(camera, playerPos, delta) {
  const target = playerPos.clone().add(CAM_OFFSET);

  if (!_initialised) {
    _camPos.copy(target);
    _initialised = true;
  }

  _camPos.lerp(target, Math.min(delta * 5, 1));
  camera.position.copy(_camPos);
  camera.lookAt(playerPos.x, playerPos.y + 0.6, playerPos.z);
}

/**
 * Updates the camera aspect ratio on window resize.
 */
export function resizeCamera(camera, renderer) {
  camera.aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
  camera.updateProjectionMatrix();
}
```

- [ ] **Step 8.2 — Commit**

```bash
git add js/gym/camera.js
git commit -m "feat: add fixed isometric follow camera"
```

---

## Task 9: Keyboard controls

**Files:**
- Create: `js/gym/controls.js`

- [ ] **Step 9.1 — Create controls.js**

```js
// js/gym/controls.js

// Live key state — mutated by event listeners
export const keys = { w: false, a: false, s: false, d: false, e: false };

// E-press detection: true for exactly one frame when E goes down
let _prevE = false;

/**
 * Registers keydown/keyup listeners. Call once during init.
 * Supports both WASD and arrow keys.
 */
export function initControls() {
  window.addEventListener('keydown', _onKeyDown);
  window.addEventListener('keyup',   _onKeyUp);
}

export function disposeControls() {
  window.removeEventListener('keydown', _onKeyDown);
  window.removeEventListener('keyup',   _onKeyUp);
}

/**
 * Returns true if E was pressed since the last call.
 * Must be called exactly once per frame.
 */
export function consumeEPress() {
  const pressed = keys.e && !_prevE;
  _prevE = keys.e;
  return pressed;
}

function _onKeyDown(e) {
  if (e.repeat) return;
  switch (e.code) {
    case 'KeyW': case 'ArrowUp':    keys.w = true; break;
    case 'KeyA': case 'ArrowLeft':  keys.a = true; break;
    case 'KeyS': case 'ArrowDown':  keys.s = true; break;
    case 'KeyD': case 'ArrowRight': keys.d = true; break;
    case 'KeyE':                    keys.e = true; break;
  }
}

function _onKeyUp(e) {
  switch (e.code) {
    case 'KeyW': case 'ArrowUp':    keys.w = false; break;
    case 'KeyA': case 'ArrowLeft':  keys.a = false; break;
    case 'KeyS': case 'ArrowDown':  keys.s = false; break;
    case 'KeyD': case 'ArrowRight': keys.d = false; break;
    case 'KeyE':                    keys.e = false; break;
  }
}
```

- [ ] **Step 9.2 — Commit**

```bash
git add js/gym/controls.js
git commit -m "feat: add keyboard controls with E-press detection"
```

---

## Task 10: Interaction system

**Files:**
- Create: `js/gym/interaction.js`

The tooltip reuses the existing `#interact-hint` DOM element from `gym.html`. Its position is updated every frame via a `Vector3.project()` → CSS pixel conversion.

- [ ] **Step 10.1 — Create interaction.js**

```js
// js/gym/interaction.js
import * as THREE from 'three';
import { isNearby } from './math.js';

const _hintEl    = () => document.getElementById('interact-hint');
const _hintTitle = () => document.querySelector('#interact-hint .hint-title');
const _hintSub   = () => document.querySelector('#interact-hint .hint-sub');
const _panelEl   = () => document.getElementById('info-panel');
const _panelIcon = () => document.getElementById('panel-icon');
const _panelTitle= () => document.getElementById('panel-title');
const _panelBody = () => document.getElementById('panel-content');

let _panelOpen    = false;
let _nearestKey   = null; // contentKey of nearest interactable

/**
 * Scans all interactables for proximity to player.
 * Updates the screen-space tooltip if something is nearby.
 * Returns the contentKey of the nearest interactable, or null.
 *
 * @param {{ x: number, z: number }} playerPos
 * @param {Array<{ position: THREE.Vector3, radius: number, contentKey: string, label: string }>} interactables
 * @param {THREE.Camera} camera
 * @param {THREE.WebGLRenderer} renderer
 */
export function updateInteraction(playerPos, interactables, camera, renderer) {
  if (_panelOpen) return _nearestKey;

  let nearest     = null;
  let minDist     = Infinity;

  for (const obj of interactables) {
    const dx = playerPos.x - obj.position.x;
    const dz = playerPos.z - obj.position.z;
    const dist = Math.sqrt(dx * dx + dz * dz);
    if (dist <= obj.radius && dist < minDist) {
      minDist = dist;
      nearest = obj;
    }
  }

  _nearestKey = nearest ? nearest.contentKey : null;

  if (nearest) {
    _positionTooltip(nearest.position, nearest.label, camera, renderer);
  } else {
    _hideTooltip();
  }

  return _nearestKey;
}

/**
 * Opens the info panel for the given contentKey.
 * @param {string} contentKey
 * @param {Record<string, { title: string, icon: string, html: string }>} content
 */
export function openPanel(contentKey, content) {
  const data = content[contentKey];
  if (!data) return;

  _panelIcon().textContent  = data.icon  || '🏋️';
  _panelTitle().textContent = data.title || '';
  _panelBody().innerHTML    = data.html  || '';
  _panelEl().style.display  = 'flex';
  _hideTooltip();
  _panelOpen = true;
}

/**
 * Closes the info panel if it is open.
 */
export function closePanel() {
  if (!_panelOpen) return;
  _panelEl().style.display = 'none';
  _panelOpen = false;
}

export function isPanelOpen() {
  return _panelOpen;
}

// ── Internals ─────────────────────────────────────────────────

function _positionTooltip(worldPos, label, camera, renderer) {
  // Project the point 2.6 units above the object into screen space
  const above = worldPos.clone();
  above.y += 2.6;
  const v = above.project(camera);

  const w = renderer.domElement.clientWidth;
  const h = renderer.domElement.clientHeight;
  const sx = (v.x + 1) / 2 * w;
  const sy = (-v.y + 1) / 2 * h;

  const hint = _hintEl();
  hint.style.display    = 'flex';
  hint.style.position   = 'fixed';
  hint.style.left       = sx + 'px';
  hint.style.top        = sy + 'px';
  hint.style.transform  = 'translate(-50%, -100%)';
  _hintTitle().textContent = 'Press  E';
  _hintSub().textContent   = label;
}

function _hideTooltip() {
  _hintEl().style.display = 'none';
}
```

- [ ] **Step 10.2 — Commit**

```bash
git add js/gym/interaction.js
git commit -m "feat: add proximity interaction with screen-space tooltip"
```

---

## Task 11: Rewrite main.js

**Files:**
- Rewrite: `js/main.js`

This replaces the entire file. It ties all modules together, runs the animation loop, and registers `window.__initGym` (required by `gym.html`'s inline script).

- [ ] **Step 11.1 — Rewrite js/main.js**

Replace the entire contents of `js/main.js` with:

```js
// js/main.js — Isometric voxel gym entry point
import * as THREE from 'three';
import { CONTENT }                         from './gym/content.js';
import { getMoveVector, aabbOverlap }      from './gym/math.js';
import { buildScene, HALF }                from './gym/scene.js';
import { buildAllEquipment }               from './gym/equipment.js';
import { buildAllProps }                   from './gym/props.js';
import { buildPlayer, updateFacing, animatePlayer, PLAYER_SPEED, PLAYER_RADIUS, SPAWN } from './gym/player.js';
import { createCamera, updateCamera, resizeCamera } from './gym/camera.js';
import { initControls, disposeControls, keys, consumeEPress } from './gym/controls.js';
import { updateInteraction, openPanel, closePanel, isPanelOpen } from './gym/interaction.js';

// ── Module-level state ────────────────────────────────────────
let renderer, camera, scene, clock;
let player;
let allInteractables = [];
let allColliders     = [];
let pauseOpen = false;

// ── Public init hook (called by gym.html inline script) ──────
window.__initGym = function initGym() {
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.body.appendChild(renderer.domElement);

  scene  = new THREE.Scene();
  camera = createCamera(renderer);
  clock  = new THREE.Clock();

  buildScene(scene);

  const { interactables: eqInter, colliders: eqColl } = buildAllEquipment(scene);
  const { interactables: prInter, colliders: prColl }  = buildAllProps(scene);
  allInteractables = [...eqInter, ...prInter];
  allColliders     = [...eqColl,  ...prColl];

  player = buildPlayer();
  scene.add(player);

  initControls();
  _wireUI();

  // Fade loading screen, show welcome overlay
  setTimeout(() => {
    document.getElementById('loading-screen').classList.add('fade-out');
    setTimeout(() => {
      document.getElementById('welcome-overlay').style.display = 'flex';
    }, 800);
  }, 2300);

  window.addEventListener('resize', _onResize);
  _animate();
};

// ── Animation loop ────────────────────────────────────────────
function _animate() {
  requestAnimationFrame(_animate);
  const delta = clock.getDelta();
  const time  = clock.getElapsedTime();

  if (!isPanelOpen() && !pauseOpen) {
    _movePlayer(delta);
  }

  animatePlayer(player, time, _isMoving());
  updateCamera(camera, player.position, delta);

  const nearest = updateInteraction(
    { x: player.position.x, z: player.position.z },
    allInteractables,
    camera,
    renderer
  );

  if (consumeEPress() && nearest && !isPanelOpen()) {
    openPanel(nearest, CONTENT);
  }

  renderer.render(scene, camera);
}

// ── Player movement + collision ───────────────────────────────
function _movePlayer(delta) {
  const mv = getMoveVector(keys);
  if (mv.x === 0 && mv.z === 0) return;

  const speed = PLAYER_SPEED * delta;
  let nx = player.position.x + mv.x * speed;
  let nz = player.position.z + mv.z * speed;

  // Wall bounds (keep player inside the room)
  const bound = HALF - 0.6;
  nx = Math.max(-bound, Math.min(bound, nx));
  nz = Math.max(-bound, Math.min(bound, nz));

  // Equipment / prop collision (AABB)
  const pw = PLAYER_RADIUS * 2, pd = PLAYER_RADIUS * 2;
  let blocked = false;
  for (const c of allColliders) {
    if (aabbOverlap(nx, nz, pw, pd, c.cx, c.cz, c.w, c.d)) {
      blocked = true;
      break;
    }
  }

  if (!blocked) {
    player.position.x = nx;
    player.position.z = nz;
    updateFacing(player, mv.x, mv.z, delta);
  }
}

function _isMoving() {
  return keys.w || keys.a || keys.s || keys.d;
}

// ── UI wiring ─────────────────────────────────────────────────
function _wireUI() {
  // Welcome overlay → start
  document.getElementById('start-btn').addEventListener('click', () => {
    document.getElementById('welcome-overlay').style.display = 'none';
    document.getElementById('controls-reminder').style.display = 'block';
    document.getElementById('gym-menu-btn').style.display = 'flex';
  });

  // Info panel close button
  document.getElementById('close-panel').addEventListener('click', closePanel);

  // Escape closes panel
  window.addEventListener('keydown', e => {
    if (e.code === 'Escape') {
      if (isPanelOpen()) { closePanel(); return; }
      if (pauseOpen)     { _closePause(); return; }
    }
    if (e.code === 'KeyM') {
      if (pauseOpen) _closePause();
      else           _openPause();
    }
  });

  // Pause menu
  document.getElementById('gym-menu-btn').addEventListener('click', _openPause);
  document.getElementById('pause-resume').addEventListener('click', _closePause);
  document.getElementById('pause-exit').addEventListener('click', () => {
    window.location.href = '/';
  });
}

function _openPause() {
  if (pauseOpen || isPanelOpen()) return;
  pauseOpen = true;
  const pm = document.getElementById('pause-menu');
  pm.classList.remove('fade-out');
  pm.style.display = 'flex';
}

function _closePause() {
  if (!pauseOpen) return;
  pauseOpen = false;
  const pm = document.getElementById('pause-menu');
  pm.classList.add('fade-out');
  setTimeout(() => {
    pm.style.display = 'none';
    pm.classList.remove('fade-out');
  }, 280);
}

function _onResize() {
  renderer.setSize(window.innerWidth, window.innerHeight);
  resizeCamera(camera, renderer);
}
```

- [ ] **Step 11.2 — Commit**

```bash
git add js/main.js
git commit -m "feat: rewrite main.js with isometric gym loop"
```

---

## Task 12: Update gym.html

**Files:**
- Modify: `gym.html`

Three changes: (1) welcome overlay controls copy, (2) remove the crosshair element, (3) update the controls reminder bar text.

- [ ] **Step 12.1 — Update welcome overlay controls**

In `gym.html`, replace the `<div class="welcome-controls">` block (lines ~83–99) with:

```html
<div class="welcome-controls">
    <div class="wc-item">
        <div class="wc-keys"><kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd></div>
        <span class="wc-label">Walk around</span>
    </div>
    <div class="wc-item">
        <div class="wc-keys"><kbd>E</kbd></div>
        <span class="wc-label">Interact</span>
    </div>
    <div class="wc-item">
        <div class="wc-keys"><kbd>M</kbd></div>
        <span class="wc-label">Menu</span>
    </div>
    <div class="wc-item">
        <div class="wc-keys"><kbd class="wide">Esc</kbd></div>
        <span class="wc-label">Close panel</span>
    </div>
</div>
```

- [ ] **Step 12.2 — Remove the crosshair element**

Remove this line from `gym.html`:

```html
<!-- Crosshair -->
<div id="crosshair">+</div>
```

- [ ] **Step 12.3 — Update controls reminder bar**

Replace the existing `#controls-reminder` span content:

```html
<div id="controls-reminder">
    <span>WASD — Walk &nbsp;|&nbsp; E — Interact &nbsp;|&nbsp; M — Menu &nbsp;|&nbsp; ESC — Close panel</span>
</div>
```

- [ ] **Step 12.4 — Verify the welcome overlay button text**

Confirm the start button text still reads `Enter the Gym` (no change needed).

- [ ] **Step 12.5 — Commit**

```bash
git add gym.html
git commit -m "feat: update gym.html for third-person controls"
```

---

## Task 13: Manual verification

- [ ] **Step 13.1 — Run the dev server**

```bash
npm run dev
```

Navigate to `http://localhost:5173/gym.html`.

- [ ] **Step 13.2 — Verify loading sequence**

Loading screen appears, progress bar animates, then the welcome overlay shows with WASD / E / M / Esc controls listed. No crosshair is visible.

- [ ] **Step 13.3 — Verify scene renders**

After clicking "Enter the Gym": the 20×20 warm-wood floor renders, walls visible on two sides with blue-tinted windows, plants in corners, all 5 equipment stations and 6 props visible in the scene.

- [ ] **Step 13.4 — Verify movement and camera**

WASD moves the character freely in 8 directions. Character faces the direction of movement. Camera follows with a soft lag and never rotates.

- [ ] **Step 13.5 — Verify interaction**

Walk near each of the 11 interactables. "Press E" tooltip appears above the nearest object. Pressing E opens the info panel with the correct title and content. Pressing Esc or the close button closes the panel and returns movement control.

- [ ] **Step 13.6 — Verify collision**

Character cannot walk through equipment or walls.

- [ ] **Step 13.7 — Commit**

```bash
git add -A
git commit -m "feat: isometric voxel gym complete"
```

---

## Self-Review Notes

- All function names used across tasks are consistent: `getMoveVector`, `aabbOverlap`, `isNearby` (math.js), `buildAllEquipment`/`buildAllProps` (returns `{interactables, colliders}`), `consumeEPress` (controls.js), `openPanel`/`closePanel`/`isPanelOpen` (interaction.js), `updateCamera`/`createCamera`/`resizeCamera` (camera.js), `buildPlayer`/`updateFacing`/`animatePlayer` (player.js).
- `CONTENT` keys match exactly across `content.js` (keys: benchPress, dumbbellRack, treadmill, pullUpBar, punchingBag, soccerBall, boxingGloves, clapperboard, stethoscope, suitcase, lunchBox) and `equipment.js` / `props.js` `contentKey` values.
- `HALF` is exported from `scene.js` and imported in `main.js` for wall-bound clamping.
- The `#interact-hint`, `#info-panel`, `#panel-icon`, `#panel-title`, `#panel-content`, `#close-panel` DOM IDs are all present in the existing `gym.html` and remain untouched.
- Vitest `environment: 'node'` means `math.test.js` must not import Three.js or browser APIs — math.js is pure JS with no imports, safe for node.
- `window.__initGym` is registered synchronously at module evaluation time in the new `main.js`, matching what `gym.html`'s inline script expects.
