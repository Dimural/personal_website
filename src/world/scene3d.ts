import * as THREE from "three";

// The world is a detailed 3D scene at dusk. It is never shown directly: it renders small and off-screen,
// and ascii.ts turns each cell into a character coloured by the scene. Detail lives HERE: thousands of
// grass blades, textured stone, lights. The ASCII pass only translates. World units: 1 ≈ a person's width.

export const SUPERSAMPLE = 3; // render pixels per character cell, per axis (ascii.ts reads 3×3 per cell)
const CAMERA_OFFSET = new THREE.Vector3(0, 24, 24);
const NEAR = 5;
const FAR = 140;
export const WAKE_SECONDS = 0.9; // the stand-up (and the lie-down); walking starts after it
export const SLEEP_RADIUS = 2.5; // how close to the log (at the origin) space puts the figure back to sleep
const NIGHT = "#0a0d18"; // background and fog; ascii.ts uses the same navy as paper

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = rng(42);

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, x));

/** Where the walking figure is and how it moves; player.ts owns it, render() poses the mesh from it. */
export type Pose = { x: number; z: number; heading: number; stride: number; moving: number };

/** Asleep or awake, and when the last stand-up or lie-down started (null: asleep since load). */
export type Rest = { asleep: boolean; since: number | null };

const mat = (color: string, map: THREE.Texture | null = null) =>
  new THREE.MeshStandardMaterial({ color, map, roughness: 1 });

// Layout: castle wall across the north, a wide meadow in front of it with the log at the origin, a pond
// to the south-east, small groves, forest all around. The walkable map is the meadow (MAP).
const WALL_Z = -16;
const POND = { x: 13, z: 12, r: 8 };
const inPond = (x: number, z: number, pad = 0) => Math.hypot((x - POND.x) * 0.75, z - POND.z) < POND.r + pad;
export const MAP = { minX: -44, maxX: 44, minZ: WALL_Z + 1.4, maxZ: 38 };

/** Open spots kept free for milestones 3-4: one per job (by the castle) and per project (in the meadow). */
export const SPOTS = {
  experience: [new THREE.Vector3(-26, 0, -6), new THREE.Vector3(0, 0, -8), new THREE.Vector3(26, 0, -6)],
  projects: [new THREE.Vector3(-30, 0, 26), new THREE.Vector3(0, 0, 32), new THREE.Vector3(32, 0, 30)],
};

/** Things you can't walk through, as circles on the ground. Filled in as the scene is built. */
const COLLIDERS: { x: number; z: number; r: number }[] = [];

/** Groves inside the meadow: [x, z, trees]. Kept clear of SPOTS. */
const GROVES = [[-20, 14, 5], [36, 12, 4], [-38, -2, 4], [-9, 22, 3]];

