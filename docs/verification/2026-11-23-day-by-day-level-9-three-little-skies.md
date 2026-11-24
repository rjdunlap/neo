# 2026-11-23 — Day by Day level 9, Three little skies (PR #2073)

**Changed:** Preschool-only entry level 9 (three pictured skies matched with the weather buttons, bands preschool/prek/school, entryLevels [10, 9]), `skies.*` voice lines with three clips, how-to and grown-up wording, logic, layout and registry tests.
**Ran:** `npm run typecheck`; `npm test` (504 files) and a later rerun of src/games and src/content after a how-to wording fix; eslint and prettier on changed files; voice-clip tests; `BROWSER_SUITE=week WEEK_LEVELS=9` (two misses then one hint, three records, no day or week words, history [9, 2, 1], one sticker); `fingerdemo` with `FINGER_ONLY=day-by-day FINGER_LEVELS=9 FINGER_BAND=preschool` (finished in 5.4 s); `uprightgames` with `PHONE_ONLY=day-by-day PHONE_BAND=preschool PHONE_LEVELS=9` (touch phone 390x844, three touches, one sticker, upright screenshot viewed).
**Not run:** `npm run build` (CI builds), offline, other suites.
