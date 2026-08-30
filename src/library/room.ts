import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import type { Bay } from "./data";
import { makeContactShadowTexture, makeOakTexture, makePlasterTexture } from "./materials";

/** Where each bay sits along the wall. The toggle dollies between them. */
export const BAY_X: Record<Bay, number> = {
  experience: -1.55,
  projects: 1.55,
};

export const BAY_INNER_WIDTH = 1.95;
export const SHELF_DEPTH = 0.92;
const PANEL = 0.085;
const PLANK = 0.075;
const BAY_INNER_HEIGHT = 2.42;

/** Y of the surface books stand on. */
export const SHELF_BOARD_TOP = -BAY_INNER_HEIGHT / 2;

/** Where `shelfStage` sits normally, and where it sinks to during `browse`. */
export const SHELF_REST_POSITION = new THREE.Vector3(0, 0, 0);
export const SHELF_SUNK_POSITION = new THREE.Vector3(0, -4.2, -3);

export interface RoomMaterials {
  floor: THREE.MeshStandardMaterial;
  wall: THREE.MeshStandardMaterial;
  shelf: THREE.MeshStandardMaterial;
  shelfDark: THREE.MeshStandardMaterial;
  shadow: THREE.MeshBasicMaterial;
}

export interface RoomLights {
  hemisphere: THREE.HemisphereLight;
  key: THREE.DirectionalLight;
  softKey: THREE.RectAreaLight;
  fill: THREE.DirectionalLight;
  rim: THREE.RectAreaLight;
  backFill: THREE.RectAreaLight;
  spineRake: THREE.RectAreaLight;
  pageRake: THREE.RectAreaLight;
}

export interface RoomHandles {
  /** Carcass + shelved books ride this group; it sinks away during `browse`. */
  shelfStage: THREE.Group;
  materials: RoomMaterials;
  lights: RoomLights;
}

function buildBay(
  x: number,
  shelfMaterial: THREE.MeshStandardMaterial,
  shelfDarkMaterial: THREE.MeshStandardMaterial,
  shadowMaterial: THREE.MeshBasicMaterial,
) {
  const bay = new THREE.Group();
  bay.position.x = x;

  const outerW = BAY_INNER_WIDTH + PANEL * 2;

  // Uprights
  for (const dir of [-1, 1]) {
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(PANEL, BAY_INNER_HEIGHT + PLANK * 2, SHELF_DEPTH),
      shelfMaterial,
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
      shelfMaterial,
    );
    board.position.set(0, dir * (BAY_INNER_HEIGHT / 2 + PLANK / 2), 0);
    board.castShadow = true;
    board.receiveShadow = true;
    bay.add(board);
  }

  // Back board, set in from the wall so the shelf casts its own shadow.
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(outerW, BAY_INNER_HEIGHT, 0.04),
    shelfDarkMaterial,
  );
  back.position.z = -SHELF_DEPTH / 2 + 0.02;
  back.receiveShadow = true;
  bay.add(back);

  // Soft contact shadow under where the books stand, faked with an
  // alpha-mapped decal rather than relying on shadow-map resolution alone.
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(outerW * 0.92, SHELF_DEPTH * 0.7),
    shadowMaterial,
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.set(0, SHELF_BOARD_TOP + 0.006, 0.12);
  bay.add(shadow);

  return bay;
}

/**
 * Eight named lights so `updateTheme` (Task 9) can retint the room by book:
 * a sky/ground hemisphere, a shadow-casting key, a soft cloth-lighting
 * softbox, a cool fill, a foil rim rake, a back-cover softbox, and two
 * narrow rakes for spine foil and page edges.
 */
