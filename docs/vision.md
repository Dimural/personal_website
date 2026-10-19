# Vision

The site is a tiny ASCII world. Everything is drawn with text characters.

## The experience, start to finish

1. **Landing.** The world fills the screen. "Dimural Murat" floats at the top as a normal heading.
   In the middle, a clearing in an ASCII forest, where a figure sleeps on a log. Butterflies flutter around them, Zs drift up, grass sways.
2. **Wake.** Pressing any key, or clicking/tapping anywhere, wakes the figure. They stand up.
3. **Walk.** WASD moves the figure. The camera follows them, so the map scrolls as they walk.
4. **Explore.** The map is small and bounded, not open world: a few minutes of wandering covers it.
   It is always moving: flowing water, swaying grass, and the like.
5. **Experience.** Floating ASCII company logos, one per job on the resume, drawn in each company's
   real brand colours. Walking close opens a window with the job title, the company's full name,
   dates, location and what was done there.
6. **Projects.** Each project has its own themed object in the world, for example floating pills and
   syringes for Lazarus. Walking close opens the same kind of window with the project details.

## Look

**[look.md](look.md) is the rule for how everything is drawn. Read it before touching anything visual.**
In short: a calm, smooth dusk game scene; a detailed real 3D world converted to small, muted, coloured
ASCII characters on night navy. Approved by the owner on 2026-10-18; keep this vibe.

The map: a ruined castle wall with a dark gate and torches across the north, a wide grass meadow in
front of it, a pond, groves and forest around the edges. The figure sleeps on a log in the meadow.

## Rules that hold everywhere

- **Follow look.md.** Calm, never loud; no letters in the world; navy page; muted colour; eased cells.
- **All ASCII.** The world is only characters on a monospace grid, converted from the 3D scene. Popup
  windows and the heading are normal HTML text, so they're readable, selectable and screen-reader friendly.
- **Always some motion.** No frame of the world should be completely still, except under
  `prefers-reduced-motion`, where ambient animation stops.
- **Small world.** A handful of places, all reachable quickly. Not a game you can get lost in.
- **Functionality first.** Get each part working, then tune the look. The owner will adjust what a
  visitor sees first once it all works.

## Not in scope (for now)

Sound, saving progress, enemies or scoring, multiple maps, a CMS.
