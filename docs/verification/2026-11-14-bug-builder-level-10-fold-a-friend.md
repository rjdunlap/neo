# 2026-11-14 — Bug Builder level 10 Fold a friend (PR #1678)

**Changed:** a new Bug Builder level 10 (plan mode `fold`, `fold.ts`): three finished-bug cards, an unscored prediction, the left wing folds across the line, the true card glows, the pet explains; always 0 misses and 0 hints; pre-K order 4, 5, 8, 9, 6, 7, 10 and school 6, 7, 10; ghost finger taps the true fold.
**Ran:** `npm run typecheck`; bug-builder rule tests (34) plus `src/content` and registry tests; full `src/games` vitest earlier; `BROWSER_SUITE=expansion EXPANSION_ONLY=bug BUG_LEVELS=10` (a wrong prediction then a second tap, fold, saved [0, 0], a sticker) with reviewed 844×390 landscape and 390×844 tall screenshots (Playwright viewports only); `BROWSER_SUITE=fingerdemo FINGER_ONLY=bug-builder FINGER_LEVELS=10 FINGER_BAND=school` passed in 3.9 s.
**Not run:** `npm run build` (no shared files or assets changed; PR CI runs it), other suites, offline.
