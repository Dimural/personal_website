// js/gym/decorations.js
import * as THREE from 'three';

// Local room constants (mirrors scene.js values, avoids import coupling)
const ROOM = 20;
const HALF = 10;

export function buildDecorations(scene) {
  _buildMirrors(scene);
  _buildLockers(scene);
  _buildRubberMats(scene);
  _buildFloorStripe(scene);
  _buildTallPalms(scene);
  _buildSpeedBag(scene);
  _buildWeightTree(scene);
  _buildTowelRack(scene);
  _buildWaterCooler(scene);
  _buildFoamRollers(scene);
}

// ── Back-wall mirrors (z ≈ -9.75) ────────────────────────────
function _buildMirrors(scene) {
  const frameMat = new THREE.MeshLambertMaterial({ color: 0x9a7850 });
  const glassMat = new THREE.MeshLambertMaterial({ color: 0xc8dce8, transparent: true, opacity: 0.82 });

  [-7, -2.5, 2, 7].forEach(x => {
    // Wooden frame
    const frame = new THREE.Mesh(new THREE.BoxGeometry(2.55, 2.25, 0.1), frameMat);
    frame.position.set(x, 1.85, -9.76);
    scene.add(frame);
    // Glass face
    const glass = new THREE.Mesh(new THREE.BoxGeometry(2.25, 1.95, 0.06), glassMat);
    glass.position.set(x, 1.85, -9.72);
    scene.add(glass);
  });
}

// ── Locker bank — right-back wall, z = -6.5 to -2.9 ─────────
function _buildLockers(scene) {
  const bodyMat   = new THREE.MeshLambertMaterial({ color: 0x78888e });
  const doorMat   = new THREE.MeshLambertMaterial({ color: 0x8a9ea4 });
  const handleMat = new THREE.MeshLambertMaterial({ color: 0xd0d0d0 });
  const ventMat   = new THREE.MeshLambertMaterial({ color: 0x566870 });
  const accentMat = new THREE.MeshLambertMaterial({ color: 0x0071e3 });

  [-6.5, -5.6, -4.7, -3.8, -2.9].forEach(z => {
    // Body (snug against right wall x=HALF=10)
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.48, 1.85, 0.78), bodyMat);
    body.position.set(9.56, 0.925, z);
    scene.add(body);
    // Door face (facing into room)
    const door = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.72, 0.72), doorMat);
    door.position.set(9.29, 0.925, z);
    scene.add(door);
    // Blue accent stripe along top of door
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, 0.72), accentMat);
    stripe.position.set(9.29, 1.76, z);
    scene.add(stripe);
    // Handle
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.06), handleMat);
    handle.position.set(9.23, 0.95, z - 0.25);
    scene.add(handle);
    // Three vent slots near top
    [-0.18, 0, 0.18].forEach(dz => {
      const vent = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.2), ventMat);
      vent.position.set(9.26, 1.55, z + dz);
      scene.add(vent);
    });
  });
}

// ── Rubber floor mats under equipment ────────────────────────
function _buildRubberMats(scene) {
  const rubberMat = new THREE.MeshLambertMaterial({ color: 0x252530 });

  [
    { x: -6,  z: -7,   w: 2.8, d: 2.4 },  // bench press
    { x:  5,  z: -2,   w: 2.6, d: 2.6 },  // pull-up rig
    { x: -5,  z:  7.2, w: 3.2, d: 2.4 },  // stretching corner
  ].forEach(({ x, z, w, d }) => {
    const mat = new THREE.Mesh(new THREE.BoxGeometry(w, 0.06, d), rubberMat);
    mat.position.set(x, 0.04, z);
    scene.add(mat);
  });
}

// ── Perimeter floor stripe — dark blue border ring ────────────
function _buildFloorStripe(scene) {
  const stripeMat = new THREE.MeshLambertMaterial({ color: 0x1a4a8a });
  const T = 0.45;  // stripe thickness

  [
    { pos: [0,              0.06, -(HALF - T / 2)], size: [ROOM, 0.04, T]  },  // back
    { pos: [0,              0.06,  (HALF - T / 2)], size: [ROOM, 0.04, T]  },  // front
    { pos: [-(HALF - T / 2), 0.06, 0],              size: [T,    0.04, ROOM] }, // left
    { pos: [ (HALF - T / 2), 0.06, 0],              size: [T,    0.04, ROOM] }, // right
  ].forEach(({ pos, size }) => {
    const stripe = new THREE.Mesh(new THREE.BoxGeometry(...size), stripeMat);
    stripe.position.set(...pos);
    scene.add(stripe);
  });
}

