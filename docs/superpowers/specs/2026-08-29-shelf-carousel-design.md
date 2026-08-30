# Shelf → carousel → reading

Design for the library section, 2026-08-29.

## The problem

The library today is a wall with two bays. Books stand spine-out; clicking one
slides it forward beside an HTML panel that holds the text. The shelf reads
well, but the book is a painted box — it never opens, and there is no way to
move through a bay other than by picking spines out of a row.

We want the shelf to stay, and to become a *container* rather than the whole
experience. Clicking a bay should empty it: the books fly out, arrange
themselves into a scrollable row you can move along, and any one of them can be
picked up and actually read — cover swinging open, pages turning under your
finger. Closing gathers them and puts them back.

## Reference

`https://threeui.com/landing-pages/complete-shelf-v2.html` — the ThreeUI
`CompleteShelfLandingPage`, Three.js r165, the same version this project pins.
Its interaction model is the target, and it is the source for the geometry,
motion constants, and page physics named throughout this document.

Two things about the reference are worth stating plainly, because they shape
everything below:

1. Its "shelf" is not a shelf. It is a **wrapping carousel** — books stand
   cover-forward in a row at `spacing = 1.5`, the centred one scales up and
   leans out, neighbours rotate away and fade past ~2.5 slots. That carousel is
   what our books will fly out *into*.
2. Its book is a **rig**, not a mesh — a hinged front board, a hinged back
   board, six page leaves on their own pivots, and a spine, all under a
   `motion` group that carries idle sway independently of the layout transform.

We adopt the reference's behaviour as-is. Three earlier proposals to depart from
it — a constant room palette, no free orbit, no drag gestures — were considered
and **rejected**; see "Decisions taken" below.

## Modes

One `mode` variable in `scene.ts` drives everything. Three resting states and
four transitions:

```
        click bay ─────────►              click Open ─────────►
  shelf ═══ spreading ═══ browse ═══ opening ═══ reading
        ◄───────── regrouping        ◄───────── closing
```

| Mode | What is on screen |
|---|---|
| `shelf` | Both bays on the wall, books packed spine-out and tight, as today. Bay headers are the click target. Camera holds the whole wall. |
| `spreading` | Timed, 0.92 s. Books leave the carcass one after another and settle into carousel slots. The carcass sinks away. |
| `browse` | The carousel. Wheel, arrow keys and index markers move along it. Counter, title and note track the centred book. |
| `opening` | Timed, 0.92 s. The selected book flies to camera and the panel slides in. |
| `reading` | The book, held large and orbitable. Cover opens; pages turn. Detail panel beside it. |
| `closing` | Reverse of `opening` — the book returns to its carousel slot. |
| `regrouping` | Reverse of `spreading` — books gather and slot back into the bay; the carcass rises. |

`shelf` is a new state the reference does not have; its `hero` is our `browse`,
its `detail` is our `reading`. Everything else is a rename.

### Guards

Every entry point checks `mode` before acting, exactly as the reference does
(`if (mode !== "hero") return;`). Transitions are not interruptible: a click
during `spreading` is ignored. This is the reference's own discipline and it is
what keeps the pose interpolators from being handed a moving target.

## The fly-out

This is the piece the reference does not have, and the piece the whole redesign
turns on. It is built the way its `applyOpeningPose` is built:

On entering `spreading`, for each book in the clicked bay, capture the world
matrix and decompose it into position / quaternion / scale. Compute the
destination — the carousel slot from `snapRigToShelfSlot`, given the bay's book
count and a `position` of 0. Then each frame, `lerpVectors` and
`slerpQuaternions` from captured to destination under `smootherstep`.

**Staggered, near-to-far.** Book *i* of *n* uses its own eased progress:

```
local = clamp((t - i * STAGGER) / (1 - (n - 1) * STAGGER), 0, 1)
```

with `STAGGER = 0.06`. Six books consume 0.30 of the timeline in offsets and
0.70 in travel. They pull out in sequence rather than as a slab. Regrouping
runs the same maths with `STAGGER = 0` — they gather and go home together,
which is what "group back up" should feel like.

