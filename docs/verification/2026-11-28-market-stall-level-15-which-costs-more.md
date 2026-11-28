# 2026-11-28 — Market Stall level 15, Which costs more? (PR #2361)

**Changed:** Market Stall level 15 *Which costs more?* (dive slice 9, second entry): a `more` plan for pre-K placed by `order` [2, 14, 15, 3, 4] (`entryLevels` [14, 15]); two tagged goods with numerals and dots, she taps the dearer; a wrong tap wobbles the tag and lays both prices' dots in two rows on the counter mat; two misses glow the dearer one. The woods shop loop gained a `more` branch.

**Ran:** `npm run typecheck`; `npx vitest run src/games/market-stall src/content` (43 files, 503 tests pass, including the new `more.test.ts`). `BROWSER_SUITE=woods WOODS_ONLY=shop FROM_LEVEL=15` passed (no bell or coins, two misses, dots, glow, saved score [2, 1], one sticker), but only with a temporary local edit of `scripts/browser/registry.mjs` line 1368 from `scene('MapScene')` to `scene('HomeScene')`, reverted and not committed. Known harness issue: since the main-flow change (PR #2336) the start lands on HomeScene, so that suite's startup is broken on main; not fixed here. Phone screenshots at 390x844, device scale 2 (the start, and the dots laid side by side after a wrong tap) are attached to PR #2361 rather than committed.

**Not run:** `npm run build` (no shared files or assets changed), `fingerdemo`, the full `npm test` (left to PR CI).
