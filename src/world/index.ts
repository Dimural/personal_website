import { createAsciiPass } from "./ascii";
import { Grid } from "./grid";
import { drawIntroOverlay } from "./intro";
import { createPlayer } from "./player";
import { createScene, WAKE_SECONDS, type Rest } from "./scene3d";

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
  let rest: Rest = { asleep: true, since: null };
  // Mid stand-up or lie-down, space is ignored, so mashing it can't flip the state back and forth.
  const settled = () => rest.since === null || now() - rest.since >= WAKE_SECONDS;
  const wake = () => {
    if (!rest.asleep || !settled()) return;
    rest = { asleep: false, since: now() };
    player.reset(); // the stand-up ends where a fresh walk starts
    opts.onAsleep(false);
  };
  const sleep = () => {
    if (rest.asleep || !settled() || !player.atLog) return;
    rest = { asleep: true, since: now() };
    player.release(); // stop walking at once; the lie-down starts where the figure stands
    opts.onAsleep(true);
  };
  opts.onAsleep(true);

  const keydown = (e: KeyboardEvent) => {
    // Only space wakes, so reading or selecting the card never does. At the log, space goes back to sleep.
    if (e.code === "Space" && !e.repeat) (rest.asleep ? wake : sleep)();
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
  if (import.meta.env.DEV) Object.assign(window, { __critters: { rabbits: world.critters.rabbits, player: player.pose }, __head: () => world.headCell(1, 1), __logCell: () => world.logCell(1, 1) }); // for the e2e check
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
    if (!rest.asleep && settled()) player.update(dt, world.blocked);
    ascii.render(world.renderer, world.render(t, ambient, rest, player.pose));
    grid.clear();
    drawIntroOverlay(grid, world, t, ambient, rest, player.walked, !rest.asleep && settled() && player.atLog);
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
