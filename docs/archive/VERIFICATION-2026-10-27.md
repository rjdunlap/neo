# Verification 2026-10-27 (archived entries)

## 2026-10-27 — Moon Window levels 1–3 (space slice 2)

- [PR #1004](https://github.com/rjdunlap/neo/pull/1004), branch `claude/moon-window-1-3`, tested commit `6becf05c`, server `http://localhost:5617`: new game in Tinker Lab (now 18), levels 1–3, a Kokoro title clip; Tinker Lab pages at school as 9 and 8.
- Ran: `npm run typecheck`; `npx vitest run src/games/moon-window` 20 tests (model, ellipse area within 2 %, orientation, 500 seeds per level, authored rounds, accounting, layout at landscape/portrait/phone/notch, miss slide spot); full `npm test` 3457 tests after the two Tinker Lab count tests moved to 18 entries / 9+8 pages; `npm run build`.
- `BROWSER_SUITE=moonwindow` passed twice (after the card widening and after review fixes): level 2 wrong slice one miss, same wrong again ignored, Show a hint twice on board 2 one hint, saved 1/1; level 3 authored more, portrait screenshot reviewed (both Moons one size, request card above, pet corner clear), a wrong most-on-less one miss, seeded third, saved 1/0.
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=moon-window FINGER_LEVELS=1,3` passed (level 1 lap 7.1 s, level 3 preschool 2.5 s). A game-reviewer pass found the landscape miss slide covering the other card and a hint during the right-card animation; both fixed.
- Not run: offline check, `world`, iPad, device speech, a child. Open: [DEVICE-CHECKS](../DEVICE-CHECKS.md#moon-window-levels-13-space-slice-2-2026-10-27).

## 2026-10-27 — Sea Lift levels 4–5: How far? and Twin stops (integers IN2)

- [PR #1005](https://github.com/rjdunlap/neo/pull/1005), branch `claude/sea-lift-4-5`, commit `70bddd35`, server `http://localhost:5471`: levels 4 (number cards) and 5 (twin stops) of `sea-lift`; the level-4 card table source-checked (DfE Year 6, CCSS 6.NS.C.6.a/7.c/8, Illustrative Mathematics task 290; [definition](../definitions/sea-lift-4-5.md)).
- Ran: `npm run typecheck`; 21 sea-lift rule tests (500 seeds per level: card distinctness and range, one-side rule, right card in every position, twin round rules, check/hint/supported-finish scripts, `cardLayout` at four views); full `npm test` 3465 passed (265 files); `npm run build`.
- `BROWSER_SUITE=sealift` passed on the final code (levels 1–3 as before; level 4: landing and card-number taps free, one wrong card one miss and dims, Show a hint once, right card sends the lift; level 5: own stop free, wrong stop one miss, twin, dock case; level 4 portrait 768×1024 reviewed). The first run timed out in the unchanged level-1 sticker wait under load; two later runs passed.
- `BROWSER_SUITE=fingerdemo FINGER_ONLY=sea-lift FINGER_LEVELS=4,5` clean (9.7 s, 7.8 s), run before a review fix that only guards level-4 landing taps and two visual tweaks; not rerun. game-reviewer found a level-4 landing read as a card (fixed, suite assertion added).
- Not run: iPad touch, device speech of the new lines, a child's reaction. Open: [DEVICE-CHECKS](../DEVICE-CHECKS.md#sea-lift-levels-45).
