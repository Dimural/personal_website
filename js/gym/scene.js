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
  // Thick solid base slab — prevents "floating gym" look
  const baseMat = new THREE.MeshLambertMaterial({ color: 0xb8a070 });
  const base = new THREE.Mesh(new THREE.BoxGeometry(ROOM, 1.2, ROOM), baseMat);
  base.position.set(0, -0.6, 0);
  base.receiveShadow = true;
  threeScene.add(base);

  // Checkerboard tiles on top
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

  // Right wall (x = +HALF): ROOM tiles deep
  const rightGeo = new THREE.BoxGeometry(0.3, WALL_H, 1);
  const rightMesh = new THREE.InstancedMesh(rightGeo, wallMat, ROOM);
  for (let z = 0; z < ROOM; z++) {
    dummy.position.set(HALF, WALL_H / 2, z - HALF + 0.5);
    dummy.updateMatrix();
    rightMesh.setMatrixAt(z, dummy.matrix);
  }
  rightMesh.instanceMatrix.needsUpdate = true;
  threeScene.add(rightMesh);

  // Windows on right wall — every 4 tiles starting at z=1
  for (let z = 1; z < ROOM; z += 4) {
    const w = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.9, 0.65), winMat);
    w.position.set(HALF + 0.05, WALL_H * 0.65, z - HALF + 0.5);
    threeScene.add(w);
  }

  // Entrance strip (front edge, z = HALF - 0.15)
  const stripMat = new THREE.MeshLambertMaterial({ color: 0x0071e3, transparent: true, opacity: 0.45 });
  const strip = new THREE.Mesh(new THREE.BoxGeometry(4, 0.05, 0.3), stripMat);
  strip.position.set(0, 0.08, HALF - 0.15);
  threeScene.add(strip);

  // ── Pendant light fixtures ────────────────────────────────────
  const pendantBodyMat = new THREE.MeshLambertMaterial({ color: 0x2a2a2a });
  // MeshBasicMaterial ignores scene lighting — always renders at full brightness (glow effect)
  const pendantGlowMat = new THREE.MeshBasicMaterial({ color: 0xfff0b0 });

  [
    [ 0, -3],   // beam1–beam3 intersection
    [ 0,  3],   // beam2–beam3 intersection
    [-5, -3],   // beam1, left
    [ 5, -3],   // beam1, right
    [-5,  3],   // beam2, left
    [ 5,  3],   // beam2, right
  ].forEach(([px, pz]) => {
    // Cord
    const cord = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.5, 0.04), pendantBodyMat);
    cord.position.set(px, 3.0, pz);
    threeScene.add(cord);
    // Shade
    const shade = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.18, 0.35), pendantBodyMat);
    shade.position.set(px, 2.7, pz);
    threeScene.add(shade);
    // Glowing core (MeshBasicMaterial = full brightness regardless of lighting)
    const glow = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.1, 0.15), pendantGlowMat);
    glow.position.set(px, 2.6, pz);
    threeScene.add(glow);
  });

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

  // Warm accent point lights above each equipment cluster
  [
    [-6, 2.8, -7],  // bench press
    [ 6, 2.8, -7],  // dumbbell rack
    [-6, 2.8,  5],  // treadmill
    [ 5, 2.8, -2],  // pull-up rig
    [ 0, 2.8, -3],  // punching bag
  ].forEach(([x, y, z]) => {
    const pt = new THREE.PointLight(0xffaa44, 0.9, 7);
    pt.position.set(x, y, z);
    threeScene.add(pt);
  });

  // Cool fill light near entrance
  const fill = new THREE.PointLight(0xaaccff, 0.4, 10);
  fill.position.set(0, 2.5, 8);
  threeScene.add(fill);
}
