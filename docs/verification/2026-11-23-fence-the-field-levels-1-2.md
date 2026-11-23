# 2026-11-23 — Fence the Field levels 1–2 (PR #2037)

**Changed:** New grown-up game `fence-the-field` in Lantern Lake: dots and boxes against the pet, claiming plots by laying rails. Levels 1–2, plus the `fencethefield` browser suite (`scripts/browser/suites/fence-the-field-play.mjs`, registered in `scripts/browser/registry.mjs`, touch context in `scripts/browser/fixture.mjs`).

**Ran (2026-11-23, this Mac, commit 2b756c0d8):** `npm run typecheck`, `npm run lint`, prettier check on `scripts/browser`, `npm test` (491 files, 18,337 tests passed, 1 skipped), `npm run build` (precache 6,780 entries).

**Ran in Chromium (headless shell, dev server on http://localhost:5637 with `VITE_SPEECH=off`):** `BROWSER_SUITE=fencethefield` passed (1 check) at 390 × 625 with captions via the Lantern Lake page route: level 1 a laid rail tapped (free) and sound rails to the last (0 misses, 0 hints); level 2 a rail that costs a plot laid, answered by the pet and stepped back (one miss), the same rail again (free), Help twice (one hint), rotation to sideways kept the field, count and glow, one sticker per round, return to the same land page. The first run failed only because the suite had no touch context yet (fixture fixed), not a game fault; it passed on the second run. `BROWSER_SUITE=fingerdemo FINGER_ONLY=fence-the-field FINGER_LEVELS=2 FINGER_BAND=grownup` passed (10.7 s). Screenshots looked at (not committed): upright 390 × 625 mid-replay at level 2 and sideways 625 × 390 with the Help glow; the strip text, field, Help button and caption bubble fit without overlap in both.

**Not run:** the offline suite, `world`, any other browser suite.
