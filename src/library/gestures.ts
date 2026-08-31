/**
 * Pointer-gesture state shared between the page-turn/cover-open drag
 * handling (Task 11) and the page physics that reads it (Task 5,
 * `updatePaginatedBook` in `./pages`). Defined once, here, so both sides
 * import the same type instead of each declaring their own.
 */
export interface PageDragState {
  active: boolean;
  pointerId: number | null;
  startX: number;
  startY: number;
  progress: number;
  peakProgress: number;
  committed: boolean;
  progressVelocity: number;
  verticalBias: number;
  lastProgress: number;
  lastTime: number;
  direction: -1 | 0 | 1;
  kind: "cover-open" | "cover-close" | "page" | null;
}

export interface DetailPressState {
  active: boolean;
  pointerId: number | null;
  startX: number;
  startY: number;
  moved: boolean;
  allowClick: boolean;
}

export const PAGE_TURN_COMMIT_PROGRESS = 0.18;
export const COVER_OPEN_COMMIT_PROGRESS = 0.16;
export const COVER_CLOSE_COMMIT_PROGRESS = 0.2;

export function createPageDrag(): PageDragState {
  return {
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    progress: 0,
    peakProgress: 0,
    committed: false,
    progressVelocity: 0,
    verticalBias: 0,
    lastProgress: 0,
    lastTime: 0,
    direction: 0,
    kind: null,
  };
}

export function createDetailPress(): DetailPressState {
  return {
    active: false,
    pointerId: null,
    startX: 0,
    startY: 0,
    moved: false,
    allowClick: false,
  };
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/** A drag only counts once it is decisively horizontal. */
const HORIZONTAL_FLOOR = 3;
const HORIZONTAL_BIAS = 0.72;
/** Travel, in pixels, that completes a gesture. */
const COVER_TRAVEL = 140;
const PAGE_TRAVEL = 150;

/**
 * Smooths pointer velocity over clamped frame gaps, so one stuttering frame
 * cannot produce a wild release impulse.
 */
function updateMotion(drag: PageDragState, event: PointerEvent, deltaY: number) {
  const now = event.timeStamp || performance.now();
  const elapsed = clamp((now - drag.lastTime) / 1000, 0.008, 0.08);
  const instant = clamp((drag.progress - drag.lastProgress) / elapsed, -8, 8);
  drag.progressVelocity = lerp(drag.progressVelocity, instant, 0.42);
  drag.verticalBias = lerp(drag.verticalBias, clamp(deltaY / 180, -1, 1), 0.36);
  drag.lastProgress = drag.progress;
  drag.lastTime = now;
}

/**
 * Advances a live drag from a pointer move.
 *
 * `peakProgress` latches `committed` rather than tracking current progress,
 * so a short decisive flick commits and dragging back afterwards does not
 * un-commit it.
 */
export function updatePageDragFromEvent(
  drag: PageDragState,
  event: PointerEvent,
  spread: number,
  spreadCount: number,
) {
  const deltaX = event.clientX - drag.startX;
  const deltaY = event.clientY - drag.startY;
  const horizontal = Math.abs(deltaX);
  const decisive =
    horizontal >= HORIZONTAL_FLOOR && horizontal >= Math.abs(deltaY) * HORIZONTAL_BIAS;

  if (drag.kind === "cover-open" || drag.kind === "cover-close") {
    const opening = drag.kind === "cover-open";
    // A cover opens leftward and closes rightward.
    const signed = opening ? -deltaX : deltaX;
    drag.direction = 0;
    drag.progress = decisive ? clamp(Math.max(0, signed) / COVER_TRAVEL, 0, 1) : 0;
    drag.peakProgress = Math.max(drag.peakProgress, drag.progress);
    if (
      drag.peakProgress >=
      (opening ? COVER_OPEN_COMMIT_PROGRESS : COVER_CLOSE_COMMIT_PROGRESS)
    ) {
      drag.committed = true;
    }
    updateMotion(drag, event, deltaY);
    return;
  }

  if (!decisive) {
    drag.progress = 0;
  } else {
    // Latch a direction once, and only toward a spread that exists — so
    // dragging past the last page does nothing rather than tearing a leaf off.
    if (drag.direction === 0 && horizontal >= 6) {
      const wanted = deltaX < 0 ? 1 : -1;
      const available = wanted > 0 ? spread < spreadCount - 1 : spread > 0;
      drag.direction = available ? (wanted as -1 | 1) : 0;
    }
    const signed = drag.direction > 0 ? -deltaX : deltaX;
    drag.progress =
      drag.direction !== 0 ? clamp(Math.max(0, signed) / PAGE_TRAVEL, 0, 1) : 0;
    drag.peakProgress = Math.max(drag.peakProgress, drag.progress);
    if (drag.peakProgress >= PAGE_TURN_COMMIT_PROGRESS) drag.committed = true;
  }
  updateMotion(drag, event, deltaY);
}

/**
 * Pours release velocity straight into the sheet's springs, so a fast flick
 * makes the page whip rather than merely arriving.
 */
export function applyPageReleaseImpulse(
  flex: { curveVelocity: number; twistVelocity: number },
  drag: PageDragState,
) {
  if (drag.direction === 0) return;
  const speedResponse = clamp(Math.abs(drag.progressVelocity) / 5.5, 0.12, 1);
  flex.curveVelocity = clamp(flex.curveVelocity + speedResponse * 0.46, -1.8, 1.8);
  flex.twistVelocity = clamp(
    flex.twistVelocity +
      drag.verticalBias * 0.38 +
      clamp(drag.progressVelocity / 5.5, -1, 1) * drag.direction * 0.14,
    -1.6,
    1.6,
  );
}

/** Returns a drag to rest without committing whatever it was doing. */
export function resetPageDrag(drag: PageDragState) {
  const reset = createPageDrag();
  Object.assign(drag, reset);
}
