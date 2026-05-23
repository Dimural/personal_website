// js/gym/camera.js
import * as THREE from 'three';

// Crossy Road-style: steep isometric angle, fixed orthographic view
const CAM_ELEVATION = Math.PI * 0.31;  // ~56° above horizon
const CAM_AZIMUTH   = Math.PI / 4;     // 45° horizontal
const CAM_DISTANCE  = 42;
const ORTHO_SIZE    = 14;              // half-height in world units

// Fixed position — camera never moves, whole gym always in frame
export const CAM_POS = new THREE.Vector3(
  CAM_DISTANCE * Math.sin(CAM_AZIMUTH) * Math.cos(CAM_ELEVATION),
  CAM_DISTANCE * Math.sin(CAM_ELEVATION),
  CAM_DISTANCE * Math.cos(CAM_AZIMUTH) * Math.cos(CAM_ELEVATION)
);
// ≈ (16.5, 33.3, 16.5)

export function createCamera(renderer) {
  const w = renderer.domElement.clientWidth;
  const h = renderer.domElement.clientHeight;
  const aspect = w / h;
  const s = ORTHO_SIZE;

  const cam = new THREE.OrthographicCamera(
    -s * aspect, s * aspect,   // left, right
     s,         -s,             // top, bottom
     0.1,        200            // near, far
  );
  cam.position.copy(CAM_POS);
  cam.lookAt(0, 0, 0);
  return cam;
}

// No-op for movement — camera is fixed. Called by main.js each frame.
export function updateCamera(/* camera, playerPos, delta */) {}

export function resizeCamera(camera, renderer) {
  const aspect = renderer.domElement.clientWidth / renderer.domElement.clientHeight;
  const s = ORTHO_SIZE;
  camera.left   = -s * aspect;
  camera.right  =  s * aspect;
  camera.top    =  s;
  camera.bottom = -s;
  camera.updateProjectionMatrix();
}
