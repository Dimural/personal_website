# M5 — Polish and access

**Status:** not started

## Goal

Works for everyone, on every screen, and is fast.

## Scope

- **Touch:** on-screen D-pad (ASCII styled) for phones/tablets; tap to wake.
- **No-game path:** a visually hidden (screen-reader) or toggleable plain list of all experience and
  projects, so the content never depends on playing.
- **Keyboard focus:** popup is reachable and closable by keyboard; canvas has a useful `aria-label`.
- **Performance:** steady 60fps on a mid laptop; only redraw what's on screen; check with DevTools.
- **Meta:** page title, description, favicon (ASCII-ish), social preview image.
- Owner's visual tuning pass: what a visitor sees first, spacing, art refinements.

## Done when

- [ ] `npm run build` passes.
- [ ] Playable on a phone.
- [ ] All content reachable without playing.
- [ ] Lighthouse accessibility ≥ 95.