// ── Tall corner palms — back corners ─────────────────────────
function _buildTallPalms(scene) {
  const trunkMat  = new THREE.MeshLambertMaterial({ color: 0x8a6030 });
  const leafDkMat = new THREE.MeshLambertMaterial({ color: 0x2e5e2e });
  const leafLtMat = new THREE.MeshLambertMaterial({ color: 0x3e7a3e });
  const potMat    = new THREE.MeshLambertMaterial({ color: 0xb06840 });

  [[-8, -8.5], [8, -8.5]].forEach(([px, pz]) => {
    // Pot
    const pot = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.5, 0.65), potMat);
    pot.position.set(px, 0.25, pz);
    scene.add(pot);

    // Trunk — 6 tapered sections
    [0, 0.5, 1.0, 1.5, 2.0, 2.5].forEach((y, i) => {
      const s = 0.24 - i * 0.02;
      const trunk = new THREE.Mesh(new THREE.BoxGeometry(s, 0.55, s), trunkMat);
      trunk.position.set(px, 0.6 + y, pz);
      scene.add(trunk);
    });

    // Bottom leaf tier — 4 sprawling diagonal leaves
    [
      [-0.55, 0, 0], [0.55, 0, 0],
      [0, 0, -0.55], [0, 0,  0.55],
    ].forEach(([dx, dy, dz]) => {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.65, 0.14, 0.65), leafDkMat);
      leaf.position.set(px + dx * 1.1, 2.85, pz + dz * 1.1);
      scene.add(leaf);
    });

    // Mid tier — 6 smaller leaves
    [
      [-0.4, 0, 0], [0.4, 0, 0],
      [0, 0, -0.4], [0, 0,  0.4],
      [-0.28, 0, -0.28], [0.28, 0, 0.28],
    ].forEach(([dx, dy, dz]) => {
      const leaf = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.16, 0.5), leafLtMat);
      leaf.position.set(px + dx, 3.25, pz + dz);
      scene.add(leaf);
    });

    // Crown top
    const crown = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.28, 0.55), leafDkMat);
    crown.position.set(px, 3.55, pz);
    scene.add(crown);
  });
}

// ── Speed bag on post — near punching bag (2.5, 0, -4.5) ─────
function _buildSpeedBag(scene) {
  const poleMat = new THREE.MeshLambertMaterial({ color: 0x5a5a6a });
  const bagMat  = new THREE.MeshLambertMaterial({ color: 0xc03020 });
  const baseMat = new THREE.MeshLambertMaterial({ color: 0x3a3a4a });

  const cx = 2.5, cz = -4.5;
  // Floor base
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.12, 0.35), baseMat);
  base.position.set(cx, 0.06, cz);
  scene.add(base);
  // Vertical pole
  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.4, 0.1), poleMat);
  pole.position.set(cx, 1.2, cz);
  scene.add(pole);
  // Horizontal arm
  const arm = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.6), poleMat);
  arm.position.set(cx, 2.4, cz + 0.3);
  scene.add(arm);
  // Swivel platform
  const swivel = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.08, 0.2), baseMat);
  swivel.position.set(cx, 2.35, cz + 0.6);
  scene.add(swivel);
  // Bag body
  const bagBody = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.26), bagMat);
  bagBody.position.set(cx, 2.05, cz + 0.6);
  scene.add(bagBody);
  // Bag top nub
  const bagTop = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.14, 0.18), bagMat);
  bagTop.position.set(cx, 2.26, cz + 0.6);
  scene.add(bagTop);
}

// ── Weight tree — near dumbbell rack (4.5, 0, -8.5) ──────────
function _buildWeightTree(scene) {
  const poleMat   = new THREE.MeshLambertMaterial({ color: 0x5a5a6a });
  const baseMat   = new THREE.MeshLambertMaterial({ color: 0x3a3a4a });
  const plateMats = [
    new THREE.MeshLambertMaterial({ color: 0x2a2a3a }),
    new THREE.MeshLambertMaterial({ color: 0x8a2020 }),
    new THREE.MeshLambertMaterial({ color: 0x205a20 }),
    new THREE.MeshLambertMaterial({ color: 0x204070 }),
  ];

  const cx = 4.5, cz = -8.5;

  // Base plate
  const base = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.12, 0.8), baseMat);
  base.position.set(cx, 0.06, cz);
  scene.add(base);
  // Centre pole
  const pole = new THREE.Mesh(new THREE.BoxGeometry(0.14, 2.0, 0.14), poleMat);
  pole.position.set(cx, 1.0, cz);
  scene.add(pole);
  // Three horizontal pegs at increasing heights
  [0.5, 0.9, 1.3].forEach(y => {
    const peg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.5), poleMat);
    peg.position.set(cx, y, cz);
    scene.add(peg);
  });
  // Stacked weight plates on base peg — decreasing radius upward
  [
    { y: 0.18, s: 0.54, t: 0.10, ci: 0 },
    { y: 0.29, s: 0.47, t: 0.10, ci: 1 },
    { y: 0.40, s: 0.40, t: 0.10, ci: 2 },
    { y: 0.50, s: 0.34, t: 0.08, ci: 3 },
    { y: 0.59, s: 0.28, t: 0.08, ci: 0 },
  ].forEach(({ y, s, t, ci }) => {
    const plate = new THREE.Mesh(new THREE.BoxGeometry(t, s, s), plateMats[ci]);
    plate.position.set(cx, y, cz);
    scene.add(plate);
  });
}

