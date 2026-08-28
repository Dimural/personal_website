import * as THREE from "three";
import type { Volume } from "./data";
import { makeCoverTexture, makePagesTexture, makeSpineTexture } from "./materials";

export const BOOK_HEIGHT = 2.15;
export const BOOK_WIDTH = 1.42; // cover dimension, front to fore-edge

let pagesTexture: THREE.Texture | null = null;

export interface BookHandle {
  group: THREE.Group;
  volume: Volume;
  /** Where the book rests on the shelf. */
  home: THREE.Vector3;
  homeRotation: THREE.Euler;
  /** 0 = shelved, 1 = drawn fully out and presented. */
  presented: number;
  /** 0 = flush, 1 = tipped out under the cursor. */
  hovered: number;
}

/**
 * A book stands with its spine toward the room, so the shelf reads as a
 * shelf: you see spines, not covers, until one is drawn out.
 */
export function createBook(volume: Volume): BookHandle {
  if (!pagesTexture) pagesTexture = makePagesTexture();

  const geometry = new THREE.BoxGeometry(volume.depth, BOOK_HEIGHT, BOOK_WIDTH);

  const cloth = new THREE.Color(volume.cloth);
  const cover = makeCoverTexture(volume);
  const spine = makeSpineTexture(volume);

  const clothSide = (map: THREE.Texture) =>
    new THREE.MeshStandardMaterial({ map, roughness: 0.88, metalness: 0.02 });

  const pages = new THREE.MeshStandardMaterial({
    map: pagesTexture,
    roughness: 0.95,
    metalness: 0,
  });

  // BoxGeometry face order: +X, -X, +Y, -Y, +Z, -Z
  const materials = [
    clothSide(cover), // front cover
    new THREE.MeshStandardMaterial({ color: cloth, roughness: 0.9 }), // back
    pages, // head
    pages, // tail
    clothSide(spine), // spine, facing the room
    pages, // fore edge
  ];

  const mesh = new THREE.Mesh(geometry, materials);
  mesh.castShadow = true;
  mesh.receiveShadow = true;

  const group = new THREE.Group();
  group.add(mesh);
  group.userData.volumeId = volume.id;
  mesh.userData.volumeId = volume.id;

  return {
    group,
    volume,
    home: new THREE.Vector3(),
    homeRotation: new THREE.Euler(),
    presented: 0,
    hovered: 0,
  };
}
