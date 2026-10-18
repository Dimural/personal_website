# M3 — Experience logos

**Status:** not started

## Goal

Each job is a floating ASCII logo in its real brand colours. Walking close opens a window with the details.

## Scope

- `src/content/experience.ts`: typed data from `docs/content.md` (company full name, title, dates,
  location, bullet points, logo art, logo colours).
- Logo art: ASCII rendition of each real logo, ~12-20 cells wide. Characters coloured per region with
  the brand colours (`grid.put` takes a colour). This is the only colour in the world.
- Logos float (bob up and down a cell or two on a slow sine) in their M2 clearings.
- `world/objects.ts`: each object has a position and a trigger radius. When the player enters the
  radius, call `onNear(id)`; leaving calls `onNear(null)`.
- `src/ui/Popup.tsx`: an HTML window styled as an ASCII box (monospace, `+--+` border look, white fill,
  black text). Shows title, company full name, dates, location, bullet points. Closes when walking away
  or pressing Esc.

## Done when

- [ ] `npm run build` passes.
- [ ] All three companies visible with correct colours.
- [ ] Walking up to each opens its window; walking away closes it.
- [ ] Popup text is real HTML (selectable, read by screen readers).

## Needs from the owner

- Brand colours (and ideally logo images to trace) for FinalDose and Beau Vision AI. UofT navy is assumed
  to be `#1E3765` until confirmed.
