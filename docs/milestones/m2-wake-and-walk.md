# M2 — Wake and walk

**Status:** done (2026-10-18)

## Goal

After waking, the visitor walks the meadow with WASD or the arrow keys while the camera follows.

## What was built

- `world/player.ts`: held keys → a `Pose` (position, heading, stride, how much it's moving). Speed 7
  units/s, diagonals normalised. Each axis is collision-checked separately, so walking into something at
  an angle slides along it. Turns smoothly toward the direction of travel. Keys are released on window blur.
- `world/scene3d.ts`:
  - `MAP`: the walkable meadow, x −44…44, from just in front of the castle wall (z −14.6) to z 38.
  - `COLLIDERS`: circles for tree trunks, castle towers, fallen blocks and torches, filled in as the scene
    is built. `blocked(x, z, r)` checks those, the pond and the map edge.
  - The log has no collider on purpose: you step over it (W, straight at it, is most people's first key).
  - Groves of trees inside the meadow; forest all around it.
  - `SPOTS`: six open places reserved for M3 (experience, by the castle) and M4 (projects, in the
    meadow). Nothing is drawn there yet.
  - The figure: legs swing from hip pivots, a slight bob while walking, faces where it walks.
  - Camera: eases toward a point a little north of the player (`1 − e^(−3·dt)`), clamped so it never
    shows past the forest. The ease starts from the intro framing, so waking up never jumps.
  - The grass already parts around the figure (`uPush` follows it).
- `world/intro.ts`: the hint changes to "WASD or arrow keys to walk" after waking and disappears on the
  first step. The "Dimural" name tag follows the figure.
- `world/index.ts`: keydown/keyup feed the player; movement keys and space `preventDefault`, so the page
  never scrolls.

## Done when

- [x] `npm run build` passes.
- [x] Can walk from the log to every reserved spot in under ~30 seconds (farthest is ~45 units, ~7 s).
- [x] Grass, water, torches and fireflies move everywhere on screen.
- [x] Can't walk through the pond, trees, castle or the map edge (checked in a browser).
- [x] No keyboard scrolling of the page while playing.

## Left for later

- Phone/tablet control: M5.
- The figure is small at this scale (as in the reference); a closer camera or bigger figure is a look
  decision, see [look.md](../look.md).
