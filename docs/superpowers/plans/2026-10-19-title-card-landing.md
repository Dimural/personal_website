# Title-card landing (M2.5) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The landing becomes a title card (name, bio, experience, projects) over the living sleeping
scene; space wakes the figure to walk; space at the log puts it back to sleep and the card returns;
birds and rabbits add life.

**Architecture:** React renders the card (HTML) over the two existing canvases. The world tells React
asleep/awake through one `onAsleep` callback passed to `startWorld`; React wakes the world through the
`wake()` on the handle `startWorld` returns. Sleep/wake state lives in `world/index.ts` and is passed to
`scene3d.render` as a `Rest` value. Critters are their own 3D module, `world/critters.ts`.

**Tech Stack:** Vite 5, React 18, TypeScript 5, Three.js 0.165. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-10-19-title-card-landing-design.md` (read it; it holds the exact
sizes and colours). Look rules: `docs/look.md`.

## Global Constraints

- No new npm dependencies. Fonts via Google Fonts `<link>` in `index.html`: Instrument Serif (400, italic) and IBM Plex Mono (300, 400).
- Card colours: name/titles `#f3f5fa`, bio `#d6dae6`, second lines `#c3c9d9`, labels/dates `#aeb6cc`/`#b3bacd`, rule `#7d87a6`, award `#f0b56f`, page navy `#0a0d18`.
- Everything in the world is 3D in Three.js, converted by `ascii.ts`. Never hand-drawn ASCII. Calm, slow motion (look.md).
- No "Dimural" name tag over the figure, no small top heading. The card's name is the page's only `h1`.
- Space is the only wake key; other keys and clicks do not wake.
- `prefers-reduced-motion`: ambient motion frozen (existing `ambient` clock), the prompt does not float or pulse.
- `npm run build` must pass before every commit. Push after every commit. No AI attribution in commits.
- Never commit `Dimural_Murat*.pdf`, never show the phone number.

## Review Focus

1. Space mashed during the stand-up or lie-down: must be ignored until the transition ends, never flip state mid-animation (Task 2 check).
2. Space pressed while the "press space" button has focus: keydown and the button's click both fire; must wake exactly once, not wake-then-sleep (Task 1 check: `wake()` is a no-op unless asleep and settled).
3. Movement keys held when going to sleep: the figure must not slide or keep walking; held keys released (Task 2 check).
4. Waking leaves the figure standing beside the log: "press space to sleep" must not show until the visitor has walked away and come back (Task 2 check).
5. Narrow / short windows: the card must stay readable (columns stack, card scrolls) and the page must not scroll the canvas away (Task 1 check at 390×844).

## Verification harness (used by every task)

There is no test runner in this repo, and none is added. Checks are a Playwright script run against the
dev server, kept **outside the repo** in the session scratchpad (call it `$S`).

- One-time setup: `cd $S && npm init -y && npm i playwright-core@1.48.2`.
- Launch Chrome with `executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"`,
  `headless: false`, `args: ["--window-position=-3000,0"]` (real GPU), viewport 1440×900, dpr 2;
  `goto(url, { waitUntil: "domcontentloaded" })`.
- Dev server: `npx vite --port 5199 --strictPort` in the background; stop with `pkill -f "vite --port 5199"`.
- The card exposes its state as `data-state="asleep" | "awake"` on `<main class="card">`, which the script asserts on.
- Each check is `$S/check-landing.mjs`, grown task by task; it exits non-zero on the first failed `assert`
  and saves screenshots to `$S/`. Look at the screenshots, not just the exit code.

---

### Task 1: Title card, space to wake, no name tag

**Files:**
- Create: `src/content/resume.ts` — typed experience + projects data
- Create: `src/ui/TitleCard.tsx` — the card and the "press space" button
- Modify: `index.html` — Google Fonts link
- Modify: `src/App.tsx` — drop `<h1>`, render `<TitleCard>`, hold `asleep` state
- Modify: `src/index.css` — drop `h1` rules, card + veil + prompt styles
- Modify: `src/world/index.ts` — options + handle, space-only wake
- Modify: `src/world/intro.ts` — remove name tag and the "press any key" hint
- Create: `docs/milestones/m2-5-title-card.md`; Modify: `docs/README.md` (table row "2.5 | Title card | in progress"), `docs/look.md` (name-tag rule → no name tag; card is HTML), `docs/vision.md` (landing = title card), `docs/architecture.md` (folders, "Communicating with React")

**Interfaces:**
- Produces:
  - `src/content/resume.ts`: `export type Job = { role: string; company: string; city: string; dates: string; icon?: string }`, `export type Project = { name: string; award?: string; blurb: string }`, `export const EXPERIENCE: Job[]`, `export const PROJECTS: Project[]`, `export const BIO: string`. Values: spec's placeholders; dates `"2026 –"`, `"2026 –"`, `"2025 – 26"`; roles/companies/cities from `docs/content.md`; Lazarus `award: "HackPrinceton winner"`.
  - `startWorld(worldCanvas, overlayCanvas, opts: { onAsleep: (asleep: boolean) => void }): { wake(): void; stop(): void }`. `onAsleep(true)` is called once at start.
  - `<TitleCard asleep={boolean} onWake={() => void} />`

