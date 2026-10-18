import { useEffect, useRef } from "react";

import { startWorld } from "./world";

export function App() {
  const world = useRef<HTMLCanvasElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  useEffect(() => startWorld(world.current!, overlay.current!), []);

  return (
    <>
      <h1>Dimural Murat</h1>
      <canvas
        ref={world}
        role="img"
        aria-label="An ASCII figure asleep on a log in a forest clearing, butterflies around them. Press any key to wake them."
      />
      <canvas ref={overlay} aria-hidden="true" />
    </>
  );
}
