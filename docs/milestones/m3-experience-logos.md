# M3 — Experience logos

**Status:** not started

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

## Done when

- [ ] `npm run build` passes.
- [ ] All three logos visible and recognisable, in their colours.
- [ ] Walking up to each opens its window; walking away closes it.
- [ ] Popup text is real HTML (selectable, read by screen readers).

## Needs from the owner

- Logo files (SVG ideally, or PNG) and brand colours for FinalDose and Beau Vision AI. UofT navy is
  assumed to be `#1E3765` until confirmed.
