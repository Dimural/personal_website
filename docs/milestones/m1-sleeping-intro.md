# M1 — Sleeping intro

**Status:** done

## Goal

The landing view works on its own: heading, a sleeping ASCII figure on a log, ambient motion, and a
wake-up on any input.

## Scope

- "Dimural Murat" heading at the top, normal HTML text.
- Full-width canvas below it, white ground, black characters on a monospace grid.
- Scene centred in the canvas: figure lying on a log, grass beneath.
- Motion: 3 butterflies flapping on looping paths, Zs rising from the head and fading, grass swaying.
- Hint text "press any key" that pulses gently.
- Any `keydown` or `pointerdown`: Zs stop, a `!` pops over the head, then the figure stands beside the log.
- `prefers-reduced-motion`: ambient motion is frozen; waking still works.

## Done when

- [x] `npm run build` passes.
- [x] Page shows heading + sleeping scene, with all three kinds of motion visible.
- [x] Pressing a key or clicking wakes the figure.
- [x] Resizing the window keeps the scene centred and crisp (handles devicePixelRatio).

## Files

`src/App.tsx`, `src/index.css`, `src/world/index.ts`, `src/world/grid.ts`, `src/world/intro.ts`.

## Handoff to M2

The awake state currently ends with a standing figure that can't move. M2 replaces that ending: once
awake, hand control to the map scene with the player placed where the log is.
