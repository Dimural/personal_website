import { createAsciiPass } from "./ascii";
import { Grid } from "./grid";
import { drawIntroOverlay } from "./intro";
import { createScene } from "./scene3d";

/** Starts the world: `worldCanvas` gets the ASCII world (WebGL), `overlayCanvas` the text on top. Returns a stop function. */
export function startWorld(worldCanvas: HTMLCanvasElement, overlayCanvas: HTMLCanvasElement) {
  const grid = new Grid(overlayCanvas);
  let world: ReturnType<typeof createScene>;
  try {
    world = createScene(worldCanvas);
  } catch {
    // shortcut: no WebGL means a plain message; M5 adds a real no-game fallback.
    grid.put(2, 2, "this world needs WebGL to draw.");
    return () => {};
  }
  const ascii = createAsciiPass();

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const start = performance.now();
  const now = () => (performance.now() - start) / 1000;
  let wokeAt: number | null = null;

  const wake = () => {
    wokeAt ??= now();
  };
  const resize = () => {
    grid.resize();
    const { width, height } = worldCanvas.getBoundingClientRect();
    world.resize(width, height, grid.dpr, grid.cols, grid.rows, (grid.cols * grid.cellW) / (grid.rows * grid.cellH));
    ascii.resize(grid, world.renderer.domElement.height);
  };
  resize();
  addEventListener("keydown", wake);
  addEventListener("pointerdown", wake);
  addEventListener("resize", resize);

  let raf = 0;
  const frame = () => {
    const t = now();
    const ambient = reduceMotion ? 0 : t;
    ascii.render(world.renderer, world.render(t, ambient, wokeAt));
    grid.clear();
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
