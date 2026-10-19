# Title-card landing — design

Date: 2026-10-19. Approved direction from the owner, worked out over mockups
(`.superpowers/brainstorm/`, final screen `landing-touchup-v3.html`).

## Intent

The landing should first read as a **beautiful, quiet personal website**, not a game: the sleeping
dusk scene is scenery behind a title card with the owner's name, a short bio, and their experience and
projects. Only when the visitor presses space does it turn out the scenery is a world they can walk in.
That reveal is the point ("unexpected when you find out you can walk around"). The first view should
make people say "wow"; type must flow with the backdrop.

## Goals

- Landing = the existing sleeping scene (living, moving) + an HTML title card over it.
- Space wakes the figure, the card fades out, the visitor walks (M2 controls, unchanged).
- Walking back to the log and pressing space puts the figure back to sleep and brings the card back.
- More life in the scene: birds and rabbits, in addition to what's there.

## Non-goals

- In-world logos and project objects (M3/M4 stay as planned, after this).
- Phone controls, the no-WebGL fallback, meta tags (M5).
- A phone-specific landing. **Owner's choice: phones behave the same as desktop.** The wake button
  shows and works on touch; until M5 adds touch controls, a woken phone visitor can't walk or go back
  to sleep. Accepted knowingly.
- Expanding list items into full detail on the card. The card is a short summary; full detail comes
  from the in-world popups in M3/M4.

## Anti-goals (fails even if it works)

- The landing looks like a game: game UI, thick boxed buttons, name tags, HUD text.
- Loud or busy motion, anything that breaks [look.md](../../look.md).
- Text hard to read over the grass.

## The title card (HTML, in React)

Matches the approved mockup. Centred over the scene, upper-middle of the screen.

- **Name:** "Dimural Murat", Instrument Serif 400, large (≈7.2% of viewport width on desktop), near-white
  `#f3f5fa`, tight letter-spacing (−0.01em).
- **Bio:** one line under the name, Instrument Serif italic, ≈1.75vw, `#d6dae6`. Placeholder text:
  "builds data systems and AI agents — currently at FinalDose (YC P26) and the University of Toronto".
- A short thin rule (≈5vw wide, 1px, `#7d87a6`) under the bio.
- **Two columns side by side**, IBM Plex Mono 300:
  - Labels "EXPERIENCE" / "PROJECTS": small (≈0.78vw), letter-spacing 0.32em, `#aeb6cc`.
  - Each entry: first line ≈0.95vw `#f3f5fa`, second line ≈0.88vw `#c3c9d9`, ≈1.6vw between entries.
  - **Experience** (left column, ≈34vw): icon slot on the far left (empty square, ≈2vw, for a company
    icon the owner will add later; render nothing visible until an icon exists, but keep the space),
    then line 1 = role, dates right-aligned (`2026 –`, `2026 –`, `2025 – 26`); line 2 =
    company · city. Data from [content.md](../../content.md).
  - **Projects** (right column, ≈30vw): line 1 = name, with "HackPrinceton winner" right-aligned in small
    amber `#f0b56f` for Lazarus; line 2 = one-line description. Placeholders:
    Lazarus "AI agents that rescue failed drug programs", Ghost Protocol "An agent that red-teams fraud
    detection", Projectory "Learn to code by building, in a browser IDE".
- Soft text-shadow in the page navy so text holds over grass.
- **Veil:** a radial darkening behind the card (centre ≈0.7 navy alpha fading to ≈0.05 at the edges) plus
  a soft extra shade behind the two lists. The scenery must stay clearly visible: castle, torches,
  meadow. Builder may additionally soften (slight blur/dim) the scene only behind the lists if lines
  still compete with the grass in motion.
- Fonts from Google Fonts (`Instrument Serif`, `IBM Plex Mono`).
- Real HTML: selectable, read by screen readers. Normal clicks on the card don't wake anything.

