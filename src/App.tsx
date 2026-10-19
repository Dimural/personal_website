import { useEffect, useRef, useState } from "react";

import { TitleCard } from "./ui/TitleCard";
import { startWorld } from "./world";

export function App() {
  const world = useRef<HTMLCanvasElement>(null);
  const overlay = useRef<HTMLCanvasElement>(null);
  const handle = useRef<ReturnType<typeof startWorld>>();
  const [asleep, setAsleep] = useState(true);
  useEffect(() => {
    handle.current = startWorld(world.current!, overlay.current!, { onAsleep: setAsleep });
    return handle.current.stop;
  }, []);

  return (
    <>
      <canvas
        ref={world}
        role="img"
        aria-label="An ASCII figure asleep on a log in a dusk meadow before a ruined castle. Press space to wake them and walk around."
      />
      <canvas ref={overlay} aria-hidden="true" />
      <TitleCard asleep={asleep} onWake={() => handle.current?.wake()} />
    </>
  );
}
