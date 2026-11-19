# 2026-11-18 — Sprout Shuffle upright on phones (PR #1820)

**Changed:** Sprout Shuffle plays upright at every level 1–8. Its four scenes' layouts moved into pure functions in `layout.ts`; sideways and iPad-held-upright positions are unchanged. On the 768-wide area levels 1–3 keep all four tray tiles whole, levels 5–6 clear the buttons from level 6's potted tester and the two cards apart, levels 7–8 spread the four buttons so none touch. `upright: true` is set and the registry list now holds 59 games. The sweep had called levels 4–8 fits; the per-level test found real overlaps at 5–8.

**Ran:** `npm run typecheck`; `npx vitest run src/games/sprout-shuffle/` 123 passed (logic 63, the new `upright.test.ts` 60: every level 1–8, every moment of a round, five upright views, sideways and iPad positions pinned). Full `npm test`: 9,239 passed; 8–9 timing-capped tests in other games failed under machine load on both runs (Block Garden, Block Topple, Fluffy Salon, Keep House, Number Nook, Penguin Slide, Secret Code), recorded as load flakes and unrelated; CI runs `npm test` on the PR.

**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=sprout-shuffle PHONE_BAND=school PHONE_LEVELS=1,2,3,4,5,6,7,8` on a 390 × 844 touch page in headless Chromium: all eight levels finished by real touches with one sticker each, twice (levels 1–3 a third time after the centring change); contact sheets of every touch were looked at. New `PHONE_SHOTS=1` keeps a screenshot after every touch (`<id>-<level>-touch<n>.png`).

**Not run:** `npm run build` (CI builds), the uprightsweep (the per-level test replaces it for this game), `fingerdemo` (the bot did not change), the offline suite, sideways browser play (pinned by the unit test).
