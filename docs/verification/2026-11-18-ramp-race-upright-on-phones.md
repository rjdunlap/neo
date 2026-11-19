# 2026-11-18 — Ramp Race upright on phones (PR #1822)

**Changed:** Ramp Race plays upright at every level 1–7. Its lane, pad, go and sign placing and `shelfLayout` and `tellLayout` now live in a pure `layout.ts`; sideways positions are unchanged. On the 768-wide area a ramp starts 40 units in and its floor runs to 30 short of the right edge, so a floor mark is about 50 units wide (28 before) and level 5's "before the flag" guess zone is at least 100 wide; the record cards, fair-test sign and claim tiles hang just above the top lane. Incidental fix in both orientations: the floor's touch pad is 100 units tall (was 70) and starts 10 units past the ramp's foot. `upright: true` is set and the registry list holds 60 games.

**Ran:** `npm run typecheck`; `npx vitest run src/games/ramp-race src/games/registry.test.ts` 118 passed in 3 files (the new `upright.test.ts`: every level 1–7, every moment of a round, three upright phone views, the captioned one and a short 375 × 601 one, and sideways unchanged); prettier check and eslint on the game's folder.

**Ran:** `BROWSER_SUITE=uprightgames PHONE_ONLY=ramp-race PHONE_BAND=school PHONE_LEVELS=1,2,3,4,5,6,7 PHONE_SHOTS=1` on a 390 × 844 touch page in headless Chromium: all seven levels finished with one sticker each (9, 6, 10, 6, 10, 8 and 8 touches); upright screenshots of levels 3 to 7 (rolling, guessing, the sign, the cards, the claim tiles) were looked at and nothing overlapped.

**Flake, recorded:** a local full `npm test` on a busy Mac (load average about 10, other sessions running) passed 9,296 tests and failed 8 timing-bound tests in six other games (`fluffy-salon`, `keep-house`, `number-nook`, `penguin-slide`, `secret-code` and one more); rerun alone once, all passed but `secret-code` level 11's "generated quickly", which timed out again under the same load. None touches Ramp Race; CI's run on the PR is the judge.

**Not run:** `npm run build` (CI runs it), the uprightsweep (the per-level layout test is the proof; the game was on the fits-as-is list), `fingerdemo`, the offline suite.
