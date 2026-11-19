# 2026-11-18 — Rhythm Neighbors upright on phones (PR #1831)

**Changed:** Rhythm Neighbors plays upright at every level 1–9. Its layout moved from the scene into a pure `layout.ts`. Held upright the two frogs sit 330 up from the bottom, the listen-again, help and send buttons sit in one row 95 up (right of the guide), and the bird and then the row of pictured notes are above; the tree levels 7 and 9 put the tree on the left and the big frog on the right. Sideways and an upright tablet keep their pond. `upright: true` is set and the registry list holds 67 games.
**Ran:** `npm run typecheck`; vitest for rhythm-neighbors and the registry, including the new `upright.test.ts` over levels 1–9 and the five upright views (sideways and upright tablet unchanged).
**Ran:** `BROWSER_SUITE=uprightgames` at lap 1 and 7, toddler 2 and 8, preschool 3, 4 and 9, school 5 and 6: all passed, and the screenshots of levels 4 and 7 were looked at. Headless Chrome only.
**Not run:** `npm run build` locally, the full suites, `uprightsweep` (the sweep stops listing a flagged game).
