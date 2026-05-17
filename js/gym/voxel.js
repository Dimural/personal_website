// js/gym/voxel.js
import * as THREE from 'three';

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

export function group(...meshes) {
  const g = new THREE.Group();
  meshes.forEach(m => g.add(m));
  return g;
}
