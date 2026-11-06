# Verification 2026-11-06 (archived entries)

## 2026-11-06 — Mystery Grid (logic-grid) level 5

- [PR #1301](https://github.com/rjdunlap/neo/pull/1301): level 5 *Who, where and what* (school): two 3 x 3 blocks sharing the friend rows, a different-person clue and a hat clue, kite; an 'apart' step in the rule solver; narrower clue cards and a caption strip; `lg.*` voice lines, how-to card.
- Ran (branch tip `a99772bd` on base `54979a97`; port 5580, Vite dev): `npm run typecheck`; `npm test` (all passed after a how-to length fix; logic-grid and how-to tests 72 passed); `BROWSER_SUITE=logicgrid LOGICGRID_FROM=5` PASS (ruled-out yes 1 miss, Help 1 hint, 1024 x 768 and 768 x 1024 fit with targets at least 96 and clear of the pet, bot to the sticker, 1/1 saved); `BROWSER_SUITE=fingerdemo FINGER_ONLY=logic-grid FINGER_LEVELS=5` PASS (24.1 s). The browser play ran just before the final review fix (caption limited to one clue, how-to wording), which was re-checked by unit tests only.
- Not run: `npm run build` (no shared files or assets), levels 1-4 of the suite (unchanged), the offline check, a real iPad.
- Open: device speech of slotted level-5 lines ([DEVICE-CHECKS](../DEVICE-CHECKS.md#mystery-grid-level-5-2026-11-06)).

## 2026-11-06 — Mystery Grid (logic-grid) level 6

- [PR #1304](https://github.com/rjdunlap/neo/pull/1304): level 6 *This one or that one* (school): one 4 x 4 block with not, either-or and neither-nor clues, a fourth hat, `told()` in the rule solver, `lg.*` voice lines, how-to step; `LOGICGRID_FROM=6`.
- Ran (tested commit `0f0a23ed`, base `e93e08cf`; port 5286, Vite dev): `npm run typecheck`; `npx vitest run src/games/logic-grid src/content src/games/registry` 276 passed (logic-grid 66); `BROWSER_SUITE=logicgrid LOGICGRID_FROM=6` PASS (either-or-ruled-out yes 1 miss, Help 1 hint, 1024 x 768 and 768 x 1024 fit at least 96 units clear of the pet, bot to the sticker, 1/1 saved); `BROWSER_SUITE=fingerdemo FINGER_ONLY=logic-grid FINGER_LEVELS=6` PASS (31.1 s). The review's caption-overlap nit was fixed and re-played.
- Not run: `npm run build` (no shared files or assets), plays of levels 1-5 (logic unchanged, tests guard their boards), the offline check, a real iPad.
- Open: device speech of slotted either/neither clues ([DEVICE-CHECKS](../DEVICE-CHECKS.md#mystery-grid-level-6-2026-11-06)).

## 2026-11-06 — Mystery Grid (logic-grid) level 7

- [PR #1307](https://github.com/rjdunlap/neo/pull/1307): level 7 *Case file* (grown-up): three linked 4 x 4 blocks, written clue list, a 'link' step in the rule solver, `lg.*` voice lines, how-to step; `LOGICGRID_FROM=7`.
- Ran (tested commit `6aed60f0`, base `c03bbc74`; port 5236, Vite dev): `npm run typecheck`; `npm test` (315 files, 5555 tests, 11 new level-7 rule tests, 80 in the game's file); `npm run build`; `BROWSER_SUITE=logicgrid LOGICGRID_FROM=7` PASS (48 cells, one ruled-out yes counted, one Help hint, landscape and portrait fit at least 64 units clear of the pet, bot to the sticker, saved 1 miss 1 hint); `BROWSER_SUITE=fingerdemo FINGER_ONLY=logic-grid` PASS (levels 1 and 7, 10.1 s and 22.3 s). game-reviewer found no defects.
- Not run: level 8, the offline check, a real iPad. Note: landscape needs 1008 units across, so a side safe-area inset would push the clue column off the edge (not reachable at the 1024 minimum view).
- Open: device speech of slotted written clues (person check).

## 2026-11-06 — Mystery Grid (logic-grid) level 8

- [PR #1310](https://github.com/rjdunlap/neo/pull/1310): level 8 *Who came first?* (grown-up): three 5 x 5 blocks, a time row, 'order' and 'pair' solver steps, the sliding window; `LOGICGRID_FROM=8`.
- Ran (tested commit `e7536148`, base `734291c2`; port 5743, Vite dev): `npm run typecheck`; `npm test` (316 files, 5605 tests, 8 new level-8 rule tests); `npm run build`; `BROWSER_SUITE=logicgrid LOGICGRID_FROM=8` PASS (75 squares, 7-9 clues with order and pair, landscape and portrait fit at 64 clear of the pet, a header drag slides, a hidden square takes no mark, one counted miss, one Help hint in view, bot to the sticker, saved 1 miss 1 hint); `BROWSER_SUITE=fingerdemo FINGER_ONLY=logic-grid FINGER_LEVELS=8` clean in 27.2 s. Screenshots `test-results/browser/logicgrid/logic-grid-8-landscape.png` and `-portrait.png`.
- Not run: levels 1-7 browser plays (their code moved cells into a body container and headers into strips at zero offset with no mask; unit tests cover rules), the offline check.
- Open: device speech of the slotted level-8 clues and a real iPad slide (person/device, in [DEVICE-CHECKS](../DEVICE-CHECKS.md#mystery-grid-level-8-2026-11-06)).