/** Canvas-painted texture: stones in mortar, lighter tops, so walls turn into dense varied glyphs. */
function stoneTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#2a2d36";
  ctx.fillRect(0, 0, size, size);
  const r = rng(5);
  const rowH = 32;
  for (let y = 0; y < size; y += rowH) {
    let x = (y / rowH) % 2 ? -24 : 0;
    while (x < size) {
      const w = 36 + r() * 30;
      const g = 95 + r() * 60;
      ctx.fillStyle = `rgb(${g}, ${g + 4}, ${g + 14})`;
      ctx.fillRect(x + 3, y + 3, w - 6, rowH - 6);
      ctx.fillStyle = "rgba(255,255,255,0.12)";
      ctx.fillRect(x + 3, y + 3, w - 6, 5);
      x += w;
    }
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

/** Speckled leaves: crowns become dense, shimmering clusters instead of flat blobs. */
function leafTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#3d4f3a";
  ctx.fillRect(0, 0, size, size);
  const r = rng(9);
  for (let i = 0; i < 900; i++) {
    const g = r();
    ctx.fillStyle = g < 0.5 ? "#22301f" : g < 0.85 ? "#5d7a4f" : "#8aa874";
    ctx.fillRect(r() * size, r() * size, 2 + r() * 4, 2 + r() * 4);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

const STONE = stoneTexture();
const LEAVES = leafTexture();

function stoneBox(w: number, h: number, d: number) {
  const geo = new THREE.BoxGeometry(w, h, d);
  // Scale UVs per face so stones keep one size on every box.
  const uv = geo.attributes.uv;
  const normal = geo.attributes.normal;
  for (let i = 0; i < uv.count; i++) {
    const nx = Math.abs(normal.getX(i));
    const ny = Math.abs(normal.getY(i));
    const [su, sv] = nx > 0.5 ? [d, h] : ny > 0.5 ? [w, d] : [w, h];
    uv.setXY(i, (uv.getX(i) * su) / 4, (uv.getY(i) * sv) / 4);
  }
  const mesh = new THREE.Mesh(geo, mat("#c8ccd8", STONE));
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

/** Ruined castle front: wall with battlements, a dark arched gate, towers at the ends and by the gate. */
function castle() {
  const group = new THREE.Group();
  const add = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const m = stoneBox(w, h, d);
    m.position.set(x, y, z);
    group.add(m);
    return m;
  };
  const H = 7;
  // Wall in two halves either side of the gate, crenellated.
  for (const side of [-1, 1]) {
    add(18, H, 2, side * 12, H / 2, 0);
    for (let x = 3.5; x < 21; x += 1.6) {
      if (random() < 0.12) continue; // a few merlons have fallen
      add(0.9, 1.1, 2.1, side * x, H + 0.55, 0);
    }
  }
  // Gate: lintel over a dark passage.
  add(6, 2.2, 2.2, 0, H - 1.1, 0);
  const passage = new THREE.Mesh(new THREE.BoxGeometry(5.9, H - 2.2, 0.3), new THREE.MeshBasicMaterial({ color: "#05060a" }));
  passage.position.set(0, (H - 2.2) / 2, -0.6);
  group.add(passage);
  const arch = new THREE.Mesh(new THREE.CylinderGeometry(2.95, 2.95, 2.2, 16, 1, false, 0, Math.PI), mat("#05060a"));
  arch.rotation.set(Math.PI / 2, 0, Math.PI / 2);
  arch.position.set(0, H - 2.2, 0.05);
  group.add(arch);
  // Towers.
  for (const x of [-4.2, 4.2, -21, 21]) {
    const h = x === -21 ? 8.5 : 10.5; // the west tower is broken
    add(3.4, h, 3.4, x, h / 2, 0.3);
    COLLIDERS.push({ x, z: WALL_Z + 0.3, r: 2.4 });
    for (const [dx, dz] of [[-1.2, -1.2], [1.2, -1.2], [-1.2, 1.2], [1.2, 1.2]]) add(1, 1.2, 1, x + dx, h + 0.6, 0.3 + dz);
  }
  // Fallen blocks in the grass.
  for (let i = 0; i < 9; i++) {
    const b = add(0.8 + random(), 0.6 + random() * 0.6, 0.8 + random(), (random() - 0.5) * 40, 0.3, 2.5 + random() * 3);
    b.rotation.y = random() * 3;
    COLLIDERS.push({ x: b.position.x, z: WALL_Z + b.position.z, r: 0.9 });
  }
  group.position.z = WALL_Z;
  return group;
}

/** A torch on a post: warm flickering light that colours the stone and grass around it. */
function torch(x: number, z: number) {
  const group = new THREE.Group();
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.15, 2.4, 6), mat("#3a2a1e"));
  post.position.y = 1.2;
  const flame = new THREE.Mesh(new THREE.ConeGeometry(0.3, 0.8, 6), new THREE.MeshBasicMaterial({ color: "#ffb347" }));
  flame.position.y = 2.7;
  const light = new THREE.PointLight("#ff9a3c", 16, 12, 1.6);
  light.position.y = 2.9;
  group.add(post, flame, light);
  group.position.set(x, 0, z);
  COLLIDERS.push({ x, z, r: 0.4 });
  return { group, light, flame };
}

/**
 * Grass: tens of thousands of single blades in one draw call. They lean with the wind (a wave that rolls
 * across the field) and part around `uPush` (the player, later). Base dark, tips light, like the reference.
 */
