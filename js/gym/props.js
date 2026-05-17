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
