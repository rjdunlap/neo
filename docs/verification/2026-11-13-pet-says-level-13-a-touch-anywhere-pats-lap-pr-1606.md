# 2026-11-13 — pet-says level 13: a touch anywhere pats (lap, PR #1606)


**Changed:** `pet-says` level 13 (Pat the pet, lap's order only), in place: a touch anywhere in the meadow pats, as a touch on the pet does (the backdrop takes the tap when the plan is `pat`, 250 ms cooldown). A pat during a move still only squishes the pet and is not saved up. The card says "Tap anywhere to pat the pet"; new `coplayHintLap` stops promising a green arrow that level 13 does not have.
**Ran:** `npm run typecheck`; `pet-says` rule tests and registry tests; full `npm test` (351 files, 6816 passed); `GAME_URL=http://localhost:5509 BROWSER_SUITE=shortlist SHORTLIST_ONLY=pat` passed (new filter in `scripts/browser/suites/shortlist-batch.mjs`: level 13 at lap, portrait 768x1024, five pats, two of them on the empty meadow, no arrow, 0 misses and 0 hints, sticker).
**Not run:** `fingerdemo` (the ghost finger still pats the pet, so the demonstrated action is unchanged); `npm run build` (no shared files or assets changed); other suites.
