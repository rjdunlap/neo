# Verification 2026-11-03 (archived entries)

## 2026-11-03 — Orchard Rows deep dive (docs only)

- [PR #1133](https://github.com/rjdunlap/neo/pull/1133), branch `ccr-73906eb2-r3nm6v`: [dive](../deep-dives/orchard-rows.md). Fresh orchards and baskets queued ([batch](../GAME-BATCHES.md#orchard-rows-2-fresh-orchards-and-baskets)); levels 7–9 *a path through the orchard* (distributive property, the split at ten) queued as a definition. Tracker, READY, batches, backlog, IDEAS, roadmap and the estimation study's E4 pointer updated; the last unstarted game dive.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests, build, browser suites (docs tier, nothing built under `src/`). Open: the batch and the definition.

## 2026-11-03 — Picture Graph fair meadows, a visible first pick and hints that show why (picture-graph batch 1)

- [PR #1138](https://github.com/rjdunlap/neo/pull/1138): fair single-critter placement, the level-4 lift, the taller-bar distractor, why-hints (dashed line and glowing blocks), `bear`, seeded meadows.
- Ran: typecheck; picture-graph rule tests, 19 passed (placement sweep, 4 views by 300 seeds; taller distractor; `sameTap`/`sameHint`; `whyBlocks`; bear; bot same path); `src/content` and registry tests, 190 passed; build; `BROWSER_SUITE=woods WOODS_ONLY=graph FROM_LEVEL=4` levels 4–7 passed on http://localhost:5353 (level 4 double tap free; level 7 taller pick and a second wrong answer, misses/hints 4/2, why-hint screenshot).
- Not run: `fingerdemo` (bot taps unchanged), browser play of levels 1–3, offline.
- Open ([DEVICE-CHECKS](../DEVICE-CHECKS.md)): does the lift read as "picked"; does the dashed line explain "more".

## 2026-11-03 — Picture Logic fresh pictures and named hints (picture-logic batch 1)

- [PR #1139](https://github.com/rjdunlap/neo/pull/1139): eight easier and eight harder 10 by 10 pictures and five 15 by 15, banks split by measured passes; fill/cross hints carry a reason (`done`, `full`, `overlap`, `fits`) with five voice lines (device speech, no clips).
- Ran (code a1e79178 plus review fix 9cc44bf8): typecheck; `npm test` 297 files / 4493 tests passed; picture-logic and content tests 197 passed after the fix (bank sizes, unique drawings, pass split, every named reason holds on its line, a mutation failed the overlap test); one scripted level-2 play on http://localhost:5937 at 1024x768 (one hint gave a `full` reason with its banner line, then to the sticker, 0 misses / 1 hint, no page errors); one portrait 768x1024 level-4 screenshot (longest overlap line fits in two lines above the paper).
- Not run: `fingerdemo` (bot unchanged), build (no assets), couch suites (couch untouched), a registered browser suite (the play was a one-off probe).
- Open: no spoken clips rendered for the new lines; a real device speech check.

## 2026-11-03 — Pond Conga duck-friendly food and a seeded bank (pond-conga batch 1)

- [PR #1140](https://github.com/rjdunlap/neo/pull/1140): each round has a seeded duck food (peas, sweetcorn or oats, `foodArt`) and a reed bank edge from `pondLook` (reads a clone of the RNG, so ponds are unchanged); a course's ponds cycle the food; voice, how-to, couch catalog and Crumb Trail card wording lost bread. No new level.
- Ran (commit 34d448d2): typecheck; `npm test` 4497 passed (pond-conga rule tests: seeded look, pond unchanged by the look, all foods and edges appear, course food cycle); `npm run build`; `BROWSER_SUITE=congatouch` on http://localhost:5609 (levels 1 and 6, a bump, a hint, Start over, a sticker each); portrait 768x1024 screenshots of pea, sweetcorn and oat ponds with reeds on different edges reviewed.
- Not run: `fingerdemo` (bot unchanged), couch suites (couch logic unchanged).
- Open: how the food art reads on an iPad and the TV ([DEVICE-CHECKS](../DEVICE-CHECKS.md)).