- [ ] **Step 1: Write the check.** `$S/check-landing.mjs` (Task 1 part): load the page; wait 1s; assert `document.querySelectorAll("h1").length === 1` and its text is `"Dimural Murat"`; assert `.card[data-state="asleep"]`; assert 3 experience entries and 3 project entries are visible text (`EXPERIENCE`, `Software Engineer Intern`, `Lazarus`, `HackPrinceton winner`); press `KeyA` → still asleep; click on the bio text → still asleep; focus the button and press `Space` → after 1.5s `data-state="awake"` and card `opacity` computed `< 0.05`; screenshot `t1-asleep.png` (before) and `t1-awake.png` (after). Then reload at viewport 390×844: screenshot `t1-phone.png`, assert the card's two lists are stacked (experience list's bottom ≤ projects list's top) and `document.scrollingElement.scrollWidth <= 390`.
- [ ] **Step 2: Run it, confirm it fails** (no `.card` element). Run: `node $S/check-landing.mjs` with the dev server up. Expected: assertion error on `.card`.
- [ ] **Step 3: Implement.**
  - `world/index.ts`: state `asleep = true`, `wokeAt: number | null`. Space keydown: `preventDefault()`; if asleep → wake (Task 2 adds the "settled" guard and sleeping). `wake()`: no-op unless `asleep`; sets `wokeAt = now()`, `asleep = false`, `opts.onAsleep(false)`. Remove the `pointerdown` wake listener and the "any key wakes" line. Return `{ wake, stop }`.
  - `intro.ts`: delete the name tag; the hint is only `" WASD or arrow keys to walk "` while awake and not walked (the HTML prompt replaces "press any key"). Zs stay.
  - `App.tsx`: `const [asleep, setAsleep] = useState(true)`; effect creates the world with `{ onAsleep: setAsleep }`, keeps the handle in a ref, cleanup calls `stop()`. Render canvases then `<TitleCard asleep={asleep} onWake={() => handle.current?.wake()} />`. Update the canvas `aria-label` (no "press any key").
  - `TitleCard.tsx`: `<main className="card" data-state=… aria-hidden={!asleep}>` containing the veil `div`, `h1`, bio `p`, rule, two `section`s (`h2` labels) with `ul` lists, icon slot `<span class="icon">` (renders `<img>` only when `icon` is set; empty slot keeps width). Prompt: `<button className="wake" onClick={onWake}>press <kbd>space</kbd> to wake up</button>`, `tabIndex={asleep ? 0 : -1}`.
  - `index.css`: sizes/colours exactly from the spec's "title card" and "press space" sections (vw units for desktop). Card fades with `transition: opacity 1s` and `pointer-events: none` when awake. Veil = two radial gradients (spec values) inside the card so it fades with it. Prompt: ≈11–12px Plex Mono 300, letter-spacing ≈0.25em, `kbd` 1px `#5a6380` rounded outline; `@keyframes` float `translateY(0 → -3px)` ≈3s ease-in-out alternate and opacity pulse ≈0.65↔1; both off under `prefers-reduced-motion`. Below 900px: columns stack, fixed px font sizes (name ≈44px, lists ≈13/12px), card `overflow-y: auto` with the canvases fixed behind.
  - Docs per the Files list; milestone file lists goal, scope (this plan's three tasks), "Done when" checkboxes mirroring the three tasks' checks.
- [ ] **Step 4: Run the check, it passes.** Expected: exit 0. Open the three screenshots: card matches the approved mockup (`.superpowers/brainstorm/*/content/landing-touchup-v3.html`), no name tag above the sleeper, prompt small and thin.
- [ ] **Step 5: Build, commit, push.** `npm run build` passes. `git add -A src index.html docs && git commit -m "Title card over the sleeping scene; space wakes the walker" && git push`

### Task 2: Back to sleep at the log

**Files:**
- Modify: `src/world/player.ts` — `reset()`, `leftLog` tracking, `atLog` getter
- Modify: `src/world/scene3d.ts` — `render` takes a `Rest` instead of `wokeAt`; lie-down; intro framing a little lower
- Modify: `src/world/index.ts` — sleep on space at the log
- Modify: `src/world/intro.ts` — "press space to sleep" hint near the log; Zs only while asleep and settled
- Modify: `docs/architecture.md` (frame steps 2–3, input), milestone file

**Interfaces:**
- Consumes: Task 1's `startWorld` options/handle.
- Produces:
  - `scene3d.ts`: `export type Rest = { asleep: boolean; since: number | null }` (`since` = when the last wake/sleep started; `null` = asleep since load). `render(now: number, t: number, rest: Rest, pose: Pose)`. `export const SLEEP_RADIUS = 2.5`. `headCell` unchanged; add `logCell(cols, rows): { col: number; row: number }` (projects the log's top).
  - `player.ts`: `reset(): void` (pose back to the stand-up spot `x 0, z 2.2`, heading 0, moving 0, held keys cleared, `walked`/`leftLog` false); `get atLog(): boolean` (true when `leftLog` and `hypot(x, z) < SLEEP_RADIUS`; `leftLog` becomes true once `hypot(x, z) > SLEEP_RADIUS + 1`).
  - `drawIntroOverlay(grid, world, now, ambient, rest: Rest, walked: boolean, atLog: boolean)`.

- [ ] **Step 1: Extend the check.** After Task 1's wake: wait 1s; hold `KeyS` 1.2s, release; hold `KeyW` 1.2s, release (back beside the log); screenshot `t2-at-log.png`; mash `Space` 3× within 200ms → after 2s `data-state="asleep"` and card opacity `> 0.95`, screenshot `t2-asleep-again.png`. While asleep hold `KeyD` 1s → screenshot `t2-no-slide.png` (figure still on the log). Press `Space` → awake; immediately press `Space` again (standing beside the log, not yet walked away) → still `awake` after 1.5s.
- [ ] **Step 2: Run it, confirm it fails** at the first "asleep again" assertion.
- [ ] **Step 3: Implement.**
  - `index.ts`: replace `wokeAt` with `rest: Rest`. `settled = rest.since === null || now - rest.since >= WAKE_SECONDS`. Space: ignored unless settled; asleep → `wake()`; awake and `player.atLog` → sleep: `rest = { asleep: true, since: now }`, `player.reset()` after the lie-down completes (hold the pose until then so the lie-down starts where the figure stands), `onAsleep(true)`. `player.update` runs only when awake and settled; on sleep call `player.release()` at once.
  - `scene3d.render`: `up` = awake ? `smoothstep(0, WAKE_SECONDS, now − since)` : `since === null ? 0 : 1 − smoothstep(0, WAKE_SECONDS, now − since)`; the existing interpolation between the log pose and `pose` then plays the stand-up and its reverse. Camera: asleep → intro framing (lower it a little so the sleeper sits below the card's lists; check in `t1-asleep.png`), awake → follow; the existing ease covers both directions.
  - `intro.ts`: Zs when asleep and settled; `!` during the stand-up only; when awake, settled and `atLog`: small `" press space to sleep "` at `logCell` two rows above, same pulse as the walk hint.
- [ ] **Step 4: Run the check, it passes.** Look at `t2-at-log.png` (hint visible over the log), `t2-asleep-again.png` (lying on the log, Zs, card back), `t2-no-slide.png`.
- [ ] **Step 5: Build, commit, push.** `git commit -m "Walk back to the log and press space to sleep; the card returns"`

### Task 3: Birds and rabbits

**Files:**
- Create: `src/world/critters.ts`
- Modify: `src/world/scene3d.ts` — add critters to the scene, update them in `render`
- Modify: `docs/architecture.md` (folders), `docs/vision.md` (motion list), milestone file → done, `docs/README.md` row → done

**Interfaces:**
- Consumes: `blocked(x, z, r)` and `MAP` from `scene3d.ts`; the figure's ground position.
- Produces: `createCritters(scene: THREE.Scene, blocked: (x: number, z: number, r: number) => boolean): { update(t: number, dt: number, player: { x: number; z: number } | null): void }`. `player` is `null` while asleep (no fleeing).

- [ ] **Step 1: Extend the check.** Asleep: take two screenshots of the meadow 1.5s apart → `t3-a.png`, `t3-b.png`. Awake: walk to a rabbit (the script reads `window.__critters?.rabbits` positions, exposed only when `import.meta.env.DEV`) and assert its distance to the figure grows within 1s of getting within 4 units. Log frame times over 5s of walking via rAF deltas; assert median ≤ 17.5ms.
- [ ] **Step 2: Run it, confirm it fails** (`__critters` undefined).
- [ ] **Step 3: Implement.**
  - Birds: 4 small low-poly birds (body + two wing planes, dark grey-blue so they read against grass and stone), gliding in long straight-ish lines 8–14 units up across the map, slow wing beats every few seconds, re-launching from a random edge after leaving; staggered so usually one is on screen.
  - Rabbits: 4 (body, head, ears, pale tail), in the open meadow away from `SPOTS`. State loop: sit 2–5s → 2–4 hops (each ~0.35s, a short arc ≈0.5 up, ≈1.2 forward) → sit. A hop target that `blocked()` rejects turns them around. Within 4 units of the player: hop away (direction away from the player) until 8 units clear.
  - All positions from `t` (ambient clock), so `prefers-reduced-motion` freezes them like the rest.
  - Calm per look.md: nothing fast or flickering; check in the screenshots that the ASCII stays quiet around them.
- [ ] **Step 4: Run the check, it passes.** Look at `t3-a.png`/`t3-b.png`: a bird and rabbits visible as calm shapes. Frame-time median ≤ 17.5ms.
- [ ] **Step 5: Build, commit, push.** Mark M2.5 done in `docs/README.md` and its milestone file. `git commit -m "Birds glide over the meadow; rabbits hop and flee the walker"`
