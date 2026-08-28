import * as THREE from "three";
import { makeOakTexture, makePlasterTexture } from "./materials";

/** Where each bay sits along the wall. The toggle dollies between them. */
export const BAY_X: Record<"experience" | "projects", number> = {
  experience: -1.55,
  projects: 1.55,
};

export const BAY_INNER_WIDTH = 1.95;
export const SHELF_DEPTH = 0.92;
const PANEL = 0.085;
const PLANK = 0.075;
const BAY_INNER_HEIGHT = 2.42;

/** Y of the surface books stand on. */
export const SHELF_SURFACE_Y = -BAY_INNER_HEIGHT / 2;

function oakMaterial(repeat: [number, number]) {
  return new THREE.MeshStandardMaterial({
    map: makeOakTexture(repeat),
    roughness: 0.72,
    metalness: 0,
  });
}

function buildBay(x: number) {
  const bay = new THREE.Group();
  bay.position.x = x;

  const outerW = BAY_INNER_WIDTH + PANEL * 2;
  const side = oakMaterial([1, 2]);
  const plank = oakMaterial([2, 1]);

  // Uprights
  for (const dir of [-1, 1]) {
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(PANEL, BAY_INNER_HEIGHT + PLANK * 2, SHELF_DEPTH),
      side,
    );
    panel.position.set(dir * (BAY_INNER_WIDTH / 2 + PANEL / 2), 0, 0);
    panel.castShadow = true;
    panel.receiveShadow = true;
    bay.add(panel);
  }

  // Shelf and header
  for (const dir of [-1, 1]) {
    const board = new THREE.Mesh(
      new THREE.BoxGeometry(outerW, PLANK, SHELF_DEPTH),
      plank,
    );
    board.position.set(0, dir * (BAY_INNER_HEIGHT / 2 + PLANK / 2), 0);
    board.castShadow = true;
    board.receiveShadow = true;
    bay.add(board);
  }

  // Back board, set in from the wall so the shelf casts its own shadow.
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(outerW, BAY_INNER_HEIGHT, 0.04),
    new THREE.MeshStandardMaterial({ color: "#d9d0c1", roughness: 0.94 }),
  );
  back.position.z = -SHELF_DEPTH / 2 + 0.02;
  back.receiveShadow = true;
  bay.add(back);

  return bay;
}

export function createRoom(scene: THREE.Scene) {
  const room = new THREE.Group();

  // Wall
  const wall = new THREE.Mesh(
    new THREE.PlaneGeometry(30, 18),
    new THREE.MeshStandardMaterial({ map: makePlasterTexture(), roughness: 0.97 }),
  );
  wall.position.z = -SHELF_DEPTH / 2 - 0.06;
  wall.receiveShadow = true;
  room.add(wall);

  // Floor, catching the light from below
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(40, 24),
    new THREE.MeshStandardMaterial({ color: "#ddd5c6", roughness: 0.95 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -3.6;
  floor.receiveShadow = true;
  room.add(floor);

  room.add(buildBay(BAY_X.experience));
  room.add(buildBay(BAY_X.projects));

  scene.add(room);
  return room;
}

export function addLights(scene: THREE.Scene) {
  // Daylight, not lamplight: soft sky fill plus one window key.
  scene.add(new THREE.HemisphereLight(0xf6f1e7, 0xc9bda6, 1.32));

  const key = new THREE.DirectionalLight(0xfff6e8, 1.35);
  key.position.set(-3.1, 4.7, 7.4);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.near = 0.5;
  key.shadow.camera.far = 30;
  key.shadow.camera.left = -9;
  key.shadow.camera.right = 9;
  key.shadow.camera.top = 7;
  key.shadow.camera.bottom = -7;
  key.shadow.bias = -0.0012;
  key.shadow.normalBias = 0.02;
  scene.add(key);

  // Bounce off the opposite wall so the shadow sides never go muddy.
  const fill = new THREE.DirectionalLight(0xe8eef6, 0.42);
  fill.position.set(6, 1.5, 4);
  scene.add(fill);

  return key;
}
