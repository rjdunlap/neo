# 2026-11-14 — Pet Says ten body words, the chant and richer tricks (PR #1650)

**Changed:** `pet-says` level 2 (ten body words, the chant as its last turn) and level 4 (two or three tricks: a borrowed name, "do this, do that"); rule tests for zone spacing, mitten travel, the chant verses and trick cues; the `says` browser loop honours `TO_LEVEL`.
**Ran:** typecheck; full `npm test` (351 files pass); `BROWSER_SUITE=shortlist SHORTLIST_ONLY=says FROM_LEVEL=2 TO_LEVEL=2` and `FROM_LEVEL=4 TO_LEVEL=4` passed; level 2 at 390×844 portrait with screenshots of held cheeks, shoulders and chin poses (chin reads clearly; shoulders read as hands on the sprout's sides).
**Not run:** `npm run build` (no shared files or assets changed), levels 1, 3 and 5, device speech of the new words.