function grassField(count: number) {
  const geo = new THREE.BufferGeometry();
  // One blade: a thin, slightly bent strip, 3 segments high.
  const pos: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  const W = 0.07;
  for (let s = 0; s <= 3; s++) {
    const t = s / 3;
    const w = W * (1 - t * 0.85);
    pos.push(-w, t, 0, w, t, 0);
    uv.push(0, t, 1, t);
    if (s < 3) idx.push(s * 2, s * 2 + 1, s * 2 + 2, s * 2 + 1, s * 2 + 3, s * 2 + 2);
  }
  geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
  geo.setAttribute("normal", new THREE.Float32BufferAttribute(pos.map((_, i) => (i % 3 === 1 ? 1 : 0)), 3));
  geo.setIndex(idx);

  const material = new THREE.MeshLambertMaterial({ side: THREE.DoubleSide });
  const uniforms = { uTime: { value: 0 }, uPush: { value: new THREE.Vector3(0, 0, 999) } };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;\nuniform vec3 uPush;\nvarying float vTip;")
      .replace(
        "#include <project_vertex>",
        `vTip = uv.y;
        vec4 wp = modelMatrix * instanceMatrix * vec4(transformed, 1.0);
        float bend = uv.y * uv.y;
        // One slow, broad wave rolling across the field: calm, no per-blade jitter.
        float gust = sin(uTime * 0.6 - wp.x * 0.12 - wp.z * 0.08);
        wp.x += (0.22 + 0.16 * gust) * bend;
        wp.z += 0.05 * sin(uTime * 0.5 + wp.x * 0.2) * bend;
        vec2 away = wp.xz - uPush.xz;
        float near = smoothstep(1.8, 0.0, length(away));
        wp.xz += normalize(away + 1e-4) * near * bend * 0.9;
        wp.y -= near * bend * 0.4;
        vec4 mvPosition = viewMatrix * wp;
        gl_Position = projectionMatrix * mvPosition;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nvarying float vTip;")
      .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb *= mix(0.3, 1.5, vTip);");
  };

  const mesh = new THREE.InstancedMesh(geo, material, count);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const up = new THREE.Vector3(0, 1, 0);
  const shades = ["#5a9e45", "#6cb04e", "#7fc25a", "#4b8c3c", "#93d066"].map((c) => new THREE.Color(c));
  let i = 0;
  while (i < count) {
    const x = (random() - 0.5) * 96;
    const z = WALL_Z + 1.5 + random() * 58;
    if (inPond(x, z, 0.5) || (Math.abs(x) < 2.6 && Math.abs(z) < 0.9)) continue; // not under the log
    const h = 0.35 + random() * 0.5;
    m.compose(new THREE.Vector3(x, 0, z), q.setFromAxisAngle(up, random() * Math.PI), new THREE.Vector3(1, h, 1));
    mesh.setMatrixAt(i, m);
    mesh.setColorAt(i, shades[Math.floor(random() * shades.length)].clone().multiplyScalar(0.8 + random() * 0.4));
    i++;
  }
  mesh.frustumCulled = false;
  return { mesh, uniforms };
}

function trees() {
  const crowns: THREE.Matrix4[] = [];
  const trunks: THREE.Matrix4[] = [];
  const q = new THREE.Quaternion();
  const spots: [number, number][] = [];
  let tries = 0;
  while (spots.length < 170 && tries++ < 8000) {
    const x = (random() - 0.5) * 150;
    const z = WALL_Z - 20 + random() * 85;
    // Forest everywhere except the meadow in front of the castle.
    const meadow = Math.abs(x) < 47 && z > WALL_Z - 1 && z < 41;
    if (!meadow) spots.push([x, z]);
  }
  for (const [gx, gz, n] of GROVES) {
    for (let i = 0; i < n; i++) spots.push([gx + (random() - 0.5) * 8, gz + (random() - 0.5) * 6]);
  }
  for (const [x, z] of spots) {
    COLLIDERS.push({ x, z, r: 0.7 });
    const h = 2 + random() * 2;
    const r = 2.4 + random() * 1.6;
    trunks.push(new THREE.Matrix4().compose(new THREE.Vector3(x, h / 2, z), q, new THREE.Vector3(1, h, 1)));
    crowns.push(new THREE.Matrix4().compose(new THREE.Vector3(x, h + r * 0.6, z), q.setFromEuler(new THREE.Euler(0, random() * 6, 0)), new THREE.Vector3(r, r * 0.9, r)));
  }
  const trunkMesh = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.3, 0.45, 1, 6), mat("#3b2c22"), trunks.length);
  trunks.forEach((t, i) => trunkMesh.setMatrixAt(i, t));
  const crownMesh = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 2), mat("#9fb595", LEAVES), crowns.length);
  crowns.forEach((c, i) => crownMesh.setMatrixAt(i, c));
  for (const mesh of [trunkMesh, crownMesh]) mesh.castShadow = mesh.receiveShadow = true;
  return { trunkMesh, crownMesh, crowns };
}

function ground() {
  const geo = new THREE.PlaneGeometry(220, 220, 110, 110);
  geo.rotateX(-Math.PI / 2);
  const p = geo.attributes.position;
  const colors: number[] = [];
  const soil = new THREE.Color("#1e2a1b");
  const moss = new THREE.Color("#2f4527");
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const z = p.getZ(i);
    const bed = 1 - smoothstep(POND.r - 2, POND.r + 0.5, Math.hypot((x - POND.x) * 0.75, z - POND.z));
    p.setY(i, -bed * 1.2 + 0.25 * Math.sin(x * 0.2) * Math.cos(z * 0.17) * smoothstep(6, 14, Math.hypot(x, z)));
    const c = soil.clone().lerp(moss, random());
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1 }));
  mesh.receiveShadow = true;
  return mesh;
}

/** Dark still water with a moving moon-glint, so it reads as water and keeps moving. */
function pond() {
  const geo = new THREE.CircleGeometry(POND.r + 0.3, 48);
  geo.rotateX(-Math.PI / 2);
  geo.scale(1 / 0.75, 1, 1);
  const material = new THREE.MeshStandardMaterial({ color: "#0f2236", roughness: 0.15, metalness: 0.6 });
  const uniforms = { uTime: { value: 0 } };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vWorld;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;");
    shader.fragmentShader = shader.fragmentShader
      .replace("#include <common>", "#include <common>\nuniform float uTime;\nvarying vec3 vWorld;")
      .replace(
        "#include <dithering_fragment>",
        `float ripple = sin(vWorld.z * 2.0 + sin(vWorld.x * 0.5 + uTime * 0.4) * 1.2 - uTime * 0.5);
        gl_FragColor.rgb += vec3(0.35, 0.45, 0.6) * smoothstep(0.7, 1.0, ripple) * 0.3;
        #include <dithering_fragment>`,
      );
  };
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.set(POND.x, -0.25, POND.z);
  return { mesh, uniforms };
}

