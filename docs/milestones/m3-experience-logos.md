# M3 — Experience logos

**Status:** in progress — logos placed for the owner's review (2026-10-19); popups not started

## Goal

Each job is a floating company logo in its real brand colours. Walking close opens a window with the details.

## Scope

- `src/content/experience.ts`: typed data from `docs/content.md` (company full name, title, dates,
  location, bullet points, brand colours).
- **Logos are 3D objects in the scene, not hand-typed ASCII** ([look.md](../look.md)): each logo's shape
  as a flat extruded mesh (`THREE.ExtrudeGeometry` from the logo's outline, e.g. via `SVGLoader`) in its
  brand colours, lit by the scene, converted by `ascii.ts` like everything else. Brand colours are the one
  place bright colour is allowed; keep them true but let them go through the same muted conversion.
- Logos float at the three `SPOTS.experience` positions (slow bob and gentle turn, calm per look.md),
  a few units up so they read above the grass. A soft glow (a dim point light in the brand colour) helps.
- `world/objects.ts`: each object has a position and a trigger radius. When the player enters the
  radius, call `onNear(id)`; leaving calls `onNear(null)`. Passed in via `startWorld(..., { onNear })`.
- `src/ui/Popup.tsx`: an HTML window in the same palette: night navy `#0a0d18` fill, thin light border,
  small monospace text in the light ink. Shows title, company full name, dates, location, bullet
  points. Closes when walking away or pressing Esc.

## Owner's direction (2026-10-19)

- **Placement:** logos are small (they sit *in* the meadow, never over it), far from the log, in the south
  of the meadow (z > 16), clear of trees and the pond. **None may be visible on the title card screen.**
- **Animals perched on each logo** (the goal): a little group of animals sits on and around each logo,
  partly hiding it. When the walker comes near, they all scatter (like the rabbits flee), revealing the
  logo fully, and the popup opens. Walking away lets them drift back.
- **Logos placed so far** (`world/logos.ts`, images in `public/logos/`): UofT, an unknown crimson sprout,
  FinalDose, CIBC (white chevron kept by keying only the border-connected background), Beau.
  Still unknown: what the sprout belongs to, and the CIBC role/dates/details for its popup.

## Done when

- [ ] `npm run build` passes.
- [ ] All three logos visible and recognisable, in their colours.
- [ ] Walking up to each opens its window; walking away closes it.
- [ ] Popup text is real HTML (selectable, read by screen readers).

## Needs from the owner

- Logo files (SVG ideally, or PNG) and brand colours for FinalDose and Beau Vision AI. UofT navy is
  assumed to be `#1E3765` until confirmed.
