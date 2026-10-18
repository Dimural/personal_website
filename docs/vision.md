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

A real 3D open world rendered as ASCII, in light mode. The owner's reference was a dark version of
this (pale green characters on navy, a 3D game scene converted to characters); this site is its
light-mode counterpart. Procedural 2D ASCII art was tried and rejected as "poorly done": the world
must be an actual lit 3D scene so it has real shapes, shadows and depth.

- **Dense, shaded masses.** Trees and other solid things are filled with characters picked by how dark
  each spot is: light `. : ; - =` on lit faces, heavy `% # $ & Q @ 8 N` in shadow, mixed so masses are
  textured. Strong edges draw as `/ \ | -` strokes.
- **Pure characters.** No filled cell backgrounds: objects stay readable because they're always drawn
  in heavy glyphs in their own colour, against sparse ground.
- **Quiet open ground.** Between masses: mostly white, with sparse scatter (`. o Q`) and soft grass patches.
- **Line work for structure.** Paths, water and built things use `/ \ - = ~ |`.
- **A name label** floats over the player once awake ("dimural").

## Rules that hold everywhere

- **Light mode.** Background `#fff`. Characters in dark, muted tones. Shades of a colour are fine and
  encouraged where they show depth or motion (greens for foliage, slate blue for water, browns for wood).
  Avoid bright or saturated colour except the company logos, which use their real brand colours.
- **All ASCII.** World art is made of characters drawn on a monospace grid. Popup windows and the
  heading are normal HTML text, so they're readable, selectable, and screen-reader friendly.
- **Always some motion.** No frame of the world should be completely still, except under
  `prefers-reduced-motion`, where ambient animation stops.
- **Small world.** A handful of places, all reachable quickly. Not a game you can get lost in.
- **Functionality first.** Get each part working, then tune the look. The owner will adjust what a
  visitor sees first once it all works.

## Not in scope (for now)

Sound, saving progress, enemies or scoring, multiple maps, a CMS.