function person() {
  const group = new THREE.Group();
  const add = (geo: THREE.BufferGeometry, color: string, y: number, x = 0) => {
    const m = new THREE.Mesh(geo, mat(color));
    m.position.set(x, y, 0);
    m.castShadow = true;
    group.add(m);
    return m;
  };
  // Legs hang from hip pivots so they can swing when walking.
  const legs = [-0.22, 0.22].map((x) => {
    const hip = new THREE.Group();
    hip.position.set(x, 1.1, 0);
    const leg = new THREE.Mesh(new THREE.CapsuleGeometry(0.2, 0.9, 2, 6), mat("#3a4250"));
    leg.position.y = -0.45;
    leg.castShadow = true;
    hip.add(leg);
    group.add(hip);
    return hip;
  });
  const body = add(new THREE.CapsuleGeometry(0.45, 0.8, 2, 8), "#9a5a3c", 1.75);
  const head = add(new THREE.IcosahedronGeometry(0.4, 1), "#d9b28c", 2.75);
  return { group, body, head, legs };
}

function butterfly(color: string) {
  const group = new THREE.Group();
  const wingGeo = new THREE.PlaneGeometry(0.6, 0.5);
  wingGeo.translate(0.3, 0, 0);
  const material = new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide });
  const left = new THREE.Mesh(wingGeo, material);
  const right = new THREE.Mesh(wingGeo, material);
  right.rotation.y = Math.PI;
  for (const w of [left, right]) {
    w.rotation.x = -Math.PI / 2;
    group.add(w);
  }
  return { group, left, right };
}

