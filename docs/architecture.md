# Architecture

Vite + React + TypeScript + Three.js. React only owns the page shell (heading, two canvases, and later
the popup window). The world is a detailed **3D scene** that is never shown directly: each frame it
renders small and off-screen, and GPU shaders turn it into coloured characters on the visible canvas.
How it must look is in [look.md](look.md); this file is how the code does it.

## Folders

```
src/
  main.tsx          mounts <App />
  App.tsx           heading + two stacked canvases (world, overlay); starts/stops the world
  index.css         page styles: night-navy page, full-screen canvases, floating heading
  world/
    index.ts        startWorld(worldCanvas, overlayCanvas): resize, input, the frame loop
    scene3d.ts      the 3D world: castle, meadow of grass blades, pond, trees, torches, fireflies, log,
                    figure, butterflies; MAP, COLLIDERS + blocked(), SPOTS; camera follow
    player.ts       held keys → Pose (position, heading, stride); movement with sliding collisions
    ascii.ts        the GPU passes: scene → eased per-cell colour/stroke → glyphs on the world canvas
    grid.ts         cell metrics (whole device pixels) + overlay text drawing on the overlay canvas
    intro.ts        overlay text: name tag, Zs, "!", hints
```

Planned (add when the milestone needs it, not before):

```
  world/objects.ts  milestones 3-4: floating logos and project objects (3D meshes at SPOTS), proximity
  content/          milestone 3: typed resume data (experience, projects)
  ui/Popup.tsx      milestone 3: the HTML window that opens near an object
```

## How a frame is drawn

1. `index.ts` runs a `requestAnimationFrame` loop. `now` = real seconds (drives waking and walking);
   `ambient` = the clock for scenery motion, frozen at 0 under `prefers-reduced-motion`.
2. Once the stand-up (`WAKE_SECONDS`) is over, `player.update(dt, world.blocked)` moves the Pose.
3. `scene3d.render()` animates the world (grass wind in its vertex shader, pond glints, torch glow,
   fireflies, butterflies, the figure from the Pose), eases the camera, and renders into a
   **multisampled** target of 3×3 pixels per character cell.
4. `ascii.ts`, pass 1 (one fragment per cell): averages the cell's 3×3 pixels (sRGB) and measures its
   stroke direction as a structure tensor, then **eases small changes toward the previous frame's values**
   (`SETTINGS.ease`, ping-pong targets) to stop flicker. Big changes switch at once, and the ease speeds
   up with `cameraSpeed` (from `scene3d.render`), so walking never smears.
5. `ascii.ts`, pass 2 (every screen pixel): a `/ \ | -` stroke if the cell's stroke is clear, otherwise
   a glyph from the quiet ramp by brightness; coloured with the cell's muted colour on navy; glyph shapes
   from an atlas drawn once per resize in the grid's font.
6. `intro.ts` draws text on the transparent overlay canvas via `grid` (`put`, `art`, `big`). Positions
   come from projecting 3D points (`world.headCell`).

## Coordinates

- 3D world: Three.js units, y up, 1 ≈ a person's width. The log is at the origin; north (−z) is the
  castle (wall at z −16), the pond is at (13, 12). W walks north, D walks east (+x).
- The camera sits at `focus + CAMERA_OFFSET` looking at `focus`; `focus` eases after the player, and
  the camera itself is snapped to whole grid cells on the ground (`cellsPer`, measured on resize).
  `render()` returns the step it took as `shift`, and `ascii.ts` reads its history from there.
- Grid: cells, top-left origin. The rendered image spans exactly `cols × rows` cells, so a projected
  point's NDC maps straight to cells (see `headCell`).

## Performance

At 1440×900 retina with 150k grass blades: median 16.6 ms, p95 17.6 ms (steady 60 fps). Repeated
things are `InstancedMesh`es (one draw call each); grass wind runs in the vertex shader.

## Input

`index.ts` owns all listeners. Any `keydown` or `pointerdown` wakes the sleeper. `keydown`/`keyup` feed
`player.key()` (WASD and arrows; those and space don't scroll the page); `blur` releases held keys.

## Communicating with React

Milestone 3 needs the canvas to tell React "the player is near object X". Use one callback passed into
`startWorld(..., { onNear })`. Do not add a state library.
