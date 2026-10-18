import { Grid } from "./grid";
import { drawIntro } from "./intro";

/** Starts the world on a canvas. Returns a function that stops it. */
export function startWorld(canvas: HTMLCanvasElement) {
  const grid = new Grid(canvas);
  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const start = performance.now();
  const now = () => (performance.now() - start) / 1000;
  let wokeAt: number | null = null;

  const wake = () => {
    wokeAt ??= now();
  };
  const resize = () => grid.resize();
  addEventListener("keydown", wake);
  addEventListener("pointerdown", wake);
  addEventListener("resize", resize);

  let raf = 0;
  const frame = () => {
    const t = now();
    grid.clear();
    drawIntro(grid, t, reduceMotion ? 0 : t, wokeAt);
    raf = requestAnimationFrame(frame);
  };
  frame();

  return () => {
    cancelAnimationFrame(raf);
    removeEventListener("keydown", wake);
    removeEventListener("pointerdown", wake);
    removeEventListener("resize", resize);
  };
}
