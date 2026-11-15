# 2026-11-14 — Animal Snack level 6 Who says moo? (PR #1687)

**Changed:** Animal Snack level 6 (mode `sound`, opens pre-K 5–6): a sound question, drag the animal its own snack; a wrong animal or a wrong food is a miss; glow on the animal then its snack. New voice lines `snack.givesound` and `snack.notmine`; the suite's `give` drag helper now passes screen points.
**Ran:** `npm run typecheck`; `npm test` (351 files pass, new rule tests in `logic.test.ts`, the how-to bound in `howto.test.ts`); `BROWSER_SUITE=woods WOODS_ONLY=snack FROM_LEVEL=6 TO_LEVEL=6` passed (wrong-animal and wrong-food drops as misses, glow on the asked animal, 390x844 phone portrait screenshot `animal-snack-6-phone` with snacks at least 132 apart, saved score 2/1 and a sticker); `BROWSER_SUITE=fingerdemo FINGER_ONLY=animal-snack FINGER_LEVELS=6` passed in 11.4 s.
**Not run:** `npm run build` (no shared files or assets changed); other suites.
**Coverage row:** `Animal Snack words and guards (woods, fingerdemo)` in [the summary](../VERIFICATION.md#coverage-summary).
