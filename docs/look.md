# Look — how the world must always be drawn

The owner approved this look on 2026-10-18 after many rejected attempts ("this is actually really nice
now, i love it. ensure that this is the vibe kept"). Treat this file as a hard rule. Anything new in the
world (logos, project objects, places, effects) must be made the same way and must feel the same.

**The vibe in one line:** a calm, smooth dusk game scene, a real 3D world rendered as small coloured
ASCII characters on night navy, like the "Making the ASCII MMORPG of my dreams" clips the owner sent.

## The method (always this way)

1. **Build it as a real, detailed 3D scene** in `world/scene3d.ts` (Three.js). Detail lives in the 3D:
   many grass blades, textured stone, real lights. Never hand-type ASCII sprites or draw 2D ASCII art.
2. **Convert it in `world/ascii.ts`**, never by hand. Each character cell takes:
   - **colour** from the scene under it (muted toward grey, brightened just enough to read);
   - **glyph** from brightness through a quiet ramp (`. ' - ~ = + * # @`), or a `/ \ | -` stroke
     where the cell holds a clear edge (a grass blade, a wall edge).
3. **Ease small changes only.** A cell that wobbles a little (grass swaying in place) blends toward the
   new frame (`SETTINGS.ease`), so it fades instead of flickering. A cell whose content really changes
   (`snapLo`/`snapHi`) switches at once. Each cell eases toward **where its patch of ground was last
   frame** (reprojected with the camera), never toward the same screen cell: easing the unmoved history
   smeared and ghosted while walking ("blur… i get a headache", "a little blurry… fuzzy"), and switching
   easing off while moving made the grass shimmer ("flickering… going haywire… i get a headache", 2026-10-19).
4. **Text that must be read** in the world (Zs, hints) is drawn crisp on the overlay canvas in
   small white monospace, game-style. The title card and popups are HTML.

## Rules

- **Calm, never loud.** Slow broad motion: wind is one slow wave across the field, torches glow softly,
  things drift. No fast jitter, no strobing, no flicker. If a change makes the screen feel "busy",
  "finicky" or "loud", it is wrong.
- **No letters in the world.** Letters and digits (`Q Z J $ M W 8`) read as noise when they change.
  Only the quiet ramp and strokes. (Tried and rejected.)
- **Dark navy page** `#0a0d18`, same as the scene's night background and fog. Every cell is drawn.
- **Muted, dusky colour.** Greens for grass, grey-blue stone, warm orange only near torches, deep blue
  water. Brand colours appear only on company logos (M3), and still go through the same conversion.
- **Small characters.** `FONT_PX = 9` (about 260 columns on a laptop). Bigger cells lose the detail.
- **Antialiased render.** The off-screen target is multisampled; thin things must not pop on and off.
- **No name tag** above the figure (removed 2026-10-19 with the title card: the landing must not look like a game).
- **The title card** (landing) is HTML over the scene, styled by the design in
  `docs/superpowers/specs/2026-10-19-title-card-landing-design.md`, not by this file.

## What was tried and rejected (don't repeat)

| Attempt | Owner's verdict |
|---|---|
| Thin black line art on white | "do not like how it looks at all" |
| Procedural 2D ASCII terrain | "looks really poorly done" |
| Light-mode 3D→ASCII (several tunings) | "faint", "too hard to see", "student side project" |
| Tinted cell backgrounds | "not really like it's ASCII" |
| Hand-typed ASCII sprites + shape-matched glyphs | "absolutely horrible… stick figure animations" |
| Coloured glyphs with letters, fast wind, strong flicker | "not clean and smooth… too loud" |
| Easing every cell, also while walking | "blur… looks horrible… i get a headache" |
| Camera snapped to whole-cell steps (terminal-style scrolling) | "horrible, go back. it was way better before" |
| Easing off while anything moves | grass "flickering and going haywire… i get a headache" |
| Reprojected history read between cells (interpolated) | smeared into `====` streaks while walking (caught before shipping) |

## Knobs

- Shader (`ascii.ts` `SETTINGS`): `density` (how fast brightness climbs the ramp), `ink`, `inkFloor`,
  `muted`, `stroke` (edge clarity needed for a line), `ease` (smoothing of small wobbles),
  `snapLo`/`snapHi` (change size that skips easing).
- Scene (`scene3d.ts`): lights (moon, sky fill, torches), grass count/height/colours, wind in the grass
  vertex shader, `CAMERA_OFFSET`, fog.
- When something looks wrong, render the raw 3D target to the screen and look at that first.
