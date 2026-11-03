# Verification 2026-11-02 (archived entries)

## 2026-11-02 — Attic Finds levels 7–8 two sources and what can we tell (H5)

- [PR #1116](https://github.com/rjdunlap/neo/pull/1116): `attic-finds` levels 7 *Two sources* and 8 *What can we tell?* (school {2..8, order [2,5,6,7,8]}); new `case.ts` and `cases.ts`.
- Ran (Vite dev on http://localhost:5430, base origin/main bc267ed7, `VITE_SPEECH=off`): typecheck; full `npm test` 294 files / 4294 tests; Attic Finds and content rule tests 224; `BROWSER_SUITE=atticcase` (free read, wrong level-7 Check one miss with both copies back, then right; level 8 Seaside "shows it" twice, glow and one hint, then right; one sticker each) before and after the review fixes; `fingerdemo FINGER_ONLY=attic-finds FINGER_LEVELS=7,8` clean (23.0 s, 22.1 s, speech off, so real-speech timing at level 8 is longer and unmeasured); one portrait level-8 screenshot with stamps pressed.
- `game-reviewer` fixes: slotted-copy hit area under 100 units, the level-8 hint line for can't-tell rows, the unused shows-it/none-shows lines (now spoken), copies rebuilt mid-drag on resize. Left open (minor): a resize during a Check leaves papers at old positions until the animation ends.
- Not run: build (no shared assets changed; CI runs it), offline, device or child checks. Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): papers' pictures without the pet, *Can't tell* understanding, the poster read, device speech.

## 2026-11-02 — Drift Cards level 3 (oceans slice 6, batch drift-cards 2)

- [PR #1119](https://github.com/rjdunlap/neo/pull/1119): level 3 *Find the hidden current* (fogged 2×2 patch, three patch cards, Check, replay); school now 1–3.
- Ran (Vite on http://localhost:5951, `VITE_SPEECH=off`, base origin/main bc267ed7 plus this branch): typecheck; 36 Drift Cards rule tests (12 new, re-run after the review fixes); full `npm test` 4291 passed (before the review fixes); `npm run build`; `BROWSER_SUITE=driftcards` (levels 1–2 unchanged; level 3 in portrait: B a miss, B again free, C second miss and glow, A and replay, saved 2/1); `fingerdemo` `FINGER_LEVELS=3` `drift-cards` (37.4 s); one portrait screenshot reviewed.
- S1 voice check: NOAA "What is a current?" (opened 2026-11-02) supports wind, density and tides but not seasons, so `drift.limits` was reworded. `game-reviewer` fixes: duplicate hand cards and unresized cards on the replay, a stale fog-cell trace, restart forgetting tried patches.
- Not run: offline check, other suites.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md#drift-cards-levels-13-oceans-slice-6-2026-10-31-level-3-built-2026-11-02)): detective work versus trial and error, reading arrows cell by cell, "South-west" in iPad speech.

## 2026-11-02 — Size Parade level 14 The measuring ribbon (size-parade batch 5, slice 10)

- [PR #1118](https://github.com/rjdunlap/neo/pull/1118): school-only level 14 (bank and stump friends, a vertical-only ribbon that snaps within 12 units to the top of a head, then tap the taller); school `order [7, 8, 12, 13, 14, 15]`; ten `size.ribbon*` voice lines; how-to card scoped 14-14.
- Ran (commit 95342fb7, base origin/main bc267ed7, Vite on http://localhost:5526): typecheck; full `npm test` 293 files / 4286 tests (38 Size Parade rule tests incl. 300-seed pair properties, snap, layout at 1024×768, 768×1024, 844×390); `npm run build`; `BROWSER_SUITE=expansion EXPANSION_ONLY=size SIZE_LEVELS=14` (guess, a short pull stays, an 8-unit-off drop snaps, two wrong taps = 2 misses/1 hint, one sticker, portrait screenshot; rerun after the review fix); `BROWSER_SUITE=fingerdemo FINGER_ONLY=size-parade FINGER_LEVELS=14 FINGER_BAND=school` clean in 32.7 s.
- `game-reviewer` fix: a resize during the ribbon's float home left it off its lane (low severity); the browser run was repeated after it.
- Not run: offline check, other suites, iPad, a child's reaction.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): whether she reads the mark against the head and trusts the ribbon over the eye.
