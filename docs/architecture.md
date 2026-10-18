# Architecture

Vite + React + TypeScript. React only owns the page shell (heading, canvas element, and later the popup
window). The world itself is drawn by plain TypeScript onto one `<canvas>`.

## Folders

```
src/
  main.tsx          mounts <App />
  App.tsx           heading + canvas; starts the world on mount, stops it on unmount
  index.css         page styles (white ground, black ink)
  world/
    index.ts        startWorld(canvas): resize handling, input, the frame loop
    grid.ts         the character grid: measures the monospace cell, draws text at cell coordinates
    intro.ts        milestone 1 scene: sleeper on a log, butterflies, Zs, grass
```

Planned (add when the milestone needs it, not before):

```
  world/map.ts      milestone 2: the static map (string rows) and which cells block movement
  world/player.ts   milestone 2: position, WASD input, walking animation
  world/camera.ts   milestone 2: keeps the player centred, clamped to map edges
  world/ambient.ts  milestone 2: animated tiles (water, grass) drawn from time + position
  world/objects.ts  milestones 3-4: floating logos and project objects, bobbing, proximity
  content/          milestone 3: typed resume data (experience, projects)
  ui/Popup.tsx      milestone 3: the HTML window that opens near an object
```

## How a frame is drawn

1. `index.ts` runs a `requestAnimationFrame` loop with `t` = seconds since start (frozen at 0 under
   `prefers-reduced-motion`).
2. The grid is cleared, then the current scene draws into it with `grid.put(col, row, text, colour?)`.
   Spaces in `text` are transparent, so art can overlap.
3. Everything is in **cell coordinates**. Never use pixels outside `grid.ts`.

Motion comes from pure functions of `t` and position (e.g. grass blade = `sin(x * 0.3 + t * 2)`), so
there is no per-tile state to keep in sync.

## Input

`index.ts` owns all listeners. Milestone 1: any `keydown` or `pointerdown` wakes the sleeper.
Milestone 2 adds a set of held keys for WASD.

## Communicating with React

Milestone 3 needs the canvas to tell React "the player is near object X". Use one callback passed into
`startWorld(canvas, { onNear })`. Do not add a state library.