export function addLights(scene: THREE.Scene): RoomLights {
  // Must run before any RectAreaLight is constructed, or it renders black.
  RectAreaLightUniformsLib.init();

  const hemisphere = new THREE.HemisphereLight(0xfff8e8, 0x5b4030, 0.56);
  scene.add(hemisphere);

  const key = new THREE.DirectionalLight(0xffe8c2, 1.42);
  key.name = "shadow-key";
  key.position.set(-4.6, 7.4, 5.8);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  // These bounds travel with this reference eight-light rig (lean file
  // 4164–4226), not with the project's earlier two-light `addLights` — that
  // rig used ±9/±7/-7, near 0.5, far 30, bias -0.0012, normalBias 0.02,
  // tuned for a single directional light doing all the shadow work. Eight
  // lights (softKey/rim/backFill/spineRake/pageRake plus this key) changed
  // the falloff and shadow-acne behaviour enough that those bounds no
  // longer apply verbatim; these were retuned for this rig instead. Task 7
  // spreads books to roughly ±4 world units when drawn into a carousel —
  // ±6 left/right still covers that with margin.
  key.shadow.camera.left = -6;
  key.shadow.camera.right = 6;
  key.shadow.camera.top = 6;
  key.shadow.camera.bottom = -1.5;
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 18;
  key.shadow.bias = -0.00018;
  key.shadow.normalBias = 0.018;
  key.shadow.radius = 3.5;
  scene.add(key);

  const softKey = new THREE.RectAreaLight(0xffe8c2, 5.4, 4.8, 5.6);
  softKey.name = "cloth-softbox";
  softKey.position.set(-3.2, 5.5, 4.6);
  softKey.lookAt(0, 1.45, 0);
  scene.add(softKey);

  const fill = new THREE.DirectionalLight(0xd8e3e7, 0.3);
  fill.name = "cool-fill";
  fill.position.set(5.5, 3.6, 4.2);
  scene.add(fill);

  const rim = new THREE.RectAreaLight(0xd5a45e, 3.45, 1.6, 4.8);
  rim.name = "foil-rake";
  rim.position.set(3.8, 3.6, -2.1);
  rim.lookAt(-0.2, 1.5, 0);
  scene.add(rim);

  const backFill = new THREE.RectAreaLight(0xd8e3e7, 2.7, 3.8, 4.8);
  backFill.name = "back-cover-softbox";
  backFill.position.set(-1.8, 2.9, -4.5);
  backFill.lookAt(-0.1, 1.45, 0);
  scene.add(backFill);

  const spineRake = new THREE.RectAreaLight(0xffe8c2, 1.9, 0.9, 4.6);
  spineRake.name = "spine-rake";
  spineRake.position.set(-4.6, 3.2, 1.1);
  spineRake.lookAt(-0.55, 1.5, 0);
  scene.add(spineRake);

  const pageRake = new THREE.RectAreaLight(0xfff7e7, 2.15, 1.15, 3.8);
  pageRake.name = "page-edge-rake";
  pageRake.position.set(4.2, 4.8, 3.1);
  pageRake.lookAt(0.65, 1.55, 0);
  scene.add(pageRake);

  return { hemisphere, key, softKey, fill, rim, backFill, spineRake, pageRake };
}

export function createRoom(scene: THREE.Scene, renderer: THREE.WebGLRenderer): RoomHandles {
  // Everything that must sink away during `browse` rides this group; the
  // floor and wall below do not — they stay put.
  const shelfStage = new THREE.Group();
  shelfStage.name = "shelf-stage";
  shelfStage.position.copy(SHELF_REST_POSITION);
  scene.add(shelfStage);

  // Wall
  const wallMaterial = new THREE.MeshStandardMaterial({
    map: makePlasterTexture(),
    roughness: 0.97,
  });
  const wall = new THREE.Mesh(new THREE.PlaneGeometry(30, 18), wallMaterial);
  wall.position.z = -SHELF_DEPTH / 2 - 0.06;
  wall.receiveShadow = true;
  scene.add(wall);

  // Floor, catching the light from below
  const floorMaterial = new THREE.MeshStandardMaterial({ color: "#ddd5c6", roughness: 0.95 });
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 24), floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -3.6;
  floor.receiveShadow = true;
  scene.add(floor);

  // One shared set of wood/shadow materials across both bays, so Task 9 can
  // retint the whole carcass in one pass by walking `RoomHandles.materials`.
  // Tinted a shade past the raw map's `#cbb392`: under this rig's exposure
  // and the dimmed PMREM environment (see `environmentIntensity` below) the
  // untinted map read almost bone, losing the frame's wood identity — this
  // pulls it back to a clearly warm oak tan without touching the back
  // board, which stays flat and near-bone on purpose.
  const shelfMaterial = new THREE.MeshStandardMaterial({
    map: makeOakTexture([2, 1]),
    color: "#c7a877",
    roughness: 0.72,
    metalness: 0,
  });
  // Muted, near-bone recess — deliberately not oak-mapped: a large textured
  // honey-oak panel this size reads as a warm room bolted onto the page's
  // cool bone-and-ultramarine palette. Keep it quiet and cool-neutral so the
  // books (not the carcass) carry the colour.
  const shelfDarkMaterial = new THREE.MeshStandardMaterial({
    color: "#d9d0c1",
    roughness: 0.9,
    metalness: 0,
  });
  const shadowMaterial = new THREE.MeshBasicMaterial({
    color: 0x2f1d13,
    alphaMap: makeContactShadowTexture(),
    transparent: true,
    opacity: 0.22,
    depthWrite: false,
  });

  shelfStage.add(buildBay(BAY_X.experience, shelfMaterial, shelfDarkMaterial, shadowMaterial));
  shelfStage.add(buildBay(BAY_X.projects, shelfMaterial, shelfDarkMaterial, shadowMaterial));

  // Image-based lighting: this is what makes foil read as metal rather than
  // as a flat bright colour, and gives cloth a visible tooth. Dialed down via
  // `environmentIntensity` (r163+) rather than the renderer's global exposure
  // — that targets the PMREM map itself, which is what was blowing out the
  // floor/walls, without crushing every material's saturation along with it.
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;
  pmrem.dispose();

  const lights = addLights(scene);

  return {
    shelfStage,
    materials: {
      floor: floorMaterial,
      wall: wallMaterial,
      shelf: shelfMaterial,
      shelfDark: shelfDarkMaterial,
      shadow: shadowMaterial,
    },
    lights,
  };
}
