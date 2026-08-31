import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { applyOpacity, slotFor, snapRigToSlot, updateCarousel, type Slot } from "./carousel";
import { BAYS, VOLUMES, volumesInBay, type Bay, type Volume } from "./data";
import type { LibraryDebug } from "./debug";
import { updatePaginatedBook } from "./pages";
import {
  DETAIL_TRANSITION_DURATION,
  SPREAD_DURATION,
  STAGGER,
  applyClosingPose,
  applyOpeningPose,
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
  /**
   * Backs up one level: closes the held book to the carousel if one is
   * being read, otherwise gathers the carousel back onto the shelf. Ignored
   * in every other mode (mid-transition, or already on the shelf).
   */
  close(): void;
  /** Steps the carousel by whole slots. */
  navigate(direction: number): void;
  /** Turns the carousel to a specific book, the short way round. */
  select(index: number): void;
  /** Flies the centred book to the camera to be read. Ignored unless browsing. */
  open(): void;
  /** Recentres the orbit camera on the held book. Ignored unless reading. */
  resetView(): void;
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
const lerp = THREE.MathUtils.lerp;
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

  // Orbiting is only ever meaningful while a book is held for reading —
  // `announce()` keeps `enabled` in lockstep with `mode` at every
  // transition, so it never fights the opening/closing pose interpolators.
  const controls = new OrbitControls(camera, canvas);
  controls.enabled = false;
  controls.enableDamping = !REDUCED;
  controls.enablePan = false;
  controls.minDistance = 2.4;
  controls.maxDistance = 7.5;
  controls.minPolarAngle = Math.PI * 0.18;
  controls.maxPolarAngle = Math.PI * 0.62;

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

  // ── Reading (Task 8) ────────────────────────────────────────────
  /** The one rig currently opening, held, or closing — null otherwise. */
  let readingRig: BookRig | null = null;
  /** Cover-open amount and turned-page count. Task 10/11's to drive. */
  let readingOpen = false;
  let spread = 0;

  let openingFrom: CapturedPose | null = null;
  const openingCameraFrom = new THREE.Vector3();
  const openingCameraTargetFrom = new THREE.Vector3();
  let openingViewOffsetFrom = 0;

  let closingFrom: CapturedPose | null = null;
  let closingToSlot: Slot | null = null;
  const closingCameraFrom = new THREE.Vector3();
  const closingCameraTargetFrom = new THREE.Vector3();
  let closingViewOffsetFrom = 0;

  // Responsive targets for the held/reading pose — recomputed on resize.
  const inspectPosition = new THREE.Vector3();
  const inspectCameraPosition = new THREE.Vector3();
  const inspectCameraTarget = new THREE.Vector3();
  const inspectBookQuaternion = new THREE.Quaternion().setFromEuler(
    new THREE.Euler(0.055, -0.14, 0),
  );
  /** How far `camera.setViewOffset` slides the book left of the panel. */
  let detailViewOffsetX = 0;
  let detailSafeWidth = 0;
  /** The offset actually applied this frame, mid-lerp during a transition. */
  let currentViewOffsetX = 0;

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

  /**
   * Where the held book sits and how the camera frames it, for reading.
   * Narrow viewports centre the book; wide ones hold it left of where
   * Task 10's detail panel will sit — there is no real panel yet, so the
   * gutter falls back to the same `viewWidth * 0.64` estimate the reference
   * uses when it can't measure one either.
   */
  function configureResponsiveTargets() {
    const viewWidth = canvas.clientWidth || window.innerWidth;
    const narrow = viewWidth < 820;
    inspectPosition.set(narrow ? 0 : -2.25, narrow ? 2.3 : 1.56, narrow ? 0.15 : 0);
    inspectCameraPosition.set(narrow ? 0 : -0.52, narrow ? 2.46 : 1.78, narrow ? 5.7 : 5.25);
    inspectCameraTarget.copy(inspectPosition);

    if (narrow) {
      detailViewOffsetX = 0;
      detailSafeWidth = viewWidth;
      return;
    }

    const panelLeft = viewWidth * 0.64;
    const gutter = clamp(viewWidth * 0.035, 32, 56);
    detailSafeWidth = Math.max(viewWidth * 0.42, panelLeft - gutter);
    const wideLayoutProgress = clamp((viewWidth - 820) / 620, 0, 1);
    const bookCenterRatio = lerp(0.55, 0.615, wideLayoutProgress);
    const desiredBookCenter = detailSafeWidth * bookCenterRatio;
    detailViewOffsetX = Math.max(0, viewWidth * 0.5 - desiredBookCenter);
  }

  /** Sizes the held book to whatever width the (future) panel leaves it. */
  function getInspectScale(): number {
    if (!readingRig || canvas.clientWidth < 820) return 0.82;
    const distance = Math.abs(inspectCameraPosition.z - inspectPosition.z);
    const worldHeight = 2 * distance * Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
    const pixelsPerWorld = canvas.clientHeight / Math.max(worldHeight, 0.001);
    const estimatedBookWidth = readingRig.base.width * pixelsPerWorld * 1.16;
    const scaleForSafeWidth = (detailSafeWidth * 0.72) / Math.max(estimatedBookWidth, 1);
    return clamp(scaleForSafeWidth, 0.9, 1.32);
  }

  /**
   * Slides the render straight off `camera.setViewOffset` so the book sits
   * left of the panel instead of behind it. A near-zero offset is cleared
   * outright — a stale offset left in place skews every mode after this
   * one, `shelf` and `browse` included.
   */
  function applyDetailViewOffset() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    if (Math.abs(currentViewOffsetX) < 0.5) {
      camera.clearViewOffset();
      return;
    }
    camera.setViewOffset(w, h, currentViewOffsetX, 0, w, h);
  }

  // ── Mode machine ────────────────────────────────────────────────
  function announce() {
    // Centralised here rather than in every transition function, since
    // `announce()` already runs at the tail of every one of them: orbiting
    // is only ever live while a book is actually being read.
    controls.enabled = mode === "reading";
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

  /** Gathers the carousel back onto the shelf. The `browse`-only half of `close()`. */
  function shelveBooks() {
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

  // ── Opening / reading / closing (Task 8) ───────────────────────
  /**
   * Flies the centred book from its carousel slot to the camera, held
   * large and ready to be orbited. Not interruptible — a click mid-flight
   * is dropped, same as every other transition here.
   */
  function open() {
    if (mode !== "browse") return;
    const rig = activeRigs[selectedIndex];
    if (!rig) return;

    readingRig = rig;
    readingOpen = false;
    spread = 0;
    configureResponsiveTargets();

    openingFrom = capturePose(rig.root);
    openingCameraFrom.copy(camera.position);
    openingCameraTargetFrom.copy(cameraTarget);
    openingViewOffsetFrom = currentViewOffsetX;

    mode = "opening";
    transitionTime = 0;
    announce();
    if (REDUCED) finishOpening();
  }

  function applyOpening(t: number) {
    const rig = readingRig;
    if (!rig || !openingFrom) return;
    const eased = smootherstep(clamp(t, 0, 1));
    applyOpeningPose(rig, openingFrom, inspectPosition, inspectBookQuaternion, getInspectScale(), t);
    // The rest of the carousel is parented to `scene`, not `shelfStage` (Task
    // 7 needs that so the fly-out preserves a world transform), so sinking
    // the stage the way the reference does no longer takes them out of
    // frame. Fade them instead — same mechanism as the inactive-bay and
    // carousel-distance fades, just driven by the transition clock so it
    // reverses cleanly under `applyClosing`.
    for (const other of activeRigs) {
      if (other !== rig) applyOpacity(other, 1 - eased);
    }
    camera.position.lerpVectors(openingCameraFrom, inspectCameraPosition, eased);
    cameraTarget.lerpVectors(openingCameraTargetFrom, inspectCameraTarget, eased);
    currentViewOffsetX = lerp(openingViewOffsetFrom, detailViewOffsetX, eased);
    applyDetailViewOffset();
    camera.lookAt(cameraTarget);
  }

  function finishOpening() {
    if (!readingRig) return;
    applyOpening(1);
    mode = "reading";
    transitionTime = 1;
    controls.target.copy(inspectCameraTarget);
    controls.update();
    announce();
  }

  /**
   * Reverses `open()`: flies the held book back down onto the carousel
   * slot it left. The `reading`-only half of `close()`.
   */
  function closeBook() {
    if (mode !== "reading" || !readingRig) return;
    const rig = readingRig;

    closingFrom = capturePose(rig.root);
    closingCameraFrom.copy(camera.position);
    closingCameraTargetFrom.copy(controls.target);
    closingViewOffsetFrom = currentViewOffsetX;
    closingToSlot = slotFor(selectedIndex, position, activeRigs.length, rig.base.height);

    readingOpen = false;
    spread = 0;
    mode = "closing";
    transitionTime = 0;
    announce();
    if (REDUCED) finishClosing();
  }

  function applyClosing(t: number) {
    const rig = readingRig;
    if (!rig || !closingFrom || !closingToSlot) return;
    const eased = smootherstep(clamp(t, 0, 1));
    applyClosingPose(rig, closingFrom, closingToSlot, t);
    // Reverses the opening fade: the rest of the carousel returns to full
    // opacity in step with the held book's flight back to its slot.
    for (const other of activeRigs) {
      if (other !== rig) applyOpacity(other, eased);
    }
    camera.position.lerpVectors(closingCameraFrom, browseCameraPosition, eased);
    cameraTarget.lerpVectors(closingCameraTargetFrom, browseCameraTarget, eased);
    currentViewOffsetX = lerp(closingViewOffsetFrom, 0, eased);
    applyDetailViewOffset();
    camera.lookAt(cameraTarget);
  }

  function finishClosing() {
    const rig = readingRig;
    if (!rig || !closingToSlot) return;
    applyClosing(1);
    snapRigToSlot(rig, closingToSlot);
    rig.lastOffset = null;
    currentViewOffsetX = 0;
    camera.clearViewOffset();
    camera.position.copy(browseCameraPosition);
    cameraTarget.copy(browseCameraTarget);
    camera.lookAt(cameraTarget);
    readingRig = null;
    openingFrom = null;
    closingFrom = null;
    closingToSlot = null;
    mode = "browse";
    transitionTime = 1;
    announce();
  }

  /** Backs up one level — closes the held book, or shelves the carousel. */
  function close() {
    if (mode === "reading") closeBook();
    else shelveBooks();
  }

  /** Recentres the orbit camera on the held book, without leaving `reading`. */
  function resetView() {
    if (mode !== "reading") return;
    camera.position.copy(inspectCameraPosition);
    controls.target.copy(inspectCameraTarget);
    controls.update();
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
    if (index < 0) return;
    // Clicking the centred volume opens it; clicking a neighbour turns the
    // ring to it instead.
    if (index === selectedIndex) open();
    else select(index);
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
    configureResponsiveTargets();
    // Steady-state reading: re-seat the held book on the new targets without
    // touching the orbit camera the user may already have moved.
    if (mode === "reading" && readingRig) {
      readingRig.root.position.copy(inspectPosition);
      readingRig.root.quaternion.copy(inspectBookQuaternion);
      readingRig.root.scale.setScalar(getInspectScale());
      currentViewOffsetX = detailViewOffsetX;
      applyDetailViewOffset();
    }
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
    } else if (mode === "opening") {
      transitionTime = Math.min(1, transitionTime + dt / DETAIL_TRANSITION_DURATION);
      if (transitionTime >= 1) finishOpening();
      else applyOpening(transitionTime);
    } else if (mode === "closing") {
      transitionTime = Math.min(1, transitionTime + dt / DETAIL_TRANSITION_DURATION);
      if (transitionTime >= 1) finishClosing();
      else applyClosing(transitionTime);
    } else if (mode === "reading" && readingRig) {
      controls.update();
      updatePaginatedBook(readingRig, dt, readingOpen ? 1 : 0, spread, null, false, REDUCED);
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

    // Opening, reading, and closing all drive the camera themselves — the
    // pose interpolators above, or the orbit controls — so the shelf/browse
    // blend must not also touch it here, or the two would fight every frame.
    if (mode !== "opening" && mode !== "reading" && mode !== "closing") {
      camera.position.lerpVectors(
        shelfCameraPosition,
        browseCameraPosition,
        browseAmount,
      );
      cameraTarget.lerpVectors(shelfCameraTarget, browseCameraTarget, browseAmount);
      camera.lookAt(cameraTarget);
    }

    renderer.render(scene, camera);
    ready = true;
  }

  frame();

  return {
    openBay,
    close,
    navigate,
    select,
    open,
    resetView,
    debug: () => ({
      mode,
      bay: currentBay,
      selectedIndex,
      readingOpen,
      spread,
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
      controls.dispose();
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
