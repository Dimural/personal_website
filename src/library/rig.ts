import * as THREE from "three";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import type { Volume } from "./data";
import {
  makeBackCoverTexture,
  makeBackFoilTexture,
  makeClothBumpTexture,
  makeClothSurfaceMaps,
  makeContactShadowTexture,
  makeCoverTexture,
  makeEmbossMap,
  makeEndpaperTexture,
  makeFoilTexture,
  makeInteriorPageTextures,
  makePageEdgeTextures,
  makePaperFaceTexture,
  makeSpineFoilTexture,
  makeSpineTexture,
} from "./materials";

const FLEXIBLE_PAGE_SEGMENTS = 18;
const FLEXIBLE_PAGE_VERTICAL_SEGMENTS = 8;

const BOARD = 0.032;
const COVER_RADIUS = 0.0045;
const PAGE_RADIUS = 0.0025;
const SPINE_RADIUS = 0.0015;
const SPINE_BOARD_THICKNESS = 0.014;
const SPINE_WIDTH = 0.082;

/**
 * Prototype materials, cloned per rig via `createFadeMaterial`. Never
 * assigned to a mesh directly, so they never need disposing — only the
 * clones (which live in a rig's `materials` array) do.
 */
const PAGE_BASE_MATERIAL = new THREE.MeshPhysicalMaterial({
  color: 0xe7dfcf,
  roughness: 0.95,
  metalness: 0,
  sheen: 0.025,
  sheenRoughness: 1,
});
const PAGE_SHEET_BASE_MATERIAL = new THREE.MeshPhysicalMaterial({
  color: 0xeee6d7,
  roughness: 0.955,
  metalness: 0,
  sheen: 0.02,
  sheenRoughness: 1,
  side: THREE.DoubleSide,
});
const HEADBAND_BASE_MATERIAL = new THREE.MeshPhysicalMaterial({
  color: 0xc6a66d,
  roughness: 0.58,
  metalness: 0.16,
  sheen: 0.14,
  sheenRoughness: 0.76,
});

export interface BookRig {
  data: Volume;
  root: THREE.Group;
  motion: THREE.Group;
  frontPivot: THREE.Group;
  backPivot: THREE.Group;
  pagePivots: THREE.Group[];
  pageSurfaces: THREE.Mesh[];
  pageBlock: THREE.Mesh;
  hit: THREE.Mesh;
  contactShadow: THREE.Mesh;
  fadeMaterials: THREE.Material[];
  materials: THREE.Material[];
  /**
   * Every texture unique to this rig — safe for `disposeRig` to dispose.
   * Deliberately excludes the two module-level singletons `materials.ts`
   * shares across every volume (`makePaperFaceTexture`'s unprinted stock,
   * `makeContactShadowTexture`) — disposing either here would break every
   * other still-live rig.
   */
  textures: THREE.Texture[];
  base: { width: number; height: number; depth: number };
  opacity: number;
  lastOffset: number | null;
}

function createMesh(
  geometry: THREE.BufferGeometry,
  material: THREE.Material,
  name: string,
  cast = true,
  receive = true,
): THREE.Mesh {
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = name;
  mesh.castShadow = cast;
  mesh.receiveShadow = receive;
  return mesh;
}

function createFadeMaterial(base: THREE.MeshPhysicalMaterial): THREE.MeshPhysicalMaterial {
  const material = base.clone();
  material.transparent = true;
  material.opacity = 1;
  return material;
}

