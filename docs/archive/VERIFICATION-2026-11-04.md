# Verification 2026-11-04 (archived entries)

## 2026-11-04 — Island Bridges school opening definition (docs only)

- [PR #1196](https://github.com/rjdunlap/neo/pull/1196): [definition](../definitions/island-bridges-school-opening.md) for `school` playing levels 5 then 1 at 100-unit cells; the batch `island-bridges 5`; the dive's slice 5 marked defined.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests and every play check (no code changed). Open: the build (new entry with a layout change) and the definition's person checks (a nine-to-twelve-year-old on the 5 by 5 sea, the named hint lines, cell and button fit on an iPad), added to [DEVICE-CHECKS](../DEVICE-CHECKS.md) when built.

## 2026-11-04 — Lantern Lights school opening definition (docs only)

- [PR #1197](https://github.com/rjdunlap/neo/pull/1197): [definition](../definitions/lantern-lights-school-opening.md) for `school` playing levels 1 and 2 at 3 by 3; the batch `lantern-lights 4`; the dive's slice 4 marked defined.
- Ran: `node scripts/check-links.mjs` and `git diff --check`.
- Not run: typecheck, tests and every play check (no code changed). Open: the build (new band entry, no layout change) and the definition's person checks (a seven-year-old on level 1, the nudge timing, whether level 2 is a fair top), added to [DEVICE-CHECKS](../DEVICE-CHECKS.md) when built.

## 2026-11-04 — Inchworm level 10 Longer than the ruler (inchworm batch 3)

- [PR #1198](https://github.com/rjdunlap/neo/pull/1198), head `6de1c56e`: level 10 (mode `slide`, school only), the `worm` how-to step, five voice lines, the bot drag-drag-tap.
- Ran (Vite dev http://localhost:5983, `VITE_SPEECH=off`): typecheck; full `npm test` 300 files, 4,766 tests; `BROWSER_SUITE=woods WOODS_ONLY=worm FROM_LEVEL=10 TO_LEVEL=10` in portrait 768x1024 PASS (stray drop no lay and no miss, lay at 0 with chalk, lay at the mark, second-part pad one miss, other wrong pad two misses and a hint with both parts and the mark lit, answers, sticker; screenshots inchworm-10-chalk and inchworm-10-hint); `BROWSER_SUITE=fingerdemo FINGER_ONLY=inchworm FINGER_LEVELS=10` clean 6.2 s. The first browser run caught a page error after the last round (`placeSlider` read a missing measure), fixed with a guard before commit. `game-reviewer`: no findings.
- Not run: build (no shared files or assets), landscape, offline, iPad or child. Open: [DEVICE-CHECKS](../DEVICE-CHECKS.md) level 10 entry.