### "press space" prompt

Bottom centre: `press [space] to wake up`. **Small and thin, not gamey** (owner: the mockup's version
was "too big and thick"): ≈11–12px mono, light weight, wide letter-spacing, the key in a fine 1px
rounded outline. It **pulses softly** (opacity) and **floats up and down a few pixels** (≈2–3px, slow,
eased), like a website's call-to-action. It is a real `<button>`: clicking/tapping it wakes too.
Under `prefers-reduced-motion` it doesn't move.

## Flow

1. **Asleep (landing).** Card visible, scene moving, Zs over the sleeper. **No "Dimural" name tag**
   above the figure (removed everywhere) and **no small top heading** (removed; the card's name replaces it;
   the card name is the page's `h1`).
2. **Wake: Space** (or the button). Card fades out (~1s), the existing stand-up plays, then walking
   works as in M2. Other keys and clicks no longer wake (they'd fire while reading/selecting text).
   The "WASD or arrow keys to walk" hint then appears as today.
3. **Walking.** Unchanged from M2. Space does nothing away from the log.
4. **Back to sleep.** Once the visitor has walked away from the log (so waking doesn't offer sleep
   straight away, since the figure stands up right beside it) and comes back within ~2.5 units of it, a small overlay hint "press space to sleep"
   appears near the log (game-style overlay text is fine here — the visitor is already in the game).
   Space: walking stops, the figure lies back down on the log (the stand-up played in reverse), Zs
   return, the camera eases back to the intro framing, and the card fades back in. Pressing space on
   the card again wakes, as in step 2.

Camera: the intro framing may be lowered a little so the sleeper isn't hidden behind the lists.

## More life in the scene

Built as 3D in `scene3d.ts` and converted like everything else (look.md). Calm and slow.

- **Birds:** the camera stays as approved (no sky in view), so birds are seen **from above, like from a
  hilltop**: a few small birds gliding over the meadow and castle, occasional slow wing beats, crossing
  and leaving, at intervals so there's usually one somewhere. They must read against grass and stone
  (owner's choice over tilting the camera to show sky).
- **Rabbits:** 3–5 in the meadow. Hop a few times, sit, hop again; stay within the map, avoid
  the pond. When the player walks close, they hop away.
- Existing motion stays: grass wind, torches, pond glints, fireflies, butterflies, breathing, Zs.
- `prefers-reduced-motion`: as today, ambient motion freezes.

## Constraints

- [look.md](../../look.md) for everything in the world. The card and prompt are HTML; they follow
  this document.
- Keep the code layout in [architecture.md](../../architecture.md): world stays in `world/`, React owns
  the page shell. The world tells React whether it's asleep through one callback in `startWorld`
  options (same pattern planned for `onNear`); React tells the world to wake through the returned
  handle or the same options object. No state library.
- Steady 60fps as today.
- Update docs in the same change: README milestone table (this becomes **M2.5 — Title card**, between
  M2 and M3; existing numbers stay, so no renames), look.md
  (no name tag), architecture.md (card, sleep/wake loop, critters), vision.md (landing = title card).

## Left to the builder

Exact fade timings, rabbit/bird models and paths, where the sleep hint sits, file split for the card
(e.g. `src/ui/TitleCard.tsx`), responsive behaviour below ~900px wide (stack the two columns; the card scrolls over the fixed canvas when it's taller than the screen).

## Owner to supply later

Final bio wording and project one-liners (placeholders above until then); company icons.

## Calls made by Claude, not the owner (check these)

- Space is the only wake key; other keys and clicks no longer wake (so reading/selecting text is safe).
- The "press space" prompt is a real button, so clicking/tapping it also wakes.
- Rabbits hop away when the player gets close.
- The sleep hint only appears after the visitor has walked away from the log and come back.
- Milestone naming: M2.5, no renumbering.
- On narrow screens the card stacks and scrolls over the scene.
