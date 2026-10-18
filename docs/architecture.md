# Architecture

Vite + React + TypeScript. React only owns the page shell (heading, canvas element, and later the popup
window). The world itself is drawn by plain TypeScript onto one `<canvas>`.

## Folders

```
src/
  main.tsx          mounts <App />
  App.tsx           heading + canvas; starts the world on mount, stops it on unmount
  index.css         page styles: full-screen canvas, floating heading
  world/
    index.ts        startWorld(canvas): resize handling, input, the frame loop
    grid.ts         the character grid: measures the monospace cell, draws text; art() draws opaque rows
    terrain.ts      the endless ground: trees, stream, grass, scatter, as a pure function of (x, y, t)
    intro.ts        milestone 1 scene: terrain + sleeper on a log, butterflies, Zs, name label
```

Planned (add when the milestone needs it, not before):

```
  world/player.ts   milestone 2: position, WASD input, walking animation, blocked cells
  world/camera.ts   milestone 2: keeps the player centred, clamped to the map bounds
  world/objects.ts  milestones 3-4: floating logos and project objects, bobbing, proximity
  content/          milestone 3: typed resume data (experience, projects)
  ui/Popup.tsx      milestone 3: the HTML window that opens near an object
```

## How a frame is drawn

1. `index.ts` runs a `requestAnimationFrame` loop with `t` = seconds since start (frozen at 0 under
   `prefers-reduced-motion`).
2. The grid is cleared, `drawTerrain(grid, camX, camY, t)` fills every visible cell, then the scene
   draws its art on top with `grid.art(...)`, which blanks the cells under each row first so art never
   tangles with terrain. `grid.put(...)` draws transparently (spaces show what's beneath).
3. Everything is in **cell coordinates**. Never use pixels outside `grid.ts`.
4. **World coordinates:** cells, origin at the log. Screen cell `(cols/2, rows/2)` (floored) shows the
   camera's world cell. Cells are about twice as tall as wide, so round shapes scale `y` by 2.
5. Font is 12px monospace. At 1920×1080 that's ~16k cells redrawn every frame at a steady 60fps; keep
   per-cell work to a few noise lookups.

Motion comes from pure functions of `t` and position (e.g. grass blade = `sin(x * 0.3 + t * 2)`), so
there is no per-tile state to keep in sync.

## Input

`index.ts` owns all listeners. Milestone 1: any `keydown` or `pointerdown` wakes the sleeper.
Milestone 2 adds a set of held keys for WASD.

## Communicating with React

Milestone 3 needs the canvas to tell React "the player is near object X". Use one callback passed into
`startWorld(canvas, { onNear })`. Do not add a state library.
