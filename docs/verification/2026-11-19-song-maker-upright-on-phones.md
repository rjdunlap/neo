# 2026-11-19 — Song Maker upright on phones (PR #1872)

**Changed:** Song Maker plays upright at every level (`upright: true`). Its layout was already the pure `songLayout`; upright it returns bars: levels 1–5, 7 and 8 one board across the 768 width, level 6 a small read-only given bar over a full 4-column board for the beats she fills in. New `upright.test.ts` over levels 1–8 and five views passed first time; the real faults were the sideways-only left column (a 6-column board got 99-unit cells, an 8-column board 69).
**Ran:** `npm run typecheck`; eslint; prettier; `npm test` (game-docs regenerated).
**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=song-maker`: school 6, 7; preschool 5, 4; lap 8, 1; toddler 2, all with one sticker. The first run after a Vite start twice said "PHONE_ONLY unknown selection" and passed on retry (recorded as a flake). Headless Chrome only.
**Not run:** build, offline, `world`.
