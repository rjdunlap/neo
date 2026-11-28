# 2026-11-27 — Day by Day level 8 Daylight records (PR #2302)

**Changed:** `day-by-day` level 8, two supplied pretend daylight records of five bars (school order now ends 7, 8): `makeDaylight`/`daylightTrue`, the `DaylightRecords` mode, `daylightLayout`, `daylight.` voice lines, how-to card, and a level 8 branch in the `week` suite. The month wheel and registry tests now expect the longer school order.
**Ran:** `npm run typecheck`, `format:check`, `lint`; vitest for `src/games/day-by-day`, `src/content`, `src/games/registry.test.ts` (all pass); `BROWSER_SUITE=week WEEK_LEVELS=8` (free hearing, two wrong confirms with one hint, two questions to a finish, history `[8, 2, 1]`, one screenshot reviewed at 768 × 1024) and `BROWSER_SUITE=fingerdemo FINGER_ONLY=day-by-day FINGER_LEVELS=8`.
**Not run:** full `npm test` (left to PR CI), `npm run build`, offline suite, the upright phone layout in a browser (covered only by `daylight.test.ts` bounds checks), rendered voice clips (device speech).
