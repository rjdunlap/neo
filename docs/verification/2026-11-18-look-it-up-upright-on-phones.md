# 2026-11-18 — Look It Up upright on phones

**Changed:** Look It Up plays upright (`upright: true`). In `guideLayout`'s portrait branch the book moves from y 100 to y 140, so the first row clears Home and the question mark (y 210); the title sits beside them. Sideways keeps its layout. New `upright.test.ts` checks levels 1-3 on three phone views, the captioned view and a short 375 x 601 one: every target whole, apart, in view and clear of Home and the guide.
**Ran:** `npm run typecheck` (only the existing art-lab `three` errors); vitest for `src/games/look-it-up` and `registry.test.ts`.
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=look-it-up PHONE_BAND=school PHONE_LEVELS=3 PHONE_SHOTS=1` at 390 x 844: level 3 completed in 9 touches with a sticker; the screenshot looked at shows the question-mark button over an empty corner of the book's title bar, no text hidden. Headless Chrome only.
**Not run:** build, levels 1 and 2 in a browser, the `uprightsweep` suite, other suites, any real phone.
