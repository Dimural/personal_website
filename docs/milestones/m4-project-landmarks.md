# M4 — Project landmarks

**Status:** not started

## Goal

Each project is a themed animated ASCII object in the world, with the same proximity popup as M3.

## Scope

- `src/content/projects.ts`: name, award, stack, bullet points, plus the object's art and animation.
- Objects (proposals in `content.md`, owner may change):
  - **Lazarus:** pills and syringes that float in a slow orbit.
  - **Ghost Protocol:** a ghost drifting in a small loop, flickering, holding a padlock.
  - **Projectory:** a tiny IDE window whose "code" lines type themselves out and reset.
- Reuse `objects.ts` and `Popup.tsx` from M3. The popup shows name, award (if any), stack, bullet points.

## Done when

- [ ] `npm run build` passes.
- [ ] All three projects placed, each animating.
- [ ] Each opens its popup on approach.
