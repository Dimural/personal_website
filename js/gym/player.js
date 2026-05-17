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