/** Fireflies: tiny bright points drifting over the grass (the white specks in the reference). */
function fireflies(count: number) {
  const base = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) base.set([(random() - 0.5) * 86, 0.6 + random() * 2, WALL_Z + 2 + random() * 54], i * 3);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.Float32BufferAttribute(base.slice(), 3));
  const points = new THREE.Points(geo, new THREE.PointsMaterial({ color: "#b8b48e", size: 1.5, sizeAttenuation: false }));
  const update = (t: number) => {
    const p = geo.attributes.position;
    for (let i = 0; i < count; i++) {
      p.setXYZ(i, base[i * 3] + Math.sin(t * 0.2 + i) * 1.2, base[i * 3 + 1] + Math.sin(t * 0.4 + i * 1.7) * 0.3, base[i * 3 + 2] + Math.cos(t * 0.15 + i * 0.7) * 1.2);
    }
    p.needsUpdate = true;
  };
  return { points, update };
}

/** The 3D world. `canvas` is the visible canvas: ascii.ts draws the final characters onto it. */
export function createScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // Multisampled, so thin blades are smooth coverage instead of pixels popping on and off as they sway.
  const target = new THREE.WebGLRenderTarget(1, 1, { samples: 4 });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(NIGHT);
  scene.fog = new THREE.Fog(NIGHT, 45, 110);
  const camera = new THREE.PerspectiveCamera(40, 1, NEAR, FAR);

  // Dusk: cool moonlight from the upper left, a dim blue sky fill, warm torches by the gate.
  scene.add(new THREE.HemisphereLight("#8fa2d0", "#1a2018", 1.7));
  const moon = new THREE.DirectionalLight("#dfe6ff", 2.8);
  moon.position.set(-20, 40, 10);
  moon.castShadow = true;
  moon.shadow.mapSize.set(2048, 2048);
  Object.assign(moon.shadow.camera, { left: -50, right: 50, top: 50, bottom: -50, far: 120 });
  scene.add(moon, moon.target);

  scene.add(ground());
  const water = pond();
  scene.add(water.mesh);
  const grass = grassField(150000);
  scene.add(grass.mesh);
  const forest = trees();
  scene.add(forest.trunkMesh, forest.crownMesh);
  scene.add(castle());
  const torches = [torch(-3.4, WALL_Z + 2.2), torch(3.4, WALL_Z + 2.2), torch(-14, WALL_Z + 2)];
  for (const t of torches) scene.add(t.group);
  const flies = fireflies(120);
  scene.add(flies.points);

  const log = new THREE.Group();
  const bark = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.58, 3.6, 10), mat("#5a4030"));
  bark.castShadow = bark.receiveShadow = true;
  log.add(bark);
  for (const end of [-1, 1]) {
    const face = new THREE.Mesh(new THREE.CircleGeometry(end > 0 ? 0.49 : 0.57, 10), mat("#c9a878"));
    face.position.y = end * 1.81;
    face.rotation.x = -end * (Math.PI / 2);
    log.add(face);
  }
  log.rotation.z = Math.PI / 2;
  log.position.y = 0.5;
  scene.add(log); // no collider: you step over it (the first key most people press is W, straight at it)

  const sleeper = person();
  scene.add(sleeper.group);

  const butterflies = ["#ffb03a", "#d68cff", "#7cc8ff"].map((color, i) => ({ ...butterfly(color), phase: i * 2.1 }));
  for (const b of butterflies) {
    b.group.scale.setScalar(0.55);
    scene.add(b.group);
  }

  // The camera looks a little ahead (north) of the player, eases after them, and stops at the map edges.
  const focus = new THREE.Vector3(0, 0, -11);
  const focusTarget = new THREE.Vector3();
  const lastFocus = new THREE.Vector3();
  const projected = new THREE.Vector3();
  let lastNow = 0;

  return {
    renderer,

    /** Size the visible canvas, and the off-screen render to the character grid. `aspect` is the grid's width/height. */
    resize(width: number, height: number, dpr: number, cols: number, rows: number, aspect: number) {
      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);
      target.setSize(cols * SUPERSAMPLE, rows * SUPERSAMPLE);
      camera.aspect = aspect;
      camera.updateProjectionMatrix();
    },

    /** True if a walker of radius r can't stand at (x, z): map edge, pond, or something solid. */
    blocked(x: number, z: number, r: number) {
      if (x - r < MAP.minX || x + r > MAP.maxX || z - r < MAP.minZ || z + r > MAP.maxZ) return true;
      if (inPond(x, z, r * 0.75)) return true;
      return COLLIDERS.some((c) => Math.hypot(x - c.x, z - c.z) < c.r + r);
    },

    /** Advance the world to time t and render it off-screen. `pose` drives the figure once it's up. */
    render(now: number, t: number, rest: Rest, pose: Pose) {
      const dt = Math.min(0.1, now - lastNow);
      lastNow = now;
      grass.uniforms.uTime.value = t;
      water.uniforms.uTime.value = t;
      flies.update(t);
      torches.forEach((torch, i) => {
        const flicker = 0.92 + 0.08 * Math.sin(t * 2.3 + i * 5) * Math.sin(t * 1.3 + i); // a soft glow, not a strobe
        torch.light.intensity = 16 * flicker;
        torch.flame.scale.y = flicker;
      });

      // Lying along the log, rolling up to stand where `pose` is, walking; going to sleep plays it in reverse.
      const turn = rest.since === null ? 0 : smoothstep(0, WAKE_SECONDS, now - rest.since);
      const up = rest.asleep ? 1 - turn : turn;
      if (up < 1) {
        sleeper.group.rotation.set(0, up * pose.heading, (1 - up) * (Math.PI / 2));
        for (const leg of sleeper.legs) leg.rotation.x = 0;
        sleeper.group.position.set((1 - up) * 1.4 + up * pose.x, 1.3 * (1 - up), up * pose.z);
        sleeper.body.scale.setScalar(1 + (1 - up) * 0.05 * Math.sin(t * 1.6)); // breathing
      } else {
        const swing = Math.sin(pose.stride) * 0.6 * pose.moving;
        sleeper.group.rotation.set(0, pose.heading, 0);
        sleeper.group.position.set(pose.x, Math.abs(Math.sin(pose.stride)) * 0.1 * pose.moving, pose.z);
        sleeper.legs[0].rotation.x = swing;
        sleeper.legs[1].rotation.x = -swing;
      }
      grass.uniforms.uPush.value.copy(sleeper.group.position);

      butterflies.forEach((b, i) => {
        b.group.position.set(6 * Math.sin(t * (0.2 + i * 0.05) + b.phase), 2.2 + 0.6 * Math.sin(t * 0.7 + b.phase), 4 * Math.sin(t * 0.35 + b.phase * 1.7));
        b.group.rotation.y = t * 0.5 + b.phase;
        const flap = Math.sin(t * 7 + b.phase) * 0.8;
        b.left.rotation.y = flap;
        b.right.rotation.y = Math.PI - flap;
      });

      // Asleep: the intro framing, looking a little north so the sleeper sits below the title card's lists.
      if (!rest.asleep) focusTarget.set(clamp(pose.x, -26, 26), 0, clamp(pose.z - 6, -10, 30));
      else focusTarget.set(0, 0, -11);
      lastFocus.copy(focus);
      focus.lerp(focusTarget, 1 - Math.exp(-dt * 3));
      const cameraSpeed = dt > 0 ? lastFocus.distanceTo(focus) / dt : 0;
      camera.position.copy(focus).add(CAMERA_OFFSET);
      camera.lookAt(focus);
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      return { color: target.texture, cameraSpeed };
    },

    /** Where the figure's head is on the character grid, for the Zs. */
    headCell(cols: number, rows: number) {
      sleeper.head.getWorldPosition(projected).project(camera);
      return { col: ((projected.x + 1) / 2) * cols, row: ((1 - projected.y) / 2) * rows };
    },

    /** Where the top of the log is on the character grid, for the "press space to sleep" hint. */
    logCell(cols: number, rows: number) {
      projected.set(0, 1, 0).project(camera);
      return { col: ((projected.x + 1) / 2) * cols, row: ((1 - projected.y) / 2) * rows };
    },

    dispose() {
      target.dispose();
      renderer.dispose();
    },
  };
}

export type World3D = ReturnType<typeof createScene>;
