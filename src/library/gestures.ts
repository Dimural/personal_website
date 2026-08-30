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