**Arc, not slide.** Each book adds `sin(local * π) * 0.28` to its Y and a
matching Z bulge, so it lifts out of the carcass before swinging into line
instead of passing through the shelf boards.

**The carcass sinks.** `shelfStage.position` lerps to `inspectShelfPosition`
`(0, -4.2, -3)` over `smootherstep(t / 0.68)` — cleared before the books have
finished arriving, so it never clips them. The other bay's books fade to zero
opacity over the same window via their `fadeMaterials`.

Reduced motion skips to the final pose in one frame, as everywhere else.

## The rig

`rig.ts`, replacing today's `book.ts`. Per book:

```
root                       layout transform — carousel slot, fly-out pose
└── motion                 idle sway, hover tilt, pointer parallax
    ├── backPivot          at (-w/2, 0, -d/2 - board/2)
    │   └── back board, back plate, back foil, endpaper, turn-ins, groove
    ├── frontPivot         at (-w/2, 0, +d/2 + board/2)   ← swings through -π
    │   └── front board, cover plate, foil plate, endpaper, turn-ins, groove
    ├── pagePivot ×6       at (-w/2 + spineWidth*0.65, 0, restZ + i*0.0015)
    │   └── front sheet + back sheet, PlaneGeometry(1,1,18,8)
    ├── pageBlock          the unturned text block, gutter-compressed
    ├── spine, headbands, ribbon, fore-edge
    ├── hit                invisible box proxy for raycasting
    └── contactShadow      alpha-mapped plane on the board
```

Boards use `RoundedBoxGeometry` (`coverRadius = 0.0045`). Four of the six leaves
are paginated (`PAGINATED_LEAF_COUNT = 4`, so `SPREAD_COUNT = 5`); the back two
are dressing that keeps the block from looking hollow.

Every material carries `transparent: true` and is listed in `fadeMaterials`, so
the carousel's distance fade and the inactive bay's fade both work by walking
one array.

## Page physics

`pages.ts`.

**`updatePaginatedBook(rig, delta, openAmount)`** — the reference function,
unchanged in shape. Front cover damps toward `(-π + 0.055) * openAmount`. Leaf
`k` targets `-0.038 + k*0.008` when unturned and `-π + 0.085 + k*0.014` when
turned, with `position.z` moving between `restZ` and `turnedZ` so turned leaves
stack on the correct side. `openAmount` scales every target, which is what lets
a book be half-open mid-transition without a second code path.

**`updateFlexiblePage(pivot, targetCurve, delta, immediate, targetTwist)`** —
the sheets are not rigid. Each holds `{curve, curveVelocity, twist,
twistVelocity}` integrated as a damped spring (`k = 178`, `c = 19` for curve;
`k = 210`, `c = 21` for twist), then written into the vertex buffer:

```
arch          = sin(π * u)
freeEdgeLift  = u² * 0.16
z = (curve * (arch*0.84 + freeEdgeLift) * (1 + y*0.14)
     + twist * y * u^1.35
     + twist * sin(2πu) * (1 - min(1,|y|*1.65)) * 0.09) * direction
```

followed by `computeVertexNormals()`. Curve peaks at mid-turn via
`sin(π * turnProgress)`, so a page bows as it goes over and flattens as it
lands. An early-out when both curve and twist have settled keeps idle books off
the vertex path entirely.

## Gestures

`gestures.ts`. Two independent pointer state machines, per the reference.

**`pageDrag`** — kind is `cover-open`, `cover-close`, or `page`, decided at
pointerdown by which surface was hit. A drag only registers once horizontal
travel clears 3 px *and* exceeds `|deltaY| * 0.72`, which keeps a vertical page
scroll from tearing a page. Progress is `distance / 140` (cover) or `/ 150`
(page), clamped to 1. `peakProgress` latches `committed` at 0.16 / 0.20 / 0.18
respectively — so a short decisive flick commits, and dragging back does not
un-commit. On release, a committed gesture calls `setReadingOpen` or `turnPage`,
and a page turn gets `applyPageReleaseImpulse` — velocity poured straight into
`curveVelocity` and `twistVelocity` so a fast flick makes the sheet whip.
Pointer capture on the canvas; `controls.enabled = false` for the duration.

