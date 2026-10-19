import { createAsciiPass } from "./ascii";
import { Grid } from "./grid";
import { drawIntroOverlay } from "./intro";
import { createPlayer } from "./player";
import { createScene, WAKE_SECONDS } from "./scene3d";

/**
 * Starts the world: `worldCanvas` gets the ASCII world (WebGL), `overlayCanvas` the text on top.
 * `onAsleep` tells the page whether the figure is asleep (the title card shows) or awake (walking).
 */
export function startWorld(worldCanvas: HTMLCanvasElement, overlayCanvas: HTMLCanvasElement, opts: { onAsleep: (asleep: boolean) => void }) {
  const grid = new Grid(overlayCanvas);
  let world: ReturnType<typeof createScene>;
  try {
    world = createScene(worldCanvas);
  } catch {
    // shortcut: no WebGL means a plain message; M5 adds a real no-game fallback.
    grid.put(2, 2, "this world needs WebGL to draw.");
    return { wake() {}, stop() {} };
  }
  const ascii = createAsciiPass();
  const player = createPlayer();

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const start = performance.now();
  const now = () => (performance.now() - start) / 1000;
  let wokeAt: number | null = null;
  const wake = () => {
    if (wokeAt !== null) return;
    wokeAt = now();
    opts.onAsleep(false);
  };
  opts.onAsleep(true);

  const keydown = (e: KeyboardEvent) => {
    if (e.code === "Space") wake(); // only space wakes, so reading or selecting the card never does
    if (player.key(e.code, true)) e.preventDefault(); // WASD/arrows/space must not scroll the page
  };
  const keyup = (e: KeyboardEvent) => {
    player.key(e.code, false);
  };
  const release = () => player.release();
  const resize = () => {
    grid.resize();
    const { width, height } = worldCanvas.getBoundingClientRect();
    world.resize(width, height, grid.dpr, grid.cols, grid.rows, (grid.cols * grid.cellW) / (grid.rows * grid.cellH));
    ascii.resize(grid, world.renderer.domElement.height);
  };
  resize();
  addEventListener("keydown", keydown);
  addEventListener("keyup", keyup);
  addEventListener("blur", release);
  addEventListener("resize", resize);

  let raf = 0;
  let last = now();
  const frame = () => {
    const t = now();
    const dt = Math.min(0.1, t - last);
    last = t;
    const ambient = reduceMotion ? 0 : t;
    if (wokeAt !== null && t - wokeAt >= WAKE_SECONDS) player.update(dt, world.blocked);
    ascii.render(world.renderer, world.render(t, ambient, wokeAt, player.pose));
    grid.clear();
    drawIntroOverlay(grid, world, t, ambient, wokeAt, player.walked);
    raf = requestAnimationFrame(frame);
  };
  frame();

  const stop = () => {
    cancelAnimationFrame(raf);
    removeEventListener("keydown", keydown);
    removeEventListener("keyup", keyup);
    removeEventListener("blur", release);
    removeEventListener("resize", resize);
    world.dispose();
  };
  return { wake, stop };
}
