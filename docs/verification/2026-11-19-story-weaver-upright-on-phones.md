# 2026-11-19 — Story Weaver upright on phones (PR #1890)

**Changed:** Story Weaver plays upright at every level (`upright: true`). `uprightLayout` in `logic.ts`: pages in two rows (143+ unit slots), owl right of the second row, words strip, tray and four buttons hung up from the bottom edge; the sideways plan is pinned by test.
**Ran:** typecheck, eslint, prettier; story-weaver unit tests (per-level `upright.test.ts`, levels 1-3 x six views incl. 768 x 1024) and registry test.
**Ran:** `BROWSER_SUITE=uprightgames PHONE_BAND=school PHONE_ONLY=story-weaver PHONE_LEVELS=1,2,3`; levels 1-3 completed with a sticker, screenshots viewed. Headless Chrome only.
**Not run:** build, `fingerdemo`, other suites, a real phone.
