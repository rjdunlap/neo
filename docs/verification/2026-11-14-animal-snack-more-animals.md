# 2026-11-14 — Animal Snack more animals (PR #1692)

**Changed:** sheep, horse, hen and mouse added to the shared `critter.ts` and `sfx` and to Animal Snack from level 3; `FIRST_CAST` pins Pet Kitchen, Hat Band, Little Conductor and Lemonade Stand to the original eight; the journal gains four entries.
**Ran:** typecheck; `npm test` (351 files, 7146 passed); `npm run build`; `BROWSER_SUITE=fingerdemo FINGER_ONLY=animal-snack FINGER_LEVELS=1,4,6` passed; a probe screenshot of all eleven animals with their foods; 390x844 portrait screenshots of a count round (sheep, horse, cow) and a kitchen-garden match round (horse, mouse, duck: grain, seeds and oats read apart).
**Not run:** device speech for the four new journal lines (the Kokoro clips were not regenerated); the other games' browser suites (their seeds are unchanged by `FIRST_CAST`).
