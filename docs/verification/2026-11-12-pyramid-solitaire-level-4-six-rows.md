# 2026-11-12 — pyramid-solitaire level 4 Six rows (PR #1580)

**Changed:** `pyramid-solitaire` gains level 4, a six-row pyramid of 21 cards from a real pack with a 30–75% dial; the grown-up range is 1–4. Tests cover levels 1–4 in the property tests, the band, a level-4 test (21-bit mask, at most 71 positions over 100 seeds) and a new sideways layout test (1024×768, 844×390, 1366×1024). The `pyramid` suite plays levels 1, 3 and 4 and takes `PYRAMID_LEVELS=4`.
**Ran:** `npm run typecheck`; `npx vitest run src/games/pyramid-solitaire src/games/upright-batch-3.test.ts` (26 tests); `npx vitest run src/games/registry.test.ts src/content` (240 passed, 1 skipped); `BROWSER_SUITE=pyramid PYRAMID_LEVELS=4` (touch, wrong pair, hint, undo, start over, one sticker; portrait 768×1024 and landscape screenshots read); `fingerdemo` at level 4 (`FINGER_BAND=grownup`, finished in 26.4 s).
**Measured:** 300 seeds on a Mac, not a phone: undialled median clear rate 59%, 73% hold a dead end; dialled, every seed in band (median 50%), at most 61 positions, slowest deal 4 ms.
**Not run:** full `npm test` (CI runs it), `npm run build` (no shared file or asset changed).
