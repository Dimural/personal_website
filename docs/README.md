# Docs — start here

Personal website for Dimural Murat: a small, walkable ASCII world.

Read in this order:

1. [vision.md](vision.md) — what the site is and the rules it must keep.
2. [look.md](look.md) — **how everything must be drawn. Hard rule; the owner approved this look.**
3. [architecture.md](architecture.md) — how the code is laid out and how a frame is drawn.
4. [content.md](content.md) — every company and project that appears in the world, and what represents it.
5. [milestones/](milestones/) — the build, one usable step at a time. Do them in order.

## Milestone status

| # | Milestone | Status |
|---|-----------|--------|
| 1 | [Sleeping intro](milestones/m1-sleeping-intro.md) | done |
| 2 | [Wake and walk](milestones/m2-wake-and-walk.md) | done |
| 2.5 | [Title card](milestones/m2-5-title-card.md) | done |
| 3 | [Experience logos](milestones/m3-experience-logos.md) | not started |
| 4 | [Project landmarks](milestones/m4-project-landmarks.md) | not started |
| 5 | [Polish and access](milestones/m5-polish-and-access.md) | not started |

## Rules for agents working here

- Build one milestone per change. Finish it, update its status above and in its own file, commit, push.
- Each milestone file says what "done" means. Check every item before marking it done.
- Anything visual follows [look.md](look.md). Add to the 3D scene; never hand-draw ASCII.
- Keep docs in sync with code: if you change how something works, change the doc in the same commit.
- Never commit the resume PDF (`Dimural_Murat*.pdf` is gitignored). Never put the phone number on the site.
- No `Co-Authored-By` or other AI attribution in commits.
- Commands: `npm run dev` (local), `npm run build` (typecheck + build, must pass before committing).
