# Architecture

Vite + React + TypeScript + Three.js. React only owns the page shell (heading, canvas element, and
later the popup window). The world is a real low-poly **3D scene** that is never shown directly: each
frame it renders small and off-screen, and every pixel becomes a character on a 2D canvas.

## Folders

```
src/
  main.tsx          mounts <App />
  App.tsx           heading + canvas; starts the world on mount, stops it on unmount
  index.css         page styles: full-screen canvas, floating heading
  world/
    index.ts        startWorld(canvas): resize handling, input, the frame loop
    scene3d.ts      the 3D world (Three.js): ground, river, trees, bushes, rocks, cabin, log, person,
                    butterflies, lighting/shadows, camera; renders to an off-screen target, returns pixels
    ascii.ts        pixels -> characters: brightness picks glyph density, depth jumps become / \ | _
                    outlines, ink keeps the scene's hue with lightness following its shading
    grid.ts         the character grid on the visible canvas: cell metrics, put() and opaque art()
    intro.ts        text drawn over the world: Zs, "!", name label, hint
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
2. `scene3d.render()` animates the world (river ripples, tree sway, grass tufts, leaf-texture shimmer,
   butterflies, the person's pose), renders at `SUPERSAMPLE`× the grid size (2 pixels per cell per axis)
   into a render target, then renders again with a depth material, and reads both back.
3. `ascii.drawAscii()` averages each cell's pixels, then:
   - light-mode density = `1 - brightness`; near-white cells stay empty;
   - a Sobel filter on depth finds silhouettes (one object in front of another) and draws them as
     strokes along the edge, on the nearer object only, so outlines are one cell thick;
   - otherwise a glyph is picked from the density band, mixing several glyphs per band by a per-cell
     hash so solid masses look textured;
   - colour = the pixel's hue, with lightness following the scene's shading (`INK_MIN`, `INK_RANGE`),
     so lit faces read lighter than shadowed ones; outlines are darker (`OUTLINE_INK`).
4. `intro.ts` draws overlay text with `grid.art(...)`, which blanks the cells under each row first.
   Positions come from projecting 3D points (`world.headCell`).

## Making the ASCII look right

The look comes from the 3D scene, not the converter. Legibility rules learned the hard way:

- **Few, big, simple shapes.** One round crown per tree, not clusters; small things (thin grass,
  pebbles) become noise. If you can't name a shape at a glance in a screenshot, it's too small or busy.
- **Dark enough surfaces.** Seen from above, sunlit tops wash out to sparse dots; crowns use deep greens.
- **Look at the raw render when confused.** Expose the frame from `world.render()` and draw it to a
  canvas; e.g. "dotted grey blobs" turned out to be tree shadows from trees outside the view.

Knobs: scene — `CAMERA_OFFSET`, clearing size, object counts, light positions/intensities, surface
colours, fog. Converter — `BANDS`, `OUTLINE`, `INK_MIN`, `INK_RANGE`, `OUTLINE_INK` in `ascii.ts`, and
`FONT_PX` in `grid.ts` (smaller = more detail, more cost).

## Coordinates

- 3D world: Three.js units, y up. The log is at the origin, the cabin at (-15, 0, -9), the river follows
  `riverZ(x)`. The camera sits at `focus + CAMERA_OFFSET` looking at `focus`; M2 moves `focus` with the player.
- Grid: cells. Never use pixels outside `grid.ts`. Project 3D points to cells the way `headCell` does.

## Performance

At 1920×1080 with 12px glyphs: median 16.7ms/frame, p95 ~33ms (occasional dropped frame). The cost
is mostly `fillText`/`fillStyle` per cell. If it needs to be faster: batch cells by colour, or move the
glyph drawing into a WebGL shader with a glyph atlas.

## Input

`index.ts` owns all listeners. Milestone 1: any `keydown` or `pointerdown` wakes the sleeper.
Milestone 2 adds a set of held keys for WASD.

## Communicating with React

Milestone 3 needs the canvas to tell React "the player is near object X". Use one callback passed into
`startWorld(canvas, { onNear })`. Do not add a state library.
