# 2026-11-23 — Block Tower level 6 unscored experiments

**Changed:** level 6 (*Reach the star*) no longer counts a miss for a topple or for a full stack short of the star, and the short stack no longer plays the wrong-answer boing; the spoken explanation, the two-trial glowing hint (counted once per task) and level 3–4 misses are unchanged. A level 6 how-to line says so. The `shortlist` tower case now expects 0 misses and 1 hint at level 6.
**Ran:** typecheck; block-tower rule tests and `howto.test.ts` (225 passed); `BROWSER_SUITE=shortlist SHORTLIST_ONLY=tower FROM_LEVEL=6 TO_LEVEL=6` (a topple and a short stack left misses 0 and hints 1, the glowing place, both stars reached, saved score 0 misses 1 hint and the sticker).
**Not run:** build (no shared files or assets), `fingerdemo` (bot unchanged), levels 1–5 and 7 in the browser.
