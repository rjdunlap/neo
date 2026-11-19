# 2026-11-19 — Inchworm upright on phones (PR #1868)

**Changed:** Inchworm Measure plays upright at every level (`upright: true`). Its layout is pulled into a pure `layout.ts` (unit, x0For, rowY, padHome, bucketHome, hopHit); ruler levels use a 68 unit and the long ruler (level 10) 56 so they fit 768, the answer pads rest in a row up from the bottom edge with the worm bucket above them and the rows hanging from the controls, worm tap areas are 100 tall, and rows' y is now recomputed on resize. New per-level upright test over levels 1–10, six seeds and five views.
**Ran:** `npm run typecheck`; vitest for `src/games/inchworm` and `registry.test.ts` (382 passed); prettier and eslint clean.
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=inchworm PHONE_BAND=school PHONE_LEVELS=1..10 PHONE_SHOTS=1` passed all 10 levels; screenshots viewed for levels 3, 5, 7 and 10 (the upper part of a tall phone is empty sky by design). Headless Chrome only.
**Not run:** build, full browser suites, offline, real device.
