import * as THREE from "three";
import { BAYS, VOLUMES, volumesInBay, type Bay, type Volume } from "./data";
import { BOOK_HEIGHT, BOOK_WIDTH, createBook, type BookHandle } from "./book";
import { BAY_X, SHELF_DEPTH, SHELF_SURFACE_Y, addLights, createRoom } from "./room";

const GAP = 0.028;
const CAMERA_Z = 4.55;
const CAMERA_Z_PRESENTING = 6.75;
const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export interface Library {
  setBay(bay: Bay): void;
  select(id: string | null): void;
  dispose(): void;
}

export interface LibraryOptions {
  canvas: HTMLCanvasElement;
  onSelect: (volume: Volume | null) => void;
  onHover: (volume: Volume | null) => void;
}

const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

/** Frame-rate independent approach toward a target. */
const approach = (current: number, target: number, lambda: number, dt: number) =>
  THREE.MathUtils.lerp(current, target, 1 - Math.exp(-lambda * dt));

export function createLibrary(options: LibraryOptions): Library {
  const { canvas, onSelect, onHover } = options;

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
  camera.position.set(BAY_X.experience, 0.12, CAMERA_Z);

  createRoom(scene);
  addLights(scene);

  // ── Shelve the books ────────────────────────────────────────────
  const books: BookHandle[] = [];
  const meshes: THREE.Object3D[] = [];

  for (const { id: bay } of BAYS) {
    const volumes = volumesInBay(bay);
    const span =
      volumes.reduce((sum, v) => sum + v.depth, 0) + GAP * (volumes.length - 1);
    let cursor = -span / 2;

    for (const volume of volumes) {
      const book = createBook(volume);
      const x = BAY_X[bay] + cursor + volume.depth / 2;
      cursor += volume.depth + GAP;

      book.home.set(
        x,
        SHELF_SURFACE_Y + BOOK_HEIGHT / 2,
        SHELF_DEPTH / 2 - BOOK_WIDTH / 2 - 0.07,
      );
      book.homeRotation.set(0, 0, 0);
      book.group.position.copy(book.home);
      scene.add(book.group);
      books.push(book);
      meshes.push(book.group.children[0]);
    }
  }

  // ── State ───────────────────────────────────────────────────────
  let currentBay: Bay = "experience";
  let selected: BookHandle | null = null;
  let hoveredId: string | null = null;
  let cameraX = camera.position.x;
  let baseZ = CAMERA_Z;

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerActive = false;

  /** Where a drawn-out book is held: left of centre, panel to its right. */
  function presentedTransform(book: BookHandle) {
    const wide = canvas.clientWidth > 900;
    return {
      position: new THREE.Vector3(
        BAY_X[book.volume.bay] + (wide ? -0.82 : 0),
        wide ? 0.08 : 0.34,
        SHELF_DEPTH / 2 + 0.95,
      ),
      rotation: new THREE.Euler(0.045, -Math.PI / 2 + 0.2, 0.012),
    };
  }

  function setBay(bay: Bay) {
    if (bay === currentBay) return;
    currentBay = bay;
    if (selected) {
      selected = null;
      onSelect(null);
    }
  }

  function select(id: string | null) {
    const next = id ? books.find((b) => b.volume.id === id) ?? null : null;
    selected = next;
    onSelect(next?.volume ?? null);
  }

  // ── Pointer ─────────────────────────────────────────────────────
  function updatePointer(event: PointerEvent) {
    const rect = canvas.getBoundingClientRect();
    pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    pointerActive = true;
  }

  function pick(): BookHandle | null {
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(meshes, false)[0];
    if (!hit) return null;
    const id = hit.object.userData.volumeId as string | undefined;
    if (!id) return null;
    const book = books.find((b) => b.volume.id === id) ?? null;
    // Only the bay in front of the camera is live.
    return book && book.volume.bay === currentBay ? book : null;
  }

  const onPointerMove = (event: PointerEvent) => {
    updatePointer(event);
    if (selected) return;
    const book = pick();
    const id = book?.volume.id ?? null;
    if (id !== hoveredId) {
      hoveredId = id;
      canvas.style.cursor = id ? "pointer" : "default";
      onHover(book?.volume ?? null);
    }
  };

  const onPointerLeave = () => {
    pointerActive = false;
    if (hoveredId) {
      hoveredId = null;
      canvas.style.cursor = "default";
      onHover(null);
    }
  };

  const onClick = (event: PointerEvent) => {
    updatePointer(event);
    const book = pick();
    if (book) {
      select(book.volume.id === selected?.volume.id ? null : book.volume.id);
    } else if (selected) {
      select(null);
    }
  };

  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("click", onClick as EventListener);

  // ── Resize ──────────────────────────────────────────────────────
  function resize() {
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    // Narrow viewports need to stand further back to hold a bay in frame.
    baseZ = w < 700 ? CAMERA_Z + 2.4 : w < 1000 ? CAMERA_Z + 1.0 : CAMERA_Z;
    camera.updateProjectionMatrix();
  }

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

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

  const target = new THREE.Vector3();
  const from = new THREE.Vector3();

  function frame() {
    if (!running) return;
    requestAnimationFrame(frame);
    const dt = Math.min(clock.getDelta(), 0.05);
    if (!visible) return;

    // Camera dollies along the wall to the live bay.
    const wantX = BAY_X[currentBay];
    cameraX = REDUCED ? wantX : approach(cameraX, wantX, 3.4, dt);
    camera.position.x = cameraX;
    // Standing back gives a presented volume room to be seen whole.
    const wantZ = selected ? baseZ + (CAMERA_Z_PRESENTING - CAMERA_Z) : baseZ;
    camera.position.z = REDUCED
      ? wantZ
      : approach(camera.position.z, wantZ, 3.6, dt);
    camera.lookAt(cameraX, -0.04, 0);

    for (const book of books) {
      const isSelected = selected === book;
      const isHovered = !selected && hoveredId === book.volume.id && pointerActive;

      const wantPresented = isSelected ? 1 : 0;
      const wantHovered = isHovered ? 1 : 0;

      book.presented = REDUCED
        ? wantPresented
        : approach(book.presented, wantPresented, 5.2, dt);
      book.hovered = REDUCED
        ? wantHovered
        : approach(book.hovered, wantHovered, 9, dt);

      const p = easeOut(book.presented);

      // Shelved pose, with a nudge forward under the cursor.
      from.copy(book.home);
      from.z += book.hovered * 0.16;

      if (p < 0.001) {
        book.group.position.copy(from);
        book.group.rotation.set(0, 0, book.hovered * -0.02);
        continue;
      }

      const { position, rotation } = presentedTransform(book);
      target.copy(position);

      book.group.position.lerpVectors(from, target, p);
      // Arc the book up and out rather than sliding it flat.
      book.group.position.y += Math.sin(p * Math.PI) * 0.22;
      book.group.rotation.set(
        rotation.x * p,
        rotation.y * p,
        rotation.z * p + (1 - p) * book.hovered * -0.02,
      );
    }

    renderer.render(scene, camera);
  }

  frame();

  return {
    setBay,
    select,
    dispose() {
      running = false;
      observer.disconnect();
      io.disconnect();
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("click", onClick as EventListener);
      renderer.dispose();
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
