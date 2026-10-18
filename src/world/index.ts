import { drawAscii } from "./ascii";
import { Grid } from "./grid";
import { drawIntroOverlay } from "./intro";
import { createScene } from "./scene3d";

/** Starts the world on a canvas. Returns a function that stops it. */
export function startWorld(canvas: HTMLCanvasElement) {
  const grid = new Grid(canvas);
  let world: ReturnType<typeof createScene>;
  try {
    world = createScene();
  } catch {
    // shortcut: no WebGL means a plain message; M5 adds a real no-game fallback.
    grid.put(2, 2, "this world needs WebGL to draw.");
    return () => {};
  }

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const start = performance.now();
  const now = () => (performance.now() - start) / 1000;
  let wokeAt: number | null = null;

  const wake = () => {
    wokeAt ??= now();
  };
  const resize = () => {
    grid.resize();
    const { width, height } = canvas.getBoundingClientRect();
    world.resize(grid.cols, grid.rows, width / height);
  };
  resize();
  addEventListener("keydown", wake);
  addEventListener("pointerdown", wake);
  addEventListener("resize", resize);

  let raf = 0;
  const frame = () => {
    const t = now();
    const ambient = reduceMotion ? 0 : t;
    grid.clear();
    drawAscii(grid, world.render(t, ambient, wokeAt));
    drawIntroOverlay(grid, world, t, ambient, wokeAt);
    raf = requestAnimationFrame(frame);
  };
  frame();

  return () => {
    cancelAnimationFrame(raf);
    removeEventListener("keydown", wake);
    removeEventListener("pointerdown", wake);
    removeEventListener("resize", resize);
    world.dispose();
  };
}
