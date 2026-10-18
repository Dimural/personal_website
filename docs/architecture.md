# Architecture

Vite + React + TypeScript + Three.js. React only owns the page shell (heading, two canvases, and later
the popup window). The world is a real low-poly **3D scene** that is never shown directly: each frame it
renders small and off-screen, and a GPU shader turns it into characters on the visible canvas.

## Folders

```
src/
  main.tsx          mounts <App />
  App.tsx           heading + two stacked canvases (world, overlay); starts/stops the world
  index.css         page styles: full-screen canvases, floating heading, overlay ignores clicks
  world/
    index.ts        startWorld(worldCanvas, overlayCanvas): resize, input, the frame loop
    scene3d.ts      the 3D world (Three.js): ground, river, instanced trees/bushes/rocks, cabin, log,
                    person, butterflies, lights/shadows, camera; renders into a colour+depth target
    ascii.ts        the GPU pass: a full-screen shader turns the target into glyphs on the world canvas
    grid.ts         cell metrics (whole device pixels) + overlay text drawing on the overlay canvas
    intro.ts        overlay text: big Zs, "!", name label, hint
```

Planned (add when the milestone needs it, not before):

```
  world/player.ts   milestone 2: WASD input, moving the person in scene3d, collisions
  world/objects.ts  milestones 3-4: floating logos and project objects (3D meshes), proximity
  content/          milestone 3: typed resume data (experience, projects)
  ui/Popup.tsx      milestone 3: the HTML window that opens near an object
```

## How a frame is drawn

1. `index.ts` runs a `requestAnimationFrame` loop. `now` = real seconds (drives waking); `ambient` =
   the clock for motion, frozen at 0 under `prefers-reduced-motion`.
2. `scene3d.render()` animates the world (river ripples, crown sway, grass tufts, leaf-texture shimmer,
   butterflies, the person's pose) and renders it into a target of 2×2 pixels per character cell, with a
   depth texture attached. Nothing is read back to the CPU.
3. `ascii.ts` draws one full-screen quad onto the world canvas. Per screen pixel, the shader finds its
   cell, samples the cell's colour (linear filtering averages the 2×2 pixels) and its neighbours' depth:
   - pure ASCII: characters on white, no cell fills (fills were tried; they read as pixel art);
   - **outline:** a Sobel filter on depth finds silhouettes; the nearer object draws a `| \ _ /` stroke;
   - **object** (density ≥ `objectMin`): always heavy glyphs, lit `* o +` through shadowed `@ Q N 8`,
     in the object's own saturated colour, lighter on lit faces (`inkLit` → `inkShadow`);
   - **ground** (below `objectMin`): sparse `.` and `:` in a muted tone, nothing on bare ground;
   - glyphs within a band are picked per cell by a hash so masses look textured;
   - glyph shapes come from an atlas canvas drawn once per resize in the same bold font as the grid.
4. `intro.ts` draws text on the transparent overlay canvas via `grid` (`put`, `art`, `big`). Positions
   come from projecting 3D points (`world.headCell`).

## Making the ASCII look right

The look comes from the 3D scene first, the shader second. Legibility rules learned the hard way:

- **Objects heavy, ground sparse.** Shapes read by the contrast between dense glyphs and empty ground,
  so objects never drop to light glyphs even when sunlit; light only changes glyph choice and ink shade.
  (Letting lit faces turn into dots made everything faint; tinted cell fills fixed that but stopped it
  looking like ASCII. Don't bring fills back.)
- **Few, big, simple shapes.** One round crown per tree; small things become noise. If you can't name a
  shape at a glance in a screenshot, it's too small or busy.
- **Make states obvious with overlay text.** Big drifting Zs say "asleep" better than any pose.
- **Dark enough surfaces.** Seen from above, sunlit tops wash out; crowns use deep greens.
- **Look at the raw render when confused.** Render the target to the screen instead of the ASCII pass;
  e.g. "dotted grey blobs" turned out to be tree shadows from trees outside the view.

Knobs: scene — `CAMERA_OFFSET`, clearing size, object counts, light positions/intensities, surface
colours, fog. Shader — `SETTINGS` and `BANDS` in `ascii.ts`. Glyph size — `FONT_PX` in `grid.ts`.

## Coordinates

- 3D world: Three.js units, y up. The log is at the origin, the cabin at (-15, 0, -9), the river follows
  `riverZ(x)`. The camera sits at `focus + CAMERA_OFFSET` looking at `focus`; M2 moves `focus` with the player.
- Grid: cells, top-left origin. The rendered image spans exactly `cols × rows` cells, so a projected
  point's NDC maps straight to cells (see `headCell`).

## Performance

At 1920×1080: median 16.7ms, p95 17.6ms (steady 60fps). Lessons: per-cell `fillText` on a 2D canvas
was the bottleneck (~20k glyphs/frame, and it stalled GPU readbacks); hundreds of separate meshes cost a
draw call each per pass, so repeated objects are `InstancedMesh`es.

## Input

`index.ts` owns all listeners. Milestone 1: any `keydown` or `pointerdown` wakes the sleeper.
Milestone 2 adds a set of held keys for WASD.

## Communicating with React

Milestone 3 needs the canvas to tell React "the player is near object X". Use one callback passed into
`startWorld(..., { onNear })`. Do not add a state library.
