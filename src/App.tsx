import { useEffect, useRef } from "react";

import { startWorld } from "./world";

export function App() {
  const canvas = useRef<HTMLCanvasElement>(null);
  useEffect(() => startWorld(canvas.current!), []);

  return (
    <>
      <h1>Dimural Murat</h1>
      <canvas
        ref={canvas}
        role="img"
        aria-label="An ASCII figure asleep on a log with butterflies around them. Press any key to wake them."
      />
    </>
  );
}
