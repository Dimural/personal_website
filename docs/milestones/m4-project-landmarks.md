# M4 — Project landmarks

**Status:** not started

## Goal

Each project is a themed, animated 3D object in the world, with the same proximity popup as M3.

## Scope

- `src/content/projects.ts`: name, award, stack, bullet points.
- Objects are 3D meshes at the three `SPOTS.projects` positions, converted to ASCII like everything else
  ([look.md](../look.md): calm motion, no hand-typed art). Proposals (owner may change):
  - **Lazarus:** pills and syringes floating in a slow orbit.
  - **Ghost Protocol:** a pale ghost drifting in a small loop, holding a padlock.
  - **Projectory:** a small glowing screen/IDE panel with scaffolding blocks stacking up and resetting.
- Reuse `objects.ts` and `Popup.tsx` from M3. The popup shows name, award (if any), stack, bullet points.

## Done when

- [ ] `npm run build` passes.
- [ ] All three projects placed, each animating calmly.
- [ ] Each opens its popup on approach.
