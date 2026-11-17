# 2026-11-17 — Who Am I? level 4 Surprises and the bat (PR #1740)

**Changed:** `who-am-i` level 4 (school 2–4): the penguin and the bat in every gallery, three clues with at least one surprise step explained once by the pet; a membrane-wing bat in the shared critter art.
**Ran:** `npm run typecheck`; `npx vitest run src/games/who-am-i` (48 tests, 500 seeds per level, the new level 4 group) plus registry and content tests; `BROWSER_SUITE=whoami` (levels 1, 3 and 4: penguin and bat present, one keeps-tap miss, three clues, each surprise explained once, saved score [1,0]); `BROWSER_SUITE=fingerdemo FINGER_ONLY=who-am-i FINGER_LEVELS=4 FINGER_BAND=school` (17.7 s); `npm run build` (shared art files changed).
**Not run:** full `npm test` locally (CI runs it), `world`, offline and other suites; the Owl Walk and other critter-art suites after the `critter.ts` wing option.