/** A rounded rectangle, extruded flat — cover art plaques, endpapers, the ribbon. */
function createRoundedPlaneGeometry(width: number, height: number, radius: number) {
  const halfWidth = width * 0.5;
  const halfHeight = height * 0.5;
  const corner = Math.min(radius, halfWidth, halfHeight);
  const shape = new THREE.Shape();

  shape.moveTo(-halfWidth + corner, -halfHeight);
  shape.lineTo(halfWidth - corner, -halfHeight);
  shape.quadraticCurveTo(halfWidth, -halfHeight, halfWidth, -halfHeight + corner);
  shape.lineTo(halfWidth, halfHeight - corner);
  shape.quadraticCurveTo(halfWidth, halfHeight, halfWidth - corner, halfHeight);
  shape.lineTo(-halfWidth + corner, halfHeight);
  shape.quadraticCurveTo(-halfWidth, halfHeight, -halfWidth, halfHeight - corner);
  shape.lineTo(-halfWidth, -halfHeight + corner);
  shape.quadraticCurveTo(-halfWidth, -halfHeight, -halfWidth + corner, -halfHeight);

  const geometry = new THREE.ShapeGeometry(shape, 8);
  const position = geometry.getAttribute("position");
  const uv = new Float32Array(position.count * 2);
  for (let i = 0; i < position.count; i++) {
    uv[i * 2] = (position.getX(i) + halfWidth) / width;
    uv[i * 2 + 1] = (position.getY(i) + halfHeight) / height;
  }
  geometry.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
  geometry.computeVertexNormals();
  return geometry;
}

/**
 * The solid page block: a rounded box with the fore edge relieved near the
 * spine (the "gutter") and a little per-signature waviness on the fore
 * edge, so it doesn't read as a single moulded slab.
 */
function createPageBlockGeometry(width: number, height: number, depth: number, radius: number) {
  const geometry = new RoundedBoxGeometry(width, height, depth, 4, radius);
  const position = geometry.getAttribute("position");
  const halfWidth = width * 0.5;

  for (let i = 0; i < position.count; i++) {
    const x = position.getX(i);
    const z = position.getZ(i);
    const normalizedX = THREE.MathUtils.clamp((x + halfWidth) / width, 0, 1);
    const gutterProgress = THREE.MathUtils.clamp(normalizedX / 0.16, 0, 1);
    const gutterEase = gutterProgress * gutterProgress * (3 - 2 * gutterProgress);
    const gutterCompression = (1 - gutterEase) * 0.012;
    const foreEdgeCharacter = Math.pow(normalizedX, 8) * Math.sin(position.getY(i) * 31) * 0.00055;
    const adjustedZ = Math.sign(z || 1) * Math.max(0, Math.abs(z) - gutterCompression + foreEdgeCharacter);
    position.setZ(i, adjustedZ);
  }

  position.needsUpdate = true;
  geometry.computeVertexNormals();
  geometry.computeBoundingBox();
  geometry.computeBoundingSphere();
  return geometry;
}

/** The four cloth strips folded over a board's inside face at each edge. */
function addTurnIns(
  pivot: THREE.Group,
  volume: Volume,
  side: "front" | "back",
  width: number,
  height: number,
  insideZ: number,
  material: THREE.Material,
  box: THREE.BoxGeometry,
) {
  const stripDepth = 0.002;
  const border = 0.018;
  const longWidth = width - border * 0.7;
  const longHeight = height - border * 2.2;
  const definitions: [string, number, number, number, number, number][] = [
    ["head", width * 0.5, height * 0.5 - border * 0.56, longWidth, border, stripDepth],
    ["tail", width * 0.5, -height * 0.5 + border * 0.56, longWidth, border, stripDepth],
    ["spine", border * 0.56, 0, border, longHeight, stripDepth],
    ["fore", width - border * 0.56, 0, border, longHeight, stripDepth],
  ];

  for (const [edge, x, y, stripWidth, stripHeight, depth] of definitions) {
    const strip = createMesh(box, material, `${volume.id}-${side}-turn-in-${edge}`, false, true);
    strip.scale.set(stripWidth, stripHeight, depth);
    strip.position.set(x, y, insideZ);
    pivot.add(strip);
  }
}

/**
 * Builds the physical rig for one volume: hinged front and back boards,
 * six page leaves each on their own pivot, a spine, headbands, a ribbon,
 * and an invisible hit proxy. Everything later in the plan (opening the
 * cover, turning pages, the distance fade) hangs off this structure.
 */
