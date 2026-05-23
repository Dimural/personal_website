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

// Internal: current smoothed camera position
const _camPos = new THREE.Vector3();
let _initialised = false;

export function createCamera(renderer) {
  const aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
  const cam = new THREE.PerspectiveCamera(52, aspect, 0.1, 120);
  return cam;
}

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

export function resizeCamera(camera, renderer) {
  camera.aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
  camera.updateProjectionMatrix();
}