// ── Towel rack — left wall (-9.4, y, -1.5) ───────────────────
function _buildTowelRack(scene) {
  const bracketMat = new THREE.MeshLambertMaterial({ color: 0x9a9a9a });
  const barMat     = new THREE.MeshLambertMaterial({ color: 0xc8c8c8 });
  const towelMats  = [
    new THREE.MeshLambertMaterial({ color: 0xf0f0f0 }),
    new THREE.MeshLambertMaterial({ color: 0xe8e0d0 }),
    new THREE.MeshLambertMaterial({ color: 0xd0e0f0 }),
  ];

  // Two wall brackets
  [-0.35, 0.35].forEach(dz => {
    const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.08, 0.08), bracketMat);
    bracket.position.set(-9.55, 1.4, -1.5 + dz);
    scene.add(bracket);
  });
  // Horizontal bar
  const bar = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.06, 0.85), barMat);
  bar.position.set(-9.38, 1.4, -1.5);
  scene.add(bar);
  // Three rolled towels
  [-0.24, 0, 0.24].forEach((dz, i) => {
    const roll = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.22, 0.22), towelMats[i]);
    roll.position.set(-9.38, 1.52, -1.5 + dz);
    scene.add(roll);
  });
}

// ── Water cooler — near entrance (4.5, 0, 8.5) ───────────────
function _buildWaterCooler(scene) {
  const bodyMat = new THREE.MeshLambertMaterial({ color: 0xd8e8f0 });
  const tankMat = new THREE.MeshLambertMaterial({ color: 0xa8c8e0 });
  const baseMat = new THREE.MeshLambertMaterial({ color: 0xe0e0e0 });
  const tapC    = new THREE.MeshLambertMaterial({ color: 0x2080c0 }); // cold tap
  const tapH    = new THREE.MeshLambertMaterial({ color: 0xc03020 }); // hot tap

  const cx = 4.5, cz = 8.5;
  // Base cabinet
  scene.add(Object.assign(
    new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.7, 0.45), baseMat),
    { position: new THREE.Vector3(cx, 0.35, cz) }
  ));
  // Body
  scene.add(Object.assign(
    new THREE.Mesh(new THREE.BoxGeometry(0.48, 0.6, 0.38), bodyMat),
    { position: new THREE.Vector3(cx, 1.0, cz) }
  ));
  // Water tank (blue rounded box)
  scene.add(Object.assign(
    new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.5, 0.32), tankMat),
    { position: new THREE.Vector3(cx, 1.55, cz) }
  ));
  // Cold tap
  scene.add(Object.assign(
    new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.12), tapC),
    { position: new THREE.Vector3(cx - 0.1, 0.88, cz - 0.25) }
  ));
  // Hot tap
  scene.add(Object.assign(
    new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.12), tapH),
    { position: new THREE.Vector3(cx + 0.1, 0.88, cz - 0.25) }
  ));
  // Drip tray
  scene.add(Object.assign(
    new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.04, 0.14), baseMat),
    { position: new THREE.Vector3(cx, 0.73, cz - 0.18) }
  ));
}

// ── Foam roller basket — stretching corner (-4, 0, 6.5) ──────
function _buildFoamRollers(scene) {
  const crateMat   = new THREE.MeshLambertMaterial({ color: 0xb0803a });
  const rollerMats = [
    new THREE.MeshLambertMaterial({ color: 0x3060a0 }),
    new THREE.MeshLambertMaterial({ color: 0xa02828 }),
    new THREE.MeshLambertMaterial({ color: 0x286030 }),
  ];

  const cx = -4, cz = 6.5;
  // Crate floor
  scene.add(Object.assign(
    new THREE.Mesh(new THREE.BoxGeometry(0.88, 0.06, 0.88), crateMat),
    { position: new THREE.Vector3(cx, 0.03, cz) }
  ));
  // Four crate walls
  [
    { pos: [cx,        0.28, cz - 0.43], size: [0.9,  0.5,  0.06] },
    { pos: [cx,        0.28, cz + 0.43], size: [0.9,  0.5,  0.06] },
    { pos: [cx - 0.43, 0.28, cz],        size: [0.06, 0.5,  0.9]  },
    { pos: [cx + 0.43, 0.28, cz],        size: [0.06, 0.5,  0.9]  },
  ].forEach(({ pos, size }) => {
    const wall = new THREE.Mesh(new THREE.BoxGeometry(...size), crateMat);
    wall.position.set(...pos);
    scene.add(wall);
  });
  // Three foam rollers lying on their sides
  [
    { y: 0.16, dz: -0.16, ci: 0 },
    { y: 0.16, dz:  0.16, ci: 1 },
    { y: 0.38, dz:  0,    ci: 2 },
  ].forEach(({ y, dz, ci }) => {
    const roller = new THREE.Mesh(
      new THREE.CylinderGeometry(0.1, 0.1, 0.6, 10),
      rollerMats[ci]
    );
    roller.rotation.z = Math.PI / 2;
    roller.position.set(cx, y, cz + dz);
    scene.add(roller);
  });
}