**`detailPress`** — separate, because a click on the book must open it while a
drag on the same book must orbit. Records the down point, sets `moved` past
16 px, and only allows the click if pointerup arrived unmoved.

Velocity is smoothed (`lerp(v, instant, 0.42)`) over clamped 8–80 ms frames so
one stuttering frame cannot produce a wild impulse.

## Theme

`theme.ts`. Each volume carries a `palette` — `paper`, `paperDeep`, `paperPale`,
`ink`, `inkSoft`, `wall`, `shelf`, `shelfDark`, `light`, `fill`. Selecting a
book sets both:

- CSS custom properties on `documentElement` (`--paper`, `--ink`, `--accent`
  from the book's foil, and the `theme-color` meta), so the panel and browse UI
  retint with the room;
- `themeTargets` colours, which `updateTheme(delta)` eases at
  `1 - exp(-delta * 5.5)` per frame until the largest squared gap drops below
  `2.5e-6`, then snaps and stops.

The retint covers floor, wall, shelf, shadow, fog, and all eight lights.

**This is a knowing exception to the project's standing "no dark grounds"
rule.** Some volume palettes are near-black, and the section will go dark around
those books. The hero and the page ground stay bone `#ebe6dc` / ultramarine
`#23324f`, so the shift reads as the reading room dimming around a book rather
than as a dark site.

## Content

The page-turn is only worth its cost if the pages carry real text. Each
volume's interior pages are painted from its own data:

Four leaves turn, so eight faces are printed. Faces are numbered in reading
order across the five spreads:

| Face | Content |
|---|---|
| 0 | Title page — discipline, title, note |
| 1 | Chapter 01, with the first `lines[]` entry beneath |
| 2 | Plate — the volume's motif drawn in ink, with `theme` beneath |
| 3 | Chapter 02, with the second `lines[]` entry beneath |
| 4 | Notes — the third `lines[]` entry |
| 5 | Notes continued, or blank when the volume has only three lines |
| 6 | Colophon — `tags` as a list |
| 7 | Imprint — place, dates, subtitle |

The two unpaginated leaves behind them take a blank paper material.

Covers use the reference's **procedural** path — its atlas-absent branch:
cloth ground, edge-shade gradient, 1,250 seeded grain strokes, a double foil
rule, `drawMotif()`, then roman numeral, title and discipline in foil. No image
assets ship; nothing is fetched.

`data.ts` gains per volume: `roman`, `discipline`, `note`, `deck`, `binding`,
`format`, `theme`, `motifKey`, `chapters`, `palette`, `seed`, and `width` /
`height` (it already has `depth`). Existing fields are kept.

## Files

| File | State | Holds |
|---|---|---|
| `data.ts` | extended | Volumes, bays, the new per-volume fields |
| `materials.ts` | grown | Canvas painters: cover, foil, spine, back, endpaper, interior pages, page edges, cloth bump + normal + roughness, emboss, motifs |
| `rig.ts` | new, replaces `book.ts` | `createBookRig` — geometry, materials, pivots |
| `pages.ts` | new | `updatePaginatedBook`, `updateFlexiblePage`, `turnPage`, `setReadingOpen` |
| `gestures.ts` | new | `pageDrag` and `detailPress` machines |
| `theme.ts` | new | `applyBookTheme`, `updateTheme` |
| `room.ts` | reworked | Carcass with two bays on `shelfStage`, floor, wall, lights, wood |
| `scene.ts` | reworked | Mode machine, pose interpolators, carousel layout, raycasting, loop |
| `index.ts` | grown | Browse UI, detail panel, markers, keyboard, live region |
| `library.css` | grown | Browse UI and detail panel, driven by the theme properties |

`scene.ts` is the file most at risk of sprawl. The pose interpolators
(`applySpreadPose`, `applyOpeningPose`, `applyClosingPose`) move to
`poses.ts` if it passes ~450 lines.

## Rendering

`RoomEnvironment` into a PMREM target for `scene.environment`, so the physical
materials have something to reflect — this is what makes the foil read as metal
rather than as a bright colour. `RectAreaLightUniformsLib.init()` for the window
key. `ACESFilmicToneMapping`, `SRGBColorSpace`, PCF soft shadows, pixel ratio
capped at 2. `OrbitControls` enabled only in `reading`, damped, with polar and
distance limits and a "Reset view" button restoring `inspectCameraPosition`.

Frames are on demand — `requestFrame()` schedules one, and the loop keeps
running only while something is still moving (transition, theme, damping,
controls, drag). The `IntersectionObserver` gate that already stops the canvas
when the section scrolls out of view stays.

## Accessibility

The canvas is `aria-hidden`; every affordance has a DOM equivalent. Index
markers are a `tablist`. `←` `→` navigate the carousel, `Enter` opens, `Escape`
closes, `←` `→` turn pages while reading. The detail panel is a modal dialog
with `inert` toggled on the browse UI behind it, focus moved to its close
button, and focus returned to the marker that opened it. A polite live region
announces selection, opening, page turns, and shelving. `prefers-reduced-motion`
collapses every transition to a single-frame settle and disables idle sway,
parallax and dust.

The existing no-WebGL fallback — the full catalog as HTML — stays as the outer
guard, unchanged.

## Verification

No test runner in this project. Verification is compile plus captured evidence:

1. `npx tsc --noEmit` clean.
2. `npx vite build` clean.
3. Headless Chrome via `puppeteer-core` in `/private/tmp`, system Chrome with
   `--use-gl=angle --use-angle=swiftshader`, `domcontentloaded` → `document.fonts.ready`
   → fixed 3 s. Shots at 1440×900, 1280×800, 390×844, `deviceScaleFactor: 2`.
4. One shot per state: `shelf`, mid-`spreading`, `browse`, `browse` after
   scrolling two slots, `reading` closed, `reading` open at spread 2, and back
   at `shelf` — confirming books return to their slots.
5. Keyboard-only pass: tab to a bay, open, navigate, read, turn, escape out.
6. `prefers-reduced-motion: reduce` pass — no transitions, no sway, all states
   still reachable.
7. Console clean of warnings and errors in every pass.

## Decisions taken

- **Books fly out into the reference's carousel** rather than into a grid or a
  vertical stack of spreads. It is the layout the reference actually implements,
  and the one whose motion we get to inherit rather than invent.
- **Drag gestures included.** They are a large share of the reference's
  complexity, and they are also the thing that makes the book feel like an
  object rather than a slideshow.
- **The carcass sinks away during `browse`**, as the reference's shelf does.
  Considered keeping it visible behind the carousel to preserve the metaphor;
  rejected in favour of a clean frame for the books.
- **Per-book room retinting kept**, dark palettes included — see "Theme".
- **Free orbit kept** in `reading`, with Reset view.
- **Covers are procedural**, using the reference's own no-atlas branch. Its
  embedded artwork is for its seven volumes; ours are painted from each
  volume's palette, motif and seed. No new assets, no network dependency.
- **Transitions are not interruptible.** Simpler, and matches the reference.

## Risks

- **`scene.ts` sprawl.** Mitigated by the split above and the `poses.ts`
  escape hatch.
- **First-paint cost.** Six rigs × ~18 canvas textures is real work. Textures
  are generated per volume on demand — a bay's books are built when that bay is
  first opened, not at mount. The existing loading state covers the gap.
- **Vertex deform cost on low-end machines.** Six leaves × 2 sheets × 171
  vertices, but only while turning; the settle early-out keeps idle books off
  that path.
- **The dark-palette exception** is a deliberate override of a standing design
  preference. If it reads badly in the screenshots, the fallback is to lift each
  palette's `paper` and `wall` toward bone while keeping the per-book hue shift.
