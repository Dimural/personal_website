import * as THREE from "three";

// The world is a real low-poly 3D scene. It is never shown directly: it renders small and off-screen,
// and ascii.ts turns each pixel into a character. World units: 1 ≈ one person-width; y is up.

const SUPERSAMPLE = 2; // render pixels per character cell, per axis
const CAMERA_OFFSET = new THREE.Vector3(0, 20, 14);
const NEAR = 5;
const FAR = 120;
const WAKE_SECONDS = 0.9;

const riverZ = (x: number) => 11 + 4 * Math.sin(x * 0.06);
const RIVER_HALF_WIDTH = 4;

function rng(seed: number) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

// Fine grain on surfaces, so each face breaks into lighter and darker characters instead of one flat tone.
function grain(seed: number, contrast: number) {
  const size = 64;
  const data = new Uint8Array(size * size * 4);
  const random = rng(seed);
  for (let i = 0; i < size * size; i++) {
    const v = 255 - random() * contrast;
    data.set([v, v, v, 255], i * 4);
  }
  const tex = new THREE.DataTexture(data, size, size);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.magFilter = THREE.NearestFilter;
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}
const LEAF_GRAIN = grain(3, 120);

const mat = (color: string, map: THREE.Texture | null = null) =>
  new THREE.MeshStandardMaterial({ color, map, flatShading: true, roughness: 1 });

function ground() {
  const geo = new THREE.PlaneGeometry(260, 260, 130, 130);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const colors: number[] = [];
  const random = rng(7);
  const light = new THREE.Color("#f4f7ef");
  const dark = new THREE.Color("#dbe7cf");
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const z = pos.getZ(i);
    const hills = 0.5 * Math.sin(x * 0.07) * Math.cos(z * 0.06);
    const flat = smoothstep(8, 20, Math.hypot(x, z));
    const bed = 1 - smoothstep(RIVER_HALF_WIDTH - 1, RIVER_HALF_WIDTH + 3, Math.abs(z - riverZ(x)));
    pos.setY(i, hills * flat * (1 - bed) - bed * 1.2);
    const c = light.clone().lerp(dark, random() * 0.8);
    colors.push(c.r, c.g, c.b);
  }
  geo.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, flatShading: true, roughness: 1 }));
  mesh.receiveShadow = true;
  return mesh;
}

function river() {
  const geo = new THREE.PlaneGeometry(260, RIVER_HALF_WIDTH * 2, 160, 6);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const base = Float32Array.from(pos.array as Float32Array);
  for (let i = 0; i < pos.count; i++) pos.setZ(i, base[i * 3 + 2] + riverZ(base[i * 3]));
  const mesh = new THREE.Mesh(geo, mat("#7d9fc0"));
  mesh.position.y = -0.4;
  mesh.receiveShadow = true;
  // Ripples travel downstream, so the facets (and their characters) keep changing.
  const update = (t: number) => {
    for (let i = 0; i < pos.count; i++) {
      const x = base[i * 3];
      const z = pos.getZ(i);
      pos.setY(i, 0.25 * Math.sin(x * 0.6 - t * 3 + z * 0.8) + 0.15 * Math.sin(x * 1.3 - t * 4.5));
    }
    pos.needsUpdate = true;
    geo.computeVertexNormals();
  };
  return { mesh, update };
}

type Placement = { position: THREE.Vector3; rotation: THREE.Euler; scale: THREE.Vector3; color?: string };

/** Many copies of one shape drawn in a single call; per-copy colour tints a white material. */
function instanced(geo: THREE.BufferGeometry, material: THREE.Material, items: Placement[]) {
  const mesh = new THREE.InstancedMesh(geo, material, items.length);
  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  items.forEach((it, i) => {
    mesh.setMatrixAt(i, m.compose(it.position, q.setFromEuler(it.rotation), it.scale));
    if (it.color) mesh.setColorAt(i, new THREE.Color(it.color));
  });
  mesh.castShadow = mesh.receiveShadow = true;
  return mesh;
}

function cabin() {
  const group = new THREE.Group();
  const walls = new THREE.Mesh(new THREE.BoxGeometry(7, 4, 5.5), mat("#a88a68"));
  walls.position.y = 2;
  const roof = new THREE.Mesh(new THREE.ConeGeometry(5.6, 3.2, 4), mat("#6e4f3a"));
  roof.position.y = 5.6;
  roof.rotation.y = Math.PI / 4;
  roof.scale.set(1.3, 1, 1);
  const door = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 0.2), mat("#4a3628"));
  door.position.set(0, 1.2, 2.8);
  for (const m of [walls, roof, door]) {
    m.castShadow = true;
    m.receiveShadow = true;
    group.add(m);
  }
  return group;
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
  add(new THREE.CapsuleGeometry(0.22, 1, 2, 6), "#2e3540", 0.7, -0.25);
  add(new THREE.CapsuleGeometry(0.22, 1, 2, 6), "#2e3540", 0.7, 0.25);
  const body = add(new THREE.CapsuleGeometry(0.5, 0.9, 2, 8), "#b5523b", 1.9);
  const head = add(new THREE.IcosahedronGeometry(0.45, 1), "#d9b28c", 3);
  return { group, body, head };
}