export function createBookRig(volume: Volume, index: number): BookRig {
  const root = new THREE.Group();
  root.name = `book-${volume.id}`;
  root.userData.index = index;

  const motion = new THREE.Group();
  motion.name = `${volume.id}-motion`;
  root.add(motion);

  const width = volume.width;
  const height = volume.height;
  const depth = volume.depth;
  const pageWidth = width - 0.074;
  const pageHeight = height - 0.068;
  const pageDepth = depth - 0.026;

  // Geometry primitives reused within this rig only — never shared across
  // rigs, so `disposeRig` can traverse and dispose them safely.
  const box = new THREE.BoxGeometry(1, 1, 1);
  const plane = new THREE.PlaneGeometry(1, 1);

  // ── Paint (Task 3) ────────────────────────────────────────────────
  const coverTexture = makeCoverTexture(volume);
  const foilTexture = makeFoilTexture(volume);
  const clothBumpTexture = makeClothBumpTexture(volume);
  const clothSurfaceMaps = makeClothSurfaceMaps(volume);
  const paperFaceTexture = makePaperFaceTexture(volume);
  const interiorPageTextures = makeInteriorPageTextures(volume);
  const endpaperTexture = makeEndpaperTexture(volume);
  const pageEdgeTextures = makePageEdgeTextures(volume);
  const spineTexture = makeSpineTexture(volume);
  const spineFoilTexture = makeSpineFoilTexture(volume);
  const backCoverTexture = makeBackCoverTexture(volume);
  const backFoilTexture = makeBackFoilTexture(volume);
  const foilEmbossTexture = makeEmbossMap(foilTexture, `${volume.id}-front-foil-emboss`);
  const spineEmbossTexture = makeEmbossMap(spineFoilTexture, `${volume.id}-spine-foil-emboss`);
  const backEmbossTexture = makeEmbossMap(backFoilTexture, `${volume.id}-back-foil-emboss`);

  // ── Materials ────────────────────────────────────────────────────
  const cloth = new THREE.MeshPhysicalMaterial({
    color: volume.cloth,
    normalMap: clothSurfaceMaps.normal,
    normalScale: new THREE.Vector2(0.34, 0.34),
    roughnessMap: clothSurfaceMaps.roughness,
    roughness: 0.98,
    metalness: 0.02,
    bumpMap: clothBumpTexture,
    bumpScale: 0.0045,
    sheen: 0.34,
    sheenRoughness: 0.76,
    sheenColor: new THREE.Color(volume.foil),
    transparent: true,
  });
  const coverArt = new THREE.MeshPhysicalMaterial({
    map: coverTexture,
    normalMap: clothSurfaceMaps.normal,
    normalScale: new THREE.Vector2(0.28, 0.28),
    roughnessMap: clothSurfaceMaps.roughness,
    bumpMap: clothBumpTexture,
    bumpScale: 0.0035,
    roughness: 0.92,
    metalness: 0.035,
    clearcoat: 0.06,
    clearcoatRoughness: 0.72,
    sheen: 0.26,
    sheenRoughness: 0.78,
    transparent: true,
  });
  const foilArt = new THREE.MeshPhysicalMaterial({
    color: volume.foil,
    map: foilTexture,
    alphaMap: foilTexture,
    bumpMap: foilEmbossTexture,
    bumpScale: 0.016,
    roughness: 0.2,
    metalness: 0.94,
    clearcoat: 0.18,
    clearcoatRoughness: 0.12,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
  });
  const spineArt = new THREE.MeshPhysicalMaterial({
    map: spineTexture,
    normalMap: clothSurfaceMaps.normal,
    normalScale: new THREE.Vector2(0.3, 0.3),
    roughnessMap: clothSurfaceMaps.roughness,
    bumpMap: clothBumpTexture,
    bumpScale: 0.004,
    roughness: 0.95,
    metalness: 0.025,
    sheen: 0.27,
    sheenRoughness: 0.78,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const spineFoilArt = new THREE.MeshPhysicalMaterial({
    color: volume.foil,
    map: spineFoilTexture,
    alphaMap: spineFoilTexture,
    bumpMap: spineEmbossTexture,
    bumpScale: 0.017,
    roughness: 0.19,
    metalness: 0.92,
    clearcoat: 0.16,
    clearcoatRoughness: 0.13,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    side: THREE.DoubleSide,
  });
  const backArt = new THREE.MeshPhysicalMaterial({
    map: backCoverTexture,
    normalMap: clothSurfaceMaps.normal,
    normalScale: new THREE.Vector2(0.28, 0.28),
    roughnessMap: clothSurfaceMaps.roughness,
    bumpMap: clothBumpTexture,
    bumpScale: 0.0035,
    roughness: 0.96,
    metalness: 0.025,
    sheen: 0.25,
    sheenRoughness: 0.8,
    transparent: true,
    side: THREE.DoubleSide,
  });
  const backFoilArt = new THREE.MeshPhysicalMaterial({
    color: volume.foil,
    map: backFoilTexture,
    alphaMap: backFoilTexture,
    bumpMap: backEmbossTexture,
    bumpScale: 0.016,
    roughness: 0.21,
    metalness: 0.9,
    clearcoat: 0.14,
    clearcoatRoughness: 0.14,
    transparent: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -2,
    side: THREE.DoubleSide,
  });
  const endpaperMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(volume.palette.paperPale).lerp(new THREE.Color(0xf2ead8), 0.5),
    map: endpaperTexture,
    bumpMap: paperFaceTexture,
    bumpScale: 0.0018,
    roughness: 0.94,
    metalness: 0,
    sheen: 0.025,
    sheenRoughness: 1,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const foreEdgeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: pageEdgeTextures.foreEdge,
    bumpMap: pageEdgeTextures.foreEdge,
    bumpScale: 0.0022,
    roughness: 0.93,
    metalness: 0,
    sheen: 0.018,
    sheenRoughness: 1,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const headTailEdgeMaterial = new THREE.MeshPhysicalMaterial({
    color: 0xffffff,
    map: pageEdgeTextures.headTail,
    bumpMap: pageEdgeTextures.headTail,
    bumpScale: 0.0015,
    roughness: 0.94,
    metalness: 0,
    sheen: 0.014,
    sheenRoughness: 1,
    side: THREE.DoubleSide,
    transparent: true,
  });
  const grooveMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(volume.cloth).multiplyScalar(0.42),
    roughness: 0.9,
    metalness: 0,
    bumpMap: clothBumpTexture,
    bumpScale: 0.006,
    side: THREE.DoubleSide,
    transparent: true,
  });

  const pageMaterial = createFadeMaterial(PAGE_BASE_MATERIAL);
  pageMaterial.map = paperFaceTexture;
  pageMaterial.bumpMap = paperFaceTexture;
  pageMaterial.bumpScale = 0.0014;
  pageMaterial.roughness = 0.95;
  pageMaterial.needsUpdate = true;

  const headbandMaterial = createFadeMaterial(HEADBAND_BASE_MATERIAL);

  const interiorPageMaterials = interiorPageTextures.map((texture) => {
    const material = createFadeMaterial(PAGE_SHEET_BASE_MATERIAL);
    material.map = texture;
    material.bumpMap = paperFaceTexture;
    material.bumpScale = 0.0012;
    material.roughness = 0.96;
    material.side = THREE.FrontSide;
    material.needsUpdate = true;
    return material;
  });

  const blankPageMaterial = createFadeMaterial(PAGE_SHEET_BASE_MATERIAL);
  blankPageMaterial.map = paperFaceTexture;
  blankPageMaterial.bumpMap = paperFaceTexture;
  blankPageMaterial.bumpScale = 0.0012;
  blankPageMaterial.roughness = 0.96;
  blankPageMaterial.side = THREE.FrontSide;
  blankPageMaterial.needsUpdate = true;

  const signatureMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(0x8d816f).lerp(new THREE.Color(volume.palette.paperPale), 0.34),
    roughness: 0.98,
    metalness: 0,
    transparent: true,
  });
  const ribbonMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color(volume.foil).lerp(new THREE.Color(volume.cloth), 0.28),
    roughness: 0.62,
    metalness: 0.08,
    sheen: 0.36,
    sheenRoughness: 0.68,
    side: THREE.DoubleSide,
    transparent: true,
  });

  // ── Geometry ─────────────────────────────────────────────────────
  const coverGeometry = new RoundedBoxGeometry(width, height, BOARD, 2, COVER_RADIUS);
  const pageGeometry = createPageBlockGeometry(pageWidth, pageHeight, pageDepth, PAGE_RADIUS);
  const coverSurfaceGeometry = createRoundedPlaneGeometry(width - 0.007, height - 0.007, 0.0035);
  const endpaperGeometry = createRoundedPlaneGeometry(width - 0.045, height - 0.045, 0.003);

  const pageBlock = createMesh(pageGeometry, pageMaterial, `${volume.id}-page-block`);
  pageBlock.position.x = 0.018;
  motion.add(pageBlock);

  // ── Back board ───────────────────────────────────────────────────
  const backPivot = new THREE.Group();
  backPivot.name = `${volume.id}-back-cover-pivot`;
  backPivot.position.set(-width * 0.5, 0, -depth * 0.5 - BOARD * 0.5);

  const backCover = createMesh(coverGeometry, cloth, `${volume.id}-back-cover`);
  backCover.position.x = width * 0.5;
  backPivot.add(backCover);

  const backPlane = createMesh(coverSurfaceGeometry, backArt, `${volume.id}-back-cover-art`, false, false);
  backPlane.position.set(width * 0.5, 0, -BOARD * 0.55);
  backPlane.rotation.y = Math.PI;
  backPivot.add(backPlane);

  const backFoilPlane = createMesh(coverSurfaceGeometry, backFoilArt, `${volume.id}-back-foil-art`, false, false);
  backFoilPlane.position.set(width * 0.5, 0, -BOARD * 0.605);
  backFoilPlane.rotation.y = Math.PI;
  backPivot.add(backFoilPlane);

  const backEndpaper = createMesh(endpaperGeometry, endpaperMaterial, `${volume.id}-back-endpaper`, false, true);
  backEndpaper.position.set(width * 0.5, 0, BOARD * 0.515);
  backPivot.add(backEndpaper);

  addTurnIns(backPivot, volume, "back", width, height, BOARD * 0.53, cloth, box);

  const backGroove = createMesh(plane, grooveMaterial, `${volume.id}-back-hinge-groove`, false, false);
  backGroove.scale.set(0.012, height * 0.94, 1);
  backGroove.position.set(0.038, 0, -BOARD * 0.535);
  backGroove.rotation.y = Math.PI;
  backPivot.add(backGroove);

  motion.add(backPivot);

  // ── Front board ──────────────────────────────────────────────────
  const frontPivot = new THREE.Group();
  frontPivot.name = `${volume.id}-front-cover-pivot`;
  frontPivot.position.set(-width * 0.5, 0, depth * 0.5 + BOARD * 0.5);

  const frontCover = createMesh(coverGeometry, cloth, `${volume.id}-front-cover`);
  frontCover.position.x = width * 0.5;
  frontPivot.add(frontCover);

  const coverPlane = createMesh(coverSurfaceGeometry, coverArt, `${volume.id}-cover-art`, false, false);
  coverPlane.position.set(width * 0.5, 0, BOARD * 0.55);
  frontPivot.add(coverPlane);

  const foilPlane = createMesh(coverSurfaceGeometry, foilArt, `${volume.id}-foil-art`, false, false);
  foilPlane.position.set(width * 0.5, 0, BOARD * 0.605);
  frontPivot.add(foilPlane);

  const frontEndpaper = createMesh(endpaperGeometry, endpaperMaterial, `${volume.id}-front-endpaper`, false, true);
  frontEndpaper.position.set(width * 0.5, 0, -BOARD * 0.515);
  frontEndpaper.rotation.y = Math.PI;
  frontPivot.add(frontEndpaper);

  addTurnIns(frontPivot, volume, "front", width, height, -BOARD * 0.53, cloth, box);

  const frontGroove = createMesh(plane, grooveMaterial, `${volume.id}-front-hinge-groove`, false, false);
  frontGroove.scale.set(0.012, height * 0.94, 1);
  frontGroove.position.set(0.038, 0, BOARD * 0.655);
  frontPivot.add(frontGroove);

  motion.add(frontPivot);

  // ── Page leaves, back to front ───────────────────────────────────
  const pagePivots: THREE.Group[] = [];
  const pageSurfaces: THREE.Mesh[] = [];

  for (let pageIndex = 0; pageIndex < 6; pageIndex++) {
    const leafOrder = 5 - pageIndex;
    const frontPageMaterial = leafOrder < 4 ? interiorPageMaterials[leafOrder * 2] : blankPageMaterial;
    const backPageMaterial = leafOrder < 4 ? interiorPageMaterials[leafOrder * 2 + 1] : blankPageMaterial;

    const pagePivot = new THREE.Group();
    pagePivot.name = `${volume.id}-page-${pageIndex}`;
    pagePivot.position.set(
      -width * 0.5 + SPINE_WIDTH * 0.65,
      0,
      pageDepth * 0.5 + 0.0015 + pageIndex * 0.0015,
    );
    pagePivot.userData.restZ = pagePivot.position.z;
    pagePivot.userData.turnedZ = depth * 0.5 + BOARD + 0.004 + leafOrder * 0.0015;

    const frontPageGeometry = new THREE.PlaneGeometry(1, 1, FLEXIBLE_PAGE_SEGMENTS, FLEXIBLE_PAGE_VERTICAL_SEGMENTS);
    const backPageGeometry = new THREE.PlaneGeometry(1, 1, FLEXIBLE_PAGE_SEGMENTS, FLEXIBLE_PAGE_VERTICAL_SEGMENTS);
    const visiblePageWidth = pageWidth - SPINE_WIDTH * 0.42;

    const frontPage = createMesh(
      frontPageGeometry,
      frontPageMaterial,
      `${volume.id}-page-sheet-${pageIndex}-front`,
      false,
      true,
    );
    frontPage.scale.set(visiblePageWidth, pageHeight - 0.014, 1);
    frontPage.position.set(visiblePageWidth * 0.5, 0, 0.00022);
    pagePivot.add(frontPage);
    pageSurfaces.push(frontPage);

    const backPage = createMesh(
      backPageGeometry,
      backPageMaterial,
      `${volume.id}-page-sheet-${pageIndex}-back`,
      false,
      true,
    );
    backPage.scale.set(visiblePageWidth, pageHeight - 0.014, 1);
    backPage.position.set(visiblePageWidth * 0.5, 0, -0.00022);
    backPage.rotation.y = Math.PI;
    pagePivot.add(backPage);
    pageSurfaces.push(backPage);

    // The rest pose, copied out for Task 5 to deform from every frame —
    // never written to in place, or the pages would slowly crumple.
    pagePivot.userData.flex = {
      curve: 0,
      curveVelocity: 0,
      twist: 0,
      twistVelocity: 0,
      surfaces: [
        {
          geometry: frontPageGeometry,
          position: frontPageGeometry.attributes.position,
          base: Float32Array.from(frontPageGeometry.attributes.position.array),
          direction: 1,
        },
        {
          geometry: backPageGeometry,
          position: backPageGeometry.attributes.position,
          base: Float32Array.from(backPageGeometry.attributes.position.array),
          direction: -1,
        },
      ],
    };

    motion.add(pagePivot);
    pagePivots.push(pagePivot);
  }

  // ── Spine ────────────────────────────────────────────────────────
  const spineGeometry = new RoundedBoxGeometry(
    SPINE_BOARD_THICKNESS,
    height - 0.012,
    depth + BOARD * 1.88,
    1,
    SPINE_RADIUS,
  );
  const spine = createMesh(spineGeometry, spineArt, `${volume.id}-flat-spine`);
  spine.position.x = -width * 0.5 - SPINE_BOARD_THICKNESS * 0.35;
  spine.userData.profile = "flat";
  motion.add(spine);

  const spineFoil = createMesh(plane, spineFoilArt, `${volume.id}-spine-foil`, false, false);
  spineFoil.scale.set(depth + BOARD * 1.82, height - 0.018, 1);
  spineFoil.rotation.y = -Math.PI * 0.5;
  spineFoil.position.set(spine.position.x - SPINE_BOARD_THICKNESS * 0.505, 0, 0);
  motion.add(spineFoil);

  const spineLining = createMesh(
    new RoundedBoxGeometry(SPINE_WIDTH * 0.68, height - 0.056, Math.max(0.045, pageDepth - 0.008), 1, 0.0015),
    endpaperMaterial,
    `${volume.id}-spine-lining`,
  );
  spineLining.position.set(-width * 0.5 + SPINE_WIDTH * 0.38, 0, 0);
  motion.add(spineLining);

  // ── Headbands ────────────────────────────────────────────────────
  for (const direction of [-1, 1]) {
    const headbandGeometry = new THREE.CylinderGeometry(0.012, 0.012, pageDepth * 0.88, 12, 1, false);
    const headband = createMesh(headbandGeometry, headbandMaterial, `${volume.id}-headband-${direction}`);
    headband.rotation.x = Math.PI * 0.5;
    headband.position.set(-pageWidth * 0.5 + 0.046, direction * (pageHeight * 0.5 - 0.004), 0);
    motion.add(headband);
  }

  // ── Ribbon bookmark ──────────────────────────────────────────────
  const ribbonGeometry = createRoundedPlaneGeometry(0.034, pageHeight * 0.76, 0.002);
  const ribbon = createMesh(ribbonGeometry, ribbonMaterial, `${volume.id}-ribbon-bookmark`, false, true);
  ribbon.position.set(
    -pageWidth * 0.5 + 0.09 + (volume.seed % 3) * 0.018,
    -pageHeight * 0.17,
    pageDepth * 0.5 + 0.003,
  );
  ribbon.rotation.z = (volume.seed % 2 ? -1 : 1) * 0.014;
  motion.add(ribbon);

  // ── Page signatures, seen through the fore edge ─────────────────
  for (let signatureIndex = 0; signatureIndex < 6; signatureIndex++) {
    const signature = createMesh(box, signatureMaterial, `${volume.id}-page-signature-${signatureIndex + 1}`, false, true);
    signature.scale.set(0.0035, 0.00135, pageDepth * 0.91);
    signature.position.set(
      0.018 + pageWidth * 0.5 + 0.001,
      -pageHeight * 0.5 + ((signatureIndex + 1) / 7) * pageHeight,
      0,
    );
    motion.add(signature);
  }

  // ── Page edges ───────────────────────────────────────────────────
  const foreEdge = createMesh(plane, foreEdgeMaterial, `${volume.id}-fore-edge`, false, true);
  foreEdge.scale.set(pageDepth * 0.94, pageHeight - 0.028, 1);
  foreEdge.rotation.y = Math.PI * 0.5;
  foreEdge.position.set(0.018 + pageWidth * 0.5 + 0.002, 0, 0);
  motion.add(foreEdge);

  for (const direction of [-1, 1]) {
    const edge = createMesh(
      plane,
      headTailEdgeMaterial,
      `${volume.id}-${direction > 0 ? "head" : "tail"}-edge`,
      false,
      true,
    );
    edge.scale.set(pageWidth - 0.035, pageDepth * 0.94, 1);
    edge.rotation.x = direction > 0 ? -Math.PI * 0.5 : Math.PI * 0.5;
    edge.position.set(0.018, direction * (pageHeight * 0.5 + 0.002), 0);
    motion.add(edge);
  }

  // ── Hit proxy ────────────────────────────────────────────────────
  // Raycasting against the deformed page geometry is both slow and
  // unreliable, so all carousel picking goes through this instead.
  const hitMaterial = new THREE.MeshBasicMaterial({
    transparent: true,
    opacity: 0,
    depthWrite: false,
    visible: false,
  });
  const hit = createMesh(new THREE.BoxGeometry(width, height, depth), hitMaterial, `${volume.id}-hit-target`, false, false);
  hit.userData.index = index;
  motion.add(hit);

  // ── Contact shadow ───────────────────────────────────────────────
  const contactShadowMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color(volume.palette.shelfDark),
    alphaMap: makeContactShadowTexture(),
    transparent: true,
    opacity: 0.24,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const contactShadow = createMesh(plane, contactShadowMaterial, `${volume.id}-contact-shadow`, false, false);
  contactShadow.scale.set(width * 1.22, depth * 2.05, 1);
  contactShadow.rotation.x = -Math.PI * 0.5;
  contactShadow.position.set(0, -height * 0.5 - 0.022, 0.025);
  root.add(contactShadow);

  const fadeMaterials: THREE.Material[] = [
    cloth,
    coverArt,
    foilArt,
    spineArt,
    spineFoilArt,
    backArt,
    backFoilArt,
    endpaperMaterial,
    foreEdgeMaterial,
    headTailEdgeMaterial,
    grooveMaterial,
    pageMaterial,
    ...interiorPageMaterials,
    blankPageMaterial,
    headbandMaterial,
    signatureMaterial,
    ribbonMaterial,
  ];

  return {
    data: volume,
    root,
    motion,
    frontPivot,
    backPivot,
    pagePivots,
    pageSurfaces,
    pageBlock,
    hit,
    contactShadow,
    fadeMaterials,
    materials: [...fadeMaterials, contactShadowMaterial, hitMaterial],
    // Every texture painted fresh for this volume — excludes the two
    // shared singletons (`paperFaceTexture`, `makeContactShadowTexture()`)
    // used as maps above; see the interface doc comment.
    textures: [
      coverTexture,
      foilTexture,
      clothBumpTexture,
      clothSurfaceMaps.normal,
      clothSurfaceMaps.roughness,
      ...interiorPageTextures,
      endpaperTexture,
      pageEdgeTextures.foreEdge,
      pageEdgeTextures.headTail,
      spineTexture,
      spineFoilTexture,
      backCoverTexture,
      backFoilTexture,
      foilEmbossTexture,
      spineEmbossTexture,
      backEmbossTexture,
    ],
    base: { width, height, depth },
    opacity: 1,
    lastOffset: null,
  };
}

/**
 * Disposes every geometry reachable from `rig.root`, every material in
 * `rig.materials`, and every texture in `rig.textures`. Deliberately
 * leaves the two shared singletons out of `rig.textures` in the first
 * place (`makePaperFaceTexture`'s unprinted stock, `makeContactShadowTexture`)
 * — disposing either here would break every other still-live rig.
 */
export function disposeRig(rig: BookRig): void {
  const geometries = new Set<THREE.BufferGeometry>();
  rig.root.traverse((object) => {
    if (object instanceof THREE.Mesh) geometries.add(object.geometry);
  });
  for (const geometry of geometries) geometry.dispose();
  for (const material of rig.materials) material.dispose();
  for (const texture of rig.textures) texture.dispose();
}
