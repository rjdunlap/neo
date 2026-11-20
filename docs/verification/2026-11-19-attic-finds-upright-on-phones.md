# 2026-11-19 — Attic Finds upright on phones (PR #1891)

**Changed:** Attic Finds plays upright at levels 1–9 (`upright: true`). Upright branches hang levels 1–4 and 7–9 up from the bottom edge, open the magnifier over the object (it sat left of it, off a 768 view), slide level 2's claim row clear of the guide, hang the level 5–6 cart 24 above the bottom, and centre level 8's rows (the third stamp was off a 768 view). Sideways plan pinned by test.
**Ran:** typecheck; eslint on the game; `npm test` (registry list fixed); new per-level `upright.test.ts` (levels 1–9, five views). 
**Ran:** `BROWSER_SUITE=uprightgames` by real touches at school 2, 5, 6, 7, 8, 9, prek 1 and toddler 3, 4, each finishing with a sticker; screenshots of 2, 4, 6, 8, 9 viewed. Headless Chrome only.
**Not run:** build, offline, `fingerdemo`, other suites.
