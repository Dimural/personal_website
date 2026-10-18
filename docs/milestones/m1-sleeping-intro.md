# M1 — Sleeping intro

**Status:** done

## Goal

The landing view works on its own: heading, a sleeping ASCII figure on a log, ambient motion, and a
wake-up on any input.

## Scope

- "Dimural Murat" heading at the top, normal HTML text.
- Full-screen canvas, heading floating over it. Dense shaded terrain (see "Look" in `vision.md`):
  tree crowns, a stream, grass patches, scatter.
- Figure lying on a log in a clearing at the centre.
- Motion: crowns shimmer in the wind, the stream flows, grass sways, 3 coloured butterflies flap on
  looping paths, Zs rise from the head and fade.
- Hint text "press any key" that pulses gently.
- Any `keydown` or `pointerdown`: Zs stop, a `!` pops over the head, then the figure stands on the log
  and a "dimural" name label fades in above them.
- `prefers-reduced-motion`: ambient motion is frozen; waking still works.

## Done when

- [x] `npm run build` passes.
- [x] Page shows heading + sleeping scene, with all three kinds of motion visible.
- [x] Pressing a key or clicking wakes the figure.
- [x] Resizing the window keeps the scene centred and crisp (handles devicePixelRatio).

## Files

`src/App.tsx`, `src/index.css`, `src/world/index.ts`, `src/world/grid.ts`, `src/world/terrain.ts`, `src/world/intro.ts`.

## Handoff to M2

The awake state currently ends with a standing figure that can't move. M2 replaces that ending: once
awake, hand control to the player with the camera on the log; `drawTerrain` already takes a camera
position, so the world is ready to scroll.
