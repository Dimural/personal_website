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