function butterfly(color: string) {
  const group = new THREE.Group();
  const wingGeo = new THREE.PlaneGeometry(0.9, 0.7);
  wingGeo.translate(0.45, 0, 0);
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

/** The 3D world. `canvas` is the visible canvas: ascii.ts draws the final characters onto it. */
export function createScene(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: false });
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  // The scene renders small and off-screen; its depth comes along so ascii.ts can outline shapes.
  const target = new THREE.WebGLRenderTarget(1, 1, { depthTexture: new THREE.DepthTexture(1, 1) });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#ffffff");
  scene.fog = new THREE.Fog("#ffffff", 55, 115);
  const camera = new THREE.PerspectiveCamera(40, 1, NEAR, FAR);

  scene.add(new THREE.HemisphereLight("#ffffff", "#9aa88f", 2.2));
  const sun = new THREE.DirectionalLight("#ffffff", 3.2);
  sun.position.set(-14, 60, -6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  Object.assign(sun.shadow.camera, { left: -70, right: 70, top: 70, bottom: -70, far: 150 });
  scene.add(sun, sun.target);

  scene.add(ground());
  const water = river();
  scene.add(water.mesh);

  // Trees, bushes and rocks are instanced: hundreds of separate meshes cost a draw call each, per pass.
  const random = rng(42);
  const crowns: (Placement & { phase: number })[] = [];
  const trunks: Placement[] = [];
  while (crowns.length < 220) {
    const x = (random() - 0.5) * 160;
    const z = (random() - 0.5) * 130;
    if (Math.hypot(x * 0.9, z * 1.8) < 7 || Math.abs(z - riverZ(x)) < RIVER_HALF_WIDTH + 4) continue;
    if (Math.hypot(x + 15, z + 9) < 8) continue; // the cabin's yard
    const h = 2.5 + random() * 2;
    const r = 2.6 + random() * 1.2;
    trunks.push({ position: new THREE.Vector3(x, h / 2, z), rotation: new THREE.Euler(), scale: new THREE.Vector3(1, h, 1) });
    crowns.push({
      position: new THREE.Vector3(x, h + r * 0.7, z),
      rotation: new THREE.Euler(0, random() * Math.PI * 2, 0),
      scale: new THREE.Vector3(r, r * 0.85, r),
      color: ["#2d5233", "#36603b", "#284a2e"][Math.floor(random() * 3)],
      phase: random() * 10,
    });
  }
  scene.add(instanced(new THREE.CylinderGeometry(0.35, 0.5, 1, 6), mat("#6b513c"), trunks));
  const crownMesh = instanced(new THREE.IcosahedronGeometry(1, 1), mat("#ffffff", LEAF_GRAIN), crowns);
  scene.add(crownMesh);
  const crownMatrix = new THREE.Matrix4();
  const crownTurn = new THREE.Quaternion();
  const crownSway = new THREE.Vector3();

  const bushes: Placement[] = [];
  for (let i = 0; i < 120; i++) {
    const x = (random() - 0.5) * 120;
    const z = (random() - 0.5) * 100;
    if (Math.hypot(x, z * 1.6) < 6 || Math.abs(z - riverZ(x)) < RIVER_HALF_WIDTH + 0.5 || Math.hypot(x + 15, z + 9) < 6) continue;
    const r = 0.6 + random() * 1;
    bushes.push({
      position: new THREE.Vector3(x, r * 0.6, z),
      rotation: new THREE.Euler(random() * 3, random() * 3, 0),
      scale: new THREE.Vector3(r, r, r),
      color: ["#4d7d49", "#5b8a58", "#426f40"][i % 3],
    });
  }
  scene.add(instanced(new THREE.IcosahedronGeometry(1, 0), mat("#ffffff", LEAF_GRAIN), bushes));

  const rocks: Placement[] = [];
  for (let i = 0; i < 30; i++) {
    const x = (random() - 0.5) * 160;
    const z = (random() - 0.5) * 140;
    if (Math.hypot(x, z) < 8 || Math.abs(z - riverZ(x)) < RIVER_HALF_WIDTH + 1) continue;
    const r = 0.6 + random() * 1.4;
    rocks.push({ position: new THREE.Vector3(x, 0.3, z), rotation: new THREE.Euler(random() * 3, random() * 3, 0), scale: new THREE.Vector3(r, r, r) });
  }
  scene.add(instanced(new THREE.DodecahedronGeometry(1, 0), mat("#9a9c98"), rocks));

  const house = cabin();
  house.position.set(-15, 0, -9);
  house.rotation.y = 0.4;
  scene.add(house);

  // Grass tufts sway in the wind; one instanced mesh keeps it cheap.
  const tuftGeo = new THREE.ConeGeometry(0.3, 1.6, 3);
  tuftGeo.translate(0, 0.55, 0);
  const tufts = new THREE.InstancedMesh(tuftGeo, mat("#9cbf8a"), 350);
  const tuftSpots: THREE.Vector3[] = [];
  while (tuftSpots.length < tufts.count) {
    const x = (random() - 0.5) * 100;
    const z = (random() - 0.5) * 80;
    if (Math.abs(z - riverZ(x)) < RIVER_HALF_WIDTH + 0.5 || (Math.abs(x) < 5 && Math.abs(z) < 2)) continue;
    tuftSpots.push(new THREE.Vector3(x, 0, z));
  }
  tufts.castShadow = true;
  scene.add(tufts);
  const tuftMatrix = new THREE.Matrix4();
  const tuftTurn = new THREE.Quaternion();
  const tuftAxis = new THREE.Vector3(0, 0, 1);
  const one = new THREE.Vector3(1, 1, 1);

  // Dark bark with pale cut ends and a ring, so it reads as a log rather than a brown box.
  const log = new THREE.Group();
  const bark = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1, 7, 12), mat("#6e5038", LEAF_GRAIN));
  bark.castShadow = bark.receiveShadow = true;
  log.add(bark);
  for (const end of [-1, 1]) {
    const face = new THREE.Mesh(new THREE.CircleGeometry(end > 0 ? 0.88 : 0.98, 12), mat("#e2c595"));
    face.position.y = end * 3.51;
    face.rotation.x = -end * (Math.PI / 2);
    const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.5, 12), mat("#9b7650"));
    ring.position.y = end * 3.52;
    ring.rotation.x = face.rotation.x;
    log.add(face, ring);
  }
  log.rotation.z = Math.PI / 2;
  log.position.y = 0.9;
  scene.add(log);

  const sleeper = person();
  sleeper.group.scale.setScalar(1.5);
  scene.add(sleeper.group);

  const butterflies = ["#e0a040", "#b070d0", "#5aa0d0"].map((color, i) => ({ ...butterfly(color), phase: i * 2.1 }));
  for (const b of butterflies) {
    b.group.scale.setScalar(0.65);
    scene.add(b.group);
  }

  const focus = new THREE.Vector3();
  const headWorld = new THREE.Vector3();

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

    /** Advance the world to time t and render it off-screen. Returns the colour and depth textures. */
    render(now: number, t: number, wokeAt: number | null) {
      water.update(t);
      crowns.forEach((c, i) => {
        crownSway.set(Math.sin(t * 1.2 + c.phase) * 0.12, 0, 0).add(c.position);
        crownMesh.setMatrixAt(i, crownMatrix.compose(crownSway, crownTurn.setFromEuler(c.rotation), c.scale));
      });
      crownMesh.instanceMatrix.needsUpdate = true;
      LEAF_GRAIN.offset.set(t * 0.03, Math.sin(t * 0.8) * 0.02); // leaves shimmer in the wind
      tuftSpots.forEach((p, i) => {
        tuftTurn.setFromAxisAngle(tuftAxis, Math.sin(t * 2.2 + p.x * 0.3 + p.z * 0.2) * 0.35);
        tufts.setMatrixAt(i, tuftMatrix.compose(p, tuftTurn, one));
      });
      tufts.instanceMatrix.needsUpdate = true;

      // Lying along the log, then rolling up to stand beside it.
      const up = wokeAt === null ? 0 : smoothstep(0, WAKE_SECONDS, now - wokeAt);
      sleeper.group.rotation.z = (1 - up) * (Math.PI / 2);
      sleeper.group.position.set((1 - up) * 2.4, 2.2 * (1 - up), up * 3);
      sleeper.body.scale.setScalar(1 + (1 - up) * 0.04 * Math.sin(t * 1.6)); // breathing

      butterflies.forEach((b, i) => {
        b.group.position.set(9 * Math.sin(t * (0.4 + i * 0.1) + b.phase), 3 + Math.sin(t * 1.3 + b.phase), 5 * Math.sin(t * 0.7 + b.phase * 1.7));
        b.group.rotation.y = t * 0.5 + b.phase;
        const flap = Math.sin(t * 14 + b.phase) * 0.9;
        b.left.rotation.y = flap;
        b.right.rotation.y = Math.PI - flap;
      });

      camera.position.copy(focus).add(CAMERA_OFFSET);
      camera.lookAt(focus);
      renderer.setRenderTarget(target);
      renderer.render(scene, camera);
      return { color: target.texture, depth: target.depthTexture!, near: NEAR, far: FAR };
    },

    /** Where the figure's head is on the character grid, for labels and Zs. */
    headCell(cols: number, rows: number) {
      sleeper.head.getWorldPosition(headWorld).project(camera);
      return { col: ((headWorld.x + 1) / 2) * cols, row: ((1 - headWorld.y) / 2) * rows };
    },

    dispose() {
      target.dispose();
      renderer.dispose();
    },
  };
}

export type World3D = ReturnType<typeof createScene>;
