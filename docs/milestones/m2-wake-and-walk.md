# M2 — Wake and walk

**Status:** not started

## Goal

After waking, the visitor walks a small, living map with WASD while the camera follows.

## Scope

- Build on `world/scene3d.ts`. Bound the map (roughly 120 × 100 units around the log) with a natural
  edge: forest thickening into a wall. Add dirt paths linking the clearings and a bridge over the river.
- Movement is blocked by tree trunks, rocks, the cabin and the river (except the bridge). Simple circle
  colliders are enough.
- The person mesh walks with a simple leg swing and turns to face its direction of travel.
- `world/player.ts`: WASD (and arrow keys) move one cell at a fixed speed while held; diagonal allowed.
  Two-frame walk cycle; facing left/right. Blocked cells stop movement.
- Camera: `focus` follows the player smoothly (lerp), clamped at map edges.
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
