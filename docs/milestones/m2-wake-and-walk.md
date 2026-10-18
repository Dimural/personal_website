# M2 — Wake and walk

**Status:** not started

## Goal

After waking, the visitor walks a small, living map with WASD while the camera follows.

## Scope

- Build on `world/terrain.ts` (already animated: crowns, stream, grass). Add map bounds (roughly
  160 × 60 cells around the log) with a natural edge: dense forest closing in, which the terrain can do by
  forcing trees outside the bounds. Add paths (line work, see `vision.md`) linking the clearings.
- Movement is blocked by tree crowns' dense cores and the stream (except at a bridge or stepping stones).
- `world/player.ts`: WASD (and arrow keys) move one cell at a fixed speed while held; diagonal allowed.
  Two-frame walk cycle; facing left/right. Blocked cells stop movement.
- `world/camera.ts`: player stays centred; camera clamps at map edges.
- Wake transition: the intro's log is the map's log; after the stand-up, the camera starts following
  without a jump. The "dimural" label follows the player.
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
