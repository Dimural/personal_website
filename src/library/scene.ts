import * as THREE from "three";
import { slotFor, snapRigToSlot, updateCarousel, type Slot } from "./carousel";
import { BAYS, VOLUMES, volumesInBay, type Bay, type Volume } from "./data";
import type { LibraryDebug } from "./debug";
import {
  SPREAD_DURATION,
  STAGGER,
  applySpreadPose,
  capturePose,
  type CapturedPose,
} from "./poses";
import { createBookRig, disposeRig, type BookRig } from "./rig";
import {
  BAY_X,
  SHELF_BOARD_TOP,
  SHELF_DEPTH,
  SHELF_REST_POSITION,
  SHELF_SUNK_POSITION,
  createRoom,
} from "./room";

const GAP = 0.028;
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

/**
 * Height of the carousel's optical centre. Books vary in height, so this is
 * taken from the mean rather than recomputed per selection — the camera
 * should not bob every time the ring turns.
 */
const CAROUSEL_FOCUS_Y = SHELF_BOARD_TOP + 0.94;

/**
 * The mode machine. Transitions are deliberately *not* interruptible: every
 * entry point guards on `mode`, so a click during `spreading` is dropped
 * rather than queued. Half the states are Task 8's; they are named here so
 * the type does not have to change under it.
 */
export type Mode =
  | "shelf"
  | "spreading"
  | "browse"
  | "regrouping"
  | "opening"
  | "reading"
  | "closing";

export interface Library {
  /** Empties a bay into the carousel. Ignored unless `mode === "shelf"`. */
  openBay(bay: Bay): void;
  /** Gathers the carousel back onto the shelf. Ignored unless browsing. */
  close(): void;
  /** Steps the carousel by whole slots. */
  navigate(direction: number): void;
  /** Turns the carousel to a specific book, the short way round. */
  select(index: number): void;
  debug(): LibraryDebug;
  dispose(): void;
}

export interface LibraryOptions {
  canvas: HTMLCanvasElement;
  onSelect: (volume: Volume | null) => void;
  onHover: (volume: Volume | null) => void;
  onMode: (mode: Mode, bay: Bay) => void;
}

const clamp = THREE.MathUtils.clamp;
const damp = THREE.MathUtils.damp;
const mod = (value: number, length: number) => ((value % length) + length) % length;
const smootherstep = (value: number) =>
  value * value * value * (value * (value * 6 - 15) + 10);

