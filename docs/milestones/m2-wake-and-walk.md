# M2 — Wake and walk

**Status:** not started

## Goal

After waking, the visitor walks a small, living map with WASD while the camera follows.

## Scope

- `world/map.ts`: one hand-drawn map as an array of strings (roughly 160 × 60 cells). Includes the
  log from the intro, a stream or pond, grass fields, a few trees, paths, and a soft border (cliffs, fence or
  water) so the edge feels natural. Mark which characters block movement.
- `world/ambient.ts`: animated tiles keyed by map character, e.g. `~` water flows sideways, `"` grass
  sways. Pure functions of `(x, y, t)`.
- `world/player.ts`: WASD (and arrow keys) move one cell at a fixed speed while held; diagonal allowed.
  Two-frame walk cycle; facing left/right. Blocked cells stop movement.
- `world/camera.ts`: player stays centred; camera clamps at map edges.
- Wake transition: the intro's log is the map's log; after the stand-up, the scene switches to the map without a jump.
- Reserve open clearings for 3 logos and 3 project objects (see `content.md`). Leave them empty for now.

## Done when

- [ ] `npm run build` passes.
- [ ] Can walk from the log to every reserved clearing in under ~30 seconds.
- [ ] Water and grass visibly move everywhere on screen.
- [ ] Can't walk through water/trees/border.
- [ ] No keyboard scrolling of the page while playing (prevent default on WASD/arrows/space).

## Open decisions

- Map shape and art: builder's call. Keep it small.
- Phone/tablet control: deferred to M5.
