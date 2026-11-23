# 2026-11-23 — Truth Bridge levels 1–2 (PR #2026)

**Changed:** New grown-up game `truth-bridge` in Lantern Lake (Puzzle Peaks, logic): mark who speaks straight and who is Topsy from what the islanders say, then Cross. Levels 1–2, with 301 new generated voice clips.

**Ran (2026-11-22/23, this Mac):** typecheck, format check, lint, `npm test` (485 files, all passing), including the rule tests: pool counts (28 valid two-islander boards, 26, 16 flat, 10 chained; 1,191 chained three-islander and 40 flat left out), unique solutions, the fit rule per sentence kind, Cross verdicts over every mark state, the hint walk from every partial marking, one miss per distinct wrong answer, voice coverage, upright layout at six views with 2 and 3 islanders, bubble text within three lines, registry, lands and paging. `npm run build` (precache 6,311 entries).

**Ran in Chromium (headless):** `BROWSER_SUITE=truthbridge` at 390 × 625 with captions via Lantern Lake's later page: blank Cross free, both level 1 boards to one sticker with 0 misses and 0 hints; at level 2 a wrong Cross counted once, the same marks again free, Help twice counted once, rotation kept the board, marks and hint, finished with 1 miss, 1 hint and one sticker, and returned to the same land page. Upright and sideways screenshots looked at. `BROWSER_SUITE=fingerdemo FINGER_ONLY=truth-bridge FINGER_LEVELS=2 FINGER_BAND=grownup` passed in 10.2 s.

**Not run:** the offline suite, the `world` suite, the other browser suites, `fingerdemo` at level 1.