export function createLibrary(options: LibraryOptions): Library {
  const { canvas, onSelect, onHover, onMode } = options;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#ebe6dc");

  const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);

  const room = createRoom(scene, renderer);

  // ── Shelve the books ────────────────────────────────────────────
  /** Every rig, grouped by bay; carousel indices are indices into these. */
  const shelved: Record<Bay, BookRig[]> = { experience: [], projects: [] };
  /** Each rig's resting pose on the boards, local to `shelfStage`. */
  const home = new Map<BookRig, Slot>();
  const allRigs: BookRig[] = [];

  // The rig's local +Z (front cover) and −X (spine) axes are built for a book
  // lying face-up; a quarter turn about Y brings the spine to face the room
  // (world +Z) the way a shelved book should — rotating local (−1,0,0) by
  // +90° about Y lands on world (0,0,1).
  const SHELVED_ROTATION = new THREE.Euler(0, Math.PI / 2, 0);

  for (const { id: bay } of BAYS) {
    const volumes = volumesInBay(bay);
    const span =
      volumes.reduce((sum, v) => sum + v.depth, 0) + GAP * (volumes.length - 1);
    let cursor = -span / 2;

    volumes.forEach((volume, volumeIndex) => {
      const rig = createBookRig(volume, volumeIndex);
      rig.hit.userData.volumeId = volume.id;
      rig.hit.userData.index = volumeIndex;
      const x = BAY_X[bay] + cursor + volume.depth / 2;
      cursor += volume.depth + GAP;

      const slot: Slot = {
        position: new THREE.Vector3(
          x,
          SHELF_BOARD_TOP + rig.base.height / 2,
          SHELF_DEPTH / 2 - rig.base.width / 2 - 0.07,
        ),
        rotation: SHELVED_ROTATION.clone(),
        scale: 1,
        opacity: 1,
      };
      home.set(rig, slot);
      snapRigToSlot(rig, slot);
      room.shelfStage.add(rig.root);
      shelved[bay].push(rig);
      allRigs.push(rig);
    });
  }

  // ── State ───────────────────────────────────────────────────────
  let mode: Mode = "shelf";
  let currentBay: Bay = "experience";
  let transitionTime = 0;
  /** Carousel position, fractional; the ring settles on integers. */
  let position = 0;
  let targetPosition = 0;
  let selectedIndex = 0;
  let wheelIdle = 0;
  /** 0 = shelf framing, 1 = carousel framing. Drives the camera blend. */
  let browseAmount = 0;
  let ready = false;

  let activeRigs: BookRig[] = [];
  let fromPoses: CapturedPose[] = [];
  let toSlots: Slot[] = [];
  let hoveredId: string | null = null;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();

  // ── Camera framing ──────────────────────────────────────────────
  // Two rigs, blended by `browseAmount`. `shelf` frames *both* bays — the
  // tabs no longer dolly between them, they open them.
  const shelfCameraPosition = new THREE.Vector3();
  const shelfCameraTarget = new THREE.Vector3(0, -0.04, 0);
  const browseCameraPosition = new THREE.Vector3();
  const browseCameraTarget = new THREE.Vector3(0, CAROUSEL_FOCUS_Y, 0);
  const cameraTarget = new THREE.Vector3();

  function frameCameras() {
    const halfV = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
    const halfH = halfV * camera.aspect;
    // Both bays span roughly ±3.7; standing far enough back to hold that in a
    // portrait canvas would shrink the room to a postage stamp, so the pull
    // back is capped and narrow viewports simply lose the outer uprights.
    shelfCameraPosition.set(0, 0.02, Math.min(3.95 / halfH + 0.6, 13));
    // Close enough that the centred volume reads, far enough that its two
    // neighbours are still in frame on a wide canvas.
    const browseZ = Math.min(Math.max(1.25 / halfV, 2.25 / halfH), 6.6) + 0.45;
    browseCameraPosition.set(0, CAROUSEL_FOCUS_Y + 0.1, browseZ);
  }

  // ── Mode machine ────────────────────────────────────────────────
  function announce() {
    onMode(mode, currentBay);
  }

  function inactiveRigs(): BookRig[] {
    return allRigs.filter((rig) => !activeRigs.includes(rig));
  }

  function setInactiveOpacity(opacity: number) {
    for (const rig of inactiveRigs()) {
      rig.opacity = opacity;
      for (const material of rig.fadeMaterials) material.opacity = opacity;
      (rig.contactShadow.material as THREE.Material).opacity = opacity * 0.24;
      rig.hit.visible = opacity > 0.12;
    }
  }

  function openBay(bay: Bay) {
    if (mode !== "shelf") return;
    currentBay = bay;
    activeRigs = shelved[bay];
    if (!activeRigs.length) return;

    position = 0;
    targetPosition = 0;
    selectedIndex = 0;
    wheelIdle = 0;

    for (const rig of activeRigs) {
      // `attach`, never `add`: `add` discards the world transform and the
      // book would jump to the carcass's origin before it ever set off.
      scene.attach(rig.root);
      rig.lastOffset = null;
      rig.opacity = 1;
      for (const material of rig.fadeMaterials) material.opacity = 1;
    }

    fromPoses = activeRigs.map((rig) => capturePose(rig.root));
    toSlots = activeRigs.map((rig, index) =>
      slotFor(index, 0, activeRigs.length, rig.base.height),
    );

    mode = "spreading";
    transitionTime = 0;
    announce();
    onSelect(activeRigs[0].data);
    if (REDUCED) finishSpreading();
  }

  function applySpreading(t: number) {
    applySpreadPose(activeRigs, fromPoses, toSlots, t, STAGGER);
    room.shelfStage.position.lerpVectors(
      SHELF_REST_POSITION,
      SHELF_SUNK_POSITION,
      smootherstep(clamp(t / 0.68, 0, 1)),
    );
    setInactiveOpacity(1 - clamp(t / 0.5, 0, 1));
    browseAmount = smootherstep(t);
  }

  function finishSpreading() {
    applySpreading(1);
    activeRigs.forEach((rig, index) => {
      snapRigToSlot(rig, slotFor(index, 0, activeRigs.length, rig.base.height));
    });
    room.shelfStage.position.copy(SHELF_SUNK_POSITION);
    setInactiveOpacity(0);
    browseAmount = 1;
    transitionTime = 1;
    mode = "browse";
    announce();
  }

  function close() {
    if (mode !== "browse") return;
    fromPoses = activeRigs.map((rig) => capturePose(rig.root));
    // Home slots are `shelfStage`-local, but the books travel in scene space
    // and the carcass is back at `SHELF_REST_POSITION` (the origin) by the
    // time they land, so the two frames coincide where it matters.
    toSlots = activeRigs.map((rig) => home.get(rig)!);
    mode = "regrouping";
    transitionTime = 0;
    announce();
    onSelect(null);
    if (REDUCED) finishRegrouping();
  }

  function applyRegrouping(t: number) {
    // Stagger 0: they gather and go home together, rather than trickling back.
    applySpreadPose(activeRigs, fromPoses, toSlots, t, 0);
    room.shelfStage.position.lerpVectors(
      SHELF_SUNK_POSITION,
      SHELF_REST_POSITION,
      smootherstep(clamp((t - 0.24) / 0.76, 0, 1)),
    );
    setInactiveOpacity(clamp((t - 0.24) / 0.5, 0, 1));
    browseAmount = 1 - smootherstep(t);
  }

  function finishRegrouping() {
    applyRegrouping(1);
    room.shelfStage.position.copy(SHELF_REST_POSITION);
    for (const rig of activeRigs) {
      room.shelfStage.attach(rig.root);
      snapRigToSlot(rig, home.get(rig)!);
      rig.lastOffset = null;
    }
    activeRigs = [];
    setInactiveOpacity(1);
    browseAmount = 0;
    transitionTime = 1;
    mode = "shelf";
    hoveredId = null;
    canvas.style.cursor = "default";
    onHover(null);
    announce();
  }

  // ── Selection ───────────────────────────────────────────────────
  function updateSelection(index: number) {
    if (index === selectedIndex) return;
    selectedIndex = index;
    onSelect(activeRigs[index]?.data ?? null);
  }

  function navigate(direction: number) {
    if (mode !== "browse" || !activeRigs.length) return;
    targetPosition = Math.round(targetPosition) + direction;
    wheelIdle = 0;
    updateSelection(mod(Math.round(targetPosition), activeRigs.length));
  }

  /** Turns to `index` the short way round the wrap, not the long way. */
  function select(index: number) {
    if (mode !== "browse" || !activeRigs.length) return;
    const count = activeRigs.length;
    const rounded = Math.round(targetPosition);
    let delta = index - mod(rounded, count);
    if (delta > count / 2) delta -= count;
    if (delta < -count / 2) delta += count;
    targetPosition = rounded + delta;
    wheelIdle = 0;
    updateSelection(mod(index, count));
  }

  // ── Pointer ─────────────────────────────────────────────────────
  function updatePointer(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  function pick(): number {
    if (mode !== "browse" || !activeRigs.length) return -1;
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(
      activeRigs.map((rig) => rig.hit),
      false,
    )[0];
    if (!hit) return -1;
    const id = hit.object.userData.volumeId as string | undefined;
    return activeRigs.findIndex((rig) => rig.data.id === id);
  }

  const onPointerMove = (event: PointerEvent) => {
    updatePointer(event);
    const index = pick();
    const id = index >= 0 ? activeRigs[index].data.id : null;
    if (id !== hoveredId) {
      hoveredId = id;
      canvas.style.cursor = id ? "pointer" : "default";
      onHover(index >= 0 ? activeRigs[index].data : null);
    }
  };

  const onPointerLeave = () => {
    if (hoveredId) {
      hoveredId = null;
      canvas.style.cursor = "default";
      onHover(null);
    }
  };

  const onClick = (event: PointerEvent) => {
    updatePointer(event);
    const index = pick();
    // Clicking the centred volume is Task 8's business (it opens the book);
    // clicking a neighbour turns the ring to it.
    if (index >= 0 && index !== selectedIndex) select(index);
  };

  /**
   * `{ passive: false }` is not optional — `preventDefault` on a passive
   * listener is a silent no-op and the page scrolls instead of the carousel.
   */
  const onWheel = (event: WheelEvent) => {
    if (mode !== "browse") return;
    event.preventDefault();
    const delta =
      Math.abs(event.deltaX) > Math.abs(event.deltaY) ? event.deltaX : event.deltaY;
    targetPosition += clamp(delta * 0.0022, -0.72, 0.72);
    wheelIdle = 0.14;
  };

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("click", onClick as EventListener);
  canvas.addEventListener("wheel", onWheel, { passive: false });

  // ── Resize ──────────────────────────────────────────────────────
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    frameCameras();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  frameCameras();
  resize();
  camera.position.copy(shelfCameraPosition);
  camera.lookAt(shelfCameraTarget);

  // ── Only run while the shelf is on screen ───────────────────────
  let visible = true;
  const io = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { threshold: 0.01 },
  );
  io.observe(canvas);

  // ── Loop ────────────────────────────────────────────────────────
  const clock = new THREE.Clock();
  let running = true;

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);

    if (mode === "spreading") {
      transitionTime = Math.min(1, transitionTime + dt / SPREAD_DURATION);
      if (transitionTime >= 1) finishSpreading();
      else applySpreading(transitionTime);
    } else if (mode === "regrouping") {
      transitionTime = Math.min(1, transitionTime + dt / SPREAD_DURATION);
      if (transitionTime >= 1) finishRegrouping();
      else applyRegrouping(transitionTime);
    } else if (mode === "browse") {
      const count = activeRigs.length;
      position = REDUCED ? targetPosition : damp(position, targetPosition, 9.5, dt);
      if (Math.abs(position - targetPosition) < 0.0005) position = targetPosition;

      if (wheelIdle > 0) {
        wheelIdle -= dt;
        if (wheelIdle <= 0) targetPosition = Math.round(targetPosition);
      }

      const nearest = mod(Math.round(position), count);
      if (nearest !== selectedIndex) updateSelection(nearest);

      updateCarousel(activeRigs, position, dt, REDUCED);
    }

    // Floating books have nothing to cast a contact shadow onto once the
    // carcass has sunk, so the decal fades out with the shelf.
    if (activeRigs.length) {
      for (const rig of activeRigs) {
        (rig.contactShadow.material as THREE.Material).opacity =
          rig.opacity * 0.24 * (1 - browseAmount);
      }
    }

    // Rendering off-screen is real GPU cost this project deliberately avoids,
    // but state must keep advancing above so an in-flight transition still
    // resolves — a user who scrolls away mid-flight and back should not find
    // the books frozen halfway out of the shelf.
    if (!visible) return;

    camera.position.lerpVectors(
      shelfCameraPosition,
      browseCameraPosition,
      browseAmount,
    );
    cameraTarget.lerpVectors(shelfCameraTarget, browseCameraTarget, browseAmount);
    camera.lookAt(cameraTarget);

    renderer.render(scene, camera);
    ready = true;
  }

  frame();

  return {
    openBay,
    close,
    navigate,
    select,
    debug: () => ({
      mode,
      bay: currentBay,
      selectedIndex,
      readingOpen: false,
      spread: 0,
      bookCount: allRigs.length,
      ready,
    }),
    dispose() {
      running = false;
      observer.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("click", onClick as EventListener);
      canvas.removeEventListener("wheel", onWheel);
      renderer.dispose();
      scene.environment?.dispose();
      for (const rig of allRigs) disposeRig(rig);
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          const material = object.material;
          const list = Array.isArray(material) ? material : [material];
          for (const m of list) {
            if ((m as THREE.MeshStandardMaterial).map)
              (m as THREE.MeshStandardMaterial).map!.dispose();
            m.dispose();
          }
        }
      });
    },
  };
}

export { VOLUMES };
